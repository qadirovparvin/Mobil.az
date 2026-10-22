const Redis = require('ioredis');

let redis = null;
let isRedisAvailable = false;

if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy(times) {
            if (times > 3) {
                console.warn('Redis reconnection failed after 3 attempts. Proceeding without Redis cache.');
                isRedisAvailable = false;
                return null; // Stop retrying
            }
            return Math.min(times * 100, 3000);
        }
    });

    redis.on('connect', () => {
        console.log('Redis Cache Connected');
        isRedisAvailable = true;
    });

    redis.on('error', (err) => {
        console.error('Redis Connection Error:', err.message);
        isRedisAvailable = false;
    });
} else {
    console.warn('REDIS_URL not set in environment. Running without Redis caching.');
}

const getCache = async (key) => {
    if (!isRedisAvailable || !redis) return null;
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.error('Redis GET Error:', err.message);
        return null;
    }
};

const setCache = async (key, value, ttlSeconds = 300) => {
    if (!isRedisAvailable || !redis) return;
    try {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
        console.error('Redis SET Error:', err.message);
    }
};

const invalidateCache = async (pattern) => {
    if (!isRedisAvailable || !redis) return;
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (err) {
        console.error('Redis DEL Error:', err.message);
    }
};

module.exports = {
    redis,
    isRedisAvailable,
    getCache,
    setCache,
    invalidateCache
};
