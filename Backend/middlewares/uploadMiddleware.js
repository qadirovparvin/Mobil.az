const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const sharp = require('sharp'); // Sharp library for image optimization
const crypto = require('crypto');
const {
    KYC_ROOT,
    buildKycStorageKey,
    detectDocumentSignature,
    ensurePrivateDirs,
    safeJoinPrivate
} = require('../utils/privateFileService');
const logger = require('../utils/logger');

const MAX_UPLOAD_FILE_SIZE = Number(process.env.MAX_UPLOAD_FILE_SIZE || 5 * 1024 * 1024);
const MAX_UPLOAD_FILES = Number(process.env.MAX_UPLOAD_FILES || 10);
const MAX_UPLOAD_FIELDS = Number(process.env.MAX_UPLOAD_FIELDS || 20);
const MAX_UPLOAD_PARTS = Number(process.env.MAX_UPLOAD_PARTS || 35);
const MAX_UPLOAD_HEADER_PAIRS = Number(process.env.MAX_UPLOAD_HEADER_PAIRS || 100);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const tempUploadDir = path.join(os.tmpdir(), 'uploads');
if (!fs.existsSync(tempUploadDir)) {
    fs.mkdirSync(tempUploadDir, { recursive: true });
}
ensurePrivateDirs();

// Disk-backed temporary storage avoids keeping concurrent large uploads in RAM.
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, tempUploadDir),
    filename: (req, file, cb) => {
        const safeExt = path.extname(file.originalname).toLowerCase() || '.upload';
        cb(null, `${file.fieldname}-${crypto.randomUUID()}${safeExt}`);
    }
});

const allowedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

// Check file type (preliminary dual extension + mimetype check, signature is validated in processImage)
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file?.originalname || '').toLowerCase());
    const mimetype = String(file?.mimetype || '').trim().toLowerCase();
    const normalizedMime = mimetype === 'image/jpg' ? 'image/jpeg' : mimetype;
    const mimetypeOk = allowedImageMimeTypes.has(normalizedMime);

    if (extname && mimetypeOk) {
        return cb(null, true);
    } else {
        return cb(new Error('Sadece şəkil faylları yüklənə bilər!'));
    }
}

// Init upload
const upload = multer({
    storage,
    limits: {
        fileSize: MAX_UPLOAD_FILE_SIZE,
        files: MAX_UPLOAD_FILES,
        fields: MAX_UPLOAD_FIELDS,
        parts: MAX_UPLOAD_PARTS,
        headerPairs: MAX_UPLOAD_HEADER_PAIRS
    },
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

const allowedKycMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const kycStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, tempUploadDir),
    filename: (req, file, cb) => cb(null, `kyc-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase() || '.upload'}`)
});

function checkKycFileType(file, cb) {
    const filetypes = /pdf|jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file?.originalname || '').toLowerCase());
    const mimetype = String(file?.mimetype || '').trim().toLowerCase();
    const normalizedMime = mimetype === 'image/jpg' ? 'image/jpeg' : mimetype;
    const mimetypeOk = allowedKycMimeTypes.has(normalizedMime);

    if (extname && mimetypeOk) {
        return cb(null, true);
    } else {
        return cb(new Error('Yalnız PDF, JPG, PNG və WEBP sənədləri qəbul olunur - Fayl növü uyğun deyil: ' + (file?.mimetype || 'naməlum')));
    }
}

const uploadKycDocuments = multer({
    storage: kycStorage,
    limits: {
        fileSize: Number(process.env.KYC_MAX_FILE_SIZE || 8 * 1024 * 1024),
        files: 2,
        fields: 10,
        parts: 12,
        headerPairs: MAX_UPLOAD_HEADER_PAIRS
    },
    fileFilter(req, file, cb) {
        if (!['taxDocument', 'identityDocument'].includes(file.fieldname)) {
            return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname));
        }
        checkKycFileType(file, cb);
    }
});

