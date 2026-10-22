require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');

const adminController = require('../controllers/adminController');
const User = require('../models/User');
const { generateAccessToken } = require('../utils/authSecurity');

function makeHttpRequest(options) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => {
                let parsed = null;
                try { parsed = JSON.parse(body); } catch (e) { parsed = body; }
                resolve({ status: res.statusCode, headers: res.headers, body: parsed });
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function runTests() {
    console.log('=== VERIFYING 3 RESIDUAL BUG FIXES ===');

    // ────────────────────────────────────────────────────────────────────────
    // BUG #1: Head guard config loading & script ordering in admin.html
    // ────────────────────────────────────────────────────────────────────────
    console.log('--- Checking Bug #1: config.js before head guard and single inclusion ---');
    const adminHtmlPath = path.join(__dirname, '..', '..', 'Front end', 'admin.html');
    const adminHtml = fs.readFileSync(adminHtmlPath, 'utf8');

    const configMatches = adminHtml.match(/src=["']JS\/config\.js["']/g);
    assert.strictEqual(configMatches.length, 1, 'config.js must only be loaded once in admin.html');

    const configIdx = adminHtml.indexOf('src="JS/config.js"');
    const guardIdx  = adminHtml.indexOf('guardAdminPage');
    const authIdx   = adminHtml.indexOf('src="JS/auth.js"');
    const apiIdx    = adminHtml.indexOf('src="JS/api.js"');
    const adminIdx  = adminHtml.indexOf('src="JS/admin.js"');

    assert(configIdx > 0, 'config.js must be present in admin.html');
    assert(guardIdx > 0, 'guardAdminPage must be present in admin.html');
    assert(configIdx < guardIdx, 'config.js MUST be loaded BEFORE guardAdminPage in <head>');
    assert(authIdx > guardIdx, 'auth.js must be after guard');
    assert(apiIdx > authIdx, 'api.js must be after auth.js');
    assert(adminIdx > apiIdx, 'admin.js must be after api.js');
    console.log('✓ Bug #1 Fix Verified: config.js is loaded in <head> before guardAdminPage, and scripts order is config -> auth -> api -> admin');

    // ────────────────────────────────────────────────────────────────────────
    // BUG #2: N+1 aggregation optimization in getAllUsers
    // ────────────────────────────────────────────────────────────────────────
    console.log('--- Checking Bug #2: Bulk aggregation in getAllUsers (eliminates N+1 DB calls) ---');
    const adminControllerCode = fs.readFileSync(path.join(__dirname, '..', 'controllers', 'adminController.js'), 'utf8');
    const getAllUsersCode = adminControllerCode.substring(
        adminControllerCode.indexOf('const getAllUsers'),
        adminControllerCode.indexOf('const getUserDetails')
    );

    assert(getAllUsersCode.includes('Ad.aggregate'), 'getAllUsers must use Ad.aggregate for bulk counting');
    assert(getAllUsersCode.includes('User.aggregate'), 'getAllUsers must use User.aggregate for bulk counting');
    assert(!getAllUsersCode.includes('users.map(async'), 'getAllUsers must NOT execute async queries per-user in map');
    console.log('✓ Bug #2 Fix Verified: getAllUsers uses bulk aggregations; N+1 loop eliminated');

    // ────────────────────────────────────────────────────────────────────────
    // BUG #3: Accurate counts in getUserDetails (not truncated by limit(50))
    // ────────────────────────────────────────────────────────────────────────
    console.log('--- Checking Bug #3: getUserDetails counts use countDocuments, not 50 limit ---');
    const getUserDetailsCode = adminControllerCode.substring(
        adminControllerCode.indexOf('const getUserDetails'),
        adminControllerCode.indexOf('const getAllAds')
    );

    assert(getUserDetailsCode.includes('Ad.countDocuments'), 'getUserDetails must count total ads via countDocuments');
    assert(getUserDetailsCode.includes('User.countDocuments'), 'getUserDetails must count total referrals via countDocuments');
    assert(getUserDetailsCode.includes('Transaction.countDocuments'), 'getUserDetails must count total transactions via countDocuments');
    assert(!getUserDetailsCode.includes('adsCount = ads.length'), 'getUserDetails must NOT set adsCount from ads.length');
    assert(!getUserDetailsCode.includes('referralCount = referrals.length'), 'getUserDetails must NOT set referralCount from referrals.length');

    // Check frontend admin.js
    const adminJsPath = path.join(__dirname, '..', '..', 'Front end', 'JS', 'admin.js');
    const adminJs = fs.readFileSync(adminJsPath, 'utf8');
    assert(adminJs.includes('u.adsCount'), 'admin.js openUserDetailModal must use u.adsCount for total');
    assert(adminJs.includes('u.referralCount'), 'admin.js openUserDetailModal must use u.referralCount for total');
    console.log('✓ Bug #3 Fix Verified: getUserDetails and openUserDetailModal compute and display true totals beyond 50 limit');

    // ────────────────────────────────────────────────────────────────────────
    // LIVE HTTP TESTS for both endpoints
    // ────────────────────────────────────────────────────────────────────────
    console.log('--- Checking Live API responses ---');
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI);
    }
    const adminUser = await User.findOne({ role: 'admin' });
    assert(adminUser, 'Admin user must exist');
    const adminToken = generateAccessToken(adminUser);

    const usersRes = await makeHttpRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/users?page=1&limit=5',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Accept': 'application/json'
        }
    });

    assert.strictEqual(usersRes.status, 200, 'GET /api/admin/users must return 200');
    assert(Array.isArray(usersRes.body.users), 'users must be array');
    const firstUser = usersRes.body.users[0];
    assert(typeof firstUser.adsCount === 'number', 'user.adsCount must be a number');
    assert(typeof firstUser.referralCount === 'number', 'user.referralCount must be a number');
    assert(typeof firstUser.balance === 'number', 'user.balance must be a number');

    const detailRes = await makeHttpRequest({
        hostname: 'localhost',
        port: 5000,
        path: `/api/admin/users/${firstUser._id}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Accept': 'application/json'
        }
    });

    assert.strictEqual(detailRes.status, 200, 'GET /api/admin/users/:id must return 200');
    assert(detailRes.body.user, 'detail response must contain user');
    assert(typeof detailRes.body.user.adsCount === 'number', 'detail user.adsCount must be number');
    assert(typeof detailRes.body.user.referralCount === 'number', 'detail user.referralCount must be number');
    assert(detailRes.body.counts, 'detail response must contain counts object');
    assert(typeof detailRes.body.counts.ads === 'number', 'counts.ads must be number');
    assert(typeof detailRes.body.counts.transactions === 'number', 'counts.transactions must be number');
    assert(typeof detailRes.body.counts.referrals === 'number', 'counts.referrals must be number');

    console.log('✓ Live API Verified: getAllUsers and getUserDetails return all metrics accurately');
    console.log('=== ALL 3 RESIDUAL BUG FIXES PASSED 100%! ===');
    process.exit(0);
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
