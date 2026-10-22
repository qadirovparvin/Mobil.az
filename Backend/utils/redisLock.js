const { redis } = require('./redisClient');
const logger = require('./logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Acquire a distributed lock.
 * @param {string} lockKey - The key for the lock.
 * @param {number} ttlMs - Lock TTL in milliseconds.
 * @returns {Promise<{acquired: boolean, release: Function}>}
 */
const acquireLock = async (lockKey, ttlMs = 30000) => {
    const isRedisReady = redis && redis.status === 'ready';
    if (!isRedisReady) {
        // Fallback for single-instance or development environments without Redis.
        return {
            acquired: true,
            release: async () => {}
        };
    }

    const token = uuidv4();
    try {
        const result = await redis.set(lockKey, token, 'NX', 'PX', ttlMs);
        if (result === 'OK') {
            return {
                acquired: true,
                release: async () => {
                    try {
                        const luaScript = `
                            if redis.call('get', KEYS[1]) == ARGV[1] then
                                return redis.call('del', KEYS[1])
                            else
                                return 0
                            end
                        `;
                        await redis.eval(luaScript, 1, lockKey, token);
                    } catch (err) {
                        logger.error(`[Lock] Failed to release lock ${lockKey}:`, err.message);
                    }
                }
            };
        }
        return { acquired: false, release: null };
    } catch (err) {
        logger.error(`[Lock] Redis error acquiring lock ${lockKey}, falling back to allowed execution:`, err.message);
        // Fallback: if Redis fails (e.g. network partition), allow execution to prevent scheduler starvation.
        return {
            acquired: true,
            release: async () => {}
        };
    }
};

module.exports = { acquireLock };
