const Ad = require('../models/Ad');
const User = require('../models/User');
const { isAccountAllowed } = require('./accountSecurity');
const { DELETED_AD_STATUS } = require('./adLifecycle');

const CHAT_USER_FIELDS = 'name lastName avatar status disabled isBlocked isBanned';

const validateChatParticipants = async ({ senderId, recipientId, adId }) => {
    const [ad, sender, recipient] = await Promise.all([
        Ad.findOne({ _id: adId, status: { $ne: DELETED_AD_STATUS } }).select('_id author status'),
        User.findById(senderId).select(CHAT_USER_FIELDS),
        User.findById(recipientId).select(CHAT_USER_FIELDS)
    ]);

    if (!ad) {
        return { valid: false, status: 404, message: 'Elan tapılmadı' };
    }
    
    if (ad.author.toString() !== senderId.toString() && ad.author.toString() !== recipientId.toString()) {
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
    const ad = lastMessage?.ad;
    const sender = lastMessage?.sender;
    const recipient = lastMessage?.recipient;

    return Boolean(
        ad &&
        ad.status !== DELETED_AD_STATUS &&
        isAccountAllowed(sender) &&
        isAccountAllowed(recipient)
    );
};

module.exports = {
    CHAT_USER_FIELDS,
    validateChatParticipants,
    isVisibleConversation
};
