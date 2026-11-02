const assert = require('assert');
const crypto = require('crypto');
const { connectTestDB, disconnectTestDB, assertSafeTestDB } = require('./setupTestDB');
const User = require('../models/User');
const PaymentSession = require('../models/PaymentSession');
const Transaction = require('../models/Transaction');
const { handlePaymentCallback } = require('../controllers/walletController');

function createMockRes() {
    const obj = {
        statusCode: 200,
        payload: null,
        status(c) { obj.statusCode = c; return obj; },
        json(d) { obj.payload = d; return obj; },
        send(d) { obj.payload = d; return obj; }
    };
    return obj;
}

const secret = 'test_webhook_secret_key';
process.env.PAYMENT_WEBHOOK_SECRET = secret;
process.env.PAYMENT_PROVIDER = 'mock';
process.env.ALLOW_MOCK_SIGNATURE = 'true';

function makeCallbackReq(paymentId, amount, status, eventId = 'evt_1', providerRef = '') {
    const ref = providerRef || `ref_${eventId}`;
    const payload = `${paymentId}.${amount}.AZN.${status}.${ref}`;
    const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const body = {
        amount,
        currency: 'AZN',
        status,
        eventId,
        providerReference: ref
    };
    return {
        params: { paymentId },
        body,
        rawBody: Buffer.from(JSON.stringify(body)),
        paymentSignature: sig,
        headers: {
            'x-payment-signature': sig,
            'x-webhook-signature': sig,
            'x-payriff-signature': sig
        },
        get: (h) => {
            const header = (h || '').toLowerCase();
            if (header === 'x-payment-signature' || header === 'x-webhook-signature' || header === 'x-payriff-signature') {
                return sig;
            }
            return '';
        }
    };
}

