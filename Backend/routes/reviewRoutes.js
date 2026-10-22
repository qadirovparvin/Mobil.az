const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { csrfProtection } = require('../middlewares/csrfProtection');
const { validateObjectIdParam } = require('../utils/securityValidation');
const { addReview, getReviews } = require('../controllers/reviewController');

router.get('/:targetUserId', validateObjectIdParam('targetUserId'), getReviews);
router.post('/', protect, csrfProtection, addReview);

module.exports = router;
