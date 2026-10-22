const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ad: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad', required: true },
    adOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: {
        type: String,
        enum: ['scam', 'prohibited', 'misleading', 'duplicate', 'abusive', 'wrong_category', 'other'],
        required: true
    },
    description: { type: String, default: '', maxlength: 1000 },
    listingSnapshot: {
        title: { type: String, default: '' },
        brand: { type: String, default: '' },
        modelName: { type: String, default: '' },
        price: { type: Number, default: null },
        status: { type: String, default: '' },
        sellerType: { type: String, default: '' },
        createdAt: { type: Date, default: null }
    },
    status: {
        type: String,
        enum: ['pending', 'investigating', 'more_info_requested', 'resolved', 'dismissed'],
        default: 'pending'
    },
    actionTaken: {
        type: String,
        enum: ['none', 'dismiss', 'request_more_info', 'hide_listing', 'suspend_listing', 'block_owner', 'resolve'],
        default: 'none'
    },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolution: { type: String, default: '' }
}, { timestamps: true });

reportSchema.index({ ad: 1, reporter: 1 }, { unique: true }); // One report per ad per user
reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
