const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { csrfProtection } = require('../middlewares/csrfProtection');
const { accountChangeLimiter } = require('../utils/abuseGuards');
const { validateObjectIdParam } = require('../utils/securityValidation');
const {
    getUserProfile,
    updatePersonalProfile,
    updateSecuritySettings,
    updatePrivacySettings,
    updateNotificationSettings,
    freezeAccount,
    deleteAccount,
    updateAvatar,
    confirmEmailChange,
    getPublicProfile
} = require('../controllers/userController');

router.route('/profile')
    .all(protect)
    .get(getUserProfile)
    .put(csrfProtection, accountChangeLimiter, updatePersonalProfile);

router.put('/avatar', protect, csrfProtection, updateAvatar);
router.put('/security', protect, csrfProtection, accountChangeLimiter, updateSecuritySettings);
router.post('/confirm-email-change', protect, csrfProtection, accountChangeLimiter, confirmEmailChange);
router.put('/privacy', protect, csrfProtection, updatePrivacySettings);
router.put('/notifications', protect, csrfProtection, updateNotificationSettings);

router.post('/freeze', protect, csrfProtection, accountChangeLimiter, freezeAccount);
router.delete('/delete', protect, csrfProtection, accountChangeLimiter, deleteAccount);

// Public profile lookup. Keep after concrete self-service routes so "/profile" is not treated as an ID.
router.get('/:id', validateObjectIdParam('id'), getPublicProfile);

module.exports = router;
