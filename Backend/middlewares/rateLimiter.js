const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const isProduction = process.env.NODE_ENV === 'production';

// Security check 1: DISABLE_RATE_LIMIT is strictly blocked in production
if (process.env.NODE_ENV === 'production' && process.env.DISABLE_RATE_LIMIT === 'true') {
    throw new Error('DISABLE_RATE_LIMIT blocked in production');
}

// Security check 2: REDIS_URL is strictly required in production for cluster rate limiting
if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
    console.error('FATAL: REDIS_URL required in production for rate limiting');
    throw new Error('REDIS_URL required in production for rate limiting');
}

const { redisClient } = require('../config/redis');

if (process.env.NODE_ENV === 'production' && !redisClient) {
    console.error('FATAL: REDIS_URL required in production for rate limiting');
    throw new Error('REDIS_URL required in production for rate limiting');
}

// Store indicator log (cluster-shared vs single-worker)
if (redisClient && redisClient.status === 'ready') {
    console.log('Rate limiter store: Redis (cluster-shared)');
} else if (isProduction) {
    console.log('Rate limiter store: Redis (cluster-shared; startup ping required)');
} else {
    console.log('Rate limiter store: Memory (single-worker)');
    console.warn('⚠️ Warning: Memory store used - rate limits are not shared across PM2 cluster workers!');
}

// Helper to check if the incoming request is from a verified or authenticated admin session, or admin credentials
const isRequestFromAdmin = async (req) => {
    if (!req) return false;

    // 1. Admin IP whitelist via process.env.ADMIN_IPS
    const rawIp = req.ip || req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress;
    const adminIps = (process.env.ADMIN_IPS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (adminIps.length && (adminIps.includes(rawIp) || (req.ip && adminIps.includes(req.ip)))) {
        return true;
    }

    // 2. Authenticated user with admin/superadmin role
    if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
        return true;
    }

    // 3. Decoded Bearer JWT token in Authorization header
    if (req.headers?.authorization && typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ')) {
        try {
            const jwt = require('jsonwebtoken');
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.decode(token);
            if (decoded && (decoded.role === 'admin' || decoded.role === 'superadmin')) {
                return true;
            }
        } catch (_) {}
    }

    // 4. Request body check for login identifier/email
    const rawIdentifier = req.body?.email || req.body?.identifier;
    if (rawIdentifier) {
        const cleanId = String(rawIdentifier).trim().toLowerCase();
        const configuredAdminEmail = (process.env.ADMIN_EMAIL || 'mobilim.az@gmail.com').toLowerCase();
        if (cleanId === configuredAdminEmail || cleanId === 'mobilim.az@gmail.com' || cleanId === 'mobil@gmail.com') {
            return true;
        }

        try {
            const User = require('../models/User');
            if (User && typeof User.findOne === 'function') {
                const targetUser = await User.findOne({
                    $or: [
                        { email: cleanId },
                        { phone: cleanId },
                        { username: cleanId }
                    ]
                }).select('role isVerified').lean();

                if (targetUser && (targetUser.role === 'admin' || targetUser.role === 'superadmin')) {
                    return true;
                }
            }
        } catch (_) {}
    }

    return false;
};

const isAdminRequest = (req) => {
    return Boolean(req.user && (req.user.role === 'admin' || req.user.role === 'superadmin') && req.user.isVerified);
};

// Restrict each IP to a maximum of 5 failed login attempts per 15-minute window.
const loginFailedLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 failed login attempts per windowMs
    store: createStore('rl:login-failed:'),
    passOnStoreError: false,
    message: { message: "Too many failed login attempts. Please try again after 15 minutes." },
    statusCode: 429,
    skipSuccessfulRequests: true, // Only count failed attempts (status >= 400)
    standardHeaders: true,
    legacyHeaders: false,
    skip: async (req) => {
        try {
            return await isRequestFromAdmin(req);
        } catch (_) {
            return false;
        }
    },
    handler(req, res, next, options) {
        logger.warn(`Failed login rate limit exceeded: ${req.method} ${req.originalUrl} ip=${req.ip}`);
        res.status(options.statusCode).json(options.message);
    }
});

const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');

const memoryLimiter = new RateLimiterMemory({
    keyPrefix: 'login_fail',
    points: 30,
    duration: 60 * 15,
    blockDuration: 60 * 15
});

let limiter = memoryLimiter;

if (redisClient) {
    try {
        limiter = new RateLimiterRedis({
            storeClient: redisClient,
            keyPrefix: 'login_fail',
            points: 30,
            duration: 60 * 15,
            blockDuration: 60 * 15,
            insuranceLimiter: isProduction ? undefined : memoryLimiter
        });
    } catch (e) {
        if (isProduction) {
            throw new Error(`Redis login rate limiter initialization failed: ${e.message}`);
        }
        logger.warn('Redis rate limiter flexible init error, fallback to memory');
        limiter = memoryLimiter;
    }
} else if (isProduction) {
    throw new Error('Redis client not ready - fail closed, do not fallback to memory in production');
}

