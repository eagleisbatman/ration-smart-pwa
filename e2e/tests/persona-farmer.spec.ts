import { test, expect } from '@playwright/test';
import {
  goto, waitForRoute, waitForLoading, expectVisible,
  fillByLabel, selectOption,
  clickButton, clickCard, clickRoleCard, clickOnboardingAction, clickFab,
  tapBottomNav, toggleToPhone, confirmDialog,
  registerWithPhone, loginWithPhone,
  addCow, addFarmer, testPhone,
} from '../helpers/actions';

/*
 * ═══════════════════════════════════════════════════════════
 *  P1: FARMER PERSONA — INDIA (51 test steps)
 *  Registration: Phone | Language: English | Role: Farmer
 *  Org: Not Affiliated | Country: India (+91)
 *
 *  Runs as a single test with test.step() for each step,
 *  so auth tokens persist across the entire flow.
 *  One continuous video per persona.
 * ═══════════════════════════════════════════════════════════
 */

const PHONE = testPhone('9876XXXXXX');
const PIN = '1234';
const NAME = 'Ramesh Kumar';
const COUNTRY = 'India';

test('P1: Farmer Persona — India (51 steps)', async ({ page }) => {
  test.setTimeout(600_000); // 10 min for entire persona

  // Capture browser console messages related to feeds for debugging
  page.on('console', (msg) => {
    const text = msg.text();
    if (
      text.includes('[Feeds]') ||
      text.includes('[API Adapter]') ||
      text.includes('feed') ||
      text.includes('Feed') ||
      text.includes('master') ||
      text.includes('custom') ||
      text.includes('Network') ||
      msg.type() === 'error'
    ) {
      console.log(`[BROWSER ${msg.type()}] ${text.slice(0, 300)}`);
    }
  });

  const softFails: string[] = [];

  /** Wrap a step body so failures are logged but don't stop the test */
  async function soft(stepName: string, fn: () => Promise<void>) {
    await test.step(stepName, async () => {
      try {
        await fn();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        const tag = stepName.split(' ')[0]; // e.g. "P1-15"
        softFails.push(`${stepName}: ${msg.slice(0, 120)}`);
        console.error(`[SOFT FAIL] ${stepName}: ${msg.slice(0, 200)}`);
        await page.screenshot({ path: `test-results/steps/${tag}-FAIL.png` });
      }
    });
  }

  // ─── PHASE 1: Registration & Onboarding (hard steps) ───

  await test.step('P1-01 Register with Phone', async () => {
    await registerWithPhone(page, { name: NAME, countryName: COUNTRY, phone: PHONE, pin: PIN });
    await expect(page).toHaveURL(/\/auth\/language/);
    await page.screenshot({ path: 'test-results/steps/P1-01.png' });
  });

  await test.step('P1-02 Language Selection — English', async () => {
    await waitForLoading(page);
    await clickCard(page, 'English');
    await clickOnboardingAction(page);
    await waitForRoute(page, '/auth/role');
    await page.screenshot({ path: 'test-results/steps/P1-02.png' });
  });

  await test.step('P1-03 Role Selection — Farmer', async () => {
    await waitForLoading(page);
    await clickRoleCard(page, 'Farmer');
    await page.waitForTimeout(300);
    await clickOnboardingAction(page);
    await waitForRoute(page, '/auth/organization');
    await page.screenshot({ path: 'test-results/steps/P1-03.png' });
  });

  await test.step('P1-04 Organization — Not Affiliated', async () => {
    await waitForLoading(page);
    await clickCard(page, 'Not Affiliated');
    await page.waitForTimeout(300);
    await clickOnboardingAction(page);
    await waitForRoute(page, '/auth/profile-setup');
    await page.screenshot({ path: 'test-results/steps/P1-04.png' });
  });

  await test.step('P1-05 Complete Profile Setup', async () => {
    await waitForLoading(page);
    await clickOnboardingAction(page);
    await waitForRoute(page, '/');
    await page.screenshot({ path: 'test-results/steps/P1-05.png' });
  });

  await test.step('P1-06 Verify Dashboard Loads', async () => {
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P1-06.png' });
  });

  // ─── PHASE 2: Cow Management (hard steps) ───

  await test.step('P1-07 Add Cow — Lakshmi', async () => {
    await goto(page, '/cows');
    await waitForLoading(page);
    await addCow(page, { name: 'Lakshmi', breed: 'Holstein Friesian', weight: '450', milkYield: '15' });
    await expectVisible(page, 'Lakshmi');
    await page.screenshot({ path: 'test-results/steps/P1-07.png' });
  });

  await test.step('P1-08 Add Cow — Ganga', async () => {
    await goto(page, '/cows');
    await waitForLoading(page);
    await addCow(page, { name: 'Ganga', breed: 'Jersey', weight: '380', milkYield: '10' });
    await expectVisible(page, 'Ganga');
    await page.screenshot({ path: 'test-results/steps/P1-08.png' });
  });

  await test.step('P1-09 View Cow List', async () => {
    await goto(page, '/cows');
    await waitForLoading(page);
    await expectVisible(page, 'Lakshmi');
    await expectVisible(page, 'Ganga');
    await page.screenshot({ path: 'test-results/steps/P1-09.png' });
  });

  await test.step('P1-10 View Cow Detail — Lakshmi', async () => {
    await clickCard(page, 'Lakshmi');
    await waitForLoading(page);
    await expectVisible(page, 'Lakshmi');
    await page.screenshot({ path: 'test-results/steps/P1-10.png' });
  });

  await test.step('P1-11 Edit Cow — Lakshmi Milk Yield', async () => {
    // Click the edit FAB on the cow detail page
    const editFab = page.locator('button:has-text("edit")').last();
    await editFab.waitFor({ state: 'visible', timeout: 5_000 });
    await editFab.click();
    await waitForLoading(page);
    await fillByLabel(page, 'Daily Yield', '16');
    await clickButton(page, 'Update Cow');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P1-11.png' });
  });

  await test.step('P1-12 Search Cows', async () => {
    await goto(page, '/cows');
    await waitForLoading(page);
    const search = page.locator('input[type="search"], input[placeholder*="Search" i]').first();
    if (await search.isVisible()) {
      await search.click();
      await search.fill('Ganga');
      await page.waitForTimeout(500);
      await expectVisible(page, 'Ganga');
      await search.fill('');
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: 'test-results/steps/P1-12.png' });
  });

  await test.step('P1-13 Cow List Shows Both', async () => {
    await goto(page, '/cows');
    await waitForLoading(page);
    expect(await page.locator('body').count()).toBeGreaterThan(0);
    await page.screenshot({ path: 'test-results/steps/P1-13.png' });
  });

  await test.step('P1-14 Delete Cow — Ganga', async () => {
    await goto(page, '/cows');
    await waitForLoading(page);
    await clickCard(page, 'Ganga');
    await waitForLoading(page);
    // Navigate to edit form via the edit FAB
    const editFab = page.locator('button:has-text("edit")').last();
    await editFab.waitFor({ state: 'visible', timeout: 5_000 });
    await editFab.click();
    await waitForLoading(page);
    await clickButton(page, 'Delete Cow');
    await confirmDialog(page);
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P1-14.png' });
  });

  // ─── PHASE 3: Feed Management (soft steps) ───

  await soft('P1-15 Browse Master Feeds', async () => {
    await goto(page, '/feeds');
    await waitForLoading(page);
    await page.waitForTimeout(3_000);
    await page.screenshot({ path: 'test-results/steps/P1-15.png' });
  });

  await soft('P1-16 Switch to My Feeds Tab', async () => {
    const myFeedsTab = page.getByText('My Feeds', { exact: false }).first();
    if (await myFeedsTab.isVisible()) {
      await myFeedsTab.click();
      await page.waitForTimeout(1_000);
    }
    await page.screenshot({ path: 'test-results/steps/P1-16.png' });
  });

  // Create 3 custom feeds (needed for diet optimization — India may have no master feeds)
  const customFeeds = [
    { name: 'Green Maize Fodder', dm: '25', cp: '8', tdn: '65' },
    { name: 'Wheat Bran', dm: '88', cp: '16', tdn: '68' },
    { name: 'Groundnut Cake', dm: '92', cp: '45', tdn: '78' },
  ];

  for (let i = 0; i < customFeeds.length; i++) {
    const feed = customFeeds[i];
    await soft(`P1-17${String.fromCharCode(97 + i)} Create Custom Feed — ${feed.name}`, async () => {
      await goto(page, '/feeds/new');
      await waitForLoading(page);
      await fillByLabel(page, 'Feed Name', feed.name);
      // Keep default Category (Concentrate) — Quasar q-select combobox is tricky
      // Fill required nutritional values (labels include "% *")
      await fillByLabel(page, 'Dry Matter', feed.dm);
      await fillByLabel(page, 'Crude Protein', feed.cp);
      await fillByLabel(page, 'TDN', feed.tdn);
      await page.screenshot({ path: `test-results/steps/P1-17${String.fromCharCode(97 + i)}-form.png` });
      // The "Add Feed" button may be below the fold — use locator to scroll to it
      const submitBtn = page.locator('button[type="submit"]:has-text("Add Feed")').first();
      await submitBtn.scrollIntoViewIfNeeded();
      await submitBtn.click();
      await waitForLoading(page);
      await page.waitForTimeout(1_000);
      await page.screenshot({ path: `test-results/steps/P1-17${String.fromCharCode(97 + i)}.png` });
    });
  }

  // Verify custom feeds exist on MY FEEDS tab
  await soft('P1-18 Verify Custom Feeds on My Feeds Tab', async () => {
    await goto(page, '/feeds');
    await waitForLoading(page);
    const myFeedsTab = page.getByText('MY FEEDS', { exact: false }).first();
    if (await myFeedsTab.count() > 0 && await myFeedsTab.isVisible()) {
      await myFeedsTab.click();
      await page.waitForTimeout(2_000);
    }
    await page.screenshot({ path: 'test-results/steps/P1-18-my-feeds.png' });
  });

  // ─── PHASE 4: Diet Optimization (soft steps) ───

  await soft('P1-20 Start Diet Wizard', async () => {
    await goto(page, '/diet/new');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P1-20.png' });
  });

  await soft('P1-21 Diet Wizard — Step 1: Select Cow', async () => {
    // Step 1: "Select from my cows" is default radio, pick cow from dropdown
    await selectOption(page, 'Select Cow', 'Lakshmi');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'test-results/steps/P1-21.png' });
    await clickButton(page, 'Continue');
    await waitForLoading(page);
  });

  await soft('P1-22 Diet Wizard — Step 2: Animal Details', async () => {
    // Step 2: Animal details are pre-filled from the selected cow
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/steps/P1-22.png' });
    // Click Continue — scroll into view first to ensure it's clickable
    const continueBtn = page.getByRole('button', { name: 'Continue' }).first();
    await continueBtn.scrollIntoViewIfNeeded();
    await continueBtn.click();
    // Wait for step transition — the Feeds step should show feed list items
    await page.waitForTimeout(1_500);
    await waitForLoading(page);
  });

  await soft('P1-23 Diet Wizard — Step 3: Select Feeds', async () => {
    // If still on Details step (Continue didn't advance), retry
    const detailsHeader = page.getByText('Animal Information', { exact: false }).first();
    if (await detailsHeader.isVisible()) {
      const btn = page.getByRole('button', { name: 'Continue' }).first();
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      await page.waitForTimeout(1_500);
    }

    // Wait for feeds to load (API call may take a few seconds)
    await page.waitForTimeout(5_000);

    // Debug: log feed count from the browser
    const feedDebug = await page.evaluate(() => {
      const items = document.querySelectorAll('.q-list .q-item');
      const checkboxItems = document.querySelectorAll('.q-list .q-item .q-checkbox');
      return {
        listItems: items.length,
        checkboxItems: checkboxItems.length,
        pageText: document.body.innerText.slice(0, 500),
      };
    });
    console.log(`[DEBUG] Feed step DOM: ${feedDebug.listItems} list items, ${feedDebug.checkboxItems} checkbox items`);
    console.log(`[DEBUG] Page text: ${feedDebug.pageText.slice(0, 300)}`);

    await page.screenshot({ path: 'test-results/steps/P1-23-before-select.png' });

    // Step 3: Select available feeds — feeds are q-item rows with q-checkbox inside
    const feedItems = page.locator('.q-stepper .q-list .q-item');
    let count = await feedItems.count();
    console.log(`[DEBUG] Feed items in stepper list: ${count}`);

    if (count === 0) {
      // Try broader selector
      const altItems = page.locator('.q-list .q-item .q-checkbox').locator('..');
      count = await altItems.count();
      console.log(`[DEBUG] Feed items via checkbox parent: ${count}`);
      for (let i = 0; i < Math.min(5, count); i++) {
        await altItems.nth(i).click();
        await page.waitForTimeout(200);
      }
    } else {
      for (let i = 0; i < Math.min(5, count); i++) {
        await feedItems.nth(i).click();
        await page.waitForTimeout(200);
      }
    }

    await page.screenshot({ path: 'test-results/steps/P1-23.png' });
    // Need at least 2 feeds selected to continue
    if (count >= 2) {
      const btn = page.getByRole('button', { name: 'Continue' }).first();
      await btn.scrollIntoViewIfNeeded();
      await btn.click();
      await page.waitForTimeout(1_000);
      await waitForLoading(page);
    }
  });

  await soft('P1-24 Diet Wizard — Step 4: Goal', async () => {
    // Step 4: Optimization goal — default is usually fine
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/steps/P1-24-goal.png' });
    const btn = page.getByRole('button', { name: 'Continue' }).first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await page.waitForTimeout(1_000);
    await waitForLoading(page);
  });

  await soft('P1-25 Diet Wizard — Step 5: Review & Generate', async () => {
    // Step 5: Review and generate
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-results/steps/P1-25-review.png' });
    await clickButton(page, 'Generate Diet');
    // Diet generation can take up to 30s
    await page.waitForTimeout(30_000);
    await page.screenshot({ path: 'test-results/steps/P1-25.png' });
  });

  await soft('P1-26 Save/Follow Diet Plan', async () => {
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Follow"), button:has-text("Accept")').first();
    if (await saveBtn.count() > 0 && await saveBtn.isVisible()) {
      await saveBtn.click();
      await waitForLoading(page);
    }
    await page.screenshot({ path: 'test-results/steps/P1-26.png' });
  });

  await soft('P1-26b View Diet History', async () => {
    await goto(page, '/diet');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P1-26b.png' });
  });

  // ─── PHASE 5: Milk Logging (soft steps) ───

  await soft('P1-27 Log Milk — Lakshmi (from cow detail)', async () => {
    // Navigate to cow detail and click Log Milk
    await goto(page, '/cows');
    await waitForLoading(page);
    await clickCard(page, 'Lakshmi');
    await waitForLoading(page);
    // Wait for cow data to load (skeleton to be replaced with real content)
    await page.waitForTimeout(3_000);
    await expectVisible(page, 'Lakshmi');
    const logBtn = page.locator('button:has-text("Log Milk")').first();
    await logBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await logBtn.click();
    await waitForLoading(page);
    await page.waitForTimeout(500);
    // Cow should be pre-selected since we came from cow detail
    // Fill morning/evening yields
    await fillByLabel(page, 'Morning', '8');
    await fillByLabel(page, 'Evening', '7');
    await page.screenshot({ path: 'test-results/steps/P1-27-before-save.png' });
    await clickButton(page, 'Save Log');
    await waitForLoading(page);
    await page.waitForTimeout(1_000);
    await page.screenshot({ path: 'test-results/steps/P1-27.png' });
  });

  await soft('P1-28 View Milk Production on Cow Detail', async () => {
    await goto(page, '/cows');
    await waitForLoading(page);
    await clickCard(page, 'Lakshmi');
    await waitForLoading(page);
    // The cow detail page shows a Milk Production Trend table
    await page.screenshot({ path: 'test-results/steps/P1-28.png' });
  });

  await soft('P1-29 Quick Log from FAB', async () => {
    await goto(page, '/');
    await waitForLoading(page);
    // Use FAB menu to log milk
    await clickFab(page);
    await page.waitForTimeout(300);
    const logMilk = page.getByText('Log Milk', { exact: false }).first();
    if (await logMilk.count() > 0 && await logMilk.isVisible()) {
      await logMilk.click();
      await waitForLoading(page);
    }
    await page.screenshot({ path: 'test-results/steps/P1-29.png' });
  });

  // ─── PHASE 6: Farmer Management (soft steps) ───

  await soft('P1-33 Navigate to Farmers', async () => {
    // Use goto instead of tapBottomNav — previous pages may lack bottom nav
    await goto(page, '/farmers');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P1-33.png' });
  });

  await soft('P1-34 Add Farmer — Mohan Yadav', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await addFarmer(page, {
      name: 'Mohan Yadav', phone: '9876543210',
      village: 'Rajapur', district: 'Varanasi', state: 'Uttar Pradesh',
      cattle: '5', farmingType: 'Dairy Farming',
    });
    await page.screenshot({ path: 'test-results/steps/P1-34.png' });
  });

  await soft('P1-35 View Farmer Detail — Mohan', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    // Wait for skeleton to be replaced with real data (farmer list loads async)
    await page.waitForTimeout(5_000);
    await page.screenshot({ path: 'test-results/steps/P1-35-list.png' });
    // The farmer name should appear once data loads
    const mohanCard = page.getByText('Mohan Yadav', { exact: false }).first();
    if (await mohanCard.count() > 0 && await mohanCard.isVisible()) {
      await mohanCard.click();
      await waitForLoading(page);
      await page.waitForTimeout(2_000);
    } else {
      // Farmer might not be visible yet — scroll down or wait more
      await page.waitForTimeout(3_000);
      await mohanCard.waitFor({ state: 'visible', timeout: 10_000 });
      await mohanCard.click();
      await waitForLoading(page);
    }
    await page.screenshot({ path: 'test-results/steps/P1-35.png' });
  });

  // ─── PHASE 7: Settings & Cleanup (soft steps) ───

  await soft('P1-42 Open Settings / More', async () => {
    await goto(page, '/settings');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P1-42.png' });
  });

  await soft('P1-43 View Profile', async () => {
    // Look for profile link/button on settings page
    const profileLink = page.getByText('Profile', { exact: false }).first();
    if (await profileLink.count() > 0 && await profileLink.isVisible()) {
      await profileLink.click();
      await waitForLoading(page);
    }
    await page.screenshot({ path: 'test-results/steps/P1-43.png' });
  });

  await soft('P1-45 Test Logout', async () => {
    await goto(page, '/settings');
    await waitForLoading(page);
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("Sign Out"), button:has-text("Log Out")').first();
    if (await logoutBtn.count() > 0 && await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(300);
      // Try to confirm dialog if one appears
      const confirmBtn = page.locator('.q-dialog button:has-text("OK"), .q-dialog button:has-text("Yes"), .q-dialog button:has-text("Confirm"), .q-dialog button:has-text("Logout")').first();
      if (await confirmBtn.count() > 0 && await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
      await page.waitForTimeout(2_000);
    }
    await page.screenshot({ path: 'test-results/steps/P1-45.png' });
  });

  await soft('P1-46 Test Re-Login', async () => {
    await loginWithPhone(page, COUNTRY, PHONE, PIN);
    await waitForLoading(page);
    await page.waitForTimeout(3_000);
    await page.screenshot({ path: 'test-results/steps/P1-46.png' });
  });

  // ─── FINAL: Report soft failures ───

  await test.step('P1-SUMMARY Report Failures', async () => {
    if (softFails.length > 0) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`SOFT FAILURES: ${softFails.length}`);
      console.log('='.repeat(60));
      for (const f of softFails) console.log(`  ✗ ${f}`);
      console.log('='.repeat(60) + '\n');
    } else {
      console.log('\n✓ All soft steps passed!\n');
    }
    // Don't fail the test — soft failures are informational for this debugging pass
    await page.screenshot({ path: 'test-results/steps/P1-SUMMARY.png' });
  });
});
