require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
    await mongoose.connect(process.env.MONGODB_URI);
    const result = await mongoose.connection.collection('users').updateOne(
        { email: 'mobil@gmail.com' },
        { $set: { loginAttempts: 0, lockUntil: null, isVerified: true, role: 'admin', status: 'active' } }
    );
    console.log('Admin user updated:', result.modifiedCount);
    await mongoose.disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
