const User = require('../models/User');
const Store = require('../models/Store');
const Ad = require('../models/Ad');
const bcrypt = require('bcryptjs');

const DEMO_ADS = [
    {
        adNumber: 'MOB-5D3802',
        brand: 'Samsung',
        modelName: 'Galaxy S24 Ultra',
        price: 1799,
        color: 'Titan Qara',
        memory: '256GB',
        ram: '12GB',
        promotionType: 'VIP',
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=1200&auto=format&fit=crop'
    },
    {
        adNumber: 'MOB-D38020',
        brand: 'Apple',
        modelName: 'iPhone 15 Pro Max',
        price: 1999,
        color: 'Titan Mavi',
        memory: '256GB',
        ram: '8GB',
        promotionType: 'VIP',
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=1200&auto=format&fit=crop'
    },
    {
        adNumber: 'MOB-D38021',
        brand: 'Apple',
        modelName: 'iPhone 15 Pro',
        price: 1699,
        color: 'Titan Ağ',
        memory: '128GB',
        ram: '8GB',
        promotionType: 'VIP',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop'
    },
    {
        adNumber: 'MOB-D38023',
        brand: 'Samsung',
        modelName: 'Galaxy S24+',
        price: 1299,
        color: 'Cobalt Violet',
        memory: '256GB',
        ram: '12GB',
        promotionType: 'VIP',
        image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=1200&auto=format&fit=crop'
    },
    {
        adNumber: 'MOB-D38024',
        brand: 'Apple',
        modelName: 'iPhone 14 Pro Max',
        price: 1399,
        color: 'Dərin Bənövşəyi',
        memory: '128GB',
        ram: '6GB',
        promotionType: 'VIP',
        image: 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?q=80&w=1200&auto=format&fit=crop'
    },
    {
        adNumber: 'MOB-D38025',
        brand: 'Xiaomi',
        modelName: 'Xiaomi 14 Ultra',
        price: 1599,
        color: 'Ağ',
        memory: '512GB',
        ram: '16GB',
        promotionType: 'VIP',
        image: 'https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=1200&auto=format&fit=crop'
    },
    {
        adNumber: 'MOB-D38026',
        brand: 'Google',
        modelName: 'Pixel 8 Pro',
        price: 1099,
        color: 'Qara',
        memory: '128GB',
        ram: '12GB',
        promotionType: 'VIP',
        image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=1200&auto=format&fit=crop'
    },
    {
        adNumber: 'MOB-D38027',
        brand: 'OnePlus',
        modelName: 'OnePlus 12',
        price: 999,
        color: 'Silky Black',
        memory: '256GB',
        ram: '12GB',
        promotionType: 'VIP',
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop'
    }
];

async function ensureDemoAds() {
    try {
        const count = await Ad.countDocuments({ status: { $ne: 'deleted' } });
        const hasGalaxyS24 = await Ad.exists({ adNumber: 'MOB-5D3802' });
        
        if (count >= 5 && hasGalaxyS24 && process.env.SEED_DEMO_ADS !== 'true') {
            return;
        }

        console.log(`[Seed] Checking demo ads (existing: ${count}). Ensuring demo catalogue...`);

        // 1. Ensure a seller user exists
        let seller = await User.findOne({ email: 'seller@mobilim.az' });
        if (!seller) {
            seller = await User.findOne({ role: 'admin' });
        }
        if (!seller) {
            const pw = await bcrypt.hash('Seller1234!', 10);
            seller = await User.create({
                name: 'Rauf',
                lastName: 'Məmmədov',
                email: 'seller@mobilim.az',
                password: pw,
                phone: '+994552345678',
                role: 'user',
                status: 'active',
                isVerified: true
            });
        }

        // 2. Ensure store exists
        let store = await Store.findOne({ storeName: 'TechZone Baku' });
        if (!store) {
            store = await Store.create({
                owner: seller._id,
                storeName: 'TechZone Baku',
                description: 'Bakının ən böyük texnika mağazası. Apple, Samsung, Xiaomi rəsmi distribütoru.',
                logoUrl: '/assets/images/default-avatar.svg',
                coverUrl: '/assets/images/default-cover.svg',
                packageType: 'Premium',
                address: 'Nizami küçəsi 96',
                city: 'Bakı',
                contactNumber: '+994123456789',
                isVerified: true,
                rating: 4.8,
                reviewCount: 127,
                subscriptionActive: true,
                status: 'active'
            });
        }

        // 3. Insert demo ads if not exist
        let inserted = 0;
        const now = new Date();
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        for (const d of DEMO_ADS) {
            const exists = await Ad.exists({ adNumber: d.adNumber });
            if (!exists) {
                await Ad.create({
                    adNumber: d.adNumber,
                    author: seller._id,
                    store: store._id,
                    sellerType: 'store',
                    category: 'Telefon',
                    brand: d.brand,
                    modelName: d.modelName,
                    price: d.price,
                    condition: 'Yeni',
                    description: `${d.brand} ${d.modelName} — rəsmi zəmanətlə satılır. Orijinal qutuda, tam yeni.`,
                    images: [d.image],
                    city: 'Bakı',
                    contactPhone: '+994123456789',
                    status: 'active',
                    publishedAt: now,
                    expiresAt: expires,
                    promotionType: d.promotionType,
                    specs: {
                        memory: d.memory,
                        ram: d.ram,
                        screenSize: '6.1-6.7',
                        battery: '4000-5000',
                        color: d.color,
                        features: {
                            nfc: true,
                            waterproof: true,
                            fingerprint: true,
                            delivery: true,
                            expandable: false
                        }
                    }
                });
                inserted++;
            }
        }

        console.log(`✅ Demo catalogue ensured: ${inserted} ads inserted.`);
    } catch (err) {
        console.error('❌ ensureDemoAds error:', err.message);
    }
}

module.exports = { ensureDemoAds };
