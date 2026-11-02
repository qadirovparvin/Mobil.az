const { getAllowedOrigins } = require('./corsPolicy');

const splitEnvList = (value = '') =>
    String(value).split(',').map((item) => item.trim()).filter(Boolean);

const getApiOrigin = () => {
    if (process.env.API_PUBLIC_ORIGIN) return process.env.API_PUBLIC_ORIGIN;
    if (process.env.NODE_ENV === 'production') return '';
    return `http://localhost:${process.env.PORT || 5000}`;
};

const buildHelmetOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const allowedOrigins = getAllowedOrigins();
    const apiOrigin = getApiOrigin();
    const paymentOrigins = splitEnvList(process.env.PAYMENT_PROVIDER_ORIGINS);
    const imageOrigins = [
        "'self'",
        'data:',
        'blob:',
        apiOrigin,
        ...allowedOrigins,
        'https://images.unsplash.com',
        'https://i.pinimg.com',
        'https://ui-avatars.com',
        ...splitEnvList(process.env.CSP_IMG_SRC)
    ].filter(Boolean);
    const connectOrigins = [
        "'self'",
        apiOrigin,
        ...allowedOrigins,
        ...paymentOrigins,
        ...splitEnvList(process.env.CSP_CONNECT_SRC)
    ].filter(Boolean);

    const directives = {
        "default-src": ["'self'"],
        "script-src": [
            "'self'",
            "'unsafe-inline'",
            'https://cdnjs.cloudflare.com',
            apiOrigin,
            ...splitEnvList(process.env.CSP_SCRIPT_SRC)
        ].filter(Boolean),
        "script-src-attr": ["'unsafe-inline'"],
        "style-src": [
            "'self'",
            "'unsafe-inline'",
            'https://cdnjs.cloudflare.com',
            'https://fonts.googleapis.com',
            ...splitEnvList(process.env.CSP_STYLE_SRC)
        ],
        "img-src": [
            "'self'",
            'data:',
            'blob:',
            'https:',
            'http:',
            apiOrigin,
            'https://mobilim-az.onrender.com',
            'https://mobil-az.onrender.com',
            'https://mobilim.az',
            'https://www.mobilim.az',
            ...allowedOrigins,
            'https://images.unsplash.com',
            'https://i.pinimg.com',
            'https://ui-avatars.com',
            ...splitEnvList(process.env.CSP_IMG_SRC)
        ].filter(Boolean),
        "font-src": [
            "'self'",
            'data:',
            'https://cdnjs.cloudflare.com',
            'https://fonts.gstatic.com',
            ...splitEnvList(process.env.CSP_FONT_SRC)
        ],
        "connect-src": [
            "'self'",
            'https://*.onrender.com',
            'wss://*.onrender.com',
            'https://mobilim-az.onrender.com',
            'wss://mobilim-az.onrender.com',
            'https://mobil-az.onrender.com',
            'wss://mobil-az.onrender.com',
            'https://mobilim.az',
            'https://www.mobilim.az',
            'https://api.mobilim.az',
            apiOrigin,
            ...allowedOrigins,
            ...paymentOrigins,
            ...splitEnvList(process.env.CSP_CONNECT_SRC)
        ].filter(Boolean),
        "object-src": ["'none'"],
        "frame-ancestors": splitEnvList(process.env.CSP_FRAME_ANCESTORS).length
            ? splitEnvList(process.env.CSP_FRAME_ANCESTORS)
            : ["'none'"],
        "base-uri": ["'self'"],
        "form-action": [
            "'self'",
            'https://*.onrender.com',
            'https://mobilim-az.onrender.com',
            'https://mobil-az.onrender.com',
            'https://mobilim.az',
            'https://www.mobilim.az',
            ...allowedOrigins,
            ...paymentOrigins
        ],
        "upgrade-insecure-requests": isProduction ? [] : null
    };

    Object.keys(directives).forEach((key) => {
        if (directives[key] === null) delete directives[key];
    });

    return {
        contentSecurityPolicy: {
            useDefaults: true,
            directives
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' }
    };
};

module.exports = { buildHelmetOptions };
