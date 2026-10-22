/**
 * Delivery channel configuration utilities.
 * A channel is only considered active if its feature flag is explicitly enabled
 * and all required provider credentials or keys are present in the environment.
 */

const isEmailConfigured = () => {
    // Requires the feature flag to be true
    if (process.env.EMAIL_OTP_ENABLED !== 'true') return false;
    
    // Require actual SMTP credentials (EMAIL_HOST or SMTP_HOST, and user/pass)
    const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
    if (!host || !user || !pass) {
        return false;
    }
    return true;
};

const isSmsConfigured = () => {
    // Requires the feature flag to be true
    if (process.env.SMS_OTP_ENABLED !== 'true') return false;
    
    // In production, require actual SMS API credentials.
    if (process.env.NODE_ENV === 'production') {
        if (!process.env.SMS_API_KEY || !process.env.SMS_API_URL) {
            return false;
        }
    }
    return true;
};

const isTotpConfigured = () => {
    // Requires the feature flag to be true
    if (process.env.TOTP_2FA_ENABLED !== 'true') return false;
    
    // In production, the encryption key must be configured
    if (process.env.NODE_ENV === 'production') {
        if (!process.env.TWO_FACTOR_SECRET_ENCRYPTION_KEY) {
            return false;
        }
    }
    return true;
};

module.exports = {
    isEmailConfigured,
    isSmsConfigured,
    isTotpConfigured
};
