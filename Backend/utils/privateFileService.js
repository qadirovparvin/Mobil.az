const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PRIVATE_UPLOAD_ROOT = path.resolve(process.env.PRIVATE_UPLOAD_ROOT || path.join(__dirname, '../private_uploads'));
const KYC_ROOT = path.join(PRIVATE_UPLOAD_ROOT, 'kyc');

const ensurePrivateDirs = () => {
    fs.mkdirSync(KYC_ROOT, { recursive: true, mode: 0o700 });
};

const safeJoinPrivate = (storageKey) => {
    const normalized = path.normalize(storageKey || '').replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.resolve(PRIVATE_UPLOAD_ROOT, normalized);
    if (!fullPath.startsWith(PRIVATE_UPLOAD_ROOT + path.sep)) {
        const error = new Error('Invalid private file path');
        error.status = 400;
        throw error;
    }
    return fullPath;
};

const detectDocumentSignature = async (filePath) => {
    const fd = await fs.promises.open(filePath, 'r');
    try {
        const buffer = Buffer.alloc(12);
        const { bytesRead } = await fd.read(buffer, 0, buffer.length, 0);
        const head = buffer.subarray(0, bytesRead);
        if (head.subarray(0, 4).toString('hex') === '25504446') return 'application/pdf';
        if (head.subarray(0, 3).toString('hex') === 'ffd8ff') return 'image/jpeg';
        if (head.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') return 'image/png';
        if (head.subarray(0, 4).toString() === 'RIFF' && head.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
        if (head.subarray(0, 4).toString('hex') === '47494638') return 'image/gif';
        return '';
    } finally {
        await fd.close();
    }
};

const buildKycStorageKey = (extension) => `kyc/${crypto.randomUUID()}${extension}`;

module.exports = {
    PRIVATE_UPLOAD_ROOT,
    KYC_ROOT,
    buildKycStorageKey,
    detectDocumentSignature,
    ensurePrivateDirs,
    safeJoinPrivate
};
