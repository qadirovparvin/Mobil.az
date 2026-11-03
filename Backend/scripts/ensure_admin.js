'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const connectDB = require('../config/db');

async function main() {
    try {
        await connectDB();
        const email = (process.argv[2] || process.env.ADMIN_EMAIL || 'mobilim.az@gmail.com').trim().toLowerCase();
        const password = process.argv[3] || process.env.ADMIN_PASSWORD || 'Mobilim.az!090803';

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let user = await User.findOne({ email });
        if (user) {
            user.role = 'admin';
            user.status = 'active';
            user.isVerified = true;
            user.password = hashedPassword;
            user.twoFactorEnabled = false;
            user.loginAttempts = 0;
            user.lockUntil = null;
            await user.save();
            console.log(`✅ Admin (${email}) successfully updated & set to active admin!`);
        } else {
            user = await User.create({
                name: 'Admin',
                lastName: 'Mobilim.az',
                email: email,
                password: hashedPassword,
                role: 'admin',
                status: 'active',
                isVerified: true,
                twoFactorEnabled: false
            });
            console.log(`✅ Admin (${email}) successfully created with admin role!`);
        }
        console.log(`Admin email: ${email}`);
        console.log(`Admin password: ${password}`);
    } catch (err) {
        console.error('Error ensuring admin:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

main();

