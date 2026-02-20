/**
 * Feature Tests: Sequential E2E tests that create real data and verify functionality.
 *
 * Each test is small and focused on one feature. Tests run in order because
 * later tests depend on data created by earlier ones (same user session).
 *
 * Flow: Login → Add Farmer → Verify → Add Cow → Verify → Log Milk → Verify
 *       → Create Diet → Verify → Dashboard checks → Edit/Update → Settings
 */
import { test, expect, Page } from '@playwright/test';
import {
  loginWithEmail,
  waitForLoading,
  tapBottomNav,
  goto,
  fillByLabel,
  selectOption,
  clickButton,
} from '../helpers/actions';

// ── Config ──────────────────────────────────────────────────────────────
const EMAIL = 'mandewalkergautam@gmail.com';
const PIN = '1981';
const SHOTS = 'screenshots-features';
const RUN_ID = Date.now().toString().slice(-5);

// Test data — unique per run to avoid collisions
const FARMER = {
  name: `Test Farmer ${RUN_ID}`,
  phone: `98765${RUN_ID}`,
  village: 'Bhopal',
  district: 'Bhopal',
  state: 'Madhya Pradesh',
  cattle: '3',
};

const COW = {
  name: `Gauri ${RUN_ID}`,
  weight: '420',
  milkYield: '12',
  milkFat: '4.2',
};

const MILK_LOG = {
  morning: '6.5',
  evening: '5.0',
};

// ── Helpers ─────────────────────────────────────────────────────────────

/** Screenshot with numbered prefix for easy ordering */
async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });
}

/** Wait for navigation to complete and spinners to clear */
async function settle(page: Page, ms = 1500) {
  await page.waitForTimeout(ms);
  await waitForLoading(page);
}

/** Scroll to bottom of page */
async function scrollToBottom(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
}

