const Ad          = require('../models/Ad');
const logger = require('../utils/logger');
const mongoose    = require('mongoose');
const User        = require('../models/User');
const Store       = require('../models/Store');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { DELETED_AD_STATUS, softDeleteAd } = require('../utils/adLifecycle');
const {
    ALLOWED_FEATURE_FIELDS,
    ALLOWED_SPEC_FIELDS,
    ALLOWED_SPEC_VALUES,
    sanitizePlainText,
    sanitizeSpecs,
    sanitizeUrlArray
} = require('../utils/sanitizers');
const {
    readBoolean,
    readEnum,
    readNumber,
    readObjectId,
    readString,
    safePageLimit,
    validateAllowedFields
} = require('../utils/securityValidation');
const { getCache, setCache, invalidateCache } = require('../utils/redisClient');
const { activeListingFilter, activeVipFilter, hasActiveVip } = require('../utils/listingVisibility');

// ─── Promotion pricing (AZN) ────────────────────────────────
const BOOST_PRICES = { Urgent: 3, BumpUp: 3, VIP: 5, Premium: 10, PRO: 10 };
const BOOST_DAYS   = { Urgent: 3, BumpUp: 3, VIP: 7, Premium: 15, PRO: 15 };
const ALLOWED_CATEGORIES = ['Telefon', 'Planşet', 'Aksesuar', 'Qulaqlıq'];

const httpError = (status, payload) => {
    const error = new Error(payload.message);
    error.status = status;
    error.payload = payload;
    return error;
};


const getApprovedOwnedStore = async (storeId, userId) => {
    if (!storeId) return null;
    return Store.findOne({ _id: storeId, owner: userId, status: 'active', isVerified: true });
};

// @desc    Get ads (public, with filtering & pagination)
// @route   GET /api/ads
// @access  Public
const getAds = async (req, res, next) => {
    try {
        validateAllowedFields(req.query, [
            'q', 'category', 'brand', 'city', 'condition',
            'minPrice', 'maxPrice', 'promotionType',
            'sellerType', 'nfc', 'waterproof', 'fingerprint',
            'memory', 'ram', 'color', 'author',
            'sortBy', 'page', 'limit'
        ], 'query');
        const {
            q, category, brand, city, condition,
            minPrice, maxPrice, promotionType,
            sellerType, nfc, waterproof, fingerprint,
            memory, ram, color, author,
            sortBy = 'newest', page = 1, limit = 20
        } = req.query;

        const { page: normalizedPage, limit: normalizedLimit, skip } = safePageLimit({ page, limit }, { defaultLimit: 20, maxLimit: 100 });
        const now = new Date();
        const filter = activeListingFilter(now);
        const cleanSearch = readString(q || '', { fieldName: 'q', maxLength: 100 });
        const hasTextSearch = Boolean(cleanSearch);

        if (hasTextSearch) {
            filter.$text = { $search: cleanSearch };
        }

        if (category)      filter.category      = readString(category, { fieldName: 'category', maxLength: 80 });
        if (brand)         filter.brand         = readString(brand, { fieldName: 'brand', maxLength: 80 });
        if (city)          filter.city          = readString(city, { fieldName: 'city', maxLength: 80 });
        if (condition)     filter.condition     = readEnum(condition, ['Yeni', 'İşlənmiş'], { fieldName: 'condition', required: true, maxLength: 20 });
        if (promotionType) {
            const cleanPromotionType = readEnum(promotionType, ['none', 'BumpUp', 'VIP', 'PRO', 'Urgent', 'Premium'], { fieldName: 'promotionType', required: true, maxLength: 20 });
            if (cleanPromotionType === 'VIP' || cleanPromotionType === 'Premium' || cleanPromotionType === 'PRO') {
                Object.assign(filter, activeVipFilter(now));
            } else {
                filter.promotionType = cleanPromotionType;
            }
        }
        if (sellerType)    filter.sellerType    = readEnum(sellerType, ['personal', 'store'], { fieldName: 'sellerType', required: true, maxLength: 20 });
        if (author)        filter.author        = readObjectId(author, 'author');
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = readNumber(minPrice, { fieldName: 'minPrice', min: 0, max: 1000000 });
            if (maxPrice) filter.price.$lte = readNumber(maxPrice, { fieldName: 'maxPrice', min: 0, max: 1000000 });
        }
        if (memory)      filter['specs.memory']      = readString(memory, { fieldName: 'memory', maxLength: 80 });
        if (ram)         filter['specs.ram']         = readString(ram, { fieldName: 'ram', maxLength: 80 });
        if (color)       filter['specs.color']       = readString(color, { fieldName: 'color', maxLength: 80 });
        if (readBoolean(nfc, { fieldName: 'nfc' }) === true)                 filter['specs.features.nfc']         = true;
        if (readBoolean(waterproof, { fieldName: 'waterproof' }) === true)   filter['specs.features.waterproof']  = true;
        if (readBoolean(fingerprint, { fieldName: 'fingerprint' }) === true) filter['specs.features.fingerprint'] = true;

        const sortMap = {
            newest:      { createdAt: -1 },
            oldest:      { createdAt:  1 },
            price_asc:   { price:      1 },
            price_desc:  { price:     -1 },
            popular:     { views:     -1 }
        };
        const sort = hasTextSearch
            ? { score: { $meta: 'textScore' }, ...(sortMap[sortBy] || sortMap.newest) }
            : (sortMap[sortBy] || sortMap.newest);

        const isVIPQuery = promotionType === 'VIP' && normalizedPage === 1 && !hasTextSearch;
        let cacheKey = null;

        if (isVIPQuery) {
            cacheKey = `ads:VIP:cache:${JSON.stringify(req.query)}`;
            const cachedData = await getCache(cacheKey);
            if (cachedData) {
                return res.json(cachedData);
            }
        }

        const total = await Ad.countDocuments(filter);

        const query = Ad.find(filter);
        if (hasTextSearch) {
            query.select({ score: { $meta: 'textScore' } });
        }

        const ads = await query
            .sort(sort)
            .skip(skip)
            .limit(normalizedLimit)
            .populate('author', 'name lastName avatar phone')
            .populate('store',  'storeName logoUrl isVerified rating')
            .lean();
        ads.forEach((ad) => {
            if (!hasActiveVip(ad, now) && ad.promotionType === 'VIP') {
                ad.promotionType = 'none';
            }
        });

        const totalPages = Math.ceil(total / normalizedLimit);
        const responseData = {
            ads,
            page:       normalizedPage,
            limit:      normalizedLimit,
            totalAds:   total,
            totalPages,
            hasNextPage: normalizedPage < totalPages,
            hasPreviousPage: normalizedPage > 1
        };

        if (cacheKey) {
            await setCache(cacheKey, responseData, Number(process.env.REDIS_TTL_SEC) || 300);
        }

        res.json(responseData);

    } catch (error) {
        logger.error(error);
        next(error);
    }
};

