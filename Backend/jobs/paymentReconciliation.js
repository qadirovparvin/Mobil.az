/**
 * Backend/jobs/paymentReconciliation.js
 * 
 * Periodically reconciles pending payments and stuck transactions:
 * - Checks PaymentSessions where status='pending' and createdAt < now - 5 minutes
 * - Queries Payriff status via payriffProvider.getOrderStatus / getStatus
 * - If approved/paid -> completes payment via walletController.completeTopUpPayment
 * - If failed/rejected/cancelled -> marks session failed
 * - If pending > 30 minutes -> fails with timeout
 * - Reconciles stuck cash-out reserves if applicable
 * - In-memory Set prevents duplicate concurrent checks for the same paymentId
 * - MongoDB withJobLock prevents multiple instances from running concurrently
 */

'use strict';

const PaymentSession = require('../models/PaymentSession');
const payriffProvider = require('../services/payriffProvider');
const walletController = require('../controllers/walletController');
const { withJobLock } = require('../utils/jobLock');

// In-flight Set ensures idempotency across concurrent intervals
const inFlightPayments = new Set();

const reconcilePendingPayments = async () => {
    return withJobLock('payment-reconciliation', 60000, async () => {
        let count = 0;
        const now = Date.now();
        const fiveMinAgo = new Date(now - 5 * 60 * 1000);
        const thirtyMinAgo = new Date(now - 30 * 60 * 1000);

        try {
            const pendingSessions = await PaymentSession.find({
                status: 'pending',
                createdAt: { $lt: fiveMinAgo }
            });

            for (const session of pendingSessions) {
                const paymentId = session.paymentId;
                if (!paymentId || inFlightPayments.has(paymentId)) {
                    continue;
                }

                inFlightPayments.add(paymentId);
                try {
                    const orderId = session.providerOrderId || session.paymentId;
                    const getStatusFn = payriffProvider.getStatus || payriffProvider.getOrderStatus;

                    // If pending for more than 30 minutes
                    if (session.createdAt < thirtyMinAgo) {
                        let providerStatus = null;
                        if (session.provider === 'payriff' && orderId) {
                            try {
                                providerStatus = await getStatusFn(orderId);
                            } catch (e) {
                                console.warn(`[Reconciliation] Status check failed for ${paymentId}:`, e.message);
                            }
                        }

                        if (providerStatus?.status === 'APPROVED' || providerStatus?.status === 'PAID') {
                            await walletController.completeTopUpPayment({ payment: session, providerStatus });
                            count++;
                        } else {
                            // 30 min exceeded and not approved -> mark as failed
                            session.status = 'failed';
                            session.failureReason = 'Reconciliation timeout: pending > 30 minutes';
                            await session.save();
                            count++;
                        }
                        continue;
                    }

                    // For pending between 5 min and 30 min:
                    if (session.provider === 'payriff' && orderId) {
                        let providerStatus = null;
                        try {
                            providerStatus = await getStatusFn(orderId);
                        } catch (e) {
                            console.warn(`[Reconciliation] Status check failed for ${paymentId}:`, e.message);
                        }

                        if (providerStatus?.status === 'APPROVED' || providerStatus?.status === 'PAID') {
                            await walletController.completeTopUpPayment({ payment: session, providerStatus });
                            count++;
                        } else if (['REJECTED', 'FAILED', 'DECLINED', 'CANCELED', 'CANCELLED'].includes(providerStatus?.status)) {
                            session.status = 'failed';
                            session.failureReason = `Provider status: ${providerStatus.status}`;
                            await session.save();
                            count++;
                        }
                        // If still pending at provider -> leave untouched
                    }
                } catch (itemErr) {
                    console.error(`[Reconciliation] Error processing payment ${paymentId}:`, itemErr.message);
                } finally {
                    inFlightPayments.delete(paymentId);
                }
            }

            // Reconcile stuck cashout reserves if walletController supports it
            if (typeof walletController.reconcileStuckReserves === 'function') {
                try {
                    const cashOutResult = await walletController.reconcileStuckReserves();
                    if (cashOutResult?.reconciledCount) {
                        count += cashOutResult.reconciledCount;
                    }
                } catch (coErr) {
                    console.error('[Reconciliation] Error reconciling stuck cashout reserves:', coErr.message);
                }
            }
        } catch (err) {
            console.error('[Reconciliation] Payment reconciliation job error:', err.message);
        }

        console.log(`Reconciled ${count} pending payments`);
        return { count };
    });
};

module.exports = {
    reconcilePendingPayments,
    inFlightPayments
};
