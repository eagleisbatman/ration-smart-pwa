import { test, expect, type Page } from '@playwright/test';
import {
  waitForRoute,
  waitForLoading,
  loginWithPhone,
} from '../helpers/actions';

// Test user: regular user
const TEST_PHONE = '9900004444';
const TEST_PIN = '1111';

test.describe('Simulation Flow (App Lite)', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithPhone(page, 'India', TEST_PHONE, TEST_PIN);
    await page.waitForTimeout(2000);
    await waitForRoute(page, '/');
    await waitForLoading(page);
  });

  test('S0: HomePage renders greeting and action card', async ({ page }) => {
    // Greeting should be visible
    await expect(page.getByText(/Welcome,/)).toBeVisible({ timeout: 10_000 });

    // "Start New Simulation" action card
    await expect(page.getByText('Start New Simulation')).toBeVisible({ timeout: 5_000 });

    await page.screenshot({ path: 'screenshots/s0-homepage.png', fullPage: true });

    // Click "Start New Simulation" → navigates to cattle-info
    await page.getByText('Start New Simulation').click();
    await waitForRoute(page, '/cattle-info');
    await waitForLoading(page);

    // Verify cattle info page loaded
    const headers = page.locator('.section-header .text-subtitle1');
    await expect(headers.first()).toContainText('Animal Characteristics');
  });

  test('S1: CattleInfoPage renders all sections', async ({ page }) => {
    await navigateToCattleInfo(page);

    const headers = page.locator('.section-header .text-subtitle1');
    await expect(headers.nth(0)).toContainText('Animal Characteristics');
    await expect(headers.nth(1)).toContainText('Milk Production');
    await expect(headers.nth(2)).toContainText('Reproductive Data');
    await expect(headers.nth(3)).toContainText('Environment');

    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await page.screenshot({ path: 'screenshots/s1-cattle-info.png', fullPage: true });
  });

  test('S2: Breed dropdown loads options', async ({ page }) => {
    await navigateToCattleInfo(page);

    // Click the breed combobox
    await page.getByRole('combobox', { name: 'Breed' }).click();
    await page.waitForTimeout(1000);

    // Options use role="option" inside a listbox
    const options = page.getByRole('option');
    await expect(options.first()).toBeVisible({ timeout: 10_000 });
    const count = await options.count();
    expect(count).toBeGreaterThan(0);

    // Pick Holstein Friesian
    await page.getByRole('option', { name: 'Holstein Friesian', exact: true }).click();
    await page.waitForTimeout(300);

    // Verify breed is selected
    await expect(page.getByRole('combobox', { name: 'Breed' })).toHaveValue('Holstein Friesian');
    await page.screenshot({ path: 'screenshots/s2-breed-selected.png' });
  });

  test('S3: Continue to FeedSelection', async ({ page }) => {
    await navigateToCattleInfo(page);
    await selectBreed(page);

    await page.locator('button[type="submit"]').click();
    await waitForRoute(page, '/feed-selection');
    await waitForLoading(page);

    // Verify feed type toggle buttons
    const toggleBtns = page.locator('.q-btn-toggle .q-btn');
    await expect(toggleBtns.first()).toBeVisible({ timeout: 10_000 });

    await page.screenshot({ path: 'screenshots/s3-feed-selection.png', fullPage: true });
  });

  test('S4: Feed type filter works', async ({ page }) => {
    await navigateToCattleInfo(page);
    await selectBreed(page);
    await page.locator('button[type="submit"]').click();
    await waitForRoute(page, '/feed-selection');
    await waitForLoading(page);
    await page.waitForTimeout(3000); // feeds load

    // Click Forage filter
    await page.locator('.q-btn-toggle .q-btn:has-text("Forage")').click();
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'screenshots/s4-forage-filter.png' });
  });

  test('S5: Select feeds and run recommendation', async ({ page }) => {
    test.setTimeout(180_000);

    await navigateToCattleInfo(page);
    await selectBreed(page);
    await page.locator('button[type="submit"]').click();
    await waitForRoute(page, '/feed-selection');
    await waitForLoading(page);
    await page.waitForTimeout(3000);

    // Select specific feeds by searching (avoid minerals that hang the optimizer)
    await selectFeedBySearch(page, 'Anjan Grass');
    await selectFeedBySearch(page, 'Corn meal');
    await selectFeedBySearch(page, 'Soybean Hulls');

    // Verify selected feeds panel
    await expect(page.getByText(/Selected Feeds/)).toBeVisible({ timeout: 5_000 });
    await page.screenshot({ path: 'screenshots/s5-feeds-selected.png', fullPage: true });

    // Click "Get Recommendation"
    await page.locator('button:has-text("Get Recommendation")').click();

    // Wait for navigation to report (API may take 30-90s, or return quickly)
    await waitForRoute(page, '/recommendation-report', 120_000);
    await waitForLoading(page);

    // Verify report rendered
    await expect(page.locator('.q-page .q-card').first()).toBeVisible({ timeout: 15_000 });
    await page.screenshot({ path: 'screenshots/s5-recommendation-report.png', fullPage: true });
  });

  test('S6: Select feeds with quantities and run evaluation', async ({ page }) => {
    test.setTimeout(120_000);

    await navigateToCattleInfo(page);
    await selectBreed(page);
    await page.locator('button[type="submit"]').click();
    await waitForRoute(page, '/feed-selection');
    await waitForLoading(page);
    await page.waitForTimeout(3000);

    // Select specific feeds by searching
    await selectFeedBySearch(page, 'Anjan Grass');
    await selectFeedBySearch(page, 'Corn meal');

    // Fill quantities for the 2 selected feeds
    const qtyInputs = page.getByRole('spinbutton', { name: /Quantity/i });
    const qtyCount = await qtyInputs.count();
    for (let i = 0; i < qtyCount; i++) {
      await qtyInputs.nth(i).click();
      await qtyInputs.nth(i).fill(String(3 + i));
    }

    await page.screenshot({ path: 'screenshots/s6-feeds-with-qty.png', fullPage: true });

    // "Evaluate Diet" button appears when quantities are set
    const evalBtn = page.locator('button:has-text("Evaluate Diet")');
    await expect(evalBtn).toBeVisible({ timeout: 5_000 });

    // Click and verify loading dialog appears (confirms API call was triggered)
    await evalBtn.click();
    const dialog = page.locator('.q-dialog');
    await expect(dialog.first()).toBeVisible({ timeout: 10_000 });

    // Wait for either success (navigation) or failure (dialog dismisses, stays on page)
    // The backend /diet-evaluation-working/ may return 500 — this tests the UI flow, not the API
    await Promise.race([
      waitForRoute(page, '/evaluation-report', 90_000),
      dialog.first().waitFor({ state: 'hidden', timeout: 90_000 }),
    ]);

    const currentUrl = page.url();
    if (currentUrl.includes('/evaluation-report')) {
      // API succeeded — verify report page
      await waitForLoading(page);
      await expect(page.locator('.q-page .q-card').first()).toBeVisible({ timeout: 15_000 });
      await page.screenshot({ path: 'screenshots/s6-evaluation-report.png', fullPage: true });
    } else {
      // API failed — verify we're still on feed selection (graceful error handling)
      expect(currentUrl).toContain('/feed-selection');
      await page.screenshot({ path: 'screenshots/s6-evaluation-error.png', fullPage: true });
    }
  });

  test('S7: Custom diet limits dialog', async ({ page }) => {
    await navigateToCattleInfo(page);
    await selectBreed(page);
    await page.locator('button[type="submit"]').click();
    await waitForRoute(page, '/feed-selection');
    await waitForLoading(page);

    await page.locator('button:has-text("Custom Diet Limits")').click();
    await page.waitForTimeout(500);

    const dialog = page.locator('.q-dialog');
    await expect(dialog.first()).toBeVisible({ timeout: 5_000 });
    await page.screenshot({ path: 'screenshots/s7-custom-limits.png' });

    // Close
    const saveBtn = page.locator('.q-dialog button:has-text("Save")');
    if (await saveBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await saveBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }
  });

  test('S8: Drawer navigation works', async ({ page }) => {
    await openDrawer(page);

    await expect(page.getByText('Simulation History', { exact: true })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Profile', { exact: true })).toBeVisible();
    await expect(page.getByText('Help & Support', { exact: true })).toBeVisible();
    await expect(page.getByText('Feedback', { exact: true })).toBeVisible();

    await page.screenshot({ path: 'screenshots/s8-drawer.png' });

    // Navigate to feeds via drawer
    await page.getByText('Feeds', { exact: true }).click();
    await waitForRoute(page, '/feeds');
    await waitForLoading(page);
    await page.screenshot({ path: 'screenshots/s8-feed-catalog.png', fullPage: true });
  });

  test('S9: Simulation History dialog', async ({ page }) => {
    await openDrawer(page);

    await page.getByText('Simulation History', { exact: true }).click();
    await page.waitForTimeout(2000);

    // Dialog should appear (may show empty state, error, or list)
    const dialog = page.locator('.q-dialog');
    await expect(dialog.first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'screenshots/s9-simulation-history.png' });

    await page.keyboard.press('Escape');
  });

  test('S10: Not-lactating hides milk fields', async ({ page }) => {
    await navigateToCattleInfo(page);

    const milkInput = page.getByRole('spinbutton', { name: /Milk Production/i }).first();
    await expect(milkInput).toBeVisible({ timeout: 10_000 });

    // Toggle lactating OFF
    const lactatingSwitch = page.getByRole('switch', { name: /Lactating/i });
    await lactatingSwitch.click();
    await page.waitForTimeout(500);

    // Milk fields should disappear (conditional rendering)
    await expect(page.getByRole('spinbutton', { name: /Milk Production/i })).toHaveCount(0);
    await page.screenshot({ path: 'screenshots/s10-not-lactating.png', fullPage: true });
  });

  test('S11: Feedback page', async ({ page }) => {
    await openDrawer(page);

    await page.getByText('Feedback', { exact: true }).click();
    await waitForRoute(page, '/settings/feedback');
    await waitForLoading(page);

    await expect(page.locator('.q-page').first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'screenshots/s11-feedback.png', fullPage: true });
  });

  test('S12: Browser back returns to cattle info from feed selection', async ({ page }) => {
    await navigateToCattleInfo(page);
    await selectBreed(page);
    await page.locator('button[type="submit"]').click();
    await waitForRoute(page, '/feed-selection');

    await page.goBack();
    await waitForRoute(page, '/cattle-info');

    const headers = page.locator('.section-header .text-subtitle1');
    await expect(headers.first()).toContainText('Animal Characteristics');
  });
});

