const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    type: {
        type: String,
        enum: ['message', 'ad_status', 'promo', 'referral', 'system', 'review'],
        required: true
    },

    title: { type: String, required: true },
    body:  { type: String, required: true },

    isRead: { type: Boolean, default: false },

    // Optional deep-link for the frontend (e.g. `/cabinet.html#messages`)
    link: { type: String, default: '' },

    // Optional related document reference
    relatedId:   { type: mongoose.Schema.Types.ObjectId, default: null },
    relatedType: { type: String, default: '' }

}, { timestamps: true });

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
