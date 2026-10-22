const assert = require('assert');
const mongoose = require('mongoose');
const User = require('../models/User');
const CashOutRequest = require('../models/CashOutRequest');
const Transaction = require('../models/Transaction');
const { requestCashOut } = require('../controllers/walletController');

async function runGhostPendingTest() {
    await mongoose.connect('mongodb://127.0.0.1:27017/airyphone_db');
    console.log('Connected to MongoDB');

    try {
        const testEmail = `test_ghost_${Date.now()}@test.com`;
        const testUser = await User.create({
            name: 'Ghost Tester',
            email: testEmail,
            password: 'Password123!',
            walletBalance: 100,
            walletReservedBalance: 0
        });

        const idempotencyKey = `ghost_key_${Date.now()}`;
        const mockReq = {
            user: testUser,
            body: {
                amount: 50,
                destination: 'bank_account',
                accountHolderDetails: 'AZ21NABZ00000000123456789012',
                idempotencyKey
            },
            get: () => idempotencyKey
        };

        console.log('--- TEST 1: Cash-out fallback failure simulation -> request must be marked failed (not ghost pending) ---');
        // Force Transaction.create to fail on fallback
        const origTxCreate = Transaction.create;
        let intercepted = false;
        Transaction.create = async function(...args) {
            if (!intercepted) {
                intercepted = true;
                throw new Error('Simulated Transaction write failure during cash-out');
            }
            return origTxCreate.apply(this, args);
        };

        let failErr = null;
        const mockResFail = {
            status: () => mockResFail,
            json: () => {}
        };

        try {
            await requestCashOut(mockReq, mockResFail, (err) => { if (err) failErr = err; });
        } catch (e) {
            failErr = e;
        }

        // Restore Transaction.create
        Transaction.create = origTxCreate;
        assert(failErr, 'Expected error to be thrown/propagated');

        // Check user balance was refunded
        const userAfterFailure = await User.findById(testUser._id);
        assert.strictEqual(userAfterFailure.walletBalance, 100, 'Balance must be rolled back to 100');
        assert.strictEqual(userAfterFailure.walletReservedBalance, 0, 'Reserved balance must be 0');

        // Check CashOutRequest is marked as 'failed', NOT left as 'pending' (Ghost)
        const failedRequest = await CashOutRequest.findOne({ user: testUser._id, idempotencyKey });
        assert.ok(failedRequest, 'CashOutRequest must exist in DB');
        assert.strictEqual(failedRequest.status, 'failed', 'CashOutRequest must be marked failed');
        assert.ok(failedRequest.failureReason.includes('Simulated Transaction write failure'), 'failureReason must be recorded');
        console.log('✔ TEST 1 passed: Request marked as failed with failureReason, balance refunded, no ghost pending!');

        console.log('--- TEST 2: Retry with SAME idempotencyKey -> must create new request ---');
        let resJson2 = null;
        let resStatus2 = 200;
        const mockRes2 = {
            status: (s) => { resStatus2 = s; return mockRes2; },
            json: (p) => { resJson2 = p; }
        };

        await requestCashOut(mockReq, mockRes2, (err) => { if (err) throw err; });
        assert.strictEqual(resStatus2, 201, `Expected status 201 for fresh request, got ${resStatus2}`);
        assert.ok(resJson2.cashOut, 'Response should contain newly created cashOut');
        assert.strictEqual(resJson2.cashOut.status, 'pending', 'New request status must be pending');

        const userAfterRetry = await User.findById(testUser._id);
        assert.strictEqual(userAfterRetry.walletBalance, 50, 'Wallet balance should now be 50');
        assert.strictEqual(userAfterRetry.walletReservedBalance, 50, 'Reserved balance should be 50');
        console.log('✔ TEST 2 passed: Retry with same key deleted failed record and created new request (balance 50/50)!');

        console.log('--- TEST 3: 5 minutes stuck pending -> timeout marks failed and refunds balance ---');
        const stuckIdempKey = `stuck_key_${Date.now()}`;
        // Create a stuck pending request
        const stuckReqDoc = await CashOutRequest.create({
            user: testUser._id,
            amount: 30,
            destination: 'bank_account',
            accountHolderDetails: 'AZ21NABZ00000000123456789012',
            idempotencyKey: stuckIdempKey,
            status: 'pending'
        });

        // Set user to 20 balance, 80 reserved (50 + 30)
        await User.updateOne({ _id: testUser._id }, { walletBalance: 20, walletReservedBalance: 80 });

        // Backdate stuck request to 6 minutes ago (> 5 min)
        const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
        await CashOutRequest.collection.updateOne(
            { _id: stuckReqDoc._id },
            { $set: { createdAt: sixMinutesAgo } }
        );

        const stuckReq = {
            user: await User.findById(testUser._id),
            body: {
                amount: 30,
                destination: 'bank_account',
                accountHolderDetails: 'AZ21NABZ00000000123456789012',
                idempotencyKey: stuckIdempKey
            },
            get: () => stuckIdempKey
        };

        let stuckResStatus = 200;
        let stuckResJson = null;
        const mockStuckRes = {
            status: (s) => { stuckResStatus = s; return mockStuckRes; },
            json: (p) => { stuckResJson = p; }
        };

        // Calling requestCashOut with stuckIdempKey detects timeout, marks failed and refunds 30 with status 200
        await requestCashOut(stuckReq, mockStuckRes, (err) => { if (err) throw err; });
        assert.strictEqual(stuckResStatus, 200, `Expected status 200 after stuck request resolved, got ${stuckResStatus}`);
        assert.strictEqual(stuckResJson?.refunded, true, 'Expected refunded: true in response');

        const userAfterRefund = await User.findById(testUser._id);
        // User had 20 balance, 80 reserved -> refunded 30 -> 50 balance, 50 reserved
        assert.strictEqual(userAfterRefund.walletBalance, 50, 'Balance is refunded to 50');
        assert.strictEqual(userAfterRefund.walletReservedBalance, 50, 'Reserved balance is reduced to 50');

        // Subsequent retry creates new request with status 201
        let retryResStatus = 200;
        let retryResJson = null;
        const mockRetryRes = {
            status: (s) => { retryResStatus = s; return mockRetryRes; },
            json: (p) => { retryResJson = p; }
        };
        const retryReq = {
            user: userAfterRefund,
            body: stuckReq.body,
            get: () => stuckIdempKey
        };
        await requestCashOut(retryReq, mockRetryRes, (err) => { if (err) throw err; });
        assert.strictEqual(retryResStatus, 201, `Expected status 201 after retry, got ${retryResStatus}`);

        const userAfterStuckRetry = await User.findById(testUser._id);
        assert.strictEqual(userAfterStuckRetry.walletBalance, 20, 'Balance is correct after refund and new request');
        assert.strictEqual(userAfterStuckRetry.walletReservedBalance, 80, 'Reserved balance is correct');
        console.log('✔ TEST 3 passed: 5 min stuck pending timed out, refunded and processed new request cleanly!');

        // Cleanup
        await User.deleteOne({ _id: testUser._id });
        await CashOutRequest.deleteMany({ user: testUser._id });
        await Transaction.deleteMany({ user: testUser._id });

        console.log('=== CASHOUT PENDING GHOST TESTS PASSED 100%! ✅ ===');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed with error:', err);
        process.exit(1);
    }
}

runGhostPendingTest();
