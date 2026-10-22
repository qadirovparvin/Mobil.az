const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const Ad = require('../models/Ad');
const Message = require('../models/Message');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Store = require('../models/Store');
const AuditLog = require('../models/AuditLog');

const run = async () => {
    await connectDB();

    for (const model of [Ad, Message, Transaction, User, Store, AuditLog]) {
        await model.createIndexes();
        console.log(`Indexes ensured for ${model.modelName}`);
    }

    await mongoose.disconnect();
};

run().catch(async (error) => {
    console.error(error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});
