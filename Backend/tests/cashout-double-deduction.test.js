/**
 * Backend/tests/cashout-double-deduction.test.js
 * Verification for: TASK: P0-CASHOUT-REFUND-DOUBLE-FIX
 * 
 * Tests:
 * 1. Crash between reserve and request -> balance 1 dəfə çıxılmalı, 2 dəfə yox
 *    Mock: Wallet reserve -100 et, CashOutRequest yaratma (crash), recovery çağır -> 2-ci reserve olmamalı
 * 2. Crash between reserve and refund -> refund idempotent
 *    Mock: reserve -100, CashOutRequest pending, Transaction refund yox, balance hələ köhnə, refund çağır -> balance +100 1 dəfə
 *    2-ci refund çağır -> balance yenə eyni, 2x yox
 * 3. Duplicate request same idempotencyKey -> 1 CashOutRequest, 1 reserve
 */

'use strict';

const assert = require('assert');
const { connectTestDB, disconnectTestDB, assertSafeTestDB } = require('./setupTestDB');
const User = require('../models/User');
const CashOutRequest = require('../models/CashOutRequest');
const Transaction = require('../models/Transaction');
const walletController = require('../controllers/walletController');

function createMockRes() {
    const obj = {
        statusCode: 200,
        payload: null,
        status(c) { obj.statusCode = c; return obj; },
        json(d) { obj.payload = d; return obj; }
    };
    return obj;
}

