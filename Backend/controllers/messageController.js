const Message      = require('../models/Message');
const Notification = require('../models/Notification');
const { validateChatMessagePayload } = require('../utils/chatSecurity');
const { validateChatParticipants, isVisibleConversation } = require('../utils/chatGuards');
const { readObjectId, safePageLimit, validateAllowedFields } = require('../utils/securityValidation');

// @desc    Send a message about an ad
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res, next) => {
    try {
        validateAllowedFields(req.body, ['recipientId', 'adId', 'text'], 'body');
        const { recipientId, adId, text } = req.body;

        if (!recipientId || !adId || !text) {
            return res.status(400).json({ message: 'Alıcı, elan və mətn mütləqdir' });
        }

        const validation = validateChatMessagePayload({
            sender: req.user._id,
            recipient: recipientId,
            ad: adId,
            text
        });
        if (!validation.valid) {
            return res.status(400).json({ message: 'Mesaj düzgün formatda deyil' });
        }

        if (recipientId === req.user._id.toString()) {
            return res.status(400).json({ message: 'Özünüzə mesaj göndərə bilməzsiniz' });
        }

        const chatCheck = await validateChatParticipants({
            senderId: req.user._id,
            recipientId,
            adId
        });
        if (!chatCheck.valid) {
            return res.status(chatCheck.status).json({ message: chatCheck.message });
        }

        const message = await Message.create({
            sender:    req.user._id,
            recipient: recipientId,
            ad:        adId,
            text:      validation.sanitizedText
        });

        await message.populate('sender', 'name lastName avatar');

        // Notify recipient
        await Notification.create({
            user:  recipientId,
            type:  'message',
            title: `${req.user.name} mesaj göndərdi`,
            body:  validation.sanitizedText.length > 60 ? validation.sanitizedText.slice(0, 60) + '...' : validation.sanitizedText,
            link:  `/cabinet.html#tab-messages`,
            relatedId:   message._id,
            relatedType: 'Message'
        });

        res.status(201).json(message);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all conversation threads for current user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res, next) => {
    try {
        validateAllowedFields(req.query, ['page', 'limit'], 'query');
        const userId = req.user._id;
        const { page, limit } = safePageLimit(req.query, { defaultLimit: 50, maxLimit: 100 });
        const skip = (page - 1) * limit;

        // Get distinct (ad, other-party) pairs and the latest message in each
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender: userId }, { recipient: userId }],
                    adDeletedAt: null,
                    $and: [
                        {
                            $or: [
                                { sender: userId,    deletedBySender:    false },
                                { recipient: userId, deletedByRecipient: false }
                            ]
                        }
                    ]
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        ad:    '$ad',
                        other: {
                            $cond: [{ $eq: ['$sender', userId] }, '$recipient', '$sender']
                        }
                    },
                    lastMessage: { $first: '$$ROOT' },
                    unread: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ['$recipient', userId] }, { $eq: ['$isRead', false] }] },
                                1, 0
                            ]
                        }
                    }
                }
            },
            { $sort: { 'lastMessage.createdAt': -1 } },
            { $skip: skip },
            { $limit: limit }
        ], { allowDiskUse: true });

        // Populate ad and other-user info
        await Message.populate(conversations, [
            { path: 'lastMessage.ad',        select: 'brand modelName images price status', model: 'Ad' },
            { path: 'lastMessage.sender',     select: 'name lastName avatar status disabled isBlocked isBanned', model: 'User' },
            { path: 'lastMessage.recipient',  select: 'name lastName avatar status disabled isBlocked isBanned', model: 'User' }
        ]);

        res.json({
            conversations: conversations.filter(isVisibleConversation),
            page,
            limit
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get messages in a thread (user + ad pair)
// @route   GET /api/messages/:adId?with=<userId>
// @access  Private
const getMessages = async (req, res, next) => {
    try {
        validateAllowedFields(req.query, ['with', 'page', 'limit'], 'query');
        const { adId }  = req.params;
        const { with: otherUserId } = req.query;

        if (!otherUserId) return res.status(400).json({ message: 'İstifadəçi ID lazımdır (?with=)' });
        const cleanOtherUserId = readObjectId(otherUserId, 'with');

        const userId = req.user._id;
        const { page, limit } = safePageLimit(req.query, { defaultLimit: 50, maxLimit: 100 });

        const chatCheck = await validateChatParticipants({
            senderId: userId,
            recipientId: cleanOtherUserId,
            adId
        });
        if (!chatCheck.valid) {
            return res.status(chatCheck.status).json({ message: chatCheck.message });
        }
        const conversationId = Message.buildConversationId(adId, userId, otherUserId);

        const messages = await Message.find({
            ad: adId,
            adDeletedAt: null,
            $and: [
                {
                    $or: [
                        { conversationId },
                        { sender: userId, recipient: cleanOtherUserId },
                        { sender: cleanOtherUserId, recipient: userId }
                    ]
                },
                {
                    $or: [
                        { sender: userId, deletedBySender: false },
                        { recipient: userId, deletedByRecipient: false }
                    ]
                }
            ]
        })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('sender',    'name lastName avatar')
            .populate('recipient', 'name lastName avatar');

        // Mark incoming messages as read
        const unreadFilter = {
            ad: adId,
            adDeletedAt: null,
            isRead: false,
            sender: cleanOtherUserId,
            recipient: userId,
            $or: [
                { conversationId },
                { conversationId: '' },
                { conversationId: { $exists: false } }
            ]
        };

        const unreadMessages = await Message.find(unreadFilter, '_id');
        
        if (unreadMessages.length > 0) {
            const messageIds = unreadMessages.map(m => m._id);
            const now = new Date();
            
            await Message.updateMany(
                { _id: { $in: messageIds } },
                { $set: { isRead: true, readAt: now, isDelivered: true, deliveredAt: now } }
            );

            const io = req.app.get('io');
            if (io) {
                io.to(cleanOtherUserId.toString()).emit('messages_read', { messageIds, readAt: now });
            }
        }

        res.json({ messages: messages.reverse() });
    } catch (error) {
        next(error);
    }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = async (req, res, next) => {
    try {
        const count = await Message.countDocuments({ recipient: req.user._id, adDeletedAt: null, isRead: false, deletedByRecipient: false });
        res.json({ unread: count });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a message (soft delete for user)
// @route   DELETE /api/messages/:messageId
// @access  Private
const deleteMessage = async (req, res, next) => {
    try {
        const message = await Message.findById(req.params.messageId);
        if (!message) return res.status(404).json({ message: 'Mesaj tapılmadı' });

        const userId = req.user._id.toString();

        if (message.sender.toString() === userId) {
            message.deletedBySender = true;
        } else if (message.recipient.toString() === userId) {
            message.deletedByRecipient = true;
        } else {
            return res.status(403).json({ message: 'Bu mesajı silə bilməzsiniz' });
        }

        await message.save();

        res.json({ message: 'Mesaj silindi' });
    } catch (error) {
        next(error);
    }
};

module.exports = { sendMessage, getConversations, getMessages, getUnreadCount, deleteMessage };
