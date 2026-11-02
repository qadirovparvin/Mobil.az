'use strict';

const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const path = require('node:path');

process.env.MONGOMS_DOWNLOAD_DIR ||= path.join(__dirname, '..', 'node_modules', '.cache', 'mongodb-binaries');
process.env.MONGOMS_VERSION ||= '8.2.6';

const { MongoMemoryServer } = require('mongodb-memory-server');

const TEST_DB_NAME = 'mobilim_test';
let mongod = null;

function assertSafeTestDB() {
    const connection = mongoose.connection;
    const databaseName = String(connection.name || '').toLowerCase();
    const host = String(connection.host || '').toLowerCase();

    assert.ok(mongod, 'Tests must use the MongoMemoryServer instance created by setupTestDB');
    assert.strictEqual(connection.readyState, 1, 'In-memory test database must be connected');
    assert.strictEqual(databaseName, TEST_DB_NAME, `Unexpected test database name: ${databaseName}`);
    assert.ok(!databaseName.includes('prod'), 'Refusing to run database tests against a production-named database');
    assert.ok(!databaseName.includes('atlas'), 'Refusing to run database tests against an Atlas-named database');
    assert.ok(['127.0.0.1', '::1', 'localhost'].includes(host), `Refusing non-local database host: ${host}`);

    return true;
}

async function connectTestDB() {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Database tests are blocked when NODE_ENV=production');
    }
    if (mongod || mongoose.connection.readyState !== 0) {
        throw new Error('Refusing to replace or reuse an existing MongoDB connection in tests');
    }

    mongod = await MongoMemoryServer.create({
        instance: {
            dbName: TEST_DB_NAME,
            ip: '127.0.0.1'
        }
    });

    try {
        const uri = mongod.getUri(TEST_DB_NAME);
        await mongoose.connect(uri, { dbName: TEST_DB_NAME });
        assertSafeTestDB();
        return uri;
    } catch (error) {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect().catch(() => {});
        }
        await mongod.stop().catch(() => {});
        mongod = null;
        throw error;
    }
}

async function disconnectTestDB() {
    if (!mongod) return;

    const instance = mongod;
    try {
        if (mongoose.connection.readyState === 1) {
            assertSafeTestDB();
            await mongoose.connection.dropDatabase();
            await mongoose.disconnect();
        }
    } finally {
        mongod = null;
        await instance.stop();
    }
}

module.exports = { connectTestDB, disconnectTestDB, assertSafeTestDB };