// @desc    Get single ad by ID (increments view count)
// @route   GET /api/ads/:id
// @access  Public
const getAdById = async (req, res, next) => {
    try {
        const ad = await Ad.findOne({
            _id: req.params.id,
            status: { $ne: DELETED_AD_STATUS }
        })
            .populate('author', 'name lastName avatar phone createdAt')
            .populate('store',  'storeName logoUrl coverUrl isVerified rating reviewCount contactNumber socialLinks');

        if (!ad) {
            return res.status(404).json({ message: 'Elan tapılmadı' });
        }

        const authorId = ad.author?._id || ad.author;
        const isOwner = Boolean(req.user && authorId && authorId.toString() === req.user._id.toString());
        const isAdmin = Boolean(req.user && req.user.role === 'admin');

        // Anonymous/non-owner: can only view active, non-expired ads
        if (!isOwner && !isAdmin) {
            const isExpired = ad.expiresAt && new Date(ad.expiresAt) <= new Date();
            const isActive = String(ad.status).toLowerCase() === 'active';
            if (!isActive || isExpired) {
                return res.status(404).json({ message: 'Elan tapılmadı' });
            }
        }

        if (authorId && (!req.user || authorId.toString() !== req.user._id.toString())) {
            await Ad.updateOne({ _id: ad._id }, { $inc: { views: 1 } });
            ad.views += 1;
        }

        if (!hasActiveVip(ad) && ad.promotionType === 'VIP') {
            ad.promotionType = 'none';
        }

        res.json(ad);
    } catch (error) {
        next(error);
    }
};

