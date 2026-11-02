/**
 * tests/helpers/wallet.ts
 * Wallet & Payment helpers for testing Payriff callbacks, topups, and idempotency
 */

import { apiRequest } from './api';

export interface TopUpSessionResponse {
  paymentId: string;
  checkoutUrl?: string;
  expectedAmount: number;
  status: string;
}

/**
 * Request a wallet top-up session
 */
export async function createTopUpSession(
  amount: number,
  token: string,
  csrfToken: string,
  cookies = ''
): Promise<{ ok: boolean; data: any; status: number }> {
  return apiRequest('/api/wallet/topup', {
    method: 'POST',
    token,
    csrfToken,
    headers: {
      'Cookie': cookies,
      'Origin': 'http://localhost:5500',
    },
    body: JSON.stringify({ amount }),
  });
}

/**
 * Dispatch a Payriff webhook callback to the backend
 */
export async function sendPayriffCallback(
  paymentId: string,
  payload: {
    status?: 'APPROVED' | 'FAILED' | 'DECLINED' | 'CANCELED';
    amount?: number;
    orderId?: string;
    payload?: any;
  },
  signature = 'mock-sandbox-signature'
) {
  const body = {
    paymentId,
    orderId: payload.orderId || paymentId,
    status: payload.status || 'APPROVED',
    amount: payload.amount || 20,
    ...payload,
  };

  return apiRequest(`/api/wallet/payments/${paymentId}/callback`, {
    method: 'POST',
    headers: {
      'x-payment-signature': signature,
      'x-webhook-signature': signature,
      'x-payriff-signature': signature,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

/**
 * Request a cash-out
 */
export async function requestCashOut(
  amount: number,
  pan: string,
  token: string,
  csrfToken: string,
  cookies = ''
) {
  return apiRequest('/api/wallet/cash-out', {
    method: 'POST',
    token,
    csrfToken,
    headers: {
      'Cookie': cookies,
      'Origin': 'http://localhost:5500',
    },
    body: JSON.stringify({
      amount,
      pan,
    }),
  });
}
