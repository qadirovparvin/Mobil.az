const assert = require('assert');
const mongoose = require('mongoose');
const User = require('../models/User');
const Ad = require('../models/Ad');
const BoostIdempotency = require('../models/BoostIdempotency');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { boostAd } = require('../controllers/adController');

async function runTests() {
    await mongoose.connect('mongodb://127.0.0.1:27017/airyphone_db');
    console.log('Connected to MongoDB');

    try {
        console.log('=== TEST 1: Successful boost sets isBoosted: true, boostedAt, boostCount ===');
        const testUser = await User.create({
            name: 'Boost Promo Tester',
            email: `boost_promo_${Date.now()}@test.com`,
            password: 'Password123!',
            walletBalance: 200
        });

        const testAd = await Ad.create({
            title: 'Phone for Promo Test',
            brand: 'Apple',
            modelName: 'iPhone 14',
            price: 1200,
            city: 'Bakı',
            author: testUser._id,
            status: 'active',
            category: 'Telefon',
            isBoosted: false,
            promotionType: 'none',
            boostCount: 0
        });

        const idempotencyKey1 = `test-boost-key-1-${Date.now()}`;
        let resJson1 = null;
        let resStatus1 = 200;
        const mockRes1 = {
            status: (s) => { resStatus1 = s; return mockRes1; },
            json: (p) => { resJson1 = p; }
        };

        const req1 = {
            user: testUser,
            params: { id: testAd._id.toString() },
            body: { promotionType: 'VIP', idempotencyKey: idempotencyKey1 },
            get: () => ''
        };

        await boostAd(req1, mockRes1, (err) => { if (err) throw err; });
        assert.strictEqual(resStatus1, 200);

        const adAfterBoost1 = await Ad.findById(testAd._id);
        assert.strictEqual(adAfterBoost1.isBoosted, true, 'ad.isBoosted must be true after boost');
        assert.strictEqual(adAfterBoost1.promotionType, 'VIP', 'ad.promotionType must be VIP');
        assert.ok(adAfterBoost1.boostedAt, 'ad.boostedAt must be defined');
        assert.strictEqual(adAfterBoost1.boostCount, 1, 'ad.boostCount must be incremented to 1');
        assert.ok(adAfterBoost1.promotionExpiresAt, 'ad.promotionExpiresAt must be defined');
        console.log('✔ TEST 1 passed: isBoosted=true, promotionType=VIP, boostedAt, boostCount=1 verified!\n');

        console.log('=== TEST 2: Fallback failure must restore OLD promo state (not reset to none) ===');
        // Let's create an existing pre-boost transaction to ensure it is NOT deleted on rollback
        const existingTx = await Transaction.create({
            user: testUser._id,
            amount: -5,
            type: 'ad_boost',
            description: 'Old VIP promo',
            ad: testAd._id,
            balanceAfter: 195
        });

        const oldIsBoosted = adAfterBoost1.isBoosted;
        const oldPromotionType = adAfterBoost1.promotionType;
        const oldPromotionStartedAt = adAfterBoost1.promotionStartedAt;
        const oldPromotionExpiresAt = adAfterBoost1.promotionExpiresAt;
        const oldBoostedAt = adAfterBoost1.boostedAt;
        const oldBoostCount = adAfterBoost1.boostCount;
        const oldPublishedAt = adAfterBoost1.publishedAt;
        const oldExpiresAt = adAfterBoost1.expiresAt;

        // Force Notification.create to throw an error during the next boost
        // This will trigger the fallback catch block in adController
        const originalNotificationCreate = Notification.create;
        Notification.create = async () => {
            throw new Error('Simulated Notification DB failure for rollback test');
        };

        const idempotencyKey2 = `test-boost-fail-key-${Date.now()}`;
        let resJson2 = null;
        let resStatus2 = 200;
        let nextErr = null;
        const mockRes2 = {
            status: (s) => { resStatus2 = s; return mockRes2; },
            json: (p) => { resJson2 = p; }
        };

        const req2 = {
            user: await User.findById(testUser._id), // current balance 195
            params: { id: testAd._id.toString() },
            body: { promotionType: 'PRO', idempotencyKey: idempotencyKey2 },
            get: () => ''
        };

        try {
            await boostAd(req2, mockRes2, (err) => { nextErr = err; });
        } finally {
            // Restore original method
            Notification.create = originalNotificationCreate;
        }

        // Verify Ad state reverted to ALL 8 OLD promo state fields
        const adAfterFailedBoost = await Ad.findById(testAd._id);
        assert.strictEqual(
            adAfterFailedBoost.isBoosted,
            oldIsBoosted,
            `1. isBoosted should revert to old isBoosted (${oldIsBoosted}), but got ${adAfterFailedBoost.isBoosted}`
        );
        assert.strictEqual(
            adAfterFailedBoost.promotionType,
            oldPromotionType,
            `2. promotionType should revert to old promo ('${oldPromotionType}'), but got '${adAfterFailedBoost.promotionType}'`
        );
        assert.strictEqual(
            adAfterFailedBoost.promotionStartedAt?.toISOString(),
            oldPromotionStartedAt?.toISOString(),
            '3. promotionStartedAt should revert to old promotionStartedAt'
        );
        assert.strictEqual(
            adAfterFailedBoost.promotionExpiresAt?.toISOString(),
            oldPromotionExpiresAt?.toISOString(),
            '4. promotionExpiresAt should revert to old promotionExpiresAt'
        );
        assert.strictEqual(
            adAfterFailedBoost.boostedAt?.toISOString(),
            oldBoostedAt?.toISOString(),
            '5. boostedAt should revert to old boostedAt'
        );
        assert.strictEqual(
            adAfterFailedBoost.boostCount,
            oldBoostCount,
            `6. boostCount should revert to old boostCount (${oldBoostCount}), but got ${adAfterFailedBoost.boostCount}`
        );
        assert.strictEqual(
            adAfterFailedBoost.publishedAt?.toISOString(),
            oldPublishedAt?.toISOString(),
            '7. publishedAt should revert to old publishedAt'
        );
        assert.strictEqual(
            adAfterFailedBoost.expiresAt?.toISOString(),
            oldExpiresAt?.toISOString(),
            '8. expiresAt should revert to old expiresAt'
        );
        console.log('✔ All 8 fields correctly rolled back to PREVIOUS ad state on fallback failure!');

        // Verify User balance was refunded
        const userAfterFailedBoost = await User.findById(testUser._id);
        assert.strictEqual(
            userAfterFailedBoost.walletBalance,
            195,
            `User balance should be 195 (refunded), got ${userAfterFailedBoost.walletBalance}`
        );
        console.log('✔ User balance was correctly refunded to 195!');

        // Verify existingTx was NOT deleted by rollback
        const survivingTx = await Transaction.findById(existingTx._id);
        assert.ok(survivingTx, 'Pre-existing transaction must NOT be deleted by subsequent failed boost rollback');
        console.log('✔ Pre-existing transaction was preserved (not accidentally deleted by rollback)!');

        // Verify BoostIdempotency record status is 'failed'
        const failedClaim = await BoostIdempotency.findOne({ user: testUser._id, idempotencyKey: idempotencyKey2 });
        assert.ok(failedClaim, 'BoostIdempotency record for failed boost should exist');
        assert.strictEqual(failedClaim.status, 'failed', 'BoostIdempotency status must be failed');
        assert.ok(failedClaim.error && failedClaim.error.includes('Simulated Notification DB failure'), 'Error message should be recorded');
        console.log('✔ BoostIdempotency was marked status: failed with error message recorded!');

        // Cleanup
        await User.deleteOne({ _id: testUser._id });
        await Ad.deleteOne({ _id: testAd._id });
        await Transaction.deleteMany({ user: testUser._id });
        await Notification.deleteMany({ user: testUser._id });
        await BoostIdempotency.deleteMany({ user: testUser._id });

        console.log('\n=== ALL TESTS PASSED SUCCESSFULLY! 🚀 ===');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed with error:', err);
        process.exit(1);
    }
}

runTests();
