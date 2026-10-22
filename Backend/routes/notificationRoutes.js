const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { csrfProtection } = require('../middlewares/csrfProtection');
const { validateObjectIdParam } = require('../utils/securityValidation');
const {
    getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification
} = require('../controllers/notificationController');

router.use(protect);  // All notification routes are private

router.get('/',               getNotifications);
router.get('/unread-count',   getUnreadCount);
router.put('/read-all',       csrfProtection, markAllAsRead);
router.put('/:id/read',       csrfProtection, validateObjectIdParam('id'), markAsRead);
router.delete('/:id',         csrfProtection, validateObjectIdParam('id'), deleteNotification);

module.exports = router;
