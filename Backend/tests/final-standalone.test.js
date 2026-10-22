require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const assert = require('assert');
const crypto = require('crypto');
const User = require('../models/User');
const PaymentSession = require('../models/PaymentSession');
const Transaction = require('../models/Transaction');
const CashOutRequest = require('../models/CashOutRequest');
const { handlePaymentCallback, requestCashOut, _test } = require('../controllers/walletController');
const { completeTopUpPayment } = _test;

function createMockRes() {
    const obj = {
        statusCode: 200,
        payload: null,
        status(c) { obj.statusCode = c; return obj; },
        json(d) { obj.payload = d; return obj; }
    };
    return obj;
}

async function runTest() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const testSecret = process.env.PAYMENT_WEBHOOK_SECRET;

    // Setup test user
    const testUser = await User.create({
        name: 'FinalStandalone',
        lastName: 'User',
        email: 'final_standalone_' + Date.now() + '@example.com',
        password: 'password123',
        walletBalance: 50,
        walletReservedBalance: 0
    });

    try {
        console.log('--- TEST 1: completeTopUpPayment Failure Recovery (status stays pending) ---');
        // Create a dummy pending payment with a non-existent user ID to force $inc to fail
        const nonExistentUserId = new mongoose.Types.ObjectId();
        const failPayment = await PaymentSession.create({
            paymentId: 'pay_fail_' + Date.now(),
            user: nonExistentUserId,
            kind: 'wallet_topup',
            expectedAmount: 10,
            currency: 'AZN',
            status: 'pending',
            expiresAt: new Date(Date.now() + 600000)
        });

        let failErr = null;
        try {
            await completeTopUpPayment({ payment: failPayment, session: null });
        } catch (e) {
            failErr = e;
        }
        console.log('Expected failure captured:', failErr?.message);
        assert(failErr, 'completeTopUpPayment must fail when user does not exist');

        // Check PaymentSession status in DB -> MUST still be 'pending'
        const paymentAfterFail = await PaymentSession.findById(failPayment._id);
        console.log('Payment status after failure:', paymentAfterFail.status);
        assert.strictEqual(paymentAfterFail.status, 'pending', 'PaymentSession status must remain pending on failure');

        // Check no residual Transaction exists
        const txCount = await Transaction.countDocuments({ reference: failPayment.paymentId });
        console.log('Residual transaction count after failure:', txCount);
        assert.strictEqual(txCount, 0, 'No transaction should remain on failure');

        // Now fix the user and retry -> must succeed!
        failPayment.user = testUser._id;
        await failPayment.save();

        const retryResult = await completeTopUpPayment({ payment: failPayment, session: null });
        console.log('Retry succeeded! Result idempotent:', retryResult.idempotent);
        assert.strictEqual(retryResult.idempotent, false);

        const paymentAfterSuccess = await PaymentSession.findById(failPayment._id);
        console.log('Payment status after successful retry:', paymentAfterSuccess.status);
        assert.strictEqual(paymentAfterSuccess.status, 'completed', 'Payment status must be completed after success');

        const userAfterTopUp = await User.findById(testUser._id);
        console.log('User walletBalance after successful top-up retry:', userAfterTopUp.walletBalance);
        assert.strictEqual(userAfterTopUp.walletBalance, 60, 'Balance must be 50 + 10 = 60');

        console.log('--- TEST 2: Two Parallel Cash-Outs With Same IdempotencyKey (1x reduction) ---');
        // Initial state: user has 60 balance, 0 reserved
        const cashOutIdempKey = 'idemp_parallel_cashout_' + Date.now();
        const makeCashOutReq = () => ({
            user: userAfterTopUp,
            body: {
                amount: 20,
                destination: 'card',
                accountHolderDetails: 'Recipient John Doe, token tok_payout_123',
                idempotencyKey: cashOutIdempKey
            },
            get: (h) => (h.toLowerCase() === 'idempotency-key' ? cashOutIdempKey : '')
        });

        const res1 = createMockRes();
        const res2 = createMockRes();
        let err1 = null;
        let err2 = null;

        await Promise.all([
            requestCashOut(makeCashOutReq(), res1, (e) => { err1 = e; }),
            requestCashOut(makeCashOutReq(), res2, (e) => { err2 = e; })
        ]);

        console.log('CashOut 1 response:', res1.statusCode, res1.payload?.message, 'idempotent:', res1.payload?.idempotent, 'err1:', err1);
        console.log('CashOut 2 response:', res2.statusCode, res2.payload?.message, 'idempotent:', res2.payload?.idempotent, 'err2:', err2);

        assert(!err1, 'CashOut 1 must not error');
        assert(!err2, 'CashOut 2 must not error');

        const statusCodes = [res1.statusCode, res2.statusCode].sort();
        console.log('Status codes:', statusCodes);
        assert.deepStrictEqual(statusCodes, [200, 201], 'One must be 201 (created), other must be 200 (idempotent duplicate)');

        const idempotents = [Boolean(res1.payload?.idempotent), Boolean(res2.payload?.idempotent)];
        console.log('Idempotent flags:', idempotents);
        assert(idempotents.includes(true), 'At least one response must be idempotent: true');
        assert(idempotents.includes(false), 'One response must be idempotent: false');

        // Check user balance: MUST be 60 - 20 = 40 (NOT 60 - 40 = 20!)
        const userFinal = await User.findById(testUser._id);
        console.log('User final walletBalance:', userFinal.walletBalance, 'reserved:', userFinal.walletReservedBalance);
        assert.strictEqual(userFinal.walletBalance, 40, 'Balance must be reduced by 1x (60 - 20 = 40, NOT 20!)');
        assert.strictEqual(userFinal.walletReservedBalance, 20, 'Reserved balance must be exactly 20');

        // Verify only 1 CashOutRequest was created in DB
        const cashOutCount = await CashOutRequest.countDocuments({ user: testUser._id, idempotencyKey: cashOutIdempKey });
        console.log('CashOutRequest count in DB:', cashOutCount);
        assert.strictEqual(cashOutCount, 1, 'Only exactly 1 CashOutRequest document must exist');

        console.log('=== ALL FINAL STANDALONE TESTS PASSED 100%! ===');
    } finally {
        await User.deleteOne({ _id: testUser._id });
        await PaymentSession.deleteMany({ user: testUser._id });
        await Transaction.deleteMany({ user: testUser._id });
        await CashOutRequest.deleteMany({ user: testUser._id });
        await mongoose.disconnect();
    }
}

runTest().catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
