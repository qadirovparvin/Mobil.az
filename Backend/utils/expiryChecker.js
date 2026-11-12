/**
 * Mobilim.az — Promotion & Subscription Expiry Checker
 * 
 * Runs periodically to expire:
 *  - Ad promotions (VIP, BumpUp, etc.) whose promotionExpiresAt has passed
 *  - User packages whose packageExpiresAt has passed
 *  - Store subscriptions whose subscriptionExpiresAt has passed
 * 
 * Can be called from server.js via setInterval or imported as a standalone cron.
 */

const Ad    = require('../models/Ad');
const User  = require('../models/User');
const Store = require('../models/Store');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { deleteUploadFiles } = require('./uploadCleanup');
const { invalidateCache } = require('./redisClient');
const { withJobLock } = require('./jobLock');

const LOCK_TTL_MS = Number(process.env.EXPIRY_JOB_LOCK_TTL_MS || 10 * 60 * 1000);
const LISTING_EXPIRY_WARNING_MS = Number(process.env.LISTING_EXPIRY_WARNING_MS || 24 * 60 * 60 * 1000);

async function expirePromotions() {
    return withJobLock('expire-promotions', LOCK_TTL_MS, async () => {
        const now = new Date();

        // 1. Expire ad promotions
        const expiredAdsList = await Ad.find({
            status: { $nin: ['deleted', 'rejected', 'archived', 'expired'] },
            promotionType: { $ne: 'none' },
            promotionExpiresAt: { $lte: now }
        }).select('_id author brand modelName promotionType promotionExpiresAt promotionStartedAt');

        let adCount = 0;
        if (expiredAdsList.length > 0) {
            const bulkOps = expiredAdsList.map(ad => ({
                updateOne: {
                    filter: {
                        _id: ad._id,
                        promotionType: { $ne: 'none' },
                        promotionExpiresAt: { $lte: now }
                    },
                    update: {
                        $set: {
                            promotionType: 'none'
                        },
                        $unset: {
                            promotionExpiresAt: '',
                            promotionStartedAt: ''
                        }
                    }
                }
            }));

            const bulkRes = await Ad.bulkWrite(bulkOps, { ordered: false });
            adCount = bulkRes.modifiedCount || 0;

            if (adCount > 0) {
                const prevMap = new Map(expiredAdsList.map(a => [String(a._id), a]));
                const adIds = expiredAdsList.map(a => a._id);
                const reallyExpiredPromos = await Ad.find({
                    _id: { $in: adIds },
                    promotionType: 'none'
                }).select('_id author brand modelName promotionType promotionExpiresAt promotionStartedAt');

                const existingNotifs = await Notification.find({
                    relatedId: { $in: reallyExpiredPromos.map(a => a._id) },
                    type: 'promo',
                    title: 'VIP/PRO paketi bitdi'
                }).distinct('relatedId');
                const existingSet = new Set(existingNotifs.map(String));

                const auditLogs = reallyExpiredPromos.map(ad => {
                    const prev = prevMap.get(String(ad._id));
                    return {
                        actor: null,
                        targetModel: 'Ad',
                        target: ad._id,
                        action: 'ad.promo_expired',
                        previousState: {
                            promotionType: prev ? prev.promotionType : 'expired',
                            promotionStartedAt: prev ? prev.promotionStartedAt : null,
                            promotionExpiresAt: prev ? prev.promotionExpiresAt : null
                        },
                        newState: { promotionType: 'none' },
                        metadata: { job: 'expire-promotions' }
                    };
                });

                const notifications = reallyExpiredPromos
                    .filter(ad => !existingSet.has(String(ad._id)))
                    .map(ad => ({
                        user: ad.author,
                        type: 'promo',
                        title: 'VIP/PRO paketi bitdi',
                        body: `"${ad.brand} ${ad.modelName}" elanınız üçün VIP paketin müddəti bitdi.`,
                        link: '/cabinet.html',
                        relatedId: ad._id,
                        relatedType: 'Ad'
                    }));

                await Promise.all([
                    auditLogs.length ? AuditLog.insertMany(auditLogs, { ordered: false }).catch(err => console.error('AuditLog insert error:', err)) : Promise.resolve(),
                    notifications.length ? Notification.insertMany(notifications, { ordered: false }).catch(err => console.error('Notification insert error:', err)) : Promise.resolve()
                ]);
            }
        }

        if (adCount > 0) {
            await invalidateCache('ads:*');
        }

        // 2. Expire user packages (Downgrade to Standart: keep max 2 active ads, pause excess without deleting)
        const expiredUsersList = await User.find({
            activePackage: { $ne: 'none' },
            packageExpiresAt: { $lte: now }
        }).select('_id name email activePackage');

        for (const expUser of expiredUsersList) {
            try {
                const activeAds = await Ad.find({
                    author: expUser._id,
                    status: 'active'
                }).sort({ createdAt: -1 });

                if (activeAds.length > 2) {
                    const adsToPause = activeAds.slice(2).map(a => a._id);
                    await Ad.updateMany(
                        { _id: { $in: adsToPause } },
                        { $set: { status: 'archived' } }
                    );
                }

                await Ad.updateMany(
                    { author: expUser._id, promotionType: { $in: ['VIP', 'PRO', 'Premium'] } },
                    { $set: { promotionType: 'none' }, $unset: { promotionExpiresAt: '', promotionStartedAt: '' } }
                );

                await Notification.create({
                    user: expUser._id,
                    title: 'Paket müddəti bitdi',
                    message: 'Paketinizin 30 günlük müddəti başa çatdı və hesabınız Standart paketinə keçirildi. 2 aktiv elanınız saxlanıldı, digər elanlarınız silinmədən dayandırıldı.',
                    type: 'system'
                }).catch(() => {});
            } catch (err) {
                console.error('Error handling expired user:', expUser._id, err.message);
            }
        }

        const expiredUsers = await User.updateMany(
            {
                activePackage: { $ne: 'none' },
                packageExpiresAt: { $lte: now }
            },
            {
                $set: {
                    activePackage: 'none',
                    packageExpiresAt: null
                }
            }
        );

        // 3. Expire store subscriptions
        const expiredStores = await Store.updateMany(
            {
                subscriptionActive: true,
                subscriptionExpiresAt: { $lte: now }
            },
            {
                $set: {
                    subscriptionActive: false
                }
            }
        );

        const summary = {
            skipped: false,
            ads:    adCount,
            users:  expiredUsers.modifiedCount || 0,
            stores: expiredStores.modifiedCount || 0
        };

        if (summary.ads > 0 || summary.users > 0 || summary.stores > 0) {
            console.log(`⏰ Expiry check: ${summary.ads} ad promos, ${summary.users} user packages, ${summary.stores} store subs expired.`);
        }

        return summary;
    });
}

