const jwt       = require('jsonwebtoken');
const bcrypt    = require('bcryptjs');
const User      = require('../models/User');
const Notification = require('../models/Notification');

// ─── Helper: sign JWT ────────────────────────────────────────
const generateToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ─── Helper: create welcome notification ────────────────────
const createWelcomeNotification = async (userId) => {
    await Notification.create({
        user:  userId,
        type:  'system',
        title: 'AiryPhone-a xoş gəldiniz! 🎉',
        body:  'Hesabınız uğurla yaradıldı. İlk elanınızı əlavə edin!',
        link:  '/elan-yerlesdir.html'
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { name, lastName, email, password, phone, referralCode } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Ad, email və şifrə mütləqdir' });
        }

        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) {
            return res.status(400).json({ message: 'Bu email artıq qeydiyyatdan keçib' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Resolve referrer
        let referrer = null;
        if (referralCode) {
            referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
        }

        const user = await User.create({
            name,
            lastName: lastName || '',
            email,
            password: hashedPassword,
            phone:    phone || '',
            referredBy: referrer ? referrer._id : null
        });

        // Give referral credit to referrer (5 AZN)
        if (referrer) {
            referrer.referralCredits += 5;
            referrer.walletBalance   += 5;
            await referrer.save();

            await Notification.create({
                user:  referrer._id,
                type:  'referral',
                title: 'Referral bonusu! 🎁',
                body:  `${user.name} sizin dəvət linkinizdən qeydiyyatdan keçdi. 5 AZN hesabınıza əlavə edildi.`,
                link:  '/cabinet.html#wallet'
            });
        }

        await createWelcomeNotification(user._id);

        res.status(201).json({
            _id:          user._id,
            name:         user.name,
            lastName:     user.lastName,
            email:        user.email,
            phone:        user.phone,
            avatar:       user.avatar,
            role:         user.role,
            walletBalance: user.walletBalance,
            referralCode: user.referralCode,
            token:        generateToken(user._id)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Login user & return token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email və şifrəni daxil edin' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({ message: 'Email və ya şifrə yanlışdır' });
        }

        if (user.status === 'deleted') {
            return res.status(403).json({ message: 'Bu hesab silinib' });
        }

        if (user.status === 'frozen') {
            return res.status(403).json({ message: 'Bu hesab dondurulub' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Email və ya şifrə yanlışdır' });
        }

        res.json({
            _id:           user._id,
            name:          user.name,
            lastName:      user.lastName,
            email:         user.email,
            phone:         user.phone,
            avatar:        user.avatar,
            role:          user.role,
            walletBalance: user.walletBalance,
            referralCode:  user.referralCode,
            activePackage: user.activePackage,
            token:         generateToken(user._id)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'İstifadəçi tapılmadı' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

module.exports = { register, login, getMe };
