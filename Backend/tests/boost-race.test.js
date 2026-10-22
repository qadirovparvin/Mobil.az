const assert = require('assert');
const mongoose = require('mongoose');
const User = require('../models/User');
const Ad = require('../models/Ad');
const BoostIdempotency = require('../models/BoostIdempotency');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { boostAd } = require('../controllers/adController');

async function runRaceTest() {
    await mongoose.connect('mongodb://127.0.0.1:27017/airyphone_db');
    console.log('Connected to MongoDB');

    try {
        const testEmail = `test_boost_race_${Date.now()}@test.com`;
        const testUser = await User.create({
            name: 'Boost Race Tester',
            email: testEmail,
            password: 'Password123!',
            walletBalance: 100
        });

        const testAd = await Ad.create({
            title: 'Test Phone For Boost Race',
            brand: 'Apple',
            modelName: 'iPhone 15 Pro',
            price: 2000,
            city: 'Bakı',
            author: testUser._id,
            status: 'active',
            category: 'Telefon'
        });

        console.log('--- TEST: 2 Parallel Requests with identical idempotencyKey ---');
        const idempotencyKey = `race-promo-key-${Date.now()}`;

        // Create 2 identical requests with same idempotencyKey
        let resJson1 = null, resStatus1 = null;
        let resJson2 = null, resStatus2 = null;

        const makeReq = () => ({
            user: testUser,
            params: { id: testAd._id.toString() },
            body: {
                promotionType: 'VIP', // 5 AZN
                idempotencyKey
            },
            get: () => ''
        });

        const mockRes1 = {
            status: (s) => { resStatus1 = s; return mockRes1; },
            json: (p) => { resJson1 = p; }
        };

        const mockRes2 = {
            status: (s) => { resStatus2 = s; return mockRes2; },
            json: (p) => { resJson2 = p; }
        };

        // Fire both simultaneously via Promise.all
        console.log('Dispatching 2 simultaneous boostAd calls...');
        await Promise.all([
            boostAd(makeReq(), mockRes1, (err) => { if (err) console.error('Req1 err:', err); }),
            boostAd(makeReq(), mockRes2, (err) => { if (err) console.error('Req2 err:', err); })
        ]);

        console.log('Both requests completed.');
        console.log('Response 1:', { status: resStatus1 || 200, json: resJson1 });
        console.log('Response 2:', { status: resStatus2 || 200, json: resJson2 });

        // Verify wallet balance: exactly 1x deduction (100 - 5 = 95)
        const updatedUser = await User.findById(testUser._id);
        console.log(`User wallet balance after race: ${updatedUser.walletBalance} AZN`);
        assert.strictEqual(
            updatedUser.walletBalance,
            95,
            `RACE CONDITION DETECTED! Expected wallet balance to be 95 (1x deduction), but got ${updatedUser.walletBalance}`
        );
        console.log('✔ Wallet balance deducted exactly 1x (100 -> 95 AZN)!');

        // Verify transactions: exactly 1 transaction created
        const txCount = await Transaction.countDocuments({
            user: testUser._id,
            ad: testAd._id,
            type: 'ad_boost'
        });
        assert.strictEqual(txCount, 1, `Expected exactly 1 transaction, got ${txCount}`);
        console.log('✔ Exactly 1 transaction created!');

        // Verify notifications: exactly 1 notification created
        const notifCount = await Notification.countDocuments({
            user: testUser._id,
            relatedId: testAd._id,
            type: 'promo'
        });
        assert.strictEqual(notifCount, 1, `Expected exactly 1 notification, got ${notifCount}`);
        console.log('✔ Exactly 1 notification created!');

        // Verify BoostIdempotency record
        const claim = await BoostIdempotency.findOne({ user: testUser._id, idempotencyKey });
        assert.ok(claim, 'BoostIdempotency record must exist');
        assert.strictEqual(claim.status, 'completed', 'BoostIdempotency status must be completed');
        console.log('✔ BoostIdempotency record status is completed!');

        // Cleanup
        await User.deleteOne({ _id: testUser._id });
        await Ad.deleteOne({ _id: testAd._id });
        await Transaction.deleteMany({ user: testUser._id });
        await Notification.deleteMany({ user: testUser._id });
        await BoostIdempotency.deleteMany({ user: testUser._id });

        console.log('=== BOOST RACE TEST PASSED 100%! ✅ ===');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed with error:', err);
        process.exit(1);
    }
}

runRaceTest();
