const mongoose = require('mongoose');

const priceSnapshotSchema = new mongoose.Schema({
    productId: { type: String, required: true },
    packageCode: { type: String, required: true },
    packageName: { type: String, required: true },
    durationDays: { type: Number, required: true },
    baseAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    currency: { type: String, required: true },
    calculatedAt: { type: Date, default: Date.now }
}, { _id: false });

const paymentSessionSchema = new mongoose.Schema({
    paymentId: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, alias: 'userId' },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', default: null },
    kind: { type: String, enum: ['package_wallet', 'package_provider', 'wallet_topup', 'topup'], required: true },
    idempotencyKey: { type: String, default: '' },
    provider: { type: String, default: 'internal' },
    providerReference: { type: String, default: '' },
    providerOrderId: { type: String, default: null, index: true },
    providerCheckoutUrl: { type: String, default: null },
    providerOrderStatus: { type: String, default: null },
    expectedAmount: { type: Number, required: true, alias: 'amount' },
    currency: { type: String, required: true },
    priceSnapshot: { type: priceSnapshotSchema, default: null },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'expired'],
        default: 'pending'
    },
    walletCredited: { type: Boolean, default: false },
    walletCreditingAt: { type: Date, default: null },
    walletCreditVersion: { type: Number, default: 0, min: 0 },
    lastEventId: { type: String, default: null },
    lastCallbackAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
    activatedAt: { type: Date, default: null },
    failureReason: { type: String, default: '' },
    callbackEventIds: [{ type: String }]
}, { timestamps: true });

paymentSessionSchema.index(
    { user: 1, idempotencyKey: 1, kind: 1 },
    {
        unique: true,
        partialFilterExpression: { idempotencyKey: { $type: 'string', $gt: '' } }
    }
);
paymentSessionSchema.index({ status: 1, expiresAt: 1 });
paymentSessionSchema.index({ providerReference: 1 });
paymentSessionSchema.index({ walletCredited: 1 });

const PaymentSession = mongoose.model('PaymentSession', paymentSessionSchema);
PaymentSession.PaymentRequest = PaymentSession;

module.exports = PaymentSession;
