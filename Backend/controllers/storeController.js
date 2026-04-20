const Store        = require('../models/Store');
const Ad           = require('../models/Ad');
const Review       = require('../models/Review');
const Notification = require('../models/Notification');

// @desc    Create a store
// @route   POST /api/stores
// @access  Private
const createStore = async (req, res) => {
    try {
        const existing = await Store.findOne({ owner: req.user._id });
        if (existing) {
            return res.status(400).json({ message: 'Artıq bir mağazanız var', store: existing });
        }

        const {
            storeName, description, logoUrl, coverUrl,
            address, city, contactNumber, socialLinks, packageType
        } = req.body;

        if (!storeName) {
            return res.status(400).json({ message: 'Mağaza adı mütləqdir' });
        }

        const store = await Store.create({
            owner: req.user._id,
            storeName, description, logoUrl, coverUrl,
            address, city, contactNumber,
            socialLinks: socialLinks || {},
            packageType: packageType || 'Starter'
        });

        await Notification.create({
            user:  req.user._id,
            type:  'system',
            title: 'Mağazanız açıldı! 🏪',
            body:  `"${store.storeName}" mağazası uğurla yaradıldı.`,
            link:  `/magaza-profil.html?id=${store._id}`
        });

        res.status(201).json(store);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Bu mağaza adı artıq mövcuddur' });
        }
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Get store by ID (public)
// @route   GET /api/stores/:id
// @access  Public
const getStoreById = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id)
            .populate('owner', 'name lastName avatar createdAt');

        if (!store) return res.status(404).json({ message: 'Mağaza tapılmadı' });

        // Active ads for this store
        const ads = await Ad.find({ store: store._id, status: 'Active' })
            .sort({ promotionType: -1, createdAt: -1 })
            .limit(50);

        res.json({ store, ads });
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Get all stores (public list)
// @route   GET /api/stores
// @access  Public
const getStores = async (req, res) => {
    try {
        const { city, packageType, page = 1, limit = 20 } = req.query;
        const filter = { status: 'active' };
        if (city)        filter.city        = city;
        if (packageType) filter.packageType = packageType;

        const skip   = (Number(page) - 1) * Number(limit);
        const total  = await Store.countDocuments(filter);
        const stores = await Store.find(filter)
            .sort({ isVerified: -1, rating: -1, createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.json({ stores, page: Number(page), pages: Math.ceil(total / Number(limit)), total });
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Get owner's own store
// @route   GET /api/stores/my
// @access  Private
const getMyStore = async (req, res) => {
    try {
        const store = await Store.findOne({ owner: req.user._id });
        if (!store) return res.status(404).json({ message: 'Mağazanız yoxdur' });

        const adCount = await Ad.countDocuments({ store: store._id, status: 'Active' });
        res.json({ store, adCount });
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Update store
// @route   PUT /api/stores/:id
// @access  Private
const updateStore = async (req, res) => {
    try {
        const store = await Store.findById(req.params.id);
        if (!store) return res.status(404).json({ message: 'Mağaza tapılmadı' });

        if (store.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'İcazəniz yoxdur' });
        }

        const allowed = ['description', 'logoUrl', 'coverUrl', 'address', 'city', 'contactNumber', 'socialLinks'];
        allowed.forEach(field => {
            if (req.body[field] !== undefined) store[field] = req.body[field];
        });

        const updated = await store.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Add a review to a store
// @route   POST /api/stores/:id/reviews
// @access  Private
const addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        if (!rating) return res.status(400).json({ message: 'Reytinq mütləqdir' });

        const store = await Store.findById(req.params.id);
        if (!store) return res.status(404).json({ message: 'Mağaza tapılmadı' });

        const existing = await Review.findOne({ store: store._id, author: req.user._id });
        if (existing) return res.status(400).json({ message: 'Artıq rəy yazmısınız' });

        const review = await Review.create({
            store:   store._id,
            author:  req.user._id,
            rating:  Number(rating),
            comment: comment || ''
        });

        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Get reviews for a store
// @route   GET /api/stores/:id/reviews
// @access  Public
const getReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ store: req.params.id })
            .sort({ createdAt: -1 })
            .populate('author', 'name lastName avatar');
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

module.exports = { createStore, getStoreById, getStores, getMyStore, updateStore, addReview, getReviews };
