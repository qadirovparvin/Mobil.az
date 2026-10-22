const express = require('express');
const router = express.Router();
const {
    MAX_UPLOAD_FILES,
    upload,
    uploadKycDocuments,
    processImage,
    processKycDocuments,
    uploadErrorHandler
} = require('../middlewares/uploadMiddleware');
const { protect } = require('../middlewares/authMiddleware');
const { csrfProtection } = require('../middlewares/csrfProtection');

// @desc    Upload single image
// @route   POST /api/upload
// @access  Private
router.post('/', protect, csrfProtection, upload.single('image'), processImage, (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Şəkil seçilməyib' });
    }
    
    // Return relative URL that will be used by frontend
    res.json({ 
        message: 'Şəkil uğurla yükləndi və optimallaşdırıldı',
        url: `/uploads/${req.file.filename}` 
    });
});

// @desc    Upload multiple images (max 10)
// @route   POST /api/upload/multiple
// @access  Private
router.post('/multiple', protect, csrfProtection, upload.array('images', MAX_UPLOAD_FILES), processImage, (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Şəkillər seçilməyib' });
    }
    
    // Return array of relative URLs
    const fileUrls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({ 
        message: 'Şəkillər uğurla yükləndi və optimallaşdırıldı',
        urls: fileUrls 
    });
});

// @desc    Upload private KYC documents for store application
// @route   POST /api/upload/kyc
// @access  Private
router.post(
    '/kyc',
    protect,
    csrfProtection,
    uploadKycDocuments.fields([
        { name: 'taxDocument', maxCount: 1 },
        { name: 'identityDocument', maxCount: 1 }
    ]),
    processKycDocuments,
    (req, res) => {
        const docs = req.kycDocuments || {};
        if (!docs.taxDocument || !docs.identityDocument) {
            return res.status(400).json({ message: 'VÖEN/vergi sənədi və şəxsiyyət sənədi tələb olunur' });
        }

        res.status(201).json({
            message: 'KYC sənədləri qəbul edildi',
            documents: {
                taxDocument: docs.taxDocument,
                identityDocument: docs.identityDocument
            }
        });
    }
);

router.use(uploadErrorHandler);

module.exports = router;
