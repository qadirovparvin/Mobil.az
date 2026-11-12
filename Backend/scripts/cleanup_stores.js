const Store = require('../models/Store');
const Ad = require('../models/Ad');
const User = require('../models/User');
const { invalidateCache } = require('../utils/redisClient');

async function cleanupStoresAndStoreAds() {
    try {
        // 1. Delete all ads where sellerType === 'store' or store is not null
        const deletedAdsResult = await Ad.deleteMany({
            $or: [
                { sellerType: 'store' },
                { store: { $ne: null } },
                { storeId: { $ne: null, $exists: true } }
            ]
        });

        // 2. Delete all stores
        const deletedStoresResult = await Store.deleteMany({});

        // 3. Clear store references from users
        const updatedUsersResult = await User.updateMany(
            {
                $or: [
                    { store: { $ne: null, $exists: true } },
                    { storeId: { $ne: null, $exists: true } },
                    { shopId: { $ne: null, $exists: true } },
                    { role: 'store' }
                ]
            },
            {
                $unset: { store: 1, storeId: 1, shopId: 1 },
                $set: { role: 'user' }
            }
        );

        // 4. Invalidate Redis caches
        try {
            await invalidateCache('ads:*');
            await invalidateCache('stores:*');
        } catch (_) {}

        if (deletedAdsResult.deletedCount > 0 || deletedStoresResult.deletedCount > 0) {
            console.log(`[Store Cleanup] Deleted ${deletedStoresResult.deletedCount} stores and ${deletedAdsResult.deletedCount} store ads.`);
        }

        return {
            deletedAds: deletedAdsResult.deletedCount,
            deletedStores: deletedStoresResult.deletedCount,
            updatedUsers: updatedUsersResult.modifiedCount
        };
    } catch (err) {
        console.error('[Store Cleanup] Error during store cleanup:', err.message);
        return { error: err.message };
    }
}

if (require.main === module) {
    const path = require('path');
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
    const mongoose = require('mongoose');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/airyphone_db';
    mongoose.connect(mongoUri).then(async () => {
        const res = await cleanupStoresAndStoreAds();
        console.log('Cleanup result:', res);
        await mongoose.disconnect();
        process.exit(0);
    }).catch(e => {
        console.error(e);
        process.exit(1);
    });
}

module.exports = { cleanupStoresAndStoreAds };
