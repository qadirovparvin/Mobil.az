const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { hashToken, validatePasswordStrength } = require('../utils/authSecurity');
const { pickAllowedFields, sanitizePlainText, sanitizeUrl } = require('../utils/sanitizers');
const { normalizeEmail, readString, validateAllowedFields } = require('../utils/securityValidation');
const { toSafeUser } = require('../utils/userSerializer');
const Notification = require('../models/Notification');
const { sendVerificationEmail } = require('../utils/emailService');

const getCurrentPassword = (body) => body.currentPassword || body.oldPassword || '';
const EMAIL_CHANGE_TOKEN_TTL_MS = Number(process.env.EMAIL_CHANGE_TOKEN_TTL_MS || 30 * 60 * 1000);

const verifyCurrentPassword = async (user, currentPassword) => {
    if (!currentPassword) {
        return false;
    }

    return bcrypt.compare(currentPassword, user.password);
};

// @desc    Get user profile/settings
// @route   GET /api/user/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            res.json(toSafeUser(user));
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update user personal info
// @route   PUT /api/user/profile
// @access  Private
const updatePersonalProfile = async (req, res, next) => {
    try {
        validateAllowedFields(req.body, ['name', 'lastName', 'email', 'phone', 'currentPassword', 'oldPassword'], 'body');
        const user = await User.findById(req.user._id).select('+password +pendingEmailTokenHash');
        const updates = pickAllowedFields(req.body, ['name', 'lastName', 'email', 'phone']);

        if (user) {
            if (updates.name !== undefined) {
                const name = sanitizePlainText(updates.name, { maxLength: 80, allowEmpty: false });
                if (!name) return res.status(400).json({ message: 'Ad düzgün deyil' });
                user.name = name;
            }
            if (updates.lastName !== undefined) {
                const lastName = sanitizePlainText(updates.lastName, { maxLength: 80 });
                if (lastName === null) return res.status(400).json({ message: 'Soyad düzgün deyil' });
                user.lastName = lastName;
            }
            if (updates.email) {
                const normalizedEmail = normalizeEmail(updates.email);

                if (normalizedEmail !== user.email) {
                    const currentPassword = getCurrentPassword(req.body);
                    if (!currentPassword) {
                        return res.status(400).json({ message: 'Email dəyişmək üçün cari şifrəni daxil edin' });
                    }

                    const passwordMatches = await verifyCurrentPassword(user, currentPassword);
                    if (!passwordMatches) {
                        return res.status(401).json({ message: 'Cari şifrə yanlışdır' });
                    }

                    const emailExists = await User.findOne({
                        email: normalizedEmail,
                        _id: { $ne: user._id }
                    });
                    if (emailExists) {
                        return res.status(400).json({ message: 'Bu email artıq istifadə olunur' });
                    }

                    const rawToken = crypto.randomBytes(32).toString('hex');
                    user.pendingEmail = normalizedEmail;
                    user.pendingEmailTokenHash = hashToken(rawToken);
                    user.pendingEmailExpiresAt = new Date(Date.now() + EMAIL_CHANGE_TOKEN_TTL_MS);
                    user.pendingEmailRequestedAt = new Date();

                    try {
                        await sendVerificationEmail(normalizedEmail, rawToken);
                    } catch (mailError) {
                        logger.error(`Error sending email change verification to ${normalizedEmail}:`, mailError);
                        return res.status(500).json({ message: 'Email göndərilə bilmədi, lütfən yenidən cəhd edin' });
                    }

                    await Notification.create({
                        user: user._id,
                        type: 'system',
                        title: 'Email dəyişiklik sorğusu',
                        body: 'Hesabınız üçün email dəyişiklik sorğusu başladıldı. Sorğu sizə aid deyilsə, şifrənizi dəyişin.',
                        link: '/cabinet.html#settings'
                    });

                    logger.info(`Email change verification queued for user ${user._id}; pending email hash ${hashToken(normalizedEmail).slice(0, 12)}`);
                } else {
                    user.pendingEmail = '';
                    user.pendingEmailTokenHash = null;
                    user.pendingEmailExpiresAt = null;
                    user.pendingEmailRequestedAt = null;
                }
            }
            if (updates.phone !== undefined) {
                const phone = sanitizePlainText(updates.phone, { maxLength: 40 });
                if (phone === null) return res.status(400).json({ message: 'Telefon düzgün deyil' });
                user.phone = phone;
            }

            const updatedUser = await user.save();

            res.json(toSafeUser(updatedUser));
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update security settings (Password, 2FA)
// @route   PUT /api/user/security
// @access  Private
const updateSecuritySettings = async (req, res, next) => {
    try {
        validateAllowedFields(req.body, ['oldPassword', 'currentPassword', 'newPassword'], 'body');
        const user = await User.findById(req.user._id).select('+password +refreshTokens');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update password if requested. Current password is required for takeover resistance.
        if (req.body.oldPassword || req.body.currentPassword || req.body.newPassword) {
            const currentPassword = getCurrentPassword(req.body);
            if (!currentPassword) {
                return res.status(400).json({ message: 'Şifrəni dəyişmək üçün cari şifrəni daxil edin' });
            }
            if (!req.body.newPassword) {
                return res.status(400).json({ message: 'Yeni şifrəni daxil edin' });
            }

            const passwordErrors = validatePasswordStrength(req.body.newPassword);
            if (passwordErrors.length > 0) {
                return res.status(400).json({
                    message: 'Password does not meet security requirements',
                    errors: passwordErrors
                });
            }

            const isMatch = await verifyCurrentPassword(user, currentPassword);
            
            if (!isMatch) {
                return res.status(401).json({ message: 'Cari şifrə yanlışdır' });
            }

            const isReuse = await bcrypt.compare(req.body.newPassword, user.password);
            if (isReuse) {
                return res.status(400).json({ message: 'Yeni şifrə cari şifrə ilə eyni ola bilməz' });
            }

            const salt = await bcrypt.genSalt(12);
            user.password = await bcrypt.hash(req.body.newPassword, salt);
            user.refreshTokens = [];
            user.tokenVersion = (user.tokenVersion || 0) + 1;
            user.sessionVersion = (user.sessionVersion || 0) + 1;
        }

        await user.save();
        res.json({ message: 'Security settings updated successfully' });

    } catch (error) {
        next(error);
    }
};

// @desc    Update privacy settings
// @route   PUT /api/user/privacy
// @access  Private
const updatePrivacySettings = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (user) {
            const allowed = pickAllowedFields(req.body, ['showPhone', 'allowMessages', 'showOnlineStatus']);
            Object.keys(allowed).forEach((field) => {
                if (typeof allowed[field] === 'boolean') user.privacySettings[field] = allowed[field];
            });
            
            await user.save();
            res.json(user.privacySettings);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update notification settings
// @route   PUT /api/user/notifications
// @access  Private
const updateNotificationSettings = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        
        if (user) {
            const allowed = pickAllowedFields(req.body, ['emailMessages', 'emailAdStatus', 'emailMarketing']);
            Object.keys(allowed).forEach((field) => {
                if (typeof allowed[field] === 'boolean') user.notificationSettings[field] = allowed[field];
            });
            
            await user.save();
            res.json(user.notificationSettings);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Freeze account
// @route   POST /api/user/freeze
// @access  Private
const freezeAccount = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id).select('+refreshTokens');
        
        if (user) {
            user.status = 'frozen';
            user.refreshTokens = [];
            user.tokenVersion = (user.tokenVersion || 0) + 1;
            user.sessionVersion = (user.sessionVersion || 0) + 1;
            // Here you would also write logic to hide user's ads
            await user.save();
            res.json({ message: 'Account successfully frozen' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Delete account (Soft delete)
// @route   DELETE /api/user/delete
// @access  Private
const deleteAccount = async (req, res, next) => {
    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    try {
        const user = await User.findById(req.user._id).select('+refreshTokens');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        await session.withTransaction(async () => {
            user.status = 'deleted';
            user.refreshTokens = [];
            user.tokenVersion = (user.tokenVersion || 0) + 1;
            user.sessionVersion = (user.sessionVersion || 0) + 1;
            await user.save({ session });

            const Ad = require('../models/Ad');
            const { softDeleteAd, DELETED_AD_STATUS } = require('../utils/adLifecycle');
            
            const userAds = await Ad.find({ author: user._id, status: { $ne: DELETED_AD_STATUS } }).session(session);
            const adIds = userAds.map(ad => ad._id);
            if (adIds.length > 0) {
                const deletedAt = new Date();
                await Ad.updateMany({ _id: { $in: adIds } }, { $set: { status: DELETED_AD_STATUS, deletedAt, deletedBy: user._id, deletionReason: 'İstifadəçi hesabı silindi', promotionType: 'none', promotionExpiresAt: null } }, { session });
                await User.updateMany({ favorites: { $in: adIds } }, { $pull: { favorites: { $in: adIds } } }, { session });
                const Message = require('../models/Message');
                await Message.updateMany({ ad: { $in: adIds }, adDeletedAt: null }, { $set: { adDeletedAt: deletedAt, hiddenReason: 'ad_deleted' } }, { session });
            }
        });

        res.json({ message: 'Account successfully deleted' });
    } catch (error) {
        next(error);
    } finally {
        await session.endSession();
    }
};

// @desc    Update user avatar
// @route   PUT /api/user/avatar
// @access  Private
const updateAvatar = async (req, res, next) => {
    try {
        validateAllowedFields(req.body, ['avatarUrl'], 'body');
        const { avatarUrl } = req.body;
        const sanitizedAvatar = sanitizeUrl(avatarUrl, { allowEmpty: false });
        if (!sanitizedAvatar) {
            return res.status(400).json({ message: 'Avatar URL is required' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.avatar = sanitizedAvatar;
        await user.save();

        res.json({ message: 'Avatar updated', avatar: user.avatar });
    } catch (error) {
        next(error);
    }
};

// @desc    Get public user profile by ID
// @route   GET /api/user/:id
// @access  Public
const getPublicProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .select('name lastName avatar rating reviewCount createdAt activePackage isOnline lastActive privacySettings');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const publicUser = user.toObject();
        if (publicUser.privacySettings && publicUser.privacySettings.showOnlineStatus === false) {
            delete publicUser.isOnline;
            delete publicUser.lastActive;
        }
        delete publicUser.privacySettings;

        res.json(publicUser);
    } catch (error) {
        next(error);
    }
};

// @desc    Confirm a pending email change using the verification token sent to the new email
// @route   POST /api/user/confirm-email-change
// @access  Private
const confirmEmailChange = async (req, res, next) => {
    try {
        validateAllowedFields(req.body, ['token'], 'body');
        const token = readString(req.body.token, { fieldName: 'token', required: true, maxLength: 128 });
        const user = await User.findOne({
            _id: req.user._id,
            pendingEmailTokenHash: hashToken(token),
            pendingEmailExpiresAt: { $gt: new Date() }
        }).select('+pendingEmailTokenHash +refreshTokens');

        if (!user || !user.pendingEmail) {
            return res.status(400).json({ message: 'Email təsdiq tokeni keçərsizdir və ya vaxtı bitib' });
        }

        const emailExists = await User.findOne({
            email: user.pendingEmail,
            _id: { $ne: user._id }
        });
        if (emailExists) {
            return res.status(400).json({ message: 'Email dəyişdirilə bilmədi' });
        }

        user.email = user.pendingEmail;
        user.pendingEmail = '';
        user.pendingEmailTokenHash = null;
        user.pendingEmailExpiresAt = null;
        user.pendingEmailRequestedAt = null;
        user.isVerified = true;
        user.refreshTokens = [];
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        user.sessionVersion = (user.sessionVersion || 0) + 1;
        await user.save();

        res.json({ message: 'Email təsdiqləndi', user: toSafeUser(user) });
    } catch (error) {
        next(error);
    }
};

module.exports = {
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
};
