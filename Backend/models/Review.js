const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({

    store:  { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },

    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', trim: true },

    // Seller can reply once
    reply: { type: String, default: '' }

}, { timestamps: true });

// One review per user per store
reviewSchema.index({ store: 1, author: 1 }, { unique: true });

// Post-save hook: update Store.rating & Store.reviewCount
reviewSchema.post('save', async function () {
    const Review = this.constructor;
    const Store  = mongoose.model('Store');

    const stats = await Review.aggregate([
        { $match: { store: this.store } },
        { $group: { _id: '$store', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (stats.length > 0) {
        await Store.findByIdAndUpdate(this.store, {
            rating:      Math.round(stats[0].avgRating * 10) / 10,
            reviewCount: stats[0].count
        });
    }
});

module.exports = mongoose.model('Review', reviewSchema);
