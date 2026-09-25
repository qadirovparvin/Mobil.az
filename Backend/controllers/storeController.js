const Store        = require('../models/Store');
const Ad           = require('../models/Ad');
const Review       = require('../models/Review');
const Notification = require('../models/Notification');
const { DELETED_AD_STATUS } = require('../utils/adLifecycle');
const { pickAllowedFields, sanitizePlainText, sanitizeUrl } = require('../utils/sanitizers');
const { deleteUploadFiles } = require('../utils/uploadCleanup');
const {
    readEnum,
    readNumber,
    readString,
    safePageLimit,
    validateAllowedFields
} = require('../utils/securityValidation');
const { normalizePhone } = require('../utils/phoneUtils');

const badRequest = (message) => {
    const error = new Error(message);
    error.status = 400;
    return error;
};

const validateVoen = (value) => {
    const voen = String(value || '').replace(/\D/g, '');
    if (!/^\d{10}$/.test(voen)) {
        throw badRequest('VÖEN 10 rəqəmdən ibarət olmalıdır');
    }
    return voen;
};

const validateKycDocument = (doc, fieldName) => {
    if (!doc || typeof doc !== 'object' || !doc.storageKey) {
        throw badRequest(`${fieldName} sənədi tələb olunur`);
    }
    if (!String(doc.storageKey).startsWith('kyc/')) {
        throw badRequest(`${fieldName} sənəd açarı düzgün deyil`);
    }
    return {
        storageKey: readString(doc.storageKey, { fieldName: `${fieldName}.storageKey`, required: true, maxLength: 120 }),
        originalName: readString(doc.originalName || '', { fieldName: `${fieldName}.originalName`, maxLength: 160 }),
        mimeType: readEnum(doc.mimeType, ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], { fieldName: `${fieldName}.mimeType`, required: true }),
        size: Number(doc.size || 0),
        uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt) : new Date()
    };
};

// @desc    Create a store
// @route   POST /api/stores
// @access  Private
const createStore = async (req, res, next) => {
    try {
        validateAllowedFields(req.body, [
            'storeName', 'description', 'logoUrl', 'coverUrl', 'taxDocument', 'identityDocument', 'voen',
            'address', 'city', 'contactNumber', 'businessDetails', 'socialLinks'
        ], 'body');
        const existing = await Store.findOne({ owner: req.user._id });
        if (existing) {
            return res.status(400).json({ message: 'Artıq bir mağazanız var', store: existing });
        }

        const allowedBody = pickAllowedFields(req.body, [
            'storeName', 'description', 'logoUrl', 'coverUrl', 'taxDocument', 'identityDocument', 'voen',
            'address', 'city', 'contactNumber', 'businessDetails', 'socialLinks'
        ]);
        const {
            storeName, description, logoUrl, coverUrl, taxDocument, identityDocument, voen,
            address, city, contactNumber, businessDetails, socialLinks
        } = allowedBody;

        if (!storeName || !taxDocument || !identityDocument || !voen || !businessDetails?.legalName) {
            return res.status(400).json({ message: 'Mağaza adı, VÖEN, şəxsiyyət vəsiqəsi və vergi sənədi mütləqdir' });
        }
        const sanitizedStoreName = sanitizePlainText(storeName, { maxLength: 120, allowEmpty: false });
        if (!sanitizedStoreName) return res.status(400).json({ message: 'Mağaza adı düzgün deyil' });
        const cleanVoen = validateVoen(voen);
        const taxDoc = validateKycDocument(taxDocument, 'taxDocument');
        const identityDoc = validateKycDocument(identityDocument, 'identityDocument');

        const store = await Store.create({
            owner: req.user._id,
            storeName: sanitizedStoreName,
            description: sanitizePlainText(description || '', { maxLength: 2000 }),
            logoUrl: sanitizeUrl(logoUrl || '') || '',
            coverUrl: sanitizeUrl(coverUrl || '') || '',
            taxDocumentUrl: '',
            identityDocumentUrl: '',
            voen: cleanVoen,
            businessDetails: {
                legalName: sanitizePlainText(businessDetails?.legalName || '', { maxLength: 160, allowEmpty: false }),
                businessType: sanitizePlainText(businessDetails?.businessType || '', { maxLength: 80 })
            },
            kycDocuments: {
                taxDocument: taxDoc,
                identityDocument: identityDoc
            },
            kycSubmittedAt: new Date(),
            kycReviewStatus: 'pending',
            address: sanitizePlainText(address || '', { maxLength: 200 }),
            city: sanitizePlainText(city || '', { maxLength: 80 }),
            contactNumber: contactNumber ? normalizePhone(contactNumber) : '',
            socialLinks: {
                instagram: sanitizeUrl(socialLinks?.instagram || '') || '',
                whatsapp: sanitizeUrl(socialLinks?.whatsapp || '') || '',
                facebook: sanitizeUrl(socialLinks?.facebook || '') || '',
                website: sanitizeUrl(socialLinks?.website || '') || ''
            },
            status: 'pending',
            isVerified: false,
            packageType: 'Starter'
        });

        await Notification.create({
            user:  req.user._id,
            type:  'system',
            title: 'Mağaza müraciətiniz qəbul edildi',
            body:  `"${store.storeName}" mağazası admin təsdiqindən sonra aktiv olacaq.`,
            link:  `/cabinet.html`
        });

        res.status(201).json(store);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Bu mağaza adı artıq mövcuddur' });
        }
        next(error);
    }
};

