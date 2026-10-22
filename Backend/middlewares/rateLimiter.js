const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Helper to check if the incoming request is from a verified authenticated admin session
const isAdminRequest = (req) => {
    return Boolean(req.user && req.user.role === 'admin' && req.user.isVerified);
};

// Restrict each IP to a maximum of 5 failed login attempts per 15-minute window.
const loginFailedLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 failed login attempts per windowMs
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
const Redis = require('ioredis');

let limiter;
let redisClient;

const memoryLimiter = new RateLimiterMemory({
    keyPrefix: 'login_fail',
    points: 30,
    duration: 60 * 15,
    blockDuration: 60 * 15
});

try {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null
    });
    redisClient.on('error', () => {
        logger.warn('Redis rate limit error, fallback to memory');
    });
    limiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'login_fail',
        points: 30,
        duration: 60 * 15,
        blockDuration: 60 * 15,
        insuranceLimiter: memoryLimiter
    });
} catch (e) {
    logger.warn('Redis not available, using memory limiter');
    limiter = memoryLimiter;
}

console.log('RateLimiter mode:', redisClient ? 'Redis' : 'Memory');

async function loginRateLimiter(req, res, next) {
    const isDev = process.env.NODE_ENV !== 'production' || process.env.DISABLE_RATE_LIMIT === 'true';
    const rawIp = req.ip || req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress || '127.0.0.1';
    const isLocalhost = rawIp === '127.0.0.1' || rawIp === '::1' || rawIp === '::ffff:127.0.0.1' || rawIp === 'localhost';

    if (isDev || isLocalhost) {
        return next();
    }

    try {
        await limiter.consume(rawIp);
        next();
    } catch (rejRes) {
        if (rejRes instanceof Error) {
            logger.warn(`Rate limiter unexpected error: ${rejRes.message}`);
            return next();
        }
        logger.warn(`Login rate limit exceeded: ${req.method} ${req.originalUrl || req.url || ''} ip=${rawIp}`);
        res.status(429).json({ message: 'Çox sayda cəhd. Zəhmət olmasa 15 dəqiqə sonra yenidən cəhd edin.' });
    }
}

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: "Too many login attempts. Please try again after 15 minutes." },
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    handler(req, res, next, options) {
        logger.warn(`Login rate limit exceeded: ${req.method} ${req.originalUrl || req.url || ''} ip=${req.ip}`);
        res.status(options.statusCode).json(options.message);
    }
});

const adListLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { message: "Həddindən artıq müraciət. Zəhmət olmasa 15 dəqiqə sonra yenidən cəhd edin." },
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    handler(req, res, next, options) {
        logger.warn(`Ad list rate limit exceeded: ${req.method} ${req.originalUrl} ip=${req.ip}`);
        res.status(options.statusCode).json(options.message);
    }
});

// Restrict each IP to a maximum of 3 password reset requests per 15-minute window.
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Limit each IP to 3 requests per windowMs
    message: { message: "Too many password reset requests. Please try again after 15 minutes." },
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    handler(req, res, next, options) {
        logger.warn(`Password reset rate limit exceeded: ${req.method} ${req.originalUrl} ip=${req.ip}`);
        res.status(options.statusCode).json(options.message);
    }
});

module.exports = {
    loginFailedLimiter,
    loginLimiter,
    loginRateLimiter,
    adListLimiter,
    passwordResetLimiter
};
