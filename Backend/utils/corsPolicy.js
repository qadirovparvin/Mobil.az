const DEFAULT_DEV_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:5501',
    'http://127.0.0.1:5501',
    'http://localhost:5502',
    'http://127.0.0.1:5502'
];

const parseOriginList = (originStr) => {
    if (!originStr || typeof originStr !== 'string') return [];
    return originStr.split(',').map((origin) => origin.trim()).filter(Boolean);
};

const getAllowedOrigins = () => {
    const rawOrigins = process.env.CORS_ORIGINS !== undefined
        ? process.env.CORS_ORIGINS
        : process.env.ALLOWED_ORIGINS;

    if (rawOrigins !== undefined) {
        return parseOriginList(rawOrigins);
    }

    return process.env.NODE_ENV !== 'production'
        ? [...DEFAULT_DEV_ORIGINS]
        : [];
};

const isOriginAllowed = (origin) => {
    // In development or when explicitly enabled, allow missing origin or 'null' (e.g., file:// protocol)
    const allowNoOrigin = process.env.CORS_ALLOW_NO_ORIGIN === undefined
        ? process.env.NODE_ENV !== 'production'
        : process.env.CORS_ALLOW_NO_ORIGIN === 'true';

    if ((!origin || origin === 'null') && allowNoOrigin) {
        return true;
    }

    // In development, allow any localhost or 127.0.0.1 port (5500, 5501, 5502, 5503, 3000, 8080, etc.)
    if (process.env.NODE_ENV !== 'production' && origin) {
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            return true;
        }
    }

    // Allow production Render and custom domains
    if (origin && (
        origin.includes('onrender.com') ||
        origin.includes('mobilim.az') ||
        origin === 'https://mobilim-az.onrender.com' ||
        origin === 'https://mobil-az.onrender.com' ||
        origin === 'https://mobilim.az' ||
        origin === 'https://www.mobilim.az'
    )) {
        return true;
    }

    const allowedOrigins = getAllowedOrigins();
    return allowedOrigins.includes(origin);
};

const buildCorsOptions = () => ({
    origin(origin, callback) {
        if (isOriginAllowed(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-CSRF-Signed-Token', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma']
});

module.exports = {
    DEFAULT_DEV_ORIGINS,
    buildCorsOptions,
    getAllowedOrigins,
    isOriginAllowed
};

