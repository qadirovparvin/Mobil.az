const mongoose = require('mongoose');

const cashOutRequestSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    destination: {
        type: String, // e.g., 'card', 'bank_account'
        required: true,
        enum: ['card', 'bank_account']
    },
    accountHolderDetails: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                if (!v || typeof v !== 'string') return false;
                if (/\b(cvv|cvc|pin)\b/i.test(v)) return false;
                const cleaned = v.replace(/[\s-]/g, '');
                if (/^\d{13,19}$/.test(cleaned) || /\b\d{13,19}\b/.test(cleaned)) return false;
                return true;
            },
            message: 'Tam kart nömrəsi, CVV/CVC və ya PIN qəbul edilmir. Tokenləşdirilmiş payout məlumatı istifadə olunmalıdır.'
        }
    }, // Not full card details!
    idempotencyKey: { type: String, required: true },
    walletReserved: { type: Boolean, default: false },
    reservedAmount: { type: Number, default: 0, min: 0 },
    reservedAt: { type: Date, default: null },
    reservedTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', default: null },
    reviewedAt: { type: Date, default: null },
    processedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    status: {
        type: String,
        enum: ['reserving', 'pending', 'under_review', 'approved', 'processing', 'paid', 'completed', 'rejected', 'cancelled', 'failed'],
        default: 'pending'
    },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectionReason: { type: String, default: '' },
    failureReason: { type: String, default: '' },
}, { timestamps: true });

cashOutRequestSchema.index({ user: 1, status: 1 });
cashOutRequestSchema.index({ status: 1, createdAt: -1 });
cashOutRequestSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true });
cashOutRequestSchema.index({ idempotencyKey: 1 });

const CashOutRequest = mongoose.model('CashOutRequest', cashOutRequestSchema);
CashOutRequest.CashOut = CashOutRequest;

module.exports = CashOutRequest;
