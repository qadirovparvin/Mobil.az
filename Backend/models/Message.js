const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({

    sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ad:        { type: mongoose.Schema.Types.ObjectId, ref: 'Ad',   required: true },

    text:   { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false },

    // Soft-delete flags per side
    deletedBySender:    { type: Boolean, default: false },
    deletedByRecipient: { type: Boolean, default: false }

}, { timestamps: true });

// Fast thread lookup: find all messages in a conversation about a specific ad
messageSchema.index({ ad: 1, sender: 1, recipient: 1, createdAt: 1 });
messageSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Message', messageSchema);
