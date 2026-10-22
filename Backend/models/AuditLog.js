const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    targetModel: { type: String, required: true, index: true },
    target: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    action: { type: String, required: true, index: true },
    previousState: { type: mongoose.Schema.Types.Mixed, default: null },
    newState: { type: mongoose.Schema.Types.Mixed, default: null },
    reason: { type: String, default: '' },
    requestId: { type: String, default: '', index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
    ip: { type: String, default: '' },
    userAgent: { type: String, default: '' }
}, { timestamps: true });

auditLogSchema.index({ targetModel: 1, target: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });

auditLogSchema.pre('save', function preventAuditMutation(next) {
    if (!this.isNew) {
        const error = new Error('Audit logs are immutable');
        error.status = 403;
        if (typeof next === 'function') return next(error);
        throw error;
    }
    if (typeof next === 'function') next();
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
