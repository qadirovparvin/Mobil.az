const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    sendMessage, getConversations, getMessages, getUnreadCount
} = require('../controllers/messageController');

router.use(protect);  // All message routes are private

router.post('/',                   sendMessage);
router.get('/conversations',       getConversations);
router.get('/unread-count',        getUnreadCount);
router.get('/:adId',               getMessages);   // ?with=<userId>

module.exports = router;
