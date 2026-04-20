const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    getNotifications, markAsRead, markAllAsRead, deleteNotification
} = require('../controllers/notificationController');

router.use(protect);  // All notification routes are private

router.get('/',               getNotifications);
router.put('/read-all',       markAllAsRead);
router.put('/:id/read',       markAsRead);
router.delete('/:id',         deleteNotification);

module.exports = router;
