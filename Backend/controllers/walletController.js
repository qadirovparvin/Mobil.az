const mongoose = require('mongoose');
const logger = require('../utils/logger');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const Package = require('../models/Package');
const PaymentSession = require('../models/PaymentSession');
const PaymentRequest = PaymentSession;
const CashOutRequest = require('../models/CashOutRequest');
const CashOut = CashOutRequest;
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
const { getProvider } = require('../services/paymentFactory');
const paymentConfig = require('../config/payment');
const {
    sendTopUpSuccessEmail,
    sendCashOutRequestEmail,
    sendCashOutApprovedEmail
} = require('../utils/email');

const PAYMENT_SESSION_TTL_MS = Number(process.env.PAYMENT_SESSION_TTL_MS || 15 * 60 * 1000);
const SUPPORTED_CURRENCY = 'AZN';
const TRANSACTION_TYPES = ['deposit', 'withdrawal', 'ad_boost', 'package_purchase', 'referral_credit', 'referral_spend', 'refund'];

const httpError = (status, payload) => {
    const error = new Error(payload.message);
    error.status = status;
    error.payload = payload;
    return error;
};

const walletTopUpOperationKey = (paymentId) => `topup:${paymentId}`;
const cashOutReserveOperationKey = (cashOutId) => `cashout-reserve:${cashOutId}`;
const cashOutRefundOperationKey = (cashOutId) => `refund:${cashOutId}`;

const applyTopUpCreditOnce = async (userId, paymentId, amount, session = null) => {
    const operationKey = walletTopUpOperationKey(paymentId);
    const updateQuery = User.findOneAndUpdate(
        { _id: userId, walletOperationKeys: { $ne: operationKey } },
        {
            $inc: { walletBalance: amount },
            $addToSet: { walletOperationKeys: operationKey },
            $set: { updatedAt: new Date() }
        },
        { new: true, returnDocument: 'after' }
    );
    if (session) updateQuery.session(session);
    const updatedUser = await updateQuery;
    if (updatedUser) return { user: updatedUser, applied: true };

    let existingQuery = User.findOne({ _id: userId, walletOperationKeys: operationKey }).select('walletBalance');
    if (session) existingQuery = existingQuery.session(session);
    const existingUser = await existingQuery;
    if (existingUser) return { user: existingUser, applied: false };

    throw httpError(404, { message: 'Wallet or user not found' });
};

const ensureTopUpCreditForRecovery = async (userId, payment, session = null) => {
    if (Number(payment.walletCreditVersion || 0) >= 1) {
        return applyTopUpCreditOnce(userId, payment.paymentId, normalizeMoney(payment.expectedAmount ?? payment.amount ?? 0), session);
    }

    let markerQuery = User.findOne({
        _id: userId,
        walletOperationKeys: walletTopUpOperationKey(payment.paymentId)
    }).select('walletBalance');
    if (session) markerQuery = markerQuery.session(session);
    const creditedUser = await markerQuery;
    if (!creditedUser) {
        throw httpError(409, { message: 'Legacy ödəniş sessiyası təhlükəsiz avtomatik bərpa edilə bilmir; manual yoxlama tələb olunur' });
    }
    return { user: creditedUser, applied: false };
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

const resolveCheckoutOrigin = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    let origin = process.env.API_PUBLIC_ORIGIN;
    if (!origin) {
        if (isProduction) {
            throw new Error('API_PUBLIC_ORIGIN required');
        } else {
            origin = process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:5000';
        }
    }
    return origin.replace(/\/+$/, '');
};

const validateCheckoutConfiguration = () => {
    const rawProvider = process.env.PAYMENT_PROVIDER;
    const provider = String(rawProvider || 'mock').trim().toLowerCase();
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction && (!rawProvider || provider === 'mock')) {
        throw httpError(503, {
            message: 'Ödəniş sistemi konfiqurasiya edilməyib, admin ilə əlaqə saxlayın',
            error: 'Ödəniş sistemi konfiqurasiya edilməyib'
        });
    }
    if (isProduction) {
        if (provider === 'payriff') {
            const secret = String(process.env.PAYRIFF_SECRET || process.env.PAYRIFF_API_KEY || '').trim();
            if (!secret) {
                throw httpError(503, {
                    message: 'Ödəniş sistemi konfiqurasiya edilməyib, admin ilə əlaqə saxlayın',
                    error: 'Ödəniş sistemi konfiqurasiya edilməyib'
                });
            }
            let payriffConfig;
            try {
                const config = paymentConfig.getConfig();
                payriffConfig = config.payriff;
            } catch (cfgErr) {
                throw httpError(503, {
                    message: 'Ödəniş sistemi konfiqurasiya edilməyib, admin ilə əlaqə saxlayın',
                    error: 'Ödəniş sistemi konfiqurasiya edilməyib'
                });
            }
            if (!payriffConfig.webhookSecret) {
                throw new Error('PAYRIFF_WEBHOOK_SECRET is not configured');
            }
            if (!payriffConfig.signatureHeader) {
                throw new Error('PAYRIFF_SIGNATURE_HEADER is not configured');
            }
        } else if (!process.env.PAYMENT_WEBHOOK_SECRET) {
            throw new Error('PAYMENT_WEBHOOK_SECRET is not configured');
        }
    }
    return { provider, isProduction };
};

const resolveCheckoutUrl = (payment) => {
    const origin = resolveCheckoutOrigin();
    const { provider, isProduction } = validateCheckoutConfiguration();
    const paymentService = getProvider();
    if (isProduction && (paymentService.name === 'mock' || provider === 'mock')) {
        throw httpError(503, {
            message: 'Ödəniş sistemi konfiqurasiya edilməyib, admin ilə əlaqə saxlayın',
            error: 'Ödəniş sistemi konfiqurasiya edilməyib'
        });
    }
    if (process.env.NODE_ENV !== 'production' && provider === 'mock') {
        if (typeof paymentService.createMockSession === 'function') {
            return paymentService.createMockSession(payment, origin);
        }
        return require('../services/mockProvider').createMockSession(payment, origin);
    }
    if (typeof paymentService.createMockSession === 'function') {
        return paymentService.createMockSession(payment, origin);
    }
    return require('../services/mockProvider').createMockSession(payment, origin);
};

const createProviderCheckoutUrl = async (payment) => {
    if (payment.providerOrderId && payment.providerCheckoutUrl) {
        return payment.providerCheckoutUrl;
    }
    if (payment._id) {
        const fresh = await PaymentSession.findById(payment._id).select('providerOrderId providerCheckoutUrl');
        if (fresh?.providerOrderId && fresh?.providerCheckoutUrl) {
            payment.providerOrderId = fresh.providerOrderId;
            payment.providerCheckoutUrl = fresh.providerCheckoutUrl;
            return fresh.providerCheckoutUrl;
        }
    }

    const origin = resolveCheckoutOrigin();
    const { provider, isProduction } = validateCheckoutConfiguration();
    const paymentProvider = String(process.env.PAYMENT_PROVIDER || 'mock').trim().toLowerCase();
    const paymentService = getProvider();
    if (isProduction && (paymentProvider === 'mock' || provider === 'mock' || paymentService.name === 'mock')) {
        throw httpError(503, {
            message: 'Ödəniş sistemi konfiqurasiya edilməyib, admin ilə əlaqə saxlayın',
            error: 'Ödəniş sistemi konfiqurasiya edilməyib'
        });
    }
    if (provider === 'payriff' && isProduction && !process.env.PAYRIFF_SECRET) {
        throw new Error('Live provider secret missing');
    }

    try {
        const payriffOrder = await paymentService.createSession(
            payment.expectedAmount,
            payment.user,
            payment.paymentId,
            { payment, origin }
        );
        const checkoutUrl = typeof payriffOrder === 'string' ? payriffOrder : (payriffOrder.url || payriffOrder.checkoutUrl || payriffOrder.payUrl);
        const providerOrderId = typeof payriffOrder === 'object' ? (payriffOrder.id || payriffOrder.orderId || payriffOrder.providerSessionId) : null;

        if (payment._id && providerOrderId && checkoutUrl) {
            await PaymentSession.updateOne(
                { _id: payment._id },
                {
                    $set: {
                        providerOrderId: providerOrderId,
                        providerCheckoutUrl: checkoutUrl,
                        providerOrderStatus: 'CREATED'
                    }
                }
            );
            payment.providerOrderId = providerOrderId;
            payment.providerCheckoutUrl = checkoutUrl;
            payment.providerOrderStatus = 'CREATED';
        }

        return checkoutUrl;
    } catch (err) {
        if (err.status === 502 || err.statusCode === 502) {
            throw err;
        }
        if (provider === 'payriff') {
            const gatewayErr = new Error(err.message || 'Payriff payment gateway error');
            gatewayErr.status = 502;
            gatewayErr.statusCode = 502;
            gatewayErr.payload = { message: 'Ödəniş şlüzü ilə əlaqə qurulmadı (Payriff Gateway Error)' };
            throw gatewayErr;
        }
        throw err;
    }
};

const paymentResponse = (payment, extra = {}) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const paymentProvider = String(process.env.PAYMENT_PROVIDER || 'mock').trim().toLowerCase();
    if (isProduction && (!process.env.PAYMENT_PROVIDER || paymentProvider === 'mock')) {
        throw httpError(503, { message: 'Ödəniş sistemi konfiqurasiya edilməyib, admin ilə əlaqə saxlayın' });
    }
    const checkoutUrl = extra.checkoutUrl || payment.providerCheckoutUrl || (payment.status === 'pending' ? resolveCheckoutUrl(payment) : null);
    return {
        payment,
        paymentId: payment.paymentId,
        sessionId: payment._id,
        status: payment.status,
        expectedAmount: payment.expectedAmount,
        currency: payment.currency,
        expiresAt: payment.expiresAt,
        checkoutUrl,
        paymentUrl: checkoutUrl,
        hostedUrl: checkoutUrl,
        priceSnapshot: payment.priceSnapshot,
        provider: payment.provider,
        providerOrderId: payment.providerOrderId || null,
        providerCheckoutUrl: payment.providerCheckoutUrl || checkoutUrl,
        idempotencyKey: payment.idempotencyKey,
        kind: payment.kind,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        ...extra
    };
};

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
    const query = PaymentSession.findOne({ user: userId, idempotencyKey, kind });
    if (session) query.session(session);
    const existing = await query;
    if (existing) {
        existing._isExisting = true;
        return existing;
    }

    try {
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

        payment._isExisting = false;
        return payment;
    } catch (err) {
        if (err.code === 11000) {
            const retryQuery = PaymentSession.findOne({ user: userId, idempotencyKey, kind });
            if (session) retryQuery.session(session);
            const found = await retryQuery;
            if (found) {
                found._isExisting = true;
                return found;
            }
        }
        throw err;
    }
};

