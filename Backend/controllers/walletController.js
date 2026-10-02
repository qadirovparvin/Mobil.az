const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const Package = require('../models/Package');
const PaymentSession = require('../models/PaymentSession');
const CashOutRequest = require('../models/CashOutRequest');
const AuditLog = require('../models/AuditLog');
const {
    buildPriceSnapshot,
    findActivePackageByProductId,
    generatePaymentId,
    normalizeMoney
} = require('../utils/packageCatalog');
const {
    createValidationError,
    readEnum,
    readNumber,
    readString,
    safePageLimit,
    validateAllowedFields
} = require('../utils/securityValidation');

const PAYMENT_SESSION_TTL_MS = Number(process.env.PAYMENT_SESSION_TTL_MS || 15 * 60 * 1000);
const SUPPORTED_CURRENCY = 'AZN';
const TRANSACTION_TYPES = ['deposit', 'withdrawal', 'ad_boost', 'package_purchase', 'referral_credit', 'referral_spend', 'refund'];

const httpError = (status, payload) => {
    const error = new Error(payload.message);
    error.status = status;
    error.payload = payload;
    return error;
};

const getIdempotencyReference = (req) => {
    const headerValue = req.get('Idempotency-Key');
    const bodyValue = req.body?.idempotencyKey;
    const reference = readString(headerValue || bodyValue || '', {
        fieldName: 'idempotencyKey',
        maxLength: 120
    });
    return reference;
};

const requireIdempotencyReference = (req) => {
    const reference = getIdempotencyReference(req);
    if (!reference) {
        throw createValidationError('Idempotency-Key başlığı tələb olunur');
    }
    return reference;
};

const paymentResponse = (payment, extra = {}) => ({
    paymentId: payment.paymentId,
    status: payment.status,
    expectedAmount: payment.expectedAmount,
    currency: payment.currency,
    expiresAt: payment.expiresAt,
    priceSnapshot: payment.priceSnapshot,
    ...extra
});

const createPendingPayment = async ({
    userId,
    pkg,
    kind,
    idempotencyKey,
    provider = 'internal',
    session = null
}) => {
    const now = new Date();
    const priceSnapshot = buildPriceSnapshot(pkg, now);
    const existing = await PaymentSession.findOne({ user: userId, idempotencyKey, kind }).session(session);
    if (existing) return existing;

    const [payment] = await PaymentSession.create([{
        paymentId: generatePaymentId(),
        user: userId,
        package: pkg._id,
        kind,
        idempotencyKey,
        provider,
        expectedAmount: priceSnapshot.finalAmount,
        currency: priceSnapshot.currency,
        priceSnapshot,
        status: 'pending',
        expiresAt: new Date(now.getTime() + PAYMENT_SESSION_TTL_MS)
    }], { session });

    return payment;
};

const getExistingTransactionForPayment = (payment, session = null) =>
    Transaction.findOne({ reference: payment.paymentId }).session(session);

const calculatePackageExpiry = (currentUser, durationDays) => {
    const now = new Date();
    const baseDate = currentUser.packageExpiresAt && currentUser.packageExpiresAt > now
        ? new Date(currentUser.packageExpiresAt)
        : now;
    const expiresAt = new Date(baseDate);
    expiresAt.setDate(expiresAt.getDate() + durationDays);
    return expiresAt;
};

