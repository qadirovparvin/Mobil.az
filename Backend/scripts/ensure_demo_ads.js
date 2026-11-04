const User = require('../models/User');
const Store = require('../models/Store');
const Ad = require('../models/Ad');
const bcrypt = require('bcryptjs');

async function ensureDemoAds() {
    try {
        console.log('[Catalogue] Ensuring ONLY 3 accounts: mobilim.az@gmail.com (admin), qadirovparvin@gmail.com (user), Nəzrin Məmmədzadə (user)...');

        // 1. Delete dummy stores & sellers
        await Store.deleteMany({ storeName: 'TechZone Baku' });
        await User.deleteMany({ email: 'seller@mobilim.az' });

        const now = new Date();
        const expires = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

        // 2. Ensure admin account (ONLY mobilim.az@gmail.com is admin)
        const adminPw = await bcrypt.hash('Mobilim.az!090803', 10);
        let adminUser = await User.findOne({ email: 'mobilim.az@gmail.com' });
        if (adminUser) {
            adminUser.role = 'admin';
            adminUser.name = 'Admin';
            adminUser.lastName = 'Mobilim.az';
            adminUser.password = adminPw;
            adminUser.phone = adminUser.phone || '+994120000000';
            adminUser.status = 'active';
            adminUser.isVerified = true;
            adminUser.loginAttempts = 0;
            adminUser.lockUntil = null;
            adminUser.twoFactorEnabled = false;
            await adminUser.save();
        } else {
            adminUser = await User.create({
                name: 'Admin',
                lastName: 'Mobilim.az',
                email: 'mobilim.az@gmail.com',
                phone: '+994120000000',
                password: adminPw,
                role: 'admin',
                status: 'active',
                isVerified: true,
                twoFactorEnabled: false
            });
        }

        // 3. Ensure Pərvin Qədirov account (role: 'user', personal account)
        const parvinPw = await bcrypt.hash('Gadirov!090803', 10);
        let qadirovUser = await User.findOne({ email: 'qadirovparvin@gmail.com' });
        if (qadirovUser) {
            qadirovUser.password = parvinPw;
            qadirovUser.role = 'user';
            qadirovUser.name = 'Pərvin';
            qadirovUser.lastName = 'Qədirov';
            qadirovUser.phone = '+994703638808';
            qadirovUser.status = 'active';
            qadirovUser.isVerified = true;
            qadirovUser.loginAttempts = 0;
            qadirovUser.lockUntil = null;
            qadirovUser.twoFactorEnabled = false;
            await qadirovUser.save();
            console.log('✅ Updated qadirovparvin@gmail.com (role: user, phone: +994703638808).');
        } else {
            qadirovUser = await User.create({
                name: 'Pərvin',
                lastName: 'Qədirov',
                email: 'qadirovparvin@gmail.com',
                phone: '+994703638808',
                password: parvinPw,
                role: 'user',
                status: 'active',
                isVerified: true,
                twoFactorEnabled: false
            });
            console.log('✅ Created qadirovparvin@gmail.com user account.');
        }

        // 4. Ensure Nəzrin Məmmədzadə account (role: 'user', personal account)
        const nazrinPw = await bcrypt.hash('Nazrin1234!', 10);
        let nazrinUser = await User.findOne({
            $or: [
                { email: 'nazrin.m@gmail.com' },
                { phone: { $in: ['+994 77 777 77 77', '+994777777777', '0777777777'] } },
                { name: 'Nəzrin', lastName: 'Məmmədzadə' }
            ]
        });

        if (nazrinUser) {
            nazrinUser.password = nazrinPw;
            nazrinUser.role = 'user';
            nazrinUser.name = 'Nəzrin';
            nazrinUser.lastName = 'Məmmədzadə';
            nazrinUser.email = 'nazrin.m@gmail.com';
            nazrinUser.phone = '+994 77 777 77 77';
            nazrinUser.status = 'active';
            nazrinUser.isVerified = true;
            nazrinUser.loginAttempts = 0;
            nazrinUser.lockUntil = null;
            nazrinUser.twoFactorEnabled = false;
            await nazrinUser.save();
            console.log('✅ Updated Nəzrin Məmmədzadə (email: nazrin.m@gmail.com, phone: +994 77 777 77 77).');
        } else {
            nazrinUser = await User.create({
                name: 'Nəzrin',
                lastName: 'Məmmədzadə',
                email: 'nazrin.m@gmail.com',
                phone: '+994 77 777 77 77',
                password: nazrinPw,
                role: 'user',
                status: 'active',
                isVerified: true,
                twoFactorEnabled: false
            });
            console.log('✅ Created Nəzrin user account.');
        }

        // 5. PURGE ALL OTHER USERS (keep ONLY the 3 approved users)
        const keptUserIds = [adminUser._id, qadirovUser._id, nazrinUser._id];
        const deletedUsers = await User.deleteMany({
            _id: { $nin: keptUserIds }
        });
        if (deletedUsers.deletedCount > 0) {
            console.log(`🗑️ Deleted ${deletedUsers.deletedCount} unneeded user accounts. Exactly 3 accounts remain.`);
        }

        // 6. Delete all dummy / demo ads (keep ONLY MOB-000001 and MOB-000002)
        const deleteAdsRes = await Ad.deleteMany({
            adNumber: { $nin: ['MOB-000001', 'MOB-000002'] }
        });
        if (deleteAdsRes.deletedCount > 0) {
            console.log(`🗑️ Deleted ${deleteAdsRes.deletedCount} demo ads.`);
        }

        // 7. Ensure Pərvin's real Ad (Samsung Galaxy S22 Ultra Green)
        const parvinImages = [
            '/uploads/images-parvin-s22.webp',
            'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=1200&auto=format&fit=crop'
        ];

        let parvinAd = await Ad.findOne({ adNumber: 'MOB-000001' });
        if (parvinAd) {
            parvinAd.author = qadirovUser._id;
            parvinAd.title = 'Samsung Galaxy S22 Ultra 5G Green';
            parvinAd.brand = 'Samsung';
            parvinAd.modelName = 'Galaxy S22';
            parvinAd.price = 1242;
            parvinAd.condition = 'Yeni';
            parvinAd.yaddas = '256';
            parvinAd.ram = '12';
            parvinAd.description = 'Samsung Galaxy S22 Ultra 5G Green 256GB/12GB';
            parvinAd.images = parvinImages;
            parvinAd.city = 'Sumqayıt';
            parvinAd.contactPhone = '+994703638808';
            parvinAd.status = 'active';
            parvinAd.promotionType = 'VIP';
            parvinAd.promotionExpiresAt = expires;
            parvinAd.expiresAt = expires;
            parvinAd.sellerType = 'personal';
            await parvinAd.save();
            console.log('✅ Pərvin\'s real ad linked to qadirovparvin@gmail.com.');
        } else {
            await Ad.create({
                adNumber: 'MOB-000001',
                author: qadirovUser._id,
                sellerType: 'personal',
                category: 'Telefon',
                brand: 'Samsung',
                modelName: 'Galaxy S22',
                title: 'Samsung Galaxy S22 Ultra 5G Green',
                price: 1242,
                condition: 'Yeni',
                yaddas: '256',
                ram: '12',
                description: 'Samsung Galaxy S22 Ultra 5G Green 256GB/12GB',
                images: parvinImages,
                city: 'Sumqayıt',
                contactPhone: '+994703638808',
                status: 'active',
                promotionType: 'VIP',
                promotionExpiresAt: expires,
                publishedAt: now,
                expiresAt: expires,
                specs: {
                    memory: '256',
                    ram: '12',
                    screenSize: '6.8',
                    battery: '5000',
                    color: 'Yaşıl',
                    features: {
                        nfc: true,
                        waterproof: true,
                        fingerprint: true,
                        expandable: false,
                        delivery: true
                    }
                }
            });
            console.log('✅ Pərvin\'s real ad created.');
        }

        // 8. Ensure Nəzrin's real Ad (Apple iPhone 11)
        const nazrinImages = [
            '/uploads/images-1bda7bd0-b4cb-4488-98b4-f1dd4b97c778.webp'
        ];

        let nazrinAd = await Ad.findOne({ adNumber: 'MOB-000002' });
        if (nazrinAd) {
            nazrinAd.author = nazrinUser._id;
            nazrinAd.title = 'Apple iPhone 11 128GB';
            nazrinAd.brand = 'Apple';
            nazrinAd.modelName = 'iPhone 11';
            nazrinAd.price = 500;
            nazrinAd.condition = 'İşlənmiş';
            nazrinAd.yaddas = '128';
            nazrinAd.ram = '4';
            nazrinAd.description = 'telefonum çiçək kimidi';
            nazrinAd.images = nazrinImages;
            nazrinAd.city = 'Bakı';
            nazrinAd.contactPhone = '+994 77 777 77 77';
            nazrinAd.status = 'active';
            nazrinAd.promotionType = 'VIP';
            nazrinAd.promotionExpiresAt = expires;
            nazrinAd.expiresAt = expires;
            nazrinAd.sellerType = 'personal';
            await nazrinAd.save();
            console.log('✅ Nəzrin\'s real ad linked to nazrinUser.');
        } else {
            await Ad.create({
                adNumber: 'MOB-000002',
                author: nazrinUser._id,
                sellerType: 'personal',
                category: 'Telefon',
                brand: 'Apple',
                modelName: 'iPhone 11',
                title: 'Apple iPhone 11 128GB',
                price: 500,
                condition: 'İşlənmiş',
                yaddas: '128',
                ram: '4',
                description: 'telefonum çiçək kimidi',
                images: nazrinImages,
                city: 'Bakı',
                contactPhone: '+994 77 777 77 77',
                status: 'active',
                promotionType: 'VIP',
                promotionExpiresAt: expires,
                publishedAt: now,
                expiresAt: expires,
                specs: {
                    memory: '128',
                    ram: '4',
                    screenSize: '6.1',
                    battery: '3110',
                    color: 'Ağ',
                    features: {
                        nfc: true,
                        waterproof: true,
                        fingerprint: false,
                        expandable: false,
                        delivery: false
                    }
                }
            });
            console.log('✅ Nəzrin\'s real ad created.');
        }

        console.log('🎯 Database catalogue clean and verified: EXACTLY 3 accounts (1 admin, 2 users) and 2 real ads.');
    } catch (err) {
        console.error('❌ ensureDemoAds error:', err.message);
    }
}

module.exports = { ensureDemoAds };
