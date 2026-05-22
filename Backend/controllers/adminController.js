const User = require('../models/User');
const Ad = require('../models/Ad');
const Store = require('../models/Store');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalAds = await Ad.countDocuments();
        const activeAds = await Ad.countDocuments({ status: 'Active' });
        const totalStores = await Store.countDocuments();

        // Calculate total revenue from 'package_purchase' and 'ad_boost'
        const revenueTransactions = await Transaction.find({ type: { $in: ['package_purchase', 'ad_boost'] } });
        const totalRevenue = revenueTransactions.reduce((acc, tx) => acc + Math.abs(tx.amount), 0);

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
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all users (paginated)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password');
        const total = await User.countDocuments();

        res.json({
            success: true,
            data: users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all ads (paginated)
// @route   GET /api/admin/ads
// @access  Private/Admin
const getAllAds = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const ads = await Ad.find().populate('author', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await Ad.countDocuments();

        res.json({
            success: true,
            data: ads,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all transactions (paginated)
// @route   GET /api/admin/transactions
// @access  Private/Admin
const getAllTransactions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const transactions = await Transaction.find().populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit);
        const total = await Transaction.countDocuments();

        res.json({
            success: true,
            data: transactions,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update ad moderation status
// @route   PUT /api/admin/ads/:id/status
// @access  Private/Admin
const updateAdStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ['Pending', 'Active', 'Rejected', 'Archived', 'Sold'];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const ad = await Ad.findById(req.params.id);
        if (!ad) {
            return res.status(404).json({ success: false, message: 'Ad not found' });
        }

        ad.status = status;
        ad.isSold = status === 'Sold';
        await ad.save();

        if (['Active', 'Rejected', 'Archived', 'Sold'].includes(status)) {
            const titles = {
                Active: 'Elan təsdiqləndi',
                Rejected: 'Elan rədd edildi',
                Archived: 'Elan arxivləşdirildi',
                Sold: 'Elan satılmış kimi işarələndi'
            };

            const bodies = {
                Active: `"${ad.brand} ${ad.modelName}" elanınız artıq saytda görünür.`,
                Rejected: `"${ad.brand} ${ad.modelName}" elanınız moderasiyadan keçmədi.`,
                Archived: `"${ad.brand} ${ad.modelName}" elanınız arxivə göndərildi.`,
                Sold: `"${ad.brand} ${ad.modelName}" elanınız satılmış kimi yeniləndi.`
            };

            await Notification.create({
                user: ad.author,
                type: 'ad_status',
                title: titles[status],
                body: bodies[status],
                link: '/cabinet.html',
                relatedId: ad._id,
                relatedType: 'Ad'
            });
        }

        res.json({
            success: true,
            data: ad
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

module.exports = {
    getAdminStats,
    getAllUsers,
    getAllAds,
    getAllTransactions,
    updateAdStatus,

    // @desc    Soft-delete a user (sets status = 'deleted')
    // @route   DELETE /api/admin/users/:id
    // @access  Private/Admin
    deleteUser: async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
            if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Admin silinə bilməz' });
            user.status = 'deleted';
            await user.save();
            res.json({ success: true, message: 'İstifadəçi silindi' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
    },

    // @desc    Update user status (active / frozen)
    // @route   PATCH /api/admin/users/:id/status
    // @access  Private/Admin
    updateUserStatus: async (req, res) => {
        try {
            const { status } = req.body;
            const allowed = ['active', 'frozen'];
            if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Yanlış status' });

            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ success: false, message: 'İstifadəçi tapılmadı' });
            if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Admin statusu dəyişdirilə bilməz' });

            user.status = status;
            await user.save();
            res.json({ success: true, data: { _id: user._id, status: user.status } });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
    },

    // @desc    Delete an ad
    // @route   DELETE /api/admin/ads/:id
    // @access  Private/Admin
    deleteAd: async (req, res) => {
        try {
            const ad = await Ad.findById(req.params.id);
            if (!ad) return res.status(404).json({ success: false, message: 'Elan tapılmadı' });
            await ad.deleteOne();
            res.json({ success: true, message: 'Elan silindi' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Server Error', error: error.message });
        }
    }
};

