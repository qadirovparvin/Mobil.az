const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { toSafeUser } = require('./userSerializer');

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'refreshToken';
const REFRESH_COOKIE_PATH = '/api/auth';

const getRefreshTokenSecret = () => process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET;
const ACTIVE_JWT_KID = process.env.JWT_ACTIVE_KID || 'primary';

const getAccessSigningKeys = () => {
    const keys = {};
    if (process.env.JWT_ACCESS_KEYS) {
        const parsed = JSON.parse(process.env.JWT_ACCESS_KEYS);
        Object.assign(keys, parsed);
    }
    if (process.env.JWT_SECRET) keys[ACTIVE_JWT_KID] = process.env.JWT_SECRET;
    return keys;
};

const getActiveAccessKey = () => {
    const keys = getAccessSigningKeys();
    const secret = keys[ACTIVE_JWT_KID];
    if (!secret) {
        throw new Error(`Active JWT signing key "${ACTIVE_JWT_KID}" is not configured`);
    }
    return { kid: ACTIVE_JWT_KID, secret };
};

const hashToken = (token) =>
    crypto.createHash('sha256').update(token).digest('hex');

const generateAccessToken = (user, rememberMe = false) => {
    const { kid, secret } = getActiveAccessKey();
    const id = user._id || user.id || user;
    const isRemember = (rememberMe === true || rememberMe === 'true' || rememberMe === 1 || rememberMe === '1');
    const expires = isRemember ? '30d' : '7d';
    return jwt.sign(
        {
            id,
            type: 'access',
            tokenVersion: user.tokenVersion || 0,
            sessionVersion: user.sessionVersion || 0
        },
        secret,
        { expiresIn: expires, header: { kid } }
    );
};

const generateRefreshToken = (user) => {
    const id = user._id || user.id || user;
    const sessionId = crypto.randomBytes(16).toString('hex');
    const token = jwt.sign(
        {
            id,
            type: 'refresh',
            jti: sessionId,
            sessionVersion: user.sessionVersion || 0
        },
        getRefreshTokenSecret(),
        { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );

    const decoded = jwt.decode(token);
    return {
        token,
        tokenHash: hashToken(token),
        sessionId,
        expiresAt: new Date(decoded.exp * 1000)
    };
};

const verifyAccessToken = (token) => {
    const decodedHeader = jwt.decode(token, { complete: true });
    const kid = decodedHeader?.header?.kid || ACTIVE_JWT_KID;
    const keys = getAccessSigningKeys();
    const secret = keys[kid];
    if (!secret) {
        const error = new Error('Unknown JWT key id');
        error.code = 'UNKNOWN_KID';
        throw error;
    }
    const decoded = jwt.verify(token, secret);
    if (decoded.type !== 'access') {
        throw new Error('Invalid access token type');
    }
    return decoded;
};

const verifyRefreshToken = (token) => {
    const decoded = jwt.verify(token, getRefreshTokenSecret());
    if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token type');
    }
    return decoded;
};

const buildRefreshCookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.REFRESH_COOKIE_SAME_SITE || 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge,
    ...(process.env.REFRESH_COOKIE_DOMAIN ? { domain: process.env.REFRESH_COOKIE_DOMAIN } : {})
});

const setRefreshTokenCookie = (res, token, expiresAt) => {
    res.cookie(
        REFRESH_COOKIE_NAME,
        token,
        buildRefreshCookieOptions(Math.max(expiresAt.getTime() - Date.now(), 0))
    );
};

const clearRefreshTokenCookie = (res) => {
    res.clearCookie(REFRESH_COOKIE_NAME, buildRefreshCookieOptions(0));
};

const parseCookies = (cookieHeader = '') => cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .reduce((cookies, cookie) => {
        const separatorIndex = cookie.indexOf('=');
        if (separatorIndex === -1) return cookies;

        const name = cookie.slice(0, separatorIndex).trim();
        const value = cookie.slice(separatorIndex + 1).trim();
        cookies[name] = decodeURIComponent(value);
        return cookies;
    }, {});

const getRefreshTokenFromRequest = (req) => {
    return parseCookies(req.headers.cookie)[REFRESH_COOKIE_NAME];
};

const validatePasswordStrength = (password) => {
    const errors = [];

    if (typeof password !== 'string') {
        return ['Şifrə mətn formatında olmalıdır'];
    }
    if (password.length < 8) {
        errors.push('Şifrə ən azı 8 simvol olmalıdır');
    }
    if (password.length > 128) {
        errors.push('Şifrə 128 simvoldan uzun olmamalıdır');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Şifrədə ən azı 1 kiçik hərf olmalıdır');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Şifrədə ən azı 1 böyük hərf olmalıdır');
    }
    if (!/\d/.test(password)) {
        errors.push('Şifrədə ən azı 1 rəqəm olmalıdır');
    }

    const commonWeakPasswords = new Set([
        '123456',
        '12345678',
        'password',
        'qwerty123',
        'admin123',
        'password1'
    ]);
    if (commonWeakPasswords.has(password.toLowerCase())) {
        errors.push('Bu şifrə çox zəifdir, daha güclü şifrə seçin');
    }

    return errors;
};

const buildAuthResponse = (user, accessToken, rememberMe = false) => {
    const isRemember = (rememberMe === true || rememberMe === 'true' || rememberMe === 1 || rememberMe === '1');
    const expires = isRemember ? '30d' : '7d';
    return {
        ...toSafeUser(user),
        token: accessToken,
        accessToken,
        accessTokenExpiresIn: expires,
        expiresIn: expires,
        rememberMe: isRemember
    };
};

module.exports = {
    ACCESS_TOKEN_EXPIRES_IN,
    REFRESH_COOKIE_NAME,
    clearRefreshTokenCookie,
    generateAccessToken,
    generateRefreshToken,
    getRefreshTokenFromRequest,
    hashToken,
    parseCookies,
    setRefreshTokenCookie,
    validatePasswordStrength,
    verifyRefreshToken,
    verifyAccessToken,
    buildAuthResponse
};
