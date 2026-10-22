const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
    type: { type: String, enum: ['none', 'fixed', 'percent'], default: 'none' },
    amount: { type: Number, default: 0, min: 0 },
    validFrom: { type: Date, default: null },
    validUntil: { type: Date, default: null }
}, { _id: false });

const packageSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true, trim: true, lowercase: true },
    code: { type: String, enum: ['VIP', 'PRO'], required: true },
    name: { type: String, required: true },
    durationDays: { type: Number, required: true, min: 1, max: 366 },
    currency: { type: String, enum: ['AZN'], default: 'AZN' },
    priceAmount: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true },
    validFrom: { type: Date, default: null },
    validUntil: { type: Date, default: null },
    discount: { type: discountSchema, default: () => ({ type: 'none', amount: 0 }) }
}, { timestamps: true });

packageSchema.index({ active: 1, validFrom: 1, validUntil: 1 });
packageSchema.index({ code: 1, durationDays: 1 }, { unique: true });

module.exports = mongoose.model('Package', packageSchema);
