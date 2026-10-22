require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const assert = require('assert');
const User = require('../models/User');
const PaymentSession = require('../models/PaymentSession');
const Transaction = require('../models/Transaction');
const { handlePaymentCallback, _test } = require('../controllers/walletController');
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

    const testUser = await User.create({
        name: 'AtomicClaim',
        lastName: 'Tester',
        email: 'atomic_claim_' + Date.now() + '@example.com',
        password: 'password123',
        walletBalance: 50,
        walletReservedBalance: 0
    });

    try {
        console.log('--- TEST 1: Two Parallel completeTopUpPayment with same paymentId ---');
        const paymentId = 'pay_atomic_' + Date.now();
        const topUpAmount = 25;

        const paymentDoc = await PaymentSession.create({
            paymentId,
            user: testUser._id,
            kind: 'wallet_topup',
            expectedAmount: topUpAmount,
            currency: 'AZN',
            status: 'pending',
            expiresAt: new Date(Date.now() + 600000)
        });

        // Run 2 parallel completeTopUpPayment calls simultaneously
        const [res1, res2] = await Promise.all([
            completeTopUpPayment({ payment: paymentDoc, session: null, eventId: 'evt_alpha' }),
            completeTopUpPayment({ payment: paymentDoc, session: null, eventId: 'evt_beta' })
        ]);

        console.log('Call 1 result:', { idempotent: res1.idempotent, hasTx: Boolean(res1.tx) });
        console.log('Call 2 result:', { idempotent: res2.idempotent, hasTx: Boolean(res2.tx) });

        const idempFlags = [res1.idempotent, res2.idempotent];
        assert(idempFlags.includes(false), 'One of the parallel calls must complete the top-up (idempotent: false)');
        assert(idempFlags.includes(true), 'The other parallel call must return idempotent: true');

        // Check user balance: initial 50 + exactly 25 = 75 (NOT 100!)
        const updatedUser = await User.findById(testUser._id);
        console.log('Final user wallet balance (must be exactly 75):', updatedUser.walletBalance);
        assert.strictEqual(updatedUser.walletBalance, 75, 'User balance must increase exactly 1x (75 AZN)');

        // Check transaction count in DB
        const txList = await Transaction.find({
            $or: [{ paymentId }, { reference: paymentId }]
        });
        console.log('Number of transactions in DB (must be exactly 1):', txList.length);
        assert.strictEqual(txList.length, 1, 'Exactly 1 Transaction must exist');
        assert.strictEqual(txList[0].status, 'completed', 'Transaction status must be completed');
        assert.strictEqual(txList[0].balanceAfter, 75, 'Transaction balanceAfter must be 75');

        // Check PaymentSession status
        const finalPayment = await PaymentSession.findById(paymentDoc._id);
        console.log('Final PaymentSession status (must be completed):', finalPayment.status);
        assert.strictEqual(finalPayment.status, 'completed', 'PaymentSession status must be completed');

        console.log('--- TEST 2: Two Parallel handlePaymentCallback requests via mock HTTP ---');
        const paymentId2 = 'pay_cb_atomic_' + Date.now();
        const paymentDoc2 = await PaymentSession.create({
            paymentId: paymentId2,
            user: testUser._id,
            kind: 'wallet_topup',
            expectedAmount: 30,
            currency: 'AZN',
            status: 'pending',
            expiresAt: new Date(Date.now() + 600000)
        });

        const crypto = require('crypto');
        const secret = process.env.PAYMENT_WEBHOOK_SECRET || 'test_secret_key';
        process.env.PAYMENT_WEBHOOK_SECRET = secret;

        const makeCallbackReq = (evt) => {
            const providerRef = 'ref_' + evt;
            const payload = `${paymentId2}.30.AZN.paid.${providerRef}`;
            const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
            return {
                params: { paymentId: paymentId2 },
                body: {
                    amount: 30,
                    currency: 'AZN',
                    status: 'paid',
                    eventId: evt,
                    providerReference: providerRef
                },
                paymentSignature: sig,
                get: (h) => (h.toLowerCase() === 'x-payment-signature' ? sig : '')
            };
        };

        const httpRes1 = createMockRes();
        const httpRes2 = createMockRes();
        let httpErr1 = null;
        let httpErr2 = null;

        await Promise.all([
            handlePaymentCallback(makeCallbackReq('evt_1'), httpRes1, (e) => { httpErr1 = e; }),
            handlePaymentCallback(makeCallbackReq('evt_2'), httpRes2, (e) => { httpErr2 = e; })
        ]);

        console.log('HTTP Callback 1:', { status: httpRes1.statusCode, payload: httpRes1.payload, err: httpErr1 });
        console.log('HTTP Callback 2:', { status: httpRes2.statusCode, payload: httpRes2.payload, err: httpErr2 });

        assert(!httpErr1, 'HTTP callback 1 must not produce error');
        assert(!httpErr2, 'HTTP callback 2 must not produce error');
        assert.strictEqual(httpRes1.statusCode, 200);
        assert.strictEqual(httpRes2.statusCode, 200);

        const httpIdemps = [httpRes1.payload?.idempotent, httpRes2.payload?.idempotent];
        assert(httpIdemps.includes(false), 'One HTTP callback must be idempotent: false');
        assert(httpIdemps.includes(true), 'One HTTP callback must be idempotent: true');

        // Check user balance: 75 + 30 = 105 (NOT 135!)
        const userAfterHttp = await User.findById(testUser._id);
        console.log('Final user wallet balance after HTTP callbacks (must be 105):', userAfterHttp.walletBalance);
        assert.strictEqual(userAfterHttp.walletBalance, 105, 'Balance must be exactly 75 + 30 = 105 AZN');

        console.log('=== ALL ATOMIC CLAIM TESTS PASSED 100%! ===');
    } finally {
        await User.deleteOne({ _id: testUser._id });
        await PaymentSession.deleteMany({ user: testUser._id });
        await Transaction.deleteMany({ user: testUser._id });
        await mongoose.disconnect();
    }
}

runTest().catch((err) => {
    console.error('Test failed with error:', err);
    process.exit(1);
});
