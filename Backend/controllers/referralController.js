const User = require('../models/User');

exports.getReferralStats = async (req, res, next) => {
    try {
        const count = await User.countDocuments({ referredBy: req.user._id });
        res.status(200).json({
            totalReferrals: count
        });
    } catch (error) {
        next(error);
    }
};
