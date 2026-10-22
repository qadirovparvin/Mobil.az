const mockProvider = require('../services/mockProvider');

const getConfig = () => {
    // Explicit provider resolution:
    // In production, default to 'payriff' if credentials exist, otherwise default to 'mock'.
    const isProduction = process.env.NODE_ENV === 'production';
    const explicitProvider = process.env.PAYMENT_PROVIDER ? String(process.env.PAYMENT_PROVIDER).trim().toLowerCase() : null;
    const provider = explicitProvider || (isProduction && (process.env.PAYRIFF_SECRET || process.env.PAYRIFF_API_KEY) ? 'payriff' : 'mock');

    if (isProduction && provider === 'mock') {
        throw new Error('MOCK_PAYMENT_BLOCKED_IN_PRODUCTION: PAYMENT_PROVIDER=mock blocked in production - set real PAYRIFF config');
    }

    if (provider === 'mock') {
        console.warn('⚠️ PAYMENT_PROVIDER=mock (DEV ONLY)');
    }

    const payriff = {
        secret: String(process.env.PAYRIFF_SECRET || process.env.PAYRIFF_API_KEY || '').trim(),
        apiKey: String(process.env.PAYRIFF_API_KEY || process.env.PAYRIFF_SECRET || '').trim(),
        webhookSecret: String(process.env.PAYRIFF_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '').trim(),
        signatureHeader: String(process.env.PAYRIFF_SIGNATURE_HEADER || 'x-payriff-signature').trim(),
        merchantId: String(process.env.PAYRIFF_MERCHANT_ID || process.env.MERCHANT_ID || '').trim(),
        baseUrl: String(process.env.PAYRIFF_API_URL || process.env.PAYRIFF_BASE_URL || 'https://api.payriff.com').trim().replace(/\/+$/, '')
    };

    if (provider === 'payriff' && !payriff.secret) {
        throw new Error('Live provider secret missing');
    }
    if (!['mock', 'payriff'].includes(provider)) {
        throw new Error('Unsupported payment provider');
    }

    return { provider, payriff, payment: { provider, payriff } };
};

const isActive = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const provider = String(process.env.PAYMENT_PROVIDER || 'mock').trim().toLowerCase();
    if (isProduction && provider === 'mock') {
        throw new Error('MOCK_PAYMENT_BLOCKED_IN_PRODUCTION: PAYMENT_PROVIDER=mock blocked in production - set real PAYRIFF config');
    }
    return provider === 'payriff' && Boolean(process.env.PAYRIFF_SECRET || process.env.PAYRIFF_API_KEY);
};

const createMockSession = (payment, origin) => {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
        throw new Error('MOCK_PAYMENT_BLOCKED_IN_PRODUCTION: Mock payment session blocked in production');
    }
    return mockProvider.createMockSession(payment, origin);
};

module.exports = {
    getConfig,
    isActive,
    createMockSession,
    get provider() {
        return getConfig().provider;
    },
    get payriff() {
        return getConfig().payriff;
    },
    get payment() {
        return {
            provider: getConfig().provider,
            payriff: getConfig().payriff
        };
    }
};

if (process.env.NODE_ENV === 'production') {
    getConfig();
}

