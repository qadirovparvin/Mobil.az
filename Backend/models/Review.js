const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    author:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating:     { type: Number, required: true, min: 1, max: 5 },
    comment:    { type: String, default: '', trim: true },
    reply:      { type: String, default: '' }
}, { timestamps: true });

// One review per author per target user
reviewSchema.index({ targetUser: 1, author: 1 }, { unique: true });

// Post-save hook to update User stats
reviewSchema.post('save', async function () {
    const Review = this.constructor;
    const User = mongoose.model('User');
    
    const stats = await Review.aggregate([
        { $match: { targetUser: this.targetUser } },
        { $group: { _id: '$targetUser', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    
    if (stats.length > 0) {
        await User.findByIdAndUpdate(this.targetUser, {
            rating: Math.round(stats[0].avgRating * 10) / 10,
            reviewCount: stats[0].count
        });
    }
});

module.exports = mongoose.model('Review', reviewSchema);
