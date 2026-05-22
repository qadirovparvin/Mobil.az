const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp'); // Sharp library for image optimization

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage engine - using memoryStorage so we can process the buffer before saving
const storage = multer.memoryStorage();

// Check file type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Sadece şəkil faylları yüklənə bilər!'));
    }
}

// Init upload
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

// Middleware to process images with Sharp
const processImage = async (req, res, next) => {
    if (!req.file && (!req.files || req.files.length === 0)) {
        return next();
    }

    try {
        // Create an SVG watermark dynamically
        const svgWatermark = Buffer.from(`
            <svg width="400" height="200">
                <style>
                .title { fill: rgba(255, 255, 255, 0.45); font-size: 54px; font-weight: 800; font-family: Arial, sans-serif; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }
                </style>
                <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="title" transform="rotate(-15 200 100)">Mobil.az</text>
            </svg>
        `);

        // Reusable processing function
        const processFile = async (file) => {
            const filename = `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
            const filepath = path.join(uploadDir, filename);

            await sharp(file.buffer)
                .resize(1200, null, { withoutEnlargement: true }) // Max width 1200px, auto-height
                .composite([{ input: svgWatermark, gravity: 'center' }]) // Apply watermark
                .webp({ quality: 80 }) // Convert to WebP format for fast loading
                .toFile(filepath); // Save to disk

            // Mutate the original file object so downstream routes work normally
            file.filename = filename;
            file.path = filepath;
            file.mimetype = 'image/webp';
            // Important: we don't need the buffer anymore, so we delete it to save memory
            delete file.buffer;
        };

        if (req.file) {
            await processFile(req.file);
        } else if (req.files) {
            await Promise.all(req.files.map(processFile));
        }

        next();
    } catch (error) {
        console.error("Image Processing Error:", error);
        next(error);
    }
};

module.exports = { upload, processImage };
