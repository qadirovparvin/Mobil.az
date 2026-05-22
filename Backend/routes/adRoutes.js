const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    getAds, getAdById, createAd, updateAd,
    deleteAd, getMyAds, boostAd, toggleFavorite, getFavoriteAds
} = require('../controllers/adController');

// Public
router.get('/',    getAds);

// Protected — must come before /:id to avoid route clash
router.get('/my',  protect, getMyAds);
router.get('/favorites', protect, getFavoriteAds);

// Public
router.get('/:id', getAdById);

// Protected
router.post('/',          protect, createAd);
router.put('/:id',        protect, updateAd);
router.delete('/:id',     protect, deleteAd);
router.post('/:id/boost', protect, boostAd);
router.post('/:id/favorite', protect, toggleFavorite);

module.exports = router;
