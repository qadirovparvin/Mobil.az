const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const connectDB = require('./config/db');

const createAdmin = async () => {
    await connectDB();

    const emailArg = process.argv[2] || process.env.ADMIN_EMAIL;
    const passwordArg = process.argv[3] || process.env.ADMIN_PASSWORD;

    if (!emailArg || !passwordArg) {
        console.error('Usage: node create_admin.js admin@example.com StrongPassword123');
        console.error('Or set ADMIN_EMAIL and ADMIN_PASSWORD in your environment.');
        process.exit(1);
    }

    const email = emailArg.trim().toLowerCase();
    const password = await bcrypt.hash(passwordArg, 10);

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
        console.log('User already exists with this email. Use promote_admin.js if you need to promote them.');
        process.exit(0);
    }

    await User.create({
        name: 'Admin',
        lastName: 'Mobil.az',
        email: email,
        password: password,
        phone: '+994000000000',
        role: 'admin',
        status: 'active',
        isVerified: true
    });

    console.log('Admin created successfully.');
    process.exit(0);
};

createAdmin().catch(console.error);
