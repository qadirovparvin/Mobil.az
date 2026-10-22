require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');

const adminController = require('../controllers/adminController');
const User = require('../models/User');
const { generateAccessToken } = require('../utils/authSecurity');

function createMockRes() {
    const obj = {
        statusCode: 200,
        payload: null,
        status(code) {
            obj.statusCode = code;
            return obj;
        },
        json(data) {
            obj.payload = data;
            return obj;
        }
    };
    return obj;
}

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
        if (postData) req.write(postData);
        req.end();
    });
}

async function runTests() {
    console.log('=== ADMIN USER METRICS & MODAL TESTS ===');

    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI);
    }

    // ── TEST 1: Direct Controller Unit Test ─────────────────────────────
    console.log('--- TEST 1: Direct controller execution for getAllUsers metrics ---');
    const mockReq = { query: { page: 1, limit: 5 } };
    const mockRes = createMockRes();
    await adminController.getAllUsers(mockReq, mockRes, (err) => { if (err) throw err; });

    assert.strictEqual(mockRes.statusCode, 200, 'getAllUsers should return 200');
    assert(Array.isArray(mockRes.payload.users), 'users array must be returned');
    assert(mockRes.payload.users.length > 0, 'At least 1 user must exist');

    mockRes.payload.users.forEach((u, i) => {
        assert(typeof u.adsCount === 'number', `User [${i}] must have adsCount as number`);
        assert(typeof u.balance === 'number', `User [${i}] must have balance as number`);
        assert(typeof u.referralCount === 'number', `User [${i}] must have referralCount as number`);
    });
    console.log(`✓ TEST 1 passed: ${mockRes.payload.users.length} users verified with adsCount, balance, referralCount`);

    // ── TEST 2: Live HTTP API /api/admin/users?page=1&limit=5 ───────────
    console.log('--- TEST 2: Live HTTP GET /api/admin/users?page=1&limit=5 ---');
    const adminUser = await User.findOne({ role: 'admin' });
    assert(adminUser, 'Admin user must exist');
    const adminToken = generateAccessToken(adminUser);

    const httpRes = await makeHttpRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/users?page=1&limit=5',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Accept': 'application/json'
        }
    });

    assert.strictEqual(httpRes.status, 200, `Expected 200, got ${httpRes.status}`);
    assert(Array.isArray(httpRes.body.users), 'users array must be present in response');
    assert(httpRes.body.users.length > 0, 'users should not be empty');

    httpRes.body.users.forEach((u, i) => {
        assert(typeof u.adsCount === 'number', `HTTP user [${i}] must contain adsCount`);
        assert(typeof u.balance === 'number', `HTTP user [${i}] must contain balance`);
        assert(typeof u.referralCount === 'number', `HTTP user [${i}] must contain referralCount`);
    });
    console.log('✓ TEST 2 passed: Live HTTP API returns users with adsCount, balance, referralCount');

    // ── TEST 3: User Details Endpoint /api/admin/users/:id ──────────────
    console.log('--- TEST 3: User Details endpoint /api/admin/users/:id ---');
    const targetUserId = String(httpRes.body.users[0]._id);
    const detailRes = await makeHttpRequest({
        hostname: 'localhost',
        port: 5000,
        path: `/api/admin/users/${targetUserId}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Accept': 'application/json'
        }
    });

    assert.strictEqual(detailRes.status, 200, `Expected 200 for user detail, got ${detailRes.status}`);
    assert(detailRes.body.user, 'detail response must contain user');
    assert(Array.isArray(detailRes.body.ads), 'detail response must contain ads array');
    assert(Array.isArray(detailRes.body.transactions), 'detail response must contain transactions array');
    assert(Array.isArray(detailRes.body.referrals), 'detail response must contain referrals array');
    assert(typeof detailRes.body.user.adsCount === 'number', 'user.adsCount must be number');
    assert(typeof detailRes.body.user.balance === 'number', 'user.balance must be number');
    assert(typeof detailRes.body.user.referralCount === 'number', 'user.referralCount must be number');
    console.log('✓ TEST 3 passed: User details endpoint returns user, ads, transactions, referrals');

    // ── TEST 4: Frontend HTML Table Headers & Modal ─────────────────────
    console.log('--- TEST 4: Frontend admin.html table headers & userDetailModal check ---');
    const adminHtml = fs.readFileSync(path.join(__dirname, '..', '..', 'Front end', 'admin.html'), 'utf8');
    assert(adminHtml.includes('<th>Elan sayı</th>'), 'admin.html must have <th>Elan sayı</th>');
    assert(adminHtml.includes('<th>Balans</th>'), 'admin.html must have <th>Balans</th>');
    assert(adminHtml.includes('<th>Dəvət</th>'), 'admin.html must have <th>Dəvət</th>');
    assert(adminHtml.includes('colspan="10"'), 'admin.html must have colspan="10" for 10 columns');
    assert(adminHtml.includes('id="userDetailModal"'), 'admin.html must have id="userDetailModal"');
    assert(adminHtml.includes('id="udmAdsTableBody"'), 'admin.html must have id="udmAdsTableBody"');
    assert(adminHtml.includes('id="udmTxTableBody"'), 'admin.html must have id="udmTxTableBody"');
    assert(adminHtml.includes('id="udmRefTableBody"'), 'admin.html must have id="udmRefTableBody"');
    console.log('✓ TEST 4 passed: admin.html has 3 new table headers and userDetailModal markup');

    // ── TEST 5: Frontend JS Table Rendering & Modal Handlers ────────────
    console.log('--- TEST 5: Frontend admin.js renderUsers and modal logic check ---');
    const adminJs = fs.readFileSync(path.join(__dirname, '..', '..', 'Front end', 'JS', 'admin.js'), 'utf8');
    assert(adminJs.includes('adsCount'), 'admin.js renderUsers must use adsCount');
    assert(adminJs.includes('balance'), 'admin.js renderUsers must use balance');
    assert(adminJs.includes('referralCount'), 'admin.js renderUsers must use referralCount');
    assert(adminJs.includes('openUserDetailModal'), 'admin.js must define openUserDetailModal');
    assert(adminJs.includes('closeUserDetailModal'), 'admin.js must define closeUserDetailModal');
    assert(adminJs.includes('switchUserDetailTab'), 'admin.js must define switchUserDetailTab');
    console.log('✓ TEST 5 passed: admin.js renders new columns and controls modal');

    console.log('=== ALL ADMIN USER METRICS & MODAL TESTS PASSED 100%! ===');
    process.exit(0);
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
