const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { csrfProtection } = require('../middlewares/csrfProtection');
const { validateObjectIdParam } = require('../utils/securityValidation');
const {
    askQuestion,
    answerQuestion,
    getStoreQuestions
} = require('../controllers/questionController');

// Public route
router.get('/store/:storeId', validateObjectIdParam('storeId'), getStoreQuestions);

// Protected routes
router.post('/', protect, csrfProtection, askQuestion);
router.post('/:id/answers', protect, csrfProtection, validateObjectIdParam('id'), answerQuestion);

module.exports = router;
