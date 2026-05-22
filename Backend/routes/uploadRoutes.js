const express = require('express');
const router = express.Router();
const { upload, processImage } = require('../middlewares/uploadMiddleware');
const { protect } = require('../middlewares/authMiddleware');

// @desc    Upload single image
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.single('image'), processImage, (req, res) => {
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
router.post('/multiple', protect, upload.array('images', 10), processImage, (req, res) => {
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

module.exports = router;
