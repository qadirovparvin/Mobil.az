const Question = require('../models/Question');
const Store = require('../models/Store');
const Ad = require('../models/Ad');
const { DELETED_AD_STATUS } = require('../utils/adLifecycle');
const { sanitizePlainText } = require('../utils/sanitizers');
const { readObjectId, validateAllowedFields } = require('../utils/securityValidation');

// @desc    Ask a question about a store or product
// @route   POST /api/questions
// @access  Private
const askQuestion = async (req, res, next) => {
    try {
        validateAllowedFields(req.body, ['storeId', 'productId', 'questionText'], 'body');
        const { storeId, productId, questionText } = req.body;

        if (!storeId || !questionText) {
            return res.status(400).json({ message: 'Mağaza və sual mətni mütləqdir.' });
        }
        const cleanStoreId = readObjectId(storeId, 'storeId');
        const cleanProductId = productId ? readObjectId(productId, 'productId') : null;

        // Verify store exists
        const store = await Store.findById(cleanStoreId);
        if (!store) {
            return res.status(404).json({ message: 'Mağaza tapılmadı.' });
        }

        // Verify product exists and belongs to the store if productId is provided
        if (cleanProductId) {
            const product = await Ad.findOne({ _id: cleanProductId, status: { $ne: DELETED_AD_STATUS } });
            if (!product) {
                return res.status(404).json({ message: 'Məhsul tapılmadı.' });
            }
            if (product.store && product.store.toString() !== cleanStoreId) {
                return res.status(400).json({ message: 'Məhsul bu mağazaya aid deyil.' });
            }
        }

        const cleanQuestion = sanitizePlainText(questionText, { maxLength: 1000, allowEmpty: false });
        if (!cleanQuestion) return res.status(400).json({ message: 'Sual mətni düzgün deyil.' });

        const question = await Question.create({
            store: cleanStoreId,
            product: cleanProductId,
            customer: req.user._id,
            questionText: cleanQuestion
        });

        // Populate customer info for return
        const populated = await Question.findById(question._id)
            .populate('customer', 'name lastName avatar');

        res.status(201).json(populated);
    } catch (error) {
        next(error);
    }
};

// @desc    Reply/Answer to a question thread
// @route   POST /api/questions/:id/answers
// @access  Private
const answerQuestion = async (req, res, next) => {
    try {
        validateAllowedFields(req.body, ['text'], 'body');
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ message: 'Cavab mətni mütləqdir.' });
        }

        const question = await Question.findById(req.params.id).populate('store');
        if (!question) {
            return res.status(404).json({ message: 'Sual tapılmadı.' });
        }

        const isStoreOwner = question.store.owner.toString() === req.user._id.toString();
        const isOriginalCustomer = question.customer.toString() === req.user._id.toString();

        // Only the store owner or the original customer is allowed to reply in the Q&A thread
        if (!isStoreOwner && !isOriginalCustomer && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Bu sualı cavablandırmaq icazəniz yoxdur. Yalnız mağaza sahibi və ya sualı verən istifadəçi yaza bilər.' });
        }

        const cleanAnswer = sanitizePlainText(text, { maxLength: 1000, allowEmpty: false });
        if (!cleanAnswer) return res.status(400).json({ message: 'Cavab mətni düzgün deyil.' });

        question.answers.push({
            sender: req.user._id,
            text: cleanAnswer
        });

        await question.save();

        // Retrieve fully populated question thread
        const updatedQuestion = await Question.findById(question._id)
            .populate('customer', 'name lastName avatar')
            .populate('answers.sender', 'name lastName avatar');

        res.status(200).json(updatedQuestion);
    } catch (error) {
        next(error);
    }
};

// @desc    Get all questions for a specific store
// @route   GET /api/questions/store/:storeId
// @access  Public
const getStoreQuestions = async (req, res, next) => {
    try {
        const questions = await Question.find({ store: req.params.storeId })
            .populate('customer', 'name lastName avatar')
            .populate('product', 'title price images')
            .populate('answers.sender', 'name lastName avatar')
            .sort({ createdAt: -1 });

        res.json(questions);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    askQuestion,
    answerQuestion,
    getStoreQuestions
};
