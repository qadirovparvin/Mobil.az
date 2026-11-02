/**
 * Backend/jobs/paymentReconciliation.js
 * 
 * Periodically reconciles pending payments and stuck transactions:
 * - Checks PaymentSessions where status='pending' and createdAt < now - 5 minutes
 * - Queries Payriff status via payriffProvider.getOrderStatus / getStatus
 * - If approved/paid -> completes payment via walletController.completeTopUpPayment
 * - If failed/rejected/cancelled -> marks session failed
 * - If status check errors or status is unknown/pending -> keeps pending and retries
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

        try {
            const stuckThreshold = new Date(Date.now() - 10 * 60 * 1000); // 10 dəq
            const query = PaymentSession.find({
                status: { $in: ['pending', 'processing'] },
                $or: [
                    { status: 'pending' },
                    { status: 'processing', updatedAt: { $lt: stuckThreshold } }
                ]
            });
            const sessions = typeof query?.limit === 'function' ? await query.limit(50) : await query;

            for (const session of sessions) {
                const paymentId = session.paymentId;
                if (!paymentId || inFlightPayments.has(paymentId)) {
                    continue;
                }

                inFlightPayments.add(paymentId);
                try {
                    const orderId = session.providerOrderId || session.paymentId;
                    const getStatusFn = payriffProvider.getStatus || payriffProvider.getOrderStatus;

                    let providerStatus = null;
                    if (session.provider === 'payriff' && orderId) {
                        try {
                            providerStatus = await getStatusFn(orderId);
                        } catch (e) {
                            console.warn(`[Reconciliation] Status check failed for ${paymentId}:`, e.message);
                            continue; // retry
                        }
                    } else {
                        console.warn(`[Reconciliation] Skipping payment ${paymentId}: provider=${session.provider}, orderId=${orderId}`);
                        continue;
                    }

                    const normalizedStatus = String(providerStatus?.status || '').toUpperCase();

                    if (normalizedStatus === 'APPROVED' || normalizedStatus === 'PAID') {
                        const payment = session;
                        await withJobLock(`payment:${session.paymentId}`, 60000, async () => {
                            try {
                                await walletController.completeTopUpPayment({
                                    payment,
                                    session: null,
                                    mongoSession: null,
                                    providerStatus
                                });
                                count++;
                            } catch (completeErr) {
                                console.error(`[Reconciliation] completeTopUpPayment error for ${paymentId}:`, completeErr.message);
                            }
                        });
                    } else if (['REJECTED', 'FAILED', 'DECLINED', 'CANCELED', 'CANCELLED'].includes(normalizedStatus)) {
                        session.status = 'failed';
                        session.failureReason = `Provider status: ${providerStatus?.status || normalizedStatus}`;
                        await session.save();
                        count++;
                    } else {
                        // Unknown status or still pending -> log + continue, do not mark as failed
                        console.log(`[Reconciliation] Payment ${paymentId} status is ${providerStatus?.status || 'UNKNOWN'}, keeping pending for retry`);
                        continue;
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
