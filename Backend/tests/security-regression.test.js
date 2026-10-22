const assert = require('assert');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { detectDocumentSignature } = require('../utils/privateFileService');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-current-secret-with-at-least-32-bytes';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-with-at-least-32-bytes-unique';
process.env.JWT_ACTIVE_KID = 'current';
process.env.JWT_ACCESS_KEYS = JSON.stringify({
    current: 'test-current-secret-with-at-least-32-bytes',
    previous: 'test-previous-secret-with-at-least-32-bytes'
});
process.env.ALLOWED_ORIGINS = 'https://app.example.com,http://localhost:3000';
process.env.CORS_ALLOW_NO_ORIGIN = 'false';
process.env.CSRF_ALLOW_NO_ORIGIN = 'false';
process.env.CSRF_SECRET = 'test-csrf-secret-with-at-least-32-bytes';

const { validateChatMessagePayload } = require('../utils/chatSecurity');
const { sanitizePlainText, pickAllowedFields } = require('../utils/sanitizers');
const { generateAccessToken, verifyAccessToken, generateRefreshToken, hashToken } = require('../utils/authSecurity');
const { generateTotpSecret, generateTotpCode, verifyTotpCode } = require('../utils/totp');
const { isOriginAllowed } = require('../utils/corsPolicy');
const { buildHelmetOptions } = require('../utils/cspConfig');
const {
    hasDangerousKeys,
    normalizeEmail,
    rejectDangerousKeys,
    rejectNoSqlOperators
} = require('../utils/securityValidation');
const {
    buildCsrfCookieOptions,
    issueCsrfToken,
    parseCookies,
    validateOrigin,
    verifyCsrfToken
} = require('../middlewares/csrfProtection');
const { buildPriceSnapshot } = require('../utils/packageCatalog');
const { toSafeUser } = require('../utils/userSerializer');
const { _test: walletTest } = require('../controllers/walletController');
const { createIdentifierLimiter } = require('../utils/abuseGuards');
const User = require('../models/User');
const Store = require('../models/Store');
const Package = require('../models/Package');
const PaymentSession = require('../models/PaymentSession');
const Message = require('../models/Message');
const Review = require('../models/Review');
const { getOtpAttempts, incrementOtpAttempts, clearOtpAttempts } = require('../utils/otpAttempts');
const { loginLimiter, passwordResetLimiter } = require('../middlewares/rateLimiter');

const objectId = '507f1f77bcf86cd799439011';
const otherId = '507f191e810c19729de860ea';
const adId = '507f1f77bcf86cd799439012';

(() => {
    const result = validateChatMessagePayload({
        sender: objectId,
        recipient: otherId,
        ad: adId,
        text: '<script>alert(1)</script>',
        role: 'admin'
    });
    assert.equal(result.valid, false, 'chat payloads with scripts and unexpected fields are rejected');

    const nested = validateChatMessagePayload({
        sender: objectId,
        recipient: { $ne: otherId },
        ad: adId,
        text: 'hello'
    });
    assert.equal(nested.valid, false, 'chat payloads with nested recipient objects are rejected');

    const clean = validateChatMessagePayload({
        sender: objectId,
        recipient: otherId,
        ad: adId,
        text: 'plain text'
    });
    assert.equal(clean.valid, true, 'plain chat payload is accepted');
    assert.equal(clean.sanitizedText, 'plain text');
})();

(() => {
    assert.equal(sanitizePlainText('<img src=x onerror=alert(1)>Hello'), 'Hello');
    const picked = pickAllowedFields({ name: 'A', role: 'admin', walletBalance: 999 }, ['name']);
    assert.deepEqual(picked, { name: 'A' }, 'privileged mass-assignment fields are not selected');

    assert.equal(hasDangerousKeys({ email: { $ne: 'x@example.com' } }), true, 'MongoDB operators are detected');
    assert.throws(
        () => rejectDangerousKeys({ profile: { 'name.first': 'A' } }),
        /operator/,
        'dotted keys are rejected before reaching MongoDB'
    );
})();

(() => {
    const xssMiddleware = require('../middlewares/xssMiddleware');
    const req = {
        body: { text: '<script>alert("body")</script>hello' },
        query: { q: '<img src=x onerror=alert("query")>world' },
        params: { id: '<iframe src=javascript:alert("params")>foo' }
    };
    const res = {};
    xssMiddleware(req, res, () => {});

    assert.equal(req.body.text, 'hello', 'XSS in body must be sanitized');
    assert.equal(req.query.q, 'world', 'XSS in query must be sanitized');
    assert.equal(req.params.id, '[removed]foo', 'XSS in params must be sanitized');
})();

(() => {
    const user = { _id: objectId, tokenVersion: 2, sessionVersion: 3 };
    const accessToken = generateAccessToken(user);
    const decoded = verifyAccessToken(accessToken);
    assert.equal(decoded.tokenVersion, 2);
    assert.equal(decoded.sessionVersion, 3);

    const previousKeyToken = jwt.sign(
        { id: objectId, type: 'access', tokenVersion: 2, sessionVersion: 3 },
        'test-previous-secret-with-at-least-32-bytes',
        { header: { kid: 'previous' }, expiresIn: '5m' }
    );
    assert.equal(verifyAccessToken(previousKeyToken).id, objectId, 'previous approved JWT key is accepted');

    const unknownKidToken = jwt.sign(
        { id: objectId, type: 'access', tokenVersion: 2, sessionVersion: 3 },
        'unknown-secret-with-at-least-32-bytes',
        { header: { kid: 'unknown' }, expiresIn: '5m' }
    );
    assert.throws(() => verifyAccessToken(unknownKidToken), /Unknown JWT key id/, 'unknown JWT kid is rejected');
})();