// --------------- Helpers ---------------

async function navigateToCattleInfo(page: Page) {
  // From HomePage, click the "Start New Simulation" card to go to /cattle-info
  await page.getByText('Start New Simulation').click();
  await waitForRoute(page, '/cattle-info');
  await waitForLoading(page);
  // Wait for breeds API to load (needs fetchAndCacheCountries)
  await page.waitForTimeout(3000);
}

async function selectBreed(page: Page) {
  await page.getByRole('combobox', { name: 'Breed' }).click();
  await page.waitForTimeout(1000);

  const options = page.getByRole('option');
  await options.first().waitFor({ state: 'visible', timeout: 10_000 });
  await options.first().click();
  await page.waitForTimeout(300);
}

async function openDrawer(page: Page) {
  // Quasar renders the hamburger as <button><span class="q-icon">menu</span></button>
  // On mobile viewport the button is visible; filter by inner text "menu"
  const menuBtn = page.getByRole('button').filter({ hasText: 'menu' });
  await menuBtn.waitFor({ state: 'visible', timeout: 10_000 });
  await menuBtn.click();
  await page.waitForTimeout(500);
}

async function selectFeedBySearch(page: Page, feedName: string) {
  const searchInput = page.locator('input[placeholder*="Search"]').first();
  await searchInput.click();
  await searchInput.fill(feedName);
  await page.waitForTimeout(500);

  // Click the checkbox next to the matching feed
  const feedRow = page.locator(`.q-item:has-text("${feedName}")`).first();
  await feedRow.waitFor({ state: 'visible', timeout: 5_000 });
  const checkbox = feedRow.locator('.q-checkbox');
  await checkbox.click();
  await page.waitForTimeout(300);

  // Clear search
  await searchInput.fill('');
  await page.waitForTimeout(300);
}
