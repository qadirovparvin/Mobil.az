const Review = require('../models/Review');
const User = require('../models/User');

exports.addReview = async (req, res, next) => {
    try {
        const { targetUserId, rating, comment } = req.body;
        
        if (!targetUserId || !rating) {
            return res.status(400).json({ message: "Bütün məlumatları daxil edin" });
        }

        if (targetUserId === req.user._id.toString()) {
            return res.status(400).json({ message: "Özünüzə rəy yaza bilməzsiniz" });
        }

        let review = await Review.findOne({ targetUser: targetUserId, author: req.user._id });
        
        if (review) {
            review.rating = rating;
            review.comment = comment;
        } else {
            review = new Review({
                targetUser: targetUserId,
                author: req.user._id,
                rating,
                comment
            });
        }
        
        await review.save(); // triggers the post-save hook
        
        // Fetch updated user stats to send back
        const targetUser = await User.findById(targetUserId);
        
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