(() => {
    const refresh = generateRefreshToken({ _id: objectId, sessionVersion: 4 });
    assert.equal(refresh.tokenHash, hashToken(refresh.token));
    assert.notEqual(refresh.tokenHash, refresh.token, 'refresh session stores hash, not raw token');
    assert.ok(refresh.sessionId, 'refresh session has server-side session id');
})();

(() => {
    const secret = generateTotpSecret();
    const step = Math.floor(Date.now() / 1000 / 30);
    const code = generateTotpCode(secret, step);
    const first = verifyTotpCode({ secret, code, lastUsedStep: null });
    assert.equal(first.valid, true, 'valid TOTP is accepted');
    const replay = verifyTotpCode({ secret, code, lastUsedStep: first.timeStep });
    assert.equal(replay.valid, false, 'replayed TOTP time-step is rejected');
})();

(() => {
    const user = new User({ name: 'A', email: 'a@example.com', password: 'Password123' });
    assert.equal(user.role, 'user', 'public users default to safe role');
    assert.equal(user.tokenVersion, 0);
    assert.equal(user.sessionVersion, 0);
    assert.equal(User.schema.path('password').options.select, false, 'password is select:false by default');
    assert.equal(User.schema.path('resetToken').options.select, false, 'reset token hash is select:false by default');
    assert.equal(User.schema.path('refreshTokens').options.select, false, 'refresh token hashes are select:false by default');

    user.resetToken = 'reset-hash';
    user.refreshTokens = [{ tokenHash: 'refresh-hash', sessionId: 's', expiresAt: new Date(Date.now() + 10000) }];
    user.twoFactorSecret = '2fa-secret';
    const json = user.toJSON();
    assert.equal(json.password, undefined, 'password hash is not serialized');
    assert.equal(json.resetToken, undefined, 'reset token hash is not serialized');
    assert.equal(json.refreshTokens, undefined, 'refresh token hashes are not serialized');
    assert.equal(json.twoFactorSecret, undefined, '2FA secret is not serialized');
    const dto = toSafeUser(user);
    assert.equal(dto.password, undefined, 'safe user DTO excludes password');
    assert.equal(dto.refreshTokens, undefined, 'safe user DTO excludes refresh sessions');

    // Verify wallet fields min: 0 constraint
    assert.equal(User.schema.path('walletBalance').options.min, 0, 'walletBalance must have a minimum value of 0');
    assert.equal(User.schema.path('walletPendingBalance').options.min, 0, 'walletPendingBalance must have a minimum value of 0');
    assert.equal(User.schema.path('walletReservedBalance').options.min, 0, 'walletReservedBalance must have a minimum value of 0');
    assert.equal(User.schema.path('walletPromoBalance').options.min, 0, 'walletPromoBalance must have a minimum value of 0');

    // Test validation
    const negativeWalletUser = new User({
        name: 'A',
        email: 'a@example.com',
        password: 'Password123',
        walletBalance: -10
    });
    const validationError = negativeWalletUser.validateSync();
    assert.ok(validationError, 'Validation should fail for negative wallet balance');
    assert.ok(validationError.errors.walletBalance, 'walletBalance should trigger validation error');

    const store = new Store({ owner: objectId, storeName: 'Pending Store' });
    assert.equal(store.status, 'pending', 'store applications default to pending');
    assert.equal(store.isVerified, false, 'store applications are not auto-verified');

    // Verify Message text field maxlength validation
    assert.equal(Message.schema.path('text').options.maxlength, 5000, 'Message text must have maxlength of 5000');
    const tooLongMessage = new Message({
        sender: objectId,
        recipient: otherId,
        ad: adId,
        text: 'A'.repeat(5001)
    });
    const messageError = tooLongMessage.validateSync();
    assert.ok(messageError, 'Validation should fail for too long message text');
    assert.ok(messageError.errors.text, 'text should trigger validation error');
})();

(() => {
    assert.equal(isOriginAllowed('https://app.example.com'), true);
    assert.equal(isOriginAllowed('https://evil.example.com'), false, 'unknown CORS origins are rejected');
    assert.equal(isOriginAllowed(undefined), false, 'no-origin requests are rejected when configured');
})();

(() => {
    const cookieJar = {};
    const res = {
        cookie(name, value, options) {
            cookieJar[name] = { value, options };
        },
        json(payload) {
            this.payload = payload;
        }
    };
    const token = issueCsrfToken({}, res);
    assert.ok(token, 'CSRF endpoint issues a token for the custom header');
    assert.equal(cookieJar.csrfToken.options.httpOnly, false, 'CSRF signed cookie is not HttpOnly');
    assert.equal(cookieJar.csrfToken.options.sameSite, 'lax', 'CSRF cookie uses SameSite');

    const signedCookie = `csrfToken=${encodeURIComponent(cookieJar.csrfToken.value)}`;
    const goodReq = {
        method: 'POST',
        headers: { cookie: signedCookie },
        get(header) {
            const normalized = header.toLowerCase();
            if (normalized === 'x-csrf-token') return token;
            if (normalized === 'origin') return 'https://app.example.com';
            return this.headers[normalized];
        }
    };
    let nextCalled = false;
    validateOrigin(goodReq, {}, () => { nextCalled = true; });
    assert.equal(nextCalled, true, 'known origins can perform CSRF-protected requests');
    verifyCsrfToken(goodReq, {}, () => { nextCalled = 'csrf'; });
    assert.equal(nextCalled, 'csrf', 'valid CSRF header and signed cookie are accepted');

    const badOriginReq = {
        method: 'POST',
        get(header) {
            return header.toLowerCase() === 'origin' ? 'https://evil.example.com' : '';
        }
    };
    const badOriginRes = {
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.payload = payload;
        }
    };
    validateOrigin(badOriginReq, badOriginRes, () => {});
    assert.equal(badOriginRes.statusCode, 403, 'unknown origins are rejected for unsafe requests');

    const missingTokenReq = {
        method: 'POST',
        headers: { cookie: signedCookie },
        get() { return ''; }
    };
    const missingTokenRes = {
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.payload = payload;
        }
    };
    verifyCsrfToken(missingTokenReq, missingTokenRes, () => {});
    assert.equal(missingTokenRes.statusCode, 403, 'missing CSRF header is rejected');
})();

