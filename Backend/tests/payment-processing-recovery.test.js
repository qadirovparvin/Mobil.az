/**
 * Backend/tests/payment-processing-recovery.test.js
 * Verification for: TASK: FIX-payment-processing-recovery
 * Test: processing 15 dəq qalan → bərpa, $inc 2x yox
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const assert = require('assert');
const User = require('../models/User');
const PaymentSession = require('../models/PaymentSession');
const Transaction = require('../models/Transaction');
const payriffProvider = require('../services/payriffProvider');
const walletController = require('../controllers/walletController');
const { reconcilePendingPayments } = require('../jobs/paymentReconciliation');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mobilaz');
    console.log('Connected to MongoDB');

    const testUser = await User.create({
        name: 'ProcessingRecovery',
        lastName: 'Tester',
        email: `proc_rec_${Date.now()}@example.com`,
        password: 'password123',
        walletBalance: 50
    });

    const paymentId = `pay_stuck_${Date.now()}`;
    const amount = 20;

    // Create PaymentSession that has been stuck in 'processing' for 15 minutes
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const stuckPayment = await PaymentSession.create({
        paymentId,
        user: testUser._id,
        kind: 'wallet_topup',
        expectedAmount: amount,
        currency: 'AZN',
        status: 'processing',
        provider: 'payriff',
        providerOrderId: `ord_${paymentId}`,
        updatedAt: fifteenMinutesAgo,
        createdAt: fifteenMinutesAgo,
        expiresAt: new Date(Date.now() + 600000)
    });

    // Mock Payriff provider status to return APPROVED
    const origGetStatus = payriffProvider.getStatus;
    payriffProvider.getStatus = async (orderId) => {
        if (orderId === `ord_${paymentId}`) {
            return { status: 'APPROVED' };
        }
        return null;
    };

    try {
        console.log('--- TEST: Processing 15 minutes stuck payment recovery ---');
        console.log('Initial user wallet balance:', testUser.walletBalance);
        console.log('Initial payment status:', stuckPayment.status);

        // 1. Run reconciliation job
        const recResult = await reconcilePendingPayments();
        console.log('Reconciliation result count:', recResult.count);
        assert.ok(recResult.count >= 1, 'Reconciliation must recover at least 1 payment');

        // Check user balance: 50 + 20 = 70
        const updatedUser = await User.findById(testUser._id);
        console.log('User wallet balance after recovery:', updatedUser.walletBalance);
        assert.strictEqual(updatedUser.walletBalance, 70, 'Balance must be exactly 70');

        // Check PaymentSession status
        const recoveredPayment = await PaymentSession.findById(stuckPayment._id);
        console.log('Payment status after recovery:', recoveredPayment.status);
        assert.strictEqual(recoveredPayment.status, 'completed', 'Payment status must be completed');

        // Check Transaction in DB
        const txList = await Transaction.find({
            $or: [{ paymentId }, { reference: paymentId }]
        });
        console.log('Transactions created:', txList.length);
        assert.strictEqual(txList.length, 1, 'Exactly 1 Transaction must exist');
        assert.strictEqual(txList[0].status, 'completed', 'Transaction status must be completed');
        assert.strictEqual(txList[0].balanceAfter, 70, 'Transaction balanceAfter must be 70');

        console.log('--- TEST: Second run check ($inc 2x yox) ---');
        // 2. Call completeTopUpPayment again directly or through reconciliation
        const rerunResult = await walletController.completeTopUpPayment({
            payment: recoveredPayment,
            session: null,
            transaction: null
        });
        console.log('Rerun result idempotent:', rerunResult.idempotent);
        assert.strictEqual(rerunResult.idempotent, true, 'Rerun must be idempotent');

        // Check balance again: MUST STILL BE 70 (NOT 90!)
        const finalUser = await User.findById(testUser._id);
        console.log('User wallet balance after second call (must NOT be 2x):', finalUser.walletBalance);
        assert.strictEqual(finalUser.walletBalance, 70, 'User balance must NOT be incremented twice ($inc 2x yox)');

        // Still exactly 1 transaction
        const finalTxList = await Transaction.find({
            $or: [{ paymentId }, { reference: paymentId }]
        });
        assert.strictEqual(finalTxList.length, 1, 'Still exactly 1 transaction');

        console.log('\n🎉 ALL PAYMENT PROCESSING RECOVERY TESTS PASSED 100%!');
    } finally {
        payriffProvider.getStatus = origGetStatus;
        await User.deleteOne({ _id: testUser._id });
        await PaymentSession.deleteOne({ _id: stuckPayment._id });
        await Transaction.deleteMany({ reference: paymentId });
        await mongoose.disconnect();
    }
}

run().catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
