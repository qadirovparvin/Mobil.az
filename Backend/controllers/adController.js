const Ad          = require('../models/Ad');
const User        = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

// ─── Promotion pricing (AZN) ────────────────────────────────
const BOOST_PRICES = { BumpUp: 2, VIP: 5, PRO: 10 };
const BOOST_DAYS   = { BumpUp: 1, VIP: 7, PRO: 30 };

// @desc    Get ads (public, with filtering & pagination)
// @route   GET /api/ads
// @access  Public
const getAds = async (req, res) => {
    try {
        const {
            category, brand, city, condition,
            minPrice, maxPrice, promotionType,
            sellerType, nfc, waterproof, fingerprint,
            memory, ram, color,
            sortBy = 'newest', page = 1, limit = 20
        } = req.query;

        const filter = { status: 'Active' };

        if (category)      filter.category      = category;
        if (brand)         filter.brand          = { $regex: brand, $options: 'i' };
        if (city)          filter.city           = city;
        if (condition)     filter.condition      = condition;
        if (promotionType) filter.promotionType  = promotionType;
        if (sellerType)    filter.sellerType     = sellerType;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }
        if (memory)      filter['specs.memory']      = memory;
        if (ram)         filter['specs.ram']          = ram;
        if (color)       filter['specs.color']        = { $regex: color, $options: 'i' };
        if (nfc === 'true')         filter['specs.features.nfc']         = true;
        if (waterproof === 'true')  filter['specs.features.waterproof']  = true;
        if (fingerprint === 'true') filter['specs.features.fingerprint'] = true;

        const sortMap = {
            newest:      { createdAt: -1 },
            oldest:      { createdAt:  1 },
            price_asc:   { price:      1 },
            price_desc:  { price:     -1 },
            popular:     { views:     -1 }
        };
        const sort = sortMap[sortBy] || sortMap.newest;

        const skip  = (Number(page) - 1) * Number(limit);
        const total = await Ad.countDocuments(filter);

        const ads = await Ad.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .populate('author', 'name lastName avatar phone')
            .populate('store',  'storeName logoUrl isVerified rating');

        res.json({
            ads,
            page:       Number(page),
            pages:      Math.ceil(total / Number(limit)),
            total
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Get single ad by ID (increments view count)
// @route   GET /api/ads/:id
// @access  Public
const getAdById = async (req, res) => {
    try {
        const ad = await Ad.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        )
            .populate('author', 'name lastName avatar phone createdAt')
            .populate('store',  'storeName logoUrl coverUrl isVerified rating reviewCount contactNumber socialLinks');

        if (!ad) {
            return res.status(404).json({ message: 'Elan tapılmadı' });
        }

        res.json(ad);
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Create a new ad
// @route   POST /api/ads
// @access  Private
const createAd = async (req, res) => {
    try {
        const {
            category, brand, modelName, price, condition,
            description, images, city, region, contactPhone,
            sellerType, store, specs
        } = req.body;

        if (!category || !brand || !modelName || !price || !condition || !city) {
            return res.status(400).json({ message: 'Məcburi sahələri doldurun' });
        }

        const ad = await Ad.create({
            author: req.user._id,
            category, brand, modelName,
            price:       Number(price),
            condition,
            description: description || '',
            images:      images      || [],
            city,
            region:      region      || '',
            contactPhone: contactPhone || req.user.phone || '',
            sellerType:  sellerType  || 'personal',
            store:       store       || null,
            specs:       specs       || {},
            status:      'Pending'
        });

        await Notification.create({
            user:      req.user._id,
            type:      'ad_status',
            title:     'Elanınız göndərildi',
            body:      `"${ad.brand} ${ad.modelName}" elanı yoxlama üçün göndərildi.`,
            link:      `/cabinet.html#my-ads`,
            relatedId:   ad._id,
            relatedType: 'Ad'
        });

        res.status(201).json(ad);
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Update an ad (owner only)
// @route   PUT /api/ads/:id
// @access  Private
const updateAd = async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);

        if (!ad) return res.status(404).json({ message: 'Elan tapılmadı' });

        if (ad.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'İcazəniz yoxdur' });
        }

        const allowed = ['brand', 'modelName', 'price', 'condition', 'description', 'images',
                         'city', 'region', 'contactPhone', 'specs', 'status'];

        allowed.forEach(field => {
            if (req.body[field] !== undefined) ad[field] = req.body[field];
        });

        const updated = await ad.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Delete an ad (owner only)
// @route   DELETE /api/ads/:id
// @access  Private
const deleteAd = async (req, res) => {
    try {
        const ad = await Ad.findById(req.params.id);

        if (!ad) return res.status(404).json({ message: 'Elan tapılmadı' });

        if (ad.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'İcazəniz yoxdur' });
        }

        await Ad.findByIdAndDelete(req.params.id);
        res.json({ message: 'Elan silindi' });
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Get current user's ads
// @route   GET /api/ads/my
// @access  Private
const getMyAds = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const filter = { author: req.user._id };
        if (status) filter.status = status;

        const skip  = (Number(page) - 1) * Number(limit);
        const total = await Ad.countDocuments(filter);
        const ads   = await Ad.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.json({ ads, page: Number(page), pages: Math.ceil(total / Number(limit)), total });
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Boost an ad (BumpUp / VIP / PRO)
// @route   POST /api/ads/:id/boost
// @access  Private
const boostAd = async (req, res) => {
    try {
        const { promotionType } = req.body;

        if (!BOOST_PRICES[promotionType]) {
            return res.status(400).json({ message: 'Yanlış promosyon növü' });
        }

        const ad = await Ad.findById(req.params.id);
        if (!ad) return res.status(404).json({ message: 'Elan tapılmadı' });

        if (ad.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'İcazəniz yoxdur' });
        }

        const user  = await User.findById(req.user._id);
        const cost  = BOOST_PRICES[promotionType];
        const days  = BOOST_DAYS[promotionType];

        // Wallet check
        if (user.walletBalance < cost) {
            return res.status(400).json({ message: 'Balans kifayət deyil', required: cost, current: user.walletBalance });
        }

        // Deduct from wallet
        user.walletBalance -= cost;
        await user.save();

        // Apply promo to ad
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        ad.promotionType      = promotionType;
        ad.promotionExpiresAt = expiresAt;
        if (ad.status !== 'Active') ad.status = 'Active';
        await ad.save();

        // Log transaction
        await Transaction.create({
            user:        user._id,
            amount:      -cost,
            type:        'ad_boost',
            description: `${promotionType} promosyonu — ${ad.brand} ${ad.modelName}`,
            ad:          ad._id,
            balanceAfter: user.walletBalance
        });

        // Notification
        await Notification.create({
            user:      user._id,
            type:      'promo',
            title:     `${promotionType} aktivləşdirildi! ⚡`,
            body:      `Elanınız ${days} gün ərzində ${promotionType} kimi görünəcək.`,
            link:      `/cabinet.html#my-ads`,
            relatedId:   ad._id,
            relatedType: 'Ad'
        });

        res.json({ message: `${promotionType} uğurla aktivləşdirildi`, ad, walletBalance: user.walletBalance });

    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

// @desc    Toggle favorite (add/remove)
// @route   POST /api/ads/:id/favorite
// @access  Private
const toggleFavorite = async (req, res) => {
    try {
        const user   = await User.findById(req.user._id);
        const adId   = req.params.id;
        const adExists = await Ad.findById(adId);

        if (!adExists) return res.status(404).json({ message: 'Elan tapılmadı' });

        const idx = user.favorites.indexOf(adId);
        if (idx === -1) {
            user.favorites.push(adId);
            await Ad.findByIdAndUpdate(adId, { $inc: { favorites: 1 } });
        } else {
            user.favorites.splice(idx, 1);
            await Ad.findByIdAndUpdate(adId, { $inc: { favorites: -1 } });
        }

        await user.save();
        res.json({ favorites: user.favorites });
    } catch (error) {
        res.status(500).json({ message: 'Server xətası', error: error.message });
    }
};

module.exports = { getAds, getAdById, createAd, updateAd, deleteAd, getMyAds, boostAd, toggleFavorite };
