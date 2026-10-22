const Notification = require('../models/Notification');
const { readBoolean, safePageLimit, validateAllowedFields } = require('../utils/securityValidation');

// @desc    Get notifications for current user (paginated)
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
    try {
        validateAllowedFields(req.query, ['page', 'limit', 'unreadOnly'], 'query');
        const { page = 1, limit = 20, unreadOnly } = req.query;
        const paging = safePageLimit({ page, limit }, { defaultLimit: 20, maxLimit: 100 });
        const filter = { user: req.user._id };
        if (readBoolean(unreadOnly, { fieldName: 'unreadOnly' }) === true) filter.isRead = false;

        const total = await Notification.countDocuments(filter);
        const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip(paging.skip)
            .limit(paging.limit);

        res.json({
            notifications,
            unreadCount,
            page:  paging.page,
            pages: Math.ceil(total / paging.limit),
            total
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) return res.status(404).json({ message: 'Bildiriş tapılmadı' });

        res.json(notification);
    } catch (error) {
        next(error);
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
        res.json({ message: 'Bütün bildirişlər oxunmuş kimi işarələndi', unreadCount: 0 });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res, next) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        res.json({ message: 'Bildiriş silindi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = async (req, res, next) => {
    try {
        const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
        res.json({ count });
    } catch (error) {
        next(error);
    }
};

module.exports = { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification };
