'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function setAdminPassword(newPassword) {
    if (!newPassword || newPassword.length < 6) {
        console.error('❌ Zəhmət olmasa ən azı 6 simvollu şifrə daxil edin.');
        console.error('İstifadə: node set_admin_password.js "YeniSifreniz123!"');
        process.exit(1);
    }

    const email = (process.env.ADMIN_EMAIL || 'mobil@gmail.com').trim().toLowerCase();
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.error('❌ MONGODB_URI tapılmadı.');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        const users = mongoose.connection.collection('users');

        const user = await users.findOne({ email });
        if (!user) {
            console.error(`❌ Admin istifadəçi (${email}) tapılmadı.`);
            process.exit(1);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await users.updateOne(
            { email },
            {
                $set: {
                    password: hashedPassword,
                    loginAttempts: 0,
                    lockUntil: null,
                    status: 'active',
                    isVerified: true,
                    updatedAt: new Date()
                }
            }
        );

        console.log(`✅ Admin (${email}) şifrəsi uğurla yeniləndi!`);
        console.log(`Yeni şifrə: ${newPassword}`);
        console.log('Login bloklanması sıfırlandı: loginAttempts = 0');
    } catch (err) {
        console.error('Xəta baş verdi:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

const newPass = process.argv[2];
setAdminPassword(newPass);