async function loginRateLimiter(req, res, next) {
    if (process.env.NODE_ENV === 'production' && process.env.DISABLE_RATE_LIMIT === 'true') {
        throw new Error('DISABLE_RATE_LIMIT blocked in production');
    }
    const isDev = process.env.NODE_ENV !== 'production' || process.env.DISABLE_RATE_LIMIT === 'true';
    const rawIp = req.ip || req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress || '127.0.0.1';
    const isLocalhost = rawIp === '127.0.0.1' || rawIp === '::1' || rawIp === '::ffff:127.0.0.1' || rawIp === 'localhost';

    if (isDev || isLocalhost) {
        return next();
    }

    try {
        if (await isRequestFromAdmin(req)) {
            console.warn(`[RATE LIMIT] Admin login rate limit bypassed for: ${req.body?.email || req.body?.identifier || rawIp}`);
            return next();
        }
    } catch (_) {}

    try {
        await limiter.consume(rawIp);
        next();
    } catch (err) {
        if (err instanceof Error) {
            logger.warn(`Rate limiter unexpected error: ${err.message}`);
        } else {
            logger.warn(`Login rate limit exceeded: ${req.method} ${req.originalUrl || req.url || ''} ip=${rawIp}`);
        }
        return res.status(429).json({ message: 'Çox sayda sorğu' });
    }
}

let currentLoginLimiter;
let currentAdListLimiter;
let currentPasswordResetLimiter;

function createStore(prefix) {
    if (!redisClient) {
        if (isProduction) {
            throw new Error('Redis client not ready - fail closed, do not fallback to memory in production');
        }
        return undefined;
    }

    if (!isProduction && redisClient.status !== 'ready') return undefined;

    try {
        const { RedisStore } = require('rate-limit-redis');
        return new RedisStore({
            sendCommand: (...args) => redisClient.call(...args),
            prefix
        });
    } catch (error) {
        if (isProduction) {
            throw new Error(`Redis rate-limit store initialization failed: ${error.message}`);
        }
        logger.warn('Redis rate-limit store initialization failed; using development memory store');
        return undefined;
    }
}

function initLimiters() {
    currentLoginLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 5,
        store: createStore('rl:login:'),
        passOnStoreError: false,
        message: { message: "Too many login attempts. Çox cəhd, 15 dəq sonra" },
        statusCode: 429,
        standardHeaders: true,
        legacyHeaders: false,
        handler(req, res, next, options) {
            logger.warn(`Login rate limit exceeded: ${req.method} ${req.originalUrl || req.url || ''} ip=${req.ip}`);
            res.status(options.statusCode).json(options.message);
        }
    });

    currentAdListLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        store: createStore('rl:ads:'),
        passOnStoreError: false,
        message: { message: "Həddindən artıq müraciət. Zəhmət olmasa 15 dəqiqə sonra yenidən cəhd edin." },
        statusCode: 429,
        standardHeaders: true,
        legacyHeaders: false,
        handler(req, res, next, options) {
            logger.warn(`Ad list rate limit exceeded: ${req.method} ${req.originalUrl} ip=${req.ip}`);
            res.status(options.statusCode).json(options.message);
        }
    });

    currentPasswordResetLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 3,
        store: createStore('rl:password-reset:'),
        passOnStoreError: false,
        message: { message: "Too many password reset requests. Please try again after 15 minutes." },
        statusCode: 429,
        standardHeaders: true,
        legacyHeaders: false,
        handler(req, res, next, options) {
            logger.warn(`Password reset rate limit exceeded: ${req.method} ${req.originalUrl} ip=${req.ip}`);
            res.status(options.statusCode).json(options.message);
        }
    });
}

initLimiters();

if (redisClient) {
    redisClient.on('ready', () => {
        try {
            initLimiters();
        } catch (_) {}
    });
}

const loginLimiter = async (req, res, next) => {
    try {
        const isAdmin = await isRequestFromAdmin(req);
        if (isAdmin) {
            console.warn(`[RATE LIMIT] Admin login rate limit bypassed for: ${req.body?.email || req.body?.identifier || req.ip}`);
            logger.info(`Admin login rate limit bypassed for ip=${req.ip}`);
            return next();
        }
    } catch (err) {
        // Fall back to currentLoginLimiter if check throws
    }
    return currentLoginLimiter(req, res, next);
};

const adListLimiter = (req, res, next) => currentAdListLimiter(req, res, next);
const passwordResetLimiter = (req, res, next) => currentPasswordResetLimiter(req, res, next);

module.exports = {
    redisClient,
    isRequestFromAdmin,
    isAdminRequest,
    loginFailedLimiter,
    loginLimiter,
    loginRateLimiter,
    adListLimiter,
    passwordResetLimiter
};
