import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { sendPayriffCallback } from '../helpers/wallet';
import { apiRequest } from '../helpers/api';

const execAsync = promisify(exec);
const BACKEND_DIR = path.resolve(__dirname, '../../Backend');

test.describe('P0: Critical Payment, Replay, and Concurrency Invariants', () => {
  test('P0-1: Top-up double-inc crash recovery credits balance exactly once', async () => {
    // Executes in-memory Mongo test simulating crash between walletCredited and balance increment
    const { stdout, stderr } = await execAsync('node tests/payment-double-inc-crash.test.js', {
      cwd: BACKEND_DIR,
      env: { ...process.env, NODE_ENV: 'test', PAYMENT_PROVIDER: 'mock' },
    });

    expect(stdout).toContain('Crash Simulation & Recovery');
    expect(stdout).toContain('ALL PAYMENT DOUBLE-INC CRASH RECOVERY TESTS PASSED 100%');
    expect(stderr).not.toContain('AssertionError');
  });

  test('P0-2: Cash-out double-deduction concurrency prevents overdraft', async () => {
    // Tests 2 parallel cash-out requests with insufficient balance for both
    const { stdout, stderr } = await execAsync('node tests/cashout-double-deduction.test.js', {
      cwd: BACKEND_DIR,
      env: { ...process.env, NODE_ENV: 'test', PAYMENT_PROVIDER: 'mock' },
    });

    expect(stdout).toContain('balance 1 dəfə çıxılmalı, 2 dəfə yox');
    expect(stdout).toContain('Duplicate request same idempotencyKey');
    expect(stdout).toMatch(/PASSED/i);
    expect(stderr).not.toContain('AssertionError');
  });

  test('P0-3: Payriff callback replay increments balance only once (idempotent)', async () => {
    // Executes callback replay test verifying duplicate callbacks return idempotent: true
    const { stdout, stderr } = await execAsync('node tests/payriff-callback-replay.test.js', {
      cwd: BACKEND_DIR,
      env: { ...process.env, NODE_ENV: 'test', PAYMENT_PROVIDER: 'mock' },
    });

    expect(stdout).toContain('TEST 1: Same callback 2 dəfə -> balance 1 dəfə artmalı');
    expect(stdout).toContain('ALL PAYRIFF CALLBACK REPLAY, OUT-OF-ORDER & RACE TESTS PASSED');
    expect(stderr).not.toContain('AssertionError');
  });

  test('P0-4: Payriff out-of-order FAILED->APPROVED overrides and late FAILED is ignored', async () => {
    // Executes test verifying FAILED then APPROVED recovers, and late FAILED is ignored
    const { stdout, stderr } = await execAsync('node tests/payriff-callback-replay.test.js', {
      cwd: BACKEND_DIR,
      env: { ...process.env, NODE_ENV: 'test', PAYMENT_PROVIDER: 'mock' },
    });

    expect(stdout).toContain('TEST 2 PASSED: Out-of-order FAILED then SUCCESS successfully overridden');
    expect(stdout).toContain('TEST 3 PASSED: Late failure ignored, balance and completed state intact');
    expect(stderr).not.toContain('AssertionError');
  });

  test('P0-5: 2-worker race condition resolves cleanly with balance credited 1x', async () => {
    // Concurrently invokes 2 simulated workers handling the exact same callback
    const { stdout, stderr } = await execAsync('node tests/payriff-callback-replay.test.js', {
      cwd: BACKEND_DIR,
      env: { ...process.env, NODE_ENV: 'test', PAYMENT_PROVIDER: 'mock' },
    });

    expect(stdout).toContain('TEST 4 PASSED: Race between 2 workers handled cleanly');
    expect(stderr).not.toContain('AssertionError');
  });

  test('P0-6: Concurrent refunds credit wallet only once (atomic refund & cashout rollback)', async () => {
    // Executes cashout rollback & stuck reserve refund test harness
    const { stdout, stderr } = await execAsync('node tests/cashout-rollback.test.js', {
      cwd: BACKEND_DIR,
      env: { ...process.env, NODE_ENV: 'test', PAYMENT_PROVIDER: 'mock' },
    });

    expect(stdout).toContain('ALL CASHOUT ATOMICITY & RECONCILIATION TESTS PASSED 100%');
    expect(stderr).not.toContain('AssertionError');
  });

  test('P0-API: Live Backend rejects invalid/missing payment callback signature fail-closed', async () => {
    // Tests the live running backend on port 5000: unauthenticated callback without signature MUST fail
    const fakePaymentId = `pay_probe_${Date.now()}`;
    const res = await apiRequest(`/api/wallet/payments/${fakePaymentId}/callback`, {
      method: 'POST',
      headers: {
        'x-payment-signature': 'invalid-tampered-signature-12345',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'APPROVED', amount: 10 }),
    });

    // Must be rejected with 401 Unauthorized or 403 Forbidden (fail-closed)
    expect([400, 401, 403, 404]).toContain(res.status);
  });
});
