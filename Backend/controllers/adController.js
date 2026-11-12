const Ad          = require('../models/Ad');
const logger = require('../utils/logger');
const mongoose    = require('mongoose');
const User        = require('../models/User');
const Store       = require('../models/Store');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const BoostIdempotency = require('../models/BoostIdempotency');
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
            'q', 'search', 'category', 'brand', 'model', 'city', 'condition',
            'minPrice', 'maxPrice', 'storage', 'memory', 'ram', 'color',
            'screen', 'battery', 'nfc', 'waterproof', 'fingerprint',
            'expandable', 'delivery', 'seller', 'sellerType', 'promotionType',
            'author', 'sort', 'sortBy', 'page', 'limit'
        ], 'query');
        const {
            q, search, category, brand, model, city, condition,
            minPrice, maxPrice, storage, memory, ram, color,
            screen, battery, nfc, waterproof, fingerprint,
            expandable, delivery, seller, sellerType, promotionType,
            author, sort: querySort, sortBy,
            page = 1, limit = 20
        } = req.query;

        const { page: normalizedPage, limit: normalizedLimit, skip } = safePageLimit({ page, limit }, { defaultLimit: 20, maxLimit: 100 });
        const now = new Date();
        const filter = activeListingFilter(now);
        const rawSearch = q || search || '';
        const cleanSearch = readString(rawSearch, { fieldName: 'q', maxLength: 100 });
        const hasTextSearch = Boolean(cleanSearch);

        if (hasTextSearch) {
            const escaped = cleanSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.$or = [
                { title: { $regex: escaped, $options: 'i' } },
                { description: { $regex: escaped, $options: 'i' } },
                { brand: { $regex: escaped, $options: 'i' } },
                { modelName: { $regex: escaped, $options: 'i' } }
            ];
        }

        if (category && category !== 'any' && category !== 'both' && category !== 'all' && category.toLowerCase() !== 'hamısı' && category.toLowerCase() !== 'hamisi') {
            const catVal = readString(category, { fieldName: 'category', maxLength: 80 });
            const catMap = {
                phone: '^(Telefon|Phone)$',
                telefon: '^(Telefon|Phone)$',
                tablet: '^(Planşet|Tablet|Planset)$',
                'planşet': '^(Planşet|Tablet|Planset)$',
                planset: '^(Planşet|Tablet|Planset)$',
                headphone: '^(Qulaqlıq|Headphone|Qulaqliq)$',
                'qulaqlıq': '^(Qulaqlıq|Headphone|Qulaqliq)$',
                accessory: '^(Aksesuar|Accessory|Saat)$',
                aksesuar: '^(Aksesuar|Accessory|Saat)$'
            };
            const mappedPattern = catMap[catVal.toLowerCase()];
            if (mappedPattern) {
                filter.category = { $regex: new RegExp(mappedPattern, 'i') };
            } else {
                filter.category = { $regex: new RegExp(`^${catVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
            }
        }
        if (brand && brand !== 'any' && brand !== 'both') {
            const cleanBrand = readString(brand, { fieldName: 'brand', maxLength: 80 });
            if (cleanBrand.toLowerCase() === 'other') {
                filter.brand = { $regex: /^(Digər|Digər aksesuar|other)$/i };
            } else {
                const escapedBrand = cleanBrand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                filter.brand = { $regex: new RegExp(`^${escapedBrand}$`, 'i') };
            }
        }
        if (model && model !== 'any' && model !== 'both') {
            const cleanModel = readString(model, { fieldName: 'model', maxLength: 120 });
            if (cleanModel.toLowerCase() === 'other') {
                filter.modelName = { $regex: /^(Digər model|Digər|other)$/i };
            } else {
                const escapedModel = cleanModel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                filter.modelName = { $regex: escapedModel, $options: 'i' };
            }
        }
        if (city && city !== 'any' && city !== 'both') {
            const cleanCity = readString(city, { fieldName: 'city', maxLength: 80 });
            const cityAliasGroups = [
                ['bakı', 'baki', 'baku'], ['sumqayıt', 'sumqayit'], ['gəncə', 'gence', 'ganja'],
                ['abşeron', 'abşəron', 'abseron', 'absheron'], ['ağcabədi', 'agcabedi'],
                ['ağdam', 'agdam'], ['ağdaş', 'agdash'], ['ağstafa', 'agstafa'], ['ağsu', 'agsu'],
                ['balakən', 'balakan'], ['beyləqan', 'beylagan'], ['bərdə', 'barda'],
                ['biləsuvar', 'bilasuvar'], ['daşkəsən', 'dashkasan'], ['füzuli', 'fuzuli'],
                ['gədəbəy', 'gadabay'], ['göyçay', 'goychay'], ['göygöl', 'goygol'],
                ['hacıqabul', 'hajigabul'], ['imişli', 'imishli'], ['ismayıllı', 'ismayilli'],
                ['cəbrayıl', 'jabrayil'], ['cəlilabad', 'jalilabad'], ['kəlbəcər', 'kalbajar'],
                ['kürdəmir', 'kurdamir'], ['laçın', 'lachin'], ['lənkəran', 'lankaran'],
                ['masallı', 'masalli'], ['mingəçevir', 'mingachevir'], ['naxçıvan', 'nakhchivan'],
                ['neftçala', 'neftchala'], ['oğuz', 'oguz'], ['qəbələ', 'qabala'],
                ['qax', 'qakh'], ['qazax', 'qazakh'], ['qubadlı', 'qubadli'],
                ['saatlı', 'saatli'], ['şabran', 'shabran'], ['şəki', 'shaki'],
                ['şamaxı', 'shamakhi'], ['şirvan', 'shirvan'], ['şuşa', 'shusha'],
                ['siyəzən', 'siazan'], ['tərtər', 'tartar'], ['ucar', 'ujar'],
                ['yardımlı', 'yardimli'], ['yevlax', 'yevlakh'], ['zəngilan', 'zangilan'],
                ['zərdab', 'zardab']
            ];
            const cityKey = cleanCity.toLowerCase().replace(/\u0307/g, '');
            const matchedGroup = cityAliasGroups.find(g => g.includes(cityKey));
            if (matchedGroup) {
                const pat = matchedGroup.map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
                filter.city = { $regex: new RegExp(`^(${pat})$`, 'i') };
            } else {
                const escapedCity = cleanCity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                filter.city = { $regex: new RegExp(`^${escapedCity}$`, 'i') };
            }
        }
        if (condition && condition !== 'any' && condition !== 'both') {
            const rawCond = String(condition).trim().toLowerCase().replace(/\u0307/g, '');
            let condVal = 'Yeni';
            if (rawCond === 'used' || rawCond === 'islenmis' || rawCond === 'işlənmiş') condVal = 'İşlənmiş';
            else if (rawCond === 'new' || rawCond === 'yeni') condVal = 'Yeni';
            else if (rawCond === 'temir-olunub' || rawCond === 'təmir olunub') condVal = 'Təmir olunub';
            else condVal = condition;
            filter.condition = { $regex: new RegExp(`^${condVal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
        }
        if (promotionType) {
            const cleanPromotionType = readEnum(promotionType, ['none', 'BumpUp', 'VIP', 'PRO', 'Urgent', 'Premium'], { fieldName: 'promotionType', required: true, maxLength: 20 });
            if (cleanPromotionType === 'VIP' || cleanPromotionType === 'Premium' || cleanPromotionType === 'PRO') {
                Object.assign(filter, activeVipFilter(now));
            } else {
                filter.promotionType = cleanPromotionType;
            }
        }
        const activeSeller = seller || sellerType;
        if (activeSeller && activeSeller !== 'any' && activeSeller !== 'both') {
            filter.sellerType = (activeSeller === 'store' || activeSeller === 'Mağaza') ? 'store' : 'personal';
        }
        if (author) filter.author = readObjectId(author, 'author');
        if (minPrice && minPrice !== '0' && minPrice !== 'null' && minPrice !== 'undefined') {
            try {
                const parsedMin = readNumber(minPrice, { fieldName: 'minPrice', min: 0, max: 1000000 });
                filter.price = filter.price || {};
                filter.price.$gte = parsedMin;
            } catch (e) { /* ignore invalid minPrice */ }
        }
        if (maxPrice && maxPrice !== 'Infinity' && maxPrice !== 'null' && maxPrice !== 'undefined') {
            try {
                const parsedMax = readNumber(maxPrice, { fieldName: 'maxPrice', min: 0, max: 1000000 });
                filter.price = filter.price || {};
                filter.price.$lte = parsedMax;
            } catch (e) { /* ignore invalid maxPrice */ }
        }
        const storageVal = storage || memory;
        if (storageVal && storageVal !== 'any' && storageVal !== 'both') {
            const cleanStorage = readString(storageVal, { fieldName: 'storage', maxLength: 80 }).toLowerCase();
            let storageRegex;
            if (cleanStorage === 'below-64' || cleanStorage === '64-dan-az') {
                storageRegex = { $regex: /^(64-dan-az|below-64|<\s*64|8|16|32)(\s*GB)?$/i };
            } else if (cleanStorage === '512+' || cleanStorage === '512-den-cox') {
                storageRegex = { $regex: /^(512-den-cox|512\+|1024|1\s*TB)(\s*GB)?$/i };
            } else {
                const numOnly = cleanStorage.replace(/\s*gb$/i, '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                storageRegex = { $regex: new RegExp(`^${numOnly}(\\s*GB)?$`, 'i') };
            }
            filter.$and = filter.$and || [];
            filter.$and.push({
                $or: [
                    { 'specs.memory': storageRegex },
                    { yaddas: storageRegex }
                ]
            });
        }
        if (ram && ram !== 'any' && ram !== 'both') {
            const cleanRam = readString(ram, { fieldName: 'ram', maxLength: 80 }).toLowerCase();
            let ramRegex;
            if (cleanRam === '16+' || cleanRam === '16-dan-cox') {
                ramRegex = { $regex: /^(16-dan-cox|16\+|16|24|32)(\s*GB)?$/i };
            } else {
                const numOnly = cleanRam.replace(/\s*gb$/i, '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                ramRegex = { $regex: new RegExp(`^${numOnly}(\\s*GB)?$`, 'i') };
            }
            filter.$and = filter.$and || [];
            filter.$and.push({
                $or: [
                    { 'specs.ram': ramRegex },
                    { ram: ramRegex }
                ]
            });
        }
        if (color && color !== 'any' && color !== 'both') {
            const cleanColor = readString(color, { fieldName: 'color', maxLength: 160 });
            const colorAliasMap = {
                black: ['black', 'qara', 'titan qara', 'titanium-black', 'silky black'],
                white: ['white', 'ağ', 'ag', 'titan ağ', 'titan ag', 'titanium-white'],
                grey: ['grey', 'gray', 'boz', 'graphite', 'qrafit', 'titanium-natural', 'titan təbii'],
                blue: ['blue', 'mavi', 'göy', 'goy', 'darkblue', 'titan mavi', 'titan göy', 'titanium-blue'],
                red: ['red', 'qırmızı', 'qirmizi'],
                green: ['green', 'yaşıl', 'yasil', 'emerald', 'zümrüd yaşılı', 'mint'],
                yellow: ['yellow', 'sarı', 'sari'],
                orange: ['orange', 'narıncı', 'narinci'],
                pink: ['pink', 'çəhrayı', 'cehrayi'],
                purple: ['purple', 'bənövşəyi', 'benovseyi', 'deeppurple', 'dərin bənövşəyi', 'cobalt violet', 'lavender'],
                brown: ['brown', 'qəhvəyi', 'qehveyi', 'bronze', 'bürünc', 'beige', 'bej'],
                gold: ['gold', 'qızılı', 'qizili', 'titanium-desert', 'titan çöl'],
                silver: ['silver', 'gümüşü', 'gumusu']
            };
            const parts = cleanColor.split(',').map(p => p.trim().toLowerCase()).filter(Boolean);
            const allPatterns = [];
            parts.forEach(p => {
                const aliases = colorAliasMap[p] || [p];
                aliases.forEach(a => allPatterns.push(a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
            });
            if (allPatterns.length > 0) {
                filter['specs.color'] = { $regex: new RegExp(allPatterns.join('|'), 'i') };
            }
        }
        if (screen && screen !== 'any' && screen !== 'both') {
            const cleanScreen = readString(screen, { fieldName: 'screen', maxLength: 80 });
            const escapedScreen = cleanScreen.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter['specs.screenSize'] = { $regex: escapedScreen, $options: 'i' };
        }
        if (battery && battery !== 'any' && battery !== 'both') {
            const cleanBattery = readString(battery, { fieldName: 'battery', maxLength: 80 }).toLowerCase();
            if (cleanBattery === '3000-4500') {
                filter['specs.battery'] = { $regex: /^(3000-4000|3000-4500|4000-5000)$/i };
            } else if (cleanBattery === '>4500' || cleanBattery === '5000+') {
                filter['specs.battery'] = { $regex: /^(4000-5000|5000\+|>4500|5000)/i };
            } else {
                const escapedBattery = cleanBattery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                filter['specs.battery'] = { $regex: escapedBattery, $options: 'i' };
            }
        }
        [
            ['expandable', expandable],
            ['delivery', delivery],
            ['nfc', nfc],
            ['waterproof', waterproof],
            ['fingerprint', fingerprint]
        ].forEach(([featKey, featVal]) => {
            if (!featVal || featVal === 'any' || featVal === 'both') return;
            const norm = String(featVal).trim().toLowerCase();
            if (norm === 'yes' || norm === 'true' || readBoolean(featVal, { fieldName: featKey }) === true) {
                filter[`specs.features.${featKey}`] = true;
            } else if (norm === 'no' || norm === 'false' || norm === 'broken') {
                filter[`specs.features.${featKey}`] = { $ne: true };
            }
        });

        const sortParam = (querySort || sortBy || req.query.sort || req.query.sortBy || 'newest').toString().trim().toLowerCase();
        let sort = {};
        if (sortParam === 'price_desc' || sortParam === 'price-high' || sortParam === 'price_high') {
            sort = { price: -1 };
        } else if (sortParam === 'price_asc' || sortParam === 'price-low' || sortParam === 'price_low') {
            sort = { price: 1 };
        } else if (sortParam === 'date_desc' || sortParam === 'date' || sortParam === 'newest') {
            sort = { createdAt: -1 };
        } else if (sortParam === 'date_asc' || sortParam === 'oldest') {
            sort = { createdAt: 1 };
        } else if (sortParam === 'popular') {
            sort = { views: -1 };
        } else {
            sort = { createdAt: -1 }; // default newest
        }

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

        const ads = await query
            .sort(sort)
            .skip(skip)
            .limit(normalizedLimit)
            .populate('author', 'name lastName email avatar phone')
            .populate('store',  'storeName logoUrl isVerified rating')
            .lean();
        ads.forEach((ad) => {
            if (!hasActiveVip(ad, now) && ad.promotionType === 'VIP') {
                ad.promotionType = 'none';
            }
        });

        // Fair rotation for VIP listings: no permanent first place promise
        if (isVIPQuery && Array.isArray(ads) && ads.length > 1) {
            for (let i = ads.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [ads[i], ads[j]] = [ads[j], ads[i]];
            }
        }

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
        const idParam = String(req.params.id || '').trim();
        if (!idParam) {
            return res.status(404).json({ message: 'Elan tapılmadı' });
        }

        console.log('[adController] getAdById req.params:', req.params);

        const isObjectId = mongoose.Types.ObjectId.isValid(idParam);
        const isMobPattern = /^MOB-[A-Z0-9_-]{3,20}$/i.test(idParam);

        // If not valid ObjectId and not MOB pattern, return 404 immediately
        if (!isObjectId && !isMobPattern) {
            return res.status(404).json({ message: 'Elan tapılmadı' });
        }

        const baseQuery = { status: { $ne: DELETED_AD_STATUS } };
        let ad = null;

        // 1. Try finding by MongoDB ObjectId
        if (isObjectId) {
            const queryObj = Ad.findOne({
                ...baseQuery,
                _id: idParam
            })
                .populate('author', 'name lastName email avatar phone createdAt rating')
                .populate('store',  'storeName logoUrl coverUrl isVerified rating reviewCount contactNumber socialLinks');
            ad = (queryObj && typeof queryObj.lean === 'function') ? await queryObj.lean() : await queryObj;
        }

        // 2. If not found by ObjectId, try finding by adNumber (e.g. MOB-5D3802)
        if (!ad && isMobPattern) {
            const cleanNum = idParam.trim();
            const candidates = [cleanNum, cleanNum.toUpperCase(), cleanNum.toLowerCase()];
            if (!cleanNum.toUpperCase().startsWith('MOB-')) {
                candidates.push(`MOB-${cleanNum.toUpperCase()}`);
            }
            const queryObj = Ad.findOne({
                ...baseQuery,
                adNumber: { $in: candidates }
            })
                .populate('author', 'name lastName email avatar phone createdAt rating')
                .populate('store',  'storeName logoUrl coverUrl isVerified rating reviewCount contactNumber socialLinks');
            ad = (queryObj && typeof queryObj.lean === 'function') ? await queryObj.lean() : await queryObj;
        }

        // 3. If still not found, return 404
        if (!ad) {
            return res.status(404).json({ message: 'Elan tapılmadı' });
        }

        // 4. Handle deleted user / author: ensure author and user are never null
        if (!ad.author) {
            ad.author = {
                name: 'Silinmiş istifadəçi',
                lastName: '',
                phone: '',
                avatar: null,
                rating: 0
            };
        }
        // Alias user to author for full compatibility with React/MERN or any client expectations
        ad.user = ad.author;

        // Ensure images is always a valid array
        ad.images = Array.isArray(ad.images) ? ad.images.filter(Boolean) : (ad.images ? [ad.images] : []);
        ad.specs = ad.specs || {};

        // 5. Increment view count (if viewing someone else's ad or as guest)
        try {
            const authorId = ad.author?._id || ad.author;
            if (!req.user || (authorId && authorId.toString() !== req.user._id.toString())) {
                await Ad.updateOne({ _id: ad._id }, { $inc: { views: 1 } });
                ad.views = (ad.views || 0) + 1;
            }
        } catch (viewErr) {
            console.error('[adController] Failed to increment view count:', viewErr.message);
        }

        if (!hasActiveVip(ad) && ad.promotionType === 'VIP') {
            ad.promotionType = 'none';
        }

        // Always return 200 with ad object, never throw 500
        return res.status(200).json(ad);
    } catch (error) {
        console.error('[adController] getAdById error:', error);
        return res.status(500).json({ message: 'Server xətası baş verdi' });
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
            'sellerType', 'store', 'specs', 'yaddas', 'ram'
        ], 'body');
        const {
            category, brand, modelName, price, condition,
            description, images, city, region, contactPhone,
            sellerType, store, specs, yaddas, ram
        } = req.body;

        if (!category || !brand || !modelName || !price || !city) {
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

        let rawImages = images;
        if (typeof rawImages === 'string') {
            try { rawImages = JSON.parse(rawImages); } catch (e) { rawImages = [rawImages]; }
        }
        if (!Array.isArray(rawImages)) rawImages = rawImages ? [rawImages] : [];
        if (req.files && req.files.length > 0) {
            const uploadedUrls = req.files.map(f => `/uploads/${f.filename}`);
            rawImages = rawImages.concat(uploadedUrls);
        } else if (req.file) {
            rawImages.push(`/uploads/${req.file.filename}`);
        }

        const cleanImages = sanitizeUrlArray(rawImages || []);
        if (cleanImages === null) return res.status(400).json({ message: 'Şəkil URL-ləri düzgün deyil' });
        if (!cleanImages || cleanImages.length < 1) return res.status(400).json({ message: 'Ən azı 1 şəkil yüklənməlidir' });

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

        let cleanCondition = null;
        if (condition) {
            const rawCond = String(condition).trim();
            if (rawCond === 'yeni' || rawCond === 'Yeni') cleanCondition = 'Yeni';
            else if (rawCond === 'islenmis' || rawCond === 'İşlənmiş') cleanCondition = 'İşlənmiş';
            else if (rawCond === 'temir-olunub' || rawCond === 'Təmir olunub') cleanCondition = 'Təmir olunub';
            else if (rawCond !== '') cleanCondition = sanitizePlainText(rawCond, { maxLength: 50 });
        }

        let parsedSpecs = specs;
        if (typeof parsedSpecs === 'string') {
            try { parsedSpecs = JSON.parse(parsedSpecs); } catch (e) {}
        }
        const cleanSpecs = sanitizeSpecs(parsedSpecs);
        const cleanYaddas = sanitizePlainText(yaddas || cleanSpecs?.memory || '', { maxLength: 80 }) || null;
        const cleanRam = sanitizePlainText(ram || cleanSpecs?.ram || '', { maxLength: 80 }) || null;
        if (cleanSpecs) {
            if (cleanYaddas && !cleanSpecs.memory) cleanSpecs.memory = cleanYaddas;
            if (cleanRam && !cleanSpecs.ram) cleanSpecs.ram = cleanRam;
        }

        // Check active ad limit based on package
        const User = require('../models/User');
        const userDoc = await User.findById(req.user._id).select('activePackage packageExpiresAt role');
        let maxActiveAds = 2; // Standart default
        if (userDoc) {
            if (userDoc.role === 'admin') {
                maxActiveAds = 99999;
            } else if (userDoc.activePackage && userDoc.packageExpiresAt && new Date(userDoc.packageExpiresAt) > new Date()) {
                const pkg = String(userDoc.activePackage).toUpperCase();
                if (pkg === 'PRO') maxActiveAds = 25;
                else if (pkg === 'VIP') maxActiveAds = 10;
            }
        }

        const currentActiveCount = await Ad.countDocuments({
            author: req.user._id,
            status: { $in: ['active', 'pending'] }
        });

        if (currentActiveCount >= maxActiveAds) {
            return res.status(400).json({
                message: `Mövcud paketiniz üzrə eyni anda maksimum ${maxActiveAds} aktiv elan yerləşdirə bilərsiniz. Daha çox elan üçün paketinizi yüksəldin.`
            });
        }

        let adNumber = req.body.adNumber;
        if (!adNumber) {
            const count = await Ad.countDocuments();
            let candidate = `MOB-${(count + 1).toString().padStart(6, '0')}`;
            const exists = await Ad.exists({ adNumber: candidate });
            if (exists) {
                candidate = `MOB-${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
            }
            adNumber = candidate;
        }

        const ad = await Ad.create({
            adNumber,
            author: req.user._id,
            category: cleanCategory,
            brand: cleanBrand,
            modelName: cleanModelName,
            price: normalizedPrice,
            condition: cleanCondition,
            yaddas: cleanYaddas,
            ram: cleanRam,
            description: sanitizePlainText(description || '', { maxLength: 5000 }),
            images:      cleanImages || [],
            city: cleanCity,
            region: sanitizePlainText(region || '', { maxLength: 80 }),
            contactPhone: sanitizePlainText(contactPhone || req.user.phone || '', { maxLength: 40 }),
            sellerType:  listingSellerType,
            store:       listingStore,
            specs:       cleanSpecs,
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

        if (req.user && req.user.email) {
            logger.info(`Ad created by ${req.user.email}`);
        }

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

        if (req.files && req.files.length > 0) {
            const uploadedUrls = req.files.map(f => `/uploads/${f.filename}`);
            let curImgs = req.body.images;
            if (curImgs === undefined || curImgs === null) {
                curImgs = ad.images || [];
            } else if (typeof curImgs === 'string') {
                try { curImgs = JSON.parse(curImgs); } catch (e) { curImgs = [curImgs]; }
            }
            if (!Array.isArray(curImgs)) curImgs = curImgs ? [curImgs] : [];
            req.body.images = curImgs.concat(uploadedUrls);
        } else if (req.file) {
            const uploadedUrl = `/uploads/${req.file.filename}`;
            let curImgs = req.body.images;
            if (curImgs === undefined || curImgs === null) {
                curImgs = ad.images || [];
            } else if (typeof curImgs === 'string') {
                try { curImgs = JSON.parse(curImgs); } catch (e) { curImgs = [curImgs]; }
            }
            if (!Array.isArray(curImgs)) curImgs = curImgs ? [curImgs] : [];
            req.body.images = curImgs.concat([uploadedUrl]);
        }
        if (typeof req.body.specs === 'string') {
            try { req.body.specs = JSON.parse(req.body.specs); } catch (e) {}
        }
        if (typeof req.body.images === 'string') {
            try { req.body.images = JSON.parse(req.body.images); } catch (e) { req.body.images = [req.body.images]; }
        }

        const allowed = ['category', 'brand', 'modelName', 'price', 'condition', 'description', 'images',
                         'city', 'region', 'contactPhone', 'specs', 'yaddas', 'ram'];
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
                    ad.images = (cleanImages.length > 0) ? cleanImages : ad.images;
                } else if (field === 'specs') {
                    ad.specs = sanitizeSpecs(req.body.specs);
                    if (ad.specs?.memory) ad.yaddas = ad.specs.memory;
                    if (ad.specs?.ram) ad.ram = ad.specs.ram;
                } else if (field === 'yaddas' || field === 'ram') {
                    const cleanVal = req.body[field] ? sanitizePlainText(String(req.body[field]), { maxLength: 80 }) : null;
                    ad[field] = cleanVal;
                    if (field === 'yaddas') {
                        if (!ad.specs) ad.specs = {};
                        ad.specs.memory = cleanVal;
                    }
                    if (field === 'ram') {
                        if (!ad.specs) ad.specs = {};
                        ad.specs.ram = cleanVal;
                    }
                } else if (field === 'price') {
                    const nextPrice = Number(req.body.price);
                    if (!Number.isFinite(nextPrice) || nextPrice <= 0) throw httpError(400, { message: 'Qiymət düzgün deyil' });
                    ad.price = nextPrice;
                } else if (field === 'condition') {
                    let normalized = null;
                    if (req.body.condition) {
                        const raw = String(req.body.condition).trim();
                        if (raw === 'yeni' || raw === 'Yeni') normalized = 'Yeni';
                        else if (raw === 'islenmis' || raw === 'İşlənmiş') normalized = 'İşlənmiş';
                        else if (raw === 'temir-olunub' || raw === 'Təmir olunub') normalized = 'Təmir olunub';
                        else if (raw !== '') normalized = sanitizePlainText(raw, { maxLength: 50 });
                    }
                    ad.condition = normalized;
                } else {
                    ad[field] = req.body[field];
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
        validateAllowedFields(req.body, ['promotionType', 'idempotencyKey'], 'body');
        const { promotionType } = req.body;
        const id = req.params.id;

        const idempotencyKey = readString(req.body?.idempotencyKey || req.get('Idempotency-Key') || req.get('X-Idempotency-Key') || '', {
            fieldName: 'idempotencyKey',
            maxLength: 120
        });

        // 1. ƏVVƏLDƏ CLAIM (sətir 620-dən əvvəl):
        if (idempotencyKey) {
            const existingClaim = await BoostIdempotency.findOne({ user: req.user._id, ad: id, idempotencyKey });
            if (existingClaim) {
                if (existingClaim.status === 'processing' || existingClaim.status === 'completed') {
                    const resp = existingClaim.response || existingClaim.responsePayload || { message: 'Bu əməliyyat artıq icra olunur' };
                    return res.json({ ...resp, idempotent: true });
                }
                if (existingClaim.status === 'failed') {
                    await BoostIdempotency.deleteOne({ _id: existingClaim._id });
                }
            }
            // Atomik claim yarat
            try {
                await BoostIdempotency.create({
                    user: req.user._id,
                    ad: id,
                    idempotencyKey,
                    status: 'processing'
                });
            } catch (claimErr) {
                if (claimErr.code === 11000) {
                    const concurrentClaim = await BoostIdempotency.findOne({ user: req.user._id, ad: id, idempotencyKey });
                    const resp = concurrentClaim?.response || concurrentClaim?.responsePayload || { message: 'Bu əməliyyat artıq icra olunur' };
                    return res.json({ ...resp, idempotent: true });
                }
                throw claimErr;
            }
        }

        if (!BOOST_PRICES[promotionType]) {
            if (idempotencyKey) await BoostIdempotency.deleteOne({ user: req.user._id, ad: id, idempotencyKey }).catch(() => {});
            return res.status(400).json({ message: 'Yanlış promosyon növü' });
        }

        const oldAd = await Ad.findOne({ _id: id, status: { $ne: DELETED_AD_STATUS } }).select(
            '_id author status isBoosted promotionType promotionStartedAt promotionExpiresAt boostedAt boostCount publishedAt expiresAt brand modelName'
        );
        if (!oldAd) {
            if (idempotencyKey) await BoostIdempotency.deleteOne({ user: req.user._id, ad: id, idempotencyKey }).catch(() => {});
            return res.status(404).json({ message: 'Elan tapılmadı' });
        }

        if (oldAd.author.toString() !== req.user._id.toString()) {
            if (idempotencyKey) await BoostIdempotency.deleteOne({ user: req.user._id, ad: id, idempotencyKey }).catch(() => {});
            return res.status(403).json({ message: 'İcazəniz yoxdur' });
        }

        if (oldAd.status !== 'active') {
            if (idempotencyKey) await BoostIdempotency.deleteOne({ user: req.user._id, ad: id, idempotencyKey }).catch(() => {});
            return res.status(400).json({ message: 'Yalnız aktiv elanlar reklam edilə bilər' });
        }

        const cost = BOOST_PRICES[promotionType];
        const days = BOOST_DAYS[promotionType];

        let responsePayload;
        let session = null;
        try {
            session = await mongoose.startSession();
            session.startTransaction();

            const user = await User.findById(req.user._id).session(session);
            if (!user || user.walletBalance < cost) {
                throw httpError(400, {
                    message: 'Balans kifayət deyil',
                    required: cost,
                    current: user?.walletBalance || 0
                });
            }

            const ad = await Ad.findOne({ _id: req.params.id, status: { $ne: DELETED_AD_STATUS } }).session(session);
            if (!ad) throw httpError(404, { message: 'Elan tapılmadı' });
            if (ad.status !== 'active') {
                throw httpError(400, { message: 'Yalnız aktiv elanlar reklam edilə bilər' });
            }

            // Deduct user wallet balance with session
            user.walletBalance -= cost;
            await user.save({ session });

            // Update ad promotion with session
            const now = new Date();
            const currentPromoBase = ad.promotionExpiresAt && ad.promotionExpiresAt > now
                ? new Date(ad.promotionExpiresAt)
                : now;
            const expiresAt = new Date(currentPromoBase);
            expiresAt.setDate(expiresAt.getDate() + days);

            const updateData = {
                isBoosted: true,
                promotionType: promotionType || 'premium',
                promotionStartedAt: ad.promotionStartedAt || now,
                promotionExpiresAt: expiresAt,
                boostedAt: now,
                boostCount: (oldAd.boostCount || ad.boostCount || 0) + 1
            };
            if (!ad.publishedAt) updateData.publishedAt = now;
            if (!ad.expiresAt) updateData.expiresAt = new Date(now.getTime() + Number(process.env.NORMAL_LISTING_LIFETIME_DAYS || 30) * 24 * 60 * 60 * 1000);

            const updatedAd = await Ad.findOneAndUpdate(
                { _id: id },
                { $set: updateData },
                { new: true, session }
            );

            // Log transaction with session
            await Transaction.create([{
                user:        user._id,
                amount:      -cost,
                type:        'ad_boost',
                description: `${promotionType} promosyonu — ${updatedAd.brand || ad.brand} ${updatedAd.modelName || ad.modelName}`,
                ad:          updatedAd._id,
                balanceAfter: user.walletBalance
            }], { session });

            // Notification with session
            await Notification.create([{
                user:        user._id,
                type:        'promo',
                title:       `${promotionType} aktivləşdirildi! ⚡`,
                body:        `Elanınız ${days} gün ərzində ${promotionType} kimi görünəcək.`,
                link:        `/cabinet.html#my-ads`,
                relatedId:   updatedAd._id,
                relatedType: 'Ad'
            }], { session });

            responsePayload = {
                message: `${promotionType} uğurla aktivləşdirildi`,
                ad: updatedAd,
                walletBalance: user.walletBalance
            };

            // Save idempotency key record with session
            if (idempotencyKey) {
                await BoostIdempotency.updateOne(
                    { user: user._id, ad: updatedAd._id, idempotencyKey },
                    {
                        status: 'completed',
                        promotionType,
                        cost,
                        response: responsePayload,
                        responsePayload
                    },
                    { session }
                );
            }

            await session.commitTransaction();
        } catch (error) {
            if (session) {
                await session.abortTransaction().catch(() => {});
            }

            // If concurrent duplicate idempotency key arrived:
            if (error.code === 11000 && idempotencyKey) {
                const existing = await BoostIdempotency.findOne({ user: req.user._id, idempotencyKey });
                if (existing && existing.responsePayload) {
                    return res.status(200).json({
                        ...existing.responsePayload,
                        idempotent: true
                    });
                }
            }

            // Fallback for standalone MongoDB environments without replica set
            const isTxUnsupported = Boolean(
                error &&
                (error.message?.includes('replica set member') ||
                 error.message?.includes('Transaction numbers are only allowed') ||
                 error.code === 20 ||
                 error.codeName === 'IllegalOperation')
            );
            if (isTxUnsupported) {
                logger.warn('MongoDB transactions not supported on current topology; executing boost with compensating rollback');
                let userDeducted = false;
                let transactionId = null;
                let notificationId = null;
                try {
                    const user = await User.findById(req.user._id);
                    if (!user || user.walletBalance < cost) {
                        throw httpError(400, { message: 'Balans kifayət deyil', required: cost, current: user?.walletBalance || 0 });
                    }
                    user.walletBalance -= cost;
                    await user.save();
                    userDeducted = true;

                    const ad = await Ad.findOne({ _id: req.params.id, status: { $ne: DELETED_AD_STATUS } });
                    if (!ad) throw httpError(404, { message: 'Elan tapılmadı' });
                    if (ad.status !== 'active') throw httpError(400, { message: 'Yalnız aktiv elanlar reklam edilə bilər' });

                    const now = new Date();
                    const currentPromoBase = ad.promotionExpiresAt && ad.promotionExpiresAt > now ? new Date(ad.promotionExpiresAt) : now;
                    const expiresAt = new Date(currentPromoBase);
                    expiresAt.setDate(expiresAt.getDate() + days);

                    const updateData = {
                        isBoosted: true,
                        promotionType: promotionType || 'premium',
                        promotionStartedAt: ad.promotionStartedAt || now,
                        promotionExpiresAt: expiresAt,
                        boostedAt: now,
                        boostCount: (oldAd.boostCount || ad.boostCount || 0) + 1
                    };
                    if (!ad.publishedAt) updateData.publishedAt = now;
                    if (!ad.expiresAt) updateData.expiresAt = new Date(now.getTime() + Number(process.env.NORMAL_LISTING_LIFETIME_DAYS || 30) * 24 * 60 * 60 * 1000);

                    const updatedAd = await Ad.findOneAndUpdate(
                        { _id: id },
                        { $set: updateData },
                        { new: true }
                    );

                    const transaction = await Transaction.create({
                        user: user._id,
                        amount: -cost,
                        type: 'ad_boost',
                        description: `${promotionType} promosyonu — ${updatedAd.brand || ad.brand} ${updatedAd.modelName || ad.modelName}`,
                        ad: updatedAd._id,
                        balanceAfter: user.walletBalance
                    });
                    transactionId = transaction?._id;

                    const notification = await Notification.create({
                        user: user._id,
                        type: 'promo',
                        title: `${promotionType} aktivləşdirildi! ⚡`,
                        body: `Elanınız ${days} gün ərzində ${promotionType} kimi görünəcək.`,
                        link: `/cabinet.html#my-ads`,
                        relatedId: updatedAd._id,
                        relatedType: 'Ad'
                    });
                    notificationId = notification?._id;

                    responsePayload = {
                        message: `${promotionType} uğurla aktivləşdirildi`,
                        ad: updatedAd,
                        walletBalance: user.walletBalance
                    };

                    // 3. SUCCESS-də:
                    if (idempotencyKey) {
                        await BoostIdempotency.updateOne(
                            { user: user._id, ad: updatedAd._id, idempotencyKey },
                            {
                                status: 'completed',
                                promotionType,
                                cost,
                                response: responsePayload,
                                responsePayload
                            }
                        );
                    }
                } catch (fallbackErr) {
                    // 2. FALLBACK CATCH BLOK: FULL COMPENSATION
                    if (userDeducted) {
                        try {
                            await User.updateOne({ _id: req.user._id }, { $inc: { walletBalance: cost } });
                        } catch (e) {
                            console.error('CRITICAL rollback User failed', e);
                        }
                    }
                    try {
                        await Ad.updateOne(
                            { _id: id },
                            { 
                                $set: { 
                                    isBoosted: Boolean(oldAd.isBoosted),
                                    promotionType: oldAd.promotionType || 'none',
                                    promotionStartedAt: oldAd.promotionStartedAt || null,
                                    promotionExpiresAt: oldAd.promotionExpiresAt || null,
                                    boostedAt: oldAd.boostedAt || null,
                                    boostCount: oldAd.boostCount || 0,
                                    publishedAt: oldAd.publishedAt,
                                    expiresAt: oldAd.expiresAt
                                } 
                            }
                        );
                    } catch (e) {
                        console.error('CRITICAL Ad rollback failed', e);
                    }
                    try {
                        if (transactionId) {
                            await Transaction.deleteOne({ _id: transactionId });
                        }
                    } catch (e) {
                        console.error('CRITICAL rollback Transaction failed', e);
                    }
                    try {
                        if (notificationId) {
                            await Notification.deleteOne({ _id: notificationId });
                        }
                    } catch (e) {
                        console.error('CRITICAL rollback Notification failed', e);
                    }
                    if (idempotencyKey) {
                        try {
                            await BoostIdempotency.updateOne(
                                { user: req.user._id, ad: id, idempotencyKey },
                                { status: 'failed', error: fallbackErr.message }
                            );
                        } catch (e) {
                            console.error('CRITICAL idempotency failed status error', e);
                        }
                    }
                    throw fallbackErr;
                }
            } else {
                if (idempotencyKey) {
                    try {
                        await BoostIdempotency.updateOne(
                            { user: req.user._id, ad: id, idempotencyKey },
                            { status: 'failed', error: error.message }
                        );
                    } catch (e) {
                        console.error('CRITICAL idempotency failed status error', e);
                    }
                }
                throw error;
            }
        } finally {
            if (session) {
                await session.endSession().catch(() => {});
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
            .populate('author', 'name lastName email avatar phone')
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
