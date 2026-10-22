require('dotenv').config();
const mongoose = require('mongoose');

// Import all models to ensure schemas are loaded
require('../models/User');
require('../models/Store');
require('../models/Ad');
require('../models/Transaction');
require('../models/Notification');
require('../models/AuditLog');
require('../models/Message');

const buildIndexes = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI is not defined in .env');
            process.exit(1);
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        console.log('Building indexes...');
        // This will trigger index creation for all registered models based on their schema definitions
        // It creates compound indexes, text indexes, unique indexes, etc.
        await mongoose.syncIndexes();

        console.log('Successfully built and synced all indexes!');
        process.exit(0);
    } catch (error) {
        console.error('Failed to build indexes:', error);
        process.exit(1);
    }
};

buildIndexes();
