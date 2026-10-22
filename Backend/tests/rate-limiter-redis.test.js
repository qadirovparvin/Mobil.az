require('dotenv').config();
const assert = require('assert');
const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const Redis = require('ioredis');
const { loginLimiter, loginRateLimiter } = require('../middlewares/rateLimiter');

async function runTests() {
    console.log('=== TEST SUITE: REDIS RATE LIMITER WITH FALLBACK ===\n');

    console.log('--- TEST 1: Rate limiter works with in-memory fallback when Redis is offline ---');
    const memoryLimiter = new RateLimiterMemory({
        keyPrefix: 'test_login',
        points: 5,
        duration: 60 * 15,
        blockDuration: 60 * 15
    });

    // Dummy offline client
    const dummyClient = new Redis('redis://127.0.0.1:6399', {
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null
    });
    dummyClient.on('error', () => {});

    const hybridLimiter = new RateLimiterRedis({
        storeClient: dummyClient,
        keyPrefix: 'test_login',
        points: 5,
        duration: 60 * 15,
        blockDuration: 60 * 15,
        insuranceLimiter: memoryLimiter
    });

    const testIp = `192.168.10.${Math.floor(Math.random() * 200 + 1)}`;

    // 5 attempts should consume points smoothly using memory fallback
    for (let i = 1; i <= 5; i++) {
        const res = await hybridLimiter.consume(testIp);
        assert.ok(res, `Attempt ${i} should consume points`);
        assert.strictEqual(res.remainingPoints, 5 - i, `Remaining points should be ${5 - i}`);
    }

    // 6th attempt must be rejected with RateLimiterRes (exceeded points)
    let rejected = false;
    try {
        await hybridLimiter.consume(testIp);
    } catch (rejRes) {
        rejected = true;
        assert.strictEqual(rejRes.remainingPoints, 0, 'Remaining points must be 0 on 6th attempt');
    }
    assert.strictEqual(rejected, true, '6th attempt must throw rate limit rejection');
    console.log('✔ TEST 1 passed: In-memory fallback allows 5 attempts and blocks the 6th when Redis is offline!');

    dummyClient.disconnect();

    console.log('\n--- TEST 2: loginRateLimiter Middleware (5 attempts allowed, 6th returns 429) ---');
    const middlewareIp = `10.0.0.${Math.floor(Math.random() * 200 + 1)}`;
    const makeReq = () => ({
        ip: middlewareIp,
        method: 'POST',
        originalUrl: '/api/auth/login',
        headers: {}
    });

    // First 5 attempts should pass through to next()
    for (let i = 1; i <= 5; i++) {
        let nextCalled = false;
        const resObj = {
            status: () => resObj,
            json: () => resObj
        };
        await loginLimiter(makeReq(), resObj, () => {
            nextCalled = true;
        });
        assert.strictEqual(nextCalled, true, `Middleware attempt ${i} must call next()`);
    }

    // 6th attempt must return status 429
    let nextCalled6 = false;
    let returnedStatus = null;
    let returnedBody = null;
    const resBlocked = {
        status: (code) => {
            returnedStatus = code;
            return resBlocked;
        },
        json: (payload) => {
            returnedBody = payload;
            return resBlocked;
        }
    };

    await loginLimiter(makeReq(), resBlocked, () => {
        nextCalled6 = true;
    });

    assert.strictEqual(nextCalled6, false, '6th attempt must NOT call next()');
    assert.strictEqual(returnedStatus, 429, '6th attempt must return HTTP status 429');
    assert.ok(returnedBody && returnedBody.message, 'Response body must contain message');
    console.log(`✔ TEST 2 passed: loginLimiter returns 429 on 6th attempt: "${returnedBody.message}"`);

    console.log('\n--- TEST 3: Multiple IPs are tracked independently ---');
    const anotherIp = `172.16.0.${Math.floor(Math.random() * 200 + 1)}`;
    let anotherNextCalled = false;
    await loginLimiter({ ip: anotherIp, method: 'POST', originalUrl: '/api/auth/login', headers: {} }, resBlocked, () => {
        anotherNextCalled = true;
    });
    assert.strictEqual(anotherNextCalled, true, 'Different IP must be allowed even when first IP is blocked');
    console.log('✔ TEST 3 passed: Different IP is tracked independently!');

    console.log('\n=== ALL RATE LIMITER TESTS PASSED 100%! 🚀 ===');
    process.exit(0);
}

runTests().catch((err) => {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
});
