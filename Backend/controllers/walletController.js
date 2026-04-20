const User        = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

// @desc    Get wallet balance and recent transactions
// @route   GET /api/wallet/balance
// @access  Private
const getBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('walletBalance referralCredits');

        const recent = await Transaction.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            walletBalance:   user.walletBalance,
            referralCredits: user.referralCredits,
            recentTransactions: recent
        });
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Top up wallet (manual / mock — real gateway later)
// @route   POST /api/wallet/topup
// @access  Private
const topUp = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || Number(amount) <= 0) {
            return res.status(400).json({ message: 'Məbləğ 0-dan böyük olmalıdır' });
        }

        const user = await User.findById(req.user._id);
        user.walletBalance += Number(amount);
        await user.save();

        const tx = await Transaction.create({
            user:        user._id,
            amount:      Number(amount),
            type:        'deposit',
            description: `Balans artırımı — ${amount} AZN`,
            balanceAfter: user.walletBalance,
            status:      'completed'
        });

        await Notification.create({
            user:  user._id,
            type:  'system',
            title: 'Balansınız artırıldı 💳',
            body:  `${amount} AZN hesabınıza əlavə edildi. Cari balans: ${user.walletBalance} AZN`,
            link:  '/cabinet.html#wallet'
        });

        res.json({
            message:      'Balans artırıldı',
            walletBalance: user.walletBalance,
            transaction:  tx
        });
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Get full transaction history (paginated)
// @route   GET /api/wallet/transactions
// @access  Private
const getTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 20, type } = req.query;
        const filter = { user: req.user._id };
        if (type) filter.type = type;

        const skip  = (Number(page) - 1) * Number(limit);
        const total = await Transaction.countDocuments(filter);
        const txs   = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .populate('ad', 'brand modelName');

        res.json({
            transactions: txs,
            page:  Number(page),
            pages: Math.ceil(total / Number(limit)),
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

module.exports = { getBalance, topUp, getTransactions };
