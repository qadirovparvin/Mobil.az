const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    identifier: { type: String, required: true },          // phone or email
    codeHash:   { type: String, required: true },
    plainCode:  { type: String },                         // Plaintext code stored in non-production for dev visibility
    type:       { type: String, enum: ['sms', 'email'], required: true },
    expiresAt:  { type: Date, required: true },  // TTL auto-delete
}, { timestamps: true });

// TTL auto-delete index
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index: one active OTP per identifier+type
otpSchema.index({ identifier: 1, type: 1 });

module.exports = mongoose.model('Otp', otpSchema);
