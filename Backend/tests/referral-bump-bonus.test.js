const mongoose = require('mongoose');
const path = require('path');
const assert = require('assert');

const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Ad = require('../models/Ad');
const Notification = require('../models/Notification');
const { toSafeUser } = require('../utils/userSerializer');

async function runTests() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    try {
        const testSuffix = Date.now();

        // 1. Create Referrer User A
        const userA = await User.create({
            name: `Referrer_${testSuffix}`,
            email: `ref_${testSuffix}@example.com`,
            password: 'HashedPassword123!',
            isVerified: true
        });
        assert(userA.referralCode, 'User A should have an auto-generated referralCode');
        assert.strictEqual(userA.referralBumps, 0, 'User A should start with 0 referralBumps');
        assert.strictEqual(userA.referralVips, 0, 'User A should start with 0 referralVips');
        console.log('✓ Test 1 Passed: User A created with referralCode', userA.referralCode);

        // Test toSafeUser serialization
        const safeA = toSafeUser(userA);
        assert.strictEqual(safeA.referralBumps, 0, 'toSafeUser must serialize referralBumps');
        assert.strictEqual(safeA.referralVips, 0, 'toSafeUser must serialize referralVips');
        console.log('✓ Test 2 Passed: toSafeUser includes referralBumps and referralVips');

        // Helper simulation of grantReferralReward
        const grantReferralReward = async (newUserId) => {
            if (!newUserId) return null;
            const newUser = await User.findById(newUserId);
            if (!newUser || !newUser.referredBy || newUser.referralRewardGranted) {
                return null;
            }

            const referrer = await User.findById(newUser.referredBy);
            if (!referrer) return null;

            newUser.referralRewardGranted = true;
            await newUser.save();

            referrer.referralBumps = (referrer.referralBumps || 0) + 3;

            await Notification.create({
                user:  referrer._id,
                type:  'referral',
                title: 'Dostunu gətir bonusu! 🎁',
                body:  `${newUser.name || 'Dostunuz'} sizin dəvətinizlə qeydiyyatdan keçdi! Hesabınıza 3 ədəd pulsuz "İrəli çək" bonusu əlavə edildi.`,
                link:  '/cabinet.html#ads'
            });

            const totalReferrals = await User.countDocuments({
                referredBy: referrer._id,
                $or: [{ referralRewardGranted: true }, { isVerified: true }]
            });

            if (totalReferrals > 0 && totalReferrals % 3 === 0) {
                referrer.referralVips = (referrer.referralVips || 0) + 2;
                referrer.referralVipCampaignClaimedCount = (referrer.referralVipCampaignClaimedCount || 0) + 1;

                await Notification.create({
                    user:  referrer._id,
                    type:  'referral',
                    title: 'Kompaniya Bonusu Qazandınız! 👑',
                    body:  `Təbriklər! 3 dost dəvət etdiyiniz üçün hesabınıza 2 dəfə 1 həftəlik VIP elan bonusu əlavə edildi!`,
                    link:  '/cabinet.html#ads'
                });
            }

            await referrer.save();
            return { referrer, totalReferrals };
        };

        // 2. User B registers under User A (1st friend)
        const userB = await User.create({
            name: `Friend1_${testSuffix}`,
            email: `friend1_${testSuffix}@example.com`,
            password: 'HashedPassword123!',
            referredBy: userA._id,
            isVerified: true
        });

        await grantReferralReward(userB._id);

        let refreshedA = await User.findById(userA._id);
        assert.strictEqual(refreshedA.referralBumps, 3, 'User A should have earned 3 referralBumps');
        assert.strictEqual(refreshedA.referralVips, 0, 'User A should still have 0 VIPs (only 1 friend)');
        console.log('✓ Test 3 Passed: 1st friend earned 3 bumps (total: 3 bumps, 0 VIPs)');

        // Test double-crediting prevention
        const duplicateReward = await grantReferralReward(userB._id);
        assert.strictEqual(duplicateReward, null, 'Duplicate grantReferralReward should return null');
        refreshedA = await User.findById(userA._id);
        assert.strictEqual(refreshedA.referralBumps, 3, 'Bumps must not duplicate');
        console.log('✓ Test 4 Passed: Duplicate grant prevented');

        // 3. User C registers under User A (2nd friend)
        const userC = await User.create({
            name: `Friend2_${testSuffix}`,
            email: `friend2_${testSuffix}@example.com`,
            password: 'HashedPassword123!',
            referredBy: userA._id,
            isVerified: true
        });
        await grantReferralReward(userC._id);
        refreshedA = await User.findById(userA._id);
        assert.strictEqual(refreshedA.referralBumps, 6, 'User A should have 6 bumps after 2nd friend');
        assert.strictEqual(refreshedA.referralVips, 0, 'User A should still have 0 VIPs (2 friends)');
        console.log('✓ Test 5 Passed: 2nd friend earned 3 more bumps (total: 6 bumps, 0 VIPs)');

        // 4. User D registers under User A (3rd friend - Milestone!)
        const userD = await User.create({
            name: `Friend3_${testSuffix}`,
            email: `friend3_${testSuffix}@example.com`,
            password: 'HashedPassword123!',
            referredBy: userA._id,
            isVerified: true
        });
        await grantReferralReward(userD._id);
        refreshedA = await User.findById(userA._id);
        assert.strictEqual(refreshedA.referralBumps, 9, 'User A should have 9 bumps after 3rd friend');
        assert.strictEqual(refreshedA.referralVips, 2, 'User A should earn 2 VIP bonuses for 3 friends milestone!');
        console.log('✓ Test 6 Passed: 3rd friend completed milestone! Earned +3 bumps and +2 VIP bonuses (total: 9 bumps, 2 VIPs)');

        // 5. Test using bonus on Ad
        const testAd = await Ad.create({
            author: userA._id,
            title: `Test Ad ${testSuffix}`,
            category: 'phone',
            brand: 'Apple',
            modelName: 'iPhone 13',
            price: 1200,
            city: 'Bakı',
            contactPhone: '+994501234567',
            status: 'active'
        });

        // Bump the ad using 1 bump bonus
        const adController = require('../controllers/adController');
        const mockReqBump = {
            params: { id: testAd._id.toString() },
            body: { bonusType: 'bump' },
            user: { _id: userA._id }
        };
        let bumpResult;
        const mockResBump = {
            status: function(code) { this.statusCode = code; return this; },
            json: function(payload) { bumpResult = payload; return this; }
        };

        await adController.useAdBonus(mockReqBump, mockResBump, (err) => { if (err) throw err; });
        assert(bumpResult && bumpResult.success, 'useAdBonus bump should succeed');
        assert.strictEqual(bumpResult.referralBumps, 8, 'Remaining bumps should be 8');

        const bumpedAd = await Ad.findById(testAd._id);
        assert.strictEqual(bumpedAd.promotionType, 'BumpUp', 'Ad promotionType should be BumpUp');
        assert.strictEqual(bumpedAd.isBoosted, true, 'Ad isBoosted should be true');
        console.log('✓ Test 7 Passed: Successfully used 1 "İrəli çək" bonus to bump ad (remaining bumps: 8)');

        // VIP the ad using 1 VIP bonus
        const mockReqVip = {
            params: { id: testAd._id.toString() },
            body: { bonusType: 'vip' },
            user: { _id: userA._id }
        };
        let vipResult;
        const mockResVip = {
            status: function(code) { this.statusCode = code; return this; },
            json: function(payload) { vipResult = payload; return this; }
        };

        await adController.useAdBonus(mockReqVip, mockResVip, (err) => { if (err) throw err; });
        assert(vipResult && vipResult.success, 'useAdBonus vip should succeed');
        assert.strictEqual(vipResult.referralVips, 1, 'Remaining VIPs should be 1');

        const vipAd = await Ad.findById(testAd._id);
        assert.strictEqual(vipAd.promotionType, 'VIP', 'Ad promotionType should be VIP');
        assert(vipAd.promotionExpiresAt > new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), 'VIP expiry should be 7 days');
        console.log('✓ Test 8 Passed: Successfully used 1 "VIP" bonus to promote ad for 7 days (remaining VIPs: 1)');

        // 6. Test referral stats endpoint
        const referralController = require('../controllers/referralController');
        const mockReqStats = { user: { _id: userA._id } };
        let statsResult;
        const mockResStats = {
            status: function(code) { this.statusCode = code; return this; },
            json: function(payload) { statsResult = payload; return this; }
        };
        await referralController.getReferralStats(mockReqStats, mockResStats, (err) => { if (err) throw err; });
        assert.strictEqual(statsResult.totalReferrals, 3, 'totalReferrals should be 3');
        assert.strictEqual(statsResult.referralBumps, 8, 'referralBumps in stats should be 8');
        assert.strictEqual(statsResult.referralVips, 1, 'referralVips in stats should be 1');
        assert.strictEqual(statsResult.campaign.completedCycles, 1, 'completedCycles should be 1');
        console.log('✓ Test 9 Passed: getReferralStats returns correct metrics & campaign progress');

        // Cleanup
        await User.deleteMany({ _id: { $in: [userA._id, userB._id, userC._id, userD._id] } });
        await Ad.deleteOne({ _id: testAd._id });
        await Notification.deleteMany({ user: userA._id });
        console.log('✓ Cleanup complete');

        console.log('\n========================================');
        console.log('🎉 ALL REFERRAL SYSTEM TESTS PASSED 100%!');
        console.log('========================================\n');
    } finally {
        await mongoose.disconnect();
    }
}

runTests().catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
});