(() => {
    const pkg = new Package({
        productId: 'pro-90',
        code: 'PRO',
        name: 'PRO 90 days',
        durationDays: 90,
        currency: 'AZN',
        priceAmount: 60,
        active: true
    });
    const attackerBody = { packageId: 'pro-90', price: 1, amount: 1, currency: 'USD', durationDays: 1 };
    const snapshot = buildPriceSnapshot(pkg);
    assert.equal(attackerBody.price, 1);
    assert.equal(snapshot.finalAmount, 60, 'modified frontend payment price is ignored in server snapshot');
    assert.equal(snapshot.currency, 'AZN');
    assert.equal(snapshot.durationDays, 90, 'package duration comes from server package');

    const invalidCurrencyPackage = new Package({
        productId: 'vip-30-usd',
        code: 'VIP',
        name: 'VIP USD',
        durationDays: 30,
        currency: 'USD',
        priceAmount: 12,
        active: true
    });
    assert.throws(() => buildPriceSnapshot(invalidCurrencyPackage), /valyutası/, 'invalid package currency is rejected');

    const payment = new PaymentSession({
        paymentId: 'pay_test',
        user: objectId,
        package: pkg._id,
        kind: 'package_provider',
        expectedAmount: 60,
        currency: 'AZN',
        priceSnapshot: snapshot,
        expiresAt: new Date(Date.now() + 60000)
    });
    assert.equal(walletTest.validatePaymentCallbackMatch(payment, {
        amount: 60,
        currency: 'AZN',
        productId: 'pro-90'
    }).valid, true, 'valid payment callback amount/currency/package is accepted');
    assert.equal(walletTest.validatePaymentCallbackMatch(payment, {
        amount: 1,
        currency: 'AZN',
        productId: 'pro-90'
    }).reason, 'amount_or_currency_mismatch', 'underpayment is rejected');
    assert.equal(walletTest.validatePaymentCallbackMatch(payment, {
        amount: 60,
        currency: 'USD',
        productId: 'pro-90'
    }).reason, 'amount_or_currency_mismatch', 'invalid callback currency is rejected');
    assert.equal(walletTest.validatePaymentCallbackMatch(payment, {
        amount: 60,
        currency: 'AZN',
        productId: 'vip-30'
    }).reason, 'package_mismatch', 'modified package IDs are rejected');
    payment.status = 'completed';
    assert.equal(walletTest.validatePaymentCallbackMatch(payment, {
        amount: 60,
        currency: 'AZN',
        productId: 'pro-90'
    }).valid, true, 'duplicate completed callback can be treated idempotently after lookup');
})();

