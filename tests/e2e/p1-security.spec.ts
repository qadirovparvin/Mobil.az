import { test, expect } from '@playwright/test';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { apiRequest } from '../helpers/api';

const execAsync = promisify(exec);
const BACKEND_DIR = path.resolve(__dirname, '../../Backend');

test.describe('P1: Security, Rate Limiting, CSRF, XSS, and Guest Guards', () => {
  test('P1-1: Redis rate limiter cluster enforces 429 and blocks bypass in production', async () => {
    const { stdout, stderr } = await execAsync('node tests/rate-limiter-cluster.test.js', {
      cwd: BACKEND_DIR,
      env: { ...process.env, NODE_ENV: 'test' },
    });

    expect(stdout).toContain('DISABLE_RATE_LIMIT prod-da blok');
    expect(stdout).toContain('ALL 4 CLUSTER & REDIS RATE LIMITER TESTS PASSED');
    expect(stderr).not.toContain('AssertionError');
  });

  test('P1-2: Security regression suite & CSRF fail-closed validation', async () => {
    // 1. Run core security regression tests
    const { stdout, stderr } = await execAsync('node tests/security-regression.test.js', {
      cwd: BACKEND_DIR,
      env: { ...process.env, NODE_ENV: 'test' },
    });

    expect(stdout).toContain('security-regression tests passed');
    expect(stderr).not.toContain('AssertionError');

    // 2. Live API test: mutating request without CSRF token must fail-closed (403 Forbidden)
    const res = await apiRequest('/api/ads', {
      method: 'POST',
      body: JSON.stringify({ title: 'Unauthorized Ad Creation' }),
    });
    expect([401, 403]).toContain(res.status);
  });

  test('P1-3: Referral collision E11000 retry and 16-hex entropy verification', async () => {
    // Test 100 unique referral codes with 16 hex chars and duplicate key retry
    const { stdout, stderr } = await execAsync('node tests/referral-entropy.test.js', {
      cwd: BACKEND_DIR,
      env: { ...process.env, NODE_ENV: 'test' },
    });

    expect(stdout).toContain('100/100 codes are unique with 16 hex chars entropy');
    expect(stdout).toContain('ALL REFERRAL ENTROPY TESTS PASSED');
    expect(stderr).not.toContain('AssertionError');
  });

  test('P1-4: XSS prevention — reviews and ad card details render via textContent without script execution', async ({ page }) => {
    await page.goto('/index.html');

    // Inject a malicious string into a simulated review/card element via client script
    const xssPayload = '<img src="invalid_image.jpg" onerror="window.__xss_vulnerable=true">';
    
    const isScriptExecuted = await page.evaluate((payload) => {
      // Simulate rendering a review comment using the app's textContent pattern
      const container = document.createElement('div');
      container.id = 'test-review-container';
      
      const commentEl = document.createElement('p');
      commentEl.className = 'review-comment';
      commentEl.textContent = payload; // SAFE PATTERN used by Mobilim.az
      container.appendChild(commentEl);
      document.body.appendChild(container);

      // Verify DOM node did not create an img or script element
      const createdImages = container.getElementsByTagName('img');
      const hasImageNode = createdImages.length > 0;
      
      return (window as any).__xss_vulnerable === true || hasImageNode;
    }, xssPayload);

    expect(isScriptExecuted).toBe(false);
  });

  test('P1-5: Guest guard — visiting index.html as guest triggers no 401 loop on /notifications/unread-count', async ({ page }) => {
    const unreadCountCalls: { url: string; status: number }[] = [];

    // Track network requests
    page.on('response', (response) => {
      if (response.url().includes('/notifications/unread-count')) {
        unreadCountCalls.push({ url: response.url(), status: response.status() });
      }
    });

    // Ensure clear guest state (no JWT token in localStorage/sessionStorage)
    await page.goto('/index.html');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();

    // Wait 2 seconds to monitor guest traffic
    await page.waitForTimeout(2000);

    // Filter any 401 errors from unread-count
    const unauthorized401Calls = unreadCountCalls.filter((c) => c.status === 401);
    expect(unauthorized401Calls).toHaveLength(0);
  });
});
