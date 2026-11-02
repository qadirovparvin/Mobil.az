import { test, expect } from '@playwright/test';

test.describe('Mobilim.az Seed & Health Qualification', () => {
  test('seed: app loads, main page visible, no fatal console errors, and navigation works', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore known harmless 3rd party font/analytics errors if any
        if (!text.includes('favicon') && !text.includes('chrome-extension')) {
          consoleErrors.push(text);
        }
      }
    });

    // 1. App loads
    const response = await page.goto('/index.html');
    expect(response?.status()).toBe(200);

    // 2. Main page visible
    await expect(page).toHaveTitle(/Mobilim\.az/i);
    const logo = page.locator('.logo, .mobil-logo');
    await expect(logo.first()).toBeVisible();

    // 3. Header navigation elements exist
    const catalogBtn = page.locator('#catalogBtn, .catalog-button, .btn-katalog');
    await expect(catalogBtn.first()).toBeVisible();

    // 4. Navigation works: Click About / Haqqımızda link
    const aboutLink = page.locator('a[href*="about.html"]').first();
    await expect(aboutLink).toBeVisible();
    await aboutLink.click();

    // Verify reached about.html
    await expect(page).toHaveURL(/about\.html/);
    await expect(page.locator('body')).toBeVisible();

    // Navigate back to home
    const homeLogo = page.locator('.logo, .mobil-logo').first();
    await homeLogo.click();
    await expect(page).toHaveURL(/index\.html/);

    // 5. No fatal unhandled script exceptions
    const fatalErrors = consoleErrors.filter(
      (err) => err.includes('SyntaxError') || err.includes('ReferenceError') || err.includes('TypeError')
    );
    expect(fatalErrors).toEqual([]);
  });
});