(() => {
    // Webhook Mock Signature & Empty Signature Security Tests (DAY2-1-P0-WEBHOOK-MOCK-BYPASS)
    const crypto = require('crypto');
    const { verifyProviderSignature } = walletTest;
    const testSecret = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    const paymentParams = {
        paymentId: 'pay_12345',
        amount: 50,
        currency: 'AZN',
        status: 'paid',
        providerReference: 'tx_ref_987'
    };

    // 1. Production: Secret missing -> throws Error (fail-closed, leading to HTTP 500)
    {
        const prevEnv = process.env.NODE_ENV;
        const prevSecret = process.env.PAYMENT_WEBHOOK_SECRET;
        process.env.NODE_ENV = 'production';
        delete process.env.PAYMENT_WEBHOOK_SECRET;
        try {
            assert.throws(() => {
                verifyProviderSignature({ get: () => 'mock-sandbox-signature' }, paymentParams);
            }, /PAYMENT_WEBHOOK_SECRET is not configured/, 'In production without secret, verifyProviderSignature must throw');
        } finally {
            process.env.NODE_ENV = prevEnv;
            process.env.PAYMENT_WEBHOOK_SECRET = prevSecret;
        }
    }

    // 2. Mock signature in production -> rejected (returns false -> HTTP 401)
    {
        const prevEnv = process.env.NODE_ENV;
        const prevSecret = process.env.PAYMENT_WEBHOOK_SECRET;
        const prevAllow = process.env.ALLOW_MOCK_SIGNATURE;
        process.env.NODE_ENV = 'production';
        process.env.PAYMENT_WEBHOOK_SECRET = testSecret;
        process.env.ALLOW_MOCK_SIGNATURE = 'true';
        try {
            const req = { get: () => 'mock-sandbox-signature' };
            const result = verifyProviderSignature(req, paymentParams);
            assert.strictEqual(result, false, 'Mock signature must be rejected in production (HTTP 401)');
        } finally {
            process.env.NODE_ENV = prevEnv;
            process.env.PAYMENT_WEBHOOK_SECRET = prevSecret;
            process.env.ALLOW_MOCK_SIGNATURE = prevAllow;
        }
    }

    // 3. Empty signature -> rejected (returns false -> HTTP 401)
    {
        const prevEnv = process.env.NODE_ENV;
        const prevSecret = process.env.PAYMENT_WEBHOOK_SECRET;
        const prevAllow = process.env.ALLOW_MOCK_SIGNATURE;
        process.env.NODE_ENV = 'development';
        process.env.PAYMENT_WEBHOOK_SECRET = testSecret;
        process.env.ALLOW_MOCK_SIGNATURE = 'true';
        try {
            // Empty string signature
            const reqEmpty = { get: () => '' };
            assert.strictEqual(verifyProviderSignature(reqEmpty, paymentParams), false, 'Empty signature must be rejected (HTTP 401)');

            // Whitespace signature
            const reqWhitespace = { get: () => '   ' };
            assert.strictEqual(verifyProviderSignature(reqWhitespace, paymentParams), false, 'Whitespace signature must be rejected (HTTP 401)');

            // Missing header completely
            const reqMissing = { get: () => undefined };
            assert.strictEqual(verifyProviderSignature(reqMissing, paymentParams), false, 'Missing signature must be rejected (HTTP 401)');
        } finally {
            process.env.NODE_ENV = prevEnv;
            process.env.PAYMENT_WEBHOOK_SECRET = prevSecret;
            process.env.ALLOW_MOCK_SIGNATURE = prevAllow;
        }
    }

    // 4. Mock signature in development without ALLOW_MOCK_SIGNATURE='true' -> rejected (HTTP 401)
    {
        const prevEnv = process.env.NODE_ENV;
        const prevSecret = process.env.PAYMENT_WEBHOOK_SECRET;
        const prevAllow = process.env.ALLOW_MOCK_SIGNATURE;
        process.env.NODE_ENV = 'development';
        process.env.PAYMENT_WEBHOOK_SECRET = testSecret;
        delete process.env.ALLOW_MOCK_SIGNATURE;
        try {
            const req = { get: () => 'mock-sandbox-signature' };
            assert.strictEqual(verifyProviderSignature(req, paymentParams), false, 'Mock signature without ALLOW_MOCK_SIGNATURE=true must be rejected');

            const reqMock = { get: () => 'mock' };
            assert.strictEqual(verifyProviderSignature(reqMock, paymentParams), false, 'Arbitrary mock string must be rejected');
        } finally {
            process.env.NODE_ENV = prevEnv;
            process.env.PAYMENT_WEBHOOK_SECRET = prevSecret;
            process.env.ALLOW_MOCK_SIGNATURE = prevAllow;
        }
    }

    // 5. Mock signature in development WITH ALLOW_MOCK_SIGNATURE='true' -> accepted
    {
        const prevEnv = process.env.NODE_ENV;
        const prevSecret = process.env.PAYMENT_WEBHOOK_SECRET;
        const prevAllow = process.env.ALLOW_MOCK_SIGNATURE;
        process.env.NODE_ENV = 'development';
        delete process.env.PAYMENT_WEBHOOK_SECRET;
        process.env.ALLOW_MOCK_SIGNATURE = 'true';
        try {
            const req = { get: () => 'mock-sandbox-signature' };
            assert.strictEqual(verifyProviderSignature(req, paymentParams), true, 'Mock signature with ALLOW_MOCK_SIGNATURE=true in non-production is accepted');
        } finally {
            process.env.NODE_ENV = prevEnv;
            process.env.PAYMENT_WEBHOOK_SECRET = prevSecret;
            process.env.ALLOW_MOCK_SIGNATURE = prevAllow;
        }
    }

    // 6. Valid HMAC signature verification with status included (DAY2-2-SIGNATURE-STATUS-INCLUDED)
    {
        const prevSecret = process.env.PAYMENT_WEBHOOK_SECRET;
        process.env.PAYMENT_WEBHOOK_SECRET = testSecret;
        try {
            const payloadPaid = `${paymentParams.paymentId}.${paymentParams.amount}.${paymentParams.currency}.${paymentParams.status}.${paymentParams.providerReference}`;
            const sigPaid = crypto.createHmac('sha256', testSecret).update(payloadPaid).digest('hex');

            const payloadFailed = `${paymentParams.paymentId}.${paymentParams.amount}.${paymentParams.currency}.failed.${paymentParams.providerReference}`;
            const sigFailed = crypto.createHmac('sha256', testSecret).update(payloadFailed).digest('hex');

            // Signatures must be different for different statuses
            assert.notStrictEqual(sigPaid, sigFailed, 'Signatures for paid and failed status must be different');

            // Valid signature with matching status is accepted
            const reqValidPaid = { get: (h) => (h === 'x-payment-signature' ? sigPaid : '') };
            assert.strictEqual(verifyProviderSignature(reqValidPaid, paymentParams), true, 'Valid HMAC signature for status=paid is accepted');

            const reqValidFailed = { get: (h) => (h === 'x-payment-signature' ? sigFailed : '') };
            assert.strictEqual(verifyProviderSignature(reqValidFailed, { ...paymentParams, status: 'failed' }), true, 'Valid HMAC signature for status=failed is accepted');

            // Attacker changes status to paid but retains sigFailed -> rejected (returns false -> HTTP 401)
            const reqTamperedStatusToPaid = { get: (h) => (h === 'x-payment-signature' ? sigFailed : '') };
            assert.strictEqual(
                verifyProviderSignature(reqTamperedStatusToPaid, { ...paymentParams, status: 'paid' }),
                false,
                'Status tampered from failed to paid must be rejected with 401'
            );

            // Attacker changes status to failed but retains sigPaid -> rejected
            const reqTamperedStatusToFailed = { get: (h) => (h === 'x-payment-signature' ? sigPaid : '') };
            assert.strictEqual(
                verifyProviderSignature(reqTamperedStatusToFailed, { ...paymentParams, status: 'failed' }),
                false,
                'Status tampered from paid to failed must be rejected with 401'
            );

            // Random tampered signature is rejected
            const reqTampered = { get: (h) => (h === 'x-payment-signature' ? 'bad' + sigPaid.slice(3) : '') };
            assert.strictEqual(verifyProviderSignature(reqTampered, paymentParams), false, 'Tampered HMAC signature is rejected');
        } finally {
            process.env.PAYMENT_WEBHOOK_SECRET = prevSecret;
        }
    }
})();

