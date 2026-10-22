const { getTranslation } = require('../utils/translations');
const User = require('../models/User');
const Ad = require('../models/Ad');
const Store = require('../models/Store');
const Transaction = require('../models/Transaction');
const PaymentSession = require('../models/PaymentSession');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const Message = require('../models/Message');
const Report = require('../models/Report');
const Question = require('../models/Question');
const { deleteUploadFiles } = require('../utils/uploadCleanup');
const { DELETED_AD_STATUS, softDeleteAd } = require('../utils/adLifecycle');
const { invalidateCache } = require('../utils/redisClient');
const { safeJoinPrivate } = require('../utils/privateFileService');
const { readBoolean, readEnum, readObjectId, readString, safePageLimit, validateAllowedFields } = require('../utils/securityValidation');

const writeAudit = async (req, { targetModel, target, action, previousState, newState, reason = '', metadata = null }) => {
    await AuditLog.create({
        actor: req.user?._id || null,
        targetModel,
        target,
        action,
        previousState,
        newState,
        reason,
        requestId: req.id || '',
        metadata,
        ip: req.ip || '',
        userAgent: (typeof req.get === 'function' ? req.get('user-agent') : req.headers?.['user-agent']) || ''
    });
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res, next) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalAds = await Ad.countDocuments();
        const activeAds = await Ad.countDocuments({ status: 'active' });
        const totalStores = await Store.countDocuments();

        const revenueResult = await Transaction.aggregate([
            { $match: { type: { $in: ['package_purchase', 'ad_boost'] } } },
            { $group: { _id: null, totalRevenue: { $sum: { $abs: "$amount" } } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        res.json({
            success: true,
            data: {
                totalUsers,
                totalAds,
                activeAds,
                totalStores,
                totalRevenue
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users (paginated)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
    try {
        validateAllowedFields(req.query, ['page', 'limit', 'search', 'q'], 'query');
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        const search = String(req.query.search || req.query.q || '').trim();
        const filter = {};
        if (search) {
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.$or = [
                { name: { $regex: escaped, $options: 'i' } },
                { lastName: { $regex: escaped, $options: 'i' } },
                { email: { $regex: escaped, $options: 'i' } },
                { phone: { $regex: escaped, $options: 'i' } }
            ];
        }

        const totalUsers = await User.countDocuments(filter);
        const users = await User.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-password');

        const totalPages = Math.ceil(totalUsers / limit) || 1;

        const userIds = users.map(u => u._id);

        let adsCountMap = new Map();
        let refCountMap = new Map();

        if (userIds.length > 0) {
            const [adsAgg, refAgg] = await Promise.all([
                Ad.aggregate([
                    {
                        $match: {
                            $or: [
                                { author: { $in: userIds } },
                                { user: { $in: userIds } },
                                { seller: { $in: userIds } }
                            ],
                            status: { $ne: 'deleted' },
                            isDeleted: { $ne: true }
                        }
                    },
                    {
                        $project: {
                            userId: { $ifNull: ['$author', { $ifNull: ['$user', '$seller'] }] }
                        }
                    },
                    {
                        $group: {
                            _id: '$userId',
                            count: { $sum: 1 }
                        }
                    }
                ]),
                User.aggregate([
                    {
                        $match: {
                            referredBy: { $in: userIds }
                        }
                    },
                    {
                        $group: {
                            _id: '$referredBy',
                            count: { $sum: 1 }
                        }
                    }
                ])
            ]);

            adsCountMap = new Map(adsAgg.map(a => [String(a._id), a.count]));
            refCountMap = new Map(refAgg.map(r => [String(r._id), r.count]));
        }

        const usersWithMetrics = users.map((u) => {
            const uidStr = String(u._id);
            const adsCount = adsCountMap.get(uidStr) || 0;
            const referralCount = Array.isArray(u.referrals)
                ? u.referrals.length
                : (refCountMap.get(uidStr) || 0);
            const uObj = typeof u.toObject === 'function' ? u.toObject() : u;
            return {
                ...uObj,
                adsCount,
                balance: u.walletBalance ?? 0,
                walletBalance: u.walletBalance ?? 0,
                referralCount
            };
        });

        return res.json({
            success: true,
            data: usersWithMetrics,
            users: usersWithMetrics,
            totalUsers,
            totalPages,
            currentPage: page,
            pagination: {
                page,
                limit,
                totalUsers,
                totalPages,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user detailed metrics, ads, transactions, and referrals
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserDetails = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
        }

        const adQueryFilter = {
            $or: [{ author: user._id }, { user: user._id }, { seller: user._id }],
            status: { $ne: 'deleted' },
            isDeleted: { $ne: true }
        };
        const refQueryFilter = { referredBy: user._id };

        const [ads, countOfAds, transactions, totalTransactionsCount, referrals, totalReferralCount] = await Promise.all([
            Ad.find(adQueryFilter).sort({ createdAt: -1 }).limit(50),
            Ad.countDocuments(adQueryFilter),
            Transaction.find({ user: user._id }).sort({ createdAt: -1 }).limit(50),
            Transaction.countDocuments({ user: user._id }),
            User.find(refQueryFilter).select('name lastName email phone createdAt').sort({ createdAt: -1 }).limit(50),
            User.countDocuments(refQueryFilter)
        ]);

        const adsCount = countOfAds;
        const referralCount = Array.isArray(user.referrals) ? user.referrals.length : totalReferralCount;

        res.json({
            success: true,
            user: {
                ...user.toObject(),
                adsCount,
                balance: user.walletBalance ?? 0,
                referralCount
            },
            ads,
            transactions,
            referrals,
            counts: {
                ads: adsCount,
                transactions: totalTransactionsCount,
                referrals: referralCount
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all ads (paginated)
// @route   GET /api/admin/ads
// @access  Private/Admin
const getAllAds = async (req, res, next) => {
    try {
        validateAllowedFields(req.query, ['page', 'limit'], 'query');
        const { page, limit, skip } = safePageLimit(req.query, { defaultLimit: 10, maxLimit: 100 });

        const ads = await Ad.find().populate('author', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await Ad.countDocuments();

        const totalPages = Math.ceil(total / limit);
        res.json({
            success: true,
            data: ads,
            pagination: { page, limit, totalAds: total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all transactions (paginated)
// @route   GET /api/admin/transactions
// @access  Private/Admin
const getAllTransactions = async (req, res, next) => {
    try {
        validateAllowedFields(req.query, ['page', 'limit'], 'query');
        const { page, limit, skip } = safePageLimit(req.query, { defaultLimit: 10, maxLimit: 100 });

        const transactions = await Transaction.find().populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await Transaction.countDocuments();

        const totalPages = Math.ceil(total / limit);
        res.json({
            success: true,
            data: transactions,
            total,
            totalTransactions: total,
            pagination: { page, limit, total, totalTransactions: total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update ad moderation status
// @route   PUT /api/admin/ads/:id/status
// @access  Private/Admin
const updateAdStatus = async (req, res, next) => {
    try {
        validateAllowedFields(req.body, ['status'], 'body');
        const { status } = req.body;
        const allowedStatuses = ['pending', 'active', 'rejected', 'archived', 'sold', DELETED_AD_STATUS];

        const cleanStatus = readEnum(typeof status === 'string' ? status.toLowerCase() : status, allowedStatuses, { fieldName: 'status', required: true, maxLength: 20 });

        const ad = await Ad.findById(req.params.id);
        if (!ad) {
            return res.status(404).json({ success: false, message: 'Ad not found' });
        }

        if (ad.status === DELETED_AD_STATUS && cleanStatus !== DELETED_AD_STATUS) {
            return res.status(400).json({
                success: false,
                message: 'Deleted ads cannot be restored from this endpoint because image files are removed during deletion.'
            });
        }

        if (cleanStatus === DELETED_AD_STATUS) {
            const deleted = await softDeleteAd({ ad, deletedBy: req.user._id });
            await invalidateCache('ads:VIP:cache:*');
            return res.json({
                success: true,
                data: deleted.ad
            });
        }

        const previousStatus = ad.status;
        if (previousStatus === cleanStatus) {
            return res.json({
                success: true,
                data: ad
            });
        }

        ad.status = cleanStatus;
        ad.deletedAt = null;
        ad.deletedBy = null;

        if (cleanStatus === 'active' && !ad.publishedAt) {
            ad.publishedAt = new Date();
            ad.expiresAt = new Date(ad.publishedAt.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
        }

        await ad.save();

        await writeAudit(req, {
            targetModel: 'Ad',
            target: ad._id,
            action: 'ad.status_changed',
            previousState: { status: previousStatus },
            newState: { status: cleanStatus }
        });

        if (['active', 'rejected', 'archived', 'sold'].includes(cleanStatus)) {
            const titles = {
                active: 'Elan təsdiqləndi',
                rejected: 'Elan rədd edildi',
                archived: 'Elan arxivləndi',
                sold: 'Elan satıldı'
            };

            const bodies = {
                active: `"${ad.brand} ${ad.modelName}" elanınız artıq saytda görünür.`,
                rejected: `"${ad.brand} ${ad.modelName}" elanınız moderasiyadan keçmədi.`,
                archived: `"${ad.brand} ${ad.modelName}" elanınız arxivə göndərildi.`,
                sold: `"${ad.brand} ${ad.modelName}" elanınız satılmış kimi yeniləndi.`
            };

            await Notification.create({
                user: ad.author,
                type: 'ad_status',
                title: titles[cleanStatus],
                body: bodies[cleanStatus],
                link: '/cabinet.html',
                relatedId: ad._id,
                relatedType: 'Ad'
            });
        }

        await invalidateCache('ads:VIP:cache:*');
        res.json({
            success: true,
            data: ad
        });
    } catch (error) {
        next(error);
    }
};

const getAuditLogs = async (req, res, next) => {
    try {
        validateAllowedFields(req.query, ['actor', 'targetModel', 'target', 'action', 'page', 'limit'], 'query');
        const { page, limit, skip } = safePageLimit(req.query, { defaultLimit: 25, maxLimit: 100 });
        const filter = {};
        if (req.query.actor) filter.actor = readObjectId(req.query.actor, 'actor');
        if (req.query.targetModel) filter.targetModel = readString(req.query.targetModel, { fieldName: 'targetModel', maxLength: 80 });
        if (req.query.target) filter.target = readObjectId(req.query.target, 'target');
        if (req.query.action) filter.action = readString(req.query.action, { fieldName: 'action', maxLength: 120 });

        const total = await AuditLog.countDocuments(filter);
        const logs = await AuditLog.find(filter)
            .populate('actor', 'name lastName email role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            data: logs,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        next(error);
    }
};

const getKycDocument = async (req, res, next) => {
    try {
        const kind = readEnum(req.params.kind, ['taxDocument', 'identityDocument'], { fieldName: 'kind', required: true });
        const store = await Store.findById(req.params.id).select('kycDocuments storeName');
        if (!store) return res.status(404).json({ success: false, message: 'Mağaza tapılmadı' });
        const doc = store.kycDocuments?.[kind];
        if (!doc?.storageKey) return res.status(404).json({ success: false, message: 'Sənəd tapılmadı' });

        const filePath = safeJoinPrivate(doc.storageKey);
        res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${kind}"`);
        res.sendFile(filePath);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAdminStats,
    getAllUsers,
    getUsers: getAllUsers,
    getUserDetails,
    getAllAds,
    getAllTransactions,
    getAuditLogs,
    getKycDocument,
    updateAdStatus,
    banUser: (req, res, next) => module.exports.banUser(req, res, next),

    // @desc    Soft-delete a user (sets status = 'deleted')
    // @route   DELETE /api/admin/users/:id
    // @access  Private/Admin
    deleteUser: async (req, res, next) => {
        const mongoose = require('mongoose');
        const session = await mongoose.startSession();
        try {
            const user = await User.findById(req.params.id).select('+refreshTokens');
            if (!user) return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
            if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Admin silinə bilməz' });
            const previousStatus = user.status;

            await session.withTransaction(async () => {
                user.status = 'deleted';
                user.refreshTokens = [];
                user.tokenVersion = (user.tokenVersion || 0) + 1;
                user.sessionVersion = (user.sessionVersion || 0) + 1;
                await user.save({ session });

                const userAds = await Ad.find({ author: user._id, status: { $ne: DELETED_AD_STATUS } }).session(session);
                for (const ad of userAds) {
                    await softDeleteAd({ ad, deletedBy: req.user._id, reason: 'İstifadəçi admin tərəfindən silindi', session, cleanupImages: false });
                }

                await writeAudit(req, {
                    targetModel: 'User',
                    target: user._id,
                    action: 'user.deleted',
                    previousState: { status: previousStatus },
                    newState: { status: user.status }
                });
            });
            res.json({ success: true, message: 'İstifadəçi silindi' });
        } catch (error) {
            next(error);
        } finally {
            await session.endSession();
        }
    },

    // @desc    Update user status (active / frozen / blocked / banned / inactive / disabled)
    // @route   PATCH /api/admin/users/:id/status
    // @access  Private/Admin
    updateUserStatus: async (req, res, next) => {
        try {
            validateAllowedFields(req.body, ['status'], 'body');
            const { status } = req.body;
            const allowed = ['active', 'frozen', 'blocked', 'banned', 'inactive', 'disabled'];
            const cleanStatus = readEnum(status, allowed, { fieldName: 'status', required: true, maxLength: 20 });

            const user = await User.findById(req.params.id).select('+refreshTokens');
            if (!user) return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
            if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Admin statusu dəyişdirilə bilməz' });

            const previousStatus = user.status;
            user.status = cleanStatus;
            if (cleanStatus !== 'active') {
                user.refreshTokens = [];
                user.tokenVersion = (user.tokenVersion || 0) + 1;
                user.sessionVersion = (user.sessionVersion || 0) + 1;
            }
            await user.save();
            await writeAudit(req, {
                targetModel: 'User',
                target: user._id,
                action: 'user.status_changed',
                previousState: { status: previousStatus },
                newState: { status: user.status }
            });
            res.json({ success: true, data: { _id: user._id, status: user.status } });
        } catch (error) {
            next(error);
        }
    },

    // @desc    Ban / unban a user
    // @route   PUT /api/admin/users/:id/ban
    // @access  Private/Admin
    banUser: async (req, res, next) => {
        try {
            if (req.body && Object.keys(req.body).length > 0) {
                validateAllowedFields(req.body, ['status', 'reason'], 'body');
            }
            const status = req.body?.status === 'active' ? 'active' : 'banned';
            req.body = { status };
            return module.exports.updateUserStatus(req, res, next);
        } catch (error) {
            next(error);
        }
    },

    // @desc    Delete an ad (soft delete)
    // @route   DELETE /api/admin/ads/:id
    // @access  Private/Admin
    deleteAd: async (req, res, next) => {
        try {
            const ad = await Ad.findOne({ _id: req.params.id, status: { $ne: DELETED_AD_STATUS } });
            if (!ad) return res.status(404).json({ success: false, message: 'Elan tapılmadı' });
            const previousStatus = ad.status;
            await softDeleteAd({ ad, deletedBy: req.user._id, reason: 'Admin tərəfindən silindi' });

            await writeAudit(req, {
                targetModel: 'Ad',
                target: ad._id,
                action: 'ad.deleted',
                previousState: { status: previousStatus },
                newState: { status: DELETED_AD_STATUS }
            });

            await invalidateCache('ads:VIP:cache:*');
            res.json({ success: true, message: 'Elan silindi' });
        } catch (error) {
            next(error);
        }
    },

    // @desc    Permanently delete an ad (Admin)
    // @route   DELETE /api/admin/ads/:id/purge
    // @access  Private/Admin
    purgeAd: async (req, res, next) => {
        try {
            const ad = await Ad.findById(req.params.id);
            if (!ad) return res.status(404).json({ success: false, message: 'Elan tapılmadı' });

            const cleanup = await deleteUploadFiles(ad.images || []);

            await Message.updateMany(
                { ad: ad._id, adDeletedAt: null },
                { $set: { adDeletedAt: new Date(), hiddenReason: 'ad_deleted' } }
            );

            await User.updateMany(
                { favorites: ad._id },
                { $pull: { favorites: ad._id } }
            );

            // Delete related dependent documents to prevent orphan records
            await Report.deleteMany({ ad: ad._id });
            await Question.deleteMany({ product: ad._id });

            await Ad.deleteOne({ _id: ad._id });
            await writeAudit(req, {
                targetModel: 'Ad',
                target: ad._id,
                action: 'ad.purged',
                previousState: { status: ad.status },
                newState: null
            });
            await invalidateCache('ads:VIP:cache:*');
            res.json({ success: true, message: 'Elan həmişəlik silindi', cleanup });
        } catch (error) {
            next(error);
        }
    },

    // @desc    Get all stores (paginated)
    // @route   GET /api/admin/stores
    // @access  Private/Admin
    getAllStores: async (req, res, next) => {
        try {
            validateAllowedFields(req.query, ['page', 'limit'], 'query');
            const { page, limit, skip } = safePageLimit(req.query, { defaultLimit: 10, maxLimit: 100 });

            const stores = await Store.find().populate('owner', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit);
            const total = await Store.countDocuments();

            const totalPages = Math.ceil(total / limit);
            res.json({
                success: true,
                data: stores,
                pagination: { page, limit, totalAds: total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 }
            });
        } catch (error) {
            next(error);
        }
    },

    // @desc    Update store status / verification
    // @route   PATCH /api/admin/stores/:id
    // @access  Private/Admin
    updateStoreStatus: async (req, res, next) => {
        try {
            validateAllowedFields(req.body, ['status', 'isVerified', 'reason'], 'body');
            const { status, isVerified } = req.body;
            const reason = readString(req.body.reason || '', { fieldName: 'reason', maxLength: 1000 });
            const store = await Store.findById(req.params.id);
            if (!store) return res.status(404).json({ success: false, message: 'Mağaza tapılmadı' });

            const previousState = { status: store.status, isVerified: store.isVerified };
            const statusValue = status
                ? readEnum(status, ['pending', 'active', 'rejected', 'suspended', 'approved'], { fieldName: 'status', required: true, maxLength: 20 })
                : '';
            const normalizedStatus = statusValue === 'approved' ? 'active' : statusValue;
            const transitions = {
                pending: new Set(['active', 'rejected', 'suspended']),
                active: new Set(['suspended', 'rejected']),
                suspended: new Set(['active']),
                rejected: new Set(['pending'])
            };

            if (normalizedStatus) {
                if (!transitions[store.status]?.has(normalizedStatus)) {
                    return res.status(400).json({ success: false, message: 'Keçərsiz mağaza status keçidi' });
                }
                store.status = normalizedStatus;
            }
            const cleanIsVerified = readBoolean(isVerified, { fieldName: 'isVerified' });
            if (typeof cleanIsVerified === 'boolean') {
                if (normalizedStatus === 'rejected') {
                    const filesToClean = [];
                    if (store.logoUrl) filesToClean.push(store.logoUrl);
                    if (store.coverUrl) filesToClean.push(store.coverUrl);
                    if (store.taxDocumentUrl) filesToClean.push(store.taxDocumentUrl);
                    if (store.identityDocumentUrl) filesToClean.push(store.identityDocumentUrl);
                    await deleteUploadFiles(filesToClean);

                    // Clear fields
                    store.logoUrl = '';
                    store.coverUrl = '';
                    store.taxDocumentUrl = '';
                    store.identityDocumentUrl = '';
                }

                if (store.status !== 'active' && cleanIsVerified) {
                    return res.status(400).json({ success: false, message: 'Yalnız aktiv mağaza təsdiqlənə bilər' });
                }
                store.isVerified = cleanIsVerified;
            } else if (normalizedStatus === 'active') {
                store.isVerified = true;
            } else if (['rejected', 'suspended', 'pending'].includes(normalizedStatus)) {
                store.isVerified = false;
            }
            if (normalizedStatus || typeof cleanIsVerified === 'boolean') {
                const statusMap = {
                    active: 'approved',
                    rejected: 'rejected',
                    suspended: 'suspended',
                    pending: 'resubmission_requested'
                };
                store.kycReviewStatus = statusMap[store.status] || store.kycReviewStatus;
                store.kycReviewedBy = req.user._id;
                store.kycReviewedAt = new Date();
                store.kycRejectionReason = ['rejected', 'pending'].includes(store.status) ? reason : '';
            }

            await store.save();
            await writeAudit(req, {
                targetModel: 'Store',
                target: store._id,
                action: 'store.status_changed',
                previousState,
                newState: { status: store.status, isVerified: store.isVerified, kycReviewStatus: store.kycReviewStatus },
                reason
            });
            res.json({ success: true, data: store });
        } catch (error) {
            next(error);
        }
    },

    // @desc    Delete a store (Admin)
    // @route   DELETE /api/admin/stores/:id
    // @access  Private/Admin
    deleteStore: async (req, res, next) => {
        try {
            const store = await Store.findById(req.params.id);
            if (!store) return res.status(404).json({ success: false, message: 'Mağaza tapılmadı' });

            // Clean up store references in ads
            const Ad = require('../models/Ad');
            await Ad.updateMany(
                { store: store._id, status: { $ne: DELETED_AD_STATUS } },
                { $set: { store: null, sellerType: 'personal' } }
            );

            const filesToClean = [];
            if (store.logoUrl) filesToClean.push(store.logoUrl);
            if (store.coverUrl) filesToClean.push(store.coverUrl);
            if (store.taxDocumentUrl) filesToClean.push(store.taxDocumentUrl);
            if (store.identityDocumentUrl) filesToClean.push(store.identityDocumentUrl);
            await deleteUploadFiles(filesToClean);

            const previousStatus = store.status;
            await store.deleteOne();

            await writeAudit(req, {
                targetModel: 'Store',
                target: store._id,
                action: 'store.deleted',
                previousState: { status: previousStatus },
                newState: null
            });
            res.json({ success: true, message: 'Mağaza silindi' });
        } catch (error) {
            next(error);
        }
    },

    // @desc    Revoke all sessions for a user
    // @route   POST /api/admin/users/:id/revoke-sessions
    // @access  Private/Admin
    revokeUserSessions: async (req, res, next) => {
        try {
            const user = await User.findById(req.params.id).select('+refreshTokens');
            if (!user) return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });

            user.refreshTokens = [];
            user.tokenVersion = (user.tokenVersion || 0) + 1;
            user.sessionVersion = (user.sessionVersion || 0) + 1;
            await user.save();
            await writeAudit(req, {
                targetModel: 'User',
                target: user._id,
                action: 'user.sessions_revoked',
                previousState: null,
                newState: { tokenVersion: user.tokenVersion, sessionVersion: user.sessionVersion }
            });

            res.json({ success: true, message: 'Sessiyalar ləğv edildi' });
        } catch (error) {
            next(error);
        }
    },

    // @desc    Get all payment sessions (with optional status filter)
    // @route   GET /api/admin/payment-sessions
    // @access  Private/Admin
    getPaymentSessions: async (req, res, next) => {
        try {
            const { status, page = 1, limit = 50 } = req.query;
            const filter = {};
            const queryStatus = status || (req.path?.endsWith('/pending') ? 'pending' : null);
            if (queryStatus) filter.status = queryStatus;

            const numLimit = Math.max(1, parseInt(limit, 10) || 50);
            const numPage = Math.max(1, parseInt(page, 10) || 1);
            const skip = (numPage - 1) * numLimit;

            const sessions = await PaymentSession.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(numLimit)
                .populate('user', 'phone email name lastName');

            const total = await PaymentSession.countDocuments(filter);
            res.json({ sessions, total });
        } catch (err) {
            if (next) next(err);
            else res.status(500).json({ message: err.message });
        }
    },

    // @desc    Alias for getPaymentSessions with status=pending default
    // @route   GET /api/admin/payment-sessions/pending
    // @access  Private/Admin
    getPendingPayments: async (req, res, next) => {
        if (!req.query.status) req.query.status = 'pending';
        return module.exports.getPaymentSessions(req, res, next);
    },

    // @desc    Reconcile single payment session
    // @route   POST /api/admin/payment-sessions/:id/reconcile
    // @access  Private/Admin
    reconcileSingleSession: async (req, res, next) => {
        try {
            const id = req.params.id;
            const mongoose = require('mongoose');
            const payriffProvider = require('../services/payriffProvider');
            const walletController = require('./walletController');

            const session = await PaymentSession.findOne({
                $or: [
                    ...(mongoose.isValidObjectId(id) ? [{ _id: id }] : []),
                    { paymentId: id },
                    { providerOrderId: id }
                ]
            });

            if (!session) {
                return res.status(404).json({ message: 'Ödəniş sessiyası tapılmadı' });
            }

            if (session.status === 'completed' || session.status === 'paid') {
                return res.json({ message: 'Ödəniş artıq tamamlanıb', status: session.status, session });
            }

            const providerOrderId = session.providerOrderId;
            let providerStatus = null;
            if (providerOrderId) {
                providerStatus = await payriffProvider.getOrderStatus(providerOrderId);
            }

            const isApproved = providerStatus?.status === 'APPROVED' || providerStatus?.status === 'PAID';
            const previousState = { status: session.status, providerStatus: session.providerOrderStatus };

            if (isApproved) {
                const result = await walletController.completeTopUpPayment({ payment: session, providerStatus });
                await writeAudit(req, {
                    targetModel: 'PaymentSession',
                    target: session._id,
                    action: 'reconcile_payment',
                    previousState,
                    newState: { status: 'completed', providerStatus },
                    reason: 'Admin manual reconciliation - approved by provider',
                    metadata: { providerOrderId, providerStatus }
                });
                return res.json({
                    message: 'Ödəniş təsdiqləndi və balans artırıldı',
                    reconciled: true,
                    status: 'completed',
                    result
                });
            } else {
                await writeAudit(req, {
                    targetModel: 'PaymentSession',
                    target: session._id,
                    action: 'reconcile_check',
                    previousState,
                    newState: { status: session.status, providerStatus },
                    reason: 'Admin manual reconciliation check - not approved by provider',
                    metadata: { providerOrderId, providerStatus }
                });
                return res.json({
                    message: 'Ödəniş provayder tərəfindən hələ təsdiqlənməyib',
                    reconciled: false,
                    status: session.status,
                    providerStatus
                });
            }
        } catch (err) {
            if (next) next(err);
            else res.status(500).json({ message: err.message });
        }
    }
};
