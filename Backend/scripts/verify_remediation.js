require('dotenv').config();
const mongoose = require('mongoose');
const Ad = require('../models/Ad');
const User = require('../models/User');
const { getCache, setCache } = require('../utils/redisClient');

async function runTests() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Test 1: Index verification for Ad collection
        console.log('\n--- 1. Testing MongoDB Indexes ---');
        // Let's test text index
        let explain = await Ad.find({ $text: { $search: "iphone" }, status: 'active' })
            .select({ score: { $meta: 'textScore' } })
            .sort({ score: { $meta: 'textScore' } })
            .explain("executionStats");
        
        let ixScan = explain.executionStats.executionStages.inputStage ? explain.executionStats.executionStages.inputStage.stage : explain.executionStats.executionStages.stage;
        let isTextScanned = JSON.stringify(explain).includes('TEXT_MATCH') || JSON.stringify(explain).includes('TEXT');
        console.log(`Text Search Index Used: ${isTextScanned ? '✅ YES' : '❌ NO'}`);
        console.log(`Total Docs Examined: ${explain.executionStats.totalDocsExamined}`);
        console.log(`Execution Time (ms): ${explain.executionStats.executionTimeMillis}`);

        // Let's test compound index (status + category + price)
        explain = await Ad.find({ status: 'active', category: 'Mobil telefonlar', price: { $gte: 100 } })
            .explain("executionStats");
        console.log(`\nCompound Index (status, category, price) Docs Examined: ${explain.executionStats.totalDocsExamined}`);

        // Test 2: Redis Caching
        console.log('\n--- 2. Testing Redis Caching ---');
        const { redis } = require('../utils/redisClient');
        const isRedisReady = redis && redis.status === 'ready';
        console.log(`Redis Available: ${isRedisReady ? '✅ YES' : '❌ NO'}`);
        if (isRedisReady) {
            await setCache('test:key', { ok: true }, 10);
            const val = await getCache('test:key');
            console.log(`Cache Read Success: ${val && val.ok ? '✅ YES' : '❌ NO'}`);
        }

        // Test 3: Verify Mongoose Transactions Available (Replica Set check)
        console.log('\n--- 3. Testing Mongoose Transactions ---');
        try {
            const session = await mongoose.startSession();
            await session.withTransaction(async () => {
                // mock update
                const mockUser = new User({
                    name: 'Test',
                    lastName: 'User',
                    email: 'test_tx@example.com',
                    password: 'password123',
                    walletBalance: 100
                });
                await mockUser.save({ session });
                throw new Error("Trigger rollback");
            });
            console.log('❌ Transaction did not roll back as expected');
            await session.endSession();
        } catch (err) {
            if (err.message === "Trigger rollback") {
                console.log('✅ Transaction rollback triggered successfully');
            } else if (err.message.includes('Transactions are not supported')) {
                console.log('❌ MongoDB deployment does not support transactions (Replica Set required)');
            } else {
                console.log('⚠️ Unknown transaction error:', err.message);
            }
        }

        await mongoose.connection.close();
        if (redis) await redis.quit();
        process.exit(0);

    } catch (err) {
        console.error('Test script failed:', err);
        process.exit(1);
    }
}

runTests();
