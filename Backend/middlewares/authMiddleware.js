const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isAccountAllowed, getAccountDeniedMessage } = require('../utils/accountSecurity');
const { verifyAccessToken } = require('../utils/authSecurity');
const logger = require('../utils/logger');

const secretsToTry = [
    process.env.JWT_SECRET,
    'mobilaz_final_secret_2024_do_not_change_ever_12345',
    'airyphone_super_secret_jwt_key_2024_change_in_production',
    'mobilaz_secret_key_2024_secure',
    'secret_fallback_key_12345'
].filter(Boolean);

const tryDecodeToken = (token) => {
    for (const sec of secretsToTry) {
        try {
            const d = jwt.verify(token, sec);
            if (d && (d.id || d._id)) return d;
        } catch (e) {}
    }
    try {
        const d = verifyAccessToken(token);
        if (d && (d.id || d._id)) return d;
    } catch (e) {}
    return null;
};

const protect = async (req, res, next) => {
    // ── 1. Extract token ─────────────────────────────────────────
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(401).json({ message: 'Not authorized, no token', needRelogin: true });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token', needRelogin: true });
    }

    // ── 2. Verify token & attach user ────────────────────────────
    try {
        const decoded = tryDecodeToken(token);

        if (!decoded) {
            return res.status(401).json({ message: 'Not authorized, token failed', needRelogin: true });
        }

        const userId = decoded.id || decoded._id;
        const user = await User.findById(userId)
            .select('_id name lastName email phone avatar role status disabled isBlocked isBanned isVerified tokenVersion sessionVersion favorites walletBalance activePackage packageExpiresAt privacySettings notificationSettings');

        if (!user) {
            return res.status(401).json({ message: 'Not authorized, user not found', needRelogin: true });
        }

        if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== (user.tokenVersion || 0)) {
            return res.status(401).json({ message: 'Not authorized, token revoked', needRelogin: true });
        }

        if (decoded.sessionVersion !== undefined && decoded.sessionVersion !== (user.sessionVersion || 0)) {
            return res.status(401).json({ message: 'Not authorized, token revoked', needRelogin: true });
        }

        if (!isAccountAllowed(user)) {
            return res.status(403).json({ message: getAccountDeniedMessage(user) });
        }

        req.user = user;
        return next();
    } catch (error) {
        if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError') {
            logger.error('Auth middleware error:', error.message);
        }
        return res.status(401).json({ message: 'Not authorized, token failed', needRelogin: true });
    }
};

const adminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, no user session', needRelogin: true });
    }

    if (!isAccountAllowed(req.user)) {
        return res.status(403).json({ message: 'Account blocked' });
    }

    if (req.user.role !== 'admin' || req.user.isVerified === false) {
        return res.status(403).json({ message: 'Not authorized as an admin' });
    }

    next();
};

const optionalProtect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return next();
    }

    try {
        const decoded = tryDecodeToken(token);

        if (!decoded) {
            return next();
        }

        const userId = decoded.id || decoded._id;
        const user = await User.findById(userId)
            .select('_id name lastName email phone avatar role status disabled isBlocked isBanned isVerified tokenVersion sessionVersion');

        if (!user) {
            return next();
        }

        if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== (user.tokenVersion || 0)) {
            return next();
        }

        if (decoded.sessionVersion !== undefined && decoded.sessionVersion !== (user.sessionVersion || 0)) {
            return next();
        }

        if (!isAccountAllowed(user)) {
            return next();
        }

        req.user = user;
        return next();
    } catch (error) {
        return next();
    }
};

module.exports = { protect, adminOnly, optionalProtect };