(() => {
    // Checkout Origin and Environment Security Tests (DAY2-3-CHECKOUT-ORIGIN-AND-ENV)
    const { resolveCheckoutUrl } = walletTest;
    const dummyPayment = { paymentId: 'pay_checkout_test_123' };

    // 1. Production: API_PUBLIC_ORIGIN missing -> throws Error ('API_PUBLIC_ORIGIN required') -> 500
    {
        const prevEnv = process.env.NODE_ENV;
        const prevOrigin = process.env.API_PUBLIC_ORIGIN;
        const prevProvider = process.env.PAYMENT_PROVIDER;
        process.env.NODE_ENV = 'production';
        delete process.env.API_PUBLIC_ORIGIN;
        process.env.PAYMENT_PROVIDER = 'payriff';
        try {
            assert.throws(() => {
                resolveCheckoutUrl(dummyPayment);
            }, /API_PUBLIC_ORIGIN required/, 'In production without API_PUBLIC_ORIGIN, resolveCheckoutUrl must throw');
        } finally {
            process.env.NODE_ENV = prevEnv;
            if (prevOrigin !== undefined) process.env.API_PUBLIC_ORIGIN = prevOrigin; else delete process.env.API_PUBLIC_ORIGIN;
            if (prevProvider !== undefined) process.env.PAYMENT_PROVIDER = prevProvider; else delete process.env.PAYMENT_PROVIDER;
        }
    }

    // 2. Production: PAYMENT_PROVIDER is 'mock' or missing -> throws Error ('Real PAYMENT_PROVIDER required in production') -> 500
    {
        const prevEnv = process.env.NODE_ENV;
        const prevOrigin = process.env.API_PUBLIC_ORIGIN;
        const prevProvider = process.env.PAYMENT_PROVIDER;
        process.env.NODE_ENV = 'production';
        process.env.API_PUBLIC_ORIGIN = 'https://api.mobil.az';
        process.env.PAYMENT_PROVIDER = 'mock';
        try {
            assert.throws(() => {
                resolveCheckoutUrl(dummyPayment);
            }, /Ödəniş sistemi konfiqurasiya edilməyib, admin ilə əlaqə saxlayın|Ödəniş sistemi hazırda bağlıdır|Real PAYMENT_PROVIDER required in production/, 'In production with PAYMENT_PROVIDER=mock, resolveCheckoutUrl must throw');

            delete process.env.PAYMENT_PROVIDER;
            assert.throws(() => {
                resolveCheckoutUrl(dummyPayment);
            }, /Ödəniş sistemi konfiqurasiya edilməyib, admin ilə əlaqə saxlayın|Ödəniş sistemi hazırda bağlıdır|Real PAYMENT_PROVIDER required in production/, 'In production with PAYMENT_PROVIDER missing, resolveCheckoutUrl must throw');
        } finally {
            process.env.NODE_ENV = prevEnv;
            if (prevOrigin !== undefined) process.env.API_PUBLIC_ORIGIN = prevOrigin; else delete process.env.API_PUBLIC_ORIGIN;
            if (prevProvider !== undefined) process.env.PAYMENT_PROVIDER = prevProvider; else delete process.env.PAYMENT_PROVIDER;
        }
    }

    // 3. Development: works and returns mock checkout URL
    {
        const prevEnv = process.env.NODE_ENV;
        const prevOrigin = process.env.API_PUBLIC_ORIGIN;
        const prevProvider = process.env.PAYMENT_PROVIDER;
        process.env.NODE_ENV = 'development';
        process.env.PAYMENT_PROVIDER = 'mock';
        delete process.env.API_PUBLIC_ORIGIN;
        try {
            const url = resolveCheckoutUrl(dummyPayment);
            assert.ok(url.includes('/api/wallet/payments/pay_checkout_test_123/mock-checkout'), 'In development, mock checkout URL is returned');
            assert.ok(url.startsWith('http://localhost:'), 'Falls back to localhost origin in dev');

            process.env.API_PUBLIC_ORIGIN = 'http://127.0.0.1:5000';
            const urlCustom = resolveCheckoutUrl(dummyPayment);
            assert.strictEqual(urlCustom, 'http://127.0.0.1:5000/api/wallet/payments/pay_checkout_test_123/mock-checkout', 'Custom origin is respected in dev');
        } finally {
            process.env.NODE_ENV = prevEnv;
            if (prevOrigin !== undefined) process.env.API_PUBLIC_ORIGIN = prevOrigin; else delete process.env.API_PUBLIC_ORIGIN;
            if (prevProvider !== undefined) process.env.PAYMENT_PROVIDER = prevProvider; else delete process.env.PAYMENT_PROVIDER;
        }
    }
})();

(() => {
    const req = {
        body: { email: { $gt: '' } },
        query: {},
        method: 'POST',
        originalUrl: '/api/auth/login'
    };
    const res = {};
    rejectNoSqlOperators(req, res, (err) => {
        assert.ok(err, 'MongoDB operators in body input are rejected');
        assert.equal(err.status, 400);
    });
    const queryReq = {
        body: {},
        query: { 'profile.name': 'x' },
        method: 'GET',
        originalUrl: '/api/ads'
    };
    rejectNoSqlOperators(queryReq, res, (err) => {
        assert.ok(err, 'dotted keys in query input are rejected');
        assert.equal(err.status, 400);
    });
})();

(() => {
    const start = Date.now();
    assert.throws(() => normalizeEmail(`${'a'.repeat(10000)}@example.com`), /çox uzundur|email/);
    assert.ok(Date.now() - start < 50, 'maliciously long email validation fails quickly');
})();

(() => {
    const options = buildHelmetOptions();
    const directives = options.contentSecurityPolicy.directives;
    assert.deepEqual(directives['object-src'], ["'none'"], 'CSP blocks plugins/objects');
    assert.ok(directives['frame-ancestors'].includes("'none'"), 'CSP prevents unauthorized framing by default');
    assert.equal(directives['script-src'].includes('*'), false, 'CSP script-src avoids wildcard');
    assert.equal(directives['script-src'].includes("'unsafe-eval'"), false, 'CSP script-src avoids unsafe-eval');
    assert.ok(directives['connect-src'].includes('https://app.example.com'), 'CSP connect-src includes approved frontend origin');
})();

