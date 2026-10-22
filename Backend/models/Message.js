const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({

    sender:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ad:        { type: mongoose.Schema.Types.ObjectId, ref: 'Ad',   required: true },
    conversationId: { type: String, default: '', index: true },

    text:   { type: String, required: true, trim: true, maxlength: 5000 },
    sentAt: { type: Date, default: Date.now },
    failedAt: { type: Date, default: null },
    isDelivered: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },

    // Soft-delete flags per side
    deletedBySender:    { type: Boolean, default: false },
    deletedByRecipient: { type: Boolean, default: false },

    // Archive messages tied to removed listings without destroying evidence.
    adDeletedAt: { type: Date, default: null },
    hiddenReason: { type: String, enum: ['ad_deleted', ''], default: '' }

}, { timestamps: true });

const buildConversationId = (ad, firstUser, secondUser) => {
    const participants = [firstUser.toString(), secondUser.toString()].sort();
    return `${ad.toString()}:${participants[0]}:${participants[1]}`;
};

messageSchema.pre('validate', function () {
    if (!this.conversationId && this.ad && this.sender && this.recipient) {
        this.conversationId = buildConversationId(this.ad, this.sender, this.recipient);
    }
});

messageSchema.statics.buildConversationId = buildConversationId;

// Fast thread lookup: find all messages in a conversation about a specific ad
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ ad: 1, sender: 1, recipient: 1, createdAt: 1 });
messageSchema.index({ recipient: 1, isRead: 1 });
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ ad: 1, createdAt: -1 });
messageSchema.index({ adDeletedAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
