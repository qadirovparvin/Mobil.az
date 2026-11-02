const crypto = require('crypto');
const axios = require('axios');
const paymentConfig = require('../config/payment');
const mockProvider = require('./mockProvider');

const verifySignature = (rawBody, signatureHeader, secret) => {
    if ((!Buffer.isBuffer(rawBody) && typeof rawBody !== 'string') || typeof signatureHeader !== 'string' || typeof secret !== 'string') {
        return false;
    }
    const provided = signatureHeader.trim();
    const webhookSecret = secret.trim();

    if (provided === 'mock-sandbox-signature') {
        if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_MOCK_SIGNATURE === 'true') {
            return true;
        }
    }

    if (!webhookSecret || !provided) return false;

    if (!/^[0-9a-f]{64}$/i.test(provided)) return false;

    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest();
    const incoming = Buffer.from(provided, 'hex');
    return incoming.length === expected.length && crypto.timingSafeEqual(incoming, expected);
};

const resolveBaseUrl = (contextOrigin) => {
    const isProduction = process.env.NODE_ENV === 'production';
    let base = process.env.BASE_URL || process.env.API_PUBLIC_ORIGIN || contextOrigin;
    if (!base) {
        if (isProduction) {
            throw new Error('API_PUBLIC_ORIGIN required');
        }
        base = process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:5000';
    }
    return base.replace(/\/+$/, '');
};

