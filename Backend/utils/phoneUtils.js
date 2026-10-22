/**
 * Phone number normalization and masking utilities.
 */

/**
 * Normalizes an Azerbaijani phone number to E.164 format (+994...)
 * @param {string} phone 
 * @returns {string}
 */
const AZ_MOBILE_PREFIXES = new Set([
    '10', '50', '51', '55', '60', '70', '77', '99'
]);

const normalizePhone = (phone) => {
    if (!phone) return '';
    let cleaned = String(phone).trim().replace(/[^\d+]/g, '');
    
    if (cleaned.startsWith('0')) {
        cleaned = '+994' + cleaned.substring(1);
    } else if (cleaned.startsWith('994')) {
        cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+')) {
        // Assume it's a local number without 0 or +994, e.g., 501234567
        cleaned = '+994' + cleaned;
    }

    if (!/^\+994\d{9}$/.test(cleaned)) {
        const error = new Error('Telefon nömrəsi düzgün formatda deyil');
        error.status = 400;
        throw error;
    }

    const prefix = cleaned.slice(4, 6);
    if (!AZ_MOBILE_PREFIXES.has(prefix)) {
        const error = new Error('Telefon prefiksi dəstəklənmir');
        error.status = 400;
        throw error;
    }
    return cleaned;
};

const formatPhone = (phone) => {
    const norm = normalizePhone(phone);
    return `${norm.slice(0, 4)} ${norm.slice(4, 6)} ${norm.slice(6, 9)} ${norm.slice(9, 11)} ${norm.slice(11)}`;
};

/**
 * Masks a phone number (e.g. +994501234567 -> +99450****567)
 * @param {string} phone 
 * @returns {string}
 */
const maskPhone = (phone) => {
    if (!phone) return '';
    const norm = normalizePhone(phone);
    if (norm.length < 8) return norm; // Too short to mask
    
    const prefix = norm.substring(0, 6); // +99450
    const suffix = norm.substring(norm.length - 3); // 567
    const maskedLength = norm.length - prefix.length - suffix.length;
    
    return prefix + '*'.repeat(Math.max(1, maskedLength)) + suffix;
};

module.exports = {
    AZ_MOBILE_PREFIXES,
    formatPhone,
    normalizePhone,
    maskPhone
};
