/**
 * seed_admin.js
 * ─────────────────────────────────────────────────────────────
 * Creates (or re-confirms) the permanent admin account in MongoDB.
 *
 * Usage:
 *   node seed_admin.js
 *
 * Run from the Backend directory:
 *   cd "c:\Users\Gadirov\Desktop\AiryPhone - COPY\Backend"
 *   node seed_admin.js
 */

'use strict';

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const dotenv   = require('dotenv');

dotenv.config();  // loads .env → MONGODB_URI, JWT_SECRET

const User      = require('./models/User');
const connectDB = require('./config/db');

/* ── Admin credentials ─────────────────────────────────────── */
const ADMIN_EMAIL    = 'mobil@gmail.com';
const ADMIN_PASSWORD = 'Mobil.az!1921021418';
const ADMIN_NAME     = 'Admin';
const ADMIN_LASTNAME = 'Mobil.az';
const ADMIN_PHONE    = '+994000000000';

/* ── Main ──────────────────────────────────────────────────── */
async function seedAdmin() {
    await connectDB();

    const email = ADMIN_EMAIL.trim().toLowerCase();

    /* Check if this admin already exists */
    const existing = await User.findOne({ email });

    if (existing) {
        if (existing.role !== 'admin') {
            /* Exists but not admin — promote + update password */
            const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
            existing.role     = 'admin';
            existing.password = hashed;
            existing.status   = 'active';
            await existing.save();
            console.log('✅ Existing user promoted to admin and password updated.');
        } else {
            /* Already an admin — just refresh the password to be safe */
            const isMatch = await bcrypt.compare(ADMIN_PASSWORD, existing.password);
            if (!isMatch) {
                const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
                existing.password = hashed;
                existing.status   = 'active';
                await existing.save();
                console.log('✅ Admin already exists — password refreshed.');
            } else {
                console.log('✅ Admin account already exists with correct credentials. Nothing to do.');
            }
        }
    } else {
        /* Create fresh admin account */
        const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);

        await User.create({
            name:      ADMIN_NAME,
            lastName:  ADMIN_LASTNAME,
            email:     email,
            password:  hashed,
            phone:     ADMIN_PHONE,
            role:      'admin',
            status:    'active',
            walletBalance: 0,
            activePackage: 'none'
        });

        console.log('✅ Admin account created successfully!');
    }

    console.log('');
    console.log('──────────────────────────────────────────────');
    console.log(' Admin credentials');
    console.log('──────────────────────────────────────────────');
    console.log(` Email   : ${ADMIN_EMAIL}`);
    console.log(` Password: ${ADMIN_PASSWORD}`);
    console.log(` Role    : admin`);
    console.log('──────────────────────────────────────────────');
    console.log('');
    console.log('You can now log in at login.html → you will be');
    console.log('automatically redirected to admin.html.');

    await mongoose.disconnect();
    process.exit(0);
}

seedAdmin().catch((err) => {
    console.error('❌ Error seeding admin:', err.message);
    process.exit(1);
});
