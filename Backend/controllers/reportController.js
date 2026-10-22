const mongoose = require('mongoose');
const Report = require('../models/Report');
const Ad = require('../models/Ad');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { invalidateCache } = require('../utils/redisClient');
const { validateAllowedFields, readEnum, readString, safePageLimit } = require('../utils/securityValidation');

const createReport = async (req, res, next) => {
    try {
        validateAllowedFields(req.body, ['adId', 'reason', 'description'], 'body');
        const adId = readString(req.body.adId, { fieldName: 'adId', required: true });
        const reason = readEnum(req.body.reason, ['scam', 'prohibited', 'misleading', 'duplicate', 'abusive', 'wrong_category', 'other'], { fieldName: 'reason', required: true });
        const description = readString(req.body.description || '', { fieldName: 'description', maxLength: 1000 });

        const ad = await Ad.findById(adId).select('author status brand modelName price sellerType createdAt');
        if (!ad) {
            return res.status(404).json({ message: 'Elan tapılmadı' });
        }
        if (ad.author.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Öz elanınızı şikayət edə bilməzsiniz' });
        }

        const existingReport = await Report.findOne({ ad: ad._id, reporter: req.user._id });
        if (existingReport) {
            return res.status(400).json({ message: 'Bu elan üçün artıq şikayət göndərmisiniz' });
        }

        const report = await Report.create({
            reporter: req.user._id,
            ad: ad._id,
            adOwner: ad.author,
            reason,
            description,
            listingSnapshot: {
                title: `${ad.brand || ''} ${ad.modelName || ''}`.trim(),
                brand: ad.brand || '',
                modelName: ad.modelName || '',
                price: ad.price ?? null,
                status: ad.status || '',
                sellerType: ad.sellerType || '',
                createdAt: ad.createdAt || null
            }
        });

        res.status(201).json({ message: 'Şikayətiniz qəbul olundu', report });
    } catch (error) {
        next(error);
    }
};

const getReports = async (req, res, next) => {
    try {
        const { page, limit, skip } = safePageLimit(req.query, { defaultLimit: 20, maxLimit: 100 });
        const filter = {};
        if (req.query.status) {
            filter.status = readEnum(req.query.status, ['pending', 'investigating', 'more_info_requested', 'resolved', 'dismissed'], { fieldName: 'status' });
        }
        
        const total = await Report.countDocuments(filter);
        const reports = await Report.find(filter)
            .populate('reporter', 'name email')
            .populate('adOwner', 'name email')
            .populate('ad', 'brand modelName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            reports,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        next(error);
    }
};

const reviewReport = async (req, res, next) => {
    try {
        validateAllowedFields(req.body, ['status', 'resolution', 'action'], 'body');
        const status = readEnum(req.body.status, ['investigating', 'more_info_requested', 'resolved', 'dismissed'], { fieldName: 'status', required: true });
        const resolution = readString(req.body.resolution || '', { fieldName: 'resolution', maxLength: 1000 });
        const action = readEnum(req.body.action || 'none', ['none', 'dismiss', 'request_more_info', 'hide_listing', 'suspend_listing', 'block_owner', 'resolve'], { fieldName: 'action' });
        
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Şikayət tapılmadı' });

        const previousState = report.status;
        report.status = status;
        report.adminId = req.user._id;
        report.resolution = resolution;
        report.actionTaken = action;
        await report.save();

        if (['hide_listing', 'suspend_listing'].includes(action)) {
            const ad = await Ad.findById(report.ad);
            if (ad) {
                ad.status = action === 'hide_listing' ? 'archived' : 'rejected';
                await ad.save();
                await invalidateCache('ads:*');
                
                await Notification.create({
                    user: ad.author,
                    type: 'system',
                    title: action === 'hide_listing' ? 'Elan gizlədildi' : 'Elan dayandırıldı',
                    body: `"${ad.brand} ${ad.modelName}" elanınız şikayətə baxış nəticəsində yeniləndi.`,
                    link: '/cabinet.html'
                });
            }
        }
        if (action === 'block_owner') {
            await User.updateOne(
                { _id: report.adOwner, role: { $ne: 'admin' } },
                { $set: { status: 'blocked', refreshTokens: [] }, $inc: { tokenVersion: 1, sessionVersion: 1 } }
            );
        }

        if (['resolved', 'dismissed', 'more_info_requested'].includes(status)) {
            await Notification.create({
                user: report.reporter,
                type: 'system',
                title: status === 'dismissed' ? 'Şikayətiniz bağlandı' : 'Şikayətiniz yeniləndi',
                body: resolution || 'Etdiyiniz şikayət üzrə baxış tamamlandı. Təşəkkür edirik.',
                link: '/cabinet.html'
            });
        }

        await AuditLog.create({
            actor: req.user._id,
            targetModel: 'Report',
            target: report._id,
            action: 'report.reviewed',
            previousState: { status: previousState },
            newState: { status: report.status, resolution, action },
            requestId: req.id || ''
        });

        res.json({ message: 'Şikayət yeniləndi', report });
    } catch (error) {
        next(error);
    }
};

module.exports = { createReport, getReports, reviewReport };
