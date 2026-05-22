const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { addReview, getReviews } = require('../controllers/reviewController');

router.get('/:targetUserId', getReviews);
router.post('/', protect, addReview);

module.exports = router;
