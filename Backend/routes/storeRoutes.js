const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { csrfProtection } = require('../middlewares/csrfProtection');
const { validateObjectIdParam } = require('../utils/securityValidation');
const {
    createStore, getStoreById, getStoreListings, getStores, getAllStores,
    getMyStore, updateStore, addReview, getReviews, deleteStore
} = require('../controllers/storeController');

// Public
router.get('/',    getStores);

// Protected — must come before /:id
router.get('/my',  protect, getMyStore);

// Public
router.get('/:id',          validateObjectIdParam('id'), getStoreById);
router.get('/:id/listings', validateObjectIdParam('id'), getStoreListings);
router.get('/:id/reviews',  validateObjectIdParam('id'), getReviews);

// Protected
router.post('/',              protect, csrfProtection, createStore);
router.put('/:id',            protect, csrfProtection, validateObjectIdParam('id'), updateStore);
router.post('/:id/reviews',   protect, csrfProtection, validateObjectIdParam('id'), addReview);
router.delete('/:id',         protect, csrfProtection, validateObjectIdParam('id'), deleteStore);

module.exports = router;
