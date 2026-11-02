const assert = require('assert');
const crypto = require('crypto');

const previousProvider = process.env.PAYMENT_PROVIDER;
const previousSecret = process.env.PAYRIFF_SECRET;
const previousPayriffWebhookSecret = process.env.PAYRIFF_WEBHOOK_SECRET;
const previousSignatureHeader = process.env.PAYRIFF_SIGNATURE_HEADER;
const previousWebhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
const previousOrigin = process.env.API_PUBLIC_ORIGIN;
const previousAllowMock = process.env.ALLOW_MOCK_SIGNATURE;
const previousNodeEnv = process.env.NODE_ENV;
process.env.PAYMENT_PROVIDER = 'payriff';
process.env.PAYRIFF_SECRET = 'payriff-api-test-secret-only';
process.env.PAYRIFF_WEBHOOK_SECRET = 'payriff-webhook-test-secret-only';
process.env.PAYRIFF_SIGNATURE_HEADER = 'x-payriff-signature';
process.env.PAYMENT_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.API_PUBLIC_ORIGIN = 'https://api.mobilim.az';
process.env.NODE_ENV = 'test';

try {
    const payriffProvider = require('../services/payriffProvider');
    const paymentFactory = require('../services/paymentFactory');
    const walletController = require('../controllers/walletController');
    const { verifyProviderSignature: verifyControllerSignature, resolveCheckoutUrl, createProviderCheckoutUrl, paymentResponse } = walletController._test;

    assert.strictEqual(paymentFactory.getProvider().name, 'payriff');
    const configuredSecret = process.env.PAYRIFF_SECRET;
    delete process.env.PAYRIFF_SECRET;
    assert.throws(() => paymentFactory.getProvider(), /Live provider secret missing/);
    process.env.PAYRIFF_SECRET = configuredSecret;

    const documentedCreateOrderPayload = {
        amount: 0.01,
        language: 'EN',
        currency: 'AZN',
        description: 'Test purchase 0.01 azn',
        callbackUrl: 'https://example.com/callback',
        cardSave: false,
        operation: 'PURCHASE',
        metadata: { key: 'value' }
    };
    const rawBody = Buffer.from(JSON.stringify(documentedCreateOrderPayload));
    const signature = crypto.createHmac('sha256', process.env.PAYRIFF_WEBHOOK_SECRET).update(rawBody).digest('hex');

    assert.strictEqual(payriffProvider.verifySignature(rawBody, signature, process.env.PAYRIFF_WEBHOOK_SECRET), true);
    assert.strictEqual(payriffProvider.verifySignature(rawBody, signature, process.env.PAYRIFF_SECRET), false);
    const callbackRequest = {
        rawBody,
        get: (name) => name.toLowerCase() === process.env.PAYRIFF_SIGNATURE_HEADER ? signature : ''
    };
    assert.strictEqual(verifyControllerSignature(callbackRequest, {}), true);
    assert.strictEqual(payriffProvider.verifySignature(rawBody, `${signature.slice(0, -1)}0`, process.env.PAYRIFF_WEBHOOK_SECRET), false);
    assert.strictEqual(payriffProvider.verifySignature(rawBody, '', process.env.PAYRIFF_WEBHOOK_SECRET), false);
    assert.strictEqual(payriffProvider.verifySignature(null, signature, process.env.PAYRIFF_WEBHOOK_SECRET), false);

    const missingHeaderRequest = { rawBody, get: () => '' };
    const configuredHeader = process.env.PAYRIFF_SIGNATURE_HEADER;
    process.env.PAYRIFF_SIGNATURE_HEADER = '';
    assert.strictEqual(verifyControllerSignature(missingHeaderRequest, {}), false);
    process.env.PAYRIFF_SIGNATURE_HEADER = configuredHeader;

    // TEST: prod + mock signature => should fail (security)
    console.log('--- TEST: prod + mock signature => should fail (security) ---');
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_MOCK_SIGNATURE = 'true';
    assert.strictEqual(payriffProvider.verifySignature(rawBody, 'mock-sandbox-signature'), false, 'payriffProvider must reject mock signature in production');
    const mockCallbackReq = {
        rawBody,
        get: (name) => name === 'x-payment-signature' ? 'mock-sandbox-signature' : ''
    };
    assert.strictEqual(verifyControllerSignature(mockCallbackReq, {}), false, 'Controller must reject mock signature in production');

    // TEST: production mock provider 503 block
    process.env.PAYMENT_PROVIDER = 'mock';
    const dummyPayment = { _id: '507f1f77bcf86cd799439011', paymentId: 'pay_prod_lock_1', status: 'pending', expectedAmount: 20, currency: 'AZN' };
    assert.throws(() => {
        resolveCheckoutUrl(dummyPayment);
    }, /Ödəniş sistemi konfiqurasiya edilməyib, admin ilə əlaqə saxlayın|Ödəniş sistemi hazırda bağlıdır/, 'resolveCheckoutUrl must throw 503 in production with mock provider');

    assert.throws(() => {
        paymentResponse(dummyPayment);
    }, /Ödəniş sistemi konfiqurasiya edilməyib, admin ilə əlaqə saxlayın|Ödəniş sistemi hazırda bağlıdır/, 'paymentResponse must throw 503 in production with mock provider');

    // TEST: NODE_ENV=production PAYMENT_PROVIDER=mock -> createMockSession / createSession throw MOCK_PAYMENT_BLOCKED_IN_PRODUCTION
    console.log('--- TEST: prod + mock -> createMockSession / createSession throw MOCK_PAYMENT_BLOCKED_IN_PRODUCTION ---');
    process.env.NODE_ENV = 'production';
    process.env.PAYMENT_PROVIDER = 'mock';
    assert.throws(() => {
        payriffProvider.createMockSession({ paymentId: 'pay_prod_123' }, 'https://api.mobilim.az');
    }, /MOCK_PAYMENT_BLOCKED_IN_PRODUCTION/, 'createMockSession must throw MOCK_PAYMENT_BLOCKED_IN_PRODUCTION in production');

    assert.rejects(async () => {
        await payriffProvider.createSession(10, 'user_1', 'pay_prod_123');
    }, /MOCK_PAYMENT_BLOCKED_IN_PRODUCTION/, 'createSession must reject with MOCK_PAYMENT_BLOCKED_IN_PRODUCTION in production with mock provider');

    if (typeof payriffProvider.createPayriffSession === 'function') {
        assert.rejects(async () => {
            await payriffProvider.createPayriffSession(10, 'user_1', 'pay_prod_123');
        }, /MOCK_PAYMENT_BLOCKED_IN_PRODUCTION/, 'createPayriffSession must reject with MOCK_PAYMENT_BLOCKED_IN_PRODUCTION in production with mock provider');
    }

    // TEST: mockCheckoutPage in production returns 403 'Mock checkout disabled in production'
    let mockPageStatus = null;
    let mockPageBody = null;
    const resMock = {
        status: (s) => { mockPageStatus = s; return resMock; },
        send: (b) => { mockPageBody = b; return resMock; }
    };
    walletController.mockCheckoutPage({ params: { paymentId: 'p1' } }, resMock, () => {});
    assert.strictEqual(mockPageStatus, 403);
    assert.strictEqual(mockPageBody, 'Mock checkout disabled in production');

    // TEST: NODE_ENV=development PAYMENT_PROVIDER=mock -> mock yaranır PASS
    console.log('--- TEST: dev + mock -> createMockSession creates mock session successfully ---');
    process.env.NODE_ENV = 'development';
    process.env.PAYMENT_PROVIDER = 'mock';
    const devMockUrl = payriffProvider.createMockSession({ paymentId: 'pay_dev_123' }, 'http://localhost:5000');
    assert.strictEqual(typeof devMockUrl, 'string');
    assert.strictEqual(devMockUrl.includes('/api/wallet/payments/pay_dev_123/mock-checkout'), true, 'createMockSession in dev should return valid mock checkout url');

    // Restore provider to payriff for remaining tests
    process.env.PAYMENT_PROVIDER = 'payriff';

    // TEST: dev + mock signature + ALLOW_MOCK=true => should pass
    console.log('--- TEST: dev + mock signature + ALLOW_MOCK=true => should pass ---');
    process.env.NODE_ENV = 'development';
    process.env.ALLOW_MOCK_SIGNATURE = 'true';
    assert.strictEqual(payriffProvider.verifySignature(rawBody, 'mock-sandbox-signature', process.env.PAYRIFF_WEBHOOK_SECRET), true, 'payriffProvider must allow mock signature in dev with ALLOW_MOCK_SIGNATURE=true');
    const devMockCallbackReq = {
        rawBody,
        get: (name) => name.toLowerCase() === process.env.PAYRIFF_SIGNATURE_HEADER
            ? 'mock-sandbox-signature'
            : ''
    };
    assert.strictEqual(verifyControllerSignature(devMockCallbackReq, {}), true, 'Controller must accept mock signature in dev with ALLOW_MOCK_SIGNATURE=true');

    // TEST: dev + mock signature + ALLOW_MOCK=false => should fail
    process.env.ALLOW_MOCK_SIGNATURE = 'false';
    assert.strictEqual(payriffProvider.verifySignature(rawBody, 'mock-sandbox-signature', process.env.PAYRIFF_WEBHOOK_SECRET), false, 'payriffProvider must reject mock signature when ALLOW_MOCK_SIGNATURE=false');

    // TEST: Sandbox / custom PAYRIFF_API_URL + merchantId test (payriffProvider.js:91)
    console.log('--- TEST: Sandbox URL and Merchant ID in payriffProvider.createSession ---');
    const axios = require('axios');
    const origPost = axios.post;
    let interceptedUrl = null;
    let interceptedPayload = null;
    let interceptedHeaders = null;

    axios.post = async (url, payload, options) => {
        interceptedUrl = url;
        interceptedPayload = payload;
        interceptedHeaders = options?.headers;
        return {
            data: {
                paymentUrl: 'https://sandbox.payriff.com/checkout/ord_123',
                orderId: 'ord_123'
            }
        };
    };

    (async () => {
        try {
            process.env.PAYRIFF_API_URL = 'https://sandbox.payriff.com/api/v3/orders';
            process.env.PAYRIFF_MERCHANT_ID = 'MERCH_SANDBOX_999';
            process.env.PAYRIFF_SECRET = 'sandbox-secret-key';
            process.env.NODE_ENV = 'development';

            const session = await payriffProvider.createSession(25, 'user_123', 'sess_abc', {
                origin: 'https://test.mobilim.az'
            });

            assert.strictEqual(interceptedUrl, 'https://sandbox.payriff.com/api/v3/orders');
            assert.strictEqual(interceptedPayload.amount, 25);
            assert.strictEqual(interceptedPayload.merchantId, 'MERCH_SANDBOX_999');
            assert.strictEqual(interceptedHeaders.Authorization, 'sandbox-secret-key');
            assert.strictEqual(session.checkoutUrl, 'https://sandbox.payriff.com/checkout/ord_123');
            assert.strictEqual(session.orderId, 'ord_123');
            console.log('✅ Payriff sandbox URL & merchantId createSession test passed!');
        } finally {
            axios.post = origPost;
            delete process.env.PAYRIFF_API_URL;
            delete process.env.PAYRIFF_MERCHANT_ID;
        }
    })();

    console.log('PAYRIFF HMAC MECHANISM TESTS PASSED');
} finally {
    if (previousProvider === undefined) delete process.env.PAYMENT_PROVIDER;
    else process.env.PAYMENT_PROVIDER = previousProvider;
    if (previousSecret === undefined) delete process.env.PAYRIFF_SECRET;
    else process.env.PAYRIFF_SECRET = previousSecret;
    if (previousPayriffWebhookSecret === undefined) delete process.env.PAYRIFF_WEBHOOK_SECRET;
    else process.env.PAYRIFF_WEBHOOK_SECRET = previousPayriffWebhookSecret;
    if (previousSignatureHeader === undefined) delete process.env.PAYRIFF_SIGNATURE_HEADER;
    else process.env.PAYRIFF_SIGNATURE_HEADER = previousSignatureHeader;
    if (previousWebhookSecret === undefined) delete process.env.PAYMENT_WEBHOOK_SECRET;
    else process.env.PAYMENT_WEBHOOK_SECRET = previousWebhookSecret;
    if (previousOrigin === undefined) delete process.env.API_PUBLIC_ORIGIN;
    else process.env.API_PUBLIC_ORIGIN = previousOrigin;
    if (previousAllowMock === undefined) delete process.env.ALLOW_MOCK_SIGNATURE;
    else process.env.ALLOW_MOCK_SIGNATURE = previousAllowMock;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
}