const processKycDocuments = async (req, res, next) => {
    const files = Object.values(req.files || {}).flat();
    if (!files.length) return next();

    try {
        req.kycDocuments = {};
        for (const file of files) {
            const detected = await detectDocumentSignature(file.path);
            if (!allowedKycMimeTypes.has(detected)) {
                await fs.promises.unlink(file.path).catch(() => {});
                return res.status(400).json({ message: 'Sənədin fayl imzası düzgün deyil' });
            }

            const extByMime = {
                'application/pdf': '.pdf',
                'image/jpeg': '.jpg',
                'image/png': '.png',
                'image/webp': '.webp'
            };
            const storageKey = buildKycStorageKey(extByMime[detected] || '.bin');
            const targetPath = safeJoinPrivate(storageKey);
            await fs.promises.rename(file.path, targetPath);

            req.kycDocuments[file.fieldname] = {
                storageKey,
                originalName: path.basename(file.originalname || ''),
                mimeType: detected,
                size: file.size,
                uploadedAt: new Date()
            };
        }
        next();
    } catch (error) {
        await Promise.all(files.map((file) => file.path && fs.promises.unlink(file.path).catch(() => {})));
        next(error);
    }
};

// Middleware to process images with Sharp
const processImage = async (req, res, next) => {
    if (!req.file && (!req.files || req.files.length === 0)) {
        return next();
    }

    try {
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const validateSignature = async (file) => {
            const detected = await detectDocumentSignature(file.path);
            if (!allowedImageTypes.includes(detected)) {
                throw new Error('Sadece şəkil faylları yüklənə bilər!');
            }
        };

        if (req.file) {
            await validateSignature(req.file);
        } else if (req.files) {
            for (const file of req.files) {
                await validateSignature(file);
            }
        }

        // Create an SVG watermark dynamically
        const svgWatermark = Buffer.from(`
            <svg width="400" height="200">
                <style>
                .title { fill: rgba(255, 255, 255, 0.45); font-size: 54px; font-weight: 800; font-family: Arial, sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }
                </style>
                <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="title" transform="rotate(-15 200 100)">Mobilim.az</text>
            </svg>
        `);

        // Reusable processing function
        const processFile = async (file) => {
            const filename = `${file.fieldname}-${crypto.randomUUID()}.webp`;
            const filepath = path.join(uploadDir, filename);

            const image = sharp(file.path);
            const metadata = await image.metadata();

            let pipeline = image.resize(1200, null, { withoutEnlargement: true });
            if (metadata.width && metadata.width >= 400 && metadata.height && metadata.height >= 200) {
                pipeline = pipeline.composite([{ input: svgWatermark, gravity: 'center' }]);
            }

            await pipeline
                .webp({ quality: 80 })
                .toFile(filepath);

            await fs.promises.unlink(file.path).catch(() => {});

            // Mutate the original file object so downstream routes work normally
            file.filename = filename;
            file.path = filepath;
            file.mimetype = 'image/webp';
        };

        if (req.file) {
            await processFile(req.file);
        } else if (req.files) {
            for (const file of req.files) {
                await processFile(file);
            }
        }

        next();
    } catch (error) {
        const uploadedFiles = req.file ? [req.file] : (req.files || []);
        await Promise.all(uploadedFiles.map((file) =>
            file.path && fs.promises.unlink(file.path).catch(() => {})
        ));
        logger.error("Image Processing Error:", error);
        next(error);
    }
};

const uploadErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        const messages = {
            LIMIT_FILE_SIZE: 'Fayl ölçüsü icazə verilən limitdən böyükdür',
            LIMIT_FILE_COUNT: 'Bir sorğuda çox sayda fayl göndərildi',
            LIMIT_FIELD_COUNT: 'Bir sorğuda çox sayda sahə göndərildi',
            LIMIT_PART_COUNT: 'Multipart sorğuda çox sayda hissə var',
            LIMIT_HEADER_COUNT: 'Multipart başlıq limiti keçildi',
            LIMIT_UNEXPECTED_FILE: 'Gözlənilməyən fayl sahəsi'
        };

        return res.status(413).json({ message: messages[err.code] || 'Yükləmə limiti keçildi' });
    }

    if (err && err.message && (
        err.message === 'Sadece şəkil faylları yüklənə bilər!' ||
        err.message.startsWith('Yalnız PDF, JPG, PNG və WEBP sənədləri qəbul olunur')
    )) {
        return res.status(400).json({ message: err.message });
    }

    return next(err);
};

module.exports = {
    MAX_UPLOAD_FILES,
    upload,
    uploadKycDocuments,
    processImage,
    processKycDocuments,
    uploadErrorHandler,
    allowedKycMimeTypes,
    allowedImageMimeTypes,
    checkFileType,
    checkKycFileType
};
