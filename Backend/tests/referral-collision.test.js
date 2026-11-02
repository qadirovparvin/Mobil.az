/**
 * Backend/tests/referral-collision.test.js
 * Verification for: TASK: P2-REFERRAL-COLLISION-FIX
 *
 * Test 1: Real DB & hook E11000 duplicate key collision auto-recovery on referralCode
 * Test 2: generateReferralCode uniqueness (1000 generated codes, 0 duplicates)
 * Test 3: Retry limit protection (max 5 retries, prevents infinite loop)
 * Test 4: Auth registration rejects non-existent referral code with 400 Bad Request
 */

const assert = require('assert');
const User = require('../models/User');
const { connectTestDB, disconnectTestDB, assertSafeTestDB } = require('./setupTestDB');

async function runTests() {
    await connectTestDB();
    assertSafeTestDB();
    console.log('=== TEST SUITE: REFERRAL COLLISION & RECOVERY ===\n');

    // ─────────────────────────────────────────────────────────────
    // TEST 2: generateReferralCode uniqueness
    // ─────────────────────────────────────────────────────────────
    assertSafeTestDB();
    console.log('--- TEST 2: generateReferralCode uniqueness (1000 codes) ---');
    const codes = [];
    for (let i = 0; i < 1000; i++) {
        const code = User.generateReferralCode();
        assert.ok(typeof code === 'string', 'Code must be string');
        assert.match(code, /^AP-[0-9A-F]{16}$/, `Code ${code} must match AP-[16 hex chars]`);
        codes.push(code);
    }

    const uniqueSet = new Set(codes);
    console.log(`Generated: ${codes.length}, Unique: ${uniqueSet.size}`);
    assert.strictEqual(uniqueSet.size, 1000, 'All 1000 generated referral codes must be unique');
    console.log('✔ TEST 2 PASSED: 1000/1000 referral codes are 100% unique with zero collisions!\n');

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Retry limit protection (max 5 retries, no infinite loop)
    // ─────────────────────────────────────────────────────────────
    assertSafeTestDB();
    console.log('--- TEST 3: Retry limit protection (max 5 retries, prevents infinite loop) ---');
    const postHooks = User.schema.s.hooks._posts.get('save') || [];
    assert.ok(postHooks.length > 0, 'User schema must have post("save") hooks');

    // Find the error-handling post('save') hook (takes 3 arguments: error, doc, next)
    const errorHook = postHooks.find(h => typeof h.fn === 'function' && h.fn.length >= 3);
    assert.ok(errorHook, 'Post-save error handler hook must exist');

    const mockDoc = new User({
        name: 'Retry Limit User',
        email: `retry_limit_${Date.now()}@example.com`,
        password: 'password123'
    });
    mockDoc._referralRetryCount = 5; // already hit 5 retries

    const mockError = new Error('E11000 duplicate key error collection: users index: referralCode_1');
    mockError.code = 11000;
    mockError.keyPattern = { referralCode: 1 };

    let nextCalledWithError = null;
    await errorHook.fn.call(mockDoc, mockError, mockDoc, (err) => {
        nextCalledWithError = err;
    });

    assert.ok(nextCalledWithError instanceof Error, 'Must return an Error when retry limit reached');
    assert.strictEqual(
        nextCalledWithError.message,
        'Referral code generation failed after retries',
        'Error message must indicate failure after retries'
    );
    console.log('✔ TEST 3 PASSED: Stopped at retry limit (>= 5), returned clear Error, no infinite loop!\n');

    // ─────────────────────────────────────────────────────────────
    // TEST 1: E11000 collision recovery against actual MongoDB
    // ─────────────────────────────────────────────────────────────
    console.log('--- TEST 1: E11000 collision recovery against MongoDB ---');
    assertSafeTestDB();
    await User.syncIndexes();

    const timestamp = Date.now();
    const email1 = `ref_coll_user1_${timestamp}@example.com`;
    const email2 = `ref_coll_user2_${timestamp}@example.com`;

    // Clean up any leftovers
    await User.deleteMany({ email: { $in: [email1, email2] } });

    // 1. Create and save user 1
    const user1 = new User({
        name: 'User One',
        email: email1,
        password: 'password123Secure!'
    });
    await user1.save();
    const code1 = user1.referralCode;
    assert.ok(code1, 'User 1 must have an auto-generated referralCode');
    console.log(`User 1 saved with referralCode: ${code1}`);

    // 2. Create user 2 and deliberately force identical referralCode to cause DB collision
    const user2 = new User({
        name: 'User Two',
        email: email2,
        password: 'password123Secure!'
    });
    user2.referralCode = code1; // FORCE COLLISION!
    console.log(`Forced User 2 referralCode to: ${user2.referralCode} (same as User 1)`);

    // 3. Save User 2: MongoDB unique index will throw E11000, post('save') must catch and regenerate
    await user2.save();

    console.log(`User 2 save completed! Resolved referralCode: ${user2.referralCode}`);
    assert.ok(user2._id, 'User 2 must be successfully saved');
    assert.notStrictEqual(user2.referralCode, code1, 'User 2 referralCode must differ from User 1');
    assert.match(user2.referralCode, /^AP-[0-9A-F]{16}$/, 'User 2 must have a valid regenerated referralCode');
    assert.strictEqual(user2._referralRetryCount, 1, 'User 2 must have recovered via exactly 1 retry');

    // Verify both users persist in DB with distinct codes
    const dbUser1 = await User.findById(user1._id).lean();
    const dbUser2 = await User.findById(user2._id).lean();

    assert.strictEqual(dbUser1.referralCode, code1);
    assert.strictEqual(dbUser2.referralCode, user2.referralCode);
    assert.notStrictEqual(dbUser1.referralCode, dbUser2.referralCode);

    // Clean up
    await User.deleteMany({ email: { $in: [email1, email2] } });
    console.log('✔ TEST 1 PASSED: E11000 collision intercepted, new code regenerated, both users saved cleanly without 500!\n');

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Invalid referral code in authController returns 400
    // ─────────────────────────────────────────────────────────────
    assertSafeTestDB();
    console.log('--- TEST 4: Registration with non-existent referral code returns 400 ---');
    const authController = require('../controllers/authController');

    let statusCode = null;
    let responseBody = null;

    const mockReq = {
        body: {
            name: 'Invalid Ref Tester',
            email: `invalid_ref_${timestamp}@example.com`,
            password: 'ValidPassword123!',
            referralCode: 'AP-NONEXISTENT999'
        },
        ip: '127.0.0.1'
    };

    const mockRes = {
        status(code) {
            statusCode = code;
            return mockRes;
        },
        json(payload) {
            responseBody = payload;
            return mockRes;
        }
    };

    await authController.register(mockReq, mockRes, (err) => {
        if (err) throw err;
    });

    assert.strictEqual(statusCode, 400, `Expected status 400 for invalid referral code, got ${statusCode}`);
    assert.ok(
        responseBody?.message?.includes('referal kod etibarsızdır') || responseBody?.message?.includes('etibarsız'),
        `Expected error message about invalid referral code, got: ${JSON.stringify(responseBody)}`
    );
    console.log(`✔ TEST 4 PASSED: Invalid referral code returned status 400: "${responseBody.message}"\n`);

    console.log('🎉 ALL REFERRAL COLLISION & RECOVERY TESTS PASSED 100%!');
    await disconnectTestDB();
}

runTests().catch(async (err) => {
    console.error('❌ Test failed:', err);
    await disconnectTestDB().catch(() => {});
    process.exitCode = 1;
});