const getExistingTransactionForPayment = (payment, session = null) => {
    const query = Transaction.findOne({
        $or: [
            { idempotencyKey: payment.paymentId },
            { idempotencyKey: `topup:${payment.paymentId}` },
            { paymentId: payment.paymentId },
            { reference: payment.paymentId }
        ],
        status: { $in: ['completed', 'paid'] }
    });
    if (session) query.session(session);
    return query;
};

const calculatePackageExpiry = (currentUser, durationDays) => {
    const now = new Date();
    const baseDate = currentUser.packageExpiresAt && currentUser.packageExpiresAt > now
        ? new Date(currentUser.packageExpiresAt)
        : now;
    const expiresAt = new Date(baseDate);
    expiresAt.setDate(expiresAt.getDate() + durationDays);
    return expiresAt;
};

const completePackagePayment = async ({ payment, useWalletBalance, session, allowOverrideFailed = false }) => {
    const existingTx = await getExistingTransactionForPayment(payment, session);
    if ((payment.status === 'completed' || payment.status === 'paid') || existingTx) {
        if (existingTx && (existingTx.status === 'completed' || existingTx.status === 'paid') && payment.status !== 'completed' && payment.status !== 'paid') {
            const sessUpdate = PaymentSession.updateOne(
                { _id: payment._id },
                { $set: { status: 'completed', completedAt: new Date(), activatedAt: new Date() } }
            );
            if (session) sessUpdate.session(session);
            await sessUpdate;
            payment.status = 'completed';
        }
        const userQuery = User.findById(payment.user)
            .select('walletBalance activePackage packageExpiresAt');
        if (session) userQuery.session(session);
        const user = await userQuery;
        return { user, tx: existingTx, idempotent: true };
    }
    if (payment.status === 'failed') {
        if (allowOverrideFailed) {
            console.warn(`Overriding failed package session ${payment.paymentId} with APPROVED callback`);
            payment.status = 'pending';
            payment.failureReason = '';
        } else {
            throw httpError(409, { message: 'Ödəniş sessiyası artıq işlənib' });
        }
    } else if (payment.status !== 'pending') {
        throw httpError(409, { message: 'Ödəniş sessiyası artıq işlənib' });
    }
    if (payment.expiresAt <= new Date()) {
        payment.status = 'expired';
        payment.failureReason = 'expired';
        await (session ? payment.save({ session }) : payment.save());
        throw httpError(400, { message: 'Ödəniş sessiyasının vaxtı bitib' });
    }

    // Atomic claim of payment status for package payments in standalone Mongo
    const claimQuery = PaymentSession.findOneAndUpdate(
        { _id: payment._id, status: { $in: ['pending', ...(allowOverrideFailed ? ['failed'] : [])] } },
        { $set: { status: 'completed', completedAt: new Date(), activatedAt: new Date() } },
        { new: true, returnDocument: 'after' }
    );
    if (session) claimQuery.session(session);
    const claimedPayment = await claimQuery;

    if (!claimedPayment) {
        const tx = await getExistingTransactionForPayment(payment, session);
        const userQuery = User.findById(payment.user)
            .select('walletBalance activePackage packageExpiresAt');
        if (session) userQuery.session(session);
        const user = await userQuery;
        return { user, tx, idempotent: true };
    }

    const currentUserQuery = User.findById(payment.user)
        .select('walletBalance packageExpiresAt');
    if (session) currentUserQuery.session(session);
    const currentUser = await currentUserQuery;
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

    const userQuery = User.findOneAndUpdate(
        useWalletBalance
            ? { _id: payment.user, walletBalance: { $gte: amount } }
            : { _id: payment.user },
        update,
        { new: true }
    ).select('walletBalance activePackage packageExpiresAt');
    if (session) userQuery.session(session);
    const user = await userQuery;

    if (!user) {
        throw httpError(400, {
            message: 'Balans kifayət deyil',
            required: amount,
            current: Number(currentUser.walletBalance || 0)
        });
    }

    const txData = {
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
    };
    const [tx] = session
        ? await Transaction.create([txData], { session })
        : await Transaction.create([txData]);

    const notifData = {
        user: user._id,
        type: 'system',
        title: `${payment.priceSnapshot.packageCode} paket aktivləşdirildi`,
        body: `${payment.priceSnapshot.durationDays} günlük paketiniz aktivdir.`,
        link: '/cabinet.html#packages',
        relatedId: tx._id,
        relatedType: 'Transaction'
    };
    if (session) {
        await Notification.create([notifData], { session });
    } else {
        await Notification.create([notifData]);
    }

    return { user, tx, idempotent: false };
};

