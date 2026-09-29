const express = require('express');
const router  = express.Router();
const { protect, optionalProtect } = require('../middlewares/authMiddleware');
const { csrfProtection } = require('../middlewares/csrfProtection');
const { adListLimiter } = require('../middlewares/rateLimiter');
const { validateObjectIdParam } = require('../utils/securityValidation');
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
router.post('/',          protect, csrfProtection, createAd);
router.put('/:id',        protect, csrfProtection, validateObjectIdParam('id'), updateAd);
router.delete('/:id',     protect, csrfProtection, validateObjectIdParam('id'), deleteAd);
router.post('/:id/boost', protect, validateObjectIdParam('id'), boostAd);
router.post('/:id/favorite', protect, csrfProtection, validateObjectIdParam('id'), toggleFavorite);

module.exports = router;