async function run() {
    await connectTestDB();
    assertSafeTestDB();
    console.log('Connected to isolated in-memory MongoDB');
    await Promise.all([User.init(), Transaction.init(), CashOutRequest.init()]);

    try {
        assertSafeTestDB();
        console.log('\n--- TEST 1: Crash between reserve and request -> balance 1 dəfə çıxılmalı, 2 dəfə yox ---');
        // Initial user balance: 100 AZN
        const testUser1 = await User.create({
            name: 'CrashReserve',
            lastName: 'User1',
            email: `cashout_crash1_${Date.now()}@example.com`,
            password: 'Password123!',
            walletBalance: 100,
            walletReservedBalance: 0
        });

        // Mock: Wallet reserve -100 et, CashOutRequest yaratma (simulate crash before CashOutRequest creation)
        await User.updateOne(
            { _id: testUser1._id },
            { $set: { walletBalance: 0, walletReservedBalance: 100 } }
        );
        console.log('Mocked crashed state: User balance = 0, reserved = 100, CashOutRequest = 0');

        // Verify no CashOutRequest exists
        const reqCountBefore = await CashOutRequest.countDocuments({ user: testUser1._id });
        assert.strictEqual(reqCountBefore, 0, 'No CashOutRequest should exist in crashed state');

        // Call recovery (reconcileStuckReserves)
        console.log('Triggering recovery job (reconcileStuckReserves)...');
        const reconResult = await walletController.reconcileStuckReserves();
        console.log('Reconciliation result:', reconResult);

        // After recovery, orphan reserve of 100 must be restored to walletBalance
        const user1AfterRecon = await User.findById(testUser1._id);
        console.log(`User1 balance after recovery: balance = ${user1AfterRecon.walletBalance}, reserved = ${user1AfterRecon.walletReservedBalance}`);
        assert.strictEqual(user1AfterRecon.walletBalance, 100, 'User balance must be restored to 100 by recovery');
        assert.strictEqual(user1AfterRecon.walletReservedBalance, 0, 'User reservedBalance must be reset to 0 by recovery');

        // Now user retries cash-out of 100 AZN
        console.log('User performs cash-out of 100 AZN after recovery...');
        const idempKey1 = `idemp_test1_${Date.now()}`;
        const mockReq1 = {
            user: user1AfterRecon,
            body: {
                amount: 100,
                destination: 'bank_account',
                accountHolderDetails: 'AZ21NABZ00000000123456789012',
                idempotencyKey: idempKey1
            },
            get: (h) => (h.toLowerCase() === 'idempotency-key' ? idempKey1 : '')
        };
        const mockRes1 = createMockRes();
        await walletController.requestCashOut(mockReq1, mockRes1, (err) => { if (err) throw err; });

        assert.strictEqual(mockRes1.statusCode, 201, `Expected status 201, got ${mockRes1.statusCode}`);

        const user1Final = await User.findById(testUser1._id);
        console.log(`User1 final balance: balance = ${user1Final.walletBalance}, reserved = ${user1Final.walletReservedBalance}`);
        assert.strictEqual(user1Final.walletBalance, 0, 'Balance must be 0 after 1x deduction of 100 AZN');
        assert.strictEqual(user1Final.walletReservedBalance, 100, 'Reserved balance must be exactly 100 AZN');

        const user1Requests = await CashOutRequest.find({ user: testUser1._id });
        assert.strictEqual(user1Requests.length, 1, 'Exactly 1 CashOutRequest must exist');
        console.log('✓ TEST 1 PASSED: Crash between reserve and request recovered, balance deducted 1x (not 2x)!');


        assertSafeTestDB();
        console.log('\n--- TEST 2: Crash between reserve and refund -> refund idempotent ---');
        // Initial: 0 balance, 100 reserved, CashOutRequest pending, no refund Transaction yet
        const testUser2 = await User.create({
            name: 'CrashRefund',
            lastName: 'User2',
            email: `cashout_crash2_${Date.now()}@example.com`,
            password: 'Password123!',
            walletBalance: 0,
            walletReservedBalance: 100
        });

        const idempKey2 = `idemp_test2_${Date.now()}`;
        const cashOutDoc2 = await CashOutRequest.create({
            user: testUser2._id,
            amount: 100,
            destination: 'bank_account',
            accountHolderDetails: 'AZ21NABZ00000000123456789012',
            idempotencyKey: idempKey2,
            status: 'pending',
            walletReserved: true
        });

        console.log(`Created pending request ${cashOutDoc2._id} with user balance: 0, reserved: 100`);
        const refundTxBefore = await Transaction.findOne({ idempotencyKey: `refund:${cashOutDoc2._id}` });
        assert.strictEqual(refundTxBefore, null, 'No refund Transaction should exist initially');

        console.log('Calling refundReserve concurrently...');
        const concurrentCashOutA = await CashOutRequest.findById(cashOutDoc2._id);
        const concurrentCashOutB = await CashOutRequest.findById(cashOutDoc2._id);
        const [refund1, refund2] = await Promise.all([
            walletController.refundReserve(concurrentCashOutA, { reason: 'Provider failure test' }),
            walletController.refundReserve(concurrentCashOutB, { reason: 'Concurrent provider failure retry' })
        ]);
        assert.strictEqual(refund1.success, true, 'First concurrent refund must succeed');
        assert.strictEqual(refund2.success, true, 'Concurrent duplicate refund must be idempotently successful');

        const user2AfterRefund1 = await User.findById(testUser2._id);
        console.log(`User2 balance after 1st refund: balance = ${user2AfterRefund1.walletBalance}, reserved = ${user2AfterRefund1.walletReservedBalance}`);
        assert.strictEqual(user2AfterRefund1.walletBalance, 100, 'Balance must be restored to 100');
        assert.strictEqual(user2AfterRefund1.walletReservedBalance, 0, 'Reserved balance must be 0');

        // Check refund transaction was created
        const refundTxAfter = await Transaction.findOne({ idempotencyKey: `refund:${cashOutDoc2._id}` });
        assert(refundTxAfter, 'Refund transaction must be created with idempotencyKey');
        assert.strictEqual(refundTxAfter.type, 'cashout_refund', 'Transaction type must be cashout_refund');
        assert.strictEqual(refundTxAfter.amount, 100, 'Transaction amount must be 100');

        console.log('Concurrent refund results:', refund1, refund2);
        assert.ok(refund1.alreadyRefunded || refund2.alreadyRefunded, 'One concurrent refund must detect the idempotent claim');

        const user2AfterRefund2 = await User.findById(testUser2._id);
        console.log(`User2 balance after 2nd refund: balance = ${user2AfterRefund2.walletBalance}, reserved = ${user2AfterRefund2.walletReservedBalance}`);
        assert.strictEqual(user2AfterRefund2.walletBalance, 100, 'Balance MUST NOT be refunded twice (2x yox)! Must stay 100');
        assert.strictEqual(user2AfterRefund2.walletReservedBalance, 0, 'Reserved balance must stay 0');

        const refundTxCount = await Transaction.countDocuments({ idempotencyKey: `refund:${cashOutDoc2._id}` });
        assert.strictEqual(refundTxCount, 1, 'Exactly 1 refund Transaction must exist');
        console.log('✓ TEST 2 PASSED: Crash between reserve and refund is idempotent, balance restored 1x (not 2x)!');


        assertSafeTestDB();
        console.log('\n--- TEST 3: Duplicate request same idempotencyKey -> 1 CashOutRequest, 1 reserve ---');
        const testUser3 = await User.create({
            name: 'DuplicateIdemp',
            lastName: 'User3',
            email: `cashout_dup3_${Date.now()}@example.com`,
            password: 'Password123!',
            walletBalance: 100,
            walletReservedBalance: 0
        });

        const idempKey3 = `idemp_test3_${Date.now()}`;
        const mockReq3A = {
            user: testUser3,
            body: {
                amount: 50,
                destination: 'bank_account',
                accountHolderDetails: 'AZ21NABZ00000000123456789012',
                idempotencyKey: idempKey3
            },
            get: (h) => (h.toLowerCase() === 'idempotency-key' ? idempKey3 : '')
        };
        const mockRes3A = createMockRes();

        console.log('Sending first cash-out request (50 AZN)...');
        await walletController.requestCashOut(mockReq3A, mockRes3A, (err) => { if (err) throw err; });
        assert.strictEqual(mockRes3A.statusCode, 201, `First request should return 201, got ${mockRes3A.statusCode}`);

        const user3AfterFirst = await User.findById(testUser3._id);
        assert.strictEqual(user3AfterFirst.walletBalance, 50, 'Balance must be 50 after 1st request');
        assert.strictEqual(user3AfterFirst.walletReservedBalance, 50, 'Reserved must be 50 after 1st request');

        // Sending duplicate request with the EXACT SAME idempotencyKey
        console.log('Sending duplicate cash-out request with same idempotencyKey...');
        const mockReq3B = {
            user: user3AfterFirst,
            body: {
                amount: 50,
                destination: 'bank_account',
                accountHolderDetails: 'AZ21NABZ00000000123456789012',
                idempotencyKey: idempKey3
            },
            get: (h) => (h.toLowerCase() === 'idempotency-key' ? idempKey3 : '')
        };
        const mockRes3B = createMockRes();

        await walletController.requestCashOut(mockReq3B, mockRes3B, (err) => { if (err) throw err; });
        console.log('Duplicate request response:', { statusCode: mockRes3B.statusCode, payload: mockRes3B.payload });
        assert.strictEqual(mockRes3B.statusCode, 200, `Duplicate request should return 200, got ${mockRes3B.statusCode}`);
        assert.strictEqual(mockRes3B.payload.idempotent, true, 'Duplicate request must return idempotent: true');

        const user3Final = await User.findById(testUser3._id);
        console.log(`User3 final balance: balance = ${user3Final.walletBalance}, reserved = ${user3Final.walletReservedBalance}`);
        assert.strictEqual(user3Final.walletBalance, 50, 'Balance MUST NOT be deducted twice! Must stay 50');
        assert.strictEqual(user3Final.walletReservedBalance, 50, 'Reserved balance MUST NOT be increased twice! Must stay 50');

        const user3ReqCount = await CashOutRequest.countDocuments({ user: testUser3._id, idempotencyKey: idempKey3 });
        assert.strictEqual(user3ReqCount, 1, 'Exactly 1 CashOutRequest document must exist for same idempotencyKey');

        const user3TxCount = await Transaction.countDocuments({ user: testUser3._id, type: 'withdrawal' });
        assert.strictEqual(user3TxCount, 1, 'Exactly 1 withdrawal Transaction must exist');
        console.log('✓ TEST 3 PASSED: Duplicate request with same idempotencyKey returned existing request without double deduction!');

        // Cleanup
        await User.deleteMany({ _id: { $in: [testUser1._id, testUser2._id, testUser3._id] } });
        await CashOutRequest.deleteMany({ user: { $in: [testUser1._id, testUser2._id, testUser3._id] } });
        await Transaction.deleteMany({ user: { $in: [testUser1._id, testUser2._id, testUser3._id] } });

        console.log('\n🎉 ALL CASHOUT DOUBLE DEDUCTION TESTS PASSED 100%! 🚀');
    } catch (err) {
        console.error('❌ Test failed with error:', err);
        throw err;
    } finally {
        await disconnectTestDB().catch(() => {});
    }
}

run().catch((err) => {
    console.error('Cash-out test execution failed:', err);
    process.exitCode = 1;
});
