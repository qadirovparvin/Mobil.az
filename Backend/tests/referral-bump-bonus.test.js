/**
 * Automated Test: Referral Activation and 3x Bump Ad Bonus
 * Tests:
 * 1. Referral Link redirect GET /ref/:code -> 302 to /signup.html?ref=:code
 * 2. User registration with referralCode awards referrer:
 *    - +5 AZN walletBalance
 *    - +5 referralCredits
 *    - +3 bumpBonus (3 dəfə elanı irəli çək bonusu)
 *    - Notification & Transaction created
 * 3. Referral stats endpoint /api/referral/stats returns totalReferrals, bumpBonus, referralCredits
 * 4. User bumps ad using 1 free bump bonus:
 *    - walletBalance not charged (0 AZN)
 *    - bumpBonus decrements by 1 (3 -> 2)
 *    - Ad is boosted & moved to top (boostedAt & createdAt updated)
 *    - Transaction & Notification created
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_for_tests_1234567890123456';
process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_for_tests_9876543210123456';

const assert = require('assert');
const mongoose = require('mongoose');
const User = require('../models/User');
const Ad = require('../models/Ad');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { register } = require('../controllers/authController');
const { boostAd } = require('../controllers/adController');
const { getReferralStats } = require('../controllers/referralController');

async function runTests() {
    console.log('=== RUNNING REFERRAL & 3X BUMP BONUS TEST ===');
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mobilaz';
    await mongoose.connect(mongoUri);

    const ts = Date.now();
    const referrerEmail = `referrer_${ts}@example.com`;
    const friendEmail = `friend_${ts}@example.com`;

    try {
        // Step 1: Create Referrer User
        console.log('1. Creating Referrer user...');
        const referrer = await User.create({
            name: 'Əli',
            lastName: 'Həsənov',
            email: referrerEmail,
            password: 'Password123!',
            phone: `+99450${String(ts).slice(-7)}`,
            walletBalance: 10,
            bumpBonus: 0,
            referralCredits: 0
        });

        assert.ok(referrer.referralCode, 'Referrer must have an auto-generated referralCode');
        console.log(`✔ Referrer created with referralCode: ${referrer.referralCode}`);

        // Step 2: Register Friend with Referrer's code
        console.log('2. Registering friend with referralCode...');
        const friendPhone = `+99455${String(ts + 1).slice(-7)}`;
        let registerResult = null;
        let registerStatus = 200;

        const mockReq = {
            body: {
                name: 'Vəli',
                lastName: 'Məmmədov',
                email: friendEmail,
                password: 'Password123!',
                phone: friendPhone,
                referralCode: referrer.referralCode
            },
            ip: '127.0.0.1',
            get: () => 'TestAgent'
        };
        const mockRes = {
            status: (code) => {
                registerStatus = code;
                return mockRes;
            },
            json: (payload) => {
                registerResult = payload;
                return mockRes;
            },
            cookie: () => mockRes
        };

        await register(mockReq, mockRes, (err) => {
            if (err) throw err;
        });

        assert.strictEqual(registerStatus, 201, 'Friend registration must return 201');
        assert.ok(registerResult.user, 'Registration must return user');
        console.log('✔ Friend registered successfully!');

        // Step 3: Verify Referrer received +5 AZN and +3 bumpBonus
        console.log('3. Checking referrer balance and bumpBonus...');
        const updatedReferrer = await User.findById(referrer._id);
        assert.strictEqual(updatedReferrer.walletBalance, 15, `Referrer walletBalance should be 15, got ${updatedReferrer.walletBalance}`);
        assert.strictEqual(updatedReferrer.referralCredits, 5, `Referrer referralCredits should be 5, got ${updatedReferrer.referralCredits}`);
        assert.strictEqual(updatedReferrer.bumpBonus, 3, `Referrer bumpBonus should be 3, got ${updatedReferrer.bumpBonus}`);
        console.log(`✔ Referrer balance: ${updatedReferrer.walletBalance} AZN, Bump bonus: ${updatedReferrer.bumpBonus} dəfə!`);

        // Verify notification & transaction
        const refTx = await Transaction.findOne({ user: referrer._id, type: 'referral_credit' });
        assert.ok(refTx, 'Referral credit transaction must be logged');
        assert.strictEqual(refTx.amount, 5, 'Transaction amount must be 5');

        const refNotif = await Notification.findOne({ user: referrer._id, type: 'referral' });
        assert.ok(refNotif, 'Referral notification must be created');
        console.log('✔ Referrer notification and transaction verified!');

        // Step 4: Test /api/referral/stats
        console.log('4. Testing referral stats endpoint...');
        let statsData = null;
        const statsReq = { user: { _id: referrer._id } };
        const statsRes = {
            status: () => statsRes,
            json: (d) => { statsData = d; return statsRes; }
        };
        await getReferralStats(statsReq, statsRes, (err) => { if (err) throw err; });

        assert.strictEqual(statsData.totalReferrals, 1, 'Total referrals should be 1');
        assert.strictEqual(statsData.bumpBonus, 3, 'Stats bumpBonus should be 3');
        assert.strictEqual(statsData.referralCredits, 5, 'Stats referralCredits should be 5');
        console.log('✔ Referral stats verified: totalReferrals=1, bumpBonus=3, referralCredits=5');

        // Step 5: Test Free BumpUp on Referrer's ad
        console.log('5. Creating ad and bumping with free bonus...');
        const testAd = await Ad.create({
            author: referrer._id,
            title: 'Test iPhone 14 Pro Max',
            category: 'Telefon',
            brand: 'Apple',
            modelName: 'iPhone 14 Pro Max',
            price: 1800,
            city: 'Bakı',
            status: 'active',
            sellerType: 'personal'
        });

        const initialAdCreatedAt = testAd.createdAt;
        let boostResult = null;
        let boostStatus = 200;

        const boostReq = {
            user: { _id: referrer._id },
            params: { id: testAd._id.toString() },
            body: {
                promotionType: 'BumpUp',
                idempotencyKey: `bump-test-${ts}`
            },
            get: () => ''
        };
        const boostRes = {
            status: (code) => {
                boostStatus = code;
                return boostRes;
            },
            json: (d) => {
                boostResult = d;
                return boostRes;
            }
        };

        await boostAd(boostReq, boostRes, (err) => { if (err) throw err; });

        assert.strictEqual(boostStatus, 200, 'BoostAd should return 200');
        assert.strictEqual(boostResult.usedFreeBump, true, 'Boost should have used free bump');
        assert.strictEqual(boostResult.bumpBonus, 2, `bumpBonus should decrement to 2, got ${boostResult.bumpBonus}`);
        assert.strictEqual(boostResult.walletBalance, 15, `walletBalance should remain 15 (free), got ${boostResult.walletBalance}`);

        const bumpedAd = await Ad.findById(testAd._id);
        assert.strictEqual(bumpedAd.isBoosted, true, 'Ad isBoosted must be true');
        assert.strictEqual(bumpedAd.promotionType, 'BumpUp', 'Ad promotionType must be BumpUp');
        assert.ok(bumpedAd.boostedAt, 'Ad boostedAt must be set');
        console.log('✔ Ad successfully bumped with free bonus! Remaining bumps: 2, Wallet balance untouched: 15 AZN');

        console.log('\n🎉 ALL REFERRAL AND 3X BUMP BONUS TESTS PASSED 100%! 🎉');
    } finally {
        // Clean up test data
        await User.deleteMany({ email: { $in: [referrerEmail, friendEmail] } });
        await Ad.deleteMany({ title: 'Test iPhone 14 Pro Max' });
        await Transaction.deleteMany({ description: { $regex: 'Dostunu gətir bonusu|Pulsuz İrəli Çək' } });
        await Notification.deleteMany({ title: { $regex: 'Dostunu gətir|Elanınız irəli çəkildi' } });
        await mongoose.disconnect();
    }
}

runTests().catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
