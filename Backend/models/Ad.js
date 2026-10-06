const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({

    // ── Ownership ──────────────────────────────────────────
    author:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    store:      { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
    sellerType: { type: String, enum: ['personal', 'store'], default: 'personal' },

    // ── Core Info ─────────────────────────────────────────
    title:       { type: String, default: '' },
    category:    { type: String, required: true },
    brand:       { type: String, required: true },
    modelName:   { type: String, required: true },
    price:       { type: Number, required: true },
    condition:   { type: String, required: false, default: null },
    yaddas:      { type: String, required: false, default: null },
    ram:         { type: String, required: false, default: null },
    description: { type: String, default: '' },
    images:      [{ type: String }],

    // ── Location ──────────────────────────────────────────
    city:   { type: String, required: true },
    region: { type: String, default: '' },

    // ── Contact ───────────────────────────────────────────
    contactPhone: { type: String, default: '' },

    // ── Status ────────────────────────────────────────────
    status: {
        type: String,
        enum: ['pending', 'active', 'rejected', 'sold', 'archived', 'expired', 'deleted'],
        default: 'pending'
    },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deletionReason: { type: String, default: '' },
    
    // ── Publication & Expiration ─────────────────────────
    publishedAt: { type: Date, default: null },
    expiresAt:   { type: Date, default: null },
    expiredAt:   { type: Date, default: null },

    // ── Promotion ─────────────────────────────────────────
    promotionType: {
        type: String,
        enum: ['none', 'BumpUp', 'VIP', 'PRO', 'Urgent', 'Premium'],
        default: 'none'
    },
    promotionStartedAt: { type: Date, default: null },
    promotionExpiresAt: { type: Date, default: null },

    // ── Specs (Electronics) ───────────────────────────────
    specs: {
        memory:     { type: String, default: null, required: false },
        ram:        { type: String, default: null, required: false },
        screenSize: { type: String, default: null, required: false },
        battery:    { type: String, default: null, required: false },
        color:      { type: String, default: null, required: false },
        features: {
            nfc:         { type: Boolean, default: false },
            waterproof:  { type: Boolean, default: false },
            fingerprint: { type: Boolean, default: false },
            expandable:  { type: Boolean, default: false },
            delivery:    { type: Boolean, default: false }
        }
    },

    // ── Engagement ────────────────────────────────────────
    views:     { type: Number, default: 0 },
    favorites: { type: Number, default: 0 }  // denormalized count for fast sorting

}, { timestamps: true });

// Text search and marketplace indexes. Keep filter/sort fields together for common list pages.
adSchema.index(
    {
        brand: 'text',
        modelName: 'text',
        description: 'text',
        category: 'text',
        city: 'text',
        region: 'text'
    },
    {
        name: 'ad_search_text',
        weights: { brand: 8, modelName: 8, category: 5, city: 3, region: 2, description: 1 },
        default_language: 'none'
    }
);
adSchema.index({ status: 1, category: 1, city: 1, promotionType: 1, createdAt: -1 });
adSchema.index({ status: 1, category: 1, price: 1 });
adSchema.index({ status: 1, price: 1 });
adSchema.index({ promotionType: 1, status: 1, promotionExpiresAt: 1 });
adSchema.index({ status: 1, expiresAt: 1, expiredAt: 1 }); // For listing expiry checker
adSchema.index({ status: 1, createdAt: -1 });
adSchema.index({ author: 1, status: 1, createdAt: -1 });
adSchema.index({ store: 1, status: 1, createdAt: -1 });
adSchema.index({ deletedAt: 1 });

module.exports = mongoose.model('Ad', adSchema);
