const User = require('../models/User');
const Message = require('../models/Message');
const { deleteUploadFiles } = require('./uploadCleanup');

const DELETED_AD_STATUS = 'deleted';

const notDeletedAdFilter = () => ({ status: { $ne: DELETED_AD_STATUS } });

const softDeleteAd = async ({ ad, deletedBy, reason = '', session = null, cleanupImages = false }) => {
    if (!ad) return null;

    const deletedAt = new Date();
    ad.status = DELETED_AD_STATUS;
    ad.deletedAt = deletedAt;
    ad.deletedBy = deletedBy || null;
    if (reason) ad.deletionReason = reason;
    ad.promotionType = 'none';
    ad.promotionExpiresAt = null;

    await ad.save({ session });

    await User.updateMany(
        { favorites: ad._id },
        { $pull: { favorites: ad._id } },
        { session }
    );

    await Message.updateMany(
        { ad: ad._id, adDeletedAt: null },
        { $set: { adDeletedAt: deletedAt, hiddenReason: 'ad_deleted' } },
        { session }
    );

    const cleanup = cleanupImages ? await deleteUploadFiles(ad.images || []) : null;
    return { ad, cleanup };
};

module.exports = {
    DELETED_AD_STATUS,
    notDeletedAdFilter,
    softDeleteAd
};
