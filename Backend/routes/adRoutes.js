const express = require('express');
const router  = express.Router();
const { protect, optionalProtect } = require('../middlewares/authMiddleware');
const { csrfProtection } = require('../middlewares/csrfProtection');
const { adListLimiter } = require('../middlewares/rateLimiter');
const { validateObjectIdParam } = require('../utils/securityValidation');
const { upload, processImage, MAX_UPLOAD_FILES } = require('../middlewares/uploadMiddleware');
const {
    getAds, getAdById, createAd, updateAd,
    deleteAd, getMyAds, boostAd, toggleFavorite, getFavoriteAds
} = require('../controllers/adController');

// Public
router.get('/',    adListLimiter, getAds);

// Protected — must come before /:id to avoid route clash
router.get('/my',  protect, getMyAds);
router.get('/user', protect, getMyAds);
router.get('/favorites', protect, getFavoriteAds);

// Public
router.get('/:id', adListLimiter, validateObjectIdParam('id'), optionalProtect, getAdById);

// Protected
router.post('/',          protect, csrfProtection, upload.array('images', MAX_UPLOAD_FILES), processImage, createAd);
router.put('/:id',        protect, csrfProtection, validateObjectIdParam('id'), upload.array('images', MAX_UPLOAD_FILES), processImage, updateAd);
router.delete('/:id',     protect, csrfProtection, validateObjectIdParam('id'), deleteAd);
router.post('/:id/boost', protect, csrfProtection, validateObjectIdParam('id'), boostAd);
router.post('/:id/favorite', protect, csrfProtection, validateObjectIdParam('id'), toggleFavorite);

module.exports = router;
