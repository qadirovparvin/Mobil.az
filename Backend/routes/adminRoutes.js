const express = require('express');
const router = express.Router();
const {
    getAdminStats, getAllUsers, getUserDetails, getAllAds, getAllTransactions,
    updateAdStatus, deleteUser, updateUserStatus, banUser, revokeUserSessions, deleteAd, purgeAd,
    getAllStores, updateStoreStatus, deleteStore, getAuditLogs, getKycDocument,
    getPaymentSessions, getPendingPayments, reconcileSingleSession
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { csrfProtection } = require('../middlewares/csrfProtection');
const { validateObjectIdParam } = require('../utils/securityValidation');

router.use(protect); // All routes below require login
router.use(adminOnly); // All routes below require admin role

router.get('/payment-sessions', protect, adminOnly, getPaymentSessions);
router.get('/payment-sessions/pending', protect, adminOnly, getPendingPayments);
router.post('/payment-sessions/:id/reconcile', protect, adminOnly, reconcileSingleSession);

router.get('/verify', (req, res) => {
    res.json({
        authorized: true,
        role: 'admin'
    });
});

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.get('/users/:id', validateObjectIdParam('id'), getUserDetails);
router.get('/users/:id/details', validateObjectIdParam('id'), getUserDetails);
router.delete('/users/:id', csrfProtection, validateObjectIdParam('id'), deleteUser);
router.patch('/users/:id/status', csrfProtection, validateObjectIdParam('id'), updateUserStatus);
router.put('/users/:id/status', csrfProtection, validateObjectIdParam('id'), updateUserStatus);
router.put('/users/:id/ban', csrfProtection, validateObjectIdParam('id'), banUser);
router.patch('/users/:id/ban', csrfProtection, validateObjectIdParam('id'), banUser);
router.post('/users/:id/revoke-sessions', csrfProtection, validateObjectIdParam('id'), revokeUserSessions);
router.get('/ads', getAllAds);
router.put('/ads/:id/status', csrfProtection, validateObjectIdParam('id'), updateAdStatus);
router.delete('/ads/:id', csrfProtection, validateObjectIdParam('id'), deleteAd);
router.delete('/ads/:id/purge', csrfProtection, validateObjectIdParam('id'), purgeAd);
router.get('/transactions', getAllTransactions);
router.get('/audit-logs', getAuditLogs);
router.get('/stores', getAllStores);
router.patch('/stores/:id', csrfProtection, validateObjectIdParam('id'), updateStoreStatus);
router.get('/stores/:id/kyc/:kind', validateObjectIdParam('id'), getKycDocument);
router.delete('/stores/:id', csrfProtection, validateObjectIdParam('id'), deleteStore);

module.exports = router;
