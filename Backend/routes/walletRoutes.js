const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { csrfProtection } = require('../middlewares/csrfProtection');
const {
    getBalance,
    topUp,
    purchasePackage,
    createPackagePaymentSession,
    handlePaymentCallback,
    mockCheckoutPage,
    getPackages,
    getTransactions,
    getPaymentSessionStatus,
    requestCashOut,
    adminReviewCashOut
} = require('../controllers/walletController');

const extractWebhookMetadata = (req, res, next) => {
    req.paymentSignature = req.get('x-payment-signature') || req.get('x-webhook-signature') || '';
    if (!req.rawBody && req.body) {
        req.rawBody = Buffer.from(JSON.stringify(req.body));
    }
    next();
};

router.get('/payments/:paymentId/mock-checkout', mockCheckoutPage);
// Public payment gateway callback: must remain unauthenticated by JWT, signature verification is strictly fail-closed
router.post('/payments/:paymentId/callback', extractWebhookMetadata, handlePaymentCallback);
router.post('/callback/payriff/:paymentId', extractWebhookMetadata, handlePaymentCallback);
router.post('/callback/payriff', extractWebhookMetadata, (req, res, next) => {
    if (req.body?.sessionId && !req.params.paymentId) {
        req.params.paymentId = req.body.sessionId;
    }
    handlePaymentCallback(req, res, next);
});

router.use(protect);  // All wallet routes are private

router.get('/payment-session/:sessionId', getPaymentSessionStatus);
router.get('/balance',      getBalance);
router.get('/packages',     getPackages);
router.post('/topup',       csrfProtection, topUp);
router.post('/packages/purchase', csrfProtection, purchasePackage);
router.post('/packages/payment-session', csrfProtection, createPackagePaymentSession);
router.get('/transactions', getTransactions);
router.post('/cash-out', csrfProtection, requestCashOut);

const { adminOnly } = require('../middlewares/authMiddleware');
router.patch('/cash-out/:id/review', adminOnly, csrfProtection, adminReviewCashOut);

module.exports = router;