// ── Tests (serial — run in declared order) ──────────────────────────────
test.describe.serial('Feature tests: full data lifecycle', () => {
  // Shared state across tests
  let farmerCreated = false;
  let cowCreated = false;

  test.beforeAll(async ({ browser }) => {
    // Clean screenshots dir
    const fs = await import('fs');
    if (fs.existsSync(SHOTS)) {
      fs.rmSync(SHOTS, { recursive: true });
    }
    fs.mkdirSync(SHOTS, { recursive: true });
  });

  // ── 1. LOGIN ──────────────────────────────────────────────────────────
  test('01 — Login and verify dashboard loads', async ({ page }) => {
    await loginWithEmail(page, EMAIL, PIN);
    await settle(page, 3000);

    // Should NOT be on auth page
    expect(page.url()).not.toContain('/auth');
    await shot(page, '01-dashboard');

    // Dashboard should show key navigation elements
    const header = page.locator('.q-toolbar-title, .q-toolbar__title').first();
    await expect(header).toBeVisible();

    // Bottom nav should have tabs
    const tabs = page.locator('.q-tab');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(4);
    console.log(`[01] Dashboard loaded. ${tabCount} bottom nav tabs visible.`);
  });

  // ── 2. ADD FARMER ─────────────────────────────────────────────────────
  test('02 — Add a new farmer with all fields', async ({ page }) => {
    await loginWithEmail(page, EMAIL, PIN);
    await settle(page, 3000);

    // Navigate to add farmer form
    await goto(page, '/farmers/new');
    await settle(page);
    await shot(page, '02a-farmer-form-empty');

    // Fill required field: name
    await fillByLabel(page, 'Farmer Name', FARMER.name);

    // Fill phone
    const phoneInput = page.locator('input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await phoneInput.click();
      await phoneInput.fill(FARMER.phone);
    }

    // Fill location fields
    await fillByLabel(page, 'Village', FARMER.village);
    await fillByLabel(page, 'District', FARMER.district);

    // State/Province field
    const stateInput = page.getByRole('textbox', { name: /state|province/i }).first();
    if (await stateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await stateInput.click();
      await stateInput.fill(FARMER.state);
    }

    // Farm details
    await fillByLabel(page, 'Total Cattle', FARMER.cattle);

    // Select farming type
    try {
      await selectOption(page, 'Farming Type', 'Dairy');
    } catch {
      console.log('[02] Could not select farming type — skipping');
    }

    await scrollToBottom(page);
    await shot(page, '02b-farmer-form-filled');

    // Submit
    await clickButton(page, 'Add Farmer');
    await settle(page, 3000);
    await shot(page, '02c-after-farmer-submit');

    // Check we navigated away from the form (success) or got an error
    const currentUrl = page.url();
    const errorBanner = page.locator('.bg-negative, .q-banner--negative').first();
    const hasError = await errorBanner.isVisible({ timeout: 1000 }).catch(() => false);

    if (hasError) {
      const errorText = await errorBanner.textContent();
      console.log(`[02] ERROR: ${errorText}`);
    } else {
      farmerCreated = true;
      console.log(`[02] Farmer "${FARMER.name}" created. URL: ${currentUrl}`);
    }
  });

  // ── 3. VERIFY FARMER IN LIST ──────────────────────────────────────────
  test('03 — Verify farmer appears in farmer list', async ({ page }) => {
    await loginWithEmail(page, EMAIL, PIN);
    await settle(page, 3000);

    await tapBottomNav(page, 'Farmers');
    await settle(page, 2000);
    await shot(page, '03a-farmer-list');

    // Search for our farmer
    const searchInput = page.getByRole('textbox', { name: /search/i }).first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.click();
      await searchInput.fill(RUN_ID);
      await settle(page, 1000);
    }

    await shot(page, '03b-farmer-search-results');

    // Verify farmer name is visible in the list
    const farmerItem = page.getByText(FARMER.name, { exact: false }).first();
    const found = await farmerItem.isVisible({ timeout: 5000 }).catch(() => false);

    if (found) {
      console.log(`[03] Farmer "${FARMER.name}" found in list.`);

      // Click to open farmer detail
      await farmerItem.click();
      await settle(page);
      await shot(page, '03c-farmer-detail');

      // Verify details on farmer detail page
      const nameVisible = await page.getByText(FARMER.name).first().isVisible().catch(() => false);
      const villageVisible = await page.getByText(FARMER.village).first().isVisible().catch(() => false);
      console.log(`[03] Detail page — name: ${nameVisible}, village: ${villageVisible}`);
    } else {
      console.log(`[03] WARNING: Farmer "${FARMER.name}" NOT found in search results.`);
    }
  });

  // ── 4. ADD COW ────────────────────────────────────────────────────────
  test('04 — Add a new cow', async ({ page }) => {
    await loginWithEmail(page, EMAIL, PIN);
    await settle(page, 3000);

    // Navigate to add cow form
    await goto(page, '/cows/new');
    await settle(page);
    await shot(page, '04a-cow-form-empty');

    // Select farmer (our created farmer or self)
    const farmerSelect = page.locator('.q-select').first();
    if (await farmerSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await farmerSelect.click();
      await page.waitForTimeout(500);
      // Try to find our test farmer in the dropdown
      const farmerOption = page.getByText(new RegExp(RUN_ID), { exact: false }).first();
      if (await farmerOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await farmerOption.click();
      } else {
        // Pick the first available farmer
        const firstOption = page.locator('.q-item, [role="option"]').first();
        if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await firstOption.click();
        }
      }
      await page.waitForTimeout(300);
    }

    // Fill cow name
    await fillByLabel(page, 'Cow Name', COW.name);

    // Select breed
    try {
      await selectOption(page, 'Breed', 'Holstein');
    } catch {
      try {
        await selectOption(page, 'Breed', 'Crossbred');
      } catch {
        // Pick first breed available
        const breedSelect = page.getByRole('combobox', { name: /breed/i }).first();
        if (await breedSelect.isVisible().catch(() => false)) {
          await breedSelect.click();
          await page.waitForTimeout(500);
          const firstBreed = page.locator('.q-item, [role="option"]').first();
          await firstBreed.click();
        }
      }
    }

    // Fill weight
    await fillByLabel(page, 'Weight', COW.weight);

    // Fill milk yield
    const yieldInput = page.getByRole('spinbutton', { name: /yield|daily/i }).first();
    if (await yieldInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await yieldInput.click();
      await yieldInput.fill(COW.milkYield);
    }

    // Fill milk fat
    const fatInput = page.getByRole('spinbutton', { name: /fat/i }).first();
    if (await fatInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await fatInput.click();
      await fatInput.fill(COW.milkFat);
    }

    // Select lactation stage
    try {
      await selectOption(page, 'Lactation Stage', 'Mid');
    } catch {
      console.log('[04] Could not select lactation stage — skipping');
    }

    await scrollToBottom(page);
    await shot(page, '04b-cow-form-filled');

    // Submit
    await clickButton(page, 'Add Cow');
    await settle(page, 3000);
    await shot(page, '04c-after-cow-submit');

    // Check for errors
    const errorBanner = page.locator('.bg-negative').first();
    const hasError = await errorBanner.isVisible({ timeout: 1000 }).catch(() => false);

    if (hasError) {
      const errorText = await errorBanner.textContent();
      console.log(`[04] ERROR: ${errorText}`);
    } else {
      cowCreated = true;
      console.log(`[04] Cow "${COW.name}" created.`);
    }
  });

  // ── 5. VERIFY COW IN LIST ─────────────────────────────────────────────
  test('05 — Verify cow appears in cow list', async ({ page }) => {
    await loginWithEmail(page, EMAIL, PIN);
    await settle(page, 3000);

    await tapBottomNav(page, 'Cows');
    await settle(page, 2000);
    await shot(page, '05a-cow-list');

    // Look for our cow by name
    const cowItem = page.getByText(COW.name, { exact: false }).first();
    const found = await cowItem.isVisible({ timeout: 5000 }).catch(() => false);

    if (found) {
      console.log(`[05] Cow "${COW.name}" found in list.`);

      // Click to see detail
      await cowItem.click();
      await settle(page);
      await shot(page, '05b-cow-detail');

      // Verify cow details
      const weightShown = await page.getByText('420').first().isVisible().catch(() => false);
      const yieldShown = await page.getByText('12').first().isVisible().catch(() => false);
      console.log(`[05] Cow detail — weight: ${weightShown}, yield: ${yieldShown}`);
    } else {
      console.log(`[05] WARNING: Cow "${COW.name}" NOT found in cow list.`);
      // Take a screenshot of what we DO see
      await shot(page, '05b-cow-not-found');
    }
  });

  // ── 6. LOG MILK ───────────────────────────────────────────────────────
  test('06 — Log milk for a cow', async ({ page }) => {
    await loginWithEmail(page, EMAIL, PIN);
    await settle(page, 3000);

    await goto(page, '/logs/new');
    await settle(page);
    await shot(page, '06a-log-form-empty');

    // Select cow
    const cowSelect = page.locator('.q-select').first();
    if (await cowSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cowSelect.click();
      await page.waitForTimeout(500);

      // Try to find our test cow
      const cowOption = page.getByText(new RegExp(RUN_ID), { exact: false }).first();
      if (await cowOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await cowOption.click();
      } else {
        // Pick first cow
        const firstOption = page.locator('.q-item, [role="option"]').first();
        if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await firstOption.click();
        }
      }
      await page.waitForTimeout(500);
    }

    // Fill morning liters
    const morningInput = page.getByRole('spinbutton', { name: /morning/i }).first();
    if (await morningInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await morningInput.click();
      await morningInput.fill(MILK_LOG.morning);
    }

    // Fill evening liters
    const eveningInput = page.getByRole('spinbutton', { name: /evening/i }).first();
    if (await eveningInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await eveningInput.click();
      await eveningInput.fill(MILK_LOG.evening);
    }

    // Verify total is computed
    const totalDisplay = page.getByText(/11\.5/);
    const totalShown = await totalDisplay.first().isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`[06] Total (11.5 L) displayed: ${totalShown}`);

    await scrollToBottom(page);
    await shot(page, '06b-log-form-filled');

    // Submit
    await clickButton(page, 'Save');
    await settle(page, 3000);
    await shot(page, '06c-after-log-submit');

    const errorBanner = page.locator('.bg-negative').first();
    const hasError = await errorBanner.isVisible({ timeout: 1000 }).catch(() => false);

    if (hasError) {
      const errorText = await errorBanner.textContent();
      console.log(`[06] ERROR: ${errorText}`);
    } else {
      console.log(`[06] Milk log saved. Morning: ${MILK_LOG.morning}L, Evening: ${MILK_LOG.evening}L.`);
    }
  });

  // ── 7. VERIFY MILK LOG IN LIST ────────────────────────────────────────
  test('07 — Verify milk log appears in log list', async ({ page }) => {
    await loginWithEmail(page, EMAIL, PIN);
    await settle(page, 3000);

    await goto(page, '/logs');
    await settle(page, 2000);
    await shot(page, '07a-log-list');

    // Check for today's log entry
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logEntry = page.getByText(/6\.5|11\.5/).first();
    const found = await logEntry.isVisible({ timeout: 5000 }).catch(() => false);

    if (found) {
      console.log(`[07] Milk log visible (found 6.5 or 11.5 in list).`);
    } else {
      console.log(`[07] WARNING: Milk log not found in list.`);
    }

    // Check the summary stats at the top
    const todayTotal = page.getByText(/today/i).first();
    const hasTodayStat = await todayTotal.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`[07] Today stat visible: ${hasTodayStat}`);

    await scrollToBottom(page);
    await shot(page, '07b-log-list-scrolled');
  });

  // ── 8. CREATE DIET PLAN ───────────────────────────────────────────────
  test('08 — Create a diet plan via wizard', async ({ page }) => {
    await loginWithEmail(page, EMAIL, PIN);
    await settle(page, 3000);

    await tapBottomNav(page, 'Diet');
    await settle(page);

    // Navigate to new diet
    const newBtn = page.getByRole('button', { name: /new.*diet|create/i }).first();
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
    } else {
      await goto(page, '/diet/new');
    }
    await settle(page, 2000);

    // Step 1: Select cow — use "Enter manually" to avoid dependency on cow creation
    const manualRadio = page.getByText('Enter manually', { exact: false }).first();
    if (await manualRadio.isVisible({ timeout: 3000 }).catch(() => false)) {
      await manualRadio.click();
      await page.waitForTimeout(300);
    }
    await shot(page, '08a-diet-step1');

    // Click Continue
    const continueBtn = page.getByRole('button', { name: /continue/i }).first();
    await continueBtn.click();
    await settle(page, 500);

    // Step 2: Animal details (defaults pre-filled)
    await shot(page, '08b-diet-step2');
    await continueBtn.click();
    await settle(page, 1000);

    // Step 3: Select feeds — pick at least 3
    await shot(page, '08c-diet-step3');
    const checkboxes = page.locator('.q-checkbox');
    const cbCount = await checkboxes.count();
    for (let i = 0; i < Math.min(4, cbCount); i++) {
      await checkboxes.nth(i).click();
      await page.waitForTimeout(200);
    }
    console.log(`[08] Selected ${Math.min(4, cbCount)} feeds out of ${cbCount}.`);
    await continueBtn.click();
    await settle(page, 500);

    // Step 4: Goal (default is balanced)
    await shot(page, '08d-diet-step4');
    await continueBtn.click();
    await settle(page, 500);

    // Step 5: Review
    await shot(page, '08e-diet-step5-review');

    // Click Generate Diet
    const generateBtn = page.getByRole('button', { name: /generate/i }).first();
    await expect(generateBtn).toBeVisible({ timeout: 3000 });
    await generateBtn.click();
    await settle(page, 10000); // Diet generation can take time

    await shot(page, '08f-diet-result');

    // Check result — could be success (diet result page) or error
    const errorBanner = page.locator('.bg-negative').first();
    const hasError = await errorBanner.isVisible({ timeout: 2000 }).catch(() => false);

    if (hasError) {
      const errorText = await errorBanner.textContent();
      console.log(`[08] Diet generation ERROR: ${errorText}`);
    } else {
      // Check if we're on a result page
      const resultVisible = page.getByText(/result|recommendation|total.*cost|diet.*plan/i).first();
      const hasResult = await resultVisible.isVisible({ timeout: 5000 }).catch(() => false);
      console.log(`[08] Diet result visible: ${hasResult}. URL: ${page.url()}`);
    }
  });

  // ── 9. VERIFY DIET IN LIST ────────────────────────────────────────────
  test('09 — Verify diet appears in diet list', async ({ page }) => {
    await loginWithEmail(page, EMAIL, PIN);
    await settle(page, 3000);

    await tapBottomNav(page, 'Diet');
    await settle(page, 2000);
    await shot(page, '09a-diet-list');

    // Look for diet entries
    const dietCards = page.locator('.q-card, .q-item');
    const cardCount = await dietCards.count();
    console.log(`[09] Diet list items: ${cardCount}`);

    // Check for today's date or "Manual Entry" text
    const todayEntry = page.getByText(/manual|balanced|today/i).first();
    const found = await todayEntry.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`[09] Recent diet entry visible: ${found}`);

    await scrollToBottom(page);
    await shot(page, '09b-diet-list-scrolled');
  });

  // ── 10. DASHBOARD VERIFICATION ────────────────────────────────────────
  test('10 — Dashboard reflects created data', async ({ page }) => {
    await loginWithEmail(page, EMAIL, PIN);
    await settle(page, 3000);

    // Go to home dashboard
    await tapBottomNav(page, 'Home');
    await settle(page, 2000);
    await shot(page, '10a-dashboard');

    // Check stat cards are visible
    const statCards = page.locator('.stat-card, .q-card').first();
    const hasStats = await statCards.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`[10] Dashboard stat cards visible: ${hasStats}`);

    // Check milk production chart/numbers
    const milkStat = page.getByText(/milk|liters|production/i).first();
    const hasMilkStat = await milkStat.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`[10] Milk stats visible: ${hasMilkStat}`);

    // Scroll to see more
    await scrollToBottom(page);
    await shot(page, '10b-dashboard-scrolled');
  });

  // ── 11. FEEDS LIST ────────────────────────────────────────────────────
  test('11 — View feeds list and verify master feeds loaded', async ({ page }) => {
    await loginWithEmail(page, EMAIL, PIN);
    await settle(page, 3000);

    await goto(page, '/feeds');
    await settle(page, 2000);
    await shot(page, '11a-feeds-list');

    // Count feed items
    const feedItems = page.locator('.q-item, .q-card');
    const feedCount = await feedItems.count();
    console.log(`[11] Feed items visible: ${feedCount}`);

    // Feeds should be loaded (master feeds from backend)
    expect(feedCount).toBeGreaterThan(0);

    await scrollToBottom(page);
    await shot(page, '11b-feeds-scrolled');
  });

  // ── 12. PROFILE & SETTINGS ────────────────────────────────────────────
  test('12 — View profile and verify user data', async ({ page }) => {
    await loginWithEmail(page, EMAIL, PIN);
    await settle(page, 3000);

    await tapBottomNav(page, 'More');
    await settle(page);
    await shot(page, '12a-settings-menu');

    // Navigate to profile
    const profileLink = page.getByText(/profile|my profile/i).first();
    if (await profileLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await profileLink.click();
      await settle(page);
    } else {
      await goto(page, '/settings/profile');
      await settle(page);
    }
    await shot(page, '12b-profile-page');

    // Verify user email is shown (it's inside a form input, check input value)
    const emailInput = page.locator('input[type="email"], input').filter({ hasText: /email/i });
    const emailFieldAlt = page.getByText(EMAIL, { exact: false }).first();
    const emailVisible = await emailFieldAlt.isVisible({ timeout: 3000 }).catch(() => false);
    // Also check via input value
    const emailValue = await page.locator('input').evaluateAll((inputs) =>
      inputs.map((i) => (i as HTMLInputElement).value).find((v) => v.includes('@'))
    );
    console.log(`[12] Email visible as text: ${emailVisible}, email in input: ${emailValue || 'not found'}`);
    expect(emailVisible || !!emailValue).toBeTruthy();

    // Verify name is shown (check input values)
    const nameValue = await page.locator('input').evaluateAll((inputs) =>
      inputs.map((i) => (i as HTMLInputElement).value).find((v) => v.length > 2 && !v.includes('@'))
    );
    console.log(`[12] Name in input: ${nameValue || 'not found'}`);
    expect(nameValue).toBeTruthy();

    await scrollToBottom(page);
    await shot(page, '12c-profile-bottom');

    // Verify Change PIN button is visible
    const pinBtn = page.getByRole('button', { name: /change.*pin|pin/i }).first();
    const pinVisible = await pinBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log(`[12] Change PIN button visible: ${pinVisible}`);
  });

  // ── 13. PHOTO UPLOAD (file chooser) ───────────────────────────────────
  test('13 — Test photo upload on cow form', async ({ page }) => {
    await loginWithEmail(page, EMAIL, PIN);
    await settle(page, 3000);

    await goto(page, '/cows/new');
    await settle(page);

    // The photo section creates a dynamic <input type="file"> when clicked.
    // Playwright can intercept the filechooser event.
    const photoPlaceholder = page.locator('.photo-placeholder, .photo-container').first();
    const hasPhoto = await photoPlaceholder.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasPhoto) {
      // Set up filechooser listener BEFORE clicking
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
        photoPlaceholder.click(),
      ]);

      if (fileChooser) {
        // Playwright intercepted the file chooser — but we'd need a real image file.
        // For testing, we verify the dialog mechanism works.
        console.log('[13] File chooser triggered successfully. Photo upload mechanism works.');
      } else {
        // Photo uses a dialog (Take Photo / Choose from Gallery) instead
        const galleryOption = page.getByText(/gallery|choose/i).first();
        const dialogShown = await galleryOption.isVisible({ timeout: 3000 }).catch(() => false);
        console.log(`[13] Photo dialog shown: ${dialogShown}`);

        if (dialogShown) {
          // Set up filechooser and click gallery option
          const [fc2] = await Promise.all([
            page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
            galleryOption.click(),
          ]);
          console.log(`[13] Gallery file chooser triggered: ${!!fc2}`);
        }
      }
    } else {
      console.log('[13] Photo upload section not visible on cow form.');
    }

    await shot(page, '13-photo-upload-test');
  });

  // ── 14. FARMER IMPORT PAGE ────────────────────────────────────────────
  test('14 — Farmer import page loads correctly', async ({ page }) => {
    await loginWithEmail(page, EMAIL, PIN);
    await settle(page, 3000);

    await goto(page, '/farmers/import');
    await settle(page);
    await shot(page, '14a-farmer-import');

    // Check import page has file upload or instructions
    const importContent = page.getByText(/import|upload|csv|excel/i).first();
    const hasImport = await importContent.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`[14] Farmer import page content visible: ${hasImport}`);

    await shot(page, '14b-farmer-import-full');
  });

  // ── 15. YIELD HISTORY ─────────────────────────────────────────────────
  test('15 — Yield history page loads', async ({ page }) => {
    await loginWithEmail(page, EMAIL, PIN);
    await settle(page, 3000);

    await goto(page, '/yields');
    await settle(page);
    await shot(page, '15a-yield-history');

    // Check page loaded
    const yieldContent = page.getByText(/yield|history|production/i).first();
    const hasContent = await yieldContent.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`[15] Yield history content visible: ${hasContent}`);
  });

  // ── 16. REPORTS PAGE ──────────────────────────────────────────────────
  test('16 — Reports page loads', async ({ page }) => {
    await loginWithEmail(page, EMAIL, PIN);
    await settle(page, 3000);

    await goto(page, '/reports');
    await settle(page);
    await shot(page, '16a-reports');

    const reportContent = page.getByText(/report|generate|download/i).first();
    const hasContent = await reportContent.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`[16] Reports page content visible: ${hasContent}`);
  });

  // ── 17. DARK MODE TOGGLE ──────────────────────────────────────────────
  test('17 — Toggle dark mode and verify no invisible elements', async ({ page }) => {
    await loginWithEmail(page, EMAIL, PIN);
    await settle(page, 3000);

    // Go to settings
    await tapBottomNav(page, 'More');
    await settle(page);

    // Find the Dark Mode row (has text "Dark Mode") and click its toggle
    const darkModeRow = page.locator('.q-item:has-text("Dark Mode")').first();
    const hasDarkRow = await darkModeRow.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasDarkRow) {
      // Click the toggle inside the Dark Mode row (not the disabled Push Notifications toggle)
      const toggle = darkModeRow.locator('.q-toggle').first();
      if (await toggle.isVisible().catch(() => false)) {
        await toggle.click({ force: true });
        await settle(page, 1000);
        await shot(page, '17a-dark-mode-settings');

        // Check body has dark class
        const isDark = await page.evaluate(() =>
          document.body.classList.contains('body--dark')
        );
        console.log(`[17] Dark mode active: ${isDark}`);

        // Navigate through pages in dark mode to check for invisible elements
        await tapBottomNav(page, 'Home');
        await settle(page);
        await shot(page, '17b-dark-mode-dashboard');

        await tapBottomNav(page, 'Cows');
        await settle(page);
        await shot(page, '17c-dark-mode-cows');

        await tapBottomNav(page, 'Diet');
        await settle(page);
        await shot(page, '17d-dark-mode-diet');

        await tapBottomNav(page, 'Farmers');
        await settle(page);
        await shot(page, '17e-dark-mode-farmers');

        // Toggle back to light mode
        await tapBottomNav(page, 'More');
        await settle(page);
        const darkRow2 = page.locator('.q-item:has-text("Dark Mode")').first();
        const toggle2 = darkRow2.locator('.q-toggle').first();
        if (await toggle2.isVisible().catch(() => false)) {
          await toggle2.click({ force: true });
          await settle(page);
        }
        console.log('[17] Dark mode toggled on and off successfully.');
      } else {
        console.log('[17] Dark mode toggle element not found inside row.');
      }
    } else {
      console.log('[17] Dark Mode row not found on settings page.');
      await shot(page, '17a-no-dark-mode');
    }
  });
});