const completeTopUpPayment = async (input = {}) => {
    let payment = input?.payment || input;
    let session = input?.session || null;
    const transaction = input?.transaction !== undefined ? input.transaction : null;
    const eventId = input?.eventId || null;
    const signatureContext = input?.signatureContext || null;
    const providerStatus = input?.providerStatus || null;

    if (session && session._id && session.paymentId) {
        if (!payment || !payment.paymentId) {
            payment = session;
        }
        session = null;
    }

    if (signatureContext) {
        const paymentService = getProvider();
        if (!verifyPaymentSignature(paymentService, signatureContext.req, signatureContext.params)) {
            throw httpError(401, { message: 'Ödəniş imzası yanlışdır' });
        }
    }

    const providedMongoSession = (input?.mongoSession && typeof input.mongoSession.startTransaction === 'function')
        ? input.mongoSession
        : (session && typeof session.startTransaction === 'function')
            ? session
            : (transaction && typeof transaction.startTransaction === 'function')
                ? transaction
                : null;

    const supportsMongoTransactions = () => {
        const type = mongoose.connection?.client?.topology?.description?.type;
        return type === 'ReplicaSetWithPrimary' || type === 'Sharded';
    };

    let sessionToUse = providedMongoSession;
    let shouldCommit = false;

    if (!sessionToUse && supportsMongoTransactions()) {
        try {
            sessionToUse = await mongoose.startSession();
            sessionToUse.startTransaction();
            shouldCommit = true;
        } catch (sessErr) {
            if (sessionToUse) {
                try { sessionToUse.endSession(); } catch {}
            }
            sessionToUse = null;
            shouldCommit = false;
        }
    }

    const userId = payment.userId || payment.user?._id || payment.user;
    const amount = normalizeMoney(payment.expectedAmount !== undefined ? payment.expectedAmount : (payment.amount || 0));
    let tx = null;
    let wasAlreadyCredited = false;
    let user = null;
    const paymentId = payment.paymentId;

    try {
        // 0. Əgər sessiya və ya tranzaksiya artıq tamamlanıbsa və ya mövcuddursa, dərhal idempotent nəticə qaytar
        // Əlavə qoruma: Transaction collection-da idempotencyKey = paymentId yoxla
        let existingTxQuery = Transaction.findOne({
            $or: [
                { idempotencyKey: paymentId },
                { idempotencyKey: `topup:${paymentId}` },
                { paymentId: paymentId },
                { reference: paymentId }
            ]
        });
        if (sessionToUse) existingTxQuery = existingTxQuery.session(sessionToUse);
        const existingCompletedTx = await existingTxQuery;

        if (existingCompletedTx && (existingCompletedTx.status === 'completed' || existingCompletedTx.status === 'paid')) {
            const creditResult = await ensureTopUpCreditForRecovery(userId, payment, sessionToUse);
            user = creditResult.user;
            wasAlreadyCredited = !creditResult.applied;
            existingCompletedTx.status = 'completed';
            existingCompletedTx.walletCredited = true;
            existingCompletedTx.balanceAfter = user.walletBalance;
            await (sessionToUse ? existingCompletedTx.save({ session: sessionToUse }) : existingCompletedTx.save());
            const upd = PaymentSession.updateOne(
                { _id: payment._id },
                { $set: { status: 'completed', walletCredited: true, completedAt: new Date(), providerStatus: providerStatus || payment.providerStatus } }
            );
            if (sessionToUse) upd.session(sessionToUse);
            await upd;
            payment.status = 'completed';
            payment.walletCredited = true;

            if (shouldCommit && sessionToUse?.inTransaction?.()) {
                await sessionToUse.commitTransaction();
            }
            return { idempotent: wasAlreadyCredited, alreadyCompleted: true, user, tx: existingCompletedTx, payment };
        }

        if (existingCompletedTx?.walletCredited === true) {
            const creditResult = await ensureTopUpCreditForRecovery(userId, payment, sessionToUse);
            user = creditResult.user;
            existingCompletedTx.status = 'completed';
            existingCompletedTx.balanceAfter = user.walletBalance;
            await (sessionToUse ? existingCompletedTx.save({ session: sessionToUse }) : existingCompletedTx.save());
            const updPay = PaymentSession.updateOne(
                { _id: payment._id },
                { $set: { status: 'completed', walletCredited: true, completedAt: new Date(), providerStatus: providerStatus || payment.providerStatus } }
            );
            if (sessionToUse) updPay.session(sessionToUse);
            await updPay;
            if (shouldCommit && sessionToUse?.inTransaction?.()) await sessionToUse.commitTransaction();
            wasAlreadyCredited = !creditResult.applied;
            return { idempotent: true, alreadyCompleted: true, user, tx: existingCompletedTx, payment };
        }

        if (payment.status === 'completed' || payment.status === 'paid') {
            if (Number(payment.walletCreditVersion || 0) < 1) {
                throw httpError(409, { message: 'Legacy ödəniş sessiyası təhlükəsiz avtomatik bərpa edilə bilmir; manual yoxlama tələb olunur' });
            }
            const resetCompletedQuery = PaymentSession.updateOne(
                { _id: payment._id, status: { $in: ['completed', 'paid'] } },
                { $set: { status: 'pending', walletCredited: false, walletCreditingAt: null } }
            );
            if (sessionToUse) resetCompletedQuery.session(sessionToUse);
            await resetCompletedQuery;
            payment.status = 'pending';
            payment.walletCredited = false;
        }

        if (payment.walletCredited) {
            const resetQuery = PaymentSession.updateOne(
                { _id: payment._id, status: { $in: ['pending', 'processing'] } },
                { $set: { status: 'pending', walletCredited: false, walletCreditingAt: null } }
            );
            if (sessionToUse) resetQuery.session(sessionToUse);
            await resetQuery;
            payment.status = 'pending';
            payment.walletCredited = false;
        }

        if (payment.status === 'expired') {
            throw httpError(400, { message: 'Ödəniş sessiyasının vaxtı bitib' });
        }
        if (payment.status === 'failed') {
            if (input?.allowOverrideFailed) {
                console.warn(`Overriding failed session ${paymentId} with APPROVED callback`);
                payment.status = 'pending';
                payment.failureReason = '';
            } else {
                throw httpError(400, { message: 'Ödəniş sessiyası uğursuz olub' });
            }
        }
        if (payment.expiresAt && payment.expiresAt <= new Date()) {
            payment.status = 'expired';
            payment.failureReason = 'expired';
            await (sessionToUse ? payment.save({ session: sessionToUse }) : payment.save());
            throw httpError(400, { message: 'Ödəniş sessiyasının vaxtı bitib' });
        }

        // 1. PaymentSession claim atomik - processing
        const claimUpdate = {
            status: 'processing',
            updatedAt: new Date()
        };
        if (eventId) {
            claimUpdate.lastEventId = eventId;
        }

        const stuckThreshold = new Date(Date.now() - 10 * 60 * 1000);
        let claimedSession = null;
        try {
            const claimQuery = PaymentSession.findOneAndUpdate(
                {
                    _id: payment._id,
                    walletCredited: { $ne: true },
                    $or: [
                        { status: 'pending' },
                        ...(input?.allowOverrideFailed ? [{ status: 'failed' }] : []),
                        { status: 'processing', updatedAt: { $lt: stuckThreshold } }
                    ]
                },
                { $set: claimUpdate },
                { new: true, returnDocument: 'after' }
            );
            if (sessionToUse) claimQuery.session(sessionToUse);
            claimedSession = await claimQuery;
        } catch (claimErr) {
            if (claimErr.code === 112 || claimErr.errorLabels?.includes('TransientTransactionError') || claimErr.message?.includes('WriteConflict')) {
                claimedSession = null;
            } else {
                throw claimErr;
            }
        }

        if (!claimedSession) {
            // Another callback claimed it, wait for completed
            for (let i = 0; i < 20; i++) {
                await new Promise((r) => setTimeout(r, 250));
                const p = await PaymentSession.findById(payment._id);
                if (p?.status === 'completed') {
                    const claimedTx = await Transaction.findOne({
                        $or: [
                            { idempotencyKey: payment.paymentId },
                            { idempotencyKey: `topup:${payment.paymentId}` },
                            { paymentId: payment.paymentId },
                            { reference: payment.paymentId }
                        ]
                    });
                    const claimedUser = await User.findById(userId).select('walletBalance');
                    if (shouldCommit && sessionToUse?.inTransaction?.()) {
                        try { await sessionToUse.abortTransaction(); } catch {}
                    }
                    return { idempotent: true, alreadyCompleted: true, payment: p, user: claimedUser, tx: claimedTx };
                }
            }
            throw new Error('ALREADY_CLAIMED');
        }

        payment.status = 'processing';

        // 2. Transaction idempotency - ƏSAS FIX
        let txQuery = Transaction.findOne({
            $or: [
                { idempotencyKey: payment.paymentId },
                { idempotencyKey: `topup:${payment.paymentId}` },
                { paymentId: payment.paymentId },
                { reference: payment.paymentId }
            ]
        });
        if (sessionToUse) txQuery = txQuery.session(sessionToUse);
        tx = await txQuery;

        if (tx && (tx.status === 'completed' || tx.status === 'paid' || tx.walletCredited)) {
            const creditResult = await ensureTopUpCreditForRecovery(userId, payment, sessionToUse);
            user = creditResult.user;
            tx.status = 'completed';
            tx.walletCredited = true;
            tx.balanceAfter = user.walletBalance;
            await (sessionToUse ? tx.save({ session: sessionToUse }) : tx.save());
            const updPay = PaymentSession.findOneAndUpdate(
                { _id: payment._id },
                {
                    $set: {
                        status: 'completed',
                        walletCredited: true,
                        completedAt: new Date(),
                        providerStatus: providerStatus || payment.providerStatus
                    }
                },
                { new: true }
            );
            if (sessionToUse) updPay.session(sessionToUse);
            await updPay;

            if (shouldCommit && sessionToUse?.inTransaction?.()) {
                await sessionToUse.commitTransaction();
            }
            wasAlreadyCredited = !creditResult.applied;
            return { idempotent: true, alreadyCompleted: true, user, tx, payment };
        }

        const hadExistingTransaction = Boolean(tx);
        if (!tx) {
            const txData = {
                user: userId,
                userId: userId,
                amount,
                type: 'deposit',
                description: `Balans artırımı - ${amount} ${payment.currency || 'AZN'}`,
                reference: payment.paymentId,
                paymentProvider: payment.provider || 'internal',
                paymentId: payment.paymentId,
                idempotencyKey: payment.paymentId,
                balanceAfter: 0,
                status: 'pending',
                walletCredited: false
            };
            try {
                const createQuery = Transaction.create([txData], sessionToUse ? { session: sessionToUse } : undefined);
                tx = (await createQuery)[0];
            } catch (createErr) {
                if (createErr.code === 11000) {
                    let findQuery = Transaction.findOne({
                        $or: [
                            { idempotencyKey: payment.paymentId },
                            { idempotencyKey: `topup:${payment.paymentId}` },
                            { paymentId: payment.paymentId },
                            { reference: payment.paymentId }
                        ]
                    });
                    if (sessionToUse) findQuery.session(sessionToUse);
                    tx = await findQuery;
                } else {
                    throw createErr;
                }
            }
        }

        if (hadExistingTransaction && Number(payment.walletCreditVersion || 0) < 1) {
            let markerQuery = User.findOne({
                _id: userId,
                walletOperationKeys: walletTopUpOperationKey(payment.paymentId)
            }).select('_id');
            if (sessionToUse) markerQuery = markerQuery.session(sessionToUse);
            if (!(await markerQuery)) {
                throw httpError(409, { message: 'Legacy ödəniş sessiyası təhlükəsiz avtomatik bərpa edilə bilmir; manual yoxlama tələb olunur' });
            }
        }

        const creditResult = await applyTopUpCreditOnce(userId, payment.paymentId, amount, sessionToUse);
        user = creditResult.user;
        wasAlreadyCredited = !creditResult.applied;

        tx.walletCredited = true;
        tx.balanceAfter = user.walletBalance;
        tx.status = 'completed';
        await (sessionToUse ? tx.save({ session: sessionToUse }) : tx.save());

        const updPay = PaymentSession.findOneAndUpdate(
            { _id: payment._id },
            {
                $set: {
                    status: 'completed',
                    walletCredited: true,
                    completedAt: new Date(),
                    providerStatus: providerStatus || payment.providerStatus
                }
            },
            { new: true, returnDocument: 'after' }
        );
        if (sessionToUse) updPay.session(sessionToUse);
        const finalPayment = await updPay;
        payment.status = 'completed';
        payment.walletCredited = true;

        if (shouldCommit && sessionToUse?.inTransaction?.()) {
            await sessionToUse.commitTransaction();
        }

        const notifData = {
            user: userId,
            type: 'system',
            title: 'Balansınız artırıldı',
            body: `${amount} ${payment.currency || 'AZN'} hesabınıza əlavə edildi. Cari balans: ${user?.walletBalance || 0} ${payment.currency || 'AZN'}`,
            link: '/cabinet.html#wallet',
            relatedId: tx._id,
            relatedType: 'Transaction'
        };
        try {
            await Notification.create([notifData]);
        } catch {}

        try {
            const emailUser = user || await User.findById(userId);
            if (emailUser && emailUser.email) {
                sendTopUpSuccessEmail(emailUser, amount, payment.currency || 'AZN').catch(() => {});
            }
        } catch {}

        return {
            idempotent: wasAlreadyCredited ? true : false,
            completed: true,
            user,
            tx,
            payment: finalPayment || payment
        };

    } catch (e) {
        if (shouldCommit && sessionToUse?.inTransaction?.()) {
            try { await sessionToUse.abortTransaction(); } catch {}
        }
        if (!sessionToUse) {
            try {
                await PaymentSession.updateOne(
                    { _id: payment._id },
                    { $set: { status: 'pending', walletCredited: false, walletCreditingAt: null } }
                );
                payment.status = 'pending';
                payment.walletCredited = false;
            } catch (resetErr) {
                logger.error('Top-up finalization recovery state update failed', { paymentId, error: resetErr.message });
            }
        }
        throw e;
    } finally {
        if (shouldCommit && sessionToUse) {
            try { sessionToUse.endSession(); } catch {}
        }
    }
};

const getRequestSignature = (req, headerName) => {
    const signature = headerName !== undefined
        ? (headerName ? req?.get?.(headerName) || req?.headers?.[headerName.toLowerCase()] || '' : '')
        : req?.paymentSignature || req?.get?.('x-payment-signature') || req?.get?.('x-webhook-signature') || '';
    return typeof signature === 'string' ? signature.trim() : '';
};

