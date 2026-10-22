require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const adminController = require('../controllers/adminController');
const walletController = require('../controllers/walletController');
const paymentConfig = require('../config/payment');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

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

async function runTests() {
    console.log('--- TEST 1: Admin UI paymentSessionsTab check ---');
    const adminHtml = fs.readFileSync(path.join(__dirname, '..', '..', 'Front end', 'admin.html'), 'utf8');
    assert(adminHtml.includes('id="paymentSessionsTab"'), 'admin.html must contain id="paymentSessionsTab"');
    assert(adminHtml.includes('id="navPaymentSessions"'), 'admin.html must contain id="navPaymentSessions"');
    assert(adminHtml.includes('id="allPaymentSessionsTable"'), 'admin.html must contain allPaymentSessionsTable');
    assert(adminHtml.includes('id="paymentSessionStatusFilter"'), 'admin.html must contain paymentSessionStatusFilter');

    const adminJs = fs.readFileSync(path.join(__dirname, '..', '..', 'Front end', 'JS', 'admin.js'), 'utf8');
    assert(adminJs.includes('loadPaymentSessions'), 'admin.js must define loadPaymentSessions');
    assert(adminJs.includes('renderPaymentSessions'), 'admin.js must define renderPaymentSessions');
    assert(adminJs.includes('reconcileSession'), 'admin.js must define reconcileSession');
    assert(adminJs.includes('/payment-sessions'), 'admin.js must query payment-sessions endpoint');
    console.log('✓ TEST 1 passed: Admin UI paymentSessionsTab, table, filters and JS handlers verified!');

    console.log('--- TEST 2: totalAds typo check in adminController.js ---');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const adminControllerCode = fs.readFileSync(path.join(__dirname, '..', 'controllers', 'adminController.js'), 'utf8');
    // Ensure inside getAllTransactions there is no totalAds
    const getAllTxCode = adminControllerCode.substring(
        adminControllerCode.indexOf('const getAllTransactions'),
        adminControllerCode.indexOf('const updateAdStatus')
    );
    assert(!getAllTxCode.includes('totalAds'), 'getAllTransactions must NOT contain totalAds typo');

    // Run getAllTransactions endpoint to verify actual JSON response
    const mockReq = { query: { page: 1, limit: 5 } };
    const mockRes = createMockRes();
    await adminController.getAllTransactions(mockReq, mockRes, () => {});

    assert.strictEqual(mockRes.statusCode, 200);
    assert(mockRes.payload.success === true);
    assert(typeof mockRes.payload.pagination.total === 'number');
    assert(typeof mockRes.payload.pagination.totalTransactions === 'number');
    assert.strictEqual(mockRes.payload.pagination.totalAds, undefined, 'pagination.totalAds must be undefined (no typo)');
    console.log('✓ TEST 2 passed: totalAds typo fixed and verified via actual controller response!');

    console.log('--- TEST 3: .env.example Payriff keys & payment.js support ---');
    const envExample = fs.readFileSync(path.join(__dirname, '..', '.env.example'), 'utf8');
    assert(envExample.includes('PAYRIFF_BASE_URL=https://api.payriff.com'), '.env.example must have PAYRIFF_BASE_URL');
    assert(envExample.includes('PAYRIFF_API_KEY='), '.env.example must have PAYRIFF_API_KEY');
    assert(envExample.includes('PAYRIFF_SECRET='), '.env.example must have PAYRIFF_SECRET');
    assert(envExample.includes('PAYRIFF_WEBHOOK_SECRET='), '.env.example must have PAYRIFF_WEBHOOK_SECRET');
    assert(envExample.includes('PAYRIFF_SIGNATURE_HEADER=x-payriff-signature'), '.env.example must have PAYRIFF_SIGNATURE_HEADER');
    assert(envExample.includes('PAYMENT_WEBHOOK_SECRET='), '.env.example must have PAYMENT_WEBHOOK_SECRET');
    assert(envExample.includes('WEBHOOK_SECRET='), '.env.example must have WEBHOOK_SECRET');

    // Test payment.js config with PAYRIFF_API_KEY fallback
    const prevApiKey = process.env.PAYRIFF_API_KEY;
    const prevSecret = process.env.PAYRIFF_SECRET;
    process.env.PAYRIFF_API_KEY = 'test-api-key-only';
    delete process.env.PAYRIFF_SECRET;
    const cfg = paymentConfig.getConfig();
    assert.strictEqual(cfg.payriff.apiKey, 'test-api-key-only');
    assert.strictEqual(cfg.payriff.secret, 'test-api-key-only');
    assert.strictEqual(cfg.payriff.baseUrl, 'https://api.payriff.com');
    if (prevApiKey) process.env.PAYRIFF_API_KEY = prevApiKey; else delete process.env.PAYRIFF_API_KEY;
    if (prevSecret) process.env.PAYRIFF_SECRET = prevSecret; else delete process.env.PAYRIFF_SECRET;
    console.log('✓ TEST 3 passed: .env.example Payriff keys complete & payment.js supports API key + base URL!');

    console.log('--- TEST 4: cabinet.js wallet history filter (type, date range) ---');
    const cabinetHtml = fs.readFileSync(path.join(__dirname, '..', '..', 'Front end', 'cabinet.html'), 'utf8');
    assert(cabinetHtml.includes('id="txFilterBar"'), 'cabinet.html must have txFilterBar');
    assert(cabinetHtml.includes('id="txFilterType"'), 'cabinet.html must have txFilterType');
    assert(cabinetHtml.includes('id="txFilterStartDate"'), 'cabinet.html must have txFilterStartDate');
    assert(cabinetHtml.includes('id="txFilterEndDate"'), 'cabinet.html must have txFilterEndDate');
    assert(cabinetHtml.includes('id="txFilterApplyBtn"'), 'cabinet.html must have txFilterApplyBtn');

    const cabinetJs = fs.readFileSync(path.join(__dirname, '..', '..', 'Front end', 'JS', 'cabinet.js'), 'utf8');
    assert(cabinetJs.includes('txFilterType'), 'cabinet.js must read txFilterType');
    assert(cabinetJs.includes('txFilterStartDate'), 'cabinet.js must read txFilterStartDate');
    assert(cabinetJs.includes('txFilterEndDate'), 'cabinet.js must read txFilterEndDate');
    assert(cabinetJs.includes('&type='), 'cabinet.js must append type param');
    assert(cabinetJs.includes('&startDate='), 'cabinet.js must append startDate param');
    assert(cabinetJs.includes('&endDate='), 'cabinet.js must append endDate param');

    // Test walletController.getTransactions with date range & type filters
    const testUser = await User.create({
        name: 'DateFilter',
        lastName: 'Tester',
        email: 'date_filter_' + Date.now() + '@example.com',
        password: 'password123'
    });

    try {
        await Transaction.create({
            user: testUser._id,
            amount: 15,
            type: 'deposit',
            description: 'Deposit 15',
            status: 'completed',
            createdAt: new Date('2026-05-10T12:00:00Z')
        });

        await Transaction.create({
            user: testUser._id,
            amount: 25,
            type: 'package_purchase',
            description: 'Package 25',
            status: 'completed',
            createdAt: new Date('2026-06-15T12:00:00Z')
        });

        const reqDeposit = {
            user: testUser,
            query: { type: 'deposit' }
        };
        const resDeposit = createMockRes();
        await walletController.getTransactions(reqDeposit, resDeposit, () => {});
        assert.strictEqual(resDeposit.statusCode, 200);
        assert.strictEqual(resDeposit.payload.transactions.length, 1);
        assert.strictEqual(resDeposit.payload.transactions[0].type, 'deposit');

        const reqDate = {
            user: testUser,
            query: { startDate: '2026-06-01', endDate: '2026-06-30' }
        };
        const resDate = createMockRes();
        await walletController.getTransactions(reqDate, resDate, () => {});
        assert.strictEqual(resDate.statusCode, 200);
        assert.strictEqual(resDate.payload.transactions.length, 1);
        assert.strictEqual(resDate.payload.transactions[0].amount, 25);
        console.log('✓ TEST 4 passed: cabinet wallet history filter UI, JS query params, and backend filtering verified!');

        console.log('\n=== ALL DAY4-P2-FINAL-FINISH-ALL TESTS PASSED 100%! ===');
    } finally {
        await User.deleteOne({ _id: testUser._id });
        await Transaction.deleteMany({ user: testUser._id });
        await mongoose.disconnect();
    }
}

runTests().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
