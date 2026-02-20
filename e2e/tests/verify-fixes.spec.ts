/**
 * Verify: user data persistence after reload, bottom nav, change PIN button
 */
import { test } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || 'https://ration-smart-pwa.up.railway.app';

test('verify data persistence and dark mode fixes', async ({ page }) => {
  // Login
  await page.goto(`${BASE}/auth/login`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Click Email toggle if visible
  const emailToggle = page.getByRole('button', { name: /email/i }).first();
  if (await emailToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
    await emailToggle.click();
    await page.waitForTimeout(500);
  }

  // Fill email
  const emailInput = page.locator('input').first();
  await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  await emailInput.fill('mandewalkergautam@gmail.com');

  // Fill PIN
  const inputs = page.locator('input');
  if (await inputs.count() >= 2) {
    await inputs.nth(1).fill('1981');
  }

  // Login
  const loginBtn = page.locator('button[type="submit"], .q-btn').filter({ hasText: /log/i }).first();
  await loginBtn.click();
  await page.waitForTimeout(5000);
  await page.waitForLoadState('networkidle');

  if (page.url().includes('/auth')) {
    console.log('[LOGIN] Failed — still on auth page');
    await page.screenshot({ path: 'screenshots-verify/00-login-failed.png', fullPage: true });
    return;
  }

  // 1. Dashboard after fresh login
  await page.screenshot({ path: 'screenshots-verify/01-dashboard-fresh.png', fullPage: true });
  const h5 = await page.locator('.text-h5').first().textContent().catch(() => 'NOT_FOUND');
  console.log(`[DASHBOARD FRESH] Title: "${h5}"`);

  // 2. Navigate to Settings (full page load — simulates app update)
  await page.goto(`${BASE}/settings`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots-verify/02-settings.png', fullPage: true });

  // Check bottom nav
  const footer = page.locator('.q-footer');
  const footerVis = await footer.isVisible({ timeout: 2000 }).catch(() => false);
  console.log(`[SETTINGS] Footer visible: ${footerVis}`);

  // 3. Navigate to Profile (full page load)
  await page.goto(`${BASE}/settings/profile`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots-verify/03-profile-light.png', fullPage: true });

  // Check profile fields
  const profileInputs = page.locator('.q-field input');
  const count = await profileInputs.count();
  for (let i = 0; i < Math.min(count, 5); i++) {
    const val = await profileInputs.nth(i).inputValue();
    console.log(`[PROFILE LIGHT] Field ${i}: "${val}"`);
  }

  // Check Change PIN button
  const pinBtn = page.locator('button').filter({ hasText: /pin/i }).first();
  if (await pinBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    const pinColor = await pinBtn.evaluate((el: Element) => getComputedStyle(el).color);
    console.log(`[CHANGE PIN LIGHT] color: ${pinColor}`);
    await pinBtn.screenshot({ path: 'screenshots-verify/04-change-pin-light.png' });
  }

  // Bottom nav on profile
  const profileFooter = await footer.isVisible({ timeout: 2000 }).catch(() => false);
  console.log(`[PROFILE] Footer visible: ${profileFooter}`);
  if (profileFooter) {
    await footer.screenshot({ path: 'screenshots-verify/05-footer-profile-light.png' });
  }

  // 4. Enable dark mode via settings page
  await page.goto(`${BASE}/settings`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Find and click dark mode toggle
  const darkModeItem = page.locator('.q-item').filter({ hasText: /Dark Mode/i });
  const darkToggle = darkModeItem.locator('.q-toggle');
  if (await darkToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
    await darkToggle.click();
    await page.waitForTimeout(1000);
  }

  const isDark = await page.evaluate(() => document.body.classList.contains('body--dark'));
  console.log(`[DARK MODE] Active: ${isDark}`);

  await page.screenshot({ path: 'screenshots-verify/06-settings-dark.png', fullPage: true });

  // Dark bottom nav
  if (await footer.isVisible({ timeout: 2000 }).catch(() => false)) {
    await footer.screenshot({ path: 'screenshots-verify/07-footer-settings-dark.png' });
  }

  // 5. Profile in dark mode
  await page.goto(`${BASE}/settings/profile`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshots-verify/08-profile-dark.png', fullPage: true });

  // Check dark mode profile fields
  const darkInputs = page.locator('.q-field input');
  const darkCount = await darkInputs.count();
  for (let i = 0; i < Math.min(darkCount, 5); i++) {
    const val = await darkInputs.nth(i).inputValue();
    console.log(`[PROFILE DARK] Field ${i}: "${val}"`);
  }

  // Change PIN in dark mode
  const pinBtnDark = page.locator('button').filter({ hasText: /pin/i }).first();
  if (await pinBtnDark.isVisible({ timeout: 2000 }).catch(() => false)) {
    const pinColorDark = await pinBtnDark.evaluate((el: Element) => getComputedStyle(el).color);
    console.log(`[CHANGE PIN DARK] color: ${pinColorDark}`);
    await pinBtnDark.screenshot({ path: 'screenshots-verify/09-change-pin-dark.png' });
  }

  // Dark bottom nav on profile
  if (await footer.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('[DARK PROFILE] Footer visible');
    await footer.screenshot({ path: 'screenshots-verify/10-footer-profile-dark.png' });
  }

  // 6. Turn off dark mode
  await page.goto(`${BASE}/settings`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  const darkItem2 = page.locator('.q-item').filter({ hasText: /Dark Mode/i });
  const darkTog2 = darkItem2.locator('.q-toggle');
  const dark2 = await page.evaluate(() => document.body.classList.contains('body--dark'));
  if (dark2 && await darkTog2.isVisible({ timeout: 2000 }).catch(() => false)) {
    await darkTog2.click();
    await page.waitForTimeout(500);
  }
});
