const Ad = require('../models/Ad');
const User = require('../models/User');
const { isAccountAllowed } = require('./accountSecurity');
const { DELETED_AD_STATUS } = require('./adLifecycle');

const CHAT_USER_FIELDS = 'name lastName avatar status disabled isBlocked isBanned';

const validateChatParticipants = async ({ senderId, recipientId, adId }, { allowDeletedAd = false } = {}) => {
    const adQuery = allowDeletedAd
        ? { _id: adId }
        : { _id: adId, status: { $ne: DELETED_AD_STATUS } };

    const [ad, sender, recipient] = await Promise.all([
        Ad.findOne(adQuery).select('_id author status'),
        User.findById(senderId).select(CHAT_USER_FIELDS),
        User.findById(recipientId).select(CHAT_USER_FIELDS)
    ]);

    if (!ad && !allowDeletedAd) {
        return { valid: false, status: 404, message: 'Elan tapılmadı' };
    }
    
    if (ad && ad.author.toString() !== senderId.toString() && ad.author.toString() !== recipientId.toString() && !allowDeletedAd) {
        return { valid: false, status: 403, message: 'Yalnız elan sahibi ilə mesajlaşmaq mümkündür' };
    }

    if (!sender || !isAccountAllowed(sender)) {
        return { valid: false, status: 403, message: 'Account is blocked or inactive' };
    }
    if (!recipient || !isAccountAllowed(recipient)) {
        return { valid: false, status: 403, message: 'Alıcı hesabı aktiv deyil' };
    }

    return { valid: true, ad, sender, recipient };
};

const isVisibleConversation = (conversation) => {
    const lastMessage = conversation?.lastMessage;
    if (!lastMessage) return false;
    const sender = lastMessage.sender;
    const recipient = lastMessage.recipient;

    // Participants must be valid accounts (not banned/deleted)
    return Boolean(
        (!sender || isAccountAllowed(sender)) &&
        (!recipient || isAccountAllowed(recipient))
    );
};

module.exports = {
    CHAT_USER_FIELDS,
    validateChatParticipants,
    isVisibleConversation
};