// @desc    Create a new ad
// @route   POST /api/ads
// @access  Private
const createAd = async (req, res, next) => {
    try {
        validateAllowedFields(req.body, [
            'category', 'brand', 'modelName', 'price', 'condition',
            'description', 'images', 'city', 'region', 'contactPhone',
            'sellerType', 'store', 'specs'
        ], 'body');
        const {
            category, brand, modelName, price, condition,
            description, images, city, region, contactPhone,
            sellerType, store, specs
        } = req.body;

        if (!category || !brand || !modelName || !price || !condition || !city) {
            return res.status(400).json({ message: 'Məcburi sahələri doldurun' });
        }
        const normalizedPrice = Number(price);
        if (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
            return res.status(400).json({ message: 'Qiymət düzgün deyil' });
        }
        const cleanCategory = sanitizePlainText(category, { maxLength: 80, allowEmpty: false });
        const cleanBrand = sanitizePlainText(brand, { maxLength: 80, allowEmpty: false });
        const cleanModelName = sanitizePlainText(modelName, { maxLength: 120, allowEmpty: false });
        const cleanCity = sanitizePlainText(city, { maxLength: 80, allowEmpty: false });
        if (!cleanCategory || !cleanBrand || !cleanModelName || !cleanCity) {
            return res.status(400).json({ message: 'Məcburi sahələr düzgün deyil' });
        }

        const cleanImages = sanitizeUrlArray(images || []);
        if (cleanImages === null) return res.status(400).json({ message: 'Şəkil URL-ləri düzgün deyil' });

        let listingSellerType = 'personal';
        let listingStore = null;
        if (sellerType === 'store' || store) {
            const approvedStore = await getApprovedOwnedStore(readObjectId(store, 'store'), req.user._id);
            if (!approvedStore) {
                return res.status(403).json({ message: 'Təsdiqlənmiş mağaza olmadan mağaza elanı yerləşdirilə bilməz' });
            }
            listingSellerType = 'store';
            listingStore = approvedStore._id;
        }

        const ad = await Ad.create({
            author: req.user._id,
            category: cleanCategory,
            brand: cleanBrand,
            modelName: cleanModelName,
            price: normalizedPrice,
            condition: readEnum(condition, ['Yeni', 'İşlənmiş'], { fieldName: 'condition', required: true, maxLength: 20 }),
            description: sanitizePlainText(description || '', { maxLength: 5000 }),
            images:      cleanImages || [],
            city: cleanCity,
            region: sanitizePlainText(region || '', { maxLength: 80 }),
            contactPhone: sanitizePlainText(contactPhone || req.user.phone || '', { maxLength: 40 }),
            sellerType:  listingSellerType,
            store:       listingStore,
            specs:       sanitizeSpecs(specs),
            status:      'pending'
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

        if (ad.promotionType === 'VIP') await invalidateCache('ads:VIP:cache:*');

        res.status(201).json(ad);
    } catch (error) {
        next(error);
    }
};

// @desc    Update an ad (owner only)
// @route   PUT /api/ads/:id
// @access  Private
const updateAd = async (req, res, next) => {
    try {
        const ad = await Ad.findOne({ _id: req.params.id, status: { $ne: DELETED_AD_STATUS } });

        if (!ad) return res.status(404).json({ message: 'Elan tapılmadı' });

        if (ad.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'İcazəniz yoxdur' });
        }

        const allowed = ['category', 'brand', 'modelName', 'price', 'condition', 'description', 'images',
                         'city', 'region', 'contactPhone', 'specs'];
        const adminOnlyAllowed = ['status'];
        validateAllowedFields(req.body, req.user.role === 'admin' ? allowed.concat(adminOnlyAllowed) : allowed, 'body');

        allowed.forEach(field => {
            if (req.body[field] !== undefined) {
                if (['brand', 'modelName', 'description', 'city', 'region', 'contactPhone'].includes(field)) {
                    const maxLength = field === 'description' ? 5000 : 120;
                    const sanitized = sanitizePlainText(req.body[field], { maxLength, allowEmpty: field !== 'brand' && field !== 'modelName' });
                    if (sanitized === null) throw httpError(400, { message: `${field} düzgün deyil` });
                    ad[field] = sanitized;
                } else if (field === 'category') {
                    ad.category = readEnum(req.body.category, ALLOWED_CATEGORIES, { fieldName: 'category', required: true, maxLength: 80 });
                } else if (field === 'images') {
                    const cleanImages = sanitizeUrlArray(req.body.images || []);
                    if (cleanImages === null) throw httpError(400, { message: 'Şəkil URL-ləri düzgün deyil' });
                    ad.images = cleanImages;
                } else if (field === 'specs') {
                    ad.specs = sanitizeSpecs(req.body.specs);
                } else if (field === 'price') {
                    const nextPrice = Number(req.body.price);
                    if (!Number.isFinite(nextPrice) || nextPrice <= 0) throw httpError(400, { message: 'Qiymət düzgün deyil' });
                    ad.price = nextPrice;
                } else {
                    ad[field] = field === 'condition'
                        ? readEnum(req.body[field], ['Yeni', 'İşlənmiş'], { fieldName: field, required: true, maxLength: 20 })
                        : req.body[field];
                }
            }
        });
        if (req.user.role === 'admin') {
            adminOnlyAllowed.forEach((field) => {
                if (req.body[field] !== undefined) {
                    if (!['pending', 'active', 'rejected', 'sold', 'archived', DELETED_AD_STATUS].includes(req.body[field])) {
                        throw httpError(400, { message: 'Yanlış elan statusu' });
                    }
                    ad[field] = req.body[field];
                }
            });
        }

        const updated = await ad.save();
        await invalidateCache('ads:VIP:cache:*');
        res.json(updated);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete an ad (owner only)
// @route   DELETE /api/ads/:id
// @access  Private
const deleteAd = async (req, res, next) => {
    try {
        const ad = await Ad.findOne({ _id: req.params.id, status: { $ne: DELETED_AD_STATUS } });

        if (!ad) return res.status(404).json({ message: 'Elan tapılmadı' });

        if (ad.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'İcazəniz yoxdur' });
        }

        await softDeleteAd({ ad, deletedBy: req.user._id });
        await invalidateCache('ads:VIP:cache:*');
        res.json({ message: 'Elan silindi' });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user's ads
// @route   GET /api/ads/my
// @access  Private
const getMyAds = async (req, res, next) => {
    try {
        validateAllowedFields(req.query, ['status', 'page', 'limit'], 'query');
        const { status, page = 1, limit = 20 } = req.query;
        const paging = safePageLimit({ page, limit }, { defaultLimit: 20, maxLimit: 100 });
        const filter = { author: req.user._id, status: { $ne: DELETED_AD_STATUS } };
        if (status && status !== DELETED_AD_STATUS) {
            filter.status = readEnum(status, ['pending', 'active', 'rejected', 'sold', 'archived', 'expired'], { fieldName: 'status', required: true, maxLength: 20 });
        }

        const total = await Ad.countDocuments(filter);
        const ads   = await Ad.find(filter)
            .sort({ createdAt: -1 })
            .skip(paging.skip)
            .limit(paging.limit);

        const totalPages = Math.ceil(total / paging.limit);
        res.json({ 
            ads, 
            page: paging.page, 
            limit: paging.limit,
            totalAds: total,
            totalPages,
            hasNextPage: paging.page < totalPages,
            hasPreviousPage: paging.page > 1
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Boost an ad (BumpUp / VIP / PRO)
// @route   POST /api/ads/:id/boost
// @access  Private
const boostAd = async (req, res, next) => {
    try {
        validateAllowedFields(req.body, ['promotionType'], 'body');
        const { promotionType } = req.body;

        if (!BOOST_PRICES[promotionType]) {
            return res.status(400).json({ message: 'Yanlış promosyon növü' });
        }

        const existingAd = await Ad.findOne({ _id: req.params.id, status: { $ne: DELETED_AD_STATUS } }).select('_id author');
        if (!existingAd) return res.status(404).json({ message: 'Elan tapılmadı' });

        if (existingAd.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'İcazəniz yoxdur' });
        }

        const runBoost = async (session) => {
            const sessionOption = session ? { session } : {};
            const ad = await Ad.findOne({ _id: req.params.id, status: { $ne: DELETED_AD_STATUS } }, null, sessionOption);
            if (!ad) throw httpError(404, { message: 'Elan tapılmadı' });

            if (ad.status !== 'active') {
                throw httpError(400, { message: 'Yalnız aktiv elanlar reklam edilə bilər' });
            }

            const cost  = BOOST_PRICES[promotionType];
            const days  = BOOST_DAYS[promotionType];

            // Atomic deduct from wallet (only if balance is sufficient)
            const user = await User.findOneAndUpdate(
                { _id: req.user._id, walletBalance: { $gte: cost } },
                { $inc: { walletBalance: -cost } },
                { new: true, ...sessionOption }
            );

            if (!user) {
                const currentUser = await User.findById(req.user._id, 'walletBalance', sessionOption);
                throw httpError(400, { message: 'Balans kifayət deyil', required: cost, current: currentUser?.walletBalance || 0 });
            }

            const now = new Date();
            const currentPromoBase = ad.promotionExpiresAt && ad.promotionExpiresAt > now
                ? new Date(ad.promotionExpiresAt)
                : now;
            const expiresAt = new Date(currentPromoBase);
            expiresAt.setDate(expiresAt.getDate() + days);

            ad.promotionType      = promotionType;
            ad.promotionStartedAt = ad.promotionStartedAt || now;
            ad.promotionExpiresAt = expiresAt;

            if (!ad.publishedAt) ad.publishedAt = now;
            if (!ad.expiresAt) ad.expiresAt = new Date(now.getTime() + Number(process.env.NORMAL_LISTING_LIFETIME_DAYS || 30) * 24 * 60 * 60 * 1000);
            await ad.save(sessionOption);

            // Log transaction
            await Transaction.create([{
                user:        user._id,
                amount:      -cost,
                type:        'ad_boost',
                description: `${promotionType} promosyonu — ${ad.brand} ${ad.modelName}`,
                ad:          ad._id,
                balanceAfter: user.walletBalance
            }], sessionOption);

            // Notification
            await Notification.create([{
                user:      user._id,
                type:      'promo',
                title:     `${promotionType} aktivləşdirildi! ⚡`,
                body:      `Elanınız ${days} gün ərzində ${promotionType} kimi görünəcək.`,
                link:      `/cabinet.html#my-ads`,
                relatedId:   ad._id,
                relatedType: 'Ad'
            }], sessionOption);

            return { message: `${promotionType} uğurla aktivləşdirildi`, ad, walletBalance: user.walletBalance };
        };

        let responsePayload;
        try {
            const session = await mongoose.startSession();
            try {
                await session.withTransaction(async () => {
                    responsePayload = await runBoost(session);
                });
            } finally {
                await session.endSession();
            }
        } catch (error) {
            const isTxUnsupported = Boolean(
                error &&
                (error.message?.includes('replica set member') ||
                 error.message?.includes('Transaction numbers are only allowed') ||
                 error.code === 20 ||
                 error.codeName === 'IllegalOperation')
            );
            if (isTxUnsupported) {
                logger.warn('MongoDB transactions not supported on current topology; executing boost without transaction');
                responsePayload = await runBoost(null);
            } else {
                throw error;
            }
        }
        await invalidateCache('ads:VIP:cache:*');
        if (responsePayload) res.json(responsePayload);

    } catch (error) {
        if (error.payload) {
            return res.status(error.status || 500).json(error.payload);
        }
        next(error);
    }
};

// @desc    Toggle favorite (add/remove)
// @route   POST /api/ads/:id/favorite
// @access  Private
const toggleFavorite = async (req, res, next) => {
    try {
        const user   = await User.findById(req.user._id);
        const adId   = req.params.id;
        const adExists = await Ad.findOne({ _id: adId, ...activeListingFilter(new Date()) });

        if (!adExists) return res.status(404).json({ message: 'Elan tapılmadı' });

        const alreadyFavorite = user.favorites.includes(adId);
        if (!alreadyFavorite) {
            const updateRes = await User.updateOne(
                { _id: req.user._id, favorites: { $ne: adId } },
                { $addToSet: { favorites: adId } }
            );
            if (updateRes.modifiedCount > 0) {
                await Ad.updateOne({ _id: adId, status: { $ne: DELETED_AD_STATUS } }, { $inc: { favorites: 1 } });
            }
        } else {
            const updateRes = await User.updateOne(
                { _id: req.user._id, favorites: adId },
                { $pull: { favorites: adId } }
            );
            if (updateRes.modifiedCount > 0) {
                await Ad.updateOne({ _id: adId, status: { $ne: DELETED_AD_STATUS } }, { $inc: { favorites: -1 } });
            }
        }

        const updatedUser = await User.findById(req.user._id).select('favorites');
        res.json({ favorites: updatedUser.favorites });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user's favorite ads
// @route   GET /api/ads/favorites
// @access  Private
const getFavoriteAds = async (req, res, next) => {
    try {
        const favoriteIds = (req.user.favorites || []).map((favoriteId) => favoriteId.toString());

        if (!favoriteIds.length) {
            return res.json({ ads: [], total: 0 });
        }

        const ads = await Ad.find({ _id: { $in: favoriteIds }, ...activeListingFilter(new Date()) })
            .populate('author', 'name lastName avatar phone')
            .populate('store', 'storeName logoUrl isVerified rating');

        const adsById = new Map(ads.map((ad) => [ad._id.toString(), ad]));
        const orderedAds = favoriteIds
            .map((favoriteId) => adsById.get(favoriteId))
            .filter(Boolean);

        res.json({ ads: orderedAds, total: orderedAds.length });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAds, getAdById, createAd, updateAd, deleteAd, getMyAds, boostAd, toggleFavorite, getFavoriteAds };
