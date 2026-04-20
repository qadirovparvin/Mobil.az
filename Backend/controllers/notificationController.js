const Notification = require('../models/Notification');

// @desc    Get notifications for current user (paginated)
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20, unreadOnly } = req.query;
        const filter = { user: req.user._id };
        if (unreadOnly === 'true') filter.isRead = false;

        const skip  = (Number(page) - 1) * Number(limit);
        const total = await Notification.countDocuments(filter);
        const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.json({
            notifications,
            unreadCount,
            page:  Number(page),
            pages: Math.ceil(total / Number(limit)),
            total
        });
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) return res.status(404).json({ message: 'Bildiriş tapılmadı' });

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
        res.json({ message: 'Bütün bildirişlər oxunmuş kimi işarələndi' });
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        res.json({ message: 'Bildiriş silindi' });
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
