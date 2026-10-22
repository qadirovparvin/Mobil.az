const crypto = require('crypto');

const getSignature = (req) => {
    if (typeof req === 'string') return req.trim();
    const value = req?.paymentSignature ||
        req?.get?.('x-payment-signature') ||
        req?.get?.('x-webhook-signature') ||
        req?.headers?.['x-payment-signature'] ||
        req?.headers?.['x-webhook-signature'] ||
        '';
    return typeof value === 'string' ? value.trim() : '';
};

const safeEqualHex = (provided, expected) => {
    if (!/^[0-9a-f]+$/i.test(provided) || !/^[0-9a-f]+$/i.test(expected)) {
        return false;
    }
    const providedBuffer = Buffer.from(provided, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    return providedBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(providedBuffer, expectedBuffer);
};

const verifyMock = (req, { paymentId, amount, currency, status, providerReference } = {}) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;

    if (isProduction) {
        if (!secret) {
            throw new Error('PAYMENT_WEBHOOK_SECRET is not configured');
        }
        if (process.env.PAYMENT_PROVIDER === 'mock') {
            throw new Error('Mock payment provider is not allowed in production');
        }
    }

    const provided = getSignature(req);
    if (!provided) return false;

    if (provided === 'mock-sandbox-signature') {
        return !isProduction && process.env.ALLOW_MOCK_SIGNATURE === 'true';
    }

    if (!secret) {
        throw new Error('PAYMENT_WEBHOOK_SECRET is not configured');
    }

    const payload = `${paymentId}.${amount}.${currency}.${status || ''}.${providerReference || ''}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (safeEqualHex(provided, expected)) return true;

    if (req?.rawBody) {
        const expectedRaw = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex');
        return safeEqualHex(provided, expectedRaw);
    }

    return false;
};

const createMockSession = (payment, origin) => {
    const baseOrigin = String(origin || '').replace(/\/+$/, '');
    return `${baseOrigin}/api/wallet/payments/${encodeURIComponent(payment.paymentId)}/mock-checkout`;
};

const createSession = async (amount, userId, sessionIdOrContext = {}, maybeContext = {}) => {
    let payment;
    let origin;
    if (typeof sessionIdOrContext === 'string') {
        payment = maybeContext?.payment || { paymentId: sessionIdOrContext };
        origin = maybeContext?.origin;
    } else {
        payment = sessionIdOrContext?.payment;
        origin = sessionIdOrContext?.origin;
    }

    if (!payment || !payment.paymentId) {
        throw new Error('Mock payment session context missing');
    }
    const checkoutUrl = createMockSession(payment, origin);
    return {
        checkoutUrl,
        payUrl: checkoutUrl,
        url: checkoutUrl,
        providerSessionId: payment.paymentId,
        orderId: payment.paymentId,
        id: payment.paymentId,
        amount,
        userId: String(userId)
    };
};

module.exports = {
    name: 'mock',
    createMockSession,
    createSession,
    verifyMock,
    verifySignature: verifyMock
};
