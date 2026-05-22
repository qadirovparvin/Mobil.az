const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({

    // ── Core ───────────────────────────────────────────────
    name:       { type: String, required: true },
    lastName:   { type: String, default: '' },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:   { type: String, required: true },
    phone:      { type: String, default: '' },
    avatar:     { type: String, default: '' },   // URL to profile photo
    role:       { type: String, enum: ['user', 'admin'], default: 'user' },
    status:     { type: String, enum: ['active', 'frozen', 'deleted'], default: 'active' },

    // ── Favorites ─────────────────────────────────────────
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ad' }],

    // ── Wallet ────────────────────────────────────────────
    walletBalance: { type: Number, default: 0 },

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
    twoFactorEnabled: { type: Boolean, default: false },

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
        googleId:   { type: String, default: null },
        facebookId: { type: String, default: null },
        appleId:    { type: String, default: null }
    }

}, { timestamps: true });

// Auto-generate a unique referral code before saving a new user
userSchema.pre('save', function () {
    if (!this.referralCode) {
        this.referralCode = 'AP-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    }
});

module.exports = mongoose.model('User', userSchema);
