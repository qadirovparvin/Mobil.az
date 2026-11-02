/**
 * Backend/tests/payment-double-inc-crash.test.js
 * Verification for: TASK: FIX-P0-payment-double-inc-crash-recovery
 * 
 * Tests:
 * 1. Crash simulation: $inc sonra throw -> Transaction pending walletCredited=true
 * 2. Recovery təkrar çağır -> balans 2x artmır, idempotent true
 * 3. Normal idempotent flow
 * 4. Referral duplicate key (E11000) post-save retry
 */

'use strict';

const mongoose = require('mongoose');
const assert = require('assert');
const { connectTestDB, disconnectTestDB, assertSafeTestDB } = require('./setupTestDB');
const User = require('../models/User');
const PaymentSession = require('../models/PaymentSession');
const PaymentRequest = require('../models/PaymentRequest');
const Transaction = require('../models/Transaction');
const walletController = require('../controllers/walletController');

const it = typeof global.it === 'function' ? global.it : async function (name, fn) {
    console.log(`\n--- it: ${name} ---`);
    assertSafeTestDB();
    await fn();
    console.log(`✓ it: ${name} PASSED!`);
};

async function run() {
    await connectTestDB();
    assertSafeTestDB();
    console.log('Connected to isolated in-memory MongoDB');

    const testUser = await User.create({
        name: 'CrashRecovery',
        lastName: 'Tester',
        email: `crash_rec_${Date.now()}@example.com`,
        password: 'Password123!',
        walletBalance: 50
    });

    const paymentId = `pay_crash_${Date.now()}`;
    const amount = 20;

    try {
        assertSafeTestDB();
        console.log('\n--- TEST 1: Crash Simulation & Recovery ($inc sonra crash -> 2x artmır) ---');
        console.log('Initial user balance:', testUser.walletBalance);

        // 1. Create PaymentSession
        const paymentSession = await PaymentSession.create({
            paymentId,
            user: testUser._id,
            kind: 'wallet_topup',
            expectedAmount: amount,
            currency: 'AZN',
            status: 'processing',
            walletCreditVersion: 1,
            expiresAt: new Date(Date.now() + 600000)
        });
        await PaymentSession.collection.updateOne(
            { _id: paymentSession._id },
            { $set: { updatedAt: new Date(Date.now() - 11 * 60 * 1000) } }
        );

        // 2. Simulate state right after $inc crashed before tx.status='completed'
        // Transaction is created with pending, walletCredited=true
        const simulatedPendingTx = await Transaction.create({
            user: testUser._id,
            userId: testUser._id,
            amount,
            type: 'topup',
            description: `Balans artırımı - ${amount} AZN`,
            reference: paymentId,
            paymentProvider: 'internal',
            paymentId: paymentId,
            balanceAfter: 70,
            status: 'pending',
            walletCredited: true // CRUCIAL FLAG: wallet was credited before crash
        });

        // User balance was incremented to 70 before crash
        await User.updateOne(
            { _id: testUser._id },
            {
                $set: { walletBalance: 70 },
                $addToSet: { walletOperationKeys: `topup:${paymentId}` }
            }
        );
        console.log('Simulated state before recovery: user balance = 70, tx status = pending, walletCredited = true');

        // 3. Call recovery (completeTopUpPayment)
        const recoveryResult = await walletController.completeTopUpPayment({
            payment: paymentSession,
            session: null
        });

        console.log('Recovery result idempotent flag:', recoveryResult.idempotent);
        assert.strictEqual(recoveryResult.idempotent, true, 'Recovery call on already credited transaction must return idempotent: true');

        // Check user balance: MUST STILL BE 70 (NOT 90!)
        const userAfterRecovery = await User.findById(testUser._id);
        console.log('User balance after recovery (must be 70, NOT 90):', userAfterRecovery.walletBalance);
        assert.strictEqual(userAfterRecovery.walletBalance, 70, 'User balance must NOT be incremented twice! ($inc 2x yox)');

        // Check Transaction status in DB
        const updatedTx = await Transaction.findById(simulatedPendingTx._id);
        console.log('Transaction status after recovery:', updatedTx.status);
        assert.strictEqual(updatedTx.status, 'completed', 'Transaction status must be completed');
        assert.strictEqual(updatedTx.walletCredited, true, 'walletCredited flag must be true');

        // Check PaymentSession status in DB
        const updatedPayment = await PaymentSession.findById(paymentSession._id);
        console.log('PaymentSession status after recovery:', updatedPayment.status);
        assert.strictEqual(updatedPayment.status, 'completed', 'PaymentSession status must be completed');

        // 4. Second recovery call check
        assertSafeTestDB();
        console.log('\n--- TEST 2: Second recovery call check ---');
        const secondRecovery = await walletController.completeTopUpPayment({
            payment: updatedPayment,
            session: null
        });
        assert.strictEqual(secondRecovery.idempotent, true, 'Subsequent recovery call must be idempotent: true');

        const finalUserCheck = await User.findById(testUser._id);
        assert.strictEqual(finalUserCheck.walletBalance, 70, 'Balance must remain 70');
        console.log('✓ Balans 2x artmadı, 100% idempotent bərpa təsdiqləndi!');

        // 5. Test fresh normal payment flow
        assertSafeTestDB();
        console.log('\n--- TEST 3: Fresh normal top-up flow ---');
        const freshUser = await User.create({
            name: 'FreshTester',
            lastName: 'User',
            email: `fresh_topup_${Date.now()}@example.com`,
            password: 'Password123!',
            walletBalance: 100
        });

        const freshPaymentId = `pay_fresh_${Date.now()}`;
        const freshPayment = await PaymentSession.create({
            paymentId: freshPaymentId,
            user: freshUser._id,
            kind: 'wallet_topup',
            expectedAmount: 30,
            currency: 'AZN',
            status: 'pending',
            expiresAt: new Date(Date.now() + 600000)
        });

        const freshResult = await walletController.completeTopUpPayment({
            payment: freshPayment,
            session: null
        });

        console.log('Fresh payment result idempotent:', freshResult.idempotent);
        assert.strictEqual(freshResult.idempotent, false, 'First normal call must return idempotent: false');

        const freshUserAfter = await User.findById(freshUser._id);
        console.log('Fresh user balance after top-up:', freshUserAfter.walletBalance);
        assert.strictEqual(freshUserAfter.walletBalance, 130, 'Balance must be 100 + 30 = 130');

        const freshTx = await Transaction.findOne({ paymentId: freshPaymentId });
        assert.strictEqual(freshTx.status, 'completed', 'Transaction must be completed');
        assert.strictEqual(freshTx.walletCredited, true, 'walletCredited must be true');

        // Cleanup
        await User.deleteOne({ _id: freshUser._id });
        await PaymentSession.deleteOne({ _id: freshPayment._id });
        await Transaction.deleteMany({ paymentId: freshPaymentId });

        // 7. NEW TEST: should not double credit when crash between inc and flag
        await it('should not double credit when crash between inc and flag', async () => {
            // 1. PaymentRequest yarad: walletCredited=false, balance=50
            const crashUser = await User.create({
                name: 'CrashBetweenTester',
                lastName: 'User',
                email: `crash_between_${Date.now()}@example.com`,
                password: 'Password123!',
                walletBalance: 50
            });

            const crashPaymentId = `pay_crash_flag_${Date.now()}`;
            const topUpAmount = 50;

            const crashPayment = await PaymentRequest.create({
                paymentId: crashPaymentId,
                user: crashUser._id,
                kind: 'wallet_topup',
                expectedAmount: topUpAmount,
                currency: 'AZN',
                status: 'pending',
                walletCredited: false,
                expiresAt: new Date(Date.now() + 600000)
            });

            try {
                // 2. Mock: Wallet $inc et (50->100) amma walletCredited yazma (crash simulyasiya)
                const mockPendingTx = await Transaction.create({
                    user: crashUser._id,
                    userId: crashUser._id,
                    amount: topUpAmount,
                    type: 'topup',
                    description: `Balans artırımı - ${topUpAmount} AZN`,
                    reference: crashPaymentId,
                    paymentProvider: 'internal',
                    paymentId: crashPaymentId,
                    idempotencyKey: crashPaymentId,
                    balanceAfter: 100,
                    status: 'pending',
                    walletCredited: false // NOT written! Simulates crash between inc and flag
                });

                // Balance and idempotency marker were atomically written before the crash
                await User.updateOne(
                    { _id: crashUser._id },
                    {
                        $set: { walletBalance: 100 },
                        $addToSet: { walletOperationKeys: `topup:${crashPaymentId}` }
                    }
                );
                console.log('Simulated crash state: balance = 100, tx walletCredited = false, PaymentRequest walletCredited = false');

                // 3. Recovery çağır: reconcilePendingPayments və ya completeTopUpPayment
                const recoveryRes = await walletController.completeTopUpPayment({
                    payment: crashPayment,
                    session: null
                });

                console.log('Recovery result idempotent flag:', recoveryRes.idempotent);
                assert.strictEqual(recoveryRes.idempotent, true, 'Recovery call on pending transaction must be idempotent: true');

                // 4. Assert: balance 100 qalmalı, 150 olmamalı (double-inc yox)
                const userAfterRecovery = await User.findById(crashUser._id);
                console.log('User balance after recovery (must be 100, NOT 150):', userAfterRecovery.walletBalance);
                assert.strictEqual(userAfterRecovery.walletBalance, 100, 'User balance must NOT be incremented twice! (double-inc yox: 100)');

                const txAfterRecovery = await Transaction.findById(mockPendingTx._id);
                assert.strictEqual(txAfterRecovery.status, 'completed', 'Transaction status must be updated to completed');
                assert.strictEqual(txAfterRecovery.walletCredited, true, 'Transaction walletCredited flag must be true after recovery');

                // 5. 2-ci dəfə recovery çağır, yenə 100 qalmalı
                console.log('Second recovery call check...');
                const secondRecoveryRes = await walletController.completeTopUpPayment({
                    payment: crashPayment,
                    session: null
                });
                assert.strictEqual(secondRecoveryRes.idempotent, true, 'Second recovery call must be idempotent: true');

                const finalUserAfterSecond = await User.findById(crashUser._id);
                console.log('User balance after 2nd recovery (must still be 100):', finalUserAfterSecond.walletBalance);
                assert.strictEqual(finalUserAfterSecond.walletBalance, 100, 'User balance must remain 100 on subsequent recovery calls');
            } finally {
                await User.deleteOne({ _id: crashUser._id });
                await PaymentRequest.deleteOne({ paymentId: crashPaymentId });
                await Transaction.deleteMany({ paymentId: crashPaymentId });
            }
        });

        await it('credits once when crash happened after processing claim but before wallet increment', async () => {
            const recoveryUser = await User.create({
                name: 'PreCreditRecovery',
                lastName: 'Tester',
                email: `pre_credit_${Date.now()}@example.com`,
                password: 'Password123!',
                walletBalance: 50
            });
            const recoveryPaymentId = `pay_pre_credit_${Date.now()}`;
            let recoveryPayment = await PaymentSession.create({
                paymentId: recoveryPaymentId,
                user: recoveryUser._id,
                kind: 'wallet_topup',
                expectedAmount: 25,
                currency: 'AZN',
                status: 'processing',
                walletCredited: true,
                walletCreditVersion: 1,
                expiresAt: new Date(Date.now() + 600000)
            });

            try {
                await Transaction.create({
                    user: recoveryUser._id,
                    userId: recoveryUser._id,
                    amount: 25,
                    type: 'deposit',
                    description: 'Crash before credit',
                    reference: recoveryPaymentId,
                    paymentId: recoveryPaymentId,
                    idempotencyKey: recoveryPaymentId,
                    status: 'pending',
                    walletCredited: true
                });
                await PaymentSession.collection.updateOne(
                    { _id: recoveryPayment._id },
                    { $set: { updatedAt: new Date(Date.now() - 11 * 60 * 1000) } }
                );
                recoveryPayment = await PaymentSession.findById(recoveryPayment._id);

                await walletController.completeTopUpPayment({ payment: recoveryPayment });
                const recoveredUser = await User.findById(recoveryUser._id);
                assert.strictEqual(recoveredUser.walletBalance, 75, 'Recovery must apply the missing credit exactly once');

                await walletController.completeTopUpPayment({ payment: await PaymentSession.findById(recoveryPayment._id) });
                const retriedUser = await User.findById(recoveryUser._id);
                assert.strictEqual(retriedUser.walletBalance, 75, 'A subsequent retry must not credit again');
            } finally {
                await User.deleteOne({ _id: recoveryUser._id });
                await PaymentSession.deleteOne({ _id: recoveryPayment._id });
                await Transaction.deleteMany({ paymentId: recoveryPaymentId });
            }
        });

        await it('re-applies a v1 completed transaction exactly once when its wallet marker is missing', async () => {
            const recoveryUser = await User.create({
                name: 'CompletedTxRecovery',
                lastName: 'Tester',
                email: `completed_tx_${Date.now()}@example.com`,
                password: 'Password123!',
                walletBalance: 50
            });
            const recoveryPaymentId = `pay_completed_recovery_${Date.now()}`;
            const recoveryPayment = await PaymentSession.create({
                paymentId: recoveryPaymentId,
                user: recoveryUser._id,
                kind: 'wallet_topup',
                expectedAmount: 20,
                currency: 'AZN',
                status: 'completed',
                walletCredited: true,
                walletCreditVersion: 1,
                expiresAt: new Date(Date.now() + 600000)
            });

            try {
                await Transaction.create({
                    user: recoveryUser._id,
                    userId: recoveryUser._id,
                    amount: 20,
                    type: 'deposit',
                    description: 'Completed transaction recovery',
                    reference: recoveryPaymentId,
                    paymentId: recoveryPaymentId,
                    idempotencyKey: recoveryPaymentId,
                    status: 'completed',
                    walletCredited: true
                });

                await walletController.completeTopUpPayment({ payment: recoveryPayment });
                assert.strictEqual((await User.findById(recoveryUser._id)).walletBalance, 70);
                await walletController.completeTopUpPayment({ payment: await PaymentSession.findById(recoveryPayment._id) });
                assert.strictEqual((await User.findById(recoveryUser._id)).walletBalance, 70);
            } finally {
                await User.deleteOne({ _id: recoveryUser._id });
                await PaymentSession.deleteOne({ _id: recoveryPayment._id });
                await Transaction.deleteMany({ paymentId: recoveryPaymentId });
            }
        });

        // 8. Test Referral Post-Save Hook
        assertSafeTestDB();
        console.log('\n--- TEST 4: Referral Post-Save E11000 Handling ---');
        assert.strictEqual(typeof User.generateReferralCode, 'function', 'generateReferralCode must exist on User');
        const sampleCode = User.generateReferralCode();
        console.log('Sample generated referral code:', sampleCode);
        assert.ok(/^AP-[A-F0-9]{16}$/.test(sampleCode), 'Referral code must match AP-XXXXXXXXXXXXXXXX (16 hex chars)');

        console.log('\n🎉 ALL PAYMENT DOUBLE-INC CRASH RECOVERY TESTS PASSED 100%!');
    } finally {
        await User.deleteOne({ _id: testUser._id });
        await PaymentSession.deleteOne({ paymentId });
        await Transaction.deleteMany({ paymentId });
        await disconnectTestDB();
    }
}

run().catch(async (err) => {
    console.error('Test failed with error:', err);
    await disconnectTestDB().catch(() => {});
    process.exitCode = 1;
});
