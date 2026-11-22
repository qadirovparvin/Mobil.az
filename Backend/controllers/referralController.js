const User = require('../models/User');

exports.getReferralStats = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('referralCode referralBumps referralVips referralVipCampaignClaimedCount');
        if (!user) {
            return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
        }

        if (!user.referralCode) {
            user.referralCode = User.generateReferralCode();
            await user.save();
        }

        const count = await User.countDocuments({ referredBy: req.user._id });
        const recentReferrals = await User.find({ referredBy: req.user._id })
            .select('name createdAt isVerified')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        const campaignTarget = 3;
        const progressInCurrentCycle = count % campaignTarget;
        const completedMilestones = Math.floor(count / campaignTarget);

        res.status(200).json({
            totalReferrals: count,
            referralCode: user.referralCode,
            referralBumps: user.referralBumps || 0,
            referralVips: user.referralVips || 0,
            campaign: {
                target: campaignTarget,
                current: progressInCurrentCycle,
                needed: campaignTarget - progressInCurrentCycle,
                completedCycles: completedMilestones,
                rewardDesc: '2 dəfə 1 həftəlik VIP'
            },
            referrals: recentReferrals
        });
    } catch (error) {
        next(error);
    }
};
