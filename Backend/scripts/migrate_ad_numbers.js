const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function migrate() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        console.error('MONGODB_URI not found in env');
        process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);

    const db = mongoose.connection.db;
    const adsCollection = db.collection('ads');

    // Find all ads missing adNumber or where adNumber is null/empty
    const adsToUpdate = await adsCollection.find({
        $or: [
            { adNumber: { $exists: false } },
            { adNumber: null },
            { adNumber: '' }
        ]
    }).toArray();

    console.log(`Found ${adsToUpdate.length} ads needing adNumber migration.`);

    let updatedCount = 0;
    for (const ad of adsToUpdate) {
        let adNum;
        if (ad._id.toString() === '6ad7634079a9d25725d38022') {
            adNum = 'MOB-5D3802';
        } else {
            adNum = `MOB-${ad._id.toString().slice(-6).toUpperCase()}`;
        }

        // Check for collision
        const exists = await adsCollection.findOne({ adNumber: adNum, _id: { $ne: ad._id } });
        if (exists) {
            adNum = `MOB-${ad._id.toString().slice(-8).toUpperCase()}`;
        }

        await adsCollection.updateOne(
            { _id: ad._id },
            { $set: { adNumber: adNum } }
        );
        console.log(`Updated ad ${ad._id} (${ad.brand} ${ad.modelName}) -> adNumber: ${adNum}`);
        updatedCount++;
    }

    // Also specifically ensure 6ad7634079a9d25725d38022 has MOB-5D3802 if present
    const testAd = await adsCollection.findOne({ _id: new mongoose.Types.ObjectId('6ad7634079a9d25725d38022') });
    if (testAd && testAd.adNumber !== 'MOB-5D3802') {
        await adsCollection.updateOne(
            { _id: testAd._id },
            { $set: { adNumber: 'MOB-5D3802' } }
        );
        console.log(`Explicitly ensured 6ad7634079a9d25725d38022 -> adNumber: MOB-5D3802`);
    }

    console.log(`Migration completed. Total updated: ${updatedCount}`);
    await mongoose.connection.close();
}

migrate().catch(err => {
    console.error('Migration error:', err);
    process.exit(1);
});

