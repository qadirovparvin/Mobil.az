const mongoose = require('mongoose');

const boostIdempotencySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ad: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ad',
        required: true
    },
    idempotencyKey: {
        type: String,
        required: true
    },
    promotionType: {
        type: String,
        required: false
    },
    cost: {
        type: Number,
        required: false
    },
    responsePayload: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    response: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'processing'
    },
    error: {
        type: String,
        default: null
    }
}, { timestamps: true });

boostIdempotencySchema.index({ user: 1, idempotencyKey: 1 }, { unique: true });
boostIdempotencySchema.index({ user: 1, ad: 1, idempotencyKey: 1 });
boostIdempotencySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('BoostIdempotency', boostIdempotencySchema);
