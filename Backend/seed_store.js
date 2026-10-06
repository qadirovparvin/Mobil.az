require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Store = require('./models/Store');
const Ad = require('./models/Ad');

async function seed() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/airyphone_db';
  await mongoose.connect(mongoUri);
  console.log('✅ MongoDB bağlıdır:', mongoUri);

  // 1. Admin / Owner istifadəçisi tap və ya yarat
  let owner = await User.findOne({ email: 'mobil@gmail.com' });
  if (!owner) {
    const hash = await bcrypt.hash('admin123', 10);
    owner = await User.create({
      email: 'mobil@gmail.com',
      password: hash,
      name: 'Admin Mobil',
      role: 'admin',
      phone: '+994501234567',
      isVerified: true,
      status: 'active'
    });
    console.log('Owner yaradıldı:', owner.email);
  } else {
    console.log('Mövcud owner tapıldı:', owner.email);
  }

  // 2. Köhnə mağazanı və əlaqəli elanları təmizlə
  const existingStores = await Store.find({
    $or: [{ owner: owner._id }, { storeName: 'Mobil.az Rəsmi Mağaza' }, { storeName: 'Mağaza' }]
  });
  const existingStoreIds = existingStores.map(s => s._id);
  if (existingStoreIds.length > 0) {
    await Ad.deleteMany({ store: { $in: existingStoreIds } });
    await Store.deleteMany({ _id: { $in: existingStoreIds } });
    console.log('Köhnə mağazalar və elanlar təmizləndi');
  }

  // 3. Yeni PRO rəsmi mağaza yarat
  const store = await Store.create({
    owner: owner._id,
    storeName: 'Mobil.az Rəsmi Mağaza',
    description: 'Orijinal telefon və aksesuarlar - 5 il rəsmi zəmanət, 1 saat ərzində cavab, Bakı üzrə operativ çatdırılma',
    logoUrl: 'assets/images/default-avatar.svg',
    coverUrl: 'assets/images/default-cover.svg',
    contactNumber: '+994 50 123 45 67',
    city: 'Bakı',
    address: 'Əhməd Rəcəbli 1/4, Nərimanov',
    workingHours: 'Hər gün 09:00 - 21:00',
    voen: '1234567890',
    packageType: 'Pro',
    status: 'active',
    isVerified: true,
    rating: 4.9,
    reviewCount: 127,
    businessDetails: {
      legalName: 'Mobil.az MMC',
      businessType: 'Pərakəndə Satış'
    },
    socialLinks: {
      instagram: 'https://instagram.com/mobil.az',
      facebook: 'https://facebook.com/mobil.az',
      whatsapp: 'https://wa.me/994501234567',
      website: 'https://mobil.az'
    }
  });
  console.log('Mağaza yaradıldı:', store.storeName, store._id);

  // 4. İçini 6 real və cəlbedici elanla doldur
  const sampleAds = [
    { title: 'iPhone 15 Pro Max 256GB Titan', price: 2899, category: 'Telefon', brand: 'Apple', condition: 'Yeni' },
    { title: 'Samsung Galaxy S24 Ultra 512GB', price: 2450, category: 'Telefon', brand: 'Samsung', condition: 'Yeni' },
    { title: 'AirPods Pro 2-ci nəsil Type-C', price: 549, category: 'Aksesuar', brand: 'Apple', condition: 'Yeni' },
    { title: 'Xiaomi Redmi Note 13 Pro+ 5G', price: 599, category: 'Telefon', brand: 'Xiaomi', condition: 'Yeni' },
    { title: 'MacBook Air M2 256GB Midnight', price: 2350, category: 'Telefon', brand: 'Apple', condition: 'Yeni' },
    { title: 'Apple Watch Series 9 45mm Starlight', price: 899, category: 'Aksesuar', brand: 'Apple', condition: 'Yeni' }
  ];

  for (const adData of sampleAds) {
    await Ad.create({
      author: owner._id,
      store: store._id,
      sellerType: 'store',
      title: adData.title,
      modelName: adData.title,
      brand: adData.brand,
      category: adData.category,
      price: adData.price,
      condition: adData.condition,
      description: `${adData.title} - orijinal, rəsmi qutuda, 1 il zəmanət ilə satılır. Çatdırılma mövcuddur.`,
      images: ['assets/images/default-cover.svg'],
      city: 'Bakı',
      status: 'active',
      views: Math.floor(Math.random() * 400) + 50
    });
  }

  const count = await Ad.countDocuments({ store: store._id });
  console.log(`✅ ${count} elan yaradıldı, mağaza doludur`);
  console.log(`Link: http://localhost:5000/store-detail.html?id=${store._id}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(e => {
  console.error('Seed xətası:', e);
  process.exit(1);
});
