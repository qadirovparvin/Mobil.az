'use strict';

const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { connectTestDB, disconnectTestDB } = require('./setupTestDB');
const User = require('../models/User');
const { loginLimiter, isRequestFromAdmin } = require('../middlewares/rateLimiter');
const { login } = require('../controllers/authController');

async function runTests() {
    console.log('\n=== TEST SUITE: Admin Login Lockout Exemption & Rate Limit Bypass ===\n');
    await connectTestDB();
    await User.init();

    // 1. Create a regular user and an admin user
    const userPasswordHash = await bcrypt.hash('NormalUserPass123!@#', 10);
    const adminPasswordHash = await bcrypt.hash('AdminSecret123!@#', 10);

    const normalUser = await User.create({
        name: 'Normal',
        lastName: 'User',
        email: 'test_normal_lockout@example.com',
        password: userPasswordHash,
        role: 'user',
        status: 'active',
        isVerified: true
    });

    const adminUser = await User.create({
        name: 'Admin',
        lastName: 'Super',
        email: 'test_admin_lockout@example.com',
        password: adminPasswordHash,
        role: 'admin',
        status: 'active',
        isVerified: true
    });

    console.log('--- TEST 1: isRequestFromAdmin correctly identifies admin vs normal user ---');
    const reqAdmin = {
        body: { email: 'test_admin_lockout@example.com' },
        headers: {},
        ip: '192.168.1.50'
    };
    const reqUser = {
        body: { email: 'test_normal_lockout@example.com' },
        headers: {},
        ip: '192.168.1.51'
    };

    const isAdminResult = await isRequestFromAdmin(reqAdmin);
    const isUserResult = await isRequestFromAdmin(reqUser);

    assert.strictEqual(isAdminResult, true, 'Admin request must be identified as admin');
    assert.strictEqual(isUserResult, false, 'Normal user request must NOT be identified as admin');
    console.log('✔ TEST 1 passed: isRequestFromAdmin correctly distinguishes admin from normal user!\n');

    console.log('--- TEST 2: Normal user gets locked out after 5 consecutive failed logins ---');
    for (let i = 1; i <= 5; i++) {
        let statusCode = null;
        let responseBody = null;
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (body) => { responseBody = body; return res; },
            setHeader: () => {}
        };
        const req = {
            body: { email: 'test_normal_lockout@example.com', password: 'WrongPassword123!' },
            headers: {},
            ip: '10.10.10.10'
        };

        await login(req, res, () => {});

        if (i < 5) {
            assert.strictEqual(statusCode, 401, `Attempt ${i} for normal user must return 401`);
        } else {
            assert.strictEqual(statusCode, 423, `Attempt 5 for normal user must lock account with 423`);
            assert.ok(responseBody.message.includes('kilidləndi') || responseBody.message.includes('dəqiqə sonra'), 'Message must indicate lock');
            console.log(`Normal user attempt 5 returned expected 423 lock: "${responseBody.message}"`);
        }
    }
    console.log('✔ TEST 2 passed: Normal user is correctly locked out after 5 failed attempts!\n');

    console.log('--- TEST 3: Admin enters wrong password 10 times — NEVER locked with 423 or 429 ---');
    for (let i = 1; i <= 10; i++) {
        let statusCode = null;
        let responseBody = null;
        const res = {
            status: (code) => { statusCode = code; return res; },
            json: (body) => { responseBody = body; return res; },
            setHeader: () => {}
        };
        const req = {
            body: { email: 'test_admin_lockout@example.com', password: 'WrongAdminPassword123!' },
            headers: {},
            ip: '10.20.30.40'
        };

        // Pass through loginLimiter first
        let limiterNextCalled = false;
        await loginLimiter(req, res, () => { limiterNextCalled = true; });
        assert.strictEqual(limiterNextCalled, true, `loginLimiter must bypass rate limit for admin on attempt ${i}`);

        // Call login controller
        await login(req, res, () => {});

        assert.strictEqual(statusCode, 401, `Admin attempt ${i} must return 401, NEVER 423 or 429`);
        assert.strictEqual(responseBody.message, 'Daxil edilən məlumatlar və ya şifrə yanlışdır');
    }

    // Verify admin DB record has no lockUntil
    const refreshedAdmin = await User.findById(adminUser._id);
    assert.strictEqual(refreshedAdmin.lockUntil, null, 'Admin lockUntil must remain null in DB');
    console.log(`Admin loginAttempts count in DB: ${refreshedAdmin.loginAttempts}, lockUntil: ${refreshedAdmin.lockUntil}`);
    console.log('✔ TEST 3 passed: Admin failed 10 times without 423 or 429 lockout!\n');

    console.log('--- TEST 4: Admin enters correct password after failures — logs in successfully (200 OK) ---');
    let finalStatus = null;
    let finalBody = null;
    const resFinal = {
        status: (code) => { finalStatus = code; return resFinal; },
        json: (body) => { finalBody = body; return resFinal; },
        cookie: () => {},
        setHeader: () => {}
    };
    const reqFinal = {
        body: { email: 'test_admin_lockout@example.com', password: 'AdminSecret123!@#' },
        headers: {},
        ip: '10.20.30.40',
        get: (h) => reqFinal.headers[h.toLowerCase()] || ''
    };

    await loginLimiter(reqFinal, resFinal, () => {});
    await login(reqFinal, resFinal, () => {});

    assert.ok(finalBody && (finalBody.token || finalBody.accessToken), 'Admin must receive token');
    assert.strictEqual(finalBody.role, 'admin', 'Returned role must be admin');
    console.log('✔ TEST 4 passed: Admin logged in immediately with correct password!\n');

    console.log('🎉 ALL ADMIN LOCKOUT EXEMPTION TESTS PASSED 100%! 🚀\n');
    await disconnectTestDB();
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
