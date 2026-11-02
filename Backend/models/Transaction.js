const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({

    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, alias: 'userId' },
    amount: { type: Number, required: true },  // positive = credit, negative = debit

    type: {
        type: String,
        enum: [
            'deposit',           // wallet top-up
            'topup',             // wallet top-up alias
            'withdrawal',        // cash out
            'cashout_refund',    // cash out refund
            'ad_boost',          // BumpUp / VIP / PRO purchase
            'package_purchase',  // PRO / VIP personal package
            'referral_credit',   // earned from referral
            'referral_spend',    // credit used on purchase
            'refund'
        ],
        required: true
    },

    description: { type: String, default: '' },
    reference:   { type: String, default: '' },   // external payment ID (future)

    // Linked ad (if transaction is ad-related)
    ad: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad', default: null },

    // Package purchase metadata
    packageType: { type: String, default: null },
    packageDurationDays: { type: Number, default: null },
    priceSnapshot: {
        productId: { type: String, default: '' },
        packageCode: { type: String, default: '' },
        packageName: { type: String, default: '' },
        durationDays: { type: Number, default: null },
        baseAmount: { type: Number, default: null },
        discountAmount: { type: Number, default: 0 },
        finalAmount: { type: Number, default: null },
        currency: { type: String, default: '' },
        calculatedAt: { type: Date, default: null }
    },
    paymentProvider: { type: String, default: '' },
    paymentId: { type: String, default: '' },
    idempotencyKey: { type: String, default: '' },

    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },

    walletCredited: {
        type: Boolean,
        default: false
    },
    walletCreditingAt: {
        type: Date,
        default: null
    },

    // Balance snapshot after this transaction
    balanceAfter: { type: Number, default: 0 }

}, { timestamps: true });

transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1, createdAt: -1 });
transactionSchema.index({ paymentId: 1 });
transactionSchema.index(
    { idempotencyKey: 1 },
    {
        unique: true,
        partialFilterExpression: { idempotencyKey: { $type: 'string', $gt: '' } }
    }
);
transactionSchema.index(
    { reference: 1 },
    {
        unique: true,
        partialFilterExpression: { reference: { $type: 'string', $gt: '' } }
    }
);

module.exports = mongoose.model('Transaction', transactionSchema);
