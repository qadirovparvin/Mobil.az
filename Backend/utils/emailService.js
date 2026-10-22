const nodemailer = require('nodemailer');
const logger = require('./logger');
const { isEmailConfigured } = require('./providers');

const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const sendVerificationEmail = async (to, token) => {
    if (!isEmailConfigured()) {
        logger.warn(`Email OTP disabled or missing credentials. Skipping email sending for ${to}.`);
        return false;
    }

    // In production, configure nodemailer with actual SMTP credentials
    // For now, we mock the email sending and log the token to the console
    const frontendUrl = (process.env.FRONTEND_URL || '').replace(/\/$/, '');
    const apiUrl = (process.env.API_PUBLIC_URL || process.env.BACKEND_URL || '').replace(/\/$/, '');
    const verifyUrl = frontendUrl
        ? `${frontendUrl}/verify-email.html?token=${encodeURIComponent(token)}`
        : `${apiUrl || 'http://localhost:5000'}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
    const safeTo = escapeHtml(to);
    
    logger.info(`\n${'═'.repeat(50)}`);
    logger.info(`📧 EMAIL VERIFICATION LINK → ${safeTo}`);
    logger.info(`🔗 Link: ${verifyUrl}`);
    logger.info(`⏱  Expires in 24 hours`);
    logger.info(`${'═'.repeat(50)}\n`);
    
    return true;
};

module.exports = {
    sendVerificationEmail
};
