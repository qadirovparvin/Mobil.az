const User = require('../models/User');
const Store = require('../models/Store');
const Ad = require('../models/Ad');
const bcrypt = require('bcryptjs');

async function ensureDemoAds() {
    try {
        console.log('[Catalogue] Cleaning up dummy ads and ensuring real ads (Pərvin & Nəzrin)...');

        // 1. Delete all dummy / demo ads
        const deleteFilter = {
            $or: [
                { adNumber: { $regex: /^MOB-[D5]/i } },
                { adNumber: { $in: ['MOB-5D3802', 'MOB-D38020', 'MOB-D38021', 'MOB-D38023', 'MOB-D38024', 'MOB-D38025', 'MOB-D38026', 'MOB-D38027'] } },
                { description: /rəsmi zəmanətlə satılır\. Orijinal qutuda/i }
            ]
        };

        const deletedRes = await Ad.deleteMany(deleteFilter);
        if (deletedRes.deletedCount > 0) {
            console.log(`🗑️ Deleted ${deletedRes.deletedCount} dummy ads.`);
        }

        // Clean up dummy store TechZone Baku and dummy seller seller@mobilim.az
        await Store.deleteMany({ storeName: 'TechZone Baku' });
        await User.deleteMany({ email: 'seller@mobilim.az' });

        const now = new Date();
        const expires = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

        // 2. Ensure Pərvin Qədirov account exists & password is reset/synced
        const pw = await bcrypt.hash('Mobilim.az!090803', 10);

        let qadirovUser = await User.findOne({ email: 'qadirovparvin@gmail.com' });
        if (qadirovUser) {
            qadirovUser.password = pw;
            qadirovUser.role = 'admin';
            qadirovUser.status = 'active';
            qadirovUser.isVerified = true;
            qadirovUser.loginAttempts = 0;
            qadirovUser.lockUntil = null;
            qadirovUser.twoFactorEnabled = false;
            await qadirovUser.save();
            console.log('✅ Updated & unlocked qadirovparvin@gmail.com account.');
        } else {
            qadirovUser = await User.create({
                name: 'Pərvin',
                lastName: 'Qədirov',
                email: 'qadirovparvin@gmail.com',
                password: pw,
                role: 'admin',
                status: 'active',
                isVerified: true,
                twoFactorEnabled: false
            });
            console.log('✅ Created qadirovparvin@gmail.com user account.');
        }

        let parvinUser = await User.findOne({ 
            $or: [
                { email: 'mobilim.az@gmail.com' },
                { phone: { $in: ['+994703638808', '0703638808'] } }
            ]
        });

        if (!parvinUser) {
            parvinUser = qadirovUser;
        } else {
            parvinUser.password = pw;
            parvinUser.status = 'active';
            parvinUser.isVerified = true;
            parvinUser.loginAttempts = 0;
            parvinUser.lockUntil = null;
            await parvinUser.save();
        }

        // 3. Ensure Nəzrin Məmmədzadə exists
        let nazrinUser = await User.findOne({
            $or: [
                { phone: { $in: ['+994 77 777 77 77', '+994777777777', '0777777777'] } },
                { name: 'Nəzrin', lastName: 'Məmmədzadə' }
            ]
        });

        if (!nazrinUser) {
            const pw = await bcrypt.hash('Nazrin1234!', 10);
            nazrinUser = await User.create({
                name: 'Nəzrin',
                lastName: 'Məmmədzadə',
                phone: '+994 77 777 77 77',
                password: pw,
                role: 'user',
                status: 'active',
                isVerified: true
            });
            console.log('✅ Created Nəzrin user account.');
        }

        // 4. Ensure Pərvin's real Ad (Samsung Galaxy S22 Ultra Green)
        let parvinAd = await Ad.findOne({
            $or: [
                { adNumber: 'MOB-000001' },
                { author: parvinUser._id, brand: 'Samsung' }
            ]
        });

        const parvinImages = [
            '/uploads/images-parvin-s22.webp',
            'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=1200&auto=format&fit=crop'
        ];

        if (parvinAd) {
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
            parvinAd.contactPhone = '0703638808';
            parvinAd.status = 'active';
            parvinAd.promotionType = 'VIP';
            parvinAd.promotionExpiresAt = expires;
            parvinAd.expiresAt = expires;
            parvinAd.sellerType = 'personal';
            await parvinAd.save();
            console.log('✅ Pərvin\'s real ad updated with real photo & VIP status.');
        } else {
            await Ad.create({
                adNumber: 'MOB-000001',
                author: parvinUser._id,
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
                contactPhone: '0703638808',
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

        // 5. Ensure Nəzrin's real Ad (Apple iPhone 11)
        let nazrinAd = await Ad.findOne({
            $or: [
                { adNumber: 'MOB-000002' },
                { author: nazrinUser._id, brand: 'Apple' }
            ]
        });

        const nazrinImages = [
            '/uploads/images-1bda7bd0-b4cb-4488-98b4-f1dd4b97c778.webp'
        ];

        if (nazrinAd) {
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
            console.log('✅ Nəzrin\'s real ad updated with real photo & VIP status.');
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

        console.log('🎯 Database catalogue clean and verified: ONLY real ads for Pərvin and Nəzrin remain.');
    } catch (err) {
        console.error('❌ ensureDemoAds error:', err.message);
    }
}

module.exports = { ensureDemoAds };