// @desc    Get store by ID (public)
// @route   GET /api/stores/:id
// @access  Public
const getStoreById = async (req, res, next) => {
    try {
        const store = await Store.findById(req.params.id)
            .populate('owner', 'name lastName avatar createdAt');

        if (!store) return res.status(404).json({ message: 'Mağaza tapılmadı' });
        if (store.status !== 'active' || !store.isVerified) {
            return res.status(404).json({ message: 'Mağaza tapılmadı' });
        }

        // Active ads for this store
        const ads = await Ad.find({ store: store._id, status: 'active' })
            .sort({ promotionType: -1, createdAt: -1 })
            .limit(50);

        const safeStore = store.toObject();
        delete safeStore.taxDocumentUrl;
        delete safeStore.identityDocumentUrl;
        delete safeStore.kycDocuments;
        res.json({ store: safeStore, ads });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all stores (public list)
// @route   GET /api/stores
// @access  Public
const getStores = async (req, res, next) => {
    try {
        validateAllowedFields(req.query, ['city', 'packageType', 'page', 'limit'], 'query');
        const { city, packageType, page = 1, limit = 20 } = req.query;
        const paging = safePageLimit({ page, limit }, { defaultLimit: 20, maxLimit: 100 });
        const filter = { status: 'active', isVerified: true };
        if (city)        filter.city        = readString(city, { fieldName: 'city', maxLength: 80 });
        if (packageType) filter.packageType = readEnum(packageType, ['Starter', 'Pro', 'Premium'], { fieldName: 'packageType', required: true, maxLength: 20 });

        const total  = await Store.countDocuments(filter);
        const stores = await Store.find(filter)
            .select('-taxDocumentUrl -identityDocumentUrl -kycDocuments')
            .sort({ isVerified: -1, rating: -1, createdAt: -1 })
            .skip(paging.skip)
            .limit(paging.limit)
            .lean();

        const storesWithCount = await Promise.all(stores.map(async (store) => {
            const adCount = await Ad.countDocuments({ store: store._id, status: 'active' });
            return { ...store, adCount };
        }));

        const totalPages = Math.ceil(total / paging.limit);
        res.json({ 
            stores: storesWithCount, 
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

// @desc    Get owner's own store
// @route   GET /api/stores/my
// @access  Private
const getMyStore = async (req, res, next) => {
    try {
        const store = await Store.findOne({ owner: req.user._id }).select('-kycDocuments.taxDocument.storageKey -kycDocuments.identityDocument.storageKey');
        if (!store) return res.status(404).json({ message: 'Mağazanız yoxdur' });

        const adCount = await Ad.countDocuments({ store: store._id, status: 'active' });
        res.json({ store, adCount });
    } catch (error) {
        next(error);
    }
};

// @desc    Update store
// @route   PUT /api/stores/:id
// @access  Private
const updateStore = async (req, res, next) => {
    try {
        validateAllowedFields(req.body, ['description', 'logoUrl', 'coverUrl', 'address', 'city', 'contactNumber', 'socialLinks'], 'body');
        const store = await Store.findById(req.params.id);
        if (!store) return res.status(404).json({ message: 'Mağaza tapılmadı' });

        if (store.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'İcazəniz yoxdur' });
        }

        const allowed = ['description', 'logoUrl', 'coverUrl', 'address', 'city', 'contactNumber', 'socialLinks'];
        allowed.forEach(field => {
            if (req.body[field] !== undefined) {
                if (['logoUrl', 'coverUrl'].includes(field)) {
                    const url = sanitizeUrl(req.body[field]);
                    if (url === null) throw badRequest(`${field} düzgün deyil`);
                    store[field] = url;
                } else if (field === 'socialLinks') {
                    store.socialLinks = {
                        instagram: sanitizeUrl(req.body.socialLinks?.instagram || '') || '',
                        whatsapp: sanitizeUrl(req.body.socialLinks?.whatsapp || '') || '',
                        facebook: sanitizeUrl(req.body.socialLinks?.facebook || '') || '',
                        website: sanitizeUrl(req.body.socialLinks?.website || '') || ''
                    };
                } else if (field === 'contactNumber') {
                    store.contactNumber = req.body.contactNumber ? normalizePhone(req.body.contactNumber) : '';
                } else {
                    const value = sanitizePlainText(req.body[field], { maxLength: field === 'description' ? 2000 : 200 });
                    if (value === null) throw badRequest(`${field} düzgün deyil`);
                    store[field] = value;
                }
            }
        });

        const updated = await store.save();
        res.json(updated);
    } catch (error) {
        next(error);
    }
};

// @desc    Add a review to a store
// @route   POST /api/stores/:id/reviews
// @access  Private
const addReview = async (req, res, next) => {
    try {
        validateAllowedFields(req.body, ['rating', 'comment'], 'body');
        const { rating, comment } = req.body;
        if (!rating) return res.status(400).json({ message: 'Reytinq mütləqdir' });
        const cleanRating = readNumber(rating, { fieldName: 'rating', required: true, min: 1, max: 5, integer: true });
        const cleanComment = sanitizePlainText(comment || '', { maxLength: 1000 });
        if (cleanComment === null) return res.status(400).json({ message: 'Rəy düzgün deyil' });

        const store = await Store.findById(req.params.id);
        if (!store) return res.status(404).json({ message: 'Mağaza tapılmadı' });

        if (store.owner.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Öz mağazanıza rəy yaza bilməzsiniz' });
        }

        const existing = await Review.findOne({ store: store._id, author: req.user._id });
        if (existing) return res.status(400).json({ message: 'Artıq rəy yazmısınız' });

        const review = await Review.create({
            store:   store._id,
            author:  req.user._id,
            rating:  cleanRating,
            comment: cleanComment
        });

        res.status(201).json(review);
    } catch (error) {
        next(error);
    }
};

// @desc    Get reviews for a store
// @route   GET /api/stores/:id/reviews
// @access  Public
const getReviews = async (req, res, next) => {
    try {
        const reviews = await Review.find({ store: req.params.id })
            .sort({ createdAt: -1 })
            .populate('author', 'name lastName avatar');
        res.json(reviews);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete a store (owner only)
// @route   DELETE /api/stores/:id
// @access  Private
const deleteStore = async (req, res, next) => {
    try {
        const store = await Store.findById(req.params.id);
        if (!store) return res.status(404).json({ message: 'Mağaza tapılmadı' });

        if (store.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Bu mağazanı silməyə icazəniz yoxdur' });
        }

        // Unlink ads from this store
        const Ad = require('../models/Ad');
        await Ad.updateMany({ store: store._id, status: { $ne: DELETED_AD_STATUS } }, { $set: { store: null, sellerType: 'personal' } });

        // Delete store reviews
        await Review.deleteMany({ store: store._id });

        const filesToClean = [];
        if (store.logoUrl) filesToClean.push(store.logoUrl);
        if (store.coverUrl) filesToClean.push(store.coverUrl);
        if (store.taxDocumentUrl) filesToClean.push(store.taxDocumentUrl);
        await deleteUploadFiles(filesToClean);

        const fs = require('fs');
        const taxKey = store.kycDocuments?.taxDocument?.storageKey;
        if (taxKey) {
            try { await fs.promises.unlink(safeJoinPrivate(taxKey)); } catch (e) {}
        }
        const identityKey = store.kycDocuments?.identityDocument?.storageKey;
        if (identityKey) {
            try { await fs.promises.unlink(safeJoinPrivate(identityKey)); } catch (e) {}
        }

        await Store.deleteOne({ _id: store._id });
        res.json({ message: 'Mağaza silindi' });
    } catch (error) {
        next(error);
    }
};

module.exports = { createStore, getStoreById, getStores, getMyStore, updateStore, addReview, getReviews, deleteStore };