async function expireAds() {
    return withJobLock('expire-ads', LOCK_TTL_MS, async () => {
        const now = new Date();
        const expiredAds = await Ad.find({
            status: 'active',
            expiresAt: { $lte: now, $ne: null },
            expiredAt: null,
            deletedAt: null
        }).select('_id author brand modelName status expiresAt');

        let count = 0;
        if (expiredAds.length > 0) {
            const bulkOps = expiredAds.map(ad => ({
                updateOne: {
                    filter: {
                        _id: ad._id,
                        status: 'active',
                        expiresAt: { $lte: now, $ne: null },
                        expiredAt: null
                    },
                    update: { 
                        $set: { status: 'expired', expiredAt: now, promotionType: 'none' },
                        $unset: { promotionStartedAt: '', promotionExpiresAt: '' }
                    }
                }
            }));

            const bulkRes = await Ad.bulkWrite(bulkOps, { ordered: false });
            count = bulkRes.modifiedCount || 0;

            if (count > 0) {
                const prevMap = new Map(expiredAds.map(a => [String(a._id), a]));
                const adIds = expiredAds.map(a => a._id);
                const reallyExpired = await Ad.find({
                    _id: { $in: adIds },
                    status: 'expired'
                }).select('_id author brand modelName status expiresAt expiredAt');

                const existingNotifs = await Notification.find({
                    relatedId: { $in: reallyExpired.map(a => a._id) },
                    type: 'ad_status',
                    title: 'Elan müddəti bitdi'
                }).distinct('relatedId');
                const existingSet = new Set(existingNotifs.map(String));

                const auditLogs = reallyExpired.map(ad => {
                    const prev = prevMap.get(String(ad._id));
                    return {
                        actor: null,
                        targetModel: 'Ad',
                        target: ad._id,
                        action: 'ad.expired',
                        previousState: { status: 'active', expiresAt: prev ? prev.expiresAt : ad.expiresAt },
                        newState: { status: 'expired', expiredAt: ad.expiredAt || now },
                        metadata: { job: 'expire-ads' }
                    };
                });

                const notifications = reallyExpired
                    .filter(ad => !existingSet.has(String(ad._id)))
                    .map(ad => ({
                        user: ad.author,
                        type: 'ad_status',
                        title: 'Elan müddəti bitdi',
                        body: `"${ad.brand} ${ad.modelName}" elanınızın müddəti bitdi.`,
                        link: '/cabinet.html',
                        relatedId: ad._id,
                        relatedType: 'Ad'
                    }));

                await Promise.all([
                    auditLogs.length ? AuditLog.insertMany(auditLogs, { ordered: false }).catch(err => console.error('AuditLog insert error:', err)) : Promise.resolve(),
                    notifications.length ? Notification.insertMany(notifications, { ordered: false }).catch(err => console.error('Notification insert error:', err)) : Promise.resolve()
                ]);
            }
        }

        if (count > 0) {
            await invalidateCache('ads:*');
            console.log(`⏰ Expiry check: ${count} active ads expired.`);
        }
        return { skipped: false, count };
    });
}

