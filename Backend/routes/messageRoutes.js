const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { csrfProtection } = require('../middlewares/csrfProtection');
const { validateObjectIdParam } = require('../utils/securityValidation');
const {
    sendMessage, getConversations, getMessages, getUnreadCount, deleteMessage
} = require('../controllers/messageController');

router.use(protect);  // All message routes are private

router.post('/',                   csrfProtection, sendMessage);
router.get('/conversations',       getConversations);
router.get('/unread-count',        getUnreadCount);
router.get('/:adId',               validateObjectIdParam('adId'), getMessages);   // ?with=<userId>
router.delete('/:messageId',       csrfProtection, validateObjectIdParam('messageId'), deleteMessage);

module.exports = router;