const completePackagePayment = async ({ payment, useWalletBalance, session }) => {
    const existingTx = await getExistingTransactionForPayment(payment, session);
    if (payment.status === 'completed' && existingTx) {
        const user = await User.findById(payment.user)
            .select('walletBalance activePackage packageExpiresAt')
            .session(session);
        return { user, tx: existingTx, idempotent: true };
    }
    if (payment.status !== 'pending') {
        throw httpError(409, { message: 'Ödəniş sessiyası artıq işlənib' });
    }
    if (payment.expiresAt <= new Date()) {
        payment.status = 'expired';
        payment.failureReason = 'expired';
        await payment.save({ session });
        throw httpError(400, { message: 'Ödəniş sessiyasının vaxtı bitib' });
    }

    const currentUser = await User.findById(payment.user)
        .select('walletBalance packageExpiresAt')
        .session(session);
    if (!currentUser) {
        throw httpError(404, { message: 'İstifadəçi tapılmadı' });
    }

    const amount = normalizeMoney(payment.expectedAmount);
    if (useWalletBalance && Number(currentUser.walletBalance || 0) < amount) {
        throw httpError(400, {
            message: 'Balans kifayət deyil',
            required: amount,
            current: Number(currentUser.walletBalance || 0)
        });
    }

    const expiresAt = calculatePackageExpiry(currentUser, payment.priceSnapshot.durationDays);
    const update = {
        $set: {
            activePackage: payment.priceSnapshot.packageCode,
            packageExpiresAt: expiresAt
        }
    };
    if (useWalletBalance) {
        update.$inc = { walletBalance: -amount };
    }

    const user = await User.findOneAndUpdate(
        useWalletBalance
            ? { _id: payment.user, walletBalance: { $gte: amount } }
            : { _id: payment.user },
        update,
        { new: true, session }
    ).select('walletBalance activePackage packageExpiresAt');

    if (!user) {
        throw httpError(400, {
            message: 'Balans kifayət deyil',
            required: amount,
            current: Number(currentUser.walletBalance || 0)
        });
    }

    const [tx] = await Transaction.create([{
        user: user._id,
        amount: -amount,
        type: 'package_purchase',
        description: `${payment.priceSnapshot.packageCode} paket (${payment.priceSnapshot.durationDays} gün)`,
        reference: payment.paymentId,
        packageType: payment.priceSnapshot.packageCode,
        packageDurationDays: payment.priceSnapshot.durationDays,
        priceSnapshot: payment.priceSnapshot,
        paymentProvider: payment.provider,
        paymentId: payment.paymentId,
        balanceAfter: user.walletBalance,
        status: 'completed'
    }], { session });

    payment.status = 'completed';
    payment.completedAt = new Date();
    payment.activatedAt = new Date();
    await payment.save({ session });

    await Notification.create([{
        user: user._id,
        type: 'system',
        title: `${payment.priceSnapshot.packageCode} paket aktivləşdirildi`,
        body: `${payment.priceSnapshot.durationDays} günlük paketiniz aktivdir.`,
        link: '/cabinet.html#packages',
        relatedId: tx._id,
        relatedType: 'Transaction'
    }], { session });

    return { user, tx, idempotent: false };
};

const completeTopUpPayment = async ({ payment, session }) => {
    const existingTx = await getExistingTransactionForPayment(payment, session);
    if (payment.status === 'completed' && existingTx) {
        const user = await User.findById(payment.user).select('walletBalance').session(session);
        return { user, tx: existingTx, idempotent: true };
    }
    if (payment.status !== 'pending') {
        throw httpError(409, { message: 'Ödəniş sessiyası artıq işlənib' });
    }
    if (payment.expiresAt <= new Date()) {
        payment.status = 'expired';
        payment.failureReason = 'expired';
        await payment.save({ session });
        throw httpError(400, { message: 'Ödəniş sessiyasının vaxtı bitib' });
    }

    const amount = normalizeMoney(payment.expectedAmount);
    const user = await User.findOneAndUpdate(
        { _id: payment.user },
        { $inc: { walletBalance: amount } },
        { new: true, session }
    ).select('walletBalance');

    if (!user) {
        throw httpError(404, { message: 'Wallet or user not found' });
    }

    const [tx] = await Transaction.create([{
        user: user._id,
        amount,
        type: 'deposit',
        description: `Balans artırımı - ${amount} ${payment.currency}`,
        reference: payment.paymentId,
        paymentProvider: payment.provider,
        paymentId: payment.paymentId,
        balanceAfter: user.walletBalance,
        status: 'completed'
    }], { session });

    payment.status = 'completed';
    payment.completedAt = new Date();
    await payment.save({ session });

    await Notification.create([{
        user: user._id,
        type: 'system',
        title: 'Balansınız artırıldı',
        body: `${amount} ${payment.currency} hesabınıza əlavə edildi. Cari balans: ${user.walletBalance} ${payment.currency}`,
        link: '/cabinet.html#wallet',
        relatedId: tx._id,
        relatedType: 'Transaction'
    }], { session });

    return { user, tx, idempotent: false };
};

