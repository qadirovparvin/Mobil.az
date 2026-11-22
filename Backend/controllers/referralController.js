const User = require('../models/User');

exports.getReferralStats = async (req, res, next) => {
    try {
        const [count, user] = await Promise.all([
            User.countDocuments({ referredBy: req.user._id }),
            User.findById(req.user._id).select('referralCredits bumpBonus referralCode')
        ]);
        res.status(200).json({
            totalReferrals: count,
            referralCredits: user?.referralCredits || 0,
            bumpBonus: user?.bumpBonus || 0,
            referralCode: user?.referralCode || ''
        });
    } catch (error) {
        next(error);
    }
};