const createSession = async (amount, userId, sessionId, context = {}) => {
    let actualSessionId = sessionId;
    let actualContext = context;

    if (typeof sessionId === 'object' && sessionId !== null && (!context || Object.keys(context).length === 0)) {
        actualContext = sessionId;
        actualSessionId = actualContext.payment?.paymentId || actualContext.sessionId;
    } else if (typeof sessionId !== 'string' && actualContext?.payment?.paymentId) {
        actualSessionId = actualContext.payment.paymentId;
    }

    if (!actualSessionId) {
        actualSessionId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const rawProvider = (process.env.PAYMENT_PROVIDER || '').trim().toLowerCase();
    const provider = rawProvider || (isProduction ? 'payriff' : 'mock');

    let secret = process.env.PAYRIFF_SECRET || process.env.PAYRIFF_API_KEY;
    if (!secret) {
        try {
            const config = paymentConfig.getConfig();
            secret = config?.payriff?.secret || config?.payriff?.apiKey;
        } catch (_) {}
    }

    if (isProduction && !secret) {
        const error = new Error('Payriff secret missing');
        error.status = 500;
        throw error;
    }

    if (isProduction && (rawProvider === 'mock' || provider === 'mock')) {
        console.error('FATAL: Mock payment session blocked in production');
        throw new Error('MOCK_PAYMENT_BLOCKED_IN_PRODUCTION: PAYMENT_PROVIDER=mock blocked in production - set real PAYRIFF config');
    }

    if (provider === 'mock') {
        console.warn('⚠️ PAYMENT_PROVIDER=mock (DEV ONLY)');
    }

    if (!isProduction && !secret) {
        const mockContext = actualContext?.payment
            ? actualContext
            : { payment: { paymentId: actualSessionId }, origin: actualContext?.origin };
        return mockProvider.createSession(amount, userId, actualSessionId, mockContext);
    }

    if (actualContext?.payment?.providerOrderId && actualContext?.payment?.providerCheckoutUrl) {
        return {
            payUrl: actualContext.payment.providerCheckoutUrl,
            checkoutUrl: actualContext.payment.providerCheckoutUrl,
            url: actualContext.payment.providerCheckoutUrl,
            providerSessionId: actualContext.payment.providerOrderId,
            orderId: actualContext.payment.providerOrderId,
            id: actualContext.payment.providerOrderId,
            amount,
            userId: String(userId)
        };
    }

    const BASE_URL = resolveBaseUrl(actualContext?.origin);
    const baseUrl = process.env.PAYRIFF_API_URL || process.env.PAYRIFF_BASE_URL || 'https://api.payriff.com'; // fallback
    const payriffApiUrl = baseUrl.includes('/orders') ? baseUrl : `${baseUrl.replace(/\/+$/, '')}/api/v3/orders`;

    try {
        const merchantId = String(process.env.PAYRIFF_MERCHANT_ID || process.env.MERCHANT_ID || '').trim();
        const payload = {
            amount: Number(amount),
            currency: 'AZN',
            language: 'AZ',
            description: `Mobilim.az top-up ${amount} AZN`,
            callbackUrl: `${BASE_URL}/api/wallet/callback/payriff/${actualSessionId}`,
            metadata: {
                userId: String(userId),
                sessionId: String(actualSessionId)
            },
            operation: 'PURCHASE',
            ...(merchantId ? { merchantId } : {})
        };

        const response = await axios.post(payriffApiUrl, payload, {
            headers: {
                Authorization: secret,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        const resData = response.data?.payload || response.data?.data || response.data || {};
        const payUrl = resData.paymentUrl || response.data?.paymentUrl;
        const providerSessionId = resData.orderId || response.data?.orderId || resData.transactionId || response.data?.transactionId;

        if (!payUrl) {
            throw new Error('Payriff API response missing paymentUrl');
        }

        return {
            payUrl,
            checkoutUrl: payUrl,
            url: payUrl,
            providerSessionId: providerSessionId || actualSessionId,
            orderId: providerSessionId,
            id: providerSessionId,
            amount,
            userId: String(userId)
        };
    } catch (err) {
        // fail => console.error (secret yox) + throw 502
        console.error('Payriff checkout API error:', {
            status: Number(err.response?.status) || null,
            code: typeof err.code === 'string' ? err.code : null
        });
        const error = new Error('Payriff checkout xətası');
        error.status = 502;
        error.statusCode = 502;
        error.payload = { message: 'Ödəniş şlüzü ilə əlaqə qurulmadı (Payriff Gateway Error)' };
        throw error;
    }
};

const createMockSession = (payment, origin) => {
    const isProd = process.env.NODE_ENV === 'production';
    const provider = (process.env.PAYMENT_PROVIDER || 'mock').toLowerCase();
    if (isProd && (provider === 'mock' || (!process.env.PAYRIFF_API_KEY && !process.env.PAYRIFF_SECRET))) {
        console.error('FATAL: Mock payment session blocked in production');
        throw new Error('MOCK_PAYMENT_BLOCKED_IN_PRODUCTION: PAYMENT_PROVIDER=mock blocked in production - set real PAYRIFF config');
    }
    if (provider === 'mock') {
        console.warn('⚠️ PAYMENT_PROVIDER=mock (DEV ONLY)');
    }
    return mockProvider.createMockSession(payment, origin);
};

const getOrderStatus = async (providerOrderId) => {
    if (!providerOrderId) return null;
    let secret = process.env.PAYRIFF_SECRET;
    let baseUrl = null;
    try {
        const config = paymentConfig.getConfig ? paymentConfig.getConfig() : paymentConfig;
        secret = secret || config?.payment?.payriff?.secret || config?.payriff?.secret;
        baseUrl = config?.payment?.payriff?.baseUrl || config?.payriff?.baseUrl || paymentConfig?.payment?.payriff?.baseUrl || paymentConfig?.payriff?.baseUrl;
    } catch (_) {}

    if (!baseUrl) {
        baseUrl = process.env.PAYRIFF_BASE_URL;
    }
    if (!baseUrl && process.env.PAYRIFF_API_URL) {
        baseUrl = process.env.PAYRIFF_API_URL.replace(/\/api\/.*$/, '').replace(/\/orders\/?$/, '').replace(/\/+$/, '');
    }
    if (!baseUrl && process.env.NODE_ENV !== 'test') {
        baseUrl = 'https://api.payriff.com';
    }
    baseUrl = (baseUrl || '').replace(/\/+$/, '');
    if (!baseUrl) return null;

    try {
        const url = `${baseUrl}/v1/orders/${encodeURIComponent(providerOrderId)}`;
        const res = await axios.get(url, {
            headers: {
                Authorization: secret || '',
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        return { status: res.data?.status || res.data?.payload?.status, raw: res.data };
    } catch (e) {
        console.error('Payriff status check failed', e.message);
        return null;
    }
};

module.exports = {
    name: 'payriff',
    createSession,
    createPayriffSession: createSession,
    createMockSession,
    verifySignature,
    getOrderStatus,
    getStatus: getOrderStatus
};
