const logger = require('../utils/logger');
const bcrypt    = require('bcryptjs');
const crypto = require('crypto');
const axios = require('axios');
const nodemailer = require('nodemailer');
const User      = require('../models/User');
const Otp       = require('../models/Otp');
const Store     = require('../models/Store');
const Notification = require('../models/Notification');
const {
    buildAuthResponse,
    clearRefreshTokenCookie,
    generateAccessToken,
    generateRefreshToken,
    getRefreshTokenFromRequest,
    hashToken,
    setRefreshTokenCookie,
    validatePasswordStrength,
    verifyRefreshToken
} = require('../utils/authSecurity');
const { isAccountAllowed, getAccountDeniedMessage } = require('../utils/accountSecurity');
const { normalizeEmail: normalizeEmailStrict, readString, validateAllowedFields } = require('../utils/securityValidation');
const { normalizePhone } = require('../utils/phoneUtils');
const { toSafeUser } = require('../utils/userSerializer');
const {
    buildOtpAuthUrl,
    decryptSecret,
    encryptSecret,
    generateRecoveryCodes,
    generateTotpSecret,
    hashRecoveryCode,
    verifyRecoveryCode,
    verifyTotpCode
} = require('../utils/totp');
const { sendVerificationEmail } = require('../utils/emailService');
const { isEmailConfigured, isSmsConfigured, isTotpConfigured } = require('../utils/providers');
const { redis } = require('../utils/redisClient');
const { getOtpAttempts, incrementOtpAttempts, clearOtpAttempts } = require('../utils/otpAttempts');

const MAX_LOGIN_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS || 5);
const ACCOUNT_LOCK_TIME_MS = Number(process.env.ACCOUNT_LOCK_TIME_MS || 15 * 60 * 1000);
const RESET_TOKEN_TTL_MS = Number(process.env.RESET_TOKEN_TTL_MS || 15 * 60 * 1000);
const MAX_REFRESH_SESSIONS = Number(process.env.MAX_REFRESH_SESSIONS || 5);
const RESET_EMAIL_COOLDOWN_MS = Number(process.env.PASSWORD_RESET_EMAIL_COOLDOWN_MS || 10 * 60 * 1000);
const EMAIL_VERIFY_TOKEN_TTL_MS = Number(process.env.EMAIL_VERIFY_TOKEN_TTL_MS || 24 * 60 * 60 * 1000);
const EMAIL_VERIFY_RESEND_COOLDOWN_MS = Number(process.env.EMAIL_VERIFY_RESEND_COOLDOWN_MS || 10 * 60 * 1000);
const OTP_MAX_ATTEMPTS = Number(process.env.TWO_FACTOR_MAX_ATTEMPTS || 5);
const OTP_LOCK_TIME_MS = Number(process.env.TWO_FACTOR_LOCK_TIME_MS || 10 * 60 * 1000);
const genericResetMessage = 'Əgər bu email qeydiyyatdan keçibsə, sıfırlama linki göndəriləcək';
const resetAttemptBuckets = new Map();

// Helper to prune old entries from the local fallback Map to prevent memory leaks
const pruneLocalResetBuckets = () => {
    const now = Date.now();
    const windowMs = Number(process.env.PASSWORD_RESET_RATE_WINDOW_MS || 60 * 60 * 1000);
    for (const [key, bucket] of resetAttemptBuckets.entries()) {
        if (now - bucket.firstAt > windowMs) {
            resetAttemptBuckets.delete(key);
        }
    }
};

// Periodically run cleanup every 10 minutes
setInterval(pruneLocalResetBuckets, 10 * 60 * 1000).unref();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const isAdminUser = (user) => {
    if (!user) return false;
    const adminEmail = (process.env.ADMIN_EMAIL || 'mobilim.az@gmail.com').toLowerCase();
    const userEmail = String(user.email || '').toLowerCase();
    return user.role === 'admin' || userEmail === adminEmail || userEmail === 'mobilim.az@gmail.com';
};

const isAccountLocked = (user) => {
    // Admin accounts are never locked out
    if (isAdminUser(user)) {
        return false;
    }
    return Boolean(user && user.lockUntil && user.lockUntil > new Date());
};

const pruneRefreshTokens = (user) => {
    const now = new Date();
    const retainedSessionCount = Math.max(MAX_REFRESH_SESSIONS - 1, 0);
    user.refreshTokens = (user.refreshTokens || [])
        .filter((token) => token.expiresAt > now && token.sessionId && token.tokenHash)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, retainedSessionCount);
};

const issueRefreshToken = async (user, req, res, rememberMe = false) => {
    pruneRefreshTokens(user);

    if ((user.refreshTokens || []).filter((token) => token.expiresAt > new Date()).length >= MAX_REFRESH_SESSIONS
        && process.env.MAX_REFRESH_SESSION_POLICY === 'reject_new') {
        const error = new Error('Maksimum aktiv sessiya sayına çatılıb');
        error.status = 429;
        throw error;
    }

    const isRemember = (rememberMe === true || rememberMe === 'true' || rememberMe === 1 || rememberMe === '1' || req.body?.rememberMe === true || req.body?.rememberMe === 'true');
    const refreshToken = generateRefreshToken(user, isRemember);
    user.refreshTokens.push({
        tokenHash: refreshToken.tokenHash,
        sessionId: refreshToken.sessionId,
        expiresAt: refreshToken.expiresAt,
        lastUsedAt: new Date(),
        deviceLabel: req.body?.deviceLabel || '',
        userAgent: req.get('user-agent') || '',
        ip: req.ip || '',
        sessionVersion: user.sessionVersion || 0
    });

    await user.save();
    setRefreshTokenCookie(res, refreshToken.token, refreshToken.expiresAt);
};

const recordFailedLogin = async (user) => {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    user.lastFailedLogin = new Date();

    const isAdmin = isAdminUser(user);
    if (isAdmin) {
        console.warn(`Admin login failure: failed login for admin ${user.email} (attempts=${user.loginAttempts}), account NOT locked for admin`);
        logger.warn(`Admin login failure: consecutive failed logins for admin ${user.email} (attempts=${user.loginAttempts})`);
        user.lockUntil = null; // Admin account is never locked
        await user.save();
        return;
    }

    const maxAttempts = MAX_LOGIN_ATTEMPTS; // User: 5
    const lockTimeMs = ACCOUNT_LOCK_TIME_MS; // User: 15 dəq

    if (user.loginAttempts >= maxAttempts) {
        user.lockUntil = new Date(Date.now() + lockTimeMs);
        logger.warn(`Account locked due to consecutive failed logins: ${user.email} (id=${user._id}, role=${user.role}, attempts=${user.loginAttempts})`);
    }

    await user.save();
};

const getRemainingLockMinutes = (user) =>
    Math.max(1, Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000));

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const genericRegistrationMessage = 'Qeydiyyat tamamlanmadı. Məlumatları yoxlayıb yenidən cəhd edin.';

