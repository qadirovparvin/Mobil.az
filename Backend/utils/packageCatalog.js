const crypto = require('crypto');
const Package = require('../models/Package');
const { createValidationError } = require('./securityValidation');

const DEFAULT_PACKAGES = [
    { productId: 'vip-30', code: 'VIP', name: 'VIP 30 gün', durationDays: 30, currency: 'AZN', priceAmount: 9.90 },
    { productId: 'pro-30', code: 'PRO', name: 'PRO 30 gün', durationDays: 30, currency: 'AZN', priceAmount: 19.90 }
];

const normalizeMoney = (amount) => Math.round(Number(amount) * 100) / 100;

const isWithinValidity = (pkg, now = new Date()) => {
    if (!pkg || !pkg.active) return false;
    if (pkg.validFrom && pkg.validFrom > now) return false;
    if (pkg.validUntil && pkg.validUntil <= now) return false;
    return true;
};

const calculateDiscount = (pkg, now = new Date()) => {
    const discount = pkg.discount || {};
    if (!discount.type || discount.type === 'none') return 0;
    if (discount.validFrom && discount.validFrom > now) return 0;
    if (discount.validUntil && discount.validUntil <= now) return 0;

    const base = Number(pkg.priceAmount);
    if (discount.type === 'fixed') return Math.min(base, normalizeMoney(discount.amount));
    if (discount.type === 'percent') return Math.min(base, normalizeMoney(base * (Number(discount.amount) / 100)));
    return 0;
};

const buildPriceSnapshot = (pkg, now = new Date()) => {
    if (!isWithinValidity(pkg, now)) {
        throw createValidationError('Paket aktiv deyil və ya müddəti bitib');
    }
    if (pkg.currency !== 'AZN') {
        throw createValidationError('Paket valyutası dəstəklənmir');
    }

    const baseAmount = normalizeMoney(pkg.priceAmount);
    const discountAmount = calculateDiscount(pkg, now);
    const finalAmount = normalizeMoney(baseAmount - discountAmount);
    if (!Number.isFinite(finalAmount) || finalAmount < 0) {
        throw createValidationError('Paket qiyməti düzgün deyil');
    }

    return {
        productId: pkg.productId,
        packageCode: pkg.code,
        packageName: pkg.name,
        durationDays: pkg.durationDays,
        baseAmount,
        discountAmount,
        finalAmount,
        currency: pkg.currency,
        calculatedAt: now
    };
};

const findActivePackageByProductId = async (productId, options = {}) => {
    const normalizedProductId = String(productId || '').trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9_-]{1,60}$/.test(normalizedProductId)) {
        throw createValidationError('Paket identifikatoru düzgün deyil');
    }

    const pkg = await Package.findOne({ productId: normalizedProductId }).session(options.session || null);
    if (!pkg || !isWithinValidity(pkg)) {
        throw createValidationError('Paket tapılmadı və ya aktiv deyil');
    }
    return pkg;
};

const ensureDefaultPackages = async () => {
    for (const pkg of DEFAULT_PACKAGES) {
        await Package.updateOne(
            { productId: pkg.productId },
            { $set: { ...pkg, active: true } },
            { upsert: true }
        );
    }
    // Deactivate obsolete 90-day packages
    await Package.updateMany(
        { productId: { $in: ['vip-90', 'pro-90'] } },
        { $set: { active: false } }
    );
};

const generatePaymentId = () => `pay_${crypto.randomBytes(16).toString('hex')}`;

module.exports = {
    DEFAULT_PACKAGES,
    buildPriceSnapshot,
    ensureDefaultPackages,
    findActivePackageByProductId,
    generatePaymentId,
    isWithinValidity,
    normalizeMoney
};
