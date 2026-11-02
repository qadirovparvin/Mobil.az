/**
 * Mobilim.az — Database Seed Script
 * Run: npm run seed
 *
 * Creates:
 *  - 2 users  (buyer + seller)
 *  - 1 store  (TechZone Baku — linked to seller)
 *  - 8 VIP ads + 16 regular ads (all Active)
 *  - Sample wallet transactions
 *  - Sample notifications
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

const isProdEnv = process.env.NODE_ENV === 'production';
dotenv.config();

// ── Production Guard ─────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
    console.error('SEED BLOCKED IN PRODUCTION');
    process.exit(1);
}

const User = require('./models/User');
const Ad = require('./models/Ad');
const Store = require('./models/Store');
const Transaction = require('./models/Transaction');
const Notification = require('./models/Notification');
const Review = require('./models/Review');

// ─── Connect ────────────────────────────────────────────────
const connectDB = require('./config/db');

// ─── Helpers ────────────────────────────────────────────────
const hash = async (pw) => bcrypt.hash(pw, 10);

const daysAgo = (n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
};

const daysFromNow = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
};

// ─── Seed Data ──────────────────────────────────────────────
const seedDatabase = async () => {
    await connectDB();

    console.log('🗑  Clearing existing data...');
    await Promise.all([
        User.deleteMany({}),
        Ad.deleteMany({}),
        Store.deleteMany({}),
        Transaction.deleteMany({}),
        Notification.deleteMany({}),
        Review.deleteMany({})
    ]);

    // ── Users ────────────────────────────────────────────────
    console.log('👤 Creating users...');

    const buyer = await User.create({
        name: 'Əli',
        lastName: 'Həsənov',
        email: 'buyer@mobilim.az',
        password: await hash('Test1234!'),
        phone: '+994501234567',
        role: 'user',
        status: 'active',
        walletBalance: 50,
        activePackage: 'none'
    });

    const seller = await User.create({
        name: 'Rauf',
        lastName: 'Məmmədov',
        email: 'seller@mobilim.az',
        password: await hash('Test1234!'),
        phone: '+994552345678',
        role: 'user',
        status: 'active',
        walletBalance: 250,
        activePackage: 'PRO',
        packageExpiresAt: daysFromNow(25)
    });

    console.log(`   ✅ Buyer:  ${buyer.email}  (referralCode: ${buyer.referralCode})`);
    console.log(`   ✅ Seller: ${seller.email} (referralCode: ${seller.referralCode})`);

    // ── Store ────────────────────────────────────────────────
    console.log('🏪 Creating store...');

    const store = await Store.create({
        owner: seller._id,
        storeName: 'TechZone Baku',
        description: 'Bakının ən böyük texnika mağazası. Apple, Samsung, Xiaomi rəsmi distribütoru.',
        logoUrl: '/Front end/Photo/store-logo.png',
        coverUrl: '/Front end/Photo/store-cover.png',
        packageType: 'Premium',
        address: 'Nizami küçəsi 96',
        city: 'Bakı',
        contactNumber: '+994123456789',
        socialLinks: {
            instagram: 'techzonebaku',
            whatsapp: '+994123456789',
            website: 'https://techzone.az'
        },
        isVerified: true,
        rating: 4.8,
        reviewCount: 127,
        subscriptionActive: true,
        subscriptionExpiresAt: daysFromNow(30),
        status: 'active'
    });

    console.log(`   ✅ Store: ${store.storeName}`);

    // ── Ads ──────────────────────────────────────────────────
    console.log('📱 Creating ads...');

    const baseSpecs = (memory, ram, color) => ({
        memory,
        ram,
        screenSize: '6.1"',
        battery: '3279 mAh',
        color,
        features: { nfc: true, waterproof: true, fingerprint: false, delivery: true }
    });

    // 8 VIP Ads (store-owned)
    const vipAdsData = [
        { brand: 'Apple', modelName: 'iPhone 15 Pro Max', price: 1999, color: 'Titan Mavi', memory: '256GB', ram: '8GB' },
        { brand: 'Apple', modelName: 'iPhone 15 Pro', price: 1699, color: 'Titan Ağ', memory: '128GB', ram: '8GB' },
        { brand: 'Samsung', modelName: 'Galaxy S24 Ultra', price: 1799, color: 'Titan Qara', memory: '256GB', ram: '12GB' },
        { brand: 'Samsung', modelName: 'Galaxy S24+', price: 1299, color: 'Cobalt Violet', memory: '256GB', ram: '12GB' },
        { brand: 'Apple', modelName: 'iPhone 14 Pro Max', price: 1399, color: 'Dərin Bənövşəyi', memory: '128GB', ram: '6GB' },
        { brand: 'Xiaomi', modelName: 'Xiaomi 14 Ultra', price: 1599, color: 'Ağ', memory: '512GB', ram: '16GB' },
        { brand: 'Google', modelName: 'Pixel 8 Pro', price: 1099, color: 'Qara', memory: '128GB', ram: '12GB' },
        { brand: 'OnePlus', modelName: 'OnePlus 12', price: 999, color: 'Silky Black', memory: '256GB', ram: '12GB' }
    ];

    const vipAds = await Promise.all(
        vipAdsData.map((d, i) => Ad.create({
            author: seller._id,
            store: store._id,
            sellerType: 'store',
            category: 'Telefon',
            brand: d.brand,
            modelName: d.modelName,
            price: d.price,
            condition: 'Yeni',
            description: `${d.brand} ${d.modelName} — rəsmi zəmanətlə satılır. Bağlama açılmayıb.`,
            images: [`/Photo/phone${(i % 6) + 1}.jpg`],
            city: 'Bakı',
            region: 'Nəsimi',
            contactPhone: '+994123456789',
            status: 'active',
            promotionType: 'VIP',
            promotionExpiresAt: daysFromNow(7),
            specs: baseSpecs(d.memory, d.ram, d.color),
            views: Math.floor(Math.random() * 500) + 100,
            createdAt: daysAgo(i + 1)
        }))
    );

    // 16 Regular Ads (mix of personal and store)
    const regularAdsData = [
        { brand: 'Apple', modelName: 'iPhone 13', price: 799, condition: 'İşlənmiş', city: 'Bakı', author: buyer._id, sellerType: 'personal' },
        { brand: 'Samsung', modelName: 'Galaxy A54', price: 499, condition: 'Yeni', city: 'Sumqayıt', author: seller._id, sellerType: 'store', store: store._id },
        { brand: 'Xiaomi', modelName: 'Redmi Note 13', price: 349, condition: 'Yeni', city: 'Gəncə', author: buyer._id, sellerType: 'personal' },
        { brand: 'Apple', modelName: 'iPhone 12 Pro', price: 699, condition: 'İşlənmiş', city: 'Bakı', author: buyer._id, sellerType: 'personal' },
        { brand: 'Samsung', modelName: 'Galaxy S23', price: 999, condition: 'Yeni', city: 'Bakı', author: seller._id, sellerType: 'store', store: store._id },
        { brand: 'Xiaomi', modelName: 'POCO X6 Pro', price: 449, condition: 'Yeni', city: 'Sumqayıt', author: buyer._id, sellerType: 'personal' },
        { brand: 'Apple', modelName: 'iPad Pro 12.9"', price: 1299, condition: 'Yeni', city: 'Bakı', author: seller._id, sellerType: 'store', store: store._id },
        { brand: 'Samsung', modelName: 'Galaxy Tab S9', price: 899, condition: 'Yeni', city: 'Bakı', author: buyer._id, sellerType: 'personal' },
        { brand: 'Apple', modelName: 'AirPods Pro 2', price: 349, condition: 'Yeni', city: 'Lənkəran', author: buyer._id, sellerType: 'personal' },
        { brand: 'Samsung', modelName: 'Galaxy Buds2 Pro', price: 199, condition: 'Yeni', city: 'Bakı', author: seller._id, sellerType: 'store', store: store._id },
        { brand: 'Xiaomi', modelName: 'Redmi 13C', price: 199, condition: 'Yeni', city: 'Gəncə', author: buyer._id, sellerType: 'personal' },
        { brand: 'Apple', modelName: 'Apple Watch S9', price: 599, condition: 'Yeni', city: 'Bakı', author: seller._id, sellerType: 'store', store: store._id },
        { brand: 'Huawei', modelName: 'Mate 60 Pro', price: 1199, condition: 'Yeni', city: 'Bakı', author: buyer._id, sellerType: 'personal' },
        { brand: 'Realme', modelName: 'Realme GT 5', price: 549, condition: 'Yeni', city: 'Mingəçevir', author: buyer._id, sellerType: 'personal' },
        { brand: 'Nokia', modelName: 'Nokia G42', price: 179, condition: 'İşlənmiş', city: 'Sumqayıt', author: buyer._id, sellerType: 'personal' },
        { brand: 'Motorola', modelName: 'Edge 40 Pro', price: 649, condition: 'Yeni', city: 'Bakı', author: buyer._id, sellerType: 'personal' }
    ];

    const regularAds = await Promise.all(
        regularAdsData.map((d, i) => Ad.create({
            author: d.author,
            store: d.store || null,
            sellerType: d.sellerType,
            category: d.modelName.includes('AirPods') || d.modelName.includes('Buds') ? 'Qulaqlıq'
                : d.modelName.includes('iPad') || d.modelName.includes('Tab') ? 'Tablet'
                    : d.modelName.includes('Watch') ? 'Saat'
                        : 'Telefon',
            brand: d.brand,
            modelName: d.modelName,
            price: d.price,
            condition: d.condition,
            description: `${d.brand} ${d.modelName} — ${d.condition === 'Yeni' ? 'tam yeni, bağlaması açılmayıb' : 'əla vəziyyətdə, problemi yoxdur'}.`,
            images: [`/Photo/phone${(i % 6) + 1}.jpg`],
            city: d.city,
            region: '',
            contactPhone: d.author === buyer._id ? buyer.phone : seller.phone,
            status: 'active',
            promotionType: 'none',
            specs: {
                memory: '128GB', ram: '6GB', screenSize: '6.4"',
                battery: '4500 mAh', color: 'Qara',
                features: { nfc: false, waterproof: false, fingerprint: true, delivery: false }
            },
            views: Math.floor(Math.random() * 200) + 10,
            createdAt: daysAgo(i * 2)
        }))
    );

    console.log(`   ✅ ${vipAds.length} VIP ads + ${regularAds.length} regular ads created`);

    // ── Wallet Transactions ──────────────────────────────────
    console.log('💳 Creating wallet transactions...');

    const txSeller = [
        { amount: 200, type: 'deposit', description: 'Balans artırımı — Kart ilə', balanceAfter: 200 },
        { amount: -150, type: 'package_purchase', description: 'PRO paket (30 gün)', balanceAfter: 50 },
        { amount: 250, type: 'deposit', description: 'Balans artırımı — Kart ilə', balanceAfter: 300 },
        { amount: -50, type: 'ad_boost', description: 'VIP promosyon — iPhone 15 Pro Max', balanceAfter: 250 },
        { amount: 5, type: 'referral_credit', description: 'Rauf dəvət etdi — bonus əlavə edildi', balanceAfter: 255 }
    ];

    await Promise.all(
        txSeller.map((t, i) => Transaction.create({
            user: seller._id,
            amount: t.amount,
            type: t.type,
            description: t.description,
            balanceAfter: t.balanceAfter,
            status: 'completed',
            createdAt: daysAgo(20 - i * 4)
        }))
    );

    const txBuyer = [
        { amount: 100, type: 'deposit', description: 'Balans artırımı — Kart ilə', balanceAfter: 100 },
        { amount: -50, type: 'ad_boost', description: 'BumpUp promosyon — iPhone 13', balanceAfter: 50 }
    ];

    await Promise.all(
        txBuyer.map((t, i) => Transaction.create({
            user: buyer._id,
            amount: t.amount,
            type: t.type,
            description: t.description,
            balanceAfter: t.balanceAfter,
            status: 'completed',
            createdAt: daysAgo(10 - i * 5)
        }))
    );

    console.log('   ✅ Transactions created');

    // ── Notifications ────────────────────────────────────────
    console.log('🔔 Creating notifications...');

    await Promise.all([
        Notification.create({
            user: seller._id, type: 'system',
            title: 'Mobilim.az-a xoş gəldiniz! 🎉',
            body: 'Hesabınız uğurla yaradıldı.',
            link: '/cabinet.html', isRead: true, createdAt: daysAgo(30)
        }),
        Notification.create({
            user: seller._id, type: 'ad_status',
            title: 'Elanınız aktivdir ✅',
            body: 'iPhone 15 Pro Max elanınız aktiv edildi.',
            link: '/cabinet.html#my-ads', isRead: true, createdAt: daysAgo(20)
        }),
        Notification.create({
            user: seller._id, type: 'promo',
            title: 'PRO paket aktivləşdirildi! ⚡',
            body: 'Hesabınız 30 gün ərzində PRO statusunda olacaq.',
            link: '/cabinet.html#packages', isRead: true, createdAt: daysAgo(15)
        }),
        Notification.create({
            user: seller._id, type: 'message',
            title: 'Əli Həsənov mesaj göndərdi',
            body: 'Salam, iPhone 15 Pro Max hələ satılıb?',
            link: '/cabinet.html#messages', isRead: false, createdAt: daysAgo(2)
        }),
        Notification.create({
            user: seller._id, type: 'referral',
            title: 'Referral bonusu! 🎁',
            body: 'Yeni istifadəçi dəvət linkinizlə qeydiyyatdan keçdi. +5 AZN.',
            link: '/cabinet.html#wallet', isRead: false, createdAt: daysAgo(1)
        }),
        Notification.create({
            user: buyer._id, type: 'system',
            title: 'Mobilim.az-a xoş gəldiniz! 🎉',
            body: 'Hesabınız uğurla yaradıldı. İlk elanınızı əlavə edin!',
            link: '/elan-yerlesdir.html', isRead: true, createdAt: daysAgo(10)
        }),
        Notification.create({
            user: buyer._id, type: 'ad_status',
            title: 'Elanınız aktivdir ✅',
            body: 'iPhone 13 elanınız aktiv edildi.',
            link: '/cabinet.html#my-ads', isRead: false, createdAt: daysAgo(3)
        })
    ]);

    console.log('   ✅ Notifications created');

    // ── Store Review ─────────────────────────────────────────
    console.log('⭐ Creating store review...');

    await Review.create({
        targetUser: seller._id,
        store: store._id,
        author: buyer._id,
        rating: 5,
        comment: 'Əla mağaza! Mallar keyfiyyətli, qiymətlər real, çatdırılma sürətli idi. Tövsiyyə edirəm.',
        reply: 'Təşəkkür edirik! Sizi TechZone ailəmizdə görməkdən məmnunuq 🙏'
    });

    console.log('   ✅ Review created');

    // ── Referential Integrity Cleanup ────────────────────────
    console.log('🔗 Verifying referential integrity...');

    // Find all ads with a store reference and verify the store exists
    const allStoreIds = (await Store.find({}, '_id')).map(s => s._id.toString());
    const orphanedAds = await Ad.updateMany(
        { store: { $ne: null, $nin: allStoreIds.map(id => new mongoose.Types.ObjectId(id)) } },
        { $set: { store: null, sellerType: 'personal' } }
    );
    if (orphanedAds.modifiedCount > 0) {
        console.log(`   ⚠️  Fixed ${orphanedAds.modifiedCount} ads with orphaned store references`);
    }

    // Clean user favorites — remove any ad IDs that no longer exist
    const allAdIds = (await Ad.find({}, '_id')).map(a => a._id);
    const usersWithFavs = await User.find({ favorites: { $exists: true, $ne: [] } });
    let cleanedFavs = 0;
    for (const u of usersWithFavs) {
        const validFavs = u.favorites.filter(fav => allAdIds.some(id => id.equals(fav)));
        if (validFavs.length < u.favorites.length) {
            cleanedFavs += u.favorites.length - validFavs.length;
            u.favorites = validFavs;
            await u.save();
        }
    }
    if (cleanedFavs > 0) {
        console.log(`   ⚠️  Removed ${cleanedFavs} stale favorites`);
    }

    console.log('   ✅ Integrity check passed');

    // ── Summary ──────────────────────────────────────────────
    console.log('\n✨ Seed completed successfully!');
    console.log('━'.repeat(50));
    console.log('🔑 Login credentials:');
    console.log('   Buyer:  buyer@mobilim.az  / Test1234!');
    console.log('   Seller: seller@mobilim.az / Test1234!');
    console.log('━'.repeat(50));
    console.log(`📊 Data summary:`);
    console.log(`   Users:         2`);
    console.log(`   Stores:        1  (TechZone Baku)`);
    console.log(`   VIP Ads:       ${vipAds.length}`);
    console.log(`   Regular Ads:   ${regularAds.length}`);
    console.log(`   Transactions:  ${txSeller.length + txBuyer.length}`);
    console.log(`   Notifications: 7`);
    console.log(`   Reviews:       1`);
    console.log('━'.repeat(50));

    process.exit(0);
};

seedDatabase().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
