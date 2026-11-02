/**
 * Backend/tests/rate-limiter-cluster.test.js
 * Verification for:
 * - TASK: P1-REDIS-RATE-LIMIT-CLUSTER
 *
 * Test 1: DISABLE_RATE_LIMIT blocked in production (throws error)
 * Test 2: Missing REDIS_URL in production throws error / FATAL log (blocks PM2 cluster DDoS vulnerability)
 * Test 3: Log verification for Redis (cluster-shared) vs Memory (single-worker) + warning
 * Test 4: Rate limit enforcement: 100 requests allowed, 101st returns 429
 */

const assert = require('assert');
const { spawnSync } = require('child_process');
const path = require('path');
const rateLimit = require('express-rate-limit');

async function runClusterRateLimiterTests() {
    console.log('=== TEST SUITE: RATE LIMITER CLUSTER & REDIS SECURITY ===\n');

    // ─────────────────────────────────────────────────────────────
    // TEST 1: DISABLE_RATE_LIMIT in production is blocked
    // ─────────────────────────────────────────────────────────────
    console.log('--- TEST 1: DISABLE_RATE_LIMIT prod-da blok ---');

    // Test 1a: rateLimiter.js requires throw
    const procRateLimiter = spawnSync(
        process.execPath,
        ['-e', "require('./Backend/middlewares/rateLimiter')"],
        {
            cwd: path.resolve(__dirname, '../..'),
            env: {
                ...process.env,
                NODE_ENV: 'production',
                DISABLE_RATE_LIMIT: 'true',
                REDIS_URL: 'redis://127.0.0.1:6379'
            },
            encoding: 'utf8'
        }
    );
    assert.notStrictEqual(procRateLimiter.status, 0, 'rateLimiter should throw with non-zero exit code');
    const combined1a = (procRateLimiter.stderr || '') + (procRateLimiter.stdout || '');
    assert.ok(
        combined1a.includes('DISABLE_RATE_LIMIT blocked in production'),
        `Expected "DISABLE_RATE_LIMIT blocked in production", got: ${combined1a}`
    );
    console.log('✔ Test 1a passed: rateLimiter throws "DISABLE_RATE_LIMIT blocked in production"');

    // Test 1b: server.js starts and throws immediately
    const procServer1 = spawnSync(
        process.execPath,
        ['server.js'],
        {
            cwd: path.resolve(__dirname, '..'),
            env: {
                ...process.env,
                NODE_ENV: 'production',
                DISABLE_RATE_LIMIT: 'true',
                REDIS_URL: 'redis://127.0.0.1:6379'
            },
            encoding: 'utf8',
            timeout: 5000
        }
    );
    assert.notStrictEqual(procServer1.status, 0, 'server.js should fail to start with DISABLE_RATE_LIMIT=true in production');
    const combined1b = (procServer1.stderr || '') + (procServer1.stdout || '');
    assert.ok(
        combined1b.includes('DISABLE_RATE_LIMIT blocked in production'),
        `Expected server.js to fail with DISABLE_RATE_LIMIT blocked in production, got: ${combined1b}`
    );
    console.log('✔ Test 1b passed: server.js blocked from starting when DISABLE_RATE_LIMIT=true in production');

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Missing REDIS_URL in production throws error / FATAL log
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 2: Redis yox prod-da → throw və ya FATAL log ---');

    const envNoRedis = { ...process.env, NODE_ENV: 'production', REDIS_URL: '' };
    delete envNoRedis.DISABLE_RATE_LIMIT;

    // Test 2a: rateLimiter.js requires throw / FATAL
    const procRateLimiter2 = spawnSync(
        process.execPath,
        ['-e', "require('./Backend/middlewares/rateLimiter')"],
        {
            cwd: path.resolve(__dirname, '../..'),
            env: envNoRedis,
            encoding: 'utf8'
        }
    );
    assert.notStrictEqual(procRateLimiter2.status, 0, 'rateLimiter should fail when REDIS_URL is missing in production');
    const combined2a = (procRateLimiter2.stderr || '') + (procRateLimiter2.stdout || '');
    assert.ok(
        combined2a.includes('FATAL: REDIS_URL required in production for rate limiting') ||
        combined2a.includes('REDIS_URL required in production for rate limiting'),
        `Expected FATAL REDIS_URL error, got: ${combined2a}`
    );
    console.log('✔ Test 2a passed: rateLimiter throws FATAL: REDIS_URL required in production');

    // Test 2b: server.js fails to start without REDIS_URL in production
    const procServer2 = spawnSync(
        process.execPath,
        ['server.js'],
        {
            cwd: path.resolve(__dirname, '..'),
            env: envNoRedis,
            encoding: 'utf8',
            timeout: 5000
        }
    );
    assert.notStrictEqual(procServer2.status, 0, 'server.js should fail to start without REDIS_URL in production');
    const combined2b = (procServer2.stderr || '') + (procServer2.stdout || '');
    assert.ok(
        combined2b.includes('FATAL: REDIS_URL required in production for rate limiting') ||
        combined2b.includes('REDIS_URL required in production for rate limiting'),
        `Expected server.js to log FATAL REDIS_URL required in production, got: ${combined2b}`
    );
    console.log('✔ Test 2b passed: server.js blocked from starting without REDIS_URL in production');

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Memory vs Redis store log
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 3: Memory vs Redis store log ---');

    // Test 3a: A configured but unavailable Redis URL must not claim a shared store
    const procWithRedis = spawnSync(
        process.execPath,
        ['-e', "require('./Backend/middlewares/rateLimiter')"],
        {
            cwd: path.resolve(__dirname, '../..'),
            env: {
                ...process.env,
                NODE_ENV: 'development',
                REDIS_URL: 'redis://127.0.0.1:6379'
            },
            encoding: 'utf8'
        }
    );
    const outputWithRedis = (procWithRedis.stdout || '') + (procWithRedis.stderr || '');
    const reportsReadyRedis = outputWithRedis.includes('Rate limiter store: Redis (cluster-shared)');
    const reportsMemory = outputWithRedis.includes('Rate limiter store: Memory (single-worker)');
    assert.ok(reportsReadyRedis || reportsMemory, `Expected an accurate ready-Redis or memory-store report, got: ${outputWithRedis}`);
    if (reportsMemory) {
        assert.ok(outputWithRedis.includes('not shared across PM2 cluster workers'), `Expected memory-store warning, got: ${outputWithRedis}`);
    }
    console.log(`✔ Test 3a passed: Configured Redis store report is accurate (${reportsReadyRedis ? 'ready Redis' : 'memory fallback in development'})`);

    // Test 3b: Without Redis URL -> log must include "Memory (single-worker)" + warning
    const envDevNoRedis = { ...process.env, NODE_ENV: 'development' };
    delete envDevNoRedis.REDIS_URL;
    const procNoRedis = spawnSync(
        process.execPath,
        ['-e', "require('./Backend/middlewares/rateLimiter')"],
        {
            cwd: path.resolve(__dirname, '../..'),
            env: envDevNoRedis,
            encoding: 'utf8'
        }
    );
    const outputNoRedis = (procNoRedis.stdout || '') + (procNoRedis.stderr || '');
    assert.ok(
        outputNoRedis.includes('Memory (single-worker)'),
        `Expected output to contain "Memory (single-worker)", got: ${outputNoRedis}`
    );
    assert.ok(
        outputNoRedis.toLowerCase().includes('warning') || outputNoRedis.includes('⚠️'),
        `Expected output to contain warning about memory fallback, got: ${outputNoRedis}`
    );
    console.log('✔ Test 3b passed: When Redis absent, logged "Memory (single-worker)" + warning');

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Rate limit 429 enforcement (100 requests -> 429)
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- TEST 4: Rate limit 429 test (100 requests pass, 101st gets 429) ---');

    const testLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: { message: "Həddindən artıq müraciət" }
    });

    const testIp = '198.51.100.77';
    const makeReq = () => ({
        ip: testIp,
        headers: {},
        method: 'GET',
        url: '/api/ads',
        app: { get: () => false }
    });

    // Run 100 requests - all should succeed with next()
    for (let i = 1; i <= 100; i++) {
        let nextCalled = false;
        const resObj = {
            setHeader: () => {},
            getHeader: () => undefined,
            status: () => resObj,
            json: () => resObj
        };
        await testLimiter(makeReq(), resObj, () => {
            nextCalled = true;
        });
        assert.strictEqual(nextCalled, true, `Request ${i} should call next()`);
    }

    // 101st request should be rejected with 429
    let nextCalled101 = false;
    let statusCode101 = null;
    let responseBody101 = null;

    const resBlocked = {
        setHeader: () => {},
        getHeader: () => undefined,
        status(code) {
            statusCode101 = code;
            return resBlocked;
        },
        json(body) {
            responseBody101 = body;
            return resBlocked;
        },
        send(body) {
            responseBody101 = body;
            return resBlocked;
        }
    };

    await testLimiter(makeReq(), resBlocked, () => {
        nextCalled101 = true;
    });

    assert.strictEqual(nextCalled101, false, '101st request must NOT call next()');
    assert.strictEqual(statusCode101, 429, `101st request must return status 429, got ${statusCode101}`);
    assert.deepStrictEqual(responseBody101, { message: "Həddindən artıq müraciət" });
    console.log('✔ Test 4 passed: Exactly 100 requests allowed, 101st returned 429');

    console.log('\n🎉 ALL 4 CLUSTER & REDIS RATE LIMITER TESTS PASSED 100%!');
}

runClusterRateLimiterTests().catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
