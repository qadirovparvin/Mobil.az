const mongoose = require('mongoose');

const jobLockSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    owner: { type: String, required: true },
    lockedUntil: { type: Date, required: true },
    lastRunAt: { type: Date, default: null },
    lastFinishedAt: { type: Date, default: null },
    lastError: { type: String, default: '' }
}, { timestamps: true });

jobLockSchema.index({ name: 1, lockedUntil: 1 });

module.exports = mongoose.model('JobLock', jobLockSchema);
