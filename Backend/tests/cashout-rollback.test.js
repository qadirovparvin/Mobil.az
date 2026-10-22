const assert = require('assert');
const mongoose = require('mongoose');
const User = require('../models/User');
const CashOutRequest = require('../models/CashOutRequest');
const Transaction = require('../models/Transaction');
const { requestCashOut, reconcileStuckReserves } = require('../controllers/walletController');

async function runTest() {
    await mongoose.connect('mongodb://127.0.0.1:27017/airyphone_db');
    console.log('Connected to MongoDB');

    try {
        const testEmail = `test_cashout_${Date.now()}@test.com`;
        const testUser = await User.create({
            name: 'CashOut Tester',
            email: testEmail,
            password: 'Password123!',
            walletBalance: 100,
            walletReservedBalance: 0
        });

        console.log('--- TEST 1: Cash-out 50 AZN with atomic transaction ---');
        const idempKey1 = `idemp_cashout_test_${Date.now()}`;
        let resJson1 = null;
        let resStatus1 = 200;
        const mockRes1 = {
            status: (s) => { resStatus1 = s; return mockRes1; },
            json: (p) => { resJson1 = p; }
        };
        const mockReq1 = {
            user: testUser,
            body: {
                amount: 50,
                destination: 'bank_account',
                accountHolderDetails: 'AZ21NABZ00000000123456789012',
                idempotencyKey: idempKey1
            },
            get: (h) => (h.toLowerCase() === 'idempotency-key' ? idempKey1 : '')
        };

        await requestCashOut(mockReq1, mockRes1, (err) => { if (err) throw err; });
        assert.strictEqual(resStatus1, 201, `Expected status 201, got ${resStatus1}`);
        const user1 = await User.findById(testUser._id);
        assert.strictEqual(user1.walletBalance, 50, `Expected balance 50, got ${user1.walletBalance}`);
        assert.strictEqual(user1.walletReservedBalance, 50, `Expected reserved 50, got ${user1.walletReservedBalance}`);
        console.log('✓ TEST 1 passed: 50 AZN reserved atomically. Balance: 50, Reserved: 50');

        console.log('--- TEST 2: Idempotency with status pending returns existing without double deduction ---');
        let resJson2 = null;
        let resStatus2 = 200;
        const mockRes2 = {
            status: (s) => { resStatus2 = s; return mockRes2; },
            json: (p) => { resJson2 = p; }
        };
        await requestCashOut(mockReq1, mockRes2, (err) => { if (err) throw err; });
        assert.strictEqual(resStatus2, 200, `Expected status 200, got ${resStatus2}`);
        assert(resJson2 && resJson2.idempotent === true, 'Expected idempotent: true');
        const user2 = await User.findById(testUser._id);
        assert.strictEqual(user2.walletBalance, 50, `Balance must stay 50, got ${user2.walletBalance}`);
        assert.strictEqual(user2.walletReservedBalance, 50, `Reserved must stay 50, got ${user2.walletReservedBalance}`);
        console.log('✓ TEST 2 passed: Idempotent call re-used request, balance unchanged');

        console.log('--- TEST 3: Status failed returns reserve and allows new request ---');
        // Mark first request as failed
        await CashOutRequest.updateOne({ _id: resJson1.cashOut._id }, { status: 'failed' });
        let resJson3 = null;
        let resStatus3 = 200;
        const mockRes3 = {
            status: (s) => { resStatus3 = s; return mockRes3; },
            json: (p) => { resJson3 = p; }
        };
        // Re-request with same key should refund previous reserve and create new request
        await requestCashOut(mockReq1, mockRes3, (err) => { if (err) throw err; });
        assert.strictEqual(resStatus3, 201, `Expected status 201 for new request, got ${resStatus3}`);
        const user3 = await User.findById(testUser._id);
        assert.strictEqual(user3.walletBalance, 50, `Balance after new reserve: 50, got ${user3.walletBalance}`);
        assert.strictEqual(user3.walletReservedBalance, 50, `Reserved after new reserve: 50, got ${user3.walletReservedBalance}`);
        console.log('✓ TEST 3 passed: Failed status reserve returned and new request processed');

        console.log('--- TEST 4: Reconciliation of stuck reserves (>24h) ---');
        // Backdate the request to 25 hours ago using raw collection update
        const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000);
        await CashOutRequest.collection.updateOne(
            { _id: new mongoose.Types.ObjectId(resJson3.cashOut._id) },
            { $set: { createdAt: oldDate } }
        );

        const reconResult = await reconcileStuckReserves();
        assert(reconResult.reconciledCount >= 1, `Expected at least 1 reconciled, got ${reconResult.reconciledCount}`);
        const user4 = await User.findById(testUser._id);
        assert.strictEqual(user4.walletBalance, 100, `Expected balance back to 100, got ${user4.walletBalance}`);
        assert.strictEqual(user4.walletReservedBalance, 0, `Expected reserved back to 0, got ${user4.walletReservedBalance}`);
        const stuckReq = await CashOutRequest.findById(resJson3.cashOut._id);
        assert.strictEqual(stuckReq.status, 'failed', 'Stuck request must be marked failed');
        console.log('✓ TEST 4 passed: reconcileStuckReserves refunded stuck request. Balance restored to 100!');

        console.log('--- TEST 5: Atomic rollback on failure mid-request ---');
        // Test: if request fails (e.g. amount exceeds balance)
        const excessiveReq = {
            user: user4,
            body: {
                amount: 500, // exceeds 100
                destination: 'bank_account',
                accountHolderDetails: 'AZ21NABZ00000000123456789012',
                idempotencyKey: `excessive_${Date.now()}`
            },
            get: () => `excessive_${Date.now()}`
        };
        let excessStatus = 200;
        const excessRes = {
            status: (s) => { excessStatus = s; return excessRes; },
            json: () => {}
        };
        await requestCashOut(excessiveReq, excessRes, () => {});
        assert(excessStatus >= 400, 'Should reject excessive cashout');
        const user5 = await User.findById(testUser._id);
        assert.strictEqual(user5.walletBalance, 100, 'Balance must remain 100');
        assert.strictEqual(user5.walletReservedBalance, 0, 'Reserved must remain 0');
        console.log('✓ TEST 5 passed: Excessive cashout rejected, balance completely intact');

        console.log('--- TEST 6: Simulated DB crash / mid-flight failure rollback ---');
        // Mock CashOutRequest.create to throw a DB error mid-operation
        const originalCreate = CashOutRequest.create;
        CashOutRequest.create = async () => { throw new Error('Simulated DB connection lost mid-flight'); };

        const midFailReq = {
            user: user5,
            body: {
                amount: 50,
                destination: 'bank_account',
                accountHolderDetails: 'AZ21NABZ00000000123456789012',
                idempotencyKey: `mid_fail_${Date.now()}`
            },
            get: () => `mid_fail_${Date.now()}`
        };

        try {
            await requestCashOut(midFailReq, { status: () => ({ json: () => {} }) }, (err) => { if (err) throw err; });
        } catch (expectedErr) {
            // expected
        } finally {
            CashOutRequest.create = originalCreate;
        }

        const user6 = await User.findById(testUser._id);
        assert.strictEqual(user6.walletBalance, 100, `Balance must be 100, got ${user6.walletBalance}`);
        assert.strictEqual(user6.walletReservedBalance, 0, `Reserved must be 0, got ${user6.walletReservedBalance}`);
        console.log('✓ TEST 6 passed: Mid-flight DB crash triggered rollback, balance is 100 (50 AZN not lost)!');

        // Cleanup
        await User.deleteOne({ _id: testUser._id });
        await CashOutRequest.deleteMany({ user: testUser._id });
        await Transaction.deleteMany({ user: testUser._id });
        console.log('=== ALL CASHOUT ATOMICITY & RECONCILIATION TESTS PASSED 100%! ===');
    } finally {
        await mongoose.disconnect();
    }
}

runTest().catch((err) => {
    console.error('Test error:', err);
    process.exit(1);
});
