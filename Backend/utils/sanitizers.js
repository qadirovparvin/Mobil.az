const xss = require('xss');

const MAX_TEXT_LENGTH = Number(process.env.MAX_TEXT_FIELD_LENGTH || 5000);

const htmlDangerPattern = /<\s*(script|iframe|object|embed|link|meta|style|svg|math)\b|on\w+\s*=|javascript\s*:|data\s*:\s*text\/html/i;

const sanitizePlainText = (value, { maxLength = MAX_TEXT_LENGTH, allowEmpty = true } = {}) => {
    if (value === undefined || value === null) return allowEmpty ? '' : null;
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') return null;

    const raw = String(value).trim();
    if (!raw && !allowEmpty) return null;
    if (raw.length > maxLength) return null;

    return xss(raw, {
        whiteList: {},
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
        css: false
    }).trim();
};

const sanitizeTextField = (target, field, value, options) => {
    const sanitized = sanitizePlainText(value, options);
    if (sanitized === null) {
        const error = new Error(`${field} is invalid`);
        error.status = 400;
        throw error;
    }
    target[field] = sanitized;
};

const pickAllowedFields = (body = {}, allowed = []) =>
    allowed.reduce((picked, field) => {
        if (Object.prototype.hasOwnProperty.call(body, field)) {
            picked[field] = body[field];
        }
        return picked;
    }, {});

const sanitizeUrl = (value, { allowEmpty = true } = {}) => {
    if (value === undefined || value === null || value === '') return allowEmpty ? '' : null;
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed && allowEmpty) return '';
    if (/^(javascript|data|vbscript):/i.test(trimmed)) return null;
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
        return xss(trimmed, { whiteList: {}, stripIgnoreTag: true, css: false }).trim();
    }
    return null;
};

const sanitizeUrlArray = (values, { maxItems = 10 } = {}) => {
    if (values === undefined) return undefined;
    if (!Array.isArray(values) || values.length > maxItems) return null;
    const sanitized = values.map((value) => sanitizeUrl(value, { allowEmpty: false }));
    if (sanitized.some((value) => value === null)) return null;
    return sanitized;
};

const ALLOWED_SPEC_FIELDS = [
    'memory', 'ram', 'screenSize', 'battery', 'color',
    'material', 'connectionType', 'headphoneType', 'power', 'portType', 'cableType', 'cableLength', 'glassType'
];
const ALLOWED_FEATURE_FIELDS = [
    'nfc', 'waterproof', 'fingerprint', 'expandable', 'delivery',
    'magsafe', 'microphone', 'anc', 'fastCharge', 'wirelessCharge', 'oleophobic', 'stylus', 'simCard'
];

const ALLOWED_SPEC_VALUES = {
    screenSize: ['<5.5', '5.5-6.1', '6.1-6.7', '>6.7', 'other'],
    battery: ['<3000', '3000-4000', '3000-4500', '4000-5000', '5000+', '>4500', 'other'],
    memory: ['16', '32', '64', '64-dan-az', 'below-64', '128', '256', '512', '1024', '512-den-cox', '512+', 'other'],
    ram: ['2', '3', '4', '6', '8', '12', '16', '16-dan-cox', '16+', 'other'],
    color: ['black', 'white', 'gold', 'silver', 'grey', 'blue', 'other']
};

const sanitizeSpecs = (specs = {}) => {
    if (!specs || typeof specs !== 'object' || Array.isArray(specs)) return {};
    const clean = {};

    ALLOWED_SPEC_FIELDS.forEach((field) => {
        if (specs[field] !== undefined) {
            if (specs[field] === null) {
                clean[field] = null;
                return;
            }
            const rawVal = String(specs[field]).trim();
            if (rawVal === '') {
                clean[field] = null;
                return;
            }

            const allowed = ALLOWED_SPEC_VALUES[field];
            if (allowed && allowed.includes(rawVal)) {
                clean[field] = rawVal;
            } else {
                const sanitized = sanitizePlainText(rawVal, { maxLength: 80 });
                if (sanitized === null) {
                    const error = new Error(`specs.${field} düzgün deyil`);
                    error.status = 400;
                    error.expose = true;
                    throw error;
                }
                clean[field] = sanitized;
            }
        }
    });

    if (specs.features && typeof specs.features === 'object' && !Array.isArray(specs.features)) {
        clean.features = {};
        ALLOWED_FEATURE_FIELDS.forEach((field) => {
            if (specs.features[field] !== undefined) clean.features[field] = Boolean(specs.features[field]);
        });
    }

    return clean;
};

module.exports = {
    ALLOWED_FEATURE_FIELDS,
    ALLOWED_SPEC_FIELDS,
    ALLOWED_SPEC_VALUES,
    htmlDangerPattern,
    pickAllowedFields,
    sanitizePlainText,
    sanitizeSpecs,
    sanitizeTextField,
    sanitizeUrl,
    sanitizeUrlArray
};

