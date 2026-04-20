const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    createStore, getStoreById, getStores,
    getMyStore, updateStore, addReview, getReviews
} = require('../controllers/storeController');

// Public
router.get('/',    getStores);

// Protected — must come before /:id
router.get('/my',  protect, getMyStore);

// Public
router.get('/:id',         getStoreById);
router.get('/:id/reviews', getReviews);

// Protected
router.post('/',              protect, createStore);
router.put('/:id',            protect, updateStore);
router.post('/:id/reviews',   protect, addReview);

module.exports = router;