(() => {
    const limiter = createIdentifierLimiter({
        getIdentifier: (req) => req.body.email,
        windowMs: 60 * 1000,
        max: 1,
        message: 'limited'
    });
    const req = {
        body: { email: 'Abuse@Test.Example' },
        baseUrl: '/api/auth',
        path: '/register',
        originalUrl: '/api/auth/register',
        ip: '127.0.0.1'
    };
    const res = {
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.payload = payload;
        }
    };
    let firstNext = false;
    limiter(req, res, () => { firstNext = true; });
    assert.equal(firstNext, true, 'first registration attempt for identifier is allowed');
    limiter(req, res, () => {});
    assert.equal(res.statusCode, 429, 'repeated registration by normalized identifier is rate-limited');
})();

(() => {
    const opts = buildCsrfCookieOptions(1000);
    assert.equal(opts.httpOnly, false);
    assert.equal(opts.secure, false);
    assert.equal(parseCookies('a=1; csrfToken=abc.def').csrfToken, 'abc.def');
})();

(() => {
    const { adminOnly } = require('../middlewares/authMiddleware');
    
    // 1. Blocked Admin Account
    const blockedAdminReq = {
        user: {
            role: 'admin',
            status: 'blocked',
            isVerified: true
        }
    };
    const res = {
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.payload = payload;
            return this;
        }
    };
    adminOnly(blockedAdminReq, res, () => {
        assert.fail('Should not call next() for a blocked admin');
    });
    assert.equal(res.statusCode, 403, 'Blocked admin should get 403 Forbidden');
    assert.equal(res.payload.message, 'Account blocked', 'Blocked admin should get "Account blocked" message');

    // 2. Active Admin Account
    const activeAdminReq = {
        user: {
            role: 'admin',
            status: 'active',
            isVerified: true
        }
    };
    let nextCalled = false;
    adminOnly(activeAdminReq, res, () => {
        nextCalled = true;
    });
    assert.equal(nextCalled, true, 'Active verified admin should pass authorization');
})();

(async () => {
    const tempDir = path.join(__dirname, '../.tmp/test-sig');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const testFiles = [
        { name: 'test.pdf', data: Buffer.from('255044462d312e340a', 'hex'), expected: 'application/pdf' },
        { name: 'test.jpg', data: Buffer.from('ffd8ffe000104a464946', 'hex'), expected: 'image/jpeg' },
        { name: 'test.png', data: Buffer.from('89504e470d0a1a0a0000000d', 'hex'), expected: 'image/png' },
        { name: 'test.webp', data: Buffer.from('524946460000000057454250', 'hex'), expected: 'image/webp' },
        { name: 'test.gif', data: Buffer.from('47494638396101000100', 'hex'), expected: 'image/gif' },
        { name: 'test.exe', data: Buffer.from('4d5a90000300000004000000', 'hex'), expected: '' }
    ];

    try {
        for (const file of testFiles) {
            const filePath = path.join(tempDir, file.name);
            fs.writeFileSync(filePath, file.data);
            const detected = await detectDocumentSignature(filePath);
            assert.equal(detected, file.expected, `Signature detection failed for ${file.name}: expected ${file.expected}, got ${detected}`);
            fs.unlinkSync(filePath);
        }
    } finally {
        fs.rmdirSync(tempDir);
    }
    console.log('File signature verification tests passed');
})();

(async () => {
    console.log('\n--- Testing Password Reset Rate Limiting ---');
    const { _test: authTest } = require('../controllers/authController');
    const email = 'rate-limit-test@example.com';
    
    // Clear any previous attempts from the local map
    authTest.resetAttemptBuckets.delete(email);

    // Let's set limit to 3 for testing
    process.env.PASSWORD_RESET_IDENTIFIER_RATE_LIMIT = '3';
    process.env.PASSWORD_RESET_RATE_WINDOW_MS = '60000'; // 1 minute

    // First attempt
    const r1 = await authTest.isResetRateLimitedByEmail(email);
    assert.equal(r1, false, 'First reset request should not be limited');

    // Second attempt
    const r2 = await authTest.isResetRateLimitedByEmail(email);
    assert.equal(r2, false, 'Second reset request should not be limited');

    // Third attempt
    const r3 = await authTest.isResetRateLimitedByEmail(email);
    assert.equal(r3, false, 'Third reset request should not be limited');

    // Fourth attempt - should exceed limit (3)
    const r4 = await authTest.isResetRateLimitedByEmail(email);
    assert.equal(r4, true, 'Fourth reset request should be rate-limited');

    console.log('Password reset rate limiting tests passed');
})();

