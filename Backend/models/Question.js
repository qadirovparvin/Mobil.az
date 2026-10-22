const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const questionSchema = new mongoose.Schema({
    store: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ad',
        default: null
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    questionText: {
        type: String,
        required: true,
        trim: true
    },
    answers: [answerSchema]
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
