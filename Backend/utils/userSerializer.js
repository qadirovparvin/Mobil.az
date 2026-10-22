const SENSITIVE_USER_FIELDS = [
    'password',
    'resetToken',
    'resetTokenExpiry',
    'resetRequestedAt',
    'refreshTokens',
    'twoFactorSecret',
    'pendingTwoFactorSecret',
    'twoFactorRecoveryCodes',
    'twoFactorLastUsedStep',
    'twoFactorFailures',
    'twoFactorLockedUntil',
    'pendingEmailTokenHash'
];

const stripSensitiveUserFields = (user) => {
    if (!user) return user;
    const object = typeof user.toObject === 'function'
        ? user.toObject({ virtuals: true })
        : { ...user };

    SENSITIVE_USER_FIELDS.forEach((field) => {
        delete object[field];
    });
    return object;
};

const toSafeUser = (user) => {
    const object = stripSensitiveUserFields(user);
    if (!object) return object;

    return {
        _id: object._id,
        name: object.name,
        lastName: object.lastName,
        email: object.email,
        pendingEmail: object.pendingEmail || '',
        phone: object.phone,
        avatar: object.avatar,
        role: object.role,
        status: object.status,
        isOnline: object.isOnline,
        lastActive: object.lastActive,
        isVerified: object.isVerified,
        twoFactorEnabled: Boolean(object.twoFactorEnabled),
        walletBalance: object.walletBalance,
        referralCode: object.referralCode,
        referralCredits: object.referralCredits,
        activePackage: object.activePackage,
        packageExpiresAt: object.packageExpiresAt,
        billingExpiresAt: object.packageExpiresAt,
        privacySettings: object.privacySettings,
        notificationSettings: object.notificationSettings,
        rating: object.rating,
        reviewCount: object.reviewCount,
        createdAt: object.createdAt,
        updatedAt: object.updatedAt
    };
};

module.exports = {
    SENSITIVE_USER_FIELDS,
    stripSensitiveUserFields,
    toSafeUser
};
