const mongoose = require('mongoose');

const DANGEROUS_KEY_PATTERN = /(^\$)|\./;
const EMAIL_MAX_LENGTH = 254;
const SIMPLE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createValidationError = (message = 'Sorğu formatı düzgün deyil') => {
    const error = new Error(message);
    error.status = 400;
    error.expose = true;
    return error;
};

const hasDangerousKeys = (value) => {
    if (!value || typeof value !== 'object') return false;
    if (Array.isArray(value)) return value.some(hasDangerousKeys);

    return Object.keys(value).some((key) =>
        DANGEROUS_KEY_PATTERN.test(key) || hasDangerousKeys(value[key])
    );
};

const rejectDangerousKeys = (value, message) => {
    if (hasDangerousKeys(value)) {
        throw createValidationError(message || 'Sorğuda icazəsiz operator var');
    }
};

const rejectNoSqlOperators = (req, res, next) => {
    try {
        rejectDangerousKeys(req.body, 'Sorğu gövdəsində icazəsiz operator var');
        rejectDangerousKeys(req.query, 'Sorğu parametrlərində icazəsiz operator var');
        next();
    } catch (error) {
        next(error);
    }
};

const isPlainObject = (value) =>
    Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const ensureScalar = (value, fieldName = 'field') => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'object') {
        throw createValidationError(`${fieldName} düzgün formatda deyil`);
    }
    return value;
};

const readString = (value, {
    fieldName = 'field',
    required = false,
    trim = true,
    maxLength = 255,
    allowEmpty = !required,
    uppercase = false,
    lowercase = false
} = {}) => {
    const scalar = ensureScalar(value, fieldName);
    if (scalar === undefined || scalar === '') {
        if (required) throw createValidationError(`${fieldName} mütləqdir`);
        return '';
    }

    let text = String(scalar);
    if (trim) text = text.trim();
    if (!text && !allowEmpty) throw createValidationError(`${fieldName} boş ola bilməz`);
    if (text.length > maxLength) throw createValidationError(`${fieldName} çox uzundur`);
    if (uppercase) text = text.toUpperCase();
    if (lowercase) text = text.toLowerCase();
    return text;
};

const readNumber = (value, {
    fieldName = 'field',
    required = false,
    min = Number.NEGATIVE_INFINITY,
    max = Number.POSITIVE_INFINITY,
    integer = false
} = {}) => {
    const scalar = ensureScalar(value, fieldName);
    if (scalar === undefined || scalar === '') {
        if (required) throw createValidationError(`${fieldName} mütləqdir`);
        return undefined;
    }

    const number = Number(scalar);
    if (!Number.isFinite(number)) throw createValidationError(`${fieldName} rəqəm olmalıdır`);
    if (integer && !Number.isInteger(number)) throw createValidationError(`${fieldName} tam rəqəm olmalıdır`);
    if (number < min || number > max) throw createValidationError(`${fieldName} icazə verilən aralıqda deyil`);
    return number;
};

const readBoolean = (value, {
    fieldName = 'field',
    required = false
} = {}) => {
    const scalar = ensureScalar(value, fieldName);
    if (scalar === undefined || scalar === '') {
        if (required) throw createValidationError(`${fieldName} mütləqdir`);
        return undefined;
    }
    if (typeof scalar === 'boolean') return scalar;
    if (scalar === 'true') return true;
    if (scalar === 'false') return false;
    throw createValidationError(`${fieldName} boolean olmalıdır`);
};

const readEnum = (value, allowed, options = {}) => {
    const text = readString(value, options);
    if (!text && !options.required) return text;
    if (!allowed.includes(text)) {
        throw createValidationError(`${options.fieldName || 'field'} düzgün deyil`);
    }
    return text;
};

const readObjectId = (value, fieldName = 'id') => {
    const text = readString(value, { fieldName, required: true, maxLength: 32 });
    if (!mongoose.Types.ObjectId.isValid(text)) {
        throw createValidationError(`${fieldName} düzgün deyil`);
    }
    return text;
};

const validateObjectIdParam = (paramName = 'id') => (req, res, next) => {
    try {
        readObjectId(req.params[paramName], paramName);
        next();
    } catch (error) {
        next(error);
    }
};

const validateAllowedFields = (source = {}, allowed = [], sourceName = 'body') => {
    if (!isPlainObject(source)) {
        throw createValidationError(`${sourceName} obyekt olmalıdır`);
    }
    const allowedSet = new Set(allowed);
    const unexpected = Object.keys(source).filter((key) => !allowedSet.has(key));
    if (unexpected.length) {
        throw createValidationError(`${sourceName} icazəsiz sahə ehtiva edir`);
    }
};

const normalizeEmail = (email) => {
    const normalized = readString(email, {
        fieldName: 'email',
        required: true,
        lowercase: true,
        maxLength: EMAIL_MAX_LENGTH
    });
    if (!SIMPLE_EMAIL_PATTERN.test(normalized)) {
        throw createValidationError('Düzgün email formatı daxil edin');
    }
    return normalized;
};

const optionalEmail = (email) => {
    if (email === undefined || email === null || email === '') return '';
    return normalizeEmail(email);
};

const safePageLimit = (query = {}, { defaultLimit = 20, maxLimit = 100 } = {}) => {
    const page = readNumber(query.page, {
        fieldName: 'page',
        min: 1,
        max: 100000,
        integer: true
    }) || 1;
    const limit = readNumber(query.limit, {
        fieldName: 'limit',
        min: 1,
        max: maxLimit,
        integer: true
    }) || defaultLimit;
    return { page, limit, skip: (page - 1) * limit };
};

const validationErrorHandler = (err, req, res, next) => {
    if (err.status === 400 && err.expose) {
        return res.status(400).json({ message: err.message });
    }
    return next(err);
};

module.exports = {
    EMAIL_MAX_LENGTH,
    SIMPLE_EMAIL_PATTERN,
    createValidationError,
    hasDangerousKeys,
    rejectDangerousKeys,
    rejectNoSqlOperators,
    readBoolean,
    readEnum,
    readNumber,
    readObjectId,
    readString,
    safePageLimit,
    validateAllowedFields,
    validateObjectIdParam,
    normalizeEmail,
    optionalEmail,
    validationErrorHandler
};
