const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({

    // ── Core ───────────────────────────────────────────────
    name:       { type: String, required: true },
    lastName:   { type: String, default: '' },
    email:      { type: String, required: false, unique: true, sparse: true, lowercase: true, trim: true, default: undefined },
    pendingEmail: { type: String, default: '', lowercase: true, trim: true },
    pendingEmailTokenHash: { type: String, default: null, select: false },
    pendingEmailExpiresAt: { type: Date, default: null },
    pendingEmailRequestedAt: { type: Date, default: null },
    password:   { type: String, required: true, minlength: 8, select: false },
    phone:      { type: String, required: false, unique: true, sparse: true, trim: true, default: undefined },
    avatar:     { type: String, default: '' },   // URL to profile photo
    role:       { type: String, enum: ['user', 'admin'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    unverifiedExpiresAt: { type: Date, default: null },
    status:     { type: String, enum: ['active', 'frozen', 'deleted', 'blocked', 'banned', 'inactive', 'disabled'], default: 'active' },

    // ── Favorites ─────────────────────────────────────────
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ad' }],

    // ── Wallet ────────────────────────────────────────────
    walletBalance: { type: Number, default: 0, min: 0 },
    walletPendingBalance: { type: Number, default: 0, min: 0 },
    walletReservedBalance: { type: Number, default: 0, min: 0 },
    walletPromoBalance: { type: Number, default: 0, min: 0 },
    walletOperationKeys: { type: [String], default: [], select: false },

    // ── Reviews ───────────────────────────────────────────
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },

    // ── Active Promotion Package ──────────────────────────
    activePackage:     { type: String, enum: ['none', 'VIP', 'PRO'], default: 'none' },
    packageExpiresAt:  { type: Date, default: null },

    // ── Referral System ───────────────────────────────────
    referralCode:    { type: String, unique: true, sparse: true },
    referredBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    referralCredits: { type: Number, default: 0 },

    // ── Security ──────────────────────────────────────────
    tokenVersion:     { type: Number, default: 0 },
    sessionVersion:   { type: Number, default: 0 },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret:  { type: String, default: null, select: false },
    pendingTwoFactorSecret: { type: String, default: null, select: false },
    twoFactorRecoveryCodes: [{ type: String, select: false }],
    twoFactorLastUsedStep: { type: Number, default: null, select: false },
    twoFactorFailures: { type: Number, default: 0, select: false },
    twoFactorLockedUntil: { type: Date, default: null, select: false },
    resetToken:       { type: String, default: null, select: false }, // SHA-256 hash only; never store raw reset token
    resetTokenExpiry: { type: Date,   default: null, select: false },
    resetRequestedAt: { type: Date,   default: null, select: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationTokenExpiry: { type: Date, select: false },
    loginAttempts:    { type: Number, default: 0 },
    lockUntil:        { type: Date,   default: null },
    lastFailedLogin:  { type: Date,   default: null },
    refreshTokens: {
        type: [{
            tokenHash: { type: String, required: true },
            sessionId: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
            lastUsedAt: { type: Date, default: Date.now },
            expiresAt: { type: Date, required: true },
            deviceLabel: { type: String, default: '' },
            userAgent: { type: String, default: '' },
            ip:        { type: String, default: '' },
            sessionVersion: { type: Number, default: 0 }
        }],
        select: false
    },

    // ── Online Status ─────────────────────────────────────
    isOnline: { type: Boolean, default: false },
    lastActive: { type: Date, default: null },

    // ── Privacy Settings ──────────────────────────────────
    privacySettings: {
        showPhone:        { type: Boolean, default: true },
        allowMessages:    { type: Boolean, default: true },
        showOnlineStatus: { type: Boolean, default: true }
    },

    // ── Notification Settings ─────────────────────────────
    notificationSettings: {
        emailMessages:  { type: Boolean, default: true },
        emailAdStatus:  { type: Boolean, default: true },
        emailMarketing: { type: Boolean, default: false }
    },

    // ── Social Logins ─────────────────────────────────────
    socialConnections: {
        googleId:   { type: String, default: null, select: false },
        facebookId: { type: String, default: null, select: false },
        appleId:    { type: String, default: null, select: false }
    }

}, {
    timestamps: true,
    toJSON: {
        transform(doc, ret) {
            delete ret.password;
            delete ret.resetToken;
            delete ret.resetTokenExpiry;
            delete ret.resetRequestedAt;
            delete ret.refreshTokens;
            delete ret.twoFactorSecret;
            delete ret.pendingTwoFactorSecret;
            delete ret.twoFactorRecoveryCodes;
            delete ret.twoFactorLastUsedStep;
            delete ret.twoFactorFailures;
            delete ret.twoFactorLockedUntil;
            delete ret.pendingEmailTokenHash;
            if (ret.socialConnections) {
                delete ret.socialConnections.googleId;
                delete ret.socialConnections.facebookId;
                delete ret.socialConnections.appleId;
            }
            return ret;
        }
    },
    toObject: {
        transform(doc, ret) {
            delete ret.password;
            delete ret.resetToken;
            delete ret.resetTokenExpiry;
            delete ret.resetRequestedAt;
            delete ret.refreshTokens;
            delete ret.twoFactorSecret;
            delete ret.pendingTwoFactorSecret;
            delete ret.twoFactorRecoveryCodes;
            delete ret.twoFactorLastUsedStep;
            delete ret.twoFactorFailures;
            delete ret.twoFactorLockedUntil;
            delete ret.pendingEmailTokenHash;
            if (ret.socialConnections) {
                delete ret.socialConnections.googleId;
                delete ret.socialConnections.facebookId;
                delete ret.socialConnections.appleId;
            }
            return ret;
        }
    }
});

userSchema.index({ resetToken: 1, resetTokenExpiry: 1 });
userSchema.index({ pendingEmailTokenHash: 1, pendingEmailExpiresAt: 1 });
userSchema.index({ unverifiedExpiresAt: 1 }, { expireAfterSeconds: 0 });
userSchema.index({ 'refreshTokens.tokenHash': 1 });
userSchema.index({ 'refreshTokens.sessionId': 1 });
userSchema.index({ tokenVersion: 1 });

function generateReferralCode() {
    return 'AP-' + crypto.randomBytes(8).toString('hex').toUpperCase();
}

// Auto-generate a unique referral code before saving a new user
userSchema.pre('save', async function () {
    if (!this.referralCode) {
        const User = this.constructor;
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const candidate = generateReferralCode();
                if (User && typeof User.findOne === 'function') {
                    const exists = await User.findOne({ referralCode: candidate }).lean();
                    if (!exists) {
                        this.referralCode = candidate;
                        break;
                    }
                } else {
                    this.referralCode = candidate;
                    break;
                }
            } catch (err) {
                if (err && (err.code === 11000 || err.codeName === 'DuplicateKey')) {
                    continue; // retry
                }
                throw err;
            }
        }
        if (!this.referralCode) {
            this.referralCode = generateReferralCode();
        }
    }
});

