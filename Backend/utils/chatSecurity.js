const mongoose = require('mongoose');
const xss = require('xss');

const MAX_CHAT_MESSAGE_LENGTH = Number(process.env.MAX_CHAT_MESSAGE_LENGTH || 2000);

const dangerousHtmlPattern = /<\s*(script|iframe|object|embed|link|meta|style)\b|on\w+\s*=|javascript\s*:|data\s*:\s*text\/html/i;

const sanitizeChatText = (text) => xss(text, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
    css: false
}).trim();

const validateChatMessagePayload = (payload = {}) => {
    const errors = [];
    const allowedKeys = new Set(['sender', 'recipient', 'ad', 'text']);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return { valid: false, errors: ['Payload must be an object'] };
    }
    const unexpectedKeys = Object.keys(payload).filter((key) => !allowedKeys.has(key));
    if (unexpectedKeys.length) {
        errors.push('Unexpected message payload fields');
    }
    const { sender, recipient, ad, text } = payload;

    if (recipient && typeof recipient === 'object') {
        errors.push('Invalid recipient');
    }
    if (ad && typeof ad === 'object') {
        errors.push('Invalid ad');
    }
    if (text && typeof text === 'object') {
        errors.push('Invalid message text');
    }
    if (sender !== undefined && !mongoose.Types.ObjectId.isValid(sender)) {
        errors.push('Invalid sender');
    }
    if (!mongoose.Types.ObjectId.isValid(recipient)) {
        errors.push('Invalid recipient');
    }
    if (!mongoose.Types.ObjectId.isValid(ad)) {
        errors.push('Invalid ad');
    }
    if (typeof text !== 'string') {
        errors.push('Message text must be a string');
    }

    if (errors.length > 0) {
        return { valid: false, errors };
    }

    const rawText = text.trim();
    if (!rawText) {
        errors.push('Message text is required');
    }
    if (rawText.length > MAX_CHAT_MESSAGE_LENGTH) {
        errors.push(`Message text must be ${MAX_CHAT_MESSAGE_LENGTH} characters or fewer`);
    }
    if (dangerousHtmlPattern.test(rawText)) {
        errors.push('Message contains unsafe content');
    }

    const sanitizedText = sanitizeChatText(rawText);
    if (!sanitizedText) {
        errors.push('Message text is required');
    }

    return {
        valid: errors.length === 0,
        errors,
        sanitizedText
    };
};

module.exports = {
    MAX_CHAT_MESSAGE_LENGTH,
    sanitizeChatText,
    validateChatMessagePayload
};
