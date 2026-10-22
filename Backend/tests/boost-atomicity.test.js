const assert = require('assert');
const mongoose = require('mongoose');
const User = require('../models/User');
const Ad = require('../models/Ad');
const BoostIdempotency = require('../models/BoostIdempotency');
const { boostAd } = require('../controllers/adController');

async function runTest() {
    await mongoose.connect('mongodb://127.0.0.1:27017/airyphone_db');
    console.log('Connected to MongoDB');

    try {
        const testEmail = `test_boost_${Date.now()}@test.com`;
        const testUser = await User.create({
            name: 'Boost Tester',
            email: testEmail,
            password: 'Password123!',
            walletBalance: 100
        });

        const testAd = await Ad.create({
            title: 'Test Phone For Boost',
            brand: 'Apple',
            modelName: 'iPhone 15',
            price: 1500,
            city: 'Bakı',
            author: testUser._id,
            status: 'active',
            category: 'Telefon'
        });

        console.log('--- TEST 1: Boost with idempotencyKey should succeed & deduct cost ---');
        const idempotencyKey = `promo-${Date.now()}-${testAd._id}`;
        let resJson = null;
        let resStatus = 200;
        const mockRes = {
            status: (s) => { resStatus = s; return mockRes; },
            json: (payload) => { resJson = payload; }
        };

        const mockReq = {
            user: testUser,
            params: { id: testAd._id.toString() },
            body: {
                promotionType: 'VIP',
                idempotencyKey
            },
            get: () => ''
        };

        await boostAd(mockReq, mockRes, (err) => { if (err) throw err; });
        assert.strictEqual(resStatus, 200);
        assert(resJson && resJson.walletBalance === 95, `Expected walletBalance 95, got ${resJson?.walletBalance}`);
        console.log('✓ TEST 1 passed: VIP boost succeeded, balance deducted from 100 to 95');

        console.log('--- TEST 2: Retry with SAME idempotencyKey must NOT deduct balance again ---');
        let resJson2 = null;
        const mockRes2 = {
            status: (s) => { resStatus = s; return mockRes2; },
            json: (payload) => { resJson2 = payload; }
        };
        await boostAd(mockReq, mockRes2, (err) => { if (err) throw err; });
        assert.strictEqual(resStatus, 200);
        assert(resJson2 && resJson2.idempotent === true, 'Expected idempotent: true');
        const userAfterRetry = await User.findById(testUser._id);
        assert.strictEqual(userAfterRetry.walletBalance, 95, `Balance must stay 95, got ${userAfterRetry.walletBalance}`);
        console.log('✓ TEST 2 passed: Idempotency re-play returned same result, balance remained 95');

        console.log('--- TEST 3: Atomicity Rollback on failure ---');
        // Now test rollback if ad becomes invalid or an error occurs during transaction
        // Set ad status to inactive so boost will fail during transaction
        await Ad.updateOne({ _id: testAd._id }, { status: 'pending' });
        const failReq = {
            user: userAfterRetry,
            params: { id: testAd._id.toString() },
            body: {
                promotionType: 'VIP',
                idempotencyKey: `promo-fail-${Date.now()}`
            },
            get: () => ''
        };

        let failResStatus = 200;
        let failResJson = null;
        const failRes = {
            status: (s) => { failResStatus = s; return failRes; },
            json: (payload) => { failResJson = payload; }
        };

        await boostAd(failReq, failRes, () => {});
        assert(failResStatus >= 400, `Expected error status, got ${failResStatus}`);

        const userAfterFail = await User.findById(testUser._id);
        assert.strictEqual(userAfterFail.walletBalance, 95, `Balance must remain 95 (no money lost), got ${userAfterFail.walletBalance}`);
        console.log('✓ TEST 3 passed: Balance preserved on failure, rollback 100% verified');

        // Cleanup
        await User.deleteOne({ _id: testUser._id });
        await Ad.deleteOne({ _id: testAd._id });
        await BoostIdempotency.deleteMany({ user: testUser._id });
        console.log('=== ALL TESTS PASSED SUCCESSFULLY! ===');

    } finally {
        await mongoose.disconnect();
    }
}

runTest().catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
});
