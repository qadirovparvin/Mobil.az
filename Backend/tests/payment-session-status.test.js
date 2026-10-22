require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const PaymentSession = require('../models/PaymentSession');
const Transaction = require('../models/Transaction');
const payriffProvider = require('../services/payriffProvider');
const { getPaymentSessionStatus } = require('../controllers/walletController');

function createMockRes() {
    const obj = {
        statusCode: 200,
        payload: null,
        status(code) {
            obj.statusCode = code;
            return obj;
        },
        json(data) {
            obj.payload = data;
            return obj;
        }
    };
    return obj;
}

async function runTest() {
    console.log('--- TEST 1: payment-success.html does NOT contain fake PAY- ID and handles empty sessionId ---');
    const htmlPath = path.join(__dirname, '..', '..', 'Front end', 'payment-success.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Assert that fake PAY- generation was removed
    assert(!htmlContent.includes("'PAY-' + Math.floor"), 'Fake PAY- ID generation must be removed');
    assert(htmlContent.includes('Ödəniş tapılmadı'), 'Must contain Ödəniş tapılmadı when sessionId is missing');
    assert(htmlContent.includes('/wallet/payment-session/'), 'Must fetch /wallet/payment-session/ to reconcile');
    assert(htmlContent.includes('Ödəniş yoxlanılır...'), 'Default status must show Ödəniş yoxlanılır...');
    console.log('payment-success.html inspection passed!');

    console.log('--- TEST 2: cabinet.js does NOT have hydrateCurrentUser and reconciles status ---');
    const cabinetJsPath = path.join(__dirname, '..', '..', 'Front end', 'JS', 'cabinet.js');
    const cabinetJsContent = fs.readFileSync(cabinetJsPath, 'utf8');
    assert(!cabinetJsContent.includes('if (typeof hydrateCurrentUser === \'function\') hydrateCurrentUser();'), 'hydrateCurrentUser must be removed from checkPaymentReturn');
    assert(cabinetJsContent.includes('/wallet/payment-session/'), 'cabinet.js checkPaymentReturn must query payment-session status');
    console.log('cabinet.js inspection passed!');

    console.log('--- TEST 3: payriffProvider.getOrderStatus method exists and handles inputs ---');
    assert(typeof payriffProvider.getOrderStatus === 'function', 'getOrderStatus must be a function on payriffProvider');
    const nullStatus = await payriffProvider.getOrderStatus(null);
    assert.strictEqual(nullStatus, null, 'getOrderStatus(null) must return null');
    console.log('payriffProvider.getOrderStatus passed!');

    console.log('--- TEST 4: getPaymentSessionStatus controller endpoint ---');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const testUser = await User.create({
        name: 'Reconcile',
        lastName: 'User',
        email: 'reconcile_' + Date.now() + '@example.com',
        password: 'password123',
        walletBalance: 100
    });

    try {
        const payment = await PaymentSession.create({
            paymentId: 'pay_rec_' + Date.now(),
            user: testUser._id,
            kind: 'wallet_topup',
            expectedAmount: 45,
            currency: 'AZN',
            status: 'completed',
            providerOrderId: 'ord_rec_123',
            expiresAt: new Date(Date.now() + 600000)
        });

        const tx = await Transaction.create({
            user: testUser._id,
            amount: 45,
            type: 'deposit',
            description: 'Topup',
            reference: payment.paymentId,
            paymentId: payment.paymentId,
            balanceAfter: 145,
            status: 'completed'
        });

        // 4a. Existing session by _id
        const req1 = {
            params: { sessionId: payment._id.toString() },
            user: { _id: testUser._id, id: testUser._id.toString() }
        };
        const res1 = createMockRes();
        await getPaymentSessionStatus(req1, res1, () => {});
        assert.strictEqual(res1.statusCode, 200);
        assert.strictEqual(res1.payload.status, 'completed');
        assert.strictEqual(res1.payload.amount, 45);
        assert.strictEqual(res1.payload.sessionId.toString(), payment._id.toString());
        assert.strictEqual(res1.payload.txId.toString(), tx._id.toString());
        console.log('Session status lookup by _id passed:', res1.payload);

        // 4b. Existing session by paymentId
        const req2 = {
            params: { sessionId: payment.paymentId },
            user: { _id: testUser._id, id: testUser._id.toString() }
        };
        const res2 = createMockRes();
        await getPaymentSessionStatus(req2, res2, () => {});
        assert.strictEqual(res2.statusCode, 200);
        assert.strictEqual(res2.payload.status, 'completed');
        console.log('Session status lookup by paymentId passed:', res2.payload);

        // 4c. Non-existent session returns 404
        const req3 = {
            params: { sessionId: new mongoose.Types.ObjectId().toString() },
            user: { _id: testUser._id, id: testUser._id.toString() }
        };
        const res3 = createMockRes();
        await getPaymentSessionStatus(req3, res3, () => {});
        assert.strictEqual(res3.statusCode, 404);
        assert.strictEqual(res3.payload.error, 'Not found');
        console.log('Non-existent session correctly returned 404 Not found');

        console.log('=== ALL PAYMENT SESSION STATUS TESTS PASSED 100%! ===');
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