const verifyPaymentSignature = (paymentService, req, params) => {
    const signature = getRequestSignature(req);
    if (!paymentService || paymentService.name === 'mock' || signature === 'mock-sandbox-signature' || process.env.PAYMENT_PROVIDER === 'mock') {
        return require('../services/mockProvider').verifySignature(req, params);
    }
    if (paymentService.name === 'payriff') {
        const { payriff } = paymentConfig.getConfig();
        const payriffSignature = getRequestSignature(req, payriff.signatureHeader);
        return paymentService.verifySignature(req?.rawBody, payriffSignature, payriff.webhookSecret);
    }
    return paymentService.verifySignature(req, params);
};

const verifyProviderSignature = (req, params) => {
    const signature = getRequestSignature(req);
    const paymentService = (process.env.PAYMENT_PROVIDER === 'mock' || signature === 'mock-sandbox-signature')
        ? require('../services/mockProvider')
        : getProvider();
    return verifyPaymentSignature(paymentService, req, params);
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
        validateAllowedFields(req.body, ['amount', 'currency', 'idempotencyKey', 'sessionId', 'paymentId'], 'body');

        const sessionId = req.body.sessionId || req.body.paymentId;
        let isDuplicate = false;
        let payment = null;

        if (sessionId) {
            const isObjectId = mongoose.Types.ObjectId.isValid(sessionId);
            payment = await PaymentSession.findOne({
                user: req.user._id,
                $or: [
                    ...(isObjectId ? [{ _id: sessionId }] : []),
                    { paymentId: sessionId }
                ]
            });
            if (payment) {
                isDuplicate = true;
                if (payment.providerOrderId && payment.providerCheckoutUrl) {
                    return res.status(200).json(paymentResponse(payment, {
                        checkoutUrl: payment.providerCheckoutUrl,
                        sessionId: payment._id,
                        message: 'Mövcud ödəniş sessiyası qaytarıldı',
                        idempotent: true
                    }));
                }
            }
        }

        const idempotencyKey = requireIdempotencyReference(req);
        if (!payment && idempotencyKey) {
            payment = await PaymentSession.findOne({
                user: req.user._id,
                idempotencyKey,
                kind: 'wallet_topup'
            });
        }

        const amount = normalizeMoney(readNumber(req.body.amount, {
            fieldName: 'amount',
            required: !payment,
            min: 1,
            max: 10000
        }) || payment?.expectedAmount);

        const currency = readString(req.body.currency || SUPPORTED_CURRENCY, {
            fieldName: 'currency',
            maxLength: 3,
            uppercase: true
        }) || SUPPORTED_CURRENCY;
        if (currency !== SUPPORTED_CURRENCY) {
            return res.status(400).json({ message: 'Valyuta dəstəklənmir' });
        }

        // Check if existing pending session with providerOrderId exists for user & amount
        if (!payment) {
            const existingPending = await PaymentSession.findOne({
                user: req.user._id,
                $or: [{ expectedAmount: amount }, { amount: amount }],
                status: 'pending',
                providerOrderId: { $exists: true, $ne: null }
            }).sort({ createdAt: -1 });

            if (existingPending && existingPending.expiresAt > new Date()) {
                payment = existingPending;
            }
        }

        if (payment) {
            isDuplicate = true;
            if (payment.providerOrderId && payment.providerCheckoutUrl) {
                return res.status(200).json(paymentResponse(payment, {
                    checkoutUrl: payment.providerCheckoutUrl,
                    sessionId: payment._id,
                    message: 'Mövcud ödəniş sessiyası qaytarıldı',
                    idempotent: true
                }));
            }
        } else {
            try {
                [payment] = await PaymentSession.create([{
                    paymentId: generatePaymentId(),
                    user: req.user._id,
                    kind: 'wallet_topup',
                    idempotencyKey,
                    provider: getProvider().name,
                    expectedAmount: amount,
                    currency,
                    status: 'pending',
                    walletCreditVersion: 1,
                    expiresAt: new Date(Date.now() + PAYMENT_SESSION_TTL_MS)
                }]);
            } catch (createErr) {
                if (createErr.code === 11000) {
                    payment = await PaymentSession.findOne({
                        user: req.user._id,
                        idempotencyKey,
                        kind: 'wallet_topup'
                    });
                    if (payment) {
                        isDuplicate = true;
                        if (payment.providerOrderId && payment.providerCheckoutUrl) {
                            return res.status(200).json(paymentResponse(payment, {
                                checkoutUrl: payment.providerCheckoutUrl,
                                sessionId: payment._id,
                                message: 'Mövcud ödəniş sessiyası qaytarıldı',
                                idempotent: true
                            }));
                        }
                    } else {
                        throw createErr;
                    }
                } else {
                    throw createErr;
                }
            }
        }

        const checkoutUrl = payment.providerCheckoutUrl || await createProviderCheckoutUrl(payment);
        res.status(isDuplicate ? 200 : 202).json(paymentResponse(payment, {
            checkoutUrl,
            sessionId: payment._id,
            message: isDuplicate
                ? 'Mövcud ödəniş sessiyası qaytarıldı'
                : 'Ödəniş sessiyası yaradıldı. Balans yalnız ödəniş təsdiqindən sonra artırılacaq.',
            idempotent: isDuplicate
        }));
    } catch (error) {
        if (error.code === 11000) {
            const existing = await PaymentSession.findOne({
                user: req.user._id,
                idempotencyKey: req.body?.idempotencyKey || req.get?.('Idempotency-Key'),
                kind: 'wallet_topup'
            });
            if (existing) {
                if (existing.providerOrderId && existing.providerCheckoutUrl) {
                    return res.status(200).json(paymentResponse(existing, {
                        checkoutUrl: existing.providerCheckoutUrl,
                        sessionId: existing._id,
                        message: 'Mövcud ödəniş sessiyası qaytarıldı',
                        idempotent: true
                    }));
                }
                const checkoutUrl = await createProviderCheckoutUrl(existing);
                return res.status(200).json(paymentResponse(existing, {
                    checkoutUrl,
                    sessionId: existing._id,
                    message: 'Mövcud ödəniş sessiyası qaytarıldı',
                    idempotent: true
                }));
            }
        }
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

        const isDuplicate = Boolean(payment._isExisting);

        const checkoutUrl = payment.providerCheckoutUrl || await createProviderCheckoutUrl(payment);
        res.status(isDuplicate ? 200 : 201).json(paymentResponse(payment, {
            checkoutUrl,
            sessionId: payment._id,
            message: isDuplicate ? 'Mövcud ödəniş sessiyası qaytarıldı' : 'Ödəniş sessiyası yaradıldı',
            idempotent: isDuplicate
        }));
    } catch (error) {
        if (error.code === 11000) {
            const existing = await PaymentSession.findOne({
                user: req.user._id,
                idempotencyKey: req.body?.idempotencyKey || req.get?.('Idempotency-Key'),
                kind: 'package_provider'
            });
            if (existing) {
                const checkoutUrl = existing.providerCheckoutUrl || await createProviderCheckoutUrl(existing);
                return res.status(200).json(paymentResponse(existing, {
                    checkoutUrl,
                    sessionId: existing._id,
                    message: 'Mövcud ödəniş sessiyası qaytarıldı',
                    idempotent: true
                }));
            }
            return res.status(409).json({ message: 'Bu idempotency açarı artıq istifadə olunub' });
        }
        if (error.payload) return res.status(error.status || 500).json(error.payload);
        next(error);
    }
};

// @desc    Get payment session status for reconciliation and confirmation
// @route   GET /api/wallet/payment-session/:sessionId
// @access  Private
const getPaymentSessionStatus = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user?._id || req.user?.id;
        const isObjectId = mongoose.Types.ObjectId.isValid(sessionId);
        const session = await PaymentSession.findOne({
            $or: [
                ...(isObjectId ? [{ _id: sessionId }] : []),
                { paymentId: sessionId }
            ],
            user: userId
        });
        if (!session) {
            return res.status(404).json({ error: 'Not found', message: 'Ödəniş sessiyası tapılmadı' });
        }
        const tx = await Transaction.findOne({
            $or: [{ paymentId: session.paymentId }, { reference: session.paymentId }]
        });
        res.json({
            status: session.status,
            amount: session.expectedAmount,
            txId: tx?._id || session.transactionId || session.lastEventId || session.paymentId,
            sessionId: session._id,
            paymentId: session.paymentId
        });
    } catch (error) {
        if (error.payload) return res.status(error.status || 500).json(error.payload);
        next(error);
    }
};