async function runTests() {
    await connectTestDB();
    assertSafeTestDB();
    console.log('Connected to isolated in-memory MongoDB');

    const testUser = await User.create({
        name: 'ReplayRace',
        lastName: 'Tester',
        email: 'replay_race_' + Date.now() + '@example.com',
        password: 'password123',
        walletBalance: 50,
        walletReservedBalance: 0
    });

    try {
        assertSafeTestDB();
        console.log('\n--- TEST 1: Same callback 2 dəfə -> balance 1 dəfə artmalı (50 -> 100) ---');
        await User.updateOne({ _id: testUser._id }, { $set: { walletBalance: 50 } });
        const paymentId1 = 'pay_replay_1_' + Date.now();
        await PaymentSession.create({
            paymentId: paymentId1,
            user: testUser._id,
            kind: 'wallet_topup',
            expectedAmount: 50,
            currency: 'AZN',
            status: 'pending',
            expiresAt: new Date(Date.now() + 600000)
        });

        const req1 = makeCallbackReq(paymentId1, 50, 'APPROVED', 'evt_replay_1');
        const res1 = createMockRes();
        let err1 = null;
        await handlePaymentCallback(req1, res1, (e) => { err1 = e; });

        assert(!err1, 'Callback 1 must not produce error');
        assert.strictEqual(res1.statusCode, 200, 'Callback 1 status must be 200');
        assert.strictEqual(res1.payload?.idempotent, false, 'First callback must be idempotent: false');

        let userDb = await User.findById(testUser._id);
        console.log('User balance after 1st callback:', userDb.walletBalance);
        assert.strictEqual(userDb.walletBalance, 100, 'User balance must be 50 + 50 = 100');

        // Call the exact same callback a 2nd time
        const res2 = createMockRes();
        let err2 = null;
        await handlePaymentCallback(req1, res2, (e) => { err2 = e; });

        assert(!err2, 'Callback 2 must not produce error');
        assert.strictEqual(res2.statusCode, 200, 'Callback 2 status must be 200');
        assert.strictEqual(res2.payload?.idempotent, true, 'Second callback must be idempotent: true');

        userDb = await User.findById(testUser._id);
        console.log('User balance after 2nd callback (must still be 100):', userDb.walletBalance);
        assert.strictEqual(userDb.walletBalance, 100, 'User balance must remain 100, not double incremented');

        const txCount1 = await Transaction.countDocuments({
            $or: [{ paymentId: paymentId1 }, { reference: paymentId1 }, { idempotencyKey: paymentId1 }],
            status: 'completed'
        });
        assert.strictEqual(txCount1, 1, 'Exactly 1 completed transaction must exist');
        console.log('✓ TEST 1 PASSED: Callback replay prevented, balance incremented only once!');

        assertSafeTestDB();
        console.log('\n--- TEST 2: Out-of-order FAILED sonra SUCCESS (Failed override) ---');
        await User.updateOne({ _id: testUser._id }, { $set: { walletBalance: 50 } });
        const paymentId2 = 'pay_ooo_failed_first_' + Date.now();
        await PaymentSession.create({
            paymentId: paymentId2,
            user: testUser._id,
            kind: 'wallet_topup',
            expectedAmount: 50,
            currency: 'AZN',
            status: 'pending',
            expiresAt: new Date(Date.now() + 600000)
        });

        // 1. FAILED callback arrives
        const reqFail = makeCallbackReq(paymentId2, 50, 'FAILED', 'evt_fail');
        const resFail = createMockRes();
        let errFail = null;
        await handlePaymentCallback(reqFail, resFail, (e) => { errFail = e; });

        assert(!errFail, 'Failed callback must not produce unhandled error');
        assert.strictEqual(resFail.statusCode, 200, 'Failed callback must return 200');
        assert.strictEqual(resFail.payload?.failed, true, 'Payload must indicate failed: true');

        let sessionDb = await PaymentSession.findOne({ paymentId: paymentId2 });
        assert.strictEqual(sessionDb.status, 'failed', 'PaymentSession status must be failed after FAILED callback');

        userDb = await User.findById(testUser._id);
        console.log('User balance after FAILED callback (must be 50):', userDb.walletBalance);
        assert.strictEqual(userDb.walletBalance, 50, 'User balance must remain 50');

        // 2. SUCCESS / APPROVED callback arrives (out-of-order recovery)
        const reqSuccess = makeCallbackReq(paymentId2, 50, 'APPROVED', 'evt_success');
        const resSuccess = createMockRes();
        let errSuccess = null;
        await handlePaymentCallback(reqSuccess, resSuccess, (e) => { errSuccess = e; });

        assert(!errSuccess, 'Success callback after fail must not produce error');
        assert.strictEqual(resSuccess.statusCode, 200, 'Success callback status must be 200');

        sessionDb = await PaymentSession.findOne({ paymentId: paymentId2 });
        console.log('PaymentSession status after APPROVED callback:', sessionDb.status);
        assert.strictEqual(sessionDb.status, 'completed', 'PaymentSession status must be overridden to completed');
        assert.strictEqual(sessionDb.walletCredited, true, 'PaymentSession walletCredited must be true');

        userDb = await User.findById(testUser._id);
        console.log('User balance after APPROVED callback (must be 100):', userDb.walletBalance);
        assert.strictEqual(userDb.walletBalance, 100, 'User balance must be credited 50 -> 100 after failed override');
        console.log('✓ TEST 2 PASSED: Out-of-order FAILED then SUCCESS successfully overridden and credited!');

        assertSafeTestDB();
        console.log('\n--- TEST 3: Out-of-order SUCCESS sonra FAILED (Late failure ignore) ---');
        await User.updateOne({ _id: testUser._id }, { $set: { walletBalance: 50 } });
        const paymentId3 = 'pay_ooo_success_first_' + Date.now();
        await PaymentSession.create({
            paymentId: paymentId3,
            user: testUser._id,
            kind: 'wallet_topup',
            expectedAmount: 50,
            currency: 'AZN',
            status: 'pending',
            expiresAt: new Date(Date.now() + 600000)
        });

        // 1. SUCCESS arrives first
        const reqSuccess3 = makeCallbackReq(paymentId3, 50, 'SUCCESS', 'evt_succ_first');
        const resSuccess3 = createMockRes();
        let errSuccess3 = null;
        await handlePaymentCallback(reqSuccess3, resSuccess3, (e) => { errSuccess3 = e; });

        assert(!errSuccess3, 'Initial success callback must not error');
        assert.strictEqual(resSuccess3.statusCode, 200);

        sessionDb = await PaymentSession.findOne({ paymentId: paymentId3 });
        assert.strictEqual(sessionDb.status, 'completed', 'Session must be completed');

        userDb = await User.findById(testUser._id);
        console.log('User balance after SUCCESS callback:', userDb.walletBalance);
        assert.strictEqual(userDb.walletBalance, 100, 'User balance must be 100');

        // 2. Late FAILED arrives
        const reqLateFail = makeCallbackReq(paymentId3, 50, 'FAILED', 'evt_late_fail');
        const resLateFail = createMockRes();
        let errLateFail = null;
        await handlePaymentCallback(reqLateFail, resLateFail, (e) => { errLateFail = e; });

        assert(!errLateFail, 'Late fail must not error');
        assert.strictEqual(resLateFail.statusCode, 200);
        console.log('Late fail response payload:', resLateFail.payload);
        assert(resLateFail.payload?.ignoredLateFailure || resLateFail.payload?.idempotent, 'Late fail must be ignored / idempotent');

        sessionDb = await PaymentSession.findOne({ paymentId: paymentId3 });
        assert.strictEqual(sessionDb.status, 'completed', 'Session must remain completed despite late failure');

        userDb = await User.findById(testUser._id);
        console.log('User balance after late FAILED callback (must remain 100):', userDb.walletBalance);
        assert.strictEqual(userDb.walletBalance, 100, 'User balance must not be deducted by late failure');
        console.log('✓ TEST 3 PASSED: Late failure ignored, balance and completed state intact!');

        assertSafeTestDB();
        console.log('\n--- TEST 4: Race condition: 2 workers simultaneously ---');
        await User.updateOne({ _id: testUser._id }, { $set: { walletBalance: 50 } });
        const paymentId4 = 'pay_race_worker_' + Date.now();
        await PaymentSession.create({
            paymentId: paymentId4,
            user: testUser._id,
            kind: 'wallet_topup',
            expectedAmount: 50,
            currency: 'AZN',
            status: 'pending',
            expiresAt: new Date(Date.now() + 600000)
        });

        const reqWorker1 = makeCallbackReq(paymentId4, 50, 'APPROVED', 'evt_w1');
        const reqWorker2 = makeCallbackReq(paymentId4, 50, 'APPROVED', 'evt_w2');
        const resW1 = createMockRes();
        const resW2 = createMockRes();
        let errW1 = null;
        let errW2 = null;

        await Promise.all([
            handlePaymentCallback(reqWorker1, resW1, (e) => { errW1 = e; }),
            handlePaymentCallback(reqWorker2, resW2, (e) => { errW2 = e; })
        ]);

        console.log('Worker 1 response:', { status: resW1.statusCode, payload: resW1.payload, err: errW1 });
        console.log('Worker 2 response:', { status: resW2.statusCode, payload: resW2.payload, err: errW2 });

        assert(!errW1, 'Worker 1 must not produce error');
        assert(!errW2, 'Worker 2 must not produce error');
        assert.strictEqual(resW1.statusCode, 200);
        assert.strictEqual(resW2.statusCode, 200);

        const idempStates = [resW1.payload?.idempotent, resW2.payload?.idempotent];
        assert(idempStates.includes(false), 'One worker must complete payment (idempotent: false)');
        assert(idempStates.includes(true), 'Other worker must receive idempotent: true');

        userDb = await User.findById(testUser._id);
        console.log('User balance after race (must be 100):', userDb.walletBalance);
        assert.strictEqual(userDb.walletBalance, 100, 'Balance must be 50 + 50 = 100 (incremented exactly once, NOT 150)');

        const txCount4 = await Transaction.countDocuments({
            $or: [{ paymentId: paymentId4 }, { reference: paymentId4 }, { idempotencyKey: paymentId4 }],
            status: 'completed'
        });
        assert.strictEqual(txCount4, 1, 'Exactly 1 completed transaction must exist');
        console.log('✓ TEST 4 PASSED: Race between 2 workers handled cleanly, balance incremented exactly once!');

        console.log('\n🎉 ALL PAYRIFF CALLBACK REPLAY, OUT-OF-ORDER & RACE TESTS PASSED 100%!');
    } finally {
        await User.deleteOne({ _id: testUser._id });
        await PaymentSession.deleteMany({ user: testUser._id });
        await Transaction.deleteMany({ user: testUser._id });
        await disconnectTestDB();
    }
}

runTests().catch(async (err) => {
    console.error('Test execution failed:', err);
    await disconnectTestDB().catch(() => {});
    process.exitCode = 1;
});