// Auto-recover from rare concurrent E11000 duplicate key race on referralCode
userSchema.post('save', function (error, doc, next) {
    const targetDoc = this || doc;
    const isDuplicateKey = Boolean(error && (error.code === 11000 || error.codeName === 'DuplicateKey'));
    const isReferralField = Boolean(
        error && (
            error.keyPattern?.referralCode ||
            (error.keyValue && error.keyValue.referralCode) ||
            (typeof error.message === 'string' && error.message.includes('referralCode'))
        )
    );

    if (isDuplicateKey && isReferralField && targetDoc) {
        if ((targetDoc._referralRetryCount || 0) >= 5) {
            console.error(`Referral code generation failed after ${targetDoc._referralRetryCount} retries for ${targetDoc.email || targetDoc._id}`);
            return next(new Error('Referral code generation failed after retries'));
        }
        console.warn(`Referral collision intercepted for ${targetDoc.email || targetDoc._id}`);
    }
    next(error);
});

userSchema.statics.generateReferralCode = generateReferralCode;

const User = mongoose.model('User', userSchema);
User.generateReferralCode = generateReferralCode;

// Wrap save to transparently auto-recover on concurrent E11000 collision
const originalSave = User.prototype.save;
User.prototype.save = async function (...args) {
    let retries = 0;
    while (true) {
        try {
            return await originalSave.apply(this, args);
        } catch (error) {
            const isDuplicateKey = Boolean(error && (error.code === 11000 || error.codeName === 'DuplicateKey'));
            const isReferralField = Boolean(
                error && (
                    error.keyPattern?.referralCode ||
                    (error.keyValue && error.keyValue.referralCode) ||
                    (typeof error.message === 'string' && error.message.includes('referralCode'))
                )
            );

            if (isDuplicateKey && isReferralField) {
                if (retries >= 5) {
                    console.error(`Referral code generation failed after ${retries} retries for ${this.email || this._id}`);
                    throw new Error('Referral code generation failed after retries');
                }
                retries++;
                this._referralRetryCount = retries;
                console.warn(`Referral collision for ${this.email || this._id}, retrying (attempt #${retries})...`);
                this.referralCode = generateReferralCode();
                this.markModified('referralCode');
                this.$isNew = true;
                if (this.$__) {
                    this.$__.saving = null;
                }
                continue;
            }
            throw error;
        }
    }
};

module.exports = User;
