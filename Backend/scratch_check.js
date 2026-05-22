const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/db');

dotenv.config();

const checkDB = async () => {
    await connectDB();
    const admins = await User.find({ role: 'admin' });
    console.log("Admins:", admins.map(a => ({ email: a.email, role: a.role, id: a._id })));
    process.exit(0);
};

checkDB().catch(console.error);
