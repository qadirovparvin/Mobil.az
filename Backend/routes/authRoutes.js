const express = require('express');
const router  = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { loginLimiter, passwordResetLimiter } = require('../middlewares/rateLimiter');
const { csrfProtection, csrfTokenHandler, validateOrigin } = require('../middlewares/csrfProtection');
const {
    accountChangeLimiter,
    registrationIdentifierLimiter,
    verificationIdentifierLimiter
} = require('../utils/abuseGuards');
const {
    register, login, refreshToken, logout, logoutAll, getMe,
    sendOtp, verifyOtp, verifyEmailLink, resendVerificationEmail,
    forgotPassword, resetPassword,
    enrollTwoFactor, confirmTwoFactor, disableTwoFactor, regenerateRecoveryCodes,
    getMockOtp,
    googleAuth, facebookAuth, getOAuthConfig
} = require('../controllers/authController');

router.get('/csrf-token', csrfTokenHandler);
router.get('/oauth-config', getOAuthConfig);
router.post('/google',   loginLimiter, googleAuth);
router.post('/facebook', loginLimiter, facebookAuth);
router.post('/register', registrationIdentifierLimiter, register);
router.post('/login',    loginLimiter, login);
router.post('/refresh',       validateOrigin, refreshToken);
router.post('/refresh-token', validateOrigin, refreshToken);
router.post('/logout',   csrfProtection, logout);
router.post('/logout-all', protect, csrfProtection, accountChangeLimiter, logoutAll);
router.get('/me',        protect, getMe);
router.get('/verify-email', verifyEmailLink);
router.post('/resend-verification', verificationIdentifierLimiter, resendVerificationEmail);

// OTP
router.post('/send-otp',   verificationIdentifierLimiter, sendOtp);
router.post('/verify-otp', verificationIdentifierLimiter, verifyOtp);
if (process.env.NODE_ENV !== 'production') {
    router.get('/mock-otp/:identifier', getMockOtp); // Development only
}

// Password Reset
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/resend-reset',    passwordResetLimiter, forgotPassword);
router.post('/reset-password',  resetPassword);

// TOTP 2FA
router.post('/2fa/enroll',         protect, csrfProtection, accountChangeLimiter, enrollTwoFactor);
router.post('/2fa/confirm',        protect, csrfProtection, accountChangeLimiter, confirmTwoFactor);
router.post('/2fa/disable',        protect, csrfProtection, accountChangeLimiter, disableTwoFactor);
router.post('/2fa/recovery-codes', protect, csrfProtection, accountChangeLimiter, regenerateRecoveryCodes);

module.exports = router;