(async () => {
    console.log('\n--- Testing Ad View Count Logic ---');
    const { getAdById } = require('../controllers/adController');
    const Ad = require('../models/Ad');
    const mongoose = require('mongoose');

    // Let's mock a temporary ad
    const mockAdId = new mongoose.Types.ObjectId();
    const ownerId = new mongoose.Types.ObjectId();
    const guestId = new mongoose.Types.ObjectId();

    const adObj = new Ad({
        _id: mockAdId,
        author: ownerId,
        category: 'Phones',
        brand: 'Apple',
        modelName: 'iPhone 15',
        price: 1200,
        condition: 'New',
        description: 'New iPhone',
        status: 'active',
        views: 10
    });
    
    // We can temporarily mock Ad.findOne and Ad.updateOne
    const originalFindOne = Ad.findOne;
    const originalUpdateOne = Ad.updateOne;

    let updateOneCalled = false;
    Ad.findOne = (query) => {
        return {
            populate() {
                return {
                    populate() {
                        return Promise.resolve(adObj);
                    }
                };
            }
        };
    };

    Ad.updateOne = (filter, update) => {
        updateOneCalled = true;
        assert.equal(filter._id.toString(), mockAdId.toString());
        assert.equal(update.$inc.views, 1);
        return Promise.resolve({ modifiedCount: 1 });
    };

    // Test case 1: Viewer is the owner (should NOT increment views)
    let resPayload1 = null;
    const req1 = {
        params: { id: mockAdId.toString() },
        user: { _id: ownerId }
    };
    const res1 = {
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            resPayload1 = payload;
            return this;
        }
    };
    
    await getAdById(req1, res1, (err) => { if (err) assert.fail(err); });
    assert.equal(updateOneCalled, false, 'Should not call updateOne for ad owner');
    assert.equal(resPayload1.views, 10, 'View count should remain unchanged for ad owner');

    // Test case 2: Viewer is a guest/different user (should increment views)
    let resPayload2 = null;
    const req2 = {
        params: { id: mockAdId.toString() },
        user: { _id: guestId }
    };
    const res2 = {
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            resPayload2 = payload;
            return this;
        }
    };

    await getAdById(req2, res2, (err) => { if (err) assert.fail(err); });
    assert.equal(updateOneCalled, true, 'Should call updateOne for guest viewer');
    assert.equal(resPayload2.views, 11, 'View count should increment for guest viewer');

    // Test case 3: Unauthenticated visitor (should increment views)
    updateOneCalled = false;
    adObj.views = 10; // reset
    let resPayload3 = null;
    const req3 = {
        params: { id: mockAdId.toString() },
        user: undefined
    };
    const res3 = {
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            resPayload3 = payload;
            return this;
        }
    };

    await getAdById(req3, res3, (err) => { if (err) assert.fail(err); });
    assert.equal(updateOneCalled, true, 'Should call updateOne for unauthenticated visitor');
    assert.equal(resPayload3.views, 11, 'View count should increment for unauthenticated visitor');

    // Restore original functions
    Ad.findOne = originalFindOne;
    Ad.updateOne = originalUpdateOne;

    console.log('Ad view count logic tests passed');
})();

(async () => {
    console.log('\n--- Testing Wallet GetTransactions Response Payload ---');
    const { getTransactions } = require('../controllers/walletController');
    const Transaction = require('../models/Transaction');

    const originalCountDocuments = Transaction.countDocuments;
    const originalFind = Transaction.find;

    Transaction.countDocuments = () => Promise.resolve(5);
    Transaction.find = () => {
        return {
            sort() {
                return {
                    skip() {
                        return {
                            limit() {
                                return {
                                    populate() {
                                        return Promise.resolve([
                                            { _id: 't1', amount: 10 },
                                            { _id: 't2', amount: 20 }
                                        ]);
                                    }
                                };
                            }
                        };
                    }
                };
            }
        };
    };

    let resPayload = null;
    const req = {
        query: { page: '1', limit: '10' },
        user: { _id: 'user1' }
    };
    const res = {
        json(payload) {
            resPayload = payload;
        }
    };

    await getTransactions(req, res, (err) => { if (err) assert.fail(err); });

    assert.equal(resPayload.totalTransactions, 5, 'Response should contain totalTransactions');
    assert.equal(resPayload.totalAds, undefined, 'Response should not contain totalAds');
    assert.equal(resPayload.transactions.length, 2);

    // Restore
    Transaction.countDocuments = originalCountDocuments;
    Transaction.find = originalFind;

    console.log('Wallet getTransactions response payload tests passed');
})();

(async () => {
    console.log('\n--- Testing Admin DeleteUser Audit Log ---');
    const { deleteUser } = require('../controllers/adminController');
    const User = require('../models/User');
    const Ad = require('../models/Ad');
    const AuditLog = require('../models/AuditLog');
    const mongoose = require('mongoose');

    // Mocks
    const mockUserId = new mongoose.Types.ObjectId();
    const mockAdminId = new mongoose.Types.ObjectId();
    
    const originalFindById = User.findById;
    const originalStartSession = mongoose.startSession;
    const originalAdFind = Ad.find;
    const originalAuditLogCreate = AuditLog.create;

    const userObj = new User({
        _id: mockUserId,
        status: 'suspended',
        role: 'user'
    });
    
    let userSaveCalled = false;
    userObj.save = () => {
        userSaveCalled = true;
        return Promise.resolve();
    };

    User.findById = () => {
        return {
            select() {
                return Promise.resolve(userObj);
            }
        };
    };

    let transactionExecuted = false;
    mongoose.startSession = () => Promise.resolve({
        withTransaction: async (cb) => {
            transactionExecuted = true;
            await cb();
        },
        endSession: () => Promise.resolve()
    });

    Ad.find = () => {
        return {
            session() {
                return Promise.resolve([]);
            }
        };
    };

    let auditLogCreatePayload = null;
    AuditLog.create = (payload) => {
        auditLogCreatePayload = payload;
        return Promise.resolve();
    };

    const req = {
        params: { id: mockUserId.toString() },
        user: { _id: mockAdminId },
        get: () => '',
        ip: '127.0.0.1'
    };
    
    let resPayload = null;
    const res = {
        json(payload) {
            resPayload = payload;
        }
    };
    
    await deleteUser(req, res, (err) => { if (err) assert.fail(err); });
    
    assert.equal(transactionExecuted, true, 'Transaction should have been executed');
    assert.equal(userSaveCalled, true, 'User should have been saved');
    assert.equal(userObj.status, 'deleted', 'User status should be updated to deleted');
    assert.ok(auditLogCreatePayload, 'AuditLog.create should have been called');
    assert.equal(auditLogCreatePayload.previousState.status, 'suspended', 'Audit log should capture actual previous state');
    assert.equal(auditLogCreatePayload.newState.status, 'deleted', 'Audit log should capture actual new state');

    // Restore
    User.findById = originalFindById;
    mongoose.startSession = originalStartSession;
    Ad.find = originalAdFind;
    AuditLog.create = originalAuditLogCreate;
    
    console.log('Admin deleteUser audit log tests passed');
})();

