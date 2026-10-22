/**
 * sanitize.js
 * ──────────────────────────────────────────────────────────────
 * Custom XSS and MongoDB sanitization middleware.
 * Fully compatible with Express 5 (handles read-only req.query getter).
 *
 * Fields explicitly excluded from sanitization:
 *   • password / confirmPassword – must never be altered; hashed as-is
 *   • token                      – crypto hex token; must stay exact
 */

const xss = require('xss');

// ── XSS options: strip ALL tags (no whitelist) ────────────────────────────────
const xssOptions = {
    whiteList:        {},   // allow zero tags
    stripIgnoreTag:   true, // remove disallowed tags entirely
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
};

// Fields whose values must never be modified by sanitization
const SKIP_FIELDS = new Set(['password', 'confirmPassword', 'newPassword', 'oldPassword', 'token']);

/**
 * Recursively sanitize all string values in a plain object or array.
 * @param {*} value   - The value to sanitize (object, array, or primitive)
 * @param {string} [key] - The key of the current value (used to skip password fields)
 * @returns {*}       - The sanitized value
 */
function sanitizeValue(value, key = '') {
    // Skip sensitive fields that must not be mutated
    if (SKIP_FIELDS.has(key)) return value;

    if (typeof value === 'string') {
        return xss(value.trim(), xssOptions);
    }

    if (Array.isArray(value)) {
        return value.map((item) => sanitizeValue(item));
    }

    if (value !== null && typeof value === 'object') {
        const sanitized = {};
        for (const [k, v] of Object.entries(value)) {
            sanitized[k] = sanitizeValue(v, k);
        }
        return sanitized;
    }

    // Numbers, booleans, null, undefined – pass through unchanged
    return value;
}

/**
 * Express middleware: sanitize req.body, req.query, and req.params against XSS.
 */
const xssSanitizer = (req, res, next) => {
    if (req.body   && typeof req.body   === 'object') req.body   = sanitizeValue(req.body);
    if (req.query  && typeof req.query  === 'object') {
        const cleanQuery = sanitizeValue(req.query);
        Object.defineProperty(req, 'query', {
            value: cleanQuery,
            writable: true,
            configurable: true,
            enumerable: true
        });
    }
    if (req.params && typeof req.params === 'object') req.params = sanitizeValue(req.params);
    next();
};

/**
 * Check recursively if an object contains keys starting with $ or containing .
 */
function hasMongoOperators(value) {
    if (value === null || typeof value !== 'object') {
        return false;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            if (hasMongoOperators(item)) return true;
        }
        return false;
    }
    for (const key of Object.keys(value)) {
        if (key.startsWith('$') || key.includes('.')) {
            return true;
        }
        if (hasMongoOperators(value[key])) {
            return true;
        }
    }
    return false;
}

/**
 * Clean keys starting with $ or containing .
 */
function sanitizeMongo(value, replaceWith = '_') {
    if (value === null || typeof value !== 'object') {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map(item => sanitizeMongo(item, replaceWith));
    }
    const sanitized = {};
    for (const [key, val] of Object.entries(value)) {
        let newKey = key;
        if (replaceWith) {
            newKey = key.replace(/[\$.]/g, replaceWith);
        } else {
            if (key.startsWith('$') || key.includes('.')) {
                continue;
            }
        }
        sanitized[newKey] = sanitizeMongo(val, replaceWith);
    }
    return sanitized;
}

/**
 * Express middleware: sanitize req.body, req.query, and req.params against MongoDB injection.
 */
const mongoSanitizer = (options = {}) => {
    const replaceWith = options.replaceWith !== undefined ? options.replaceWith : '_';
    const onSanitizeError = options.onSanitizeError;

    return (req, res, next) => {
        let hasError = false;

        if (onSanitizeError) {
            if (
                (req.body && hasMongoOperators(req.body)) ||
                (req.query && hasMongoOperators(req.query)) ||
                (req.params && hasMongoOperators(req.params))
            ) {
                hasError = true;
            }
        }

        if (hasError) {
            return onSanitizeError(req, res, next);
        }

        // Sanitize the inputs
        if (req.body && typeof req.body === 'object') {
            req.body = sanitizeMongo(req.body, replaceWith);
        }
        if (req.query && typeof req.query === 'object') {
            const cleanQuery = sanitizeMongo(req.query, replaceWith);
            Object.defineProperty(req, 'query', {
                value: cleanQuery,
                writable: true,
                configurable: true,
                enumerable: true
            });
        }
        if (req.params && typeof req.params === 'object') {
            req.params = sanitizeMongo(req.params, replaceWith);
        }

        next();
    };
};

module.exports = { xssSanitizer, mongoSanitizer };
