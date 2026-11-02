const nodemailer = require('nodemailer');

/**
 * Core SMTP email sender
 * Uses SMTP_HOST, SMTP_USER, SMTP_PASS from environment variables
 * Falls back to simulation log if credentials are missing
 */
const sendEmail = async ({ to, subject, html, text }) => {
    const host = process.env.SMTP_HOST || process.env.EMAIL_HOST;
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT, 10) || 587;
    const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || user || 'noreply@mobilim.az';

    const hasSmtp = Boolean(host && user && pass);

    if (!hasSmtp) {
        console.log('\n📧 [EMAIL MOCK / SIMULATION]');
        console.log(`To:      ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Content: ${(text || html || '').substring(0, 200)}...`);
        console.log('--------------------------------------------------\n');
        return { simulated: true, to, subject };
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
    });

    const info = await transporter.sendMail({
        from: `Mobilim.az <${from}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, '')
    });

    console.log(`📧 Email sent successfully to ${to}: ${info.messageId}`);
    return info;
};

/**
 * Top-Up Uğurlu Email Bildirişi
 */
const sendTopUpSuccessEmail = async (user, amount, currency = 'AZN') => {
    const email = typeof user === 'string' ? user : user?.email;
    if (!email) return false;
    const name = (typeof user === 'object' && user?.name) ? user.name : 'İstifadəçi';

    const subject = 'Mobilim.az — Balansınız uğurla artırıldı';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #2563eb; margin: 0; font-size: 24px;">Mobilim.az</h1>
                <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">Ödəniş Təsdiqi</p>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <h2 style="color: #166534; font-size: 18px; margin: 0 0 8px 0;">🎉 Ödənişiniz uğurla tamamlandı!</h2>
                <p style="color: #15803d; margin: 0; font-size: 14px;">Hörmətli <b>${name}</b>, balansınız <b>${amount} ${currency}</b> məbləğində artırıldı.</p>
            </div>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
                Cari balansınızdan istifadə edərək elanlarınızı önə çəkə, VIP/Premium paketlər ala və ya digər xidmətlərdən faydalana bilərsiniz.
            </p>
            <div style="margin-top: 24px; text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}/cabinet.html#wallet" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Şəxsi Kabinetə Keçid</a>
            </div>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0 16px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">Bu avtomatik məktubdur. Zəhmət olmasa cavab verməyin.</p>
        </div>
    `;

    return sendEmail({ to: email, subject, html });
};

/**
 * Çıxarış Sorğusu Göndərildikdə Admin Bildirişi
 */
const sendCashOutRequestEmail = async (admin, cashOutDetails = {}) => {
    const adminEmail = typeof admin === 'string'
        ? admin
        : (admin?.email || process.env.ADMIN_NOTIFICATION_EMAIL || 'admin@mobilim.az');
    if (!adminEmail) return false;

    const amount = cashOutDetails.amount || 0;
    const destination = cashOutDetails.destination || 'Bank kartı';
    const requestId = cashOutDetails._id || cashOutDetails.id || 'N/A';
    const user = cashOutDetails.user || 'İstifadəçi';

    const subject = `Mobilim.az — Yeni Çıxarış Sorğusu (#${requestId})`;
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #d97706; margin: 0; font-size: 24px;">Mobilim.az Admin</h1>
                <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">Yeni Çıxarış Sorğusu</p>
            </div>
            <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <h2 style="color: #92400e; font-size: 16px; margin: 0 0 8px 0;">⚠️ Təsdiq gözləyən çıxarış:</h2>
                <ul style="color: #b45309; margin: 0; padding-left: 20px; font-size: 14px;">
                    <li>Məbləğ: <b>${amount} AZN</b></li>
                    <li>İstifadəçi ID: <b>${user}</b></li>
                    <li>İstiqamət: <b>${destination}</b></li>
                    <li>Sorğu ID: <b>${requestId}</b></li>
                </ul>
            </div>
            <div style="margin-top: 24px; text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}/admin.html#cashout" style="display: inline-block; background: #d97706; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Admin Panelində Bax</a>
            </div>
        </div>
    `;

    return sendEmail({ to: adminEmail, subject, html });
};

/**
 * Çıxarış Təsdiqləndikdə İstifadəçiyə Bildiriş
 */
const sendCashOutApprovedEmail = async (user, amount, currency = 'AZN') => {
    const email = typeof user === 'string' ? user : user?.email;
    if (!email) return false;
    const name = (typeof user === 'object' && user?.name) ? user.name : 'İstifadəçi';

    const subject = 'Mobilim.az — Çıxarış sorğunuz təsdiqləndi';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #10b981; margin: 0; font-size: 24px;">Mobilim.az</h1>
                <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">Çıxarış Bildirişi</p>
            </div>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                <h2 style="color: #166534; font-size: 18px; margin: 0 0 8px 0;">✅ Çıxarışınız uğurla ödənildi!</h2>
                <p style="color: #15803d; margin: 0; font-size: 14px;">Hörmətli <b>${name}</b>, <b>${amount} ${currency}</b> məbləğində çıxarışınız tamamlanmışdır və göstərilən hesabınıza köçürülmüşdür.</p>
            </div>
            <p style="color: #334155; font-size: 14px; line-height: 1.6;">
                Əməliyyat tarixçənizi şəxsi kabinetinizdən izləyə bilərsiniz.
            </p>
            <div style="margin-top: 24px; text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}/cabinet.html#wallet" style="display: inline-block; background: #10b981; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Kabinetə Keçid</a>
            </div>
        </div>
    `;

    return sendEmail({ to: email, subject, html });
};

module.exports = {
    sendEmail,
    sendTopUpSuccessEmail,
    sendCashOutRequestEmail,
    sendCashOutApprovedEmail
};
