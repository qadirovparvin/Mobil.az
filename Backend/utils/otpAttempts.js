const { getCache, setCache } = require('./redisClient');

// Fallback in-memory map for when Redis is not configured/available (e.g. in tests/dev)
const memoryStorage = new Map();

// Helper to clean up expired items from memoryStorage to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryStorage.entries()) {
        if (value.expiresAt && value.expiresAt < now) {
            memoryStorage.delete(key);
        }
    }
}, 60 * 1000).unref(); // unref so it doesn't block process exit

const getOtpAttempts = async (identifier) => {
    // Normalise identifier to ensure consistency
    const cleanId = String(identifier).trim().toLowerCase();
    const cacheKey = `otp_attempts:${cleanId}`;
    
    let attempts = await getCache(cacheKey);
    if (!attempts) {
        attempts = memoryStorage.get(cacheKey);
    }
    if (attempts) {
        if (attempts.lockedUntil) {
            attempts.lockedUntil = new Date(attempts.lockedUntil);
        }
        return attempts;
    }
    return { failedAttempts: 0, lockedUntil: null };
};

const incrementOtpAttempts = async (identifier) => {
    const cleanId = String(identifier).trim().toLowerCase();
    const cacheKey = `otp_attempts:${cleanId}`;
    
    const attempts = await getOtpAttempts(cleanId);
    attempts.failedAttempts += 1;
    if (attempts.failedAttempts >= 5) {
        attempts.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
    }
    
    // Save to Redis (30 mins TTL)
    await setCache(cacheKey, attempts, 1800);
    
    // Save to memory storage fallback
    memoryStorage.set(cacheKey, {
        failedAttempts: attempts.failedAttempts,
        lockedUntil: attempts.lockedUntil,
        expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutes
    });
    
    return attempts;
};

const clearOtpAttempts = async (identifier) => {
    const cleanId = String(identifier).trim().toLowerCase();
    const cacheKey = `otp_attempts:${cleanId}`;
    
    // Delete from Redis
    const { redis, isRedisAvailable } = require('./redisClient');
    if (isRedisAvailable && redis) {
        try {
            await redis.del(cacheKey);
        } catch (err) {
            console.error('Redis DEL Error:', err.message);
        }
    }
    // Delete from memory storage
    memoryStorage.delete(cacheKey);
};

module.exports = {
    getOtpAttempts,
    incrementOtpAttempts,
    clearOtpAttempts
};
