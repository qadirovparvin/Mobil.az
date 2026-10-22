require('dotenv').config();
const mongoose = require('mongoose');
const Ad = require('../models/Ad');

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Create a dummy ad
        const dummyAd = await Ad.create({
            author: new mongoose.Types.ObjectId(),
            category: 'Test',
            brand: 'TestBrand',
            modelName: 'TestModel',
            price: 100,
            condition: 'Yeni',
            city: 'Baku',
            status: 'active',
            views: 0
        });

        console.log(`Created dummy ad with ${dummyAd.views} views.`);

        // Fire 20 concurrent updates
        const updatePromises = [];
        for (let i = 0; i < 20; i++) {
            updatePromises.push(
                Ad.findOneAndUpdate(
                    { _id: dummyAd._id, status: 'active' },
                    { $inc: { views: 1 } },
                    { new: true }
                )
            );
        }

        await Promise.all(updatePromises);

        // Fetch final
        const finalAd = await Ad.findById(dummyAd._id);
        console.log(`Final views count: ${finalAd.views}`);

        if (finalAd.views === 20) {
            console.log('✅ Concurrency test PASSED: Exactly 20 views recorded.');
        } else {
            console.log('❌ Concurrency test FAILED.');
        }

        await Ad.deleteOne({ _id: dummyAd._id });
        await mongoose.connection.close();
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

runTest();
