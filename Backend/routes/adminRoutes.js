const express = require('express');
const router = express.Router();
const {
    getAdminStats, getAllUsers, getAllAds, getAllTransactions,
    updateAdStatus, deleteUser, updateUserStatus, deleteAd
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.use(protect); // All routes below require login
router.use(adminOnly); // All routes below require admin role

router.get('/stats',            getAdminStats);
router.get('/users',            getAllUsers);
router.delete('/users/:id',     deleteUser);
router.patch('/users/:id/status', updateUserStatus);
router.get('/ads',              getAllAds);
router.put('/ads/:id/status',   updateAdStatus);
router.delete('/ads/:id',       deleteAd);
router.get('/transactions',     getAllTransactions);

module.exports = router;
