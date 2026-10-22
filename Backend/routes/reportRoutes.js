const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { csrfProtection } = require('../middlewares/csrfProtection');
const { createReport, getReports, reviewReport } = require('../controllers/reportController');

router.use(protect); // All report routes need auth

router.post('/', csrfProtection, createReport);

// Admin routes
router.get('/', adminOnly, getReports);
router.patch('/:id/review', adminOnly, csrfProtection, reviewReport);

module.exports = router;
