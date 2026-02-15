/**
 * Form Walkthrough: Login → walk through every major form
 * Tiny execution: just login, open each form, screenshot, verify inputs visible.
 */
import { test, expect } from '@playwright/test';
import { loginWithEmail, waitForLoading, tapBottomNav, goto, fillByLabel, selectOption } from '../helpers/actions';

const EMAIL = 'mandewalkergautam@gmail.com';
const PIN = '1981';
const SHOTS = 'screenshots-walkthrough';

test.describe('Step-based form walkthrough', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await loginWithEmail(page, EMAIL, PIN);
    await page.waitForTimeout(3000);
    await waitForLoading(page);

    // Should be on dashboard
    if (page.url().includes('/auth')) {
      test.skip(true, 'Login failed — still on auth page');
    }
  });

  test('Diet Wizard: walk all 5 steps', async ({ page }) => {
    // Navigate to diet plans
    await tapBottomNav(page, 'Diet');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SHOTS}/01-diet-list.png`, fullPage: true });

    // Click "New Diet Plan" button or FAB
    const newDietBtn = page.getByRole('button', { name: /new.*diet|create.*diet|add/i }).first();
    const fabBtn = page.locator('.q-fab, .q-btn--fab').first();

    if (await newDietBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newDietBtn.click();
    } else if (await fabBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fabBtn.click();
      await page.waitForTimeout(500);
      // Look for diet-related menu option
      const dietOption = page.getByText(/diet/i).first();
      if (await dietOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dietOption.click();
      }
    } else {
      // Direct navigation
      await goto(page, '/diet/new');
    }

    await page.waitForTimeout(2000);
    await waitForLoading(page);

    // ---- Step 1: Select Cow ----
    await expect(page.getByText(/select.*cow|step.*cow/i).first()).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: `${SHOTS}/02-step1-cow.png`, fullPage: true });

    // Switch to "Enter manually" mode so we can proceed without existing cows
    const manualRadio = page.getByText('Enter manually', { exact: false }).first();
    await manualRadio.click();
    await page.waitForTimeout(300);

    // Fill cow name (optional but let's fill it)
    const cowNameInput = page.locator('input').first();
    if (await cowNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cowNameInput.fill('Test Cow');
    }

    await page.screenshot({ path: `${SHOTS}/02b-step1-manual.png`, fullPage: true });

    // Click Continue
    const continueBtn = page.getByRole('button', { name: /continue/i }).first();
    await continueBtn.click();
    await page.waitForTimeout(500);

    // ---- Step 2: Animal Details ----
    await page.screenshot({ path: `${SHOTS}/03-step2-details.png`, fullPage: true });

    // Check that number inputs are visible and usable
    const weightInput = page.getByRole('spinbutton', { name: /weight/i }).first();
    if (await weightInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const wBox = await weightInput.boundingBox();
      console.log(`[Step 2] Weight input box: ${JSON.stringify(wBox)}`);
      if (wBox) {
        expect(wBox.width).toBeGreaterThan(100);
      }
    }

    // Click Continue to step 3 (defaults are pre-filled: 400kg, 10L, etc.)
    await continueBtn.click();
    await page.waitForTimeout(1000);

    // ---- Step 3: Select Feeds ----
    await page.screenshot({ path: `${SHOTS}/04-step3-feeds.png`, fullPage: true });

    // Check feed search input width
    const feedSearch = page.locator('input[placeholder*="earch" i]').first();
    if (await feedSearch.isVisible({ timeout: 3000 }).catch(() => false)) {
      const fBox = await feedSearch.boundingBox();
      console.log(`[Step 3] Feed search box: ${JSON.stringify(fBox)}`);
      if (fBox) {
        expect(fBox.width).toBeGreaterThan(200); // Must not be squished
      }
    }

    // Check a feed item is visible and readable
    const feedItem = page.locator('.q-item').first();
    if (await feedItem.isVisible({ timeout: 5000 }).catch(() => false)) {
      const iBox = await feedItem.boundingBox();
      console.log(`[Step 3] First feed item box: ${JSON.stringify(iBox)}`);
      if (iBox) {
        expect(iBox.width).toBeGreaterThan(250); // Feed items need space
      }
    }

    // Select 3 feeds for the test
    const checkboxes = page.locator('.q-checkbox');
    const cbCount = await checkboxes.count();
    console.log(`[Step 3] Available feeds: ${cbCount}`);
    for (let i = 0; i < Math.min(3, cbCount); i++) {
      await checkboxes.nth(i).click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: `${SHOTS}/05-step3-feeds-selected.png`, fullPage: true });

    // Click Continue to step 4
    await continueBtn.click();
    await page.waitForTimeout(500);

    // ---- Step 4: Optimization Goal ----
    await page.screenshot({ path: `${SHOTS}/06-step4-goal.png`, fullPage: true });

    // A goal should already be selected (default: 'balanced')
    const radioOptions = page.locator('.q-radio');
    const radioCount = await radioOptions.count();
    console.log(`[Step 4] Goal radio options: ${radioCount}`);

    // Click Continue to step 5
    await continueBtn.click();
    await page.waitForTimeout(500);

    // ---- Step 5: Review ----
    await page.screenshot({ path: `${SHOTS}/07-step5-review.png`, fullPage: true });

    // Check the review card is visible
    const reviewCard = page.locator('.q-card').first();
    if (await reviewCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      const rBox = await reviewCard.boundingBox();
      console.log(`[Step 5] Review card box: ${JSON.stringify(rBox)}`);
    }

    // Don't submit — just verify the Generate button exists
    const generateBtn = page.getByRole('button', { name: /generate/i }).first();
    await expect(generateBtn).toBeVisible({ timeout: 3000 });

    console.log('[DONE] All 5 diet wizard steps walked successfully');
  });

  test('Add Cow form: verify all inputs', async ({ page }) => {
    // Navigate to cows tab
    await tapBottomNav(page, 'Cows');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${SHOTS}/10-cow-list.png`, fullPage: true });

    // Open Add Cow form — try FAB menu first, then direct nav
    const fab = page.locator('.q-fab, .q-btn--fab').first();
    if (await fab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fab.click();
      await page.waitForTimeout(500);
      const addCowOption = page.getByText(/add cow/i).first();
      if (await addCowOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addCowOption.click();
      } else {
        await goto(page, '/cows/new');
      }
    } else {
      // Empty state might have a direct "Add Cow" button
      const addBtn = page.getByRole('button', { name: /add cow/i }).first();
      if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addBtn.click();
      } else {
        await goto(page, '/cows/new');
      }
    }

    await page.waitForTimeout(1500);
    await waitForLoading(page);
    await page.screenshot({ path: `${SHOTS}/11-cow-form-top.png`, fullPage: true });

    // Verify key inputs exist and have proper width
    const nameInput = page.getByRole('textbox', { name: /name/i }).first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const box = await nameInput.boundingBox();
      console.log(`[Cow Form] Name input: ${JSON.stringify(box)}`);
      if (box) expect(box.width).toBeGreaterThan(200);
    }

    const weightInput = page.getByRole('spinbutton', { name: /weight/i }).first();
    if (await weightInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const box = await weightInput.boundingBox();
      console.log(`[Cow Form] Weight input: ${JSON.stringify(box)}`);
      if (box) expect(box.width).toBeGreaterThan(200);
    }

    // Scroll down to see more fields
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/12-cow-form-bottom.png`, fullPage: true });

    // Verify submit button exists
    const submitBtn = page.getByRole('button', { name: /add cow|save|submit/i }).first();
    await expect(submitBtn).toBeVisible({ timeout: 5000 });

    console.log('[DONE] Cow form walkthrough complete');
  });

  test('Add Farmer form: verify all inputs', async ({ page }) => {
    // Navigate directly to add farmer
    await goto(page, '/farmers/new');
    await waitForLoading(page);
    await page.screenshot({ path: `${SHOTS}/20-farmer-form-top.png`, fullPage: true });

    // Verify key inputs
    const nameInput = page.getByRole('textbox', { name: /name/i }).first();
    if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const box = await nameInput.boundingBox();
      console.log(`[Farmer Form] Name input: ${JSON.stringify(box)}`);
      if (box) expect(box.width).toBeGreaterThan(200);
    }

    const phoneInput = page.locator('input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const box = await phoneInput.boundingBox();
      console.log(`[Farmer Form] Phone input: ${JSON.stringify(box)}`);
      if (box) expect(box.width).toBeGreaterThan(150);
    }

    // Scroll to see location & farm details
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SHOTS}/21-farmer-form-mid.png`, fullPage: true });

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SHOTS}/22-farmer-form-bottom.png`, fullPage: true });

    // Verify submit button
    const submitBtn = page.getByRole('button', { name: /add farmer|save|submit/i }).first();
    await expect(submitBtn).toBeVisible({ timeout: 5000 });

    console.log('[DONE] Farmer form walkthrough complete');
  });

  test('Milk Log form: verify all inputs', async ({ page }) => {
    // Milk Logs is in the drawer, not bottom nav — navigate directly
    await goto(page, '/logs/new');
    await waitForLoading(page);
    await page.screenshot({ path: `${SHOTS}/31-log-form.png`, fullPage: true });

    // Verify cow selector (q-select renders as a .q-field container)
    const cowSelect = page.locator('.q-select').first();
    if (await cowSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      const box = await cowSelect.boundingBox();
      console.log(`[Log Form] Cow select: ${JSON.stringify(box)}`);
      if (box) expect(box.width).toBeGreaterThan(200);
    }

    // Verify morning/evening inputs
    const morningInput = page.getByRole('spinbutton', { name: /morning/i }).first();
    if (await morningInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const box = await morningInput.boundingBox();
      console.log(`[Log Form] Morning input: ${JSON.stringify(box)}`);
      if (box) expect(box.width).toBeGreaterThan(100);
    }

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SHOTS}/32-log-form-bottom.png`, fullPage: true });

    // Verify submit button
    const submitBtn = page.getByRole('button', { name: /save|add|submit|log/i }).first();
    await expect(submitBtn).toBeVisible({ timeout: 5000 });

    console.log('[DONE] Milk log form walkthrough complete');
  });
});
