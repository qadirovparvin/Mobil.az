require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const Ad = require('../models/Ad');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { expireAds, expirePromotions, notifyExpiringAds } = require('../utils/expiryChecker');

async function runTests() {
    console.log('=== TEST SUITE: P2 LAST 3 FULL VERIFICATION ===\n');

    // 1. Static CSS checks
    console.log('--- Test 1: CSS overflow verification ---');
    const storeDetailCss = fs.readFileSync(path.join(__dirname, '..', '..', 'Front end', 'CSS', 'store-detail.css'), 'utf8');
    assert(!storeDetailCss.includes('.store-detail-main {\n    overflow-x: hidden;\n  }') && 
           !storeDetailCss.includes('.store-detail-main {\r\n    overflow-x: hidden;\r\n  }'),
           'store-detail.css must not have overflow-x: hidden on .store-detail-main');
    assert(storeDetailCss.includes('.store-detail-main') && storeDetailCss.includes('max-width: 100vw'),
           'store-detail.css must have max-width: 100vw on .store-detail-main');

    const styleCss = fs.readFileSync(path.join(__dirname, '..', '..', 'Front end', 'CSS', 'style.css'), 'utf8');
    assert(styleCss.includes('max-width: 100vw'), 'style.css must have max-width: 100vw');
    assert(styleCss.includes('overflow-x: clip'), 'style.css must have overflow-x: clip');

    const cabinetCss = fs.readFileSync(path.join(__dirname, '..', '..', 'Front end', 'CSS', 'cabinet.css'), 'utf8');
    assert(cabinetCss.includes('.cashout-modal-card') && cabinetCss.includes('max-height: 90vh') && cabinetCss.includes('overflow-y: auto'),
           'cabinet.css must have max-height: 90vh and overflow-y: auto on .cashout-modal-card');
    console.log('✓ Test 1 Passed: store-detail.css, style.css, and cabinet.css overflow styles verified.\n');

    // 2. Static Code checks on expiryChecker.js
    console.log('--- Test 2: expiryChecker.js code patterns ---');
    const expiryCheckerCode = fs.readFileSync(path.join(__dirname, '..', 'utils', 'expiryChecker.js'), 'utf8');
    assert(!expiryCheckerCode.includes('for (const ad of ads) {\n            const existing = await Notification.exists'),
           'expiryChecker.js must NOT have for-loop N+1 Notification.exists query');
    assert(expiryCheckerCode.includes("type: 'ad_status'") && expiryCheckerCode.includes("title: 'Elan müddəti bitmək üzrədir'"),
           'expiryChecker.js must query batch notifications for expiry warning');
    assert(expiryCheckerCode.includes("reallyExpired") && expiryCheckerCode.includes("status: 'expired'"),
           'expiryChecker.js expireAds must query reallyExpired status: expired');
    assert(expiryCheckerCode.includes("reallyExpiredPromos") && expiryCheckerCode.includes("promotionType: 'none'"),
           'expiryChecker.js expirePromotions must query reallyExpiredPromos promotionType: none');
    console.log('✓ Test 2 Passed: expiryChecker.js N+1 removal and reallyExpired verification patterns verified.\n');

    // 3. Database integration checks
    console.log('--- Test 3: Database Functional Tests ---');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create a test user
    const testUser = await User.create({
        name: 'Expiry Test User',
        email: `expiry_test_${Date.now()}@example.com`,
        phone: `+99450${Math.floor(1000000 + Math.random() * 9000000)}`,
        password: 'Password123!',
        balance: 100
    });

    const now = new Date();

    // Create 3 expiring ads (expiring in 2 hours)
    const expiringAds = await Ad.insertMany([
        {
            author: testUser._id,
            title: 'Expiring Phone 1',
            brand: 'Apple',
            modelName: 'iPhone 11',
            category: 'Telefonlar',
            city: 'Bakı',
            price: 500,
            status: 'active',
            expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000)
        },
        {
            author: testUser._id,
            title: 'Expiring Phone 2',
            brand: 'Apple',
            modelName: 'iPhone 12',
            category: 'Telefonlar',
            city: 'Bakı',
            price: 700,
            status: 'active',
            expiresAt: new Date(now.getTime() + 3 * 60 * 60 * 1000)
        },
        {
            author: testUser._id,
            title: 'Expiring Phone 3',
            brand: 'Apple',
            modelName: 'iPhone 13',
            category: 'Telefonlar',
            city: 'Bakı',
            price: 900,
            status: 'active',
            expiresAt: new Date(now.getTime() + 4 * 60 * 60 * 1000)
        }
    ]);

    // Test notifyExpiringAds: First run should create notifications for all 3
    const notifyRes1 = await notifyExpiringAds();
    console.log(`notifyExpiringAds Run 1 created: ${notifyRes1.count} notifications`);
    assert(notifyRes1.count >= 3, `Expected at least 3 notifications, got ${notifyRes1.count}`);

    const createdNotifs = await Notification.find({
        user: testUser._id,
        type: 'ad_status',
        title: 'Elan müddəti bitmək üzrədir'
    });
    assert.strictEqual(createdNotifs.length, 3, 'Expected exactly 3 notifications for testUser');

    // Second run immediately: should create 0 new notifications (idempotent / no duplicate warning)
    const notifyRes2 = await notifyExpiringAds();
    console.log(`notifyExpiringAds Run 2 created: ${notifyRes2.count} notifications`);
    const afterNotifs = await Notification.find({
        user: testUser._id,
        type: 'ad_status',
        title: 'Elan müddəti bitmək üzrədir'
    });
    assert.strictEqual(afterNotifs.length, 3, 'Second run must not duplicate warning notifications');

    // Test expireAds: Set ads to expired in the past
    await Ad.updateMany(
        { _id: { $in: expiringAds.map(a => a._id) } },
        { $set: { expiresAt: new Date(now.getTime() - 60 * 1000) } }
    );

    const expireRes1 = await expireAds();
    console.log(`expireAds Run 1 expired: ${expireRes1.count} ads`);
    assert(expireRes1.count >= 3, `Expected at least 3 ads expired, got ${expireRes1.count}`);

    const expiredCheck = await Ad.find({ _id: { $in: expiringAds.map(a => a._id) } });
    for (const ad of expiredCheck) {
        assert.strictEqual(ad.status, 'expired', `Ad ${ad._id} should have status: expired`);
    }

    const expiryNotifs = await Notification.find({
        user: testUser._id,
        type: 'ad_status',
        title: 'Elan müddəti bitdi'
    });
    assert.strictEqual(expiryNotifs.length, 3, 'Expected exactly 3 expiry notifications for testUser');

    // Run expireAds again: should expire 0 ads (idempotent)
    const expireRes2 = await expireAds();
    console.log(`expireAds Run 2 expired: ${expireRes2.count} ads`);
    assert.strictEqual(expireRes2.count, 0, 'No more active ads should be expired');

    // Cleanup test data
    await Ad.deleteMany({ author: testUser._id });
    await Notification.deleteMany({ user: testUser._id });
    await AuditLog.deleteMany({ target: { $in: expiringAds.map(a => a._id) } });
    await User.deleteOne({ _id: testUser._id });

    await mongoose.disconnect();
    console.log('\n✓ Test 3 Passed: Database functional tests for notifyExpiringAds and expireAds passed successfully!');
    console.log('\nALL TESTS PASSED SUCCESSFULLY! 🎉');
}

runTests().catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
});
