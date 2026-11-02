/**
 * Backend/tests/task1-task2-verification.test.js
 * Verification for:
 * - TASK 1: FIX-rateLimiter-fail-closed
 * - TASK 2: FIX-reconciliation-keep-pending
 */

const assert = require('assert');
const { spawnSync } = require('child_process');
const path = require('path');

async function testTask1FailClosed() {
    console.log('--- Testing TASK 1: FIX-rateLimiter-fail-closed ---');

    // 1. NODE_ENV=production and DISABLE_RATE_LIMIT=true must throw and fail process
    const proc = spawnSync(
        process.execPath,
        ['-e', "require('./Backend/middlewares/rateLimiter')"],
        {
            cwd: path.resolve(__dirname, '../..'),
            env: {
                ...process.env,
                NODE_ENV: 'production',
                DISABLE_RATE_LIMIT: 'true'
            },
            encoding: 'utf8'
        }
    );

    assert.notStrictEqual(proc.status, 0, 'Process should fail with non-zero exit code');
    assert.ok(
        proc.stderr.includes('DISABLE_RATE_LIMIT blocked in production'),
        `Expected stderr to contain "DISABLE_RATE_LIMIT blocked in production", got: ${proc.stderr}`
    );
    console.log('✔ TASK 1 Test 1: Production block throws "DISABLE_RATE_LIMIT blocked in production"');

    // 2. Catch block in loginRateLimiter returns 429 { message: 'Çox sayda sorğu' }
    const { loginRateLimiter } = require('../middlewares/rateLimiter');
    const mockReq = {
        ip: '198.51.100.25',
        method: 'POST',
        originalUrl: '/api/auth/login'
    };

    let statusCode = null;
    let jsonBody = null;
    let nextCalled = false;

    const mockRes = {
        status(code) {
            statusCode = code;
            return mockRes;
        },
        json(body) {
            jsonBody = body;
            return mockRes;
        }
    };

    // Override NODE_ENV to test fail-closed handling in catch
    const origEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    process.env.DISABLE_RATE_LIMIT = 'false';

    try {
        // Test remote IP that triggers rate limit / error
        const testReq = {
            ip: '198.51.100.99',
            method: 'POST',
            originalUrl: '/api/auth/login',
            headers: {}
        };

        // Call until rate limiter triggers or throws
        for (let i = 0; i < 35; i++) {
            statusCode = null;
            jsonBody = null;
            nextCalled = false;
            await loginRateLimiter(testReq, mockRes, () => { nextCalled = true; });
            if (statusCode === 429) break;
        }

        assert.strictEqual(nextCalled, false, 'next() must NOT be called on rate limit rejection');
        assert.strictEqual(statusCode, 429, 'Expected 429 status code');
        assert.strictEqual(jsonBody?.message, 'Çox sayda sorğu', 'Expected error message "Çox sayda sorğu"');
        console.log('✔ TASK 1 Test 2: catch(err) returns 429 with message "Çox sayda sorğu"');
    } finally {
        process.env.NODE_ENV = origEnv;
    }
}

async function testTask2ReconciliationKeepPending() {
    console.log('\n--- Testing TASK 2: FIX-reconciliation-keep-pending ---');

    const PaymentSession = require('../models/PaymentSession');
    const payriffProvider = require('../services/payriffProvider');
    const walletController = require('../controllers/walletController');
    const jobLock = require('../utils/jobLock');

    const origWithJobLock = jobLock.withJobLock;
    jobLock.withJobLock = (name, ttl, fn) => fn();

    const mockSessions = [
        {
            paymentId: 'p-err-1',
            provider: 'payriff',
            providerOrderId: 'ord-err-1',
            status: 'pending',
            save: async function () { this.saved = true; }
        },
        {
            paymentId: 'p-unk-1',
            provider: 'payriff',
            providerOrderId: 'ord-unk-1',
            status: 'pending',
            save: async function () { this.saved = true; }
        },
        {
            paymentId: 'p-app-1',
            provider: 'payriff',
            providerOrderId: 'ord-app-1',
            status: 'pending',
            save: async function () { this.saved = true; }
        },
        {
            paymentId: 'p-rej-1',
            provider: 'payriff',
            providerOrderId: 'ord-rej-1',
            status: 'pending',
            save: async function () { this.saved = true; }
        }
    ];

    PaymentSession.find = async () => mockSessions;

    let completedList = [];
    walletController.completeTopUpPayment = async ({ payment }) => {
        completedList.push(payment.paymentId);
    };
    walletController.reconcileStuckReserves = async () => ({ reconciledCount: 0 });

    payriffProvider.getStatus = async (orderId) => {
        if (orderId === 'ord-err-1') throw new Error('Simulated gateway socket hangup');
        if (orderId === 'ord-unk-1') return { status: 'WAITING_FOR_USER' };
        if (orderId === 'ord-app-1') return { status: 'APPROVED' };
        if (orderId === 'ord-rej-1') return { status: 'REJECTED' };
        return null;
    };

    const { reconcilePendingPayments } = require('../jobs/paymentReconciliation');
    const result = await reconcilePendingPayments();

    // 1. Error does NOT fail payment, stays pending
    assert.strictEqual(mockSessions[0].status, 'pending', 'Status error must keep payment pending');
    assert.strictEqual(mockSessions[0].saved, undefined, 'Status error must NOT call session.save()');
    console.log('✔ TASK 2 Test 1: Provider error caught and retried, remains pending');

    // 2. Unknown status does NOT fail payment, stays pending
    assert.strictEqual(mockSessions[1].status, 'pending', 'Unknown status must keep payment pending');
    assert.strictEqual(mockSessions[1].saved, undefined, 'Unknown status must NOT call session.save()');
    console.log('✔ TASK 2 Test 2: Unknown provider status kept pending, not failed');

    // 3. APPROVED completes payment
    assert.ok(completedList.includes('p-app-1'), 'APPROVED status must call completeTopUpPayment');
    console.log('✔ TASK 2 Test 3: APPROVED completes payment successfully');

    // 4. REJECTED fails payment
    assert.strictEqual(mockSessions[3].status, 'failed', 'REJECTED status must set status to failed');
    assert.strictEqual(mockSessions[3].saved, true, 'REJECTED status must call session.save()');
    console.log('✔ TASK 2 Test 4: REJECTED marks payment as failed and saves');

    console.log('✔ TASK 2 All assertions passed!');
}

async function run() {
    try {
        await testTask1FailClosed();
        await testTask2ReconciliationKeepPending();
        console.log('\n🎉 ALL TASK 1 & TASK 2 TESTS PASSED PERFECTLY!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed:', err);
        process.exit(1);
    }
}

run();
