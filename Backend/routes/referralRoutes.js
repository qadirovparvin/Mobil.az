const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { getReferralStats } = require('../controllers/referralController');

router.get('/stats', protect, getReferralStats);

module.exports = router;
