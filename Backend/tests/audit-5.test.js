require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const assert = require('assert');
const User = require('../models/User');
const PaymentSession = require('../models/PaymentSession');
const Transaction = require('../models/Transaction');
const { _test } = require('../controllers/walletController');
const { completeTopUpPayment } = _test;

async function runTest() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Setup test user with 100 AZN
    const testUser = await User.create({
        name: 'AuditTest',
        lastName: 'User',
        email: 'audit_test_' + Date.now() + '@example.com',
        password: 'password123',
        walletBalance: 100,
        walletReservedBalance: 0
    });

    try {
        console.log('--- TEST 1: $inc OK, tx.save FAILS -> Balance Reverted & Retry 1x ---');
        const paymentId = 'pay_audit_' + Date.now();
        const payment = await PaymentSession.create({
            paymentId,
            user: testUser._id,
            kind: 'wallet_topup',
            expectedAmount: 25,
            currency: 'AZN',
            status: 'pending',
            expiresAt: new Date(Date.now() + 600000)
        });

        // Mock Transaction.prototype.save to fail once
        const originalSave = Transaction.prototype.save;
        let saveCallCount = 0;
        Transaction.prototype.save = async function (...args) {
            saveCallCount++;
            if (saveCallCount === 1) {
                throw new Error('Simulated database write failure on tx.save');
            }
            return originalSave.apply(this, args);
        };

        let capturedErr = null;
        try {
            await completeTopUpPayment({ payment, session: null });
        } catch (e) {
            capturedErr = e;
        }

        // Restore original save
        Transaction.prototype.save = originalSave;

        console.log('Captured simulated tx.save error:', capturedErr?.message);
        assert(capturedErr, 'Expected simulated error to be thrown');

        // Check user balance: MUST be reverted back to 100 AZN (NOT 125 AZN!)
        const userAfterFailure = await User.findById(testUser._id);
        console.log('User balance after failure (must be 100):', userAfterFailure.walletBalance);
        assert.strictEqual(userAfterFailure.walletBalance, 100, 'Balance must be rolled back to original 100 AZN');

        // Check payment session status: MUST still be 'pending'
        const paymentAfterFailure = await PaymentSession.findById(payment._id);
        console.log('Payment status after failure (must be pending):', paymentAfterFailure.status);
        assert.strictEqual(paymentAfterFailure.status, 'pending', 'PaymentSession status must remain pending');

        // Check that pending transaction was cleaned up
        const pendingTxCount = await Transaction.countDocuments({ reference: paymentId });
        console.log('Pending transaction count after failure (must be 0):', pendingTxCount);
        assert.strictEqual(pendingTxCount, 0, 'Pending transaction must be deleted on failure');

        // Now retry the payment normally -> MUST succeed and increment balance by exactly +25!
        console.log('Retrying completeTopUpPayment on payment...');
        const retryResult = await completeTopUpPayment({ payment, session: null });
        console.log('Retry result idempotent:', retryResult.idempotent);
        assert.strictEqual(retryResult.idempotent, false);

        // Check user balance: MUST be 125 AZN (100 + 25 = 125, NOT 150!)
        const userAfterRetry = await User.findById(testUser._id);
        console.log('User balance after retry (must be 125):', userAfterRetry.walletBalance);
        assert.strictEqual(userAfterRetry.walletBalance, 125, 'Balance must be credited exactly 1x (125 AZN)');

        // Check transaction status: MUST be 'completed'
        const txDoc = await Transaction.findOne({ reference: paymentId });
        console.log('Transaction status:', txDoc?.status, 'balanceAfter:', txDoc?.balanceAfter);
        assert.strictEqual(txDoc?.status, 'completed');
        assert.strictEqual(txDoc?.balanceAfter, 125);

        // Check payment session status: MUST be 'completed'
        const paymentFinal = await PaymentSession.findById(payment._id);
        console.log('PaymentSession status (must be completed):', paymentFinal.status);
        assert.strictEqual(paymentFinal.status, 'completed');

        console.log('--- TEST 2: Second Retry Must Be Idempotent ---');
        const secondRetry = await completeTopUpPayment({ payment: paymentFinal, session: null });
        console.log('Second retry result idempotent:', secondRetry.idempotent);
        assert.strictEqual(secondRetry.idempotent, true);

        const userAfterSecondRetry = await User.findById(testUser._id);
        assert.strictEqual(userAfterSecondRetry.walletBalance, 125, 'Balance must not change on idempotent call');

        console.log('--- TEST 3: Parallel completeTopUpPayment Race Condition ---');
        const parallelPaymentId = 'pay_audit_parallel_' + Date.now();
        const parallelPayment = await PaymentSession.create({
            paymentId: parallelPaymentId,
            user: testUser._id,
            kind: 'wallet_topup',
            expectedAmount: 50,
            currency: 'AZN',
            status: 'pending',
            expiresAt: new Date(Date.now() + 600000)
        });

        // Call completeTopUpPayment twice in parallel with the same payment
        const [parallelRes1, parallelRes2] = await Promise.all([
            completeTopUpPayment({ payment: parallelPayment, session: null }),
            completeTopUpPayment({ payment: parallelPayment, session: null })
        ]);

        console.log('Parallel Call 1 idempotent:', parallelRes1.idempotent);
        console.log('Parallel Call 2 idempotent:', parallelRes2.idempotent);

        // One call must process (idempotent: false), one must be idempotent: true
        const parallelIdemps = [parallelRes1.idempotent, parallelRes2.idempotent];
        assert(parallelIdemps.includes(false), 'One call must process the top-up (idempotent: false)');
        assert(parallelIdemps.includes(true), 'The other parallel call must return idempotent: true');

        // Check user balance: 125 + exactly 50 = 175 AZN (NOT 225 AZN!)
        const userAfterParallel = await User.findById(testUser._id);
        console.log('User balance after parallel calls (must be exactly 175):', userAfterParallel.walletBalance);
        assert.strictEqual(userAfterParallel.walletBalance, 175, 'Balance must increase exactly once (+50 AZN)');

        // Check transaction count: MUST be exactly 1
        const parallelTxs = await Transaction.find({
            $or: [{ paymentId: parallelPaymentId }, { reference: parallelPaymentId }]
        });
        console.log('Transaction count for parallel payment (must be 1):', parallelTxs.length);
        assert.strictEqual(parallelTxs.length, 1, 'Transaction count must be exactly 1');
        assert.strictEqual(parallelTxs[0].status, 'completed', 'Transaction status must be completed');
        assert.strictEqual(parallelTxs[0].balanceAfter, 175, 'Transaction balanceAfter must be 175');

        // Check PaymentSession status: MUST be 'completed'
        const finalParallelPayment = await PaymentSession.findById(parallelPayment._id);
        console.log('PaymentSession status (must be completed):', finalParallelPayment.status);
        assert.strictEqual(finalParallelPayment.status, 'completed', 'PaymentSession status must be completed');

        console.log('=== ALL AUDIT-5 TESTS PASSED 100%! ===');
    } finally {
        await User.deleteOne({ _id: testUser._id });
        await PaymentSession.deleteMany({ user: testUser._id });
        await Transaction.deleteMany({ user: testUser._id });
        await mongoose.disconnect();
    }
}

runTest().catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
