const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({

    // ── Ownership ──────────────────────────────────────────
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // ── Identity ──────────────────────────────────────────
    storeName:   { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    logoUrl:     { type: String, default: '' },
    coverUrl:    { type: String, default: '' },

    // ── Package ───────────────────────────────────────────
    packageType: {
        type: String,
        enum: ['Starter', 'Pro', 'Premium'],
        default: 'Starter'
    },
    subscriptionActive:    { type: Boolean, default: true },
    subscriptionExpiresAt: { type: Date, default: null },

    // ── Contact & Location ────────────────────────────────
    address:       { type: String, default: '' },
    city:          { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    socialLinks: {
        instagram: { type: String, default: '' },
        whatsapp:  { type: String, default: '' },
        facebook:  { type: String, default: '' },
        website:   { type: String, default: '' }
    },

    // ── Reputation ────────────────────────────────────────
    isVerified:  { type: Boolean, default: false },
    rating:      { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },

    // ── Status ────────────────────────────────────────────
    status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' }

}, { timestamps: true });

module.exports = mongoose.model('Store', storeSchema);
