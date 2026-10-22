const { sanitizePlainText } = require('../utils/sanitizers');

const sanitizeValue = (value, key) => {
    if (key === 'specs') {
        // Structured specifications are validated against explicit server-side allowlists in sanitizeSpecs
        return value;
    }
    if (typeof value === 'string') return sanitizePlainText(value, { maxLength: parseInt(process.env.MAX_INPUT_LENGTH) || 10000 });
    if (Array.isArray(value)) return value.map((item) => sanitizeValue(item));
    if (value && typeof value === 'object') {
        return Object.keys(value).reduce((clean, k) => {
            clean[k] = sanitizeValue(value[k], k);
            return clean;
        }, {});
    }
    return value;
};


const xssMiddleware = (req, res, next) => {
    if (req.body && typeof req.body === 'object') req.body = sanitizeValue(req.body);
    if (req.query && typeof req.query === 'object') req.query = sanitizeValue(req.query);
    if (req.params && typeof req.params === 'object') req.params = sanitizeValue(req.params);
    next();
};

module.exports = xssMiddleware;
