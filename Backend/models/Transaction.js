const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({

    user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },  // positive = credit, negative = debit

    type: {
        type: String,
        enum: [
            'deposit',           // wallet top-up
            'withdrawal',        // cash out
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

    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    },

    // Balance snapshot after this transaction
    balanceAfter: { type: Number, default: 0 }

}, { timestamps: true });

transactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
