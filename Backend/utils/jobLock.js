const os = require('os');
const JobLock = require('../models/JobLock');

const owner = `${os.hostname()}:${process.pid}`;

const acquireJobLock = async (name, ttlMs) => {
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + ttlMs);
    const lock = await JobLock.findOneAndUpdate(
        {
            name,
            $or: [
                { lockedUntil: { $lte: now } },
                { owner }
            ]
        },
        {
            $set: { owner, lockedUntil, lastRunAt: now, lastError: '' },
            $setOnInsert: { name }
        },
        { upsert: true, new: true }
    );

    return lock && lock.owner === owner ? lock : null;
};

const releaseJobLock = async (name, error = null) => {
    await JobLock.updateOne(
        { name, owner },
        {
            $set: {
                lockedUntil: new Date(0),
                lastFinishedAt: new Date(),
                lastError: error ? String(error.message || error).slice(0, 1000) : ''
            }
        }
    );
};

const withJobLock = async (name, ttlMs, fn) => {
    const lock = await acquireJobLock(name, ttlMs);
    if (!lock) return { skipped: true, reason: 'locked' };
    try {
        return await fn();
    } catch (error) {
        await releaseJobLock(name, error);
        throw error;
    } finally {
        await releaseJobLock(name);
    }
};

module.exports = {
    acquireJobLock,
    releaseJobLock,
    withJobLock,
    acquireLock: acquireJobLock,
    releaseLock: releaseJobLock
};