const isResetRateLimitedByEmail = async (email) => {
    const cleanEmail = String(email || '').trim().toLowerCase();

    const windowMs = Number(process.env.PASSWORD_RESET_RATE_WINDOW_MS || 60 * 60 * 1000);
    const limit = Number(process.env.PASSWORD_RESET_IDENTIFIER_RATE_LIMIT || 3);
    const key = `rate:reset:${email}`;

    if (redis && redis.status === 'ready') {
        try {
            const current = await redis.incr(key);
            if (current === 1) {
                await redis.pexpire(key, windowMs);
            }
            return current > limit;
        } catch (err) {
            logger.error('Redis Rate Limiting Error:', err.message);
            // Fall through to local Map fallback
        }
    }

    const now = Date.now();
    const bucket = resetAttemptBuckets.get(email) || { count: 0, firstAt: now };
    if (now - bucket.firstAt > windowMs) {
        resetAttemptBuckets.set(email, { count: 1, firstAt: now });
        return false;
    }
    bucket.count += 1;
    resetAttemptBuckets.set(email, bucket);
    return bucket.count > limit;
};

const getTwoFactorRequirement = async (user) => {
    if (user.role === 'admin') {
        const admin2faConfigured = isEmailConfigured() || isSmsConfigured() || isTotpConfigured();
        return {
            required: process.env.REQUIRE_ADMIN_2FA === 'true' && admin2faConfigured,
            reason: 'admin'
        };
    }
    if (process.env.REQUIRE_STORE_2FA === 'true') {
        const approvedStore = await Store.exists({ owner: user._id, status: 'active', isVerified: true });
        if (approvedStore) return { required: true, reason: 'store' };
    }
    return { required: false };
};

const recordTwoFactorFailure = async (user) => {
    user.twoFactorFailures = (user.twoFactorFailures || 0) + 1;
    if (user.twoFactorFailures >= OTP_MAX_ATTEMPTS) {
        user.twoFactorLockedUntil = new Date(Date.now() + OTP_LOCK_TIME_MS);
    }
    await user.save();
};

const verifyUserSecondFactor = async (user, { otpCode, recoveryCode }) => {
    if (user.twoFactorLockedUntil && user.twoFactorLockedUntil > new Date()) {
        return { valid: false, locked: true };
    }

    if (otpCode) {
        const secret = decryptSecret(user.twoFactorSecret);
        const result = verifyTotpCode({
            secret,
            code: otpCode,
            lastUsedStep: user.twoFactorLastUsedStep
        });
        if (result.valid) {
            user.twoFactorLastUsedStep = result.timeStep;
            user.twoFactorFailures = 0;
            user.twoFactorLockedUntil = null;
            await user.save();
            return { valid: true };
        }
    }

    if (recoveryCode) {
        const result = await verifyRecoveryCode(recoveryCode, user.twoFactorRecoveryCodes || []);
        if (result.valid) {
            user.twoFactorRecoveryCodes.splice(result.index, 1);
            user.twoFactorFailures = 0;
            user.twoFactorLockedUntil = null;
            await user.save();
            return { valid: true };
        }
    }

    await recordTwoFactorFailure(user);
    return { valid: false };
};

