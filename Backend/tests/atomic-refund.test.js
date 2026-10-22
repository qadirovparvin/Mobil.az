const assert = require('assert');
const mongoose = require('mongoose');
const User = require('../models/User');
const CashOutRequest = require('../models/CashOutRequest');
const Transaction = require('../models/Transaction');
const { requestCashOut } = require('../controllers/walletController');

async function runTests() {
    await mongoose.connect('mongodb://127.0.0.1:27017/airyphone_db');
    console.log('Connected to MongoDB');

    try {
        console.log('=== TEST 1: 2 Parallel Retries on Stuck Pending Request ===');
        const testEmail = `atomic_refund_${Date.now()}@test.com`;
        const testUser = await User.create({
            name: 'Atomic Refund Tester',
            email: testEmail,
            password: 'Password123!',
            walletBalance: 20,
            walletReservedBalance: 40 // exactly 40 reserved for stuck request
        });

        const stuckIdempKey = `atomic-stuck-key-${Date.now()}`;
        // Create stuck pending request for amount: 40
        const stuckReqDoc = await CashOutRequest.create({
            user: testUser._id,
            amount: 40,
            destination: 'bank_account',
            accountHolderDetails: 'AZ21NABZ00000000123456789012',
            idempotencyKey: stuckIdempKey,
            status: 'pending'
        });

        // Backdate stuck request to 10 minutes ago (> 5 min)
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        await CashOutRequest.collection.updateOne(
            { _id: stuckReqDoc._id },
            { $set: { createdAt: tenMinutesAgo } }
        );

        console.log('Stuck pending request created (>5 min ago). Initial User balances:');
        console.log('walletBalance: 20, walletReservedBalance: 40');

        // Prepare 2 simultaneous requests with same stuck idempotencyKey
        const makeReq = () => ({
            user: testUser,
            body: {
                amount: 40,
                destination: 'bank_account',
                accountHolderDetails: 'AZ21NABZ00000000123456789012',
                idempotencyKey: stuckIdempKey
            },
            get: () => stuckIdempKey
        });

        let res1 = null, resStatus1 = null;
        let res2 = null, resStatus2 = null;

        const mockRes1 = {
            status: (s) => { resStatus1 = s; return mockRes1; },
            json: (p) => { res1 = p; }
        };

        const mockRes2 = {
            status: (s) => { resStatus2 = s; return mockRes2; },
            json: (p) => { res2 = p; }
        };

        console.log('Dispatching 2 simultaneous retries on stuck pending request...');
        await Promise.all([
            requestCashOut(makeReq(), mockRes1, (err) => { if (err) console.error('Req1 err:', err); }),
            requestCashOut(makeReq(), mockRes2, (err) => { if (err) console.error('Req2 err:', err); })
        ]);

        console.log('Both requests completed.');
        console.log('Response 1:', { status: resStatus1, body: res1 });
        console.log('Response 2:', { status: resStatus2, body: res2 });

        // Exactly one should have refunded: true, and the other must be idempotent: true
        const refundedCount = (res1?.refunded ? 1 : 0) + (res2?.refunded ? 1 : 0);
        assert.strictEqual(refundedCount, 1, `Expected exactly 1 request to perform refund, got ${refundedCount}`);
        console.log('✔ Exactly 1 request claimed the stuck record and performed refund!');

        const idempotentCount = (res1?.idempotent ? 1 : 0) + (res2?.idempotent ? 1 : 0);
        assert.strictEqual(idempotentCount, 1, `Expected exactly 1 request to return idempotent: true, got ${idempotentCount}`);
        console.log('✔ Concurrent retry received idempotent response (no double refund)!');

        // Check user balances in DB:
        // Before race: 20 balance, 40 reserved
        // Exactly 1 refund: 20 + 40 = 60 balance, 40 - 40 = 0 reserved
        const updatedUser = await User.findById(testUser._id);
        console.log(`User balances after race: walletBalance=${updatedUser.walletBalance}, walletReservedBalance=${updatedUser.walletReservedBalance}`);

        assert(
            updatedUser.walletReservedBalance >= 0,
            `walletReservedBalance MUST NOT be negative! Got: ${updatedUser.walletReservedBalance}`
        );
        assert.strictEqual(
            updatedUser.walletBalance,
            60,
            `Expected walletBalance to be 60 (exactly 1x refund of 40), got: ${updatedUser.walletBalance}`
        );
        assert.strictEqual(
            updatedUser.walletReservedBalance,
            0,
            `Expected walletReservedBalance to be 0 (40 - 40), got: ${updatedUser.walletReservedBalance}`
        );
        console.log('✔ NO DOUBLE REFUND! Reserved balance remained >= 0, balance is exactly 60/0!');

        console.log('\n--- Subsequent Retry: creating new request after stuck failure ---');
        let resRetry = null, resRetryStatus = null;
        const mockRetryRes = {
            status: (s) => { resRetryStatus = s; return mockRetryRes; },
            json: (p) => { resRetry = p; }
        };
        const retryReq = {
            user: updatedUser,
            body: {
                amount: 40,
                destination: 'bank_account',
                accountHolderDetails: 'AZ21NABZ00000000123456789012',
                idempotencyKey: stuckIdempKey
            },
            get: () => stuckIdempKey
        };
        await requestCashOut(retryReq, mockRetryRes, (err) => { if (err) throw err; });
        assert.strictEqual(resRetryStatus, 201, `Expected status 201 for fresh retry request, got ${resRetryStatus}`);

        const userAfterFresh = await User.findById(testUser._id);
        assert.strictEqual(userAfterFresh.walletBalance, 20, 'Balance is now 20 (60 - 40)');
        assert.strictEqual(userAfterFresh.walletReservedBalance, 40, 'Reserved balance is 40');
        console.log('✔ Fresh request created successfully on subsequent retry (balance: 20, reserved: 40)!');

        console.log('\n=== TEST 2: Reserve Mismatch Protection with $gte condition ===');
        // Test that if walletReservedBalance < amount, $gte prevents any negative reserve deduction
        const mismatchedIdempKey = `mismatch-key-${Date.now()}`;
        const mismatchReqDoc = await CashOutRequest.create({
            user: testUser._id,
            amount: 100, // amount 100 but user only has 40 reserved
            destination: 'bank_account',
            accountHolderDetails: 'AZ21NABZ00000000123456789012',
            idempotencyKey: mismatchedIdempKey,
            status: 'pending'
        });

        await CashOutRequest.collection.updateOne(
            { _id: mismatchReqDoc._id },
            { $set: { createdAt: tenMinutesAgo } }
        );

        let mismatchRes = null, mismatchStatus = null;
        const mockMismatchRes = {
            status: (s) => { mismatchStatus = s; return mockMismatchRes; },
            json: (p) => { mismatchRes = p; }
        };

        const mismatchReq = {
            user: userAfterFresh,
            body: {
                amount: 100,
                destination: 'bank_account',
                accountHolderDetails: 'AZ21NABZ00000000123456789012',
                idempotencyKey: mismatchedIdempKey
            },
            get: () => mismatchedIdempKey
        };

        // Calling requestCashOut will attempt to refund 100, but user only has 40 reserved.
        // It should log mismatch and NOT deduct reserved into negative numbers.
        try {
            await requestCashOut(mismatchReq, mockMismatchRes, () => {});
        } catch (e) {}

        const userAfterMismatch = await User.findById(testUser._id);
        assert(
            userAfterMismatch.walletReservedBalance >= 0,
            `walletReservedBalance must stay >= 0! Got: ${userAfterMismatch.walletReservedBalance}`
        );
        console.log(`✔ $gte protection verified! User walletReservedBalance is safe at: ${userAfterMismatch.walletReservedBalance}`);

        // Cleanup
        await User.deleteOne({ _id: testUser._id });
        await CashOutRequest.deleteMany({ user: testUser._id });
        await Transaction.deleteMany({ user: testUser._id });

        console.log('\n=== ALL ATOMIC REFUND TESTS PASSED 100%! 🚀 ===');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed with error:', err);
        process.exit(1);
    }
}

runTests();