// @desc    Payment provider callback verifier
// @route   POST /api/wallet/payments/:paymentId/callback
// @access  Payment provider
const handlePaymentCallback = async (req, res, next) => {
    let session = null;
    try {
        validateAllowedFields(req.body, [
            'amount', 'currency', 'packageId', 'productId', 'status',
            'providerReference', 'eventId', 'sessionId', 'orderId', 'paymentId'
        ], 'body');
        const paymentId = readString(req.params.paymentId || req.body?.paymentId || req.body?.sessionId || req.body?.orderId, {
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
        const rawStatus = typeof req.body.status === 'string' ? req.body.status.trim() : '';
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
        let eventId = readString(req.body.eventId || providerReference || '', {
            fieldName: 'eventId',
            maxLength: 120
        });
        if (!eventId) {
            eventId = `${paymentId}_${status}`;
        }

        let isSignatureValid = false;
        try {
            const paymentService = getProvider();
            isSignatureValid = verifyPaymentSignature(paymentService, req, {
                paymentId, amount, currency, status, rawStatus, providerReference
            });
        } catch (sigErr) {
            return res.status(500).json({ message: sigErr.message || 'Payment webhook secret is not configured' });
        }

        if (!isSignatureValid) {
            return res.status(401).json({ message: 'Ödəniş imzası yanlışdır' });
        }

        const isSuccess = ['paid', 'completed', 'success', 'approved'].includes(status);
        const isFailure = ['failed', 'rejected', 'declined', 'canceled', 'cancelled'].includes(status);

        // Early check on Transaction collection (A: REPLAY qoruma)
        const earlyTx = await Transaction.findOne({
            $or: [
                { idempotencyKey: paymentId },
                { idempotencyKey: `topup:${paymentId}` },
                { paymentId: paymentId },
                { reference: paymentId }
            ],
            status: { $in: ['completed', 'paid'] }
        });

        if (earlyTx) {
            if (isFailure) {
                console.warn(`[PaymentCallback] Ignoring late failure callback for completed payment ${paymentId}`);
                return res.json({
                    ok: true,
                    ignoredLateFailure: true,
                    idempotent: true,
                    message: 'Late failure ignored: payment already completed',
                    transaction: earlyTx
                });
            }
            return res.json({
                ok: true,
                idempotent: true,
                alreadyProcessed: true,
                message: 'Callback artıq işlənib',
                transaction: earlyTx
            });
        }

        try {
            session = await mongoose.startSession();
        } catch (_) {
            session = null;
        }

        let result;
        const runCallbackLogic = async (currentSession) => {
            const query = PaymentSession.findOne({
                $or: [
                    { paymentId },
                    ...(mongoose.isValidObjectId(paymentId) ? [{ _id: paymentId }] : []),
                    { providerOrderId: paymentId }
                ]
            });
            if (currentSession) query.session(currentSession);
            const payment = await query;
            if (!payment) throw httpError(404, { message: 'Ödəniş sessiyası tapılmadı' });

            const existingTx = await getExistingTransactionForPayment(payment, currentSession);
            const creditOwnerId = payment.user?._id || payment.user;
            const walletCreditExists = Boolean(await User.exists({
                _id: creditOwnerId,
                walletOperationKeys: walletTopUpOperationKey(payment.paymentId)
            }));
            const txAlreadyCredited = Boolean(existingTx && (
                existingTx.status === 'completed' ||
                existingTx.status === 'paid' ||
                existingTx.walletCredited === true
            ));

            if (walletCreditExists) {
                result = {
                    idempotent: true,
                    alreadyProcessed: true,
                    payment,
                    tx: existingTx
                };
                return;
            }

            if (isFailure && (
                payment.status === 'completed' ||
                payment.status === 'paid' ||
                payment.walletCredited ||
                txAlreadyCredited
            )) {
                console.warn(`[PaymentCallback] Ignoring late failure callback for completed payment ${paymentId}`);
                result = {
                    idempotent: true,
                    ignoredLateFailure: true,
                    payment,
                    tx: existingTx
                };
                return;
            }

            const requestedProductId = req.body.packageId || req.body.productId;
            const callbackMatch = validatePaymentCallbackMatch(payment, {
                amount,
                currency,
                productId: requestedProductId
            });

            if (!callbackMatch.valid && callbackMatch.reason === 'package_mismatch') {
                payment.status = 'failed';
                payment.failureReason = 'package_mismatch';
                payment.lastCallbackAt = new Date();
                await (currentSession ? payment.save({ session: currentSession }) : payment.save());
                throw httpError(400, { message: 'Ödəniş paketi uyğun deyil' });
            }

            if (!callbackMatch.valid && callbackMatch.reason === 'amount_or_currency_mismatch') {
                payment.status = 'failed';
                payment.failureReason = 'amount_or_currency_mismatch';
                payment.lastCallbackAt = new Date();
                await (currentSession ? payment.save({ session: currentSession }) : payment.save());
                throw httpError(400, { message: 'Ödəniş məbləği və ya valyutası uyğun deyil' });
            }

            if (!callbackMatch.valid && callbackMatch.reason === 'expired') {
                payment.status = 'expired';
                payment.failureReason = 'expired';
                payment.lastCallbackAt = new Date();
                await (currentSession ? payment.save({ session: currentSession }) : payment.save());
                throw httpError(400, { message: 'Ödəniş sessiyasının vaxtı bitib' });
            }

            // Status yoxlaması imzadan sonradır və status artıq canonical HMAC imzasına daxildir
            if (!isSuccess) {
                if (payment.status === 'failed') {
                    result = {
                        idempotent: true,
                        alreadyFailed: true,
                        payment,
                        failed: true
                    };
                    return;
                }
                payment.status = 'failed';
                payment.failureReason = `provider_status:${status}`;
                payment.lastCallbackAt = new Date();
                if (eventId && !payment.callbackEventIds?.includes(eventId)) {
                    if (!payment.callbackEventIds) payment.callbackEventIds = [];
                    payment.callbackEventIds.push(eventId);
                }
                await (currentSession ? payment.save({ session: currentSession }) : payment.save());
                result = { payment, failed: true };
                return;
            }

            // Out-of-order handling: if existing session is failed and incoming is APPROVED/SUCCESS
            if (payment.status === 'failed') {
                console.warn(`Overriding failed session ${paymentId} with APPROVED callback`);
            }

            if (eventId && !payment.callbackEventIds?.includes(eventId)) {
                if (!payment.callbackEventIds) payment.callbackEventIds = [];
                payment.callbackEventIds.push(eventId);
            }

            payment.providerReference = providerReference || payment.providerReference;
            payment.lastCallbackAt = new Date();

            if (payment.kind === 'wallet_topup' || payment.kind === 'topup') {
                result = await completeTopUpPayment({
                    payment,
                    session: currentSession,
                    eventId,
                    allowOverrideFailed: true,
                    signatureContext: {
                        req,
                        params: { paymentId, amount, currency, status, rawStatus, providerReference }
                    }
                });
            } else if (payment.kind === 'package_provider') {
                result = await completePackagePayment({
                    payment,
                    useWalletBalance: false,
                    session: currentSession,
                    allowOverrideFailed: true
                });
            } else if (payment.kind === 'package_wallet') {
                result = await completePackagePayment({
                    payment,
                    useWalletBalance: true,
                    session: currentSession,
                    allowOverrideFailed: true
                });
            } else {
                throw httpError(400, { message: 'Ödəniş növü dəstəklənmir' });
            }
        };

        if (session) {
            try {
                await session.withTransaction(() => runCallbackLogic(session));
            } catch (txError) {
                const isTxUnsupported = Boolean(
                    txError &&
                    (txError.message?.includes('replica set member') ||
                     txError.message?.includes('Transaction numbers are only allowed') ||
                     txError.code === 20 ||
                     txError.codeName === 'IllegalOperation')
                );
                if (isTxUnsupported) {
                    await runCallbackLogic(null);
                } else {
                    throw txError;
                }
            }
        } else {
            await runCallbackLogic(null);
        }

        if (result?.ignoredLateFailure) {
            return res.json({
                ok: true,
                ignoredLateFailure: true,
                idempotent: true,
                message: 'Late failure ignored: payment already completed',
                payment: paymentResponse(result.payment),
                transaction: result.tx || null
            });
        }

        if (result?.alreadyFailed) {
            return res.json({
                ok: true,
                idempotent: true,
                alreadyFailed: true,
                message: 'Ödəniş artıq uğursuz kimi qeydə alınıb',
                payment: paymentResponse(result.payment),
                failed: true
            });
        }

        if (result?.failed) {
            return res.json({
                ok: true,
                message: 'Ödəniş uğursuz kimi qeydə alındı',
                payment: paymentResponse(result.payment),
                failed: true
            });
        }

        res.json({
            ok: true,
            message: result?.idempotent ? 'Callback artıq işlənib' : 'Ödəniş təsdiqləndi',
            idempotent: Boolean(result?.idempotent),
            alreadyProcessed: Boolean(result?.idempotent),
            transaction: result?.tx || null,
            payment: result?.payment ? paymentResponse(result.payment) : undefined
        });
    } catch (error) {
        if (error.payload) return res.status(error.status || 500).json(error.payload);
        next(error);
    } finally {
        if (session) {
            await session.endSession();
        }
    }
};

const escapeHtmlText = (str) => String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// @desc    Mock checkout sandbox page for card/transfer payment testing
// @route   GET /api/wallet/payments/:paymentId/mock-checkout
// @access  Public
const mockCheckoutPage = async (req, res, next) => {
    try {
        const isProduction = process.env.NODE_ENV === 'production';
        const provider = String(process.env.PAYMENT_PROVIDER || 'mock').trim().toLowerCase();

        if (isProduction) {
            return res.status(403).send('Mock checkout disabled in production');
        }

        if (provider !== 'mock') {
            return res.status(503).json({ error: 'Ödəniş sistemi konfiqurasiya edilməyib' });
        }

        const paymentId = readString(req.params.paymentId, {
            fieldName: 'paymentId',
            required: true,
            maxLength: 80
        });
        const payment = await PaymentSession.findOne({ paymentId });

        const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5500').replace(/\/+$/, '');
        const cabinetUrl = `${frontendUrl}/Front%20end/cabinet.html#billing`;
        const successUrl = `${frontendUrl}/Front%20end/payment-success.html?sessionId=${encodeURIComponent(paymentId)}`;
        const failedUrl = `${frontendUrl}/Front%20end/payment-failed.html?sessionId=${encodeURIComponent(paymentId)}&reason=cancelled`;

        if (!payment) {
            return res.status(404).send(`<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <title>Ödəniş Tapılmadı - Mobilim.az</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
        .card { background: #1e293b; border-radius: 16px; padding: 32px; max-width: 440px; width: 100%; text-align: center; border: 1px solid #334155; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5); }
        h1 { color: #ef4444; font-size: 20px; margin-bottom: 12px; }
        p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px; word-break: break-all; }
        a { display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Ödəniş Sessiyası Tapılmadı</h1>
        <p>Axtarılan <code>${escapeHtmlText(paymentId)}</code> identifikasiyalı ödəniş sessiyası tapılmadı.</p>
        <a href="${cabinetUrl}">Kabinetə Qayıt</a>
    </div>
</body>
</html>`);
        }

        const isExpired = payment.expiresAt && payment.expiresAt <= new Date() && payment.status !== 'completed';
        const isCompleted = payment.status === 'completed';
        const packageName = payment.priceSnapshot?.packageName || 'Reklam Paketi';
        const amount = payment.expectedAmount;
        const currency = payment.currency || 'AZN';

        return res.send(`<!DOCTYPE html>
<html lang="az">
<head>
    <meta charset="UTF-8">
    <title>Mobilim.az Sandbox Checkout</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #0b0f19 0%, #111827 100%);
            color: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
        }
        .checkout-card {
            background: rgba(30, 41, 59, 0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            width: 100%;
            max-width: 480px;
            padding: 36px 30px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            position: relative;
            overflow: hidden;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            background: rgba(234, 179, 8, 0.15);
            color: #facc15;
            border: 1px solid rgba(234, 179, 8, 0.3);
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 16px;
        }
        .title { font-size: 24px; font-weight: 700; color: #ffffff; margin-bottom: 6px; }
        .subtitle { font-size: 14px; color: #94a3b8; margin-bottom: 24px; }
        .info-box {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 18px;
            margin-bottom: 24px;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            font-size: 14px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #94a3b8; }
        .info-val { font-weight: 600; color: #f1f5f9; }
        .amount-row { padding-top: 12px; font-size: 16px; }
        .amount-val { font-size: 22px; font-weight: 700; color: #10b981; }
        .actions { display: flex; flex-direction: column; gap: 12px; }
        .btn {
            display: block;
            width: 100%;
            padding: 14px;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            text-align: center;
            cursor: pointer;
            border: none;
            transition: all 0.2s ease;
            text-decoration: none;
        }
        .btn-pay {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
        }
        .btn-pay:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .btn-cancel {
            background: transparent;
            color: #94a3b8;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .btn-cancel:hover { background: rgba(255, 255, 255, 0.05); color: #f1f5f9; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        #statusMsg {
            margin-top: 16px;
            font-size: 14px;
            text-align: center;
            min-height: 20px;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="checkout-card">
        <span class="badge">SANDBOX TEST REJİMİ</span>
        <h1 class="title">Ödəniş Şlüzü (Mock)</h1>
        <p class="subtitle">Bu səhifə inkişaf və test mühiti üçün mock kart/köçürmə şlüzüdür.</p>

        <div class="info-box">
            <div class="info-row">
                <span class="info-label">Paket</span>
                <span class="info-val">${escapeHtmlText(packageName)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Sessiya ID</span>
                <span class="info-val" style="font-family:monospace;font-size:12px;">${escapeHtmlText(payment.paymentId)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Status</span>
                <span class="info-val" id="paymentStatus">${escapeHtmlText(payment.status)}</span>
            </div>
            <div class="info-row amount-row">
                <span class="info-label">Ödəniləcək Məbləğ</span>
                <span class="info-val amount-val">${escapeHtmlText(amount)} ${escapeHtmlText(currency)}</span>
            </div>
        </div>

        ${isCompleted ? `
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 10px; padding: 14px; text-align: center; margin-bottom: 20px; color: #10b981; font-weight: 600;">
                ✓ Bu ödəniş artıq uğurla tamamlanıb.
            </div>
            <a href="${successUrl}" class="btn btn-pay">Uğurlu Səhifəyə Keç</a>
            <a href="${cabinetUrl}" class="btn btn-cancel" style="margin-top: 8px;">Kabinetə Qayıt</a>
        ` : isExpired ? `
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 10px; padding: 14px; text-align: center; margin-bottom: 20px; color: #ef4444; font-weight: 600;">
                ✗ Bu ödəniş sessiyasının vaxtı bitib.
            </div>
            <a href="${failedUrl}" class="btn btn-cancel">Kabinetə Qayıt</a>
        ` : `
            <div class="actions">
                <button id="payBtn" class="btn btn-pay">Test Ödənişini Təsdiqlə (${escapeHtmlText(amount)} ${escapeHtmlText(currency)})</button>
                <a href="${failedUrl}" class="btn btn-cancel">Ləğv Et və Qayıt</a>
            </div>
            <div id="statusMsg"></div>
        `}
    </div>

    <script>
        const payBtn = document.getElementById('payBtn');
        const statusMsg = document.getElementById('statusMsg');

        if (payBtn) {
            payBtn.addEventListener('click', async () => {
                payBtn.disabled = true;
                payBtn.textContent = 'Ödəniş emal olunur...';
                statusMsg.style.color = '#94a3b8';
                statusMsg.textContent = 'Provayder callback-i çağırılır...';

                try {
                    const payload = {
                        amount: ${Number(amount)},
                        currency: ${JSON.stringify(currency)},
                        status: 'paid',
                        providerReference: 'MOCK_SANDBOX_' + Date.now(),
                        packageId: ${JSON.stringify(payment.priceSnapshot?.productId || '')}
                    };

                    const res = await fetch('/api/wallet/payments/${encodeURIComponent(payment.paymentId)}/callback', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-payment-signature': 'mock-sandbox-signature'
                        },
                        body: JSON.stringify(payload)
                    });

                    const data = await res.json();
                    if (!res.ok) {
                        throw new Error(data.message || 'Ödəniş təsdiqlənə bilmədi');
                    }

                    statusMsg.style.color = '#10b981';
                    statusMsg.textContent = 'Ödəniş uğurla tamamlandı! Yönləndirilirsiniz...';
                    setTimeout(() => {
                        window.location.href = '${successUrl}';
                    }, 1200);
                } catch (err) {
                    payBtn.disabled = false;
                    payBtn.textContent = 'Yenidən Cəhd Et';
                    statusMsg.style.color = '#ef4444';
                    statusMsg.textContent = err.message || 'Xəta baş verdi';
                }
            });
        }
    </script>
</body>
</html>`);
    } catch (err) {
        next(err);
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
        if (req.query.startDate || req.query.endDate) {
            filter.createdAt = {};
            if (req.query.startDate) {
                const start = new Date(req.query.startDate);
                if (!isNaN(start.getTime())) filter.createdAt.$gte = start;
            }
            if (req.query.endDate) {
                const end = new Date(req.query.endDate);
                if (!isNaN(end.getTime())) {
                    end.setHours(23, 59, 59, 999);
                    filter.createdAt.$lte = end;
                }
            }
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

// @desc    Idempotent refund of reserved cash-out funds
// @returns {Object} result of refund operation
const refundReserve = async (cashOutInput, options = {}) => {
    const cashOutId = (cashOutInput?._id || (typeof cashOutInput === 'string' || cashOutInput instanceof mongoose.Types.ObjectId ? cashOutInput : null))?.toString();
    const cashOut = (cashOutInput && typeof cashOutInput === 'object' && cashOutInput._id)
        ? cashOutInput
        : (cashOutId ? await CashOutRequest.findById(cashOutId) : null);

    const userId = cashOut?.user || options.userId || options.user;
    const amount = Number(cashOut?.amount || options.amount);
    const refundKey = options.idempotencyKey || (cashOutId ? cashOutRefundOperationKey(cashOutId) : null);

    if (!userId || !amount || amount <= 0 || !refundKey) {
        return { success: false, reason: 'Invalid parameters' };
    }

    let existingTx = await Transaction.findOne({ idempotencyKey: refundKey });
    const operationQuery = User.findOne({ _id: userId, walletOperationKeys: refundKey }).select('walletBalance walletReservedBalance');
    const operationUser = await operationQuery;
    let alreadyRefunded = Boolean(existingTx || operationUser);

    if (cashOut && !alreadyRefunded) {
        const expectedReservedAmount = Number(cashOut.reservedAmount || cashOut.amount);
        const reservationKey = cashOutReserveOperationKey(cashOutId);
        const reservationUser = await User.findOne({ _id: userId, walletOperationKeys: reservationKey }).select('_id');
        const requestShowsReservation = cashOut.walletReserved === true && expectedReservedAmount === amount;
        if (!requestShowsReservation && !reservationUser) {
            return { success: false, alreadyRefunded: false, notReserved: true, reason: 'Cash-out request has no per-request reserve' };
        }
    }

    let updatedUser = operationUser;
    if (!alreadyRefunded) {
        const updateQuery = User.findOneAndUpdate(
            {
                _id: userId,
                walletReservedBalance: { $gte: amount },
                walletOperationKeys: { $ne: refundKey }
            },
            {
                $inc: { walletReservedBalance: -amount, walletBalance: amount },
                $addToSet: { walletOperationKeys: refundKey },
                $set: { updatedAt: new Date() }
            },
            { new: true, returnDocument: 'after' }
        );
        updatedUser = await updateQuery;
        if (!updatedUser) {
            updatedUser = await User.findOne({ _id: userId, walletOperationKeys: refundKey }).select('walletBalance walletReservedBalance');
            alreadyRefunded = Boolean(updatedUser);
            if (!updatedUser) {
                return { success: false, alreadyRefunded: false, insufficient: true, reason: 'Insufficient reserved balance or user not found' };
            }
        }
    }

    let tx = null;
    if (existingTx) {
        tx = existingTx;
        const markQuery = User.findOneAndUpdate(
            { _id: userId },
            { $addToSet: { walletOperationKeys: refundKey } },
            { new: true, returnDocument: 'after' }
        ).select('walletBalance walletReservedBalance');
        updatedUser = await markQuery;
        if (!updatedUser) return { success: false, alreadyRefunded: false, reason: 'User not found' };
    } else {
        try {
            const [createdTx] = await Transaction.create([{
                user: userId,
                userId: userId,
                amount: amount,
                type: 'cashout_refund',
                description: options.description || `Çıxarış ləğvi refund - ${amount} AZN`,
                reference: `refund:${cashOutId || refundKey}`,
                idempotencyKey: refundKey,
                status: 'completed',
                balanceAfter: updatedUser.walletBalance,
                walletCredited: true
            }]);
            tx = createdTx;
        } catch (txErr) {
            if (txErr.code === 11000) {
                tx = await Transaction.findOne({ idempotencyKey: refundKey });
                alreadyRefunded = true;
            } else {
                throw txErr;
            }
        }
    }

    if (cashOut) {
        const targetStatus = options.targetStatus || 'failed';
        cashOut.status = targetStatus;
        cashOut.walletReserved = false;
        cashOut.reservedAmount = 0;
        if (options.reason) {
            cashOut.failureReason = options.reason;
            cashOut.rejectionReason = options.reason;
        }
        if (cashOut.reservedTransaction) {
            await Transaction.updateOne(
                { _id: cashOut.reservedTransaction },
                { status: 'failed' }
            ).catch(() => {});
        }
        await cashOut.save();
    }

    return { success: true, alreadyRefunded, idempotent: alreadyRefunded, balance: updatedUser.walletBalance, transaction: tx };
};

// @desc    Request cash out from wallet balance (Variant A - Atomic reserve + request)
// @route   POST /api/wallet/cash-out
// @access  Private
const requestCashOut = async (req, res, next) => {
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
        const cleanedDetails = accountHolderDetails.replace(/[\s-]/g, '');
        if (/\b(cvv|cvc|pin)\b/i.test(accountHolderDetails) || /^\d{13,19}$/.test(cleanedDetails) || /\b\d{13,19}\b/.test(cleanedDetails)) {
            return res.status(400).json({ message: 'Tam kart nömrəsi, CVV/CVC və ya PIN qəbul edilmir. Tokenləşdirilmiş payout məlumatı istifadə olunmalıdır.' });
        }

        // 1. Status check: əgər artıq eyni idempotencyKey varsa
        const existing = await CashOutRequest.findOne({ user: req.user._id, idempotencyKey });
        if (existing) {
            if (existing.status === 'reserving' || existing.status === 'pending') {
                const age = Date.now() - new Date(existing.createdAt).getTime();
                if (age < 5 * 60 * 1000) { // 5 dəq içindədirsə
                    return res.status(200).json({
                        message: 'Sorğunuz icradadır',
                        request: existing,
                        cashOut: existing,
                        idempotent: true
                    });
                } else {
                    // 5 dəq-dən çox pending/reserving qalıb = stuck, atomik claim et
                    const stuckRequest = await CashOutRequest.findOneAndUpdate(
                        { _id: existing._id, status: { $in: ['reserving', 'pending'] } },
                        { $set: { status: 'failed', failureReason: 'timeout - stuck pending', failedAt: new Date() } },
                        { new: true }
                    );
                    if (!stuckRequest) {
                        // başqa worker artıq claim edib, refund artıq olunub
                        const current = await CashOutRequest.findById(existing._id);
                        return res.status(200).json({
                            message: 'Sorğu artıq yenilənib',
                            request: current,
                            cashOut: current,
                            idempotent: true
                        });
                    }

                    // Idempotent refund
                    await refundReserve(stuckRequest, { reason: 'timeout - stuck pending' });

                    return res.status(200).json({
                        message: 'Sorğu vaxtı bitdiyi üçün ləğv edildi və məbləğ balansınıza qaytarıldı',
                        request: stuckRequest,
                        cashOut: stuckRequest,
                        refunded: true
                    });
                }
            } else if (existing.status === 'completed' || existing.status === 'approved' || existing.status === 'paid') {
                return res.status(200).json({
                    idempotent: true,
                    request: existing,
                    cashOut: existing
                });
            } else if (existing.status === 'failed' || existing.status === 'rejected' || existing.status === 'cancelled') {
                // Əvvəlki fail olunmuş sorğunun rezervi qalıbsa refund et, sonra təmizlə
                await refundReserve(existing).catch(() => {});
                await CashOutRequest.deleteOne({ _id: existing._id });
            }
        }

        // Step 1: Əvvəl CashOutRequest yarad (status: 'reserving', idempotencyKey unique)
        let cashOutDoc = null;
        try {
            const [cashOut] = await CashOutRequest.create([{
                user: req.user._id,
                amount,
                destination,
                accountHolderDetails,
                idempotencyKey,
                status: 'reserving',
                walletReserved: false
            }]);
            cashOutDoc = cashOut;
        } catch (createErr) {
            if (createErr.code === 11000) {
                const existingAfterRace = await CashOutRequest.findOne({ user: req.user._id, idempotencyKey });
                if (existingAfterRace) {
                    return res.status(200).json({
                        message: 'Çıxarış sorğusu artıq mövcuddur',
                        cashOut: existingAfterRace,
                        request: existingAfterRace,
                        idempotent: true
                    });
                }
            }
            throw createErr;
        }

        // Step 2: Sonra User.findOneAndUpdate ilə atomar balans reserve et ($gte şərti ilə)
        let userDeducted = false;
        let txDoc = null;
        let result = null;
        try {
            const reserveKey = cashOutReserveOperationKey(cashOutDoc._id.toString());
            let user = await User.findOneAndUpdate(
                {
                    _id: req.user._id,
                    walletBalance: { $gte: amount },
                    walletOperationKeys: { $ne: reserveKey }
                },
                {
                    $inc: { walletBalance: -amount, walletReservedBalance: amount },
                    $addToSet: { walletOperationKeys: reserveKey },
                    $set: { updatedAt: new Date() }
                },
                { new: true, returnDocument: 'after' }
            );
            if (!user) {
                const priorReserve = await User.findOne({ _id: req.user._id, walletOperationKeys: reserveKey }).select('_id');
                if (priorReserve) {
                    userDeducted = true;
                    user = await User.findById(req.user._id).select('walletBalance');
                    if (!user) throw httpError(404, { message: 'Wallet or user not found' });
                } else {
                    await CashOutRequest.updateOne(
                        { _id: cashOutDoc._id },
                        { status: 'failed', failureReason: 'Kifayət qədər balans yoxdur', walletReserved: false }
                    ).catch(() => {});
                    const currentUser = await User.findById(req.user._id);
                    throw httpError(400, {
                        message: 'Kifayət qədər balans yoxdur',
                        required: amount,
                        current: currentUser?.walletBalance || 0
                    });
                }
            } else {
                userDeducted = true;
            }

            const reservedAt = new Date();
            const reserveRecord = await CashOutRequest.updateOne(
                { _id: cashOutDoc._id, status: 'reserving' },
                { $set: { walletReserved: true, reservedAmount: amount, reservedAt } }
            );
            if (!reserveRecord || reserveRecord.matchedCount === 0) {
                throw new Error('Cash-out request reservation state could not be persisted');
            }
            cashOutDoc.walletReserved = true;
            cashOutDoc.reservedAmount = amount;
            cashOutDoc.reservedAt = reservedAt;

            // Step 3: Transaction withdrawal record yarat
            const [tx] = await Transaction.create([{
                user: user._id,
                userId: user._id,
                amount: -amount,
                type: 'withdrawal',
                description: `Çıxarış sorğusu - ${destination}`,
                reference: cashOutDoc._id.toString(),
                idempotencyKey: `cashout:${cashOutDoc._id.toString()}`,
                status: 'pending',
                balanceAfter: user.walletBalance
            }]);
            txDoc = tx;

            // Step 4: CashOutRequest status=pending, walletReserved=true
            cashOutDoc.status = 'pending';
            cashOutDoc.walletReserved = true;
            cashOutDoc.reservedAmount = amount;
            cashOutDoc.reservedAt = reservedAt;
            cashOutDoc.reservedTransaction = tx._id;
            await cashOutDoc.save();

            result = cashOutDoc;
        } catch (stepErr) {
            let rollbackComplete = !userDeducted;
            if (userDeducted) {
                try {
                    const refundResult = await refundReserve(cashOutDoc, {
                        reason: stepErr.message,
                        targetStatus: 'failed'
                    });
                    rollbackComplete = Boolean(refundResult.success || refundResult.alreadyRefunded);
                    if (!rollbackComplete) {
                        logger.error('CRITICAL cash-out reserve rollback did not complete', { cashOutId: cashOutDoc?._id, reason: refundResult.reason });
                    }
                } catch (e) {
                    logger.error('CRITICAL cash-out reserve rollback failed', { cashOutId: cashOutDoc?._id, error: e.message });
                }
            }
            if (cashOutDoc && !userDeducted) {
                try {
                    await CashOutRequest.updateOne(
                        { _id: cashOutDoc._id },
                        { status: 'failed', failureReason: stepErr.message, walletReserved: false }
                    );
                } catch (e) {
                    console.error('CRITICAL request failed status error', e);
                }
            }
            if (txDoc) {
                await Transaction.updateOne({ _id: txDoc._id }, { status: rollbackComplete ? 'failed' : 'pending' }).catch(() => {});
            }
            throw stepErr;
        }

        if (result) {
            try {
                sendCashOutRequestEmail(process.env.ADMIN_NOTIFICATION_EMAIL, result).catch((err) => {
                    console.error('Failed to send cash-out request email to admin:', err.message);
                });
            } catch (emailErr) {
                console.error('Email hook error (cashOut request):', emailErr.message);
            }
        }

        res.status(201).json({
            message: 'Çıxarış sorğusu göndərildi',
            cashOut: result
        });
    } catch (error) {
        if (error.code === 11000) {
            const existing = await CashOutRequest.findOne({ user: req.user._id, idempotencyKey: req.body?.idempotencyKey || req.get('Idempotency-Key') });
            if (existing) {
                return res.status(200).json({
                    message: 'Çıxarış sorğusu artıq mövcuddur',
                    cashOut: existing,
                    request: existing,
                    idempotent: true
                });
            }
        }
        if (error.payload) return res.status(error.status || 500).json(error.payload);
        next(error);
    }
};

// @desc    Review cash out request (Admin)
// @route   PATCH /api/wallet/cash-out/:id/review
// @access  Private/Admin
const adminReviewCashOut = async (req, res, next) => {
    let session = null;
    try {
        session = await mongoose.startSession();
    } catch (_) {
        session = null;
    }
    try {
        validateAllowedFields(req.body, ['status', 'rejectionReason'], 'body');
        const status = readEnum(req.body.status, ['under_review', 'approved', 'processing', 'paid', 'rejected', 'cancelled'], { fieldName: 'status', required: true });
        const rejectionReason = readString(req.body.rejectionReason || '', { fieldName: 'rejectionReason', maxLength: 1000 });

        let result;
        const runReviewLogic = async (currentSession) => {
            const query = CashOutRequest.findById(req.params.id);
            if (currentSession) query.session(currentSession);
            const cashOut = await query;
            if (!cashOut) throw httpError(404, { message: 'Sorğu tapılmadı' });
            if (cashOut.status === 'paid' || cashOut.status === 'rejected' || cashOut.status === 'cancelled') {
                throw httpError(400, { message: 'Bu sorğu artıq yekunlaşıb' });
            }

            if (cashOut.status === 'processing' && (status === 'rejected' || status === 'cancelled')) {
                throw httpError(400, { message: 'İcrada olan çıxarış sorğusu rədd və ya ləğv edilə bilməz. Cannot reject processing payout, contact admin' });
            }

            if (cashOut.status === status) {
                result = cashOut;
                return;
            }

            const txQuery = Transaction.findOne({ reference: cashOut._id.toString() });
            if (currentSession) txQuery.session(currentSession);
            const tx = await txQuery;

            if (status === 'rejected' || status === 'cancelled') {
                const refundRes = await refundReserve(cashOut, {
                    targetStatus: status,
                    reason: rejectionReason
                });
                if (!refundRes.success && !refundRes.alreadyRefunded) {
                    throw httpError(400, { message: 'Balance update failed, user not found or insufficient' });
                }

                const notifData = {
                    user: cashOut.user,
                    type: 'system',
                    title: status === 'cancelled' ? 'Çıxarış ləğv edildi' : 'Çıxarış rədd edildi',
                    body: status === 'cancelled'
                        ? `Sizin ${cashOut.amount} AZN çıxarışınız ləğv edildi və məbləğ balansınıza qaytarıldı.`
                        : `Sizin ${cashOut.amount} AZN çıxarışınız rədd edildi. Səbəb: ${rejectionReason}`,
                    link: '/cabinet.html#wallet'
                };
                if (currentSession) {
                    await Notification.create([notifData], { session: currentSession });
                } else {
                    await Notification.create([notifData]);
                }

            } else if (status === 'paid') {
                const userUpdate = {
                    $inc: { walletReservedBalance: -cashOut.amount }
                };
                const userQuery = User.updateOne(
                    { _id: cashOut.user, walletReservedBalance: { $gte: cashOut.amount } },
                    userUpdate
                );
                if (currentSession) userQuery.session(currentSession);
                const userResult = await userQuery;

                if (!userResult || userResult.modifiedCount === 0) {
                    throw httpError(400, { message: 'Balance update failed, user not found or insufficient' });
                }

                if (tx) {
                    tx.status = 'completed';
                    await (currentSession ? tx.save({ session: currentSession }) : tx.save());
                }

                const notifData = {
                    user: cashOut.user,
                    type: 'system',
                    title: 'Çıxarış uğurla tamamlandı',
                    body: `Sizin ${cashOut.amount} AZN çıxarışınız göndərildi.`,
                    link: '/cabinet.html#wallet'
                };
                if (currentSession) {
                    await Notification.create([notifData], { session: currentSession });
                } else {
                    await Notification.create([notifData]);
                }
            }

            const prevState = cashOut.status;
            cashOut.status = status;
            cashOut.adminId = req.user._id;
            cashOut.reviewedAt = new Date();
            if (status === 'rejected') cashOut.rejectionReason = rejectionReason;
            if (status === 'processing') cashOut.processedAt = new Date();
            if (status === 'paid') cashOut.paidAt = new Date();
            await (currentSession ? cashOut.save({ session: currentSession }) : cashOut.save());

            const auditData = {
                actor: req.user._id,
                targetModel: 'CashOutRequest',
                target: cashOut._id,
                action: 'cashout.reviewed',
                previousState: { status: prevState },
                newState: { status: cashOut.status, rejectionReason },
                requestId: req.id || ''
            };
            if (currentSession) {
                await AuditLog.create([auditData], { session: currentSession });
            } else {
                await AuditLog.create([auditData]);
            }

            result = cashOut;
        };

        if (session) {
            try {
                await session.withTransaction(() => runReviewLogic(session));
            } catch (txError) {
                const isTxUnsupported = Boolean(
                    txError &&
                    (txError.message?.includes('replica set member') ||
                     txError.message?.includes('Transaction numbers are only allowed') ||
                     txError.code === 20 ||
                     txError.codeName === 'IllegalOperation')
                );
                if (isTxUnsupported) {
                    await runReviewLogic(null);
                } else {
                    throw txError;
                }
            }
        } else {
            await runReviewLogic(null);
        }

        if (result && (status === 'paid' || status === 'approved')) {
            try {
                User.findById(result.user).then((cashOutUser) => {
                    if (cashOutUser && cashOutUser.email) {
                        sendCashOutApprovedEmail(cashOutUser, result.amount, 'AZN').catch((err) => {
                            console.error('Failed to send cash-out approved email:', err.message);
                        });
                    }
                }).catch((err) => {
                    console.error('Failed to fetch user for cash-out approved email:', err.message);
                });
            } catch (emailErr) {
                console.error('Email hook error (cashOut approved):', emailErr.message);
            }
        }

        res.json({ message: 'Sorğu yeniləndi', cashOut: result });
    } catch (error) {
        if (error.payload) return res.status(error.status || 500).json(error.payload);
        next(error);
    } finally {
        if (session) {
            await session.endSession();
        }
    }
};

// @desc    Reconcile stuck cash-out reserves (reserving >5min, pending >30min, orphan reserves)
// @returns {Object} summary of reconciled requests
const reconcileStuckReserves = async () => {
    let reconciledCount = 0;
    let totalRefunded = 0;

    // 1. Stuck 'reserving' requests > 5 minutes
    const reservingCutoff = new Date(Date.now() - 5 * 60 * 1000);
    const stuckReserving = await CashOutRequest.find({
        status: 'reserving',
        createdAt: { $lt: reservingCutoff }
    });

    for (const item of stuckReserving) {
        try {
            const cashOutId = item._id.toString();
            const reserveKey = cashOutReserveOperationKey(cashOutId);
            const refundKey = cashOutRefundOperationKey(cashOutId);
            const [reserveOperation, refundOperation] = await Promise.all([
                User.findOne({ _id: item.user, walletOperationKeys: reserveKey }).select('_id'),
                User.findOne({ _id: item.user, walletOperationKeys: refundKey }).select('_id')
            ]);

            if (refundOperation) {
                item.status = 'failed';
                item.walletReserved = false;
                item.reservedAmount = 0;
                item.failureReason = item.failureReason || 'Cash-out reserve was already refunded';
                await item.save();
                reconciledCount++;
            } else if (item.walletReserved === true || reserveOperation) {
                item.status = 'pending';
                item.walletReserved = true;
                item.reservedAmount = Number(item.reservedAmount || item.amount);
                item.reservedAt = item.reservedAt || item.createdAt || new Date();
                await item.save();
                reconciledCount++;
            } else {
                item.status = 'failed';
                item.walletReserved = false;
                item.reservedAmount = 0;
                item.failureReason = 'Timeout during reservation phase; reserve did not complete';
                await item.save();
                reconciledCount++;
            }
        } catch (resErr) {
            console.error(`Error reconciling stuck reserving cashout ${item._id}:`, resErr.message);
        }
    }

    // 2. Stuck 'pending' requests > 30 minutes
    const pendingCutoff = new Date(Date.now() - 30 * 60 * 1000);
    const stuckPending = await CashOutRequest.find({
        status: 'pending',
        createdAt: { $lt: pendingCutoff }
    });

    for (const item of stuckPending) {
        try {
            const refundResult = await refundReserve(item, {
                reason: 'Avtomatik ləğv: vaxtında tamamlanmayan sorğu ləğv edildi və vəsait balansa qaytarıldı',
                targetStatus: 'failed'
            });

            if (refundResult.success && !refundResult.alreadyRefunded) {
                await Notification.create([{
                    user: item.user,
                    type: 'system',
                    title: 'Çıxarış sorğusu ləğv edildi',
                    body: `${item.amount} AZN məbləğində çıxarış sorğunuz vaxtında tamamlanmadığı üçün ləğv edildi və balansınıza qaytarıldı.`,
                    link: '/cabinet.html#wallet'
                }]).catch(() => {});

                reconciledCount++;
                totalRefunded = normalizeMoney(totalRefunded + item.amount);
            }
        } catch (pendErr) {
            console.error(`Error reconciling stuck pending cashout ${item._id}:`, pendErr.message);
        }
    }

    // 3. Orphan reserves: users with walletReservedBalance > sum of active CashOutRequests
    const usersWithReserves = await User.find({ walletReservedBalance: { $gt: 0 } });
    for (const u of usersWithReserves) {
        try {
            const activeRequests = await CashOutRequest.find({
                user: u._id,
                status: { $in: ['reserving', 'pending', 'under_review', 'approved', 'processing'] }
            });
            const activeSum = activeRequests.reduce((sum, r) => sum + (r.amount || 0), 0);
            if (u.walletReservedBalance > activeSum) {
                const diff = normalizeMoney(u.walletReservedBalance - activeSum);
                if (diff > 0) {
                    const orphanRefund = await refundReserve(null, {
                        userId: u._id,
                        amount: diff,
                        description: `Orphan reserve recovery - ${diff} AZN`,
                        idempotencyKey: `orphan_refund:${u._id}:${Date.now()}`
                    });
                    if (orphanRefund.success) {
                        reconciledCount++;
                        totalRefunded = normalizeMoney(totalRefunded + diff);
                    }
                }
            }
        } catch (orphanErr) {
            console.error(`Error reconciling orphan reserve for user ${u._id}:`, orphanErr.message);
        }
    }

    return { reconciledCount, totalRefunded };
};

module.exports = {
    createPackagePaymentSession,
    getBalance,
    getPackages,
    getTransactions,
    getPaymentSessionStatus,
    handlePaymentCallback,
    mockCheckoutPage,
    purchasePackage,
    topUp,
    topUpWallet: topUp,
    completeTopUpPayment,
    requestCashOut,
    createCashOutRequest: requestCashOut,
    cashOut: requestCashOut,
    refundReserve,
    adminReviewCashOut,
    reconcileStuckReserves
};
module.exports.completeTopUpPayment = completeTopUpPayment;
module.exports.requestCashOut = requestCashOut;
module.exports.createCashOutRequest = requestCashOut;
module.exports.cashOut = requestCashOut;
module.exports.refundReserve = refundReserve;
module.exports.reconcileStuckReserves = reconcileStuckReserves;

module.exports._test = {
    validatePaymentCallbackMatch,
    verifyProviderSignature,
    resolveCheckoutUrl,
    createProviderCheckoutUrl,
    paymentResponse,
    completeTopUpPayment
};
