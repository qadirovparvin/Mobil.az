require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const assert = require('assert');
const axios = require('axios');
const User = require('../models/User');
const PaymentSession = require('../models/PaymentSession');
const walletController = require('../controllers/walletController');
const { topUp } = walletController;

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
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const prevProvider = process.env.PAYMENT_PROVIDER;
    const prevSecret = process.env.PAYRIFF_SECRET;
    const prevOrigin = process.env.API_PUBLIC_ORIGIN;

    process.env.PAYMENT_PROVIDER = 'payriff';
    process.env.PAYRIFF_SECRET = 'test_secret_live_payriff_key';
    process.env.API_PUBLIC_ORIGIN = 'https://api.mobilim.az';

    const testUser = await User.create({
        name: 'PayriffOrder',
        lastName: 'Tester',
        email: 'payriff_order_' + Date.now() + '@example.com',
        password: 'password123',
        walletBalance: 0
    });

    // Mock axios.post to intercept Payriff order creation
    const originalPost = axios.post;
    let payriffCallCount = 0;
    const generatedOrderIds = [];

    axios.post = async (url, data, config) => {
        if (url.includes('payriff.com')) {
            payriffCallCount++;
            const orderId = `payriff_ord_${Date.now()}_${payriffCallCount}`;
            generatedOrderIds.push(orderId);
            return {
                data: {
                    payload: {
                        orderId,
                        paymentUrl: `https://payriff.com/checkout/${orderId}`,
                        transactionId: `tx_${orderId}`
                    }
                }
            };
        }
        return originalPost(url, data, config);
    };

    try {
        console.log('--- TEST 1: Initial topUp creates exactly 1 Payriff order and saves providerOrderId ---');
        const idempotencyKey = 'payriff_idemp_' + Date.now();
        const req1 = {
            user: testUser,
            body: {
                amount: 35,
                currency: 'AZN',
                idempotencyKey
            },
            get: (h) => (h.toLowerCase() === 'idempotency-key' ? idempotencyKey : '')
        };
        const res1 = createMockRes();
        let err1 = null;

        await topUp(req1, res1, (e) => { err1 = e; });
        assert(!err1, 'topUp 1 must not throw error');
        assert.strictEqual(res1.statusCode, 202);
        assert.strictEqual(payriffCallCount, 1, 'Payriff API must be called exactly once for new session');

        const initialOrderId = generatedOrderIds[0];
        console.log('Created Payriff order ID:', initialOrderId);
        console.log('Returned payload checkoutUrl:', res1.payload?.checkoutUrl);
        assert(res1.payload?.checkoutUrl.includes(initialOrderId), 'checkoutUrl must contain Payriff orderId');
        assert.strictEqual(res1.payload?.providerOrderId, initialOrderId);

        // Verify PaymentSession in DB
        const savedSession = await PaymentSession.findOne({ idempotencyKey });
        assert(savedSession, 'PaymentSession must exist in DB');
        assert.strictEqual(savedSession.providerOrderId, initialOrderId, 'providerOrderId must be saved in DB');
        assert.strictEqual(savedSession.providerCheckoutUrl, res1.payload?.checkoutUrl, 'providerCheckoutUrl must be saved in DB');
        assert.strictEqual(savedSession.providerOrderStatus, 'CREATED');

        console.log('--- TEST 2: Second topUp with same idempotencyKey reuses order without calling Payriff ---');
        const req2 = {
            user: testUser,
            body: {
                amount: 35,
                currency: 'AZN',
                idempotencyKey
            },
            get: (h) => (h.toLowerCase() === 'idempotency-key' ? idempotencyKey : '')
        };
        const res2 = createMockRes();
        let err2 = null;

        await topUp(req2, res2, (e) => { err2 = e; });
        assert(!err2, 'topUp 2 must not throw error');
        assert.strictEqual(res2.statusCode, 200);
        assert.strictEqual(res2.payload?.idempotent, true);
        assert.strictEqual(res2.payload?.checkoutUrl, res1.payload?.checkoutUrl);
        assert.strictEqual(res2.payload?.providerOrderId, initialOrderId);

        // Crucial assertion: Payriff API was NOT called again
        console.log('Payriff call count after retry (must be 1):', payriffCallCount);
        assert.strictEqual(payriffCallCount, 1, 'Payriff API must NOT be called a second time (0 duplicate orders)');

        console.log('--- TEST 3: Calling topUp with sessionId directly returns existing providerCheckoutUrl ---');
        const req3 = {
            user: testUser,
            body: {
                sessionId: savedSession._id.toString()
            },
            get: () => ''
        };
        const res3 = createMockRes();
        let err3 = null;

        await topUp(req3, res3, (e) => { err3 = e; });
        assert(!err3, 'topUp 3 with sessionId must not throw error');
        assert.strictEqual(res3.statusCode, 200);
        assert.strictEqual(res3.payload?.idempotent, true);
        assert.strictEqual(res3.payload?.checkoutUrl, savedSession.providerCheckoutUrl);
        assert.strictEqual(res3.payload?.sessionId?.toString(), savedSession._id.toString());
        assert.strictEqual(payriffCallCount, 1, 'Payriff call count must remain 1');

        console.log('--- TEST 4: Calling topUp with paymentId as sessionId returns existing providerCheckoutUrl ---');
        const req4 = {
            user: testUser,
            body: {
                sessionId: savedSession.paymentId
            },
            get: () => ''
        };
        const res4 = createMockRes();
        let err4 = null;

        await topUp(req4, res4, (e) => { err4 = e; });
        assert(!err4, 'topUp 4 with paymentId must not throw error');
        assert.strictEqual(res4.statusCode, 200);
        assert.strictEqual(res4.payload?.checkoutUrl, savedSession.providerCheckoutUrl);
        assert.strictEqual(payriffCallCount, 1, 'Payriff call count must remain 1');

        // Check total orders in DB with this providerOrderId: must be exactly 1
        const countOrders = await PaymentSession.countDocuments({ providerOrderId: initialOrderId });
        console.log('PaymentSessions in DB with providerOrderId (must be 1):', countOrders);
        assert.strictEqual(countOrders, 1, 'Exactly 1 PaymentSession must have this providerOrderId');

        console.log('=== ALL PAYRIFF DUPLICATE ORDER TESTS PASSED 100%! ===');
    } finally {
        axios.post = originalPost;
        if (prevProvider !== undefined) process.env.PAYMENT_PROVIDER = prevProvider; else delete process.env.PAYMENT_PROVIDER;
        if (prevSecret !== undefined) process.env.PAYRIFF_SECRET = prevSecret; else delete process.env.PAYRIFF_SECRET;
        if (prevOrigin !== undefined) process.env.API_PUBLIC_ORIGIN = prevOrigin; else delete process.env.API_PUBLIC_ORIGIN;

        await User.deleteOne({ _id: testUser._id });
        await PaymentSession.deleteMany({ user: testUser._id });
        await mongoose.disconnect();
    }
}

runTest().catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