async function notifyExpiringAds() {
    return withJobLock('notify-expiring-ads', LOCK_TTL_MS, async () => {
        const now = new Date();
        const soon = new Date(now.getTime() + LISTING_EXPIRY_WARNING_MS);
        const ads = await Ad.find({
            status: 'active',
            expiresAt: { $gt: now, $lte: soon },
            deletedAt: null
        }).select('_id author brand modelName expiresAt');

        if (!ads || ads.length === 0) {
            return { skipped: false, count: 0 };
        }

        const adIds = ads.map(a => a._id);
        const existingNotifs = await Notification.find({
            relatedId: { $in: adIds },
            type: 'ad_status',
            title: 'Elan müddəti bitmək üzrədir'
        }).distinct('relatedId');

        const existingSet = new Set(existingNotifs.map(String));

        const toCreate = ads
            .filter(ad => !existingSet.has(String(ad._id)))
            .map(ad => ({
                user: ad.author,
                type: 'ad_status',
                title: 'Elan müddəti bitmək üzrədir',
                body: `"${ad.brand} ${ad.modelName}" elanınızın müddəti tezliklə bitəcək.`,
                link: '/cabinet.html',
                relatedId: ad._id,
                relatedType: 'Ad'
            }));

        let count = 0;
        if (toCreate.length > 0) {
            try {
                const inserted = await Notification.insertMany(toCreate, { ordered: false });
                count = inserted ? inserted.length : toCreate.length;
            } catch (err) {
                console.error('notifyExpiringAds insert error:', err);
                count = (err.insertedDocs && err.insertedDocs.length) ? err.insertedDocs.length : 0;
            }
        }

        return { skipped: false, count };
    });
}

async function expireUnverifiedUsers() {
    const now = new Date();
    const unverifiedUsers = await User.find({
        isVerified: false,
        unverifiedExpiresAt: { $lte: now, $ne: null }
    });
    
    let count = 0;
    for (const user of unverifiedUsers) {
        if (user.isVerified) continue; // Safety check
        if (user.avatar) {
            await deleteUploadFiles([user.avatar]);
        }
        await User.deleteOne({ _id: user._id });
        count++;
    }
    
    if (count > 0) {
        console.log(`⏰ Expiry check: ${count} unverified users deleted.`);
    }
    return count;
}

module.exports = { expirePromotions, expireUnverifiedUsers, expireAds, notifyExpiringAds };
