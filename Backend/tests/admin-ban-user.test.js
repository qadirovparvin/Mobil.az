require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');

const User = require('../models/User');
const { generateAccessToken } = require('../utils/authSecurity');

function makeHttpRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(body);
                } catch (e) {
                    parsed = body;
                }
                resolve({ status: res.statusCode, headers: res.headers, body: parsed });
            });
        });
        req.on('error', reject);
        if (postData) {
            req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
        }
        req.end();
    });
}

async function runTests() {
    console.log('=== ADMIN BAN / UNBAN UI & API TESTS ===');

    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI);
    }

    const adminUser = await User.findOne({ role: 'admin' });
    assert(adminUser, 'Admin user must exist');
    const adminToken = generateAccessToken(adminUser);

    // Find or create a non-admin test user
    let testUser = await User.findOne({ role: 'user', email: { $ne: null } });
    if (!testUser) {
        testUser = await User.create({
            name: 'BanTest',
            lastName: 'User',
            email: `bantest_${Date.now()}@example.com`,
            password: 'Password123!',
            role: 'user',
            status: 'active'
        });
    }

    // ── GET CSRF Token ────────────────────────────────────────────────
    const csrfRes = await makeHttpRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/csrf-token',
        method: 'GET',
        headers: {
            'Origin': 'http://127.0.0.1:5500'
        }
    });
    const csrfToken = csrfRes.body?.csrfToken;
    const cookieHeader = csrfRes.headers['set-cookie']
        ? (Array.isArray(csrfRes.headers['set-cookie']) ? csrfRes.headers['set-cookie'].join('; ') : csrfRes.headers['set-cookie'])
        : '';

    // ── TEST 1: Ban user via PUT /api/admin/users/:id/ban ───────────────
    console.log('--- TEST 1: Ban user via PUT /api/admin/users/:id/ban ---');
    const banRes = await makeHttpRequest({
        hostname: 'localhost',
        port: 5000,
        path: `/api/admin/users/${testUser._id}/ban`,
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'http://127.0.0.1:5500',
            'Cookie': cookieHeader,
            'x-csrf-token': csrfToken
        }
    }, { status: 'banned' });

    assert.strictEqual(banRes.status, 200, `Expected 200 on ban, got ${banRes.status}: ${JSON.stringify(banRes.body)}`);
    assert.strictEqual(banRes.body.data.status, 'banned', 'User status should be banned in response');

    const dbUserBanned = await User.findById(testUser._id);
    assert.strictEqual(dbUserBanned.status, 'banned', 'User status in DB must be banned');
    console.log('✓ TEST 1 passed: User banned successfully via PUT /api/admin/users/:id/ban');

    // ── TEST 2: Unban user via PUT /api/admin/users/:id/ban ─────────────
    console.log('--- TEST 2: Unban user via PUT /api/admin/users/:id/ban ---');
    const unbanRes = await makeHttpRequest({
        hostname: 'localhost',
        port: 5000,
        path: `/api/admin/users/${testUser._id}/ban`,
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'http://127.0.0.1:5500',
            'Cookie': cookieHeader,
            'x-csrf-token': csrfToken
        }
    }, { status: 'active' });

    assert.strictEqual(unbanRes.status, 200, `Expected 200 on unban, got ${unbanRes.status}`);
    assert.strictEqual(unbanRes.body.data.status, 'active', 'User status should be active in response');

    const dbUserUnbanned = await User.findById(testUser._id);
    assert.strictEqual(dbUserUnbanned.status, 'active', 'User status in DB must be active');
    console.log('✓ TEST 2 passed: User unbanned successfully');

    // ── TEST 3: Frontend admin.js verification ─────────────────────────
    console.log('--- TEST 3: Frontend admin.js banUser, unbanUser & badge-danger ---');
    const adminJs = fs.readFileSync(path.join(__dirname, '..', '..', 'Front end', 'JS', 'admin.js'), 'utf8');

    assert(adminJs.includes('banUser'), 'admin.js must define banUser');
    assert(adminJs.includes('unbanUser'), 'admin.js must define unbanUser');
    assert(adminJs.includes('badge-danger'), 'admin.js must use badge-danger for banned user');
    assert(adminJs.includes('btn-danger'), 'admin.js must use btn-danger for ban button');
    assert(adminJs.includes('btn-success'), 'admin.js must use btn-success for unban button');
    assert(adminJs.includes('<span class="badge badge-danger">Ban</span>'), 'admin.js must render <span class="badge badge-danger">Ban</span>');
    console.log('✓ TEST 3 passed: admin.js has banUser, unbanUser, red Ban badge and buttons');

    // ── TEST 4: Frontend CSS verification ──────────────────────────────
    console.log('--- TEST 4: Frontend admin.css button and badge styles ---');
    const adminCss = fs.readFileSync(path.join(__dirname, '..', '..', 'Front end', 'CSS', 'admin.css'), 'utf8');

    assert(adminCss.includes('.badge-danger'), 'admin.css must contain .badge-danger');
    assert(adminCss.includes('.btn-danger'), 'admin.css must contain .btn-danger');
    assert(adminCss.includes('.btn-success'), 'admin.css must contain .btn-success');
    assert(adminCss.includes('.btn-sm'), 'admin.css must contain .btn-sm');
    console.log('✓ TEST 4 passed: admin.css contains .badge-danger, .btn-danger, .btn-success, .btn-sm');

    console.log('=== ALL ADMIN BAN / UNBAN TESTS PASSED 100%! ===');
    process.exit(0);
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
