const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from Backend/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const { generateTotpSecret, encryptSecret, generateRecoveryCodes, hashRecoveryCode, buildOtpAuthUrl } = require('../utils/totp');

async function enforceSingleAdmin() {
    let connection;
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mobilaz_db';
        connection = await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB.');

        const TARGET_EMAIL = 'mobil@gmail.com'.toLowerCase();

        // 1. Process the specific admin account
        const targetAdmin = await User.findOne({ email: TARGET_EMAIL });
        
        if (!targetAdmin) {
            console.error(`❌ Admin account '${TARGET_EMAIL}' does not exist. Failing safely.`);
            return;
        }

        targetAdmin.role = 'admin';
        targetAdmin.isVerified = true;
        targetAdmin.status = 'active';
        
        let authUrl = null;
        let generatedCodes = null;

        // Setup 2FA if not already enabled and configured
        if (!targetAdmin.twoFactorEnabled || !targetAdmin.twoFactorSecret) {
            const secret = generateTotpSecret();
            targetAdmin.twoFactorSecret = encryptSecret(secret);
            const rawRecoveryCodes = generateRecoveryCodes(10);
            targetAdmin.twoFactorRecoveryCodes = await Promise.all(rawRecoveryCodes.map(c => hashRecoveryCode(c)));
            targetAdmin.twoFactorEnabled = true;

            authUrl = buildOtpAuthUrl({
                accountName: targetAdmin.email,
                issuer: process.env.TWO_FACTOR_ISSUER || 'MobileAZ',
                secret
            });
            generatedCodes = rawRecoveryCodes;
        }

        await targetAdmin.save();
        console.log(`✅ Verified '${TARGET_EMAIL}' as the active administrator.`);
        
        if (authUrl) {
            console.log('\n──────────────────────────────────────────────');
            console.log(' ⚠️ IMPORTANT: ADD TO AUTHENTICATOR APP');
            console.log('──────────────────────────────────────────────');
            console.log('Scan the QR code from this URL or manually copy the secret parameter:');
            console.log(`\n${authUrl}\n`);
            console.log('Recovery Codes (Save these in a secure place!):');
            generatedCodes.forEach((code, i) => console.log(`  ${i + 1}. ${code}`));
            console.log('──────────────────────────────────────────────\n');
        } else {
            console.log(`✅ 2FA configuration preserved for '${TARGET_EMAIL}'.`);
        }

        // 2. Demote all other privileged accounts
        const privilegedUsers = await User.find({ 
            email: { $ne: TARGET_EMAIL },
            role: { $ne: 'user' }
        });

        if (privilegedUsers.length > 0) {
            let demotedCount = 0;
            for (const pUser of privilegedUsers) {
                pUser.role = 'user';
                // Increment token and session versions to invalidate existing JWTs instantly
                pUser.tokenVersion = (pUser.tokenVersion || 0) + 1;
                pUser.sessionVersion = (pUser.sessionVersion || 0) + 1;
                pUser.refreshTokens = [];
                await pUser.save();
                demotedCount++;
            }
            console.log(`✅ Successfully demoted ${demotedCount} rogue privileged account(s) to 'user'. Sessions revoked.`);
        } else {
            console.log(`✅ No rogue privileged accounts found.`);
        }

    } catch (error) {
        console.error('❌ An error occurred during enforcement:', error.message);
    } finally {
        if (connection) {
            await mongoose.disconnect();
            console.log('✅ Disconnected from MongoDB.');
        }
    }
}

enforceSingleAdmin();
