const { getTranslation } = require('../utils/translations');
const Review = require('../models/Review');
const User = require('../models/User');
const { sanitizePlainText } = require('../utils/sanitizers');
const { readNumber, readObjectId, validateAllowedFields } = require('../utils/securityValidation');

exports.addReview = async (req, res, next) => {
    try {
        validateAllowedFields(req.body, ['targetUserId', 'rating', 'comment'], 'body');
        const { targetUserId, rating, comment } = req.body;
        
        if (!targetUserId || !rating) {
            return res.status(400).json({ message: "Bütün məlumatları daxil edin" });
        }

        const cleanTargetUserId = readObjectId(targetUserId, 'targetUserId');
        const cleanRating = readNumber(rating, { fieldName: 'rating', required: true, min: 1, max: 5, integer: true });

        if (cleanTargetUserId.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: "Özünüzə rəy yaza bilməzsiniz" });
        }

        let review = await Review.findOne({ targetUser: cleanTargetUserId, author: req.user._id });
        
        const cleanComment = sanitizePlainText(comment || '', { maxLength: 1000 });
        if (cleanComment === null) return res.status(400).json({ message: 'Rəy düzgün deyil' });

        if (review) {
            review.rating = cleanRating;
            review.comment = cleanComment;
        } else {
            review = new Review({
                targetUser: cleanTargetUserId,
                author: req.user._id,
                rating: cleanRating,
                comment: cleanComment
            });
        }
        
        await review.save(); // triggers the post-save hook
        
        // Fetch updated user stats to send back
        const targetUser = await User.findById(cleanTargetUserId);
        
        res.status(200).json({ 
            message: "Rəy uğurla əlavə edildi", 
            review,
            newRating: targetUser.rating,
            newCount: targetUser.reviewCount
        });
    } catch (e) {
        next(e);
    }
};

exports.getReviews = async (req, res, next) => {
    try {
        const { targetUserId } = req.params;
        const reviews = await Review.find({ targetUser: targetUserId })
            .populate('author', 'name lastName avatar')
            .sort('-createdAt');
            
        res.status(200).json({ reviews });
    } catch (e) {
        next(e);
    }
};
