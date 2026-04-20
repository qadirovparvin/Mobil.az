const Message      = require('../models/Message');
const Ad           = require('../models/Ad');
const Notification = require('../models/Notification');

// @desc    Send a message about an ad
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
    try {
        const { recipientId, adId, text } = req.body;

        if (!recipientId || !adId || !text) {
            return res.status(400).json({ message: 'Alıcı, elan və mətn mütləqdir' });
        }

        if (recipientId === req.user._id.toString()) {
            return res.status(400).json({ message: 'Özünüzə mesaj göndərə bilməzsiniz' });
        }

        const ad = await Ad.findById(adId);
        if (!ad) return res.status(404).json({ message: 'Elan tapılmadı' });

        const message = await Message.create({
            sender:    req.user._id,
            recipient: recipientId,
            ad:        adId,
            text:      text.trim()
        });

        await message.populate('sender', 'name lastName avatar');

        // Notify recipient
        await Notification.create({
            user:  recipientId,
            type:  'message',
            title: `${req.user.name} mesaj göndərdi`,
            body:  text.length > 60 ? text.slice(0, 60) + '...' : text,
            link:  `/cabinet.html#messages`,
            relatedId:   message._id,
            relatedType: 'Message'
        });

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Get all conversation threads for current user
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        // Get distinct (ad, other-party) pairs and the latest message in each
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender: userId }, { recipient: userId }],
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
            { $sort: { 'lastMessage.createdAt': -1 } }
        ]);

        // Populate ad and other-user info
        await Message.populate(conversations, [
            { path: 'lastMessage.ad',        select: 'brand modelName images price', model: 'Ad' },
            { path: 'lastMessage.sender',     select: 'name lastName avatar',        model: 'User' },
            { path: 'lastMessage.recipient',  select: 'name lastName avatar',        model: 'User' }
        ]);

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Get messages in a thread (user + ad pair)
// @route   GET /api/messages/:adId?with=<userId>
// @access  Private
const getMessages = async (req, res) => {
    try {
        const { adId }  = req.params;
        const { with: otherUserId } = req.query;

        if (!otherUserId) return res.status(400).json({ message: 'İstifadəçi ID lazımdır (?with=)' });

        const userId = req.user._id;

        const messages = await Message.find({
            ad: adId,
            $or: [
                { sender: userId,    recipient: otherUserId },
                { sender: otherUserId, recipient: userId }
            ]
        })
            .sort({ createdAt: 1 })
            .populate('sender',    'name lastName avatar')
            .populate('recipient', 'name lastName avatar');

        // Mark incoming messages as read
        await Message.updateMany(
            { ad: adId, sender: otherUserId, recipient: userId, isRead: false },
            { isRead: true }
        );

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = async (req, res) => {
    try {
        const count = await Message.countDocuments({ recipient: req.user._id, isRead: false });
        res.json({ unread: count });
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

module.exports = { sendMessage, getConversations, getMessages, getUnreadCount };
