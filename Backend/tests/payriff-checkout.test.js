const assert = require('assert');
const axios = require('axios');
const payriffProvider = require('../services/payriffProvider');

async function runTest() {
    console.log('--- TEST 1: Production without secret throws fail-closed ---');
    const prevEnv = process.env.NODE_ENV;
    const prevSecret = process.env.PAYRIFF_SECRET;
    const prevOrigin = process.env.API_PUBLIC_ORIGIN;

    try {
        process.env.NODE_ENV = 'production';
        delete process.env.PAYRIFF_SECRET;

        let capturedErr = null;
        try {
            await payriffProvider.createSession(50, 'user123', 'pay_session_1');
        } catch (err) {
            capturedErr = err;
        }
        assert(capturedErr, 'Expected error in production without secret');
        assert(capturedErr.message === 'Payriff secret missing' || capturedErr.message.includes('MOCK_PAYMENT_BLOCKED_IN_PRODUCTION'), 'Expected fail-closed error in production');
        console.log('Production without secret correctly threw:', capturedErr.message);

        console.log('--- TEST 2: Non-production without secret falls back to mockProvider ---');
        process.env.NODE_ENV = 'development';
        delete process.env.PAYRIFF_SECRET;
        process.env.API_PUBLIC_ORIGIN = 'http://localhost:5000';

        const mockRes = await payriffProvider.createSession(50, 'user123', 'pay_session_mock_1');
        assert(mockRes.checkoutUrl, 'Mock session checkoutUrl must exist');
        assert(mockRes.checkoutUrl.includes('/api/wallet/payments/pay_session_mock_1/mock-checkout'), 'Mock checkout URL correctly generated');
        console.log('Mock fallback returned:', mockRes.checkoutUrl);

        console.log('--- TEST 3: With secret, calls axios and returns payUrl and providerSessionId ---');
        process.env.PAYRIFF_SECRET = 'test_secret_live_key';
        process.env.API_PUBLIC_ORIGIN = 'https://api.mobil.az';

        // Mock axios.post
        const originalPost = axios.post;
        let interceptedRequest = null;
        axios.post = async (url, data, config) => {
            interceptedRequest = { url, data, config };
            return {
                data: {
                    payload: {
                        orderId: 'payriff_ord_99999',
                        paymentUrl: 'https://payriff.com/checkout/ord_99999',
                        transactionId: 'tx_payriff_77777'
                    }
                }
            };
        };

        const result = await payriffProvider.createSession(100, 'user456', 'pay_session_live_1');
        assert.strictEqual(interceptedRequest.url, 'https://api.payriff.com/api/v3/orders');
        assert.strictEqual(interceptedRequest.config.headers.Authorization, 'test_secret_live_key');
        assert.strictEqual(interceptedRequest.data.amount, 100);
        assert.strictEqual(interceptedRequest.data.currency, 'AZN');
        assert.strictEqual(interceptedRequest.data.language, 'AZ');
        assert.strictEqual(interceptedRequest.data.description, 'Mobil.az top-up 100 AZN');
        assert.strictEqual(interceptedRequest.data.callbackUrl, 'https://api.mobil.az/api/wallet/callback/payriff/pay_session_live_1');
        assert.strictEqual(interceptedRequest.data.metadata.userId, 'user456');
        assert.strictEqual(interceptedRequest.data.metadata.sessionId, 'pay_session_live_1');
        assert.strictEqual(interceptedRequest.data.operation, 'PURCHASE');

        assert.strictEqual(result.payUrl, 'https://payriff.com/checkout/ord_99999');
        assert.strictEqual(result.providerSessionId, 'payriff_ord_99999');
        console.log('Payriff session creation succeeded:', result);

        console.log('--- TEST 4: Payriff API error throws 502 and does not leak secret ---');
        let consoleErrorCaptured = '';
        const originalConsoleError = console.error;
        console.error = (...args) => {
            consoleErrorCaptured = args.join(' ');
        };

        axios.post = async () => {
            const err = new Error('Request failed with status code 500');
            err.response = { status: 500, data: { message: 'Internal Gateway Failure' } };
            throw err;
        };

        let capturedGatewayErr = null;
        try {
            await payriffProvider.createSession(50, 'user123', 'pay_session_fail_1');
        } catch (e) {
            capturedGatewayErr = e;
        }

        console.error = originalConsoleError;
        axios.post = originalPost;

        assert(capturedGatewayErr, 'Expected 502 gateway error');
        assert.strictEqual(capturedGatewayErr.status, 502);
        assert(!consoleErrorCaptured.includes('test_secret_live_key'), 'Secret must NOT be logged in console.error');
        console.log('Gateway error correctly thrown with status 502, no secret leaked');

        console.log('=== ALL PAYRIFF CHECKOUT TESTS PASSED 100%! ===');
    } finally {
        if (prevEnv !== undefined) process.env.NODE_ENV = prevEnv; else delete process.env.NODE_ENV;
        if (prevSecret !== undefined) process.env.PAYRIFF_SECRET = prevSecret; else delete process.env.PAYRIFF_SECRET;
        if (prevOrigin !== undefined) process.env.API_PUBLIC_ORIGIN = prevOrigin; else delete process.env.API_PUBLIC_ORIGIN;
    }
}

runTest().catch((err) => {
    console.error('Test failed with error:', err);
    process.exit(1);
});