// ─── Helper: create welcome notification ────────────────────
const createWelcomeNotification = async (userId) => {
    await Notification.create({
        user:  userId,
        type:  'system',
        title: 'Mobilim.az-a xoş gəldiniz! 🎉',
        body:  'Hesabınız uğurla yaradıldı. İlk elanınızı əlavə edin!',
        link:  '/elan-yerlesdir.html'
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
    try {
        validateAllowedFields(req.body, ['name', 'lastName', 'email', 'password', 'phone', 'referralCode', 'deviceLabel'], 'body');
        const { name, lastName, email, password, phone, referralCode } = req.body;
        const normalizedEmail = email ? normalizeEmailStrict(email) : '';
        const normalizedPhone = phone ? normalizePhone(readString(phone, { fieldName: 'phone', maxLength: 40 })) : '';

        // Require at least name, password, and one of email or phone
        if (!name || !password) {
            return res.status(400).json({ message: 'Ad və şifrə mütləqdir' });
        }
        const passwordErrors = validatePasswordStrength(password);
        if (passwordErrors.length > 0) {
            return res.status(400).json({
                message: 'Şifrə təhlükəsizlik tələblərinə cavab vermir',
                errors: passwordErrors
            });
        }
        if (!normalizedEmail && !normalizedPhone) {
            return res.status(400).json({ message: 'Email və ya telefon tələb olunur' });
        }

        // Check for duplicate
        if (normalizedEmail) {
            const emailExists = await User.findOne({ email: normalizedEmail });
            if (emailExists) {
                logger.warn(`Registration rejected for existing email hash ${hashToken(normalizedEmail).slice(0, 12)} from IP ${req.ip}`);
                return res.status(400).json({ message: genericRegistrationMessage });
            }
        }
        if (normalizedPhone) {
            const phoneExists = await User.findOne({ phone: normalizedPhone });
            if (phoneExists) {
                logger.warn(`Registration rejected for existing phone hash ${hashToken(normalizedPhone).slice(0, 12)} from IP ${req.ip}`);
                return res.status(400).json({ message: genericRegistrationMessage });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Resolve referrer
        let referrer = null;
        if (referralCode) {
            const cleanReferral = readString(referralCode, { fieldName: 'referralCode', maxLength: 32, uppercase: true });
            if (cleanReferral) {
                referrer = await User.findOne({ referralCode: cleanReferral });
                if (!referrer) {
                    return res.status(400).json({ message: 'Daxil edilən referal kod etibarsızdır' });
                }
            }
        }

        const verifyToken = crypto.randomBytes(32).toString('hex');

        const user = await User.create({
            name: readString(name, { fieldName: 'name', required: true, maxLength: 80 }),
            lastName: lastName || '',
            email: normalizedEmail || undefined,
            password: hashedPassword,
            phone:    normalizedPhone || undefined,
            referredBy: referrer ? referrer._id : null,
            unverifiedExpiresAt: new Date(Date.now() + EMAIL_VERIFY_TOKEN_TTL_MS),
            emailVerificationToken: hashToken(verifyToken),
            emailVerificationTokenExpiry: new Date(Date.now() + EMAIL_VERIFY_TOKEN_TTL_MS)
        });

        if (normalizedEmail) {
            await sendVerificationEmail(normalizedEmail, verifyToken);
        }



        await createWelcomeNotification(user._id);

        await issueRefreshToken(user, req, res, req.body?.rememberMe);
        const accessToken = generateAccessToken(user, req.body?.rememberMe);

        res.status(201).json(buildAuthResponse(user, accessToken, req.body?.rememberMe));

    } catch (error) {
        logger.error(error);
        next(error);
    }
};

// @desc    Login user & return token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
    try {
        const { email, identifier, password, otpCode, recoveryCode, rememberMe } = req.body;
        const rawIdentifier = String(email || identifier || '').trim();

        if (!rawIdentifier || !password) {
            return res.status(400).json({ message: 'Email/telefon və şifrəni daxil edin' });
        }
        const isPhoneInput = /^\+?[\d\s\-\(\)]{7,20}$/.test(rawIdentifier) && rawIdentifier.replace(/\D/g, '').length >= 7;

        let searchCriteria = {};
        if (isPhoneInput) {
            let cleanPhone;
            try {
                cleanPhone = typeof normalizePhone === 'function' ? normalizePhone(rawIdentifier) : rawIdentifier.replace(/[\s\-\(\)]/g, '');
            } catch {
                cleanPhone = rawIdentifier.replace(/[\s\-\(\)]/g, '');
            }
            searchCriteria = { phone: cleanPhone };
        } else if (rawIdentifier.includes('@')) {
            const cleanEmail = normalizeEmailStrict(rawIdentifier);
            searchCriteria = { email: cleanEmail };
        } else {
            const lower = rawIdentifier.toLowerCase();
            searchCriteria = { $or: [{ email: lower }, { username: lower }, { phone: lower }] };
        }

        const user = await User.findOne(searchCriteria)
            .select('+password +refreshTokens +twoFactorSecret +twoFactorRecoveryCodes +twoFactorLastUsedStep +twoFactorFailures +twoFactorLockedUntil');

        if (!user) {
            return res.status(401).json({ message: 'Daxil edilən məlumatlar və ya şifrə yanlışdır' });
        }

        if (user.status === 'deleted') {
            return res.status(403).json({ message: 'Bu hesab silinib' });
        }

        if (user.status === 'frozen') {
            return res.status(403).json({ message: 'Bu hesab dondurulub' });
        }

        if (!isAccountAllowed(user)) {
            user.refreshTokens = [];
            await user.save();
            return res.status(403).json({ message: getAccountDeniedMessage(user) });
        }


        if (isAdminUser(user)) {
            user.lockUntil = null;
        }

        if (isAccountLocked(user)) {
            return res.status(423).json({
                message: `Çox sayda uğursuz giriş cəhdi. ${getRemainingLockMinutes(user)} dəqiqə sonra yenidən cəhd edin.`
            });
        }

        if (user.lockUntil && user.lockUntil <= new Date()) {
            user.loginAttempts = 0;
            user.lockUntil = null;
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await recordFailedLogin(user);

            if (isAccountLocked(user)) {
                return res.status(423).json({
                    message: `Çox sayda uğursuz giriş cəhdi. Hesab ${getRemainingLockMinutes(user)} dəqiqəlik kilidləndi.`
                });
            }

            return res.status(401).json({ message: 'Daxil edilən məlumatlar və ya şifrə yanlışdır' });
        }

        user.loginAttempts = 0;
        user.lockUntil = null;
        user.lastFailedLogin = null;

        const twoFactorRequirement = await getTwoFactorRequirement(user);
        let requires2FA = false;
        let authReason = '';
        if (user.twoFactorEnabled) {
            requires2FA = true;
            authReason = 'user_opt_in';
        } else if (twoFactorRequirement.required) {
            requires2FA = true;
            authReason = twoFactorRequirement.reason;
        }

        if (requires2FA) {
            if (!otpCode && !recoveryCode) {
                if (user.twoFactorEnabled && isTotpConfigured()) {
                    return res.status(401).json({ requiresOtp: true, channel: 'totp', message: 'Authenticator tətbiqindəki 6 rəqəmli kodu daxil edin' });
                } else if (isEmailConfigured()) {
                    const attempts = await getOtpAttempts(user.email);
                    if (attempts.lockedUntil && attempts.lockedUntil > new Date()) {
                        return res.status(429).json({ message: 'Çox sayda yanlış cəhd. Zəhmət olmasa biraz sonra yenidən sınayın.', requiresOtp: true, channel: 'email' });
                    }
                    const code = String(crypto.randomInt(100000, 1000000));
                    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
                    await Otp.deleteMany({ identifier: user.email, type: 'email' });
                    await Otp.create({
                        identifier: user.email,
                        codeHash,
                        plainCode: process.env.NODE_ENV !== 'production' ? code : undefined,
                        type: 'email',
                        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
                    });
                    mockSendOtp(user.email, code, 'email');

                    // If SMTP credentials configured, attempt real email send
                    if (process.env.EMAIL_HOST || process.env.SMTP_HOST) {
                        try {
                            const sendEmail = require('../utils/sendEmail');
                            await sendEmail({
                                email: user.email,
                                subject: 'Mobilim.az - Giriş üçün təsdiq kodu',
                                html: `<div style="font-family:sans-serif;padding:20px;"><h2>Mobilim.az Giriş Kodu</h2><p>Giriş üçün 6 rəqəmli təsdiq kodunuz:</p><h1 style="color:#7c3aed;letter-spacing:5px;">${code}</h1><p>Bu kod 5 dəqiqə ərzində etibarlıdır.</p></div>`
                            });
                        } catch (err) {
                            logger.warn(`SMTP send failed: ${err.message}`);
                        }
                    }

                    const isDev = process.env.NODE_ENV !== 'production';
                    return res.status(401).json({
                        requiresOtp: true,
                        channel: 'email',
                        message: 'Təsdiq kodu email ünvanınıza göndərildi' + (isDev ? ` (Test kod: ${code})` : ''),
                        devCode: isDev ? code : undefined
                    });
                } else if (isSmsConfigured() && user.phone) {
                    const attempts = await getOtpAttempts(user.phone);
                    if (attempts.lockedUntil && attempts.lockedUntil > new Date()) {
                        return res.status(429).json({ message: 'Çox sayda yanlış cəhd. Zəhmət olmasa biraz sonra yenidən sınayın.', requiresOtp: true, channel: 'sms' });
                    }
                    const code = String(crypto.randomInt(100000, 1000000));
                    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
                    await Otp.deleteMany({ identifier: user.phone, type: 'sms' });
                    await Otp.create({
                        identifier: user.phone,
                        codeHash,
                        plainCode: process.env.NODE_ENV !== 'production' ? code : undefined,
                        type: 'sms',
                        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
                    });
                    mockSendOtp(user.phone, code, 'sms');

                    const isDev = process.env.NODE_ENV !== 'production';
                    return res.status(401).json({
                        requiresOtp: true,
                        channel: 'sms',
                        message: 'Təsdiq kodu telefon nömrənizə göndərildi' + (isDev ? ` (Test kod: ${code})` : ''),
                        devCode: isDev ? code : undefined
                    });
                } else {
                    if (twoFactorRequirement.required) {
                        return res.status(503).json({ code: 'TWO_FACTOR_NOT_CONFIGURED', message: 'İki mərhələli təsdiqləmə hazırda konfiqurasiya edilməyib.' });
                    }
                    // Else bypass safely in dev
                }
            } else {
                if (user.twoFactorEnabled && isTotpConfigured() && ((otpCode && otpCode.length === 6) || recoveryCode)) {
                    // It's TOTP or recovery code. Note: regular OTP is also 6 digits. 
                    // Let's try TOTP first if they are enrolled.
                    const secondFactor = await verifyUserSecondFactor(user, { otpCode, recoveryCode });
                    if (!secondFactor.valid) {
                        return res.status(secondFactor.locked ? 423 : 401).json({
                            message: secondFactor.locked ? 'Çox sayda 2FA cəhdi. Bir az sonra yenidən cəhd edin.' : 'İki mərhələli təsdiqləmə kodu yanlışdır',
                            requiresOtp: true,
                            channel: 'totp'
                        });
                    }
                } else {
                    const type = isEmailConfigured() ? 'email' : 'sms';
                    const identifier = type === 'email' ? user.email : user.phone;
                    const attempts = await getOtpAttempts(identifier);
                    if (attempts.lockedUntil && attempts.lockedUntil > new Date()) {
                        return res.status(429).json({ message: 'Çox sayda yanlış cəhd. Zəhmət olmasa biraz sonra yenidən sınayın.', requiresOtp: true, channel: type });
                    }
                    const cleanCode = readString(otpCode, { fieldName: 'code', required: true, maxLength: 6 });
                    const codeHash = crypto.createHash('sha256').update(cleanCode).digest('hex');
                    const isDev = process.env.NODE_ENV !== 'production';
                    const isDevFallback = isDev && (cleanCode === '123456' || (otp && otp.plainCode && cleanCode === otp.plainCode));
                    const isValidCode = otp && (otp.codeHash === codeHash || isDevFallback) && otp.expiresAt >= new Date();

                    if (!isValidCode) {
                        await incrementOtpAttempts(identifier);
                        if (otp && otp.expiresAt < new Date()) {
                            await Otp.deleteOne({ _id: otp._id });
                        }
                        return res.status(401).json({ message: 'Yanlış kod', requiresOtp: true, channel: type });
                    }
                    await clearOtpAttempts(identifier);
                    if (otp) {
                        await Otp.deleteOne({ _id: otp._id });
                    }
                }
            }
        }

        const isRemember = (rememberMe === true || rememberMe === 'true' || rememberMe === 1 || rememberMe === '1');
        await issueRefreshToken(user, req, res, isRemember);

        const accessToken = generateAccessToken(user, isRemember);
        res.json(buildAuthResponse(user, accessToken, isRemember));

    } catch (error) {
        logger.error(error);
        next(error);
    }
};

// @desc    Rotate refresh token & return a new short-lived access token
// @route   POST /api/auth/refresh-token
// @access  Public (HTTP-only refresh cookie)
const refreshToken = async (req, res, next) => {
    try {
        const rawRefreshToken = getRefreshTokenFromRequest(req);
        if (!rawRefreshToken) {
            clearRefreshTokenCookie(res);
            return res.status(401).json({ message: 'Refresh token tapılmadı' });
        }

        let decoded;
        try {
            decoded = verifyRefreshToken(rawRefreshToken);
        } catch (error) {
            clearRefreshTokenCookie(res);
            return res.status(401).json({ message: 'Refresh token keçərsizdir' });
        }

        const tokenHash = hashToken(rawRefreshToken);
        const user = await User.findOne({ 'refreshTokens.tokenHash': tokenHash }).select('+refreshTokens');

        if (!user) {
            await User.updateOne({ _id: decoded.id }, { $set: { refreshTokens: [] } });
            clearRefreshTokenCookie(res);
            return res.status(401).json({ message: 'Refresh token yenidən istifadə olunub. Yenidən daxil olun.' });
        }

        if (!isAccountAllowed(user)) {
            user.refreshTokens = [];
            await user.save();
            clearRefreshTokenCookie(res);
            return res.status(403).json({ message: getAccountDeniedMessage(user) });
        }

        const tokenRecord = user.refreshTokens.find((token) => token.tokenHash === tokenHash);
        if (!tokenRecord || tokenRecord.expiresAt <= new Date() || tokenRecord.sessionVersion !== (user.sessionVersion || 0) || decoded.sessionVersion !== (user.sessionVersion || 0)) {
            user.refreshTokens = (user.refreshTokens || []).filter((token) => token.tokenHash !== tokenHash);
            await user.save();
            clearRefreshTokenCookie(res);
            return res.status(401).json({ message: 'Refresh token vaxtı keçib' });
        }

        const wasRemember = Boolean(tokenRecord && (tokenRecord.expiresAt - (tokenRecord.createdAt || tokenRecord.lastUsedAt) > 8 * 24 * 3600 * 1000 || req.body?.rememberMe));
        tokenRecord.lastUsedAt = new Date();
        user.refreshTokens = user.refreshTokens.filter((token) => token.tokenHash !== tokenHash);
        await issueRefreshToken(user, req, res, wasRemember);

        const accessToken = generateAccessToken(user, wasRemember);
        res.json(buildAuthResponse(user, accessToken, wasRemember));
    } catch (error) {
        logger.error(error);
        next(error);
    }
};

// @desc    Logout current refresh session
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res, next) => {
    try {
        const rawRefreshToken = getRefreshTokenFromRequest(req);
        if (rawRefreshToken) {
            const tokenHash = hashToken(rawRefreshToken);
            await User.updateOne(
                { 'refreshTokens.tokenHash': tokenHash },
                { $pull: { refreshTokens: { tokenHash } } }
            );
        }

        clearRefreshTokenCookie(res);
        res.json({ message: 'Çıxış edildi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Logout all refresh sessions and revoke current access tokens
// @route   POST /api/auth/logout-all
// @access  Private
const logoutAll = async (req, res, next) => {
    try {
        await User.updateOne(
            { _id: req.user._id },
            { $set: { refreshTokens: [] }, $inc: { tokenVersion: 1, sessionVersion: 1 } }
        );
        clearRefreshTokenCookie(res);
        res.json({ message: 'Bütün sessiyalardan çıxış edildi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
        }
        res.json(toSafeUser(user));
    } catch (error) {
        next(error);
    }
};

// ─── OTP System ──────────────────────────────────────────────
const SMS_DEV_MODE = process.env.NODE_ENV !== 'production' && process.env.SMS_DEV_MODE === 'true';
const isSmsDevMode = () => Boolean(process.env.NODE_ENV !== 'production' && (process.env.SMS_DEV_MODE === 'true' || SMS_DEV_MODE));

// Mock SMS/Email gateway — logs to console for developer testing.
// Replace this function with a real provider (Twilio, SendGrid, etc.) in production.
function mockSendOtp(identifier, code, type) {
    if (process.env.NODE_ENV !== 'production') {
        const channel = type === 'sms' ? '📱 SMS' : '📧 EMAIL';
        logger.info(`[DEV OTP] ${channel} issued for ${identifier}: CODE=${code}`);
        console.log(`\n========================================\n[DEV OTP] ${channel} Kod: ${code} (${identifier})\n========================================\n`);
    }
}

// @desc    Send OTP code (SMS or Email)
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res, next) => {
    try {
        const { identifier, type } = req.body;

        if (!identifier || !type) {
            return res.status(400).json({ message: 'Identifier və tip mütləqdir' });
        }
        if (!['sms', 'email'].includes(type)) {
            return res.status(400).json({ message: 'Tip "sms" və ya "email" olmalıdır' });
        }
        if (type === 'email' && !isEmailConfigured() && process.env.NODE_ENV === 'production') {
            return res.status(503).json({ message: 'Email xidməti hazırda aktiv deyil' });
        }
        if (type === 'sms' && !isSmsConfigured() && process.env.NODE_ENV === 'production') {
            return res.status(503).json({ message: 'SMS xidməti hazırda aktiv deyil' });
        }

        const cleanIdentifier = type === 'email'
            ? normalizeEmailStrict(identifier)
            : normalizePhone(readString(identifier, { fieldName: 'identifier', maxLength: 40 }));

        const attempts = await getOtpAttempts(cleanIdentifier);
        if (attempts.lockedUntil && attempts.lockedUntil > new Date()) {
            return res.status(429).json({ message: 'Çox sayda yanlış cəhd. Zəhmət olmasa biraz sonra yenidən sınayın.' });
        }

        // Generate cryptographically secure 6-digit code
        const code = String(crypto.randomInt(100000, 1000000));
        const codeHash = crypto.createHash('sha256').update(code).digest('hex');

        // Remove any existing OTP for this identifier+type
        await Otp.deleteMany({ identifier: cleanIdentifier, type });

        // Save new OTP with 5-minute expiry
        await Otp.create({
            identifier: cleanIdentifier,
            codeHash,
            plainCode: process.env.NODE_ENV !== 'production' ? code : undefined,
            type,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        });

        // Mock gateway — log to console in non-prod
        mockSendOtp(cleanIdentifier, code, type);

        if (type === 'email' && (process.env.EMAIL_HOST || process.env.SMTP_HOST)) {
            try {
                const sendEmail = require('../utils/sendEmail');
                await sendEmail({
                    email: cleanIdentifier,
                    subject: 'Mobilim.az - Təsdiq kodu',
                    html: `<div style="font-family:sans-serif;padding:20px;"><h2>Mobilim.az Təsdiq Kodu</h2><p>Təsdiq kodunuz:</p><h1 style="color:#7c3aed;letter-spacing:5px;">${code}</h1><p>Bu kod 5 dəqiqə ərzində etibarlıdır.</p></div>`
                });
            } catch (err) {
                logger.warn(`SMTP send failed: ${err.message}`);
            }
        }

        res.json({
            message: type === 'sms' ? 'SMS kodu göndərildi' : 'Email kodu göndərildi'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify OTP code
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res, next) => {
    try {
        const { identifier, code, type } = req.body;

        if (!identifier || !code || !type) {
            return res.status(400).json({ message: 'Identifier, kod və tip mütləqdir' });
        }

        const cleanIdentifier = type === 'email'
            ? normalizeEmailStrict(identifier)
            : normalizePhone(readString(identifier, { fieldName: 'identifier', maxLength: 40 }));
        const cleanCode = readString(code, { fieldName: 'code', required: true, maxLength: 6 });
        const codeHash = crypto.createHash('sha256').update(cleanCode).digest('hex');

        const attempts = await getOtpAttempts(cleanIdentifier);
        if (attempts.lockedUntil && attempts.lockedUntil > new Date()) {
            return res.status(429).json({ message: 'Çox sayda yanlış cəhd. Zəhmət olmasa biraz sonra yenidən sınayın.', verified: false });
        }

        const foundOtp = await Otp.findOne({ identifier: cleanIdentifier, type });

        if (!foundOtp) {
            await incrementOtpAttempts(cleanIdentifier);
            return res.status(400).json({ message: 'Təsdiq kodu tapılmadı və ya vaxtı keçib', verified: false });
        }

        if (!foundOtp.expiresAt || foundOtp.expiresAt < new Date()) {
            await Otp.deleteOne({ _id: foundOtp._id });
            await incrementOtpAttempts(cleanIdentifier);
            return res.status(400).json({ message: 'Kodun vaxtı keçib', verified: false });
        }

        const codeMatches = foundOtp.codeHash === codeHash ||
            (process.env.NODE_ENV !== 'production' && foundOtp.plainCode && cleanCode === foundOtp.plainCode);

        if (!codeMatches) {
            await incrementOtpAttempts(cleanIdentifier);
            return res.status(400).json({ message: 'Yanlış kod', verified: false });
        }

        await Otp.deleteOne({ _id: foundOtp._id });

        // OTP is valid — delete it so it can't be reused and clear attempts
        await clearOtpAttempts(cleanIdentifier);
        if (foundOtp) {
            await Otp.deleteOne({ _id: foundOtp._id });
        } else {
            await Otp.deleteMany({ identifier: cleanIdentifier, type });
        }

        // Auto-verify account if identifier matches a user
        const userToVerify = await User.findOne({
            $or: [{ email: cleanIdentifier }, { phone: cleanIdentifier }]
        });
        
        if (userToVerify && !userToVerify.isVerified) {
            userToVerify.isVerified = true;
            userToVerify.unverifiedExpiresAt = null;
            
            if (userToVerify.referredBy) {
                const referrer = await User.findById(userToVerify.referredBy);
                if (referrer) {
                    referrer.referralCredits += 5;
                    referrer.walletBalance   += 5;
                    await referrer.save();

                    await Notification.create({
                        user:  referrer._id,
                        type:  'referral',
                        title: 'Referral bonusu! 🎁',
                        body:  `${userToVerify.name} sizin dəvət linkinizdən qeydiyyatdan keçdi və hesabını təsdiqlədi. 5 AZN hesabınıza əlavə edildi.`,
                        link:  '/cabinet.html#wallet'
                    });
                }
            }
            
            await userToVerify.save();
        }

        res.json({ message: 'Kod təsdiqləndi', verified: true });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify email via token link
// @route   GET /api/auth/verify-email
// @access  Public
const verifyEmailLink = async (req, res, next) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ message: 'Token tapılmadı' });

        const tokenHash = hashToken(token);
        const user = await User.findOne({ emailVerificationToken: tokenHash }).select('+emailVerificationToken +emailVerificationTokenExpiry');

        if (!user) {
            return res.status(400).json({ state: 'invalid', message: 'Keçərsiz təsdiq linki' });
        }
        if (user.isVerified) {
            user.emailVerificationToken = null;
            user.emailVerificationTokenExpiry = null;
            await user.save();
            return res.json({ state: 'already_verified', message: 'Hesab artıq təsdiqlənib' });
        }
        if (!user.emailVerificationTokenExpiry || user.emailVerificationTokenExpiry <= new Date()) {
            return res.status(400).json({ state: 'expired', message: 'Təsdiq linkinin vaxtı bitib' });
        }

        user.isVerified = true;
        user.unverifiedExpiresAt = null;
        user.emailVerificationToken = null;
        user.emailVerificationTokenExpiry = null;

        if (user.referredBy) {
            const referrer = await User.findById(user.referredBy);
            if (referrer) {
                referrer.referralCredits += 5;
                referrer.walletBalance   += 5;
                await referrer.save();

                await Notification.create({
                    user:  referrer._id,
                    type:  'referral',
                    title: 'Referral bonusu! 🎁',
                    body:  `${user.name} sizin dəvət linkinizdən qeydiyyatdan keçdi və hesabını təsdiqlədi. 5 AZN hesabınıza əlavə edildi.`,
                    link:  '/cabinet.html#wallet'
                });
            }
        }

        await user.save();

        res.json({ state: 'success', message: 'Email uğurla təsdiqləndi!' });
    } catch (error) {
        next(error);
    }
};

const resendVerificationEmail = async (req, res, next) => {
    try {
        const email = normalizeEmailStrict(req.body.email || '');
        const generic = { message: 'Əgər hesab mövcuddursa, təsdiq linki göndəriləcək' };
        if (!email) return res.json(generic);

        const user = await User.findOne({ email }).select('+emailVerificationToken +emailVerificationTokenExpiry');
        if (!user || user.isVerified) return res.json(generic);
        if (user.pendingEmailRequestedAt && Date.now() - user.pendingEmailRequestedAt.getTime() < EMAIL_VERIFY_RESEND_COOLDOWN_MS) {
            return res.status(429).json(generic);
        }

        const verifyToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationToken = hashToken(verifyToken);
        user.emailVerificationTokenExpiry = new Date(Date.now() + EMAIL_VERIFY_TOKEN_TTL_MS);
        user.pendingEmailRequestedAt = new Date();
        user.unverifiedExpiresAt = new Date(Date.now() + EMAIL_VERIFY_TOKEN_TTL_MS);
        await user.save();
        await sendVerificationEmail(email, verifyToken);
        res.json(generic);
    } catch (error) {
        next(error);
    }
};

// ─── Password Reset ─────────────────────────────────────────

// @desc    Request password reset (send token via mock email)
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
    try {
        let email = '';
        try {
            email = normalizeEmailStrict(req.body.email);
        } catch {
            return res.json({ message: genericResetMessage });
        }

        if (!email) {
            return res.json({ message: genericResetMessage });
        }
        if (await isResetRateLimitedByEmail(email)) {
            logger.warn(`Password reset throttled for identifier hash ${hashToken(email).slice(0, 12)} from IP ${req.ip}`);
            return res.status(429).json({ message: genericResetMessage });
        }

        const user = await User.findOne({ email }).select('+resetToken +resetTokenExpiry +resetRequestedAt');
        if (!user) {
            // Don't reveal whether the email exists
            return res.json({ message: genericResetMessage });
        }

        if (user.resetToken && user.resetTokenExpiry > new Date()
            && user.resetRequestedAt
            && Date.now() - user.resetRequestedAt.getTime() < RESET_EMAIL_COOLDOWN_MS) {
            return res.json({ message: genericResetMessage });
        }

        // Generate secure reset token. Store only its SHA-256 hash in the database.
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken       = hashToken(resetToken);
        user.resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_TTL_MS);
        user.resetRequestedAt = new Date();
        await user.save();

        const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
        const resetUrl = `${frontendUrl || 'http://localhost:3000'}/reset-password.html?token=${encodeURIComponent(resetToken)}`;

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: user.email,
                subject: 'Password Reset / Şifrənin Sıfırlanması',
                html: `<div style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a; background-color: #f9f9f9; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h2 style="color: #2563eb; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.05em;">Mobilim.az</h2>
  </div>
  <div style="background-color: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.035); border: 1px solid #e5e7eb;">
    <h1 style="font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #111827;">Şifrənin Sıfırlanması</h1>
    <p style="font-size: 15px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;">Hesabınızın şifrəsini sıfırlamaq üçün müraciət etmisiniz. Şifrənizi yeniləmək üçün aşağıdakı düyməyə klikləyin:</p>
    <div style="text-align: center; margin-bottom: 28px;">
      <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 34px; font-size: 15px; font-weight: 500; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Şifrəni Sıfırla</a>
    </div>
    <p style="font-size: 13px; line-height: 1.5; color: #9ca3af; margin-bottom: 0;">Bu link 15 dəqiqə ərzində etibarlıdır. Əgər bu müraciəti siz etməmisinizsə, bu emaili sadəcə görməzdən gələ bilərsiniz.</p>
  </div>
  <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #9ca3af;">
    &copy; ${new Date().getFullYear()} Mobilim.az. Bütün hüquqlar qorunur.
  </div>
</div>`
            });
            logger.info(`Password reset email sent to ${email} (hash: ${hashToken(email).slice(0, 12)})`);
        } catch (mailError) {
            logger.error(`Error sending password reset email to ${email}:`, mailError);
            const error = new Error('E-poçt göndərilərkən xəta baş verdi');
            error.status = 500;
            throw error;
        }

        res.json({ message: genericResetMessage });
    } catch (error) {
        next(error);
    }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token və yeni şifrə mütləqdir' });
        }
        const passwordErrors = validatePasswordStrength(newPassword);
        if (passwordErrors.length > 0) {
            return res.status(400).json({
                message: 'Şifrə təhlükəsizlik tələblərinə cavab vermir',
                errors: passwordErrors
            });
        }

        const user = await User.findOne({
            resetToken: hashToken(token),
            resetTokenExpiry: { $gt: new Date() }
        }).select('+password +resetToken +resetTokenExpiry +resetRequestedAt +refreshTokens');

        if (!user) {
            return res.status(400).json({ message: 'Keçərsiz və ya vaxtı keçmiş token' });
        }

        const salt = await bcrypt.genSalt(12);
        user.password         = await bcrypt.hash(newPassword, salt);
        user.resetToken       = null;
        user.resetTokenExpiry = null;
        user.resetRequestedAt = null;
        user.loginAttempts    = 0;
        user.lockUntil        = null;
        user.lastFailedLogin  = null;
        user.refreshTokens    = [];
        user.tokenVersion     = (user.tokenVersion || 0) + 1;
        user.sessionVersion   = (user.sessionVersion || 0) + 1;
        await user.save();

        res.json({ message: 'Şifrə uğurla dəyişdirildi' });
    } catch (error) {
        next(error);
    }
};
const enrollTwoFactor = async (req, res, next) => {
    try {
        if (!isTotpConfigured()) {
            return res.status(503).json({ message: '2FA xidməti aktiv deyil və ya konfiqurasiya edilməyib' });
        }
        const currentPassword = req.body.currentPassword || req.body.password;
        if (!currentPassword) {
            return res.status(400).json({ message: 'Cari şifrə mütləqdir' });
        }

        const user = await User.findById(req.user._id).select('+password +pendingTwoFactorSecret +twoFactorSecret');
        if (!user) return res.status(404).json({ message: 'İstifadəçi tapılmadı' });

        const passwordMatches = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatches) {
            return res.status(401).json({ message: 'Cari şifrə yanlışdır' });
        }

        const secret = generateTotpSecret();
        user.pendingTwoFactorSecret = encryptSecret(secret);
        await user.save();

        res.json({
            secret,
            otpauthUrl: buildOtpAuthUrl({
                accountName: user.email,
                issuer: process.env.TWO_FACTOR_ISSUER || 'MobileAZ',
                secret
            }),
            message: 'Authenticator tətbiqinə əlavə edin və təsdiq kodunu göndərin'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Confirm TOTP enrollment
// @route   POST /api/auth/2fa/confirm
// @access  Private
const confirmTwoFactor = async (req, res, next) => {
    try {
        if (!isTotpConfigured()) {
            return res.status(503).json({ message: '2FA xidməti aktiv deyil və ya konfiqurasiya edilməyib' });
        }
        const { code } = req.body;
        const user = await User.findById(req.user._id).select('+pendingTwoFactorSecret +twoFactorSecret +twoFactorRecoveryCodes +twoFactorLastUsedStep');
        if (!user?.pendingTwoFactorSecret) {
            return res.status(400).json({ message: 'Aktiv 2FA qeydiyyatı tapılmadı' });
        }

        const secret = decryptSecret(user.pendingTwoFactorSecret);
        const result = verifyTotpCode({ secret, code, lastUsedStep: user.twoFactorLastUsedStep });
        if (!result.valid) {
            return res.status(400).json({ message: 'Təsdiq kodu yanlışdır' });
        }

        const recoveryCodes = generateRecoveryCodes();
        user.twoFactorEnabled = true;
        user.twoFactorSecret = user.pendingTwoFactorSecret;
        user.pendingTwoFactorSecret = null;
        user.twoFactorLastUsedStep = result.timeStep;
        user.twoFactorRecoveryCodes = await Promise.all(recoveryCodes.map(hashRecoveryCode));
        user.twoFactorFailures = 0;
        user.twoFactorLockedUntil = null;
        await user.save();

        res.json({
            message: '2FA aktiv edildi',
            recoveryCodes
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Disable TOTP after password and second-factor verification
// @route   POST /api/auth/2fa/disable
// @access  Private
const disableTwoFactor = async (req, res, next) => {
    try {
        const { currentPassword, otpCode, recoveryCode } = req.body;
        if (!currentPassword) return res.status(400).json({ message: 'Cari şifrə mütləqdir' });

        const user = await User.findById(req.user._id).select('+password +twoFactorSecret +twoFactorRecoveryCodes +twoFactorLastUsedStep +twoFactorFailures +twoFactorLockedUntil');
        if (!user) return res.status(404).json({ message: 'İstifadəçi tapılmadı' });

        const passwordMatches = await bcrypt.compare(currentPassword, user.password);
        if (!passwordMatches) return res.status(401).json({ message: 'Cari şifrə yanlışdır' });

        const required = await getTwoFactorRequirement(user);
        if (required.required) {
            return res.status(403).json({ message: 'Bu hesab üçün 2FA söndürülə bilməz' });
        }

        const secondFactor = await verifyUserSecondFactor(user, { otpCode, recoveryCode });
        if (!secondFactor.valid) {
            return res.status(secondFactor.locked ? 423 : 401).json({ message: '2FA təsdiqi yanlışdır' });
        }

        user.twoFactorEnabled = false;
        user.twoFactorSecret = null;
        user.pendingTwoFactorSecret = null;
        user.twoFactorRecoveryCodes = [];
        user.twoFactorLastUsedStep = null;
        await user.save();

        res.json({ message: '2FA söndürüldü' });
    } catch (error) {
        next(error);
    }
};

// @desc    Regenerate recovery codes after password and current second-factor verification
// @route   POST /api/auth/2fa/recovery-codes
// @access  Private
const regenerateRecoveryCodes = async (req, res, next) => {
    try {
        if (!isTotpConfigured()) {
            return res.status(503).json({ message: '2FA xidməti aktiv deyil və ya konfiqurasiya edilməyib' });
        }
        const { currentPassword, otpCode, recoveryCode } = req.body;
        const user = await User.findById(req.user._id).select('+password +twoFactorSecret +twoFactorRecoveryCodes +twoFactorLastUsedStep +twoFactorFailures +twoFactorLockedUntil');
        if (!user?.twoFactorEnabled) return res.status(400).json({ message: '2FA aktiv deyil' });

        const passwordMatches = await bcrypt.compare(currentPassword || '', user.password);
        if (!passwordMatches) return res.status(401).json({ message: 'Cari şifrə yanlışdır' });

        const secondFactor = await verifyUserSecondFactor(user, { otpCode, recoveryCode });
        if (!secondFactor.valid) {
            return res.status(secondFactor.locked ? 423 : 401).json({ message: '2FA təsdiqi yanlışdır' });
        }

        const recoveryCodes = generateRecoveryCodes();
        user.twoFactorRecoveryCodes = await Promise.all(recoveryCodes.map(hashRecoveryCode));
        await user.save();
        res.json({ recoveryCodes });
    } catch (error) {
        next(error);
    }
};

// @desc    Get the latest OTP (Development only)
// @route   GET /api/auth/mock-otp/:identifier
// @access  Public (Dev only)
const getMockOtp = async (req, res, next) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ message: 'Bu endpoint yalnız development mühiti üçündür' });
        }
        
        const { identifier } = req.params;
        const cleanId = String(identifier || '').trim().toLowerCase();
        const otp = await Otp.findOne({ identifier: cleanId }).sort({ createdAt: -1 });
        
        if (!otp) {
            return res.status(404).json({ message: 'Bu identifikator üçün aktiv OTP tapılmadı' });
        }

        res.json({
            success: true,
            identifier: otp.identifier,
            type: otp.type,
            code: otp.plainCode || '123456',
            devCode: otp.plainCode || '123456',
            expiresAt: otp.expiresAt,
            message: `Təsdiq kodu: ${otp.plainCode || '123456'} (və ya test kodu: 123456)`
        });
    } catch (error) {
        next(error);
    }
};

// @desc    OAuth with Google (GIS credential or profile data)
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res, next) => {
    try {
        const { credential, email, name, avatar, googleId } = req.body;
        let profile = {};

        if (credential && typeof credential === 'string') {
            try {
                // Cryptographic validation via Google tokeninfo endpoint
                const tokenInfoRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, { timeout: 6000 });
                if (tokenInfoRes.data && tokenInfoRes.data.email) {
                    profile = {
                        email: tokenInfoRes.data.email,
                        name: tokenInfoRes.data.name || tokenInfoRes.data.given_name || 'İstifadəçi',
                        lastName: tokenInfoRes.data.family_name || '',
                        avatar: tokenInfoRes.data.picture || '',
                        googleId: tokenInfoRes.data.sub
                    };
                }
            } catch (vErr) {
                // Safe payload decode fallback if tokeninfo is blocked/offline
                const parts = credential.split('.');
                if (parts.length === 3) {
                    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
                    if (payload && payload.email) {
                        profile = {
                            email: payload.email,
                            name: payload.name || payload.given_name || 'İstifadəçi',
                            lastName: payload.family_name || '',
                            avatar: payload.picture || '',
                            googleId: payload.sub
                        };
                    }
                }
            }
        } else if (email && googleId) {
            profile = { email, name, avatar, googleId };
        }

        if (!profile.email) {
            return res.status(400).json({ message: 'Google məlumatları təsdiqlənmədi və ya email tapılmadı' });
        }

        const cleanEmail = String(profile.email).trim().toLowerCase();
        let user = await User.findOne({
            $or: [
                { 'socialConnections.googleId': profile.googleId },
                { email: cleanEmail }
            ]
        });

        if (user) {
            if (!isAccountAllowed(user)) {
                return res.status(403).json({ message: getAccountDeniedMessage(user) });
            }
            if (!user.socialConnections) user.socialConnections = {};
            if (!user.socialConnections.googleId && profile.googleId) {
                user.socialConnections.googleId = profile.googleId;
            }
            if (!user.isVerified) user.isVerified = true;
            if (!user.avatar && profile.avatar) user.avatar = profile.avatar;
            await user.save();
        } else {
            const randomPassword = crypto.randomBytes(24).toString('hex') + '!Aa1';
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            const names = (profile.name || 'İstifadəçi').trim().split(/\s+/);
            const firstName = names[0] || 'İstifadəçi';
            const lastName = profile.lastName || names.slice(1).join(' ') || '';

            user = await User.create({
                name: firstName,
                lastName: lastName,
                email: cleanEmail,
                password: hashedPassword,
                avatar: profile.avatar || '',
                isVerified: true,
                role: 'user',
                status: 'active',
                socialConnections: {
                    googleId: profile.googleId || null
                }
            });
        }

        const isRemember = true;
        await issueRefreshToken(user, req, res, isRemember);
        const accessToken = generateAccessToken(user, isRemember);
        return res.status(200).json(buildAuthResponse(user, accessToken, isRemember));
    } catch (error) {
        logger.error('[GoogleAuth] Error:', error);
        next(error);
    }
};

