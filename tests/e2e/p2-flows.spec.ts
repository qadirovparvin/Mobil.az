import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { checkBackendHealth, checkBackendDetailedHealth, apiRequest } from '../helpers/api';
import { fetchPhoneAds } from '../helpers/ad';

const FRONTEND_DIR = path.resolve(__dirname, '../../Front end');

test.describe('P2: Brand Consistency, UI Flows, and Smoke Qualification', () => {
  test('P2-1: Brand consistency — no legacy "mobil.az" in Front end/*.html, "mobilim.az" present', async () => {
    const htmlFiles = fs.readdirSync(FRONTEND_DIR).filter((f) => f.endsWith('.html'));
    expect(htmlFiles.length).toBeGreaterThan(15);

    const violations: { file: string; line: number; match: string }[] = [];
    let verifiedCount = 0;

    for (const file of htmlFiles) {
      const content = fs.readFileSync(path.join(FRONTEND_DIR, file), 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Exclude external third-party URLs like fontawesome, cdnjs, or mobilim.az itself
        const cleanedLine = line.replace(/mobilim\.az/gi, '');
        // Search for standalone legacy mobil.az
        if (/\bmobil\.az\b/i.test(cleanedLine)) {
          violations.push({ file, line: index + 1, match: line.trim() });
        }
      });

      if (/mobilim\.az/i.test(content)) {
        verifiedCount++;
      }
    }

    expect(violations).toEqual([]);
    expect(verifiedCount).toBe(htmlFiles.length);
  });

  test('P2-2: Phone catalogue browsing, brand filter, and favorites toggle', async ({ page }) => {
    // 1. Navigate to phone catalog
    await page.goto('/phone.html?category=phone');
    await expect(page).toHaveTitle(/Mobilim\.az/i);

    // 2. Ads container should render ads from API
    const adsContainer = page.locator('#phone-ads-container, .all-ads-container');
    await expect(adsContainer).toBeVisible();

    // Wait for at least one ad card to appear
    const adCards = page.locator('.ad-card');
    await expect(adCards.first()).toBeVisible({ timeout: 10000 });

    // 3. Test favorite toggle interaction
    const favoriteBtn = page.locator('.favorite-btn').first();
    await expect(favoriteBtn).toBeVisible();

    // Click favorite button to toggle
    await favoriteBtn.click();

    // Verify localStorage favorites updated or heart icon activated
    const favorites = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('mobilaz_favorites') || localStorage.getItem('favorites') || '[]');
    });
    const hasFavoritedClass = await favoriteBtn.evaluate((el) => {
      return el.classList.contains('favorited') || el.querySelector('i')?.classList.contains('fas') || false;
    });
    expect(Array.isArray(favorites)).toBe(true);
    expect(favorites.length > 0 || hasFavoritedClass).toBe(true);

    // 4. Test Brand filter dropdown selection
    const brandSelect = page.locator('#brandSelect');
    if (await brandSelect.isVisible()) {
      await brandSelect.selectOption('Apple');
      const applyBtn = page.locator('.btn-apply');
      if (await applyBtn.isVisible()) {
        await applyBtn.click();
      }
      // Container remains intact after filter
      await expect(adsContainer).toBeVisible();
    }
  });

  test('P2-3: Core smoke verification — health, detailed health, phone ads count, and static assets', async () => {
    // 1. GET /api/health
    const health = await checkBackendHealth();
    expect(health.status).toBe('ok');
    expect(health.uptime).toBeGreaterThan(0);

    // 2. GET /api/health-detailed
    const detailed = await checkBackendDetailedHealth();
    expect(detailed).toHaveProperty('redis');
    expect(detailed).toHaveProperty('rateLimiterStore');
    expect(detailed).toHaveProperty('workers');
    expect(detailed.workers).toBeGreaterThan(0);

    // 3. GET /api/ads?category=phone
    const adsRes = await fetchPhoneAds();
    expect(adsRes.status).toBe(200);
    const adsList = Array.isArray(adsRes.data)
      ? adsRes.data
      : adsRes.data?.ads || [];
    expect(adsList.length).toBeGreaterThanOrEqual(19);

    // 4. Static media asset check
    const photoRes = await apiRequest('/Photo/phone1.jpg');
    // Photo endpoint either served via backend or static front end: status 200 or 304
    expect([200, 304]).toContain(photoRes.status);
  });
});
