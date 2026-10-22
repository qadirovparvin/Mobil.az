const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { normalizeEmail } = require('./securityValidation');
const logger = require('./logger');

const identifierBuckets = new Map();

setInterval(() => {
    const now = Date.now();
    const MAX_RETENTION_MS = 60 * 60 * 1000;
    for (const [key, bucket] of identifierBuckets.entries()) {
        if (now - bucket.lastAt > MAX_RETENTION_MS) {
            identifierBuckets.delete(key);
        }
    }
}, 10 * 60 * 1000).unref();

const hashIdentifier = (value) =>
    crypto.createHash('sha256').update(String(value || '')).digest('hex').slice(0, 16);

const getClientIpKey = (req) => req.ip || req.socket?.remoteAddress || 'unknown';

const normalizeIdentifier = (value) => {
    if (!value) return '';
    try {
        return normalizeEmail(value);
    } catch {
        return String(value).trim().toLowerCase().slice(0, 254);
    }
};

const isAdminIdentifier = (id) => {
    const clean = String(id || '').trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || 'mobil@gmail.com').toLowerCase();
    return clean === adminEmail || clean === 'mobil@gmail.com';
};

const createIpLimiter = ({ windowMs, max, message }) => rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
    skip: (req) => {
        const id = req.body?.identifier || req.body?.email || req.body?.phone || req.user?.email || '';
        return isAdminIdentifier(id) || (req.user && req.user.role === 'admin');
    },
    handler(req, res, next, options) {
        logger.warn(`Rate limit exceeded: ${req.method} ${req.originalUrl} ip=${getClientIpKey(req)}`);
        res.status(options.statusCode).json(options.message);
    }
});

const createIdentifierLimiter = ({
    getIdentifier,
    windowMs,
    max,
    cooldownMs = 0,
    message = 'Çox sayda sorğu göndərildi. Bir az sonra yenidən cəhd edin.'
}) => (req, res, next) => {
    const identifier = normalizeIdentifier(getIdentifier(req));
    if (!identifier || isAdminIdentifier(identifier)) return next();

    const now = Date.now();
    const key = `${req.baseUrl || ''}:${req.path || req.originalUrl}:${identifier}`;
    const bucket = identifierBuckets.get(key) || { count: 0, firstAt: now, lastAt: 0 };

    if (now - bucket.firstAt > windowMs) {
        bucket.count = 0;
        bucket.firstAt = now;
    }

    if (cooldownMs && bucket.lastAt && now - bucket.lastAt < cooldownMs) {
        logger.warn(`Identifier cooldown exceeded route=${req.originalUrl} id=${hashIdentifier(identifier)} ip=${getClientIpKey(req)}`);
        return res.status(429).json({ message });
    }

    bucket.count += 1;
    bucket.lastAt = now;
    identifierBuckets.set(key, bucket);

    if (bucket.count > max) {
        logger.warn(`Identifier rate limit exceeded route=${req.originalUrl} id=${hashIdentifier(identifier)} ip=${getClientIpKey(req)}`);
        return res.status(429).json({ message });
    }

    return next();
};

const registrationIpLimiter = createIpLimiter({
    windowMs: Number(process.env.REGISTRATION_RATE_WINDOW_MS || 60 * 60 * 1000),
    max: Number(process.env.REGISTRATION_IP_RATE_LIMIT || 8),
    message: 'Qeydiyyat sorğuları məhdudlaşdırılıb. Bir az sonra yenidən cəhd edin.'
});

const registrationIdentifierLimiter = createIdentifierLimiter({
    getIdentifier: (req) => req.body?.email || req.body?.phone,
    windowMs: Number(process.env.REGISTRATION_RATE_WINDOW_MS || 60 * 60 * 1000),
    max: Number(process.env.REGISTRATION_IDENTIFIER_RATE_LIMIT || 3),
    message: 'Qeydiyyat sorğuları məhdudlaşdırılıb. Bir az sonra yenidən cəhd edin.'
});

const verificationIpLimiter = createIpLimiter({
    windowMs: Number(process.env.VERIFICATION_RATE_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.VERIFICATION_IP_RATE_LIMIT || 10),
    message: 'Təsdiqləmə sorğuları məhdudlaşdırılıb. Bir az sonra yenidən cəhd edin.'
});

const verificationIdentifierLimiter = createIdentifierLimiter({
    getIdentifier: (req) => req.body?.identifier || req.body?.email || req.body?.phone,
    windowMs: Number(process.env.VERIFICATION_RATE_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.VERIFICATION_IDENTIFIER_RATE_LIMIT || 3),
    cooldownMs: Number(process.env.VERIFICATION_RESEND_COOLDOWN_MS || 60 * 1000),
    message: 'Təsdiqləmə kodu üçün bir az gözləyin.'
});

const accountChangeLimiter = createIpLimiter({
    windowMs: Number(process.env.ACCOUNT_CHANGE_RATE_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.ACCOUNT_CHANGE_RATE_LIMIT || 10),
    message: 'Hesab dəyişiklikləri müvəqqəti məhdudlaşdırılıb.'
});

module.exports = {
    accountChangeLimiter,
    createIdentifierLimiter,
    createIpLimiter,
    hashIdentifier,
    registrationIdentifierLimiter,
    registrationIpLimiter,
    verificationIdentifierLimiter,
    verificationIpLimiter
};
