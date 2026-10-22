const ACTIVE_STATUS = 'active';

const activeListingFilter = (now = new Date()) => ({
    status: ACTIVE_STATUS,
    $and: [
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }
    ]
});

const activeVipFilter = (now = new Date()) => ({
    promotionType: 'VIP',
    promotionExpiresAt: { $gt: now },
    ...activeListingFilter(now)
});

const hasActiveVip = (ad, now = new Date()) =>
    Boolean(ad?.promotionType === 'VIP' && ad?.promotionExpiresAt && new Date(ad.promotionExpiresAt) > now);

module.exports = {
    ACTIVE_STATUS,
    activeListingFilter,
    activeVipFilter,
    hasActiveVip
};
