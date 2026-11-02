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

// Helper to check if the incoming request is from a verified authenticated admin session
const isAdminRequest = (req) => {
    return Boolean(req.user && req.user.role === 'admin' && req.user.isVerified);
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

const loginLimiter = (req, res, next) => currentLoginLimiter(req, res, next);
const adListLimiter = (req, res, next) => currentAdListLimiter(req, res, next);
const passwordResetLimiter = (req, res, next) => currentPasswordResetLimiter(req, res, next);

module.exports = {
    redisClient,
    loginFailedLimiter,
    loginLimiter,
    loginRateLimiter,
    adListLimiter,
    passwordResetLimiter
};
