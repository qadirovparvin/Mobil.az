const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({

    // ── Ownership ──────────────────────────────────────────
    author:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    store:      { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
    sellerType: { type: String, enum: ['personal', 'store'], default: 'personal' },

    // ── Core Info ─────────────────────────────────────────
    category:    { type: String, required: true },
    brand:       { type: String, required: true },
    modelName:   { type: String, required: true },
    price:       { type: Number, required: true },
    condition:   { type: String, enum: ['Yeni', 'İşlənmiş'], required: true },
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
        enum: ['Pending', 'Active', 'Rejected', 'Sold', 'Archived'],
        default: 'Pending'
    },
    isSold: { type: Boolean, default: false },

    // ── Promotion ─────────────────────────────────────────
    promotionType: {
        type: String,
        enum: ['none', 'BumpUp', 'VIP', 'PRO'],
        default: 'none'
    },
    promotionExpiresAt: { type: Date, default: null },

    // ── Specs (Electronics) ───────────────────────────────
    specs: {
        memory:     { type: String, default: '' },
        ram:        { type: String, default: '' },
        screenSize: { type: String, default: '' },
        battery:    { type: String, default: '' },
        color:      { type: String, default: '' },
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

// Index for fast marketplace queries
adSchema.index({ status: 1, category: 1, city: 1, promotionType: 1, createdAt: -1 });
adSchema.index({ author: 1 });
adSchema.index({ price: 1 });

module.exports = mongoose.model('Ad', adSchema);
