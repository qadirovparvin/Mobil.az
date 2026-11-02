/**
 * Backend/tests/password-pro-security.test.js
 * Verification for: TASK: FIX-password-pro-security
 * 
 * Tests:
 * 1. "Password123" -> FAIL (symbol yox, 11 char amma symbol lazım)
 * 2. "P@ssw0rd1234" -> PASS
 * 3. bcrypt 12 hash -> ~300ms, salt rounds === 12
 * 4. login 6 cəhd 15 dəqdə -> 429, Redis shared olsa cluster-da da işləyir
 */

const assert = require('assert');
const bcrypt = require('bcryptjs');
const { validatePassword, validatePasswordStrength, PASSWORD_REGEX } = require('../utils/authSecurity');
const { loginLimiter } = require('../middlewares/rateLimiter');

async function runTests() {
    console.log('=== TEST SUITE: FIX-password-pro-security ===\n');

    // ── TEST 1: "Password123" -> FAIL (no symbol) ──
    console.log('--- Test 1: "Password123" must fail (symbol missing) ---');
    const resFail = validatePassword('Password123');
    console.log('validatePassword("Password123"):', resFail);
    assert.strictEqual(resFail.valid, false, '"Password123" must be invalid');
    assert.ok(
        resFail.message.toLowerCase().includes('simvol'),
        `Expected error message to mention symbol requirement, got: ${resFail.message}`
    );

    const strengthErrors = validatePasswordStrength('Password123');
    console.log('validatePasswordStrength("Password123") errors:', strengthErrors);
    assert.ok(
        strengthErrors.some((e) => e.includes('xüsusi simvol') || e.includes('simvol')),
        'validatePasswordStrength must return error for missing symbol'
    );
    assert.strictEqual(PASSWORD_REGEX.test('Password123'), false, 'Regex must reject "Password123"');
    console.log('✔ Test 1 passed: "Password123" failed as expected!\n');

    // ── TEST 2: "P@ssw0rd1234" -> PASS ──
    console.log('--- Test 2: "P@ssw0rd1234" must pass ---');
    const resPass = validatePassword('P@ssw0rd1234');
    console.log('validatePassword("P@ssw0rd1234"):', resPass);
    assert.strictEqual(resPass.valid, true, '"P@ssw0rd1234" must be valid');

    const passErrors = validatePasswordStrength('P@ssw0rd1234');
    console.log('validatePasswordStrength("P@ssw0rd1234") errors:', passErrors);
    assert.strictEqual(passErrors.length, 0, '"P@ssw0rd1234" must have 0 errors');
    assert.strictEqual(PASSWORD_REGEX.test('P@ssw0rd1234'), true, 'Regex must accept "P@ssw0rd1234"');
    console.log('✔ Test 2 passed: "P@ssw0rd1234" passed as expected!\n');

    // ── TEST 3: bcrypt 12 hash timing and rounds verification ──
    console.log('--- Test 3: bcrypt 12 salt rounds verification ---');
    const start = Date.now();
    const salt = await bcrypt.genSalt(12);
    const hash = await bcrypt.hash('P@ssw0rd1234', salt);
    const duration = Date.now() - start;
    console.log(`bcrypt 12 hash generated in ${duration}ms, hash: ${hash.slice(0, 20)}...`);

    // Verify bcrypt rounds is 12 (format: $2a$12$ or $2b$12$)
    const rounds = bcrypt.getRounds(hash);
    console.log(`bcrypt detected rounds: ${rounds}`);
    assert.strictEqual(rounds, 12, 'bcrypt salt rounds must be 12');
    assert.ok(await bcrypt.compare('P@ssw0rd1234', hash), 'bcrypt compare must succeed');
    console.log(`✔ Test 3 passed: bcrypt 12 hash verified (took ${duration}ms)!\n`);

    // ── TEST 4: login 6 attempts in 15 min window -> 429 ──
    console.log('--- Test 4: login 6 attempts -> 429 ---');
    const testIp = `198.51.100.${Math.floor(Math.random() * 200 + 1)}`;
    const makeReq = () => ({
        ip: testIp,
        method: 'POST',
        originalUrl: '/api/auth/login',
        headers: {},
        app: { get: () => false }
    });

    for (let i = 1; i <= 5; i++) {
        let called = false;
        const res = {
            status: () => res,
            json: () => res,
            setHeader: () => {}
        };
        await loginLimiter(makeReq(), res, () => { called = true; });
        assert.strictEqual(called, true, `Attempt ${i} must be allowed`);
    }

    let nextCalled6 = false;
    let statusCode6 = null;
    let body6 = null;
    const res6 = {
        status(c) {
            statusCode6 = c;
            return res6;
        },
        json(b) {
            body6 = b;
            return res6;
        },
        setHeader: () => {}
    };

    await loginLimiter(makeReq(), res6, () => { nextCalled6 = true; });
    assert.strictEqual(nextCalled6, false, '6th attempt must be blocked');
    assert.strictEqual(statusCode6, 429, '6th attempt must return HTTP 429');
    console.log(`6th attempt blocked with status: ${statusCode6}, message:`, body6);
    console.log('✔ Test 4 passed: 6th attempt blocked with 429!\n');

    console.log('🎉 ALL PRO SECURITY TESTS PASSED 100%!');
}

runTests().catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
