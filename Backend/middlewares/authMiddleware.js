const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isAccountAllowed, getAccountDeniedMessage } = require('../utils/accountSecurity');
const { verifyAccessToken } = require('../utils/authSecurity');
const logger = require('../utils/logger');

function getEnvJwtSecrets() {
    const secrets = [];
    if (process.env.JWT_SECRET) {
        secrets.push(process.env.JWT_SECRET);
    }
    if (process.env.JWT_ACCESS_KEYS) {
        try {
            const parsed = JSON.parse(process.env.JWT_ACCESS_KEYS);
            if (typeof parsed === 'object' && parsed !== null) {
                Object.values(parsed).forEach(val => {
                    if (val && typeof val === 'string') secrets.push(val.trim());
                });
            }
        } catch (e) {
            // Comma-separated format fallback: key1,key2,key3
            process.env.JWT_ACCESS_KEYS.split(',').forEach(val => {
                if (val && val.trim()) secrets.push(val.trim());
            });
        }
    }
    return [...new Set(secrets)];
}

// ── Legacy Hardcoded Fallback Secrets (Temporary Grace Period) ──
// These exist strictly to prevent logging out active sessions during secret migration.
const LEGACY_KEYS = [];
const LEGACY_FALLBACK_SECRETS = LEGACY_KEYS;

const tryDecodeToken = (token) => {
    // 1. First priority: verify using standard active kid via authSecurity
    try {
        const d = verifyAccessToken(token);
        if (d && (d.id || d._id)) return d;
    } catch (e) {}

    // 2. Second priority: verify using any environment-defined secrets (JWT_SECRET, JWT_ACCESS_KEYS)
    const envSecrets = getEnvJwtSecrets();
    for (const sec of envSecrets) {
        try {
            const d = jwt.verify(token, sec);
            if (d && (d.id || d._id)) return d;
        } catch (e) {}
    }

    // 3. Staged migration fallback
    let legacyKeys = [];
    if (process.env.NODE_ENV === 'production') {
        legacyKeys = [];
        logger.error('LEGACY FALLBACK DISABLED IN PROD');
    } else if (process.env.DISABLE_LEGACY_JWT_FALLBACK === 'true') {
        legacyKeys = [];
    } else {
        legacyKeys = LEGACY_KEYS;
        logger.warn('DEPRECATED_JWT_FALLBACK_USED: Legacy fallback is deprecated and disabled');
    }

    for (const sec of legacyKeys) {
        try {
            const d = jwt.verify(token, sec);
            if (d && (d.id || d._id)) {
                logger.warn('DEPRECATED_JWT_FALLBACK_USED kid=old: Token verified using legacy secret. Active session preserved during migration.');
                return d;
            }
        } catch (e) {}
    }

    try {
        if (process.env.REFRESH_TOKEN_SECRET) {
            const d = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
            if (d && (d.id || d._id)) return d;
        }
    } catch (e) {}

    try {
        const unverified = jwt.decode(token);
        if (unverified && unverified.type === 'refresh') return unverified;
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

        if (!decoded.type || decoded.type !== 'access') {
            return res.status(401).json({ message: 'Invalid token type' });
        }

        if (!decoded.id) {
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

        if (!decoded || !decoded.type || decoded.type !== 'access' || (!decoded.id && !decoded._id)) {
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
