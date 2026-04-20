const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    getUserProfile,
    updatePersonalProfile,
    updateSecuritySettings,
    updatePrivacySettings,
    updateNotificationSettings,
    freezeAccount,
    deleteAccount
} = require('../controllers/userController');

// All routes here are protected
router.use(protect);

router.route('/profile')
    .get(getUserProfile)
    .put(updatePersonalProfile);

router.put('/security', updateSecuritySettings);
router.put('/privacy', updatePrivacySettings);
router.put('/notifications', updateNotificationSettings);

router.post('/freeze', freezeAccount);
router.delete('/delete', deleteAccount);

module.exports = router;
