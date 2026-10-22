require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const crypto = require('crypto');
const assert = require('assert');
const User = require('../models/User');
const PaymentSession = require('../models/PaymentSession');
const Transaction = require('../models/Transaction');
const CashOutRequest = require('../models/CashOutRequest');
const { handlePaymentCallback, requestCashOut } = require('../controllers/walletController');

async function runTest() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const testSecret = process.env.PAYMENT_WEBHOOK_SECRET;

    // 1. Setup test user
    const testUser = await User.create({
        name: 'RaceTest',
        lastName: 'User',
        email: 'race_test_' + Date.now() + '@example.com',
        password: 'password123',
        walletBalance: 0,
        walletReservedBalance: 0
    });

    const paymentId = 'pay_race_' + Date.now();
    const amount = 10;
    const currency = 'AZN';
    const status = 'paid';
    const providerReference = 'prov_ref_' + Date.now();

    const payment = await PaymentSession.create({
        paymentId,
        user: testUser._id,
        kind: 'wallet_topup',
        expectedAmount: amount,
        currency,
        status: 'pending',
        expiresAt: new Date(Date.now() + 600000)
    });

    const payload = paymentId + '.' + amount + '.' + currency + '.' + status + '.' + providerReference;
    const signature = crypto.createHmac('sha256', testSecret).update(payload).digest('hex');

    function makeCallbackReq(cbEventId) {
        return {
            params: { paymentId },
            body: { amount, currency, status, providerReference, eventId: cbEventId },
            get: (h) => (h.toLowerCase() === 'x-payment-signature' ? signature : ''),
            paymentSignature: signature
        };
    }

    function createMockRes() {
        const obj = {
            statusCode: 200,
            payload: null,
            status(c) { obj.statusCode = c; return obj; },
            json(d) { obj.payload = d; return obj; }
        };
        return obj;
    }

    console.log('--- Testing 2 Parallel Callbacks ---');
    const res1 = createMockRes();
    const res2 = createMockRes();

    // Fire 2 parallel callbacks
    await Promise.all([
        handlePaymentCallback(makeCallbackReq('event_1'), res1, (err) => { if (err) console.error(err); }),
        handlePaymentCallback(makeCallbackReq('event_2'), res2, (err) => { if (err) console.error(err); })
    ]);

    console.log('Callback 1 response:', res1.statusCode, res1.payload);
    console.log('Callback 2 response:', res2.statusCode, res2.payload);

    assert.strictEqual(res1.statusCode, 200, 'Callback 1 must return 200');
    assert.strictEqual(res2.statusCode, 200, 'Callback 2 must return 200');

    const updatedUser = await User.findById(testUser._id);
    console.log('User walletBalance after parallel callbacks:', updatedUser.walletBalance);
    assert.strictEqual(updatedUser.walletBalance, 10, 'Balance must be exactly +10 (NOT 20)');

    const txs = await Transaction.find({ reference: paymentId });
    console.log('Number of transactions created:', txs.length);
    assert.strictEqual(txs.length, 1, 'Only exactly 1 transaction must be created');

    console.log('--- Testing Cash-Out in Standalone Mongo ---');
    const cashOutReq = {
        user: updatedUser,
        body: {
            amount: 10,
            destination: 'card',
            accountHolderDetails: 'Payout recipient John Doe',
            idempotencyKey: 'idemp_cashout_' + Date.now()
        },
        header: (h) => (h.toLowerCase() === 'idempotency-key' ? 'idemp_cashout_' + Date.now() : ''),
        get: (h) => (h.toLowerCase() === 'idempotency-key' ? 'idemp_cashout_' + Date.now() : '')
    };
    const cashOutRes = createMockRes();
    await requestCashOut(cashOutReq, cashOutRes, (err) => { if (err) console.error(err); });

    console.log('CashOut response:', cashOutRes.statusCode, cashOutRes.payload);
    assert.strictEqual(cashOutRes.statusCode, 201, 'Cash-out must return 201');

    const userAfterCashOut = await User.findById(testUser._id);
    console.log('User balances after CashOut: walletBalance =', userAfterCashOut.walletBalance, ', reserved =', userAfterCashOut.walletReservedBalance);
    assert.strictEqual(userAfterCashOut.walletBalance, 0, 'Available balance should be 0');
    assert.strictEqual(userAfterCashOut.walletReservedBalance, 10, 'Reserved balance should be 10');

    // Cleanup
    await User.deleteOne({ _id: testUser._id });
    await PaymentSession.deleteOne({ _id: payment._id });
    await Transaction.deleteMany({ reference: paymentId });
    if (cashOutRes.payload?.cashOut?._id) {
        await Transaction.deleteMany({ reference: cashOutRes.payload.cashOut._id.toString() });
        await CashOutRequest.deleteOne({ _id: cashOutRes.payload.cashOut._id });
    }
    await mongoose.disconnect();

    console.log('=== ALL RACE & CASHOUT TESTS PASSED 100%! ===');
}

runTest().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
