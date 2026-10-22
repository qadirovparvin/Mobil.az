const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Support both EMAIL_* and SMTP_* configuration keys
    const host = process.env.EMAIL_HOST || process.env.SMTP_HOST;
    const user = process.env.EMAIL_USER || process.env.SMTP_USER;
    const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
    const port = parseInt(process.env.EMAIL_PORT || process.env.SMTP_PORT, 10) || 587;
    const from = process.env.EMAIL_FROM || user || 'noreply@mobil.az';

    const hasSmtp = Boolean(host && user && pass);

    if (!hasSmtp) {
        console.log('\n============================================================');
        console.log('📧  EMAIL SIMULATION (No SMTP Credentials in .env)         ');
        console.log('------------------------------------------------------------');
        console.log(`To:      ${options.email}`);
        console.log(`Subject: ${options.subject}`);
        console.log('Content snippet:');
        console.log(options.message || options.html);
        console.log('============================================================\n');
        return { simulated: true };
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for 587 / 25
        auth: {
            user,
            pass
        }
    });

    const mailOptions = {
        from: `Mobil.az <${from}>`,
        to: options.email,
        subject: options.subject,
        html: options.html || options.message,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId}`);
    return info;
};

module.exports = sendEmail;
