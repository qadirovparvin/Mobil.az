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
    
    if (cleaned.startsWith('00')) {
        cleaned = '+' + cleaned.substring(2);
    } else if (cleaned.startsWith('0')) {
        cleaned = '+994' + cleaned.substring(1);
    } else if (cleaned.startsWith('994') && !cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+')) {
        // Assume local Azerbaijani number if 9 digits (e.g. 501234567)
        cleaned = '+994' + cleaned;
    }

    // Azerbaijani numbers (+994)
    if (cleaned.startsWith('+994')) {
        if (!/^\+994\d{9}$/.test(cleaned)) {
            const error = new Error('Azərbaycan nömrəsi 9 rəqəmdən ibarət olmalıdır (+994XXXXXXXXX)');
            error.status = 400;
            throw error;
        }

        const prefix = cleaned.slice(4, 6);
        if (!AZ_MOBILE_PREFIXES.has(prefix)) {
            const error = new Error('Telefon prefiksi dəstəklənmir (50, 51, 55, 70, 77, 99, 10, 60)');
            error.status = 400;
            throw error;
        }
        return cleaned;
    }

    // International foreign numbers (E.164: + followed by 7 to 15 digits)
    if (!/^\+[1-9]\d{6,14}$/.test(cleaned)) {
        const error = new Error('Xarici telefon nömrəsi düzgün beynəlxalq formatda deyil (+ və 7-15 rəqəm)');
        error.status = 400;
        throw error;
    }

    return cleaned;
};

const formatPhone = (phone) => {
    if (!phone) return '';
    try {
        const norm = normalizePhone(phone);
        if (norm.startsWith('+994') && norm.length === 13) {
            return `${norm.slice(0, 4)} ${norm.slice(4, 6)} ${norm.slice(6, 9)} ${norm.slice(9, 11)} ${norm.slice(11)}`;
        }
        return norm;
    } catch (_) {
        return phone;
    }
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
