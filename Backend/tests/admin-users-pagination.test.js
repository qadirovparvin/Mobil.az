require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const http = require('http');
const jwt = require('jsonwebtoken');

const adminController = require('../controllers/adminController');
const User = require('../models/User');

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
    console.log('=== ADMIN USERS PAGINATION & SEARCH TESTS ===');

    // ── TEST 1: Static analysis of adminController.js ──────────────────
    console.log('--- TEST 1: adminController.js getAllUsers totalAds typo fix ---');
    const adminControllerCode = fs.readFileSync(path.join(__dirname, '..', 'controllers', 'adminController.js'), 'utf8');
    const getAllUsersCode = adminControllerCode.substring(
        adminControllerCode.indexOf('const getAllUsers'),
        adminControllerCode.indexOf('const getAllAds')
    );
    assert(!getAllUsersCode.includes('totalAds'), 'getAllUsers must NOT contain totalAds typo');
    assert(getAllUsersCode.includes('totalUsers'), 'getAllUsers must contain totalUsers');
    assert(getAllUsersCode.includes('totalPages'), 'getAllUsers must contain totalPages');
    assert(getAllUsersCode.includes('currentPage'), 'getAllUsers must contain currentPage');
    console.log('✓ TEST 1 passed: No totalAds in getAllUsers; totalUsers present');

    // ── TEST 2: Controller Direct Unit Test ─────────────────────────────
    console.log('--- TEST 2: Direct controller unit test for getAllUsers ---');
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.MONGODB_URI);
    }

    const mockReq1 = { query: { page: 1, limit: 20 } };
    const mockRes1 = createMockRes();
    await adminController.getAllUsers(mockReq1, mockRes1, (err) => { if (err) throw err; });

    assert.strictEqual(mockRes1.statusCode, 200, 'Status should be 200');
    assert(Array.isArray(mockRes1.payload.users), 'users array must be returned');
    assert.strictEqual(typeof mockRes1.payload.totalUsers, 'number', 'totalUsers must be a number');
    assert.strictEqual(typeof mockRes1.payload.totalPages, 'number', 'totalPages must be a number');
    assert.strictEqual(mockRes1.payload.currentPage, 1, 'currentPage should be 1');
    assert.strictEqual(mockRes1.payload.pagination.totalAds, undefined, 'pagination.totalAds must be undefined');
    assert.strictEqual(mockRes1.payload.pagination.totalUsers, mockRes1.payload.totalUsers, 'pagination.totalUsers must match');

    // Test page 2
    const mockReq2 = { query: { page: 2, limit: 20 } };
    const mockRes2 = createMockRes();
    await adminController.getAllUsers(mockReq2, mockRes2, (err) => { if (err) throw err; });
    assert.strictEqual(mockRes2.statusCode, 200);
    assert.strictEqual(mockRes2.payload.currentPage, 2, 'currentPage should be 2');

    // Test search filter
    const mockReq3 = { query: { page: 1, limit: 20, search: 'admin' } };
    const mockRes3 = createMockRes();
    await adminController.getAllUsers(mockReq3, mockRes3, (err) => { if (err) throw err; });
    assert.strictEqual(mockRes3.statusCode, 200);
    assert(Array.isArray(mockRes3.payload.users));
    console.log('✓ TEST 2 passed: Direct controller execution returns users, totalUsers, totalPages, currentPage');

    // ── TEST 3: Live HTTP API Verification ──────────────────────────────
    console.log('--- TEST 3: Live HTTP GET /api/admin/users verification ---');
    const adminUser = await User.findOne({ role: 'admin' });
    assert(adminUser, 'An admin user must exist in DB for testing');

    const { generateAccessToken } = require('../utils/authSecurity');
    const adminToken = generateAccessToken(adminUser);

    const httpResPage1 = await makeHttpRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/users?page=1&limit=20',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Accept': 'application/json'
        }
    });

    assert.strictEqual(httpResPage1.status, 200, `Expected 200, got ${httpResPage1.status}: ${JSON.stringify(httpResPage1.body)}`);
    assert(Array.isArray(httpResPage1.body.users), 'users array must be present in response');
    assert(typeof httpResPage1.body.totalUsers === 'number', 'totalUsers must be present in response');
    assert(typeof httpResPage1.body.totalPages === 'number', 'totalPages must be present in response');
    assert.strictEqual(httpResPage1.body.currentPage, 1, 'currentPage must be 1');
    assert.strictEqual(httpResPage1.body.pagination.totalAds, undefined, 'pagination.totalAds must be undefined');

    // Page 2
    const httpResPage2 = await makeHttpRequest({
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/users?page=2&limit=20',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Accept': 'application/json'
        }
    });
    assert.strictEqual(httpResPage2.status, 200);
    assert.strictEqual(httpResPage2.body.currentPage, 2);

    console.log('✓ TEST 3 passed: Live HTTP API returns 200 with paginated users, totalUsers and totalPages');

    // ── TEST 4: Frontend HTML Verification ─────────────────────────────
    console.log('--- TEST 4: Frontend admin.html container check ---');
    const adminHtml = fs.readFileSync(path.join(__dirname, '..', '..', 'Front end', 'admin.html'), 'utf8');
    assert(adminHtml.includes('id="usersPagination"'), 'admin.html must contain id="usersPagination"');
    assert(adminHtml.includes('id="userSearch"'), 'admin.html must contain id="userSearch"');
    console.log('✓ TEST 4 passed: admin.html has usersPagination and userSearch elements');

    // ── TEST 5: Frontend JS Verification ───────────────────────────────
    console.log('--- TEST 5: Frontend admin.js pagination & debounce search check ---');
    const adminJs = fs.readFileSync(path.join(__dirname, '..', '..', 'Front end', 'JS', 'admin.js'), 'utf8');
    assert(adminJs.includes('currentUserPage'), 'admin.js must have currentUserPage variable');
    assert(adminJs.includes('usersPerPage'), 'admin.js must have usersPerPage');
    assert(adminJs.includes('loadUsers'), 'admin.js must define loadUsers function');
    assert(adminJs.includes('renderUsersPagination'), 'admin.js must define renderUsersPagination');
    assert(adminJs.includes('userSearch'), 'admin.js must reference userSearch');
    assert(adminJs.includes('300'), 'admin.js must debounce search by 300ms');
    console.log('✓ TEST 5 passed: admin.js has pagination logic and 300ms debounced search');

    console.log('=== ALL ADMIN USERS PAGINATION TESTS PASSED 100%! ===');
    process.exit(0);
}

runTests().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
