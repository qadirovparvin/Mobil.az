const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const connectDB = require('./config/db');
const User = require('./models/User');

const emailArg = process.argv[2];

if (!emailArg) {
    console.error('Usage: node promote_admin.js user@example.com');
    process.exit(1);
}

const promoteAdmin = async () => {
    await connectDB();

    const email = emailArg.trim().toLowerCase();
    const user = await User.findOne({ email });

    if (!user) {
        console.error(`User not found for email: ${email}`);
        process.exit(1);
    }

    user.role = 'admin';
    user.status = 'active';
    await user.save();

    console.log(`User promoted to admin: ${user.email}`);
    process.exit(0);
};

promoteAdmin().catch((error) => {
    console.error('Failed to promote admin:', error);
    process.exit(1);
});