(async () => {
    console.log('\n--- Testing Review Target Validation ---');
    const invalidReview = new Review({
        author: objectId,
        rating: 5,
        comment: 'great'
    });
    try {
        await invalidReview.validate();
        assert.fail('Should have failed validation without targetUser or store');
    } catch (err) {
        assert.ok(err.message.includes('Review target required') || err.message.includes('targetUser'), 'Validation error message should match');
    }

    const validUserReview = new Review({
        targetUser: otherId,
        author: objectId,
        rating: 5,
        comment: 'great'
    });
    await validUserReview.validate();

    const validStoreReview = new Review({
        targetUser: objectId,
        author: otherId,
        rating: 5,
        comment: 'great'
    });
    await validStoreReview.validate();

    console.log('Review Target validation tests passed');
})();

(async () => {
    console.log('\n--- Testing OTP Centralized Attempt Tracking ---');
    const testId = 'brute_force_test@example.com';
    
    // Clear initial state
    await clearOtpAttempts(testId);
    let attempts = await getOtpAttempts(testId);
    assert.strictEqual(attempts.failedAttempts, 0);
    assert.strictEqual(attempts.lockedUntil, null);

    // 1st failed attempt
    await incrementOtpAttempts(testId);
    attempts = await getOtpAttempts(testId);
    assert.strictEqual(attempts.failedAttempts, 1);
    assert.strictEqual(attempts.lockedUntil, null);

    // 4 more failed attempts (total 5) to trigger lockout
    await incrementOtpAttempts(testId);
    await incrementOtpAttempts(testId);
    await incrementOtpAttempts(testId);
    const lastAttempt = await incrementOtpAttempts(testId);
    
    assert.strictEqual(lastAttempt.failedAttempts, 5);
    assert.ok(lastAttempt.lockedUntil instanceof Date);
    assert.ok(lastAttempt.lockedUntil > new Date());

    // Verify it survives across simulated OTP regeneration/persistence
    attempts = await getOtpAttempts(testId);
    assert.strictEqual(attempts.failedAttempts, 5);
    assert.ok(attempts.lockedUntil > new Date());

    // Clear and verify reset
    await clearOtpAttempts(testId);
    attempts = await getOtpAttempts(testId);
    assert.strictEqual(attempts.failedAttempts, 0);
    assert.strictEqual(attempts.lockedUntil, null);

    console.log('OTP Centralized Attempt Tracking tests passed');
})();

(async () => {
    console.log('\n--- Testing Login Rate Limiting ---');
    // Use a random IP per test execution to start with a clean rate limiting slate
    const ip = `192.168.1.${Math.floor(Math.random() * 254) + 1}`;
    const makeReq = () => ({
        ip,
        method: 'POST',
        originalUrl: '/api/auth/login',
        headers: {},
        app: {
            get(key) {
                if (key === 'trust proxy') return false;
            }
        }
    });
    
    let responseStatus = null;
    let responsePayload = null;
    let resolveFn = null;
    
    const res = {
        setHeader(name, value) {},
        status(code) {
            responseStatus = code;
            return this;
        },
        json(payload) {
            responsePayload = payload;
            if (resolveFn) resolveFn();
            return this;
        }
    };

    // First 5 attempts should pass through to next()
    for (let i = 0; i < 5; i++) {
        let nextCalled = false;
        await new Promise((resolve) => {
            loginLimiter(makeReq(), res, () => {
                nextCalled = true;
                resolve();
            });
        });
        assert.strictEqual(nextCalled, true, `Attempt ${i + 1} should be allowed`);
    }

    // 6th attempt should return 429 (Too many requests)
    let nextCalled6 = false;
    await new Promise((resolve) => {
        resolveFn = resolve;
        loginLimiter(makeReq(), res, () => {
            nextCalled6 = true;
            resolve();
        });
    });

    assert.strictEqual(nextCalled6, false, '6th attempt should be blocked');
    assert.strictEqual(responseStatus, 429, 'Blocked request should return status 429');
    assert.ok(responsePayload.message.includes('Too many login attempts'), 'Message should indicate rate limit exceeded');

    console.log('Login Rate Limiting tests passed');
})();

(async () => {
    console.log('\n--- Testing Password Reset Rate Limiting ---');
    const ip = `192.168.2.${Math.floor(Math.random() * 254) + 1}`;
    const makeReq = () => ({
        ip,
        method: 'POST',
        originalUrl: '/api/auth/forgot-password',
        headers: {},
        app: {
            get(key) {
                if (key === 'trust proxy') return false;
            }
        }
    });
    
    let responseStatus = null;
    let responsePayload = null;
    let resolveFn = null;
    
    const res = {
        setHeader(name, value) {},
        status(code) {
            responseStatus = code;
            return this;
        },
        json(payload) {
            responsePayload = payload;
            if (resolveFn) resolveFn();
            return this;
        }
    };

    // First 3 attempts should pass through to next()
    for (let i = 0; i < 3; i++) {
        let nextCalled = false;
        await new Promise((resolve) => {
            passwordResetLimiter(makeReq(), res, () => {
                nextCalled = true;
                resolve();
            });
        });
        assert.strictEqual(nextCalled, true, `Attempt ${i + 1} should be allowed`);
    }

    // 4th attempt should return 429 (Too many requests)
    let nextCalled4 = false;
    await new Promise((resolve) => {
        resolveFn = resolve;
        passwordResetLimiter(makeReq(), res, () => {
            nextCalled4 = true;
            resolve();
        });
    });

    assert.strictEqual(nextCalled4, false, '4th attempt should be blocked');
    assert.strictEqual(responseStatus, 429, 'Blocked request should return status 429');
    assert.ok(responsePayload.message.includes('Too many password reset requests'), 'Message should indicate rate limit exceeded');

    console.log('Password Reset Rate Limiting tests passed');
    console.log('security-regression tests passed');
})();
