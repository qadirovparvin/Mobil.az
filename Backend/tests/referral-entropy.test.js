/**
 * Backend/tests/referral-entropy.test.js
 * Verification for: TASK: FIX-referral-entropy-8-bytes
 */

const assert = require('assert');
const crypto = require('crypto');
const User = require('../models/User');

async function run() {
    console.log('=== TEST: FIX-referral-entropy-8-bytes ===\n');

    // ── Test 1: 100 referral codes generated must all be unique ──
    console.log('--- Test 1: Generate 100 referral codes ---');
    const codes = [];
    for (let i = 0; i < 100; i++) {
        const code = User.generateReferralCode();
        assert.ok(typeof code === 'string', 'Code must be string');
        assert.match(
            code,
            /^AP-[0-9A-F]{16}$/,
            `Referral code ${code} must match AP-[16 hex chars]`
        );
        codes.push(code);
    }

    const uniqueSet = new Set(codes);
    console.log(`Generated: ${codes.length}, Unique: ${uniqueSet.size}`);
    console.log(`Sample referral code: ${codes[0]}`);
    assert.strictEqual(uniqueSet.size, 100, 'All 100 generated referral codes must be unique');
    console.log('✔ Test 1 PASSED: 100/100 codes are unique with 16 hex chars entropy!\n');

    // ── Test 2: pre-save hook generates code with retry on collision ──
    console.log('--- Test 2: pre("save") hook retry on collision ---');
    const preHooks = User.schema.s.hooks._pres.get('save');
    assert.ok(preHooks && preHooks.length > 0, 'User schema must have pre("save") hook');

    let attempts = 0;
    const origFindOne = User.findOne;

    // Simulate 2 collisions, 3rd attempt succeeds
    User.findOne = () => ({
        lean: async () => {
            attempts++;
            if (attempts < 3) {
                return { _id: 'collision-doc' };
            }
            return null;
        }
    });

    const user1 = new User({ name: 'User 1', password: 'password123' });
    assert.strictEqual(user1.referralCode, undefined);

    for (const hook of preHooks) {
        await hook.fn.call(user1);
    }

    assert.strictEqual(attempts, 3, 'Must have retried 3 times on collision');
    assert.match(user1.referralCode, /^AP-[0-9A-F]{16}$/);
    console.log(`✔ Test 2 PASSED: Retried 3 times on collision, generated ${user1.referralCode}\n`);

    // ── Test 3: pre-save hook catches duplicate key (11000) error and retries ──
    console.log('--- Test 3: pre("save") hook catches duplicate key (11000) and retries ---');
    let dupAttempts = 0;
    User.findOne = () => ({
        lean: async () => {
            dupAttempts++;
            if (dupAttempts < 3) {
                const err = new Error('E11000 duplicate key error');
                err.code = 11000;
                throw err;
            }
            return null;
        }
    });

    const user2 = new User({ name: 'User 2', password: 'password123' });
    for (const hook of preHooks) {
        await hook.fn.call(user2);
    }

    assert.strictEqual(dupAttempts, 3, 'Must have caught 11000 and retried');
    assert.match(user2.referralCode, /^AP-[0-9A-F]{16}$/);
    console.log(`✔ Test 3 PASSED: Caught duplicate key 11000 error and retried, generated ${user2.referralCode}\n`);

    User.findOne = origFindOne;

    console.log('🎉 ALL REFERRAL ENTROPY TESTS PASSED 100%!');
}

run().catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
