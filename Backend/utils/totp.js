const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const TOTP_STEP_SECONDS = 30;
const TOTP_WINDOW = 1;

let devFallbackKey = null;
const getDevFallbackKey = () => {
    if (!devFallbackKey) {
        devFallbackKey = crypto.randomBytes(32);
    }
    return devFallbackKey;
};

const isTwoFactorAvailable = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const configured = process.env.TWO_FACTOR_SECRET_ENCRYPTION_KEY;
    if (isProduction && !configured) return false;
    if (configured && (!/^[0-9a-f]{64}$/i.test(configured) || Buffer.from(configured, 'hex').length !== 32)) return false;
    return true;
};

const validateTotpConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const configured = process.env.TWO_FACTOR_SECRET_ENCRYPTION_KEY;

    if (isProduction && !configured) {
        console.error('TWO_FACTOR_SECRET_ENCRYPTION_KEY missing in production, 2FA functions are disabled');
        return false;
    }

    if (configured && (!/^[0-9a-f]{64}$/i.test(configured) || Buffer.from(configured, 'hex').length !== 32)) {
        if (isProduction) {
            console.error('TWO_FACTOR_SECRET_ENCRYPTION_KEY must be 64 hex chars (32 bytes), 2FA disabled');
            return false;
        } else {
            console.warn('TWO_FACTOR_SECRET_ENCRYPTION_KEY invalid, using dev fallback key');
            return false;
        }
    }

    if (!configured) {
        console.warn('2FA key missing, using dev fallback key (32-byte random)');
    }
    return true;
};

// Validate on app startup
validateTotpConfig();

const getEncryptionKey = () => {
    validateTotpConfig();
    const isProduction = process.env.NODE_ENV === 'production';
    const configured = process.env.TWO_FACTOR_SECRET_ENCRYPTION_KEY;
    if (configured && /^[0-9a-f]{64}$/i.test(configured) && Buffer.from(configured, 'hex').length === 32) {
        return Buffer.from(configured, 'hex');
    }
    if (isProduction) {
        return null;
    }
    return getDevFallbackKey();
};

const base32Encode = (buffer) => {
    let bits = '';
    for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
    let output = '';
    for (let i = 0; i < bits.length; i += 5) {
        const chunk = bits.slice(i, i + 5).padEnd(5, '0');
        output += ALPHABET[parseInt(chunk, 2)];
    }
    return output;
};

const base32Decode = (input) => {
    const normalized = String(input || '').replace(/=+$/g, '').replace(/\s+/g, '').toUpperCase();
    let bits = '';
    for (const char of normalized) {
        const index = ALPHABET.indexOf(char);
        if (index === -1) throw new Error('Invalid base32 secret');
        bits += index.toString(2).padStart(5, '0');
    }
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.slice(i, i + 8), 2));
    }
    return Buffer.from(bytes);
};

const generateTotpSecret = () => base32Encode(crypto.randomBytes(20));

const encryptSecret = (secret) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
};

const decryptSecret = (encryptedSecret) => {
    const [ivHex, tagHex, encryptedHex] = String(encryptedSecret || '').split(':');
    if (!ivHex || !tagHex || !encryptedHex) throw new Error('Invalid encrypted 2FA secret');
    const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([
        decipher.update(Buffer.from(encryptedHex, 'hex')),
        decipher.final()
    ]).toString('utf8');
};

const generateTotpCode = (secret, timeStep = Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS)) => {
    const key = base32Decode(secret);
    const counter = Buffer.alloc(8);
    counter.writeUInt32BE(Math.floor(timeStep / 0x100000000), 0);
    counter.writeUInt32BE(timeStep >>> 0, 4);
    const hmac = crypto.createHmac('sha1', key).update(counter).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = ((hmac[offset] & 0x7f) << 24)
        | ((hmac[offset + 1] & 0xff) << 16)
        | ((hmac[offset + 2] & 0xff) << 8)
        | (hmac[offset + 3] & 0xff);
    return String(code % 1000000).padStart(6, '0');
};

const verifyTotpCode = ({ secret, code, lastUsedStep = null }) => {
    if (!/^\d{6}$/.test(String(code || ''))) return { valid: false };
    const currentStep = Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS);

    for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset += 1) {
        const step = currentStep + offset;
        if (lastUsedStep !== null && step <= lastUsedStep) continue;
        if (generateTotpCode(secret, step) === String(code)) {
            return { valid: true, timeStep: step };
        }
    }
    return { valid: false };
};

const generateRecoveryCodes = (count = 10) =>
    Array.from({ length: count }, () => crypto.randomBytes(5).toString('hex').toUpperCase().match(/.{1,5}/g).join('-'));

const hashRecoveryCode = async (code) => bcrypt.hash(String(code).replace(/\s+/g, '').toUpperCase(), 12);

const verifyRecoveryCode = async (code, hashedCodes = []) => {
    const normalized = String(code || '').replace(/\s+/g, '').toUpperCase();
    if (!normalized) return { valid: false };
    for (let index = 0; index < hashedCodes.length; index += 1) {
        if (await bcrypt.compare(normalized, hashedCodes[index])) {
            return { valid: true, index };
        }
    }
    return { valid: false };
};

const buildOtpAuthUrl = ({ accountName, issuer, secret }) =>
    `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=${TOTP_STEP_SECONDS}`;

module.exports = {
    buildOtpAuthUrl,
    decryptSecret,
    encryptSecret,
    generateRecoveryCodes,
    generateTotpCode,
    generateTotpSecret,
    getEncryptionKey,
    hashRecoveryCode,
    isTwoFactorAvailable,
    validateTotpConfig,
    verifyRecoveryCode,
    verifyTotpCode
};
