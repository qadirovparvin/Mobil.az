if (process.env.NODE_ENV === 'production') { console.error('BLOCKED in prod'); process.exit(1); }

/**
 * seed_admin.js
 * ─────────────────────────────────────────────────────────────
 * Creates the permanent admin account in MongoDB.
 *
 * Usage:
 *   node seed_admin.js
 */

'use strict';

const path     = require('path');
const dotenv   = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

if (process.env.NODE_ENV === 'production') {
    console.error('BLOCKED in prod');
    process.exit(1);
}

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User      = require('./models/User');
const connectDB = require('./config/db');
const { generateTotpSecret, encryptSecret, generateRecoveryCodes, hashRecoveryCode } = require('./utils/totp');

/* ── Admin credentials ─────────────────────────────────────── */
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_PHONE    = process.env.ADMIN_PHONE;
const ADMIN_NAME     = process.env.ADMIN_NAME || 'Admin';
const ADMIN_LASTNAME = process.env.ADMIN_LASTNAME || 'Mobilim.az';

/* ── Main ──────────────────────────────────────────────────── */
async function seedAdmin() {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        console.error('❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment variables (.env).');
        process.exit(1);
    }

    await connectDB();

    const email = ADMIN_EMAIL.trim().toLowerCase();

    /* Check if this admin already exists */
    const existing = await User.findOne({ email });

    if (existing) {
        console.warn(`⚠️ Warning: Admin account already exists (${email}). Skipping admin creation.`);
        await mongoose.disconnect();
        return;
    }

    /* Create fresh admin account */
    const adminData = {
        name:      ADMIN_NAME,
        lastName:  ADMIN_LASTNAME,
        email:     email,
        password:  await bcrypt.hash(ADMIN_PASSWORD, 12),
        role:      'admin',
        status:    'active',
        isVerified: true,
        unverifiedExpiresAt: null,
        walletBalance: 0,
        activePackage: 'none'
    };

    if (ADMIN_PHONE) {
        adminData.phone = ADMIN_PHONE;
    }

    const userRecord = new User(adminData);

    if (process.env.TOTP_2FA_ENABLED === 'true') {
        const secret = generateTotpSecret();
        userRecord.twoFactorSecret = encryptSecret(secret);
        const rawRecoveryCodes = generateRecoveryCodes(10);
        userRecord.twoFactorRecoveryCodes = await Promise.all(rawRecoveryCodes.map(c => hashRecoveryCode(c)));
        userRecord.twoFactorEnabled = true;
    } else {
        userRecord.twoFactorEnabled = false;
        userRecord.twoFactorSecret = null;
        userRecord.twoFactorRecoveryCodes = [];
    }

    await userRecord.save();

    console.log(`Admin created: ${userRecord.email}`);

    await mongoose.disconnect();
}

seedAdmin().then(() => {
    process.exit(0);
}).catch((err) => {
    console.error('❌ Error seeding admin:', err.message);
    process.exit(1);
});
