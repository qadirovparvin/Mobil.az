/**
 * make_admin.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Promote an existing user to the 'admin' role in MongoDB.
 *
 * Usage (run from the Backend/ folder):
 *
 *   node make_admin.js someone@example.com
 *
 * You can also demote back to a regular user:
 *
 *   node make_admin.js someone@example.com user
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const mongoose = require('mongoose');
const dotenv   = require('dotenv');
const path     = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User      = require('./models/User');
const connectDB = require('./config/db');

/* ── Parse arguments ───────────────────────────────────────── */
const targetEmail = (process.argv[2] || '').trim().toLowerCase();
const targetRole  = (process.argv[3] || 'admin').trim().toLowerCase();

const ALLOWED_ROLES = ['admin', 'user'];

if (!targetEmail || !targetEmail.includes('@')) {
    console.error('');
    console.error('❌  Usage: node make_admin.js <email> [role]');
    console.error('');
    console.error('   Examples:');
    console.error('     node make_admin.js john@example.com          → promote to admin');
    console.error('     node make_admin.js john@example.com user     → demote to user');
    console.error('');
    process.exit(1);
}

if (!ALLOWED_ROLES.includes(targetRole)) {
    console.error(`❌  Invalid role "${targetRole}". Allowed values: ${ALLOWED_ROLES.join(', ')}`);
    process.exit(1);
}

/* ── Main ──────────────────────────────────────────────────── */
async function promoteUser() {
    await connectDB();

    const user = await User.findOne({ email: targetEmail });

    if (!user) {
        console.error(`❌  No user found with email: ${targetEmail}`);
        console.error('    Make sure the user has registered first.');
        await mongoose.disconnect();
        process.exit(1);
    }

    if (user.role === targetRole) {
        console.log(`ℹ️   User "${targetEmail}" already has role "${targetRole}". Nothing changed.`);
        await mongoose.disconnect();
        process.exit(0);
    }

    const previousRole = user.role;
    user.role   = targetRole;
    user.status = 'active'; // ensure account is active after promotion
    await user.save();

    console.log('');
    console.log('──────────────────────────────────────────────────────');
    console.log(' ✅  Role updated successfully!');
    console.log('──────────────────────────────────────────────────────');
    console.log(` User    : ${user.name} ${user.lastName || ''}`.trim());
    console.log(` Email   : ${user.email}`);
    console.log(` Role    : ${previousRole}  →  ${user.role}`);
    console.log(` Status  : ${user.status}`);
    console.log('──────────────────────────────────────────────────────');

    if (targetRole === 'admin') {
        console.log('');
        console.log('  This user can now log in and access admin.html.');
    }

    console.log('');

    await mongoose.disconnect();
    process.exit(0);
}

promoteUser().catch((err) => {
    console.error('❌  Unexpected error:', err.message);
    process.exit(1);
});
