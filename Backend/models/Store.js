const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({

    // ── Ownership ──────────────────────────────────────────
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // ── Identity ──────────────────────────────────────────
    storeName:   { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    logoUrl:     { type: String, default: '' },
    coverUrl:    { type: String, default: '' },
    taxDocumentUrl: { type: String, default: '', select: false }, // Legacy field; do not expose publicly
    identityDocumentUrl: { type: String, default: '', select: false }, // Legacy field; do not expose publicly
    voen: { type: String, default: '' }, // Tax Identification Number
    businessDetails: {
        legalName: { type: String, default: '' },
        businessType: { type: String, default: '' }
    },
    kycDocuments: {
        taxDocument: {
            storageKey: { type: String, default: '' },
            originalName: { type: String, default: '' },
            mimeType: { type: String, default: '' },
            size: { type: Number, default: 0 },
            uploadedAt: { type: Date, default: null }
        },
        identityDocument: {
            storageKey: { type: String, default: '' },
            originalName: { type: String, default: '' },
            mimeType: { type: String, default: '' },
            size: { type: Number, default: 0 },
            uploadedAt: { type: Date, default: null }
        }
    },
    kycSubmittedAt: { type: Date, default: null },
    kycReviewStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'resubmission_requested', 'suspended'],
        default: 'pending'
    },
    kycReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    kycReviewedAt: { type: Date, default: null },
    kycRejectionReason: { type: String, default: '' },

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
    status: { type: String, enum: ['pending', 'active', 'rejected', 'suspended'], default: 'pending' }

}, { timestamps: true });

storeSchema.index({ owner: 1 }, { unique: true });
storeSchema.index({ status: 1, isVerified: 1, createdAt: -1 });
storeSchema.index({ kycReviewStatus: 1, createdAt: -1 });

module.exports = mongoose.model('Store', storeSchema);
