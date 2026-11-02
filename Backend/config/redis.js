const Redis = require('ioredis');

// Security check 1: DISABLE_RATE_LIMIT is strictly blocked in production
if (process.env.NODE_ENV === 'production' && process.env.DISABLE_RATE_LIMIT === 'true') {
    throw new Error('DISABLE_RATE_LIMIT blocked in production');
}

// Security check 2: REDIS_URL is strictly required in production for cluster rate limiting
if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
    console.error('FATAL: REDIS_URL required in production for rate limiting');
    throw new Error('REDIS_URL required in production for rate limiting');
}

let redisClient = null;
let isConnected = false;

if (process.env.REDIS_URL) {
    try {
        redisClient = new Redis(process.env.REDIS_URL, {
            enableOfflineQueue: false,
            maxRetriesPerRequest: 1,
            retryStrategy: (times) => {
                if (times > 3) return null;
                return Math.min(times * 100, 3000);
            }
        });

        redisClient.on('error', (err) => {
            console.error('Redis error', err && err.message ? err.message : err);
            isConnected = false;
        });

        redisClient.on('connect', () => {
            isConnected = false;
        });

        redisClient.on('ready', () => {
            console.log('✅ Redis connected for rate limiter');
            isConnected = true;
        });

        redisClient.on('close', () => {
            isConnected = false;
        });
    } catch (err) {
        console.error('Redis error', err && err.message ? err.message : err);
        if (process.env.NODE_ENV === 'production') {
            console.error('FATAL: REDIS_URL required in production for rate limiting');
            throw new Error('REDIS_URL required in production for rate limiting');
        }
        redisClient = null;
    }
}

const waitForRedisReady = async (timeoutMs = 10000) => {
    if (!redisClient) {
        throw new Error('Redis client not initialized - fail closed');
    }

    const waitForReadyEvent = () => new Promise((resolve, reject) => {
        let settled = false;
        const cleanup = () => {
            clearTimeout(timer);
            redisClient.removeListener('ready', onReady);
            redisClient.removeListener('end', onEnd);
        };
        const finish = (callback, value) => {
            if (settled) return;
            settled = true;
            cleanup();
            callback(value);
        };
        const onReady = () => finish(resolve);
        const onEnd = () => finish(reject, new Error('Redis connection ended before becoming ready'));
        const timer = setTimeout(() => finish(reject, new Error('Redis client not ready before startup timeout')), timeoutMs);

        redisClient.once('ready', onReady);
        redisClient.once('end', onEnd);
        if (redisClient.status === 'ready') onReady();
    });

    if (redisClient.status !== 'ready') {
        await waitForReadyEvent();
    }

    const pong = await redisClient.ping();
    if (pong !== 'PONG' || redisClient.status !== 'ready') {
        isConnected = false;
        throw new Error('Redis ping failed - fail closed');
    }
    isConnected = true;
    return true;
};

module.exports = {
    redisClient,
    waitForRedisReady,
    get isReady() {
        return Boolean(redisClient && redisClient.status === 'ready' && isConnected);
    },
    get isConnected() {
        return Boolean(redisClient && redisClient.status === 'ready' && isConnected);
    }
};