const verifyProviderSignature = (req, { paymentId, amount, currency, providerReference }) => {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!secret) {
        throw new Error('PAYMENT_WEBHOOK_SECRET is not configured');
    }

    const provided = req.get('x-payment-signature') || '';
    const payload = `${paymentId}.${amount}.${currency}.${providerReference || ''}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const left = Buffer.from(provided, 'utf8');
    const right = Buffer.from(expected, 'utf8');
    return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const validatePaymentCallbackMatch = (payment, { amount, currency, productId }) => {
    const expectedAmount = normalizeMoney(payment.expectedAmount);
    const paidAmount = normalizeMoney(amount);
    if (currency !== payment.currency || paidAmount !== expectedAmount) {
        return { valid: false, reason: 'amount_or_currency_mismatch' };
    }
    if (productId && payment.priceSnapshot
        && String(productId).trim().toLowerCase() !== payment.priceSnapshot.productId) {
        return { valid: false, reason: 'package_mismatch' };
    }
    if (payment.expiresAt && payment.expiresAt <= new Date() && payment.status !== 'completed') {
        return { valid: false, reason: 'expired' };
    }
    return { valid: true };
};

// @desc    Get wallet balance and recent transactions
// @route   GET /api/wallet/balance
// @access  Private
const getBalance = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('walletBalance walletPendingBalance walletReservedBalance walletPromoBalance referralCredits');

        const recent = await Transaction.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            walletBalance: user.walletBalance,
            availableBalance: user.walletBalance,
            pendingBalance: user.walletPendingBalance || 0,
            reservedBalance: user.walletReservedBalance || 0,
            promoBalance: user.walletPromoBalance || 0,
            referralCredits: user.referralCredits,
            recentTransactions: recent
        });
    } catch (error) {
        next(error);
    }
};

// @desc    List active purchasable packages with server-side prices
// @route   GET /api/wallet/packages
// @access  Private
const getPackages = async (req, res, next) => {
    try {
        const now = new Date();
        const packages = await Package.find({
            active: true,
            $and: [
                { $or: [{ validFrom: null }, { validFrom: { $lte: now } }] },
                { $or: [{ validUntil: null }, { validUntil: { $gt: now } }] }
            ]
        }).sort({ code: 1, durationDays: 1 });

        res.json({
            packages: packages.map((pkg) => ({
                productId: pkg.productId,
                code: pkg.code,
                name: pkg.name,
                durationDays: pkg.durationDays,
                currency: pkg.currency,
                price: buildPriceSnapshot(pkg, now).finalAmount
            }))
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a provider-backed wallet top-up session. Balance is credited only by callback.
// @route   POST /api/wallet/topup
// @access  Private
const topUp = async (req, res, next) => {
    try {
        validateAllowedFields(req.body, ['amount', 'currency', 'idempotencyKey'], 'body');
        const idempotencyKey = requireIdempotencyReference(req);
        const amount = normalizeMoney(readNumber(req.body.amount, {
            fieldName: 'amount',
            required: true,
            min: 1,
            max: 10000
        }));
        const currency = readString(req.body.currency || SUPPORTED_CURRENCY, {
            fieldName: 'currency',
            maxLength: 3,
            uppercase: true
        }) || SUPPORTED_CURRENCY;
        if (currency !== SUPPORTED_CURRENCY) {
            return res.status(400).json({ message: 'Valyuta dəstəklənmir' });
        }

        let payment = await PaymentSession.findOne({
            user: req.user._id,
            idempotencyKey,
            kind: 'wallet_topup'
        });
        if (!payment) {
            [payment] = await PaymentSession.create([{
                paymentId: generatePaymentId(),
                user: req.user._id,
                kind: 'wallet_topup',
                idempotencyKey,
                provider: 'manual',
                expectedAmount: amount,
                currency,
                status: 'pending',
                expiresAt: new Date(Date.now() + PAYMENT_SESSION_TTL_MS)
            }]);
        }

        res.status(202).json(paymentResponse(payment, {
            message: 'Ödəniş sessiyası yaradıldı. Balans yalnız ödəniş təsdiqindən sonra artırılacaq.',
            idempotent: payment.createdAt.getTime() !== payment.updatedAt.getTime()
        }));
    } catch (error) {
        if (error.payload) return res.status(error.status || 500).json(error.payload);
        next(error);
    }
};

// @desc    Purchase a user package atomically from wallet balance
// @route   POST /api/wallet/packages/purchase
// @access  Private
const purchasePackage = async (req, res, next) => {
    try {
        validateAllowedFields(req.body, ['packageId', 'productId', 'idempotencyKey'], 'body');
        const idempotencyKey = requireIdempotencyReference(req);
        const productId = readString(req.body.packageId || req.body.productId, {
            fieldName: 'packageId',
            required: true,
            maxLength: 64,
            lowercase: true
        });
        const pkg = await findActivePackageByProductId(productId);

        let result;
        try {
            const session = await mongoose.startSession();
            try {
                await session.withTransaction(async () => {
                    const payment = await createPendingPayment({
                        userId: req.user._id,
                        pkg,
                        kind: 'package_wallet',
                        idempotencyKey,
                        provider: 'wallet',
                        session
                    });
                    result = await completePackagePayment({ payment, useWalletBalance: true, session });
                });
            } finally {
                await session.endSession();
            }
        } catch (txError) {
            const isTxUnsupported = Boolean(
                txError &&
                (txError.message?.includes('replica set member') ||
                 txError.message?.includes('Transaction numbers are only allowed') ||
                 txError.code === 20 ||
                 txError.codeName === 'IllegalOperation')
            );
            if (isTxUnsupported) {
                // Fallback: run without transaction for standalone MongoDB
                const payment = await createPendingPayment({
                    userId: req.user._id,
                    pkg,
                    kind: 'package_wallet',
                    idempotencyKey,
                    provider: 'wallet'
                });
                result = await completePackagePayment({ payment, useWalletBalance: true, session: null });
            } else {
                throw txError;
            }
        }

        res.json({
            message: 'Paket aktivləşdirildi',
            walletBalance: result.user.walletBalance,
            activePackage: result.user.activePackage,
            packageExpiresAt: result.user.packageExpiresAt,
            billingExpiresAt: result.user.packageExpiresAt,
            transaction: result.tx,
            idempotent: result.idempotent
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Bu idempotency açarı artıq istifadə olunub' });
        }
        if (error.payload) return res.status(error.status || 500).json(error.payload);
        next(error);
    }
};

// @desc    Create a payment-provider package session. Activation occurs only by verified callback.
// @route   POST /api/wallet/packages/payment-session
// @access  Private
const createPackagePaymentSession = async (req, res, next) => {
    try {
        validateAllowedFields(req.body, ['packageId', 'productId', 'idempotencyKey', 'provider'], 'body');
        const idempotencyKey = requireIdempotencyReference(req);
        const productId = readString(req.body.packageId || req.body.productId, {
            fieldName: 'packageId',
            required: true,
            maxLength: 64,
            lowercase: true
        });
        const provider = readString(req.body.provider || 'card', {
            fieldName: 'provider',
            maxLength: 40
        }) || 'card';
        const pkg = await findActivePackageByProductId(productId);
        const payment = await createPendingPayment({
            userId: req.user._id,
            pkg,
            kind: 'package_provider',
            idempotencyKey,
            provider
        });

        res.status(201).json(paymentResponse(payment, {
            message: 'Ödəniş sessiyası yaradıldı',
            idempotent: payment.status !== 'pending'
        }));
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Bu idempotency açarı artıq istifadə olunub' });
        }
        if (error.payload) return res.status(error.status || 500).json(error.payload);
        next(error);
    }
};

// @desc    Payment provider callback verifier
// @route   POST /api/wallet/payments/:paymentId/callback
// @access  Payment provider
const handlePaymentCallback = async (req, res, next) => {
    const session = await mongoose.startSession();
    try {
        validateAllowedFields(req.body, ['amount', 'currency', 'packageId', 'productId', 'status', 'providerReference', 'eventId'], 'body');
        const paymentId = readString(req.params.paymentId, {
            fieldName: 'paymentId',
            required: true,
            maxLength: 80
        });
        const amount = normalizeMoney(readNumber(req.body.amount, {
            fieldName: 'amount',
            required: true,
            min: 0
        }));
        const currency = readString(req.body.currency, {
            fieldName: 'currency',
            required: true,
            maxLength: 3,
            uppercase: true
        });
        const status = readString(req.body.status, {
            fieldName: 'status',
            required: true,
            maxLength: 40,
            lowercase: true
        });
        const providerReference = readString(req.body.providerReference || '', {
            fieldName: 'providerReference',
            maxLength: 120
        });
        const eventId = readString(req.body.eventId || providerReference || '', {
            fieldName: 'eventId',
            maxLength: 120
        });

        if (!verifyProviderSignature(req, { paymentId, amount, currency, providerReference })) {
            return res.status(401).json({ message: 'Ödəniş imzası yanlışdır' });
        }

        let result;
        await session.withTransaction(async () => {
            const payment = await PaymentSession.findOne({ paymentId }).session(session);
            if (!payment) throw httpError(404, { message: 'Ödəniş sessiyası tapılmadı' });

            if (eventId && payment.callbackEventIds.includes(eventId)) {
                result = {
                    idempotent: true,
                    payment,
                    tx: await getExistingTransactionForPayment(payment, session)
                };
                return;
            }
            if (eventId) payment.callbackEventIds.push(eventId);

            const requestedProductId = req.body.packageId || req.body.productId;
            const callbackMatch = validatePaymentCallbackMatch(payment, {
                amount,
                currency,
                productId: requestedProductId
            });

            if (!callbackMatch.valid && callbackMatch.reason === 'package_mismatch') {
                payment.status = 'failed';
                payment.failureReason = 'package_mismatch';
                await payment.save({ session });
                throw httpError(400, { message: 'Ödəniş paketi uyğun deyil' });
            }

            if (!callbackMatch.valid && callbackMatch.reason === 'amount_or_currency_mismatch') {
                payment.status = 'failed';
                payment.failureReason = 'amount_or_currency_mismatch';
                await payment.save({ session });
                throw httpError(400, { message: 'Ödəniş məbləği və ya valyutası uyğun deyil' });
            }

            if (!callbackMatch.valid && callbackMatch.reason === 'expired') {
                payment.status = 'expired';
                payment.failureReason = 'expired';
                await payment.save({ session });
                throw httpError(400, { message: 'Ödəniş sessiyasının vaxtı bitib' });
            }

            if (!['paid', 'completed', 'success'].includes(status)) {
                payment.status = 'failed';
                payment.failureReason = `provider_status:${status}`;
                await payment.save({ session });
                result = { payment, failed: true };
                return;
            }

            payment.providerReference = providerReference || payment.providerReference;
            if (payment.kind === 'wallet_topup') {
                result = await completeTopUpPayment({ payment, session });
            } else if (payment.kind === 'package_provider') {
                result = await completePackagePayment({ payment, useWalletBalance: false, session });
            } else if (payment.kind === 'package_wallet') {
                result = await completePackagePayment({ payment, useWalletBalance: true, session });
            } else {
                throw httpError(400, { message: 'Ödəniş növü dəstəklənmir' });
            }
        });

        if (result?.failed) {
            return res.json({ message: 'Ödəniş uğursuz kimi qeydə alındı', payment: paymentResponse(result.payment) });
        }

        res.json({
            message: result?.idempotent ? 'Callback artıq işlənib' : 'Ödəniş təsdiqləndi',
            idempotent: Boolean(result?.idempotent),
            transaction: result?.tx || null
        });
    } catch (error) {
        if (error.payload) return res.status(error.status || 500).json(error.payload);
        next(error);
    } finally {
        await session.endSession();
    }
};

// @desc    Get full transaction history (paginated)
// @route   GET /api/wallet/transactions
// @access  Private
const getTransactions = async (req, res, next) => {
    try {
        const { page, limit, skip } = safePageLimit(req.query, { defaultLimit: 20, maxLimit: 100 });
        const filter = { user: req.user._id };
        if (req.query.type) {
            filter.type = readEnum(req.query.type, TRANSACTION_TYPES, {
                fieldName: 'type',
                required: true,
                maxLength: 40
            });
        }

        const total = await Transaction.countDocuments(filter);
        const txs = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('ad', 'brand modelName');

        const totalPages = Math.ceil(total / limit);
        res.json({
            transactions: txs,
            page,
            limit,
            totalTransactions: total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Request cash out from wallet balance
// @route   POST /api/wallet/cash-out
// @access  Private
const requestCashOut = async (req, res, next) => {
    const session = await mongoose.startSession();
    try {
        validateAllowedFields(req.body, ['amount', 'destination', 'accountHolderDetails', 'idempotencyKey'], 'body');
        const idempotencyKey = requireIdempotencyReference(req);
        const amount = normalizeMoney(readNumber(req.body.amount, {
            fieldName: 'amount',
            required: true,
            min: Number(process.env.CASHOUT_MIN_AMOUNT || 10),
            max: Number(process.env.CASHOUT_MAX_AMOUNT || 5000)
        }));
        const destination = readEnum(req.body.destination, ['card', 'bank_account'], { fieldName: 'destination', required: true });
        const accountHolderDetails = readString(req.body.accountHolderDetails, { fieldName: 'accountHolderDetails', required: true, maxLength: 500 });
        if (/\b(cvv|cvc|pin)\b/i.test(accountHolderDetails) || /\b\d{13,19}\b/.test(accountHolderDetails.replace(/\s+/g, ''))) {
            return res.status(400).json({ message: 'Tam kart nömrəsi, CVV/CVC və ya PIN qəbul edilmir. Tokenləşdirilmiş payout məlumatı istifadə olunmalıdır.' });
        }

        let result;
        await session.withTransaction(async () => {
            const existing = await CashOutRequest.findOne({ user: req.user._id, idempotencyKey }).session(session);
            if (existing) {
                result = existing;
                return;
            }

            const user = await User.findOneAndUpdate(
                { _id: req.user._id, walletBalance: { $gte: amount } },
                { $inc: { walletBalance: -amount, walletReservedBalance: amount } },
                { new: true, session }
            ).select('walletBalance walletReservedBalance');
            if (!user) {
                const current = await User.findById(req.user._id).select('walletBalance').session(session);
                throw httpError(400, { message: 'Kifayət qədər balans yoxdur', current: current?.walletBalance || 0 });
            }

            // Create ledger entry for pending cashout
            const [tx] = await Transaction.create([{
                user: user._id,
                amount: -amount,
                type: 'withdrawal',
                description: `Çıxarış sorğusu - ${destination}`,
                reference: `CASHOUT:${idempotencyKey}`,
                status: 'pending',
                balanceAfter: user.walletBalance
            }], { session });

            const [cashOut] = await CashOutRequest.create([{
                user: user._id,
                amount,
                destination,
                accountHolderDetails,
                idempotencyKey,
                reservedTransaction: tx._id,
                status: 'pending'
            }], { session });

            tx.reference = cashOut._id.toString();
            await tx.save({ session });

            result = cashOut;
        });

        res.status(201).json({ message: 'Çıxarış sorğusu göndərildi', cashOut: result });
    } catch (error) {
        if (error.payload) return res.status(error.status || 500).json(error.payload);
        next(error);
    } finally {
        await session.endSession();
    }
};

// @desc    Review cash out request (Admin)
// @route   PATCH /api/wallet/cash-out/:id/review
// @access  Private/Admin
const adminReviewCashOut = async (req, res, next) => {
    const session = await mongoose.startSession();
    try {
        validateAllowedFields(req.body, ['status', 'rejectionReason'], 'body');
        const status = readEnum(req.body.status, ['under_review', 'approved', 'processing', 'paid', 'rejected', 'cancelled'], { fieldName: 'status', required: true });
        const rejectionReason = readString(req.body.rejectionReason || '', { fieldName: 'rejectionReason', maxLength: 1000 });

        let result;
        await session.withTransaction(async () => {
            const cashOut = await CashOutRequest.findById(req.params.id).session(session);
            if (!cashOut) throw httpError(404, { message: 'Sorğu tapılmadı' });
            if (cashOut.status === 'paid' || cashOut.status === 'rejected' || cashOut.status === 'cancelled') {
                throw httpError(400, { message: 'Bu sorğu artıq yekunlaşıb' });
            }

            const prevState = cashOut.status;
            cashOut.status = status;
            cashOut.adminId = req.user._id;
            cashOut.reviewedAt = new Date();
            if (status === 'rejected') cashOut.rejectionReason = rejectionReason;
            if (status === 'processing') cashOut.processedAt = new Date();
            if (status === 'paid') cashOut.paidAt = new Date();
            await cashOut.save({ session });

            const tx = await Transaction.findOne({ reference: cashOut._id.toString() }).session(session);

            if (status === 'rejected' || status === 'cancelled') {
                await User.updateOne(
                    { _id: cashOut.user, walletReservedBalance: { $gte: cashOut.amount } },
                    { $inc: { walletBalance: cashOut.amount, walletReservedBalance: -cashOut.amount } },
                    { session }
                );

                if (tx) {
                    tx.status = 'failed';
                    await tx.save({ session });
                }

                await Notification.create([{
                    user: cashOut.user,
                    type: 'system',
                    title: status === 'cancelled' ? 'Çıxarış ləğv edildi' : 'Çıxarış rədd edildi',
                    body: status === 'cancelled'
                        ? `Sizin ${cashOut.amount} AZN çıxarışınız ləğv edildi və məbləğ balansınıza qaytarıldı.`
                        : `Sizin ${cashOut.amount} AZN çıxarışınız rədd edildi. Səbəb: ${rejectionReason}`,
                    link: '/cabinet.html#wallet'
                }], { session });

            } else if (status === 'paid') {
                await User.updateOne(
                    { _id: cashOut.user, walletReservedBalance: { $gte: cashOut.amount } },
                    { $inc: { walletReservedBalance: -cashOut.amount } },
                    { session }
                );
                if (tx) {
                    tx.status = 'completed';
                    await tx.save({ session });
                }

                await Notification.create([{
                    user: cashOut.user,
                    type: 'system',
                    title: 'Çıxarış uğurla tamamlandı',
                    body: `Sizin ${cashOut.amount} AZN çıxarışınız göndərildi.`,
                    link: '/cabinet.html#wallet'
                }], { session });
            }

            await AuditLog.create([{
                actor: req.user._id,
                targetModel: 'CashOutRequest',
                target: cashOut._id,
                action: 'cashout.reviewed',
                previousState: { status: prevState },
                newState: { status: cashOut.status, rejectionReason },
                requestId: req.id || ''
            }], { session });

            result = cashOut;
        });

        res.json({ message: 'Sorğu yeniləndi', cashOut: result });
    } catch (error) {
        if (error.payload) return res.status(error.status || 500).json(error.payload);
        next(error);
    } finally {
        await session.endSession();
    }
};
module.exports = {
    createPackagePaymentSession,
    getBalance,
    getPackages,
    getTransactions,
    handlePaymentCallback,
    purchasePackage,
    topUp,
    requestCashOut,
    adminReviewCashOut
};

module.exports._test = {
    validatePaymentCallbackMatch
};
