/**
 * wipe-all-users.js
 * Deletes ALL documents from the Users collection.
 * Run once:  node scripts/wipe-all-users.js
 * Then delete this file.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User     = require('../models/User');

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected.');

        const result = await User.deleteMany({});
        console.log(`🗑️  Deleted ${result.deletedCount} user(s).`);

        await mongoose.disconnect();
        console.log('✅ Done. All accounts removed from database.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
})();