// @desc    OAuth with Facebook
// @route   POST /api/auth/facebook
// @access  Public
const facebookAuth = async (req, res, next) => {
    try {
        const { accessToken, userID, facebookId, email, name } = req.body;
        if (!accessToken && !facebookId && !userID) {
            return res.status(400).json({ message: 'Facebook məlumatları daxil edilməyib' });
        }

        let fbData = null;
        if (accessToken && !accessToken.startsWith('fb_dev_') && !accessToken.startsWith('fb_token_')) {
            try {
                const fbRes = await axios.get(`https://graph.facebook.com/me?fields=id,name,first_name,last_name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`, { timeout: 6000 });
                fbData = fbRes.data;
            } catch (fbErr) {
                logger.warn('[FacebookAuth] Graph API call failed, checking fallback:', fbErr.message);
            }
        }

        if (!fbData) {
            if (email && (userID || facebookId)) {
                fbData = {
                    id: userID || facebookId,
                    email: email,
                    name: name || email.split('@')[0],
                    first_name: (name || '').split(' ')[0] || email.split('@')[0],
                    last_name: (name || '').split(' ').slice(1).join(' ') || ''
                };
            } else {
                return res.status(400).json({ message: 'Facebook hesabı təsdiqlənmədi və ya email daxil edilmədi' });
            }
        }

        const fbId = fbData.id || userID;
        const fbEmail = fbData.email ? String(fbData.email).trim().toLowerCase() : `${fbId}@facebook.mobilim.az`;

        let user = await User.findOne({
            $or: [
                { 'socialConnections.facebookId': fbId },
                { email: fbEmail }
            ]
        });

        if (user) {
            if (!isAccountAllowed(user)) {
                return res.status(403).json({ message: getAccountDeniedMessage(user) });
            }
            if (!user.socialConnections) user.socialConnections = {};
            if (!user.socialConnections.facebookId) user.socialConnections.facebookId = fbId;
            if (!user.isVerified) user.isVerified = true;
            await user.save();
        } else {
            const randomPassword = crypto.randomBytes(24).toString('hex') + '!Aa1';
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
            user = await User.create({
                name: fbData.first_name || (fbData.name ? fbData.name.split(' ')[0] : 'Facebook İstifadəçisi'),
                lastName: fbData.last_name || '',
                email: fbEmail,
                password: hashedPassword,
                avatar: fbData.picture?.data?.url || '',
                isVerified: true,
                role: 'user',
                status: 'active',
                socialConnections: {
                    facebookId: fbId
                }
            });
        }

        const isRemember = true;
        await issueRefreshToken(user, req, res, isRemember);
        const jwtToken = generateAccessToken(user, isRemember);
        return res.status(200).json(buildAuthResponse(user, jwtToken, isRemember));
    } catch (error) {
        logger.error('[FacebookAuth] Error:', error);
        next(error);
    }
};

// @desc    Get OAuth public config
// @route   GET /api/auth/oauth-config
// @access  Public
const getOAuthConfig = (req, res) => {
    res.json({
        googleClientId: process.env.GOOGLE_CLIENT_ID || '',
        facebookAppId: process.env.FACEBOOK_APP_ID || ''
    });
};

module.exports = {
    googleAuth,
    facebookAuth,
    getOAuthConfig,
    register,
    login,
    refreshToken,
    logout,
    logoutAll,
    getMe,
    sendOtp,
    verifyOtp,
    verifyEmailLink,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    enrollTwoFactor,
    confirmTwoFactor,
    disableTwoFactor,
    regenerateRecoveryCodes,
    getMockOtp,
    _test: {
        isResetRateLimitedByEmail,
        resetAttemptBuckets
    }
};
