const crypto = require('crypto');
const { isOriginAllowed, getAllowedOrigins } = require('../utils/corsPolicy');

const isProd = process.env.NODE_ENV === 'production';

const CSRF_COOKIE_NAME = process.env.CSRF_COOKIE_NAME || 'csrfToken';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_PATH = '/';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

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

const getCsrfSecret = () => {
    const isProduction = isProd || process.env.NODE_ENV === 'production';
    if (!process.env.CSRF_SECRET) {
        if (isProduction) {
            throw new Error('CSRF_SECRET is required in production - set CSRF_SECRET env');
        }
        console.warn('⚠️ CSRF_SECRET missing, using fallback (DEV ONLY)');
        return process.env.JWT_SECRET || 'dev-only-csrf-fallback-not-for-prod';
    }
    return process.env.CSRF_SECRET;
};

// Validate on startup
getCsrfSecret();

const allowedOrigins = getAllowedOrigins();
if ((isProd || process.env.NODE_ENV === 'production') && !allowedOrigins.length) {
    console.warn('⚠️ WARNING: Allowed origins list is empty in production');
}

const signToken = (token) =>
    crypto.createHmac('sha256', getCsrfSecret()).update(token).digest('hex');

const timingSafeEqual = (left, right) => {
    const leftBuffer = Buffer.from(String(left || ''), 'utf8');
    const rightBuffer = Buffer.from(String(right || ''), 'utf8');
    if (leftBuffer.length !== rightBuffer.length) return false;
    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const buildSignedToken = () => {
    const token = crypto.randomBytes(32).toString('base64url');
    return `${token}.${signToken(token)}`;
};

const splitSignedToken = (signedToken = '') => {
    const [token, signature] = String(signedToken).split('.');
    return { token, signature };
};

const buildCsrfCookieOptions = (maxAge = 2 * 60 * 60 * 1000) => ({
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.CSRF_COOKIE_SAME_SITE || process.env.REFRESH_COOKIE_SAME_SITE || 'lax',
    path: CSRF_COOKIE_PATH,
    maxAge
});

const issueCsrfToken = (req, res) => {
    const signedToken = buildSignedToken();
    const { token } = splitSignedToken(signedToken);
    res.cookie(CSRF_COOKIE_NAME, signedToken, buildCsrfCookieOptions());
    return token;
};

const csrfTokenHandler = (req, res) => {
    const signedToken = buildSignedToken();
    const { token } = splitSignedToken(signedToken);
    res.cookie(CSRF_COOKIE_NAME, signedToken, buildCsrfCookieOptions());
    res.json({
        csrfToken: token,
        signedToken: signedToken,
        headerName: CSRF_HEADER_NAME
    });
};

const getRequestOrigin = (req) => {
    const origin = req.get('origin');
    if (origin) return origin;

    const referer = req.get('referer');
    if (!referer) return '';

    try {
        const parsed = new URL(referer);
        return parsed.origin;
    } catch {
        return '';
    }
};

const validateOrigin = (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();

    const isProduction = isProd || process.env.NODE_ENV === 'production';
    const currentAllowedOrigins = getAllowedOrigins();

    if (isProduction && !currentAllowedOrigins.length) {
        console.warn('⚠️ WARNING: Allowed origins list is empty in production');
        return res.status(403).json({ message: 'Sorğu mənbəyi icazəli deyil' });
    }

    const origin = getRequestOrigin(req);
    const allowNoOrigin = !isProduction && process.env.CSRF_ALLOW_NO_ORIGIN === 'true';

    if (!origin) {
        if (allowNoOrigin) return next();
        return res.status(403).json({ message: 'Sorğu mənbəyi icazəli deyil' });
    }

    if (isOriginAllowed(origin)) return next();

    return res.status(403).json({ message: 'Sorğu mənbəyi icazəli deyil' });
};

const verifyCsrfToken = (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();

    const headerToken = req.get(CSRF_HEADER_NAME);
    const cookieVal = req.headers.cookie ? parseCookies(req.headers.cookie)[CSRF_COOKIE_NAME] : undefined;
    const signedCookie = cookieVal || req.get('x-csrf-signed-token');

    const isBearerAuth = Boolean(req.user || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')));

    if (!headerToken || !signedCookie) {
        if (isBearerAuth) return next();
        return res.status(403).json({ message: 'CSRF token tələb olunur' });
    }

    const { token, signature } = splitSignedToken(signedCookie);
    if (!token || !signature) {
        if (isBearerAuth) return next();
        return res.status(403).json({ message: 'CSRF token tələb olunur' });
    }

    if (!timingSafeEqual(headerToken, token) || !timingSafeEqual(signature, signToken(token))) {
        if (isBearerAuth) return next();
        return res.status(403).json({ message: 'CSRF token yanlışdır' });
    }

    return next();
};

const csrfProtection = [validateOrigin, verifyCsrfToken];

module.exports = {
    CSRF_COOKIE_NAME,
    CSRF_HEADER_NAME,
    buildCsrfCookieOptions,
    csrfProtection,
    csrfTokenHandler,
    getCsrfSecret,
    issueCsrfToken,
    parseCookies,
    signToken,
    validateOrigin,
    verifyCsrfToken
};
