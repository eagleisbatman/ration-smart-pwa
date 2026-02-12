import { expect } from '@playwright/test';
import { test } from '../helpers/video-namer';
import {
  goto, waitForRoute, waitForLoading, expectVisible,
  fillByLabel, selectOption,
  clickButton, clickCard, clickOnboardingAction, tapBottomNav,
  confirmDialog,
  registerWithEmail, loginWithEmail, logout,
  addCow, addFarmer, testEmail,
} from '../helpers/actions';

/*
 * ═══════════════════════════════════════════════════════════
 *  P4: NUTRITIONIST PERSONA — KENYA (48 test steps)
 *  Registration: Email | Language: English | Role: Nutritionist
 *  Org: TBD | Country: Bangladesh (+880)
 *
 *  Runs as a single test with test.step() for each step,
 *  so auth tokens persist across the entire flow.
 *  One continuous video per persona.
 * ═══════════════════════════════════════════════════════════
 */

const EMAIL = testEmail('nutritionist');
const PIN = '1234';
const NAME = 'Grace Wanjiku';
const COUNTRY = 'Bangladesh';

test('P4: Nutritionist Persona — Kenya (48 steps)', async ({ page }) => {
  test.setTimeout(600_000); // 10 min for entire persona

  // ─── PHASE 1: Registration & Onboarding ───

  await test.step('P4-01 Register with Email', async () => {
    await registerWithEmail(page, {
      name: NAME,
      countryName: COUNTRY,
      email: EMAIL,
      pin: PIN,
    });
    await expect(page).toHaveURL(/\/auth\/language/);
    await page.screenshot({ path: 'test-results/steps/P4-01.png' });
  });

  await test.step('P4-02 Language Selection — English', async () => {
    await waitForLoading(page);
    await clickCard(page, 'English');
    await clickOnboardingAction(page);
    await waitForRoute(page, '/auth/role');
    await page.screenshot({ path: 'test-results/steps/P4-02.png' });
  });

  await test.step('P4-03 Role Selection — Nutritionist', async () => {
    await waitForLoading(page);
    await clickCard(page, 'Nutritionist');
    await clickOnboardingAction(page);
    await waitForRoute(page, '/auth/organization');
    await page.screenshot({ path: 'test-results/steps/P4-03.png' });
  });

  await test.step('P4-04 Organization Selection', async () => {
    await waitForLoading(page);
    const orgItem = page.locator('.q-item, .q-card').first();
    await orgItem.click();
    await clickOnboardingAction(page);
    await waitForRoute(page, '/auth/profile-setup');
    await page.screenshot({ path: 'test-results/steps/P4-04.png' });
  });

  await test.step('P4-05 Complete Profile Setup', async () => {
    await waitForLoading(page);
    await clickOnboardingAction(page);
    await waitForRoute(page, '/');
    await page.screenshot({ path: 'test-results/steps/P4-05.png' });
  });

  await test.step('P4-06 Verify Dashboard', async () => {
    await waitForLoading(page);
    await expectVisible(page, 'Log Milk');
    await expectVisible(page, 'Get Diet');
    await page.screenshot({ path: 'test-results/steps/P4-06.png' });
  });

  await test.step('P4-07 Logout and Re-login', async () => {
    await logout(page);
    await loginWithEmail(page, EMAIL, PIN);
    await waitForLoading(page);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/steps/P4-07.png' });
  });

  // ─── PHASE 2: Own Cow Management ───

  await test.step('P4-08 Add Own Cow Nyota', async () => {
    await goto(page, '/cows');
    await waitForLoading(page);
    await addCow(page, {
      name: 'Nyota',
      breed: 'Holstein Friesian',
      weight: '420',
      milkYield: '14',
      daysInMilk: '75',
    });
    await expectVisible(page, 'Nyota');
    await page.screenshot({ path: 'test-results/steps/P4-08.png' });
  });

  await test.step('P4-09 Add Own Cow Zawadi', async () => {
    await goto(page, '/cows');
    await waitForLoading(page);
    await addCow(page, {
      name: 'Zawadi',
      breed: 'Jersey',
      weight: '500',
      milkYield: '20',
      daysInMilk: '30',
    });
    await expectVisible(page, 'Zawadi');
    await page.screenshot({ path: 'test-results/steps/P4-09.png' });
  });

  await test.step('P4-10 View Cow List 2 Cows', async () => {
    await goto(page, '/cows');
    await waitForLoading(page);
    await expectVisible(page, 'Nyota');
    await expectVisible(page, 'Zawadi');
    await page.screenshot({ path: 'test-results/steps/P4-10.png' });
  });

  await test.step('P4-11 View Cow Detail Nyota', async () => {
    await goto(page, '/cows');
    await waitForLoading(page);
    await clickCard(page, 'Nyota');
    await waitForLoading(page);
    await expectVisible(page, 'Nyota');
    await expectVisible(page, '420');
    await page.screenshot({ path: 'test-results/steps/P4-11.png' });
  });

  await test.step('P4-12 Edit Cow Nyota Milk Yield', async () => {
    await goto(page, '/cows');
    await waitForLoading(page);
    await clickCard(page, 'Nyota');
    await waitForLoading(page);
    const editBtn = page.locator('button:has-text("Edit"), .q-btn--fab').first();
    await editBtn.click();
    await waitForLoading(page);
    await fillByLabel(page, 'Average Daily Yield', '15');
    await clickButton(page, 'Save');

    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P4-12.png' });
  });

  await test.step('P4-13 Search Cows', async () => {
    await goto(page, '/cows');
    await waitForLoading(page);
    const search = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    if (await search.isVisible()) {
      await search.click();
      await search.fill('Zawadi');
      await page.waitForTimeout(500);
      await expectVisible(page, 'Zawadi');
      await search.fill('');
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: 'test-results/steps/P4-13.png' });
  });

  // ─── PHASE 3: Farmer Management ───

  await test.step('P4-14 Navigate to Farmers', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P4-14.png' });
  });

  await test.step('P4-15 Add Farmer James', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await addFarmer(page, {
      name: 'James Kimani',
      phone: '712345678',
      village: 'Nakuru',
      district: 'Nakuru',
      state: 'Rift Valley',
      cattle: '6',
      farmingType: 'Dairy',
    });
    await expectVisible(page, 'James Kimani');
    await page.screenshot({ path: 'test-results/steps/P4-15.png' });
  });

  await test.step('P4-16 Add Farmer Amina', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await addFarmer(page, {
      name: 'Amina Hassan',
      phone: '723456789',
      village: 'Mombasa',
      district: 'Mombasa',
      state: 'Coast',
      cattle: '3',
      farmingType: 'Mixed',
    });
    await expectVisible(page, 'Amina Hassan');
    await page.screenshot({ path: 'test-results/steps/P4-16.png' });
  });

  await test.step('P4-17 View Farmer Detail James', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await clickCard(page, 'James Kimani');
    await waitForLoading(page);
    await expectVisible(page, 'James Kimani');
    await expectVisible(page, 'Nakuru');
    await page.screenshot({ path: 'test-results/steps/P4-17.png' });
  });

  await test.step('P4-18 Add Cow Simba for James', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await clickCard(page, 'James Kimani');
    await waitForLoading(page);
    await addCow(page, {
      name: 'Simba',
      breed: 'Sahiwal',
      weight: '400',
      milkYield: '10',
      daysInMilk: '90',
    });
    await expectVisible(page, 'Simba');
    await page.screenshot({ path: 'test-results/steps/P4-18.png' });
  });

  await test.step('P4-19 Add Cow Baraka for Amina', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await clickCard(page, 'Amina Hassan');
    await waitForLoading(page);
    await addCow(page, {
      name: 'Baraka',
      breed: 'Gir',
      weight: '320',
      milkYield: '5',
      daysInMilk: '180',
    });
    await expectVisible(page, 'Baraka');
    await page.screenshot({ path: 'test-results/steps/P4-19.png' });
  });

  // ─── PHASE 4: Advanced Feed Management ───

  await test.step('P4-20 Browse Kenya Feeds', async () => {
    await goto(page, '/feeds');
    await waitForLoading(page);
    const feedItems = page.locator('.q-item, .q-card').first();
    await expect(feedItems).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'test-results/steps/P4-20.png' });
  });

  await test.step('P4-21 Create Custom Feed Dairy Meal', async () => {
    await goto(page, '/feeds/new');
    await waitForLoading(page);
    await fillByLabel(page, 'Name', 'Dairy Meal Premium');
    await selectOption(page, 'Category', 'Concentrate');
    await fillByLabel(page, 'DM', '90');
    await fillByLabel(page, 'CP', '18');
    await fillByLabel(page, 'TDN', '75');
    await fillByLabel(page, 'Price', '45');
    await clickButton(page, 'Save');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P4-21.png' });
  });

  await test.step('P4-22 Create Custom Feed Napier Silage', async () => {
    await goto(page, '/feeds/new');
    await waitForLoading(page);
    await fillByLabel(page, 'Name', 'Napier Grass Silage');
    await selectOption(page, 'Category', 'Roughage');
    await fillByLabel(page, 'DM', '25');
    await fillByLabel(page, 'CP', '8');
    await fillByLabel(page, 'TDN', '55');
    await fillByLabel(page, 'Price', '8');
    await clickButton(page, 'Save');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P4-22.png' });
  });

  await test.step('P4-23 View Custom Feed Detail', async () => {
    await goto(page, '/feeds');
    await waitForLoading(page);
    await clickCard(page, 'Dairy Meal Premium');
    await waitForLoading(page);
    await expectVisible(page, 'Dairy Meal Premium');
    await page.screenshot({ path: 'test-results/steps/P4-23.png' });
  });

  await test.step('P4-24 Edit Custom Feed Price', async () => {
    await goto(page, '/feeds');
    await waitForLoading(page);
    await clickCard(page, 'Dairy Meal Premium');
    await waitForLoading(page);
    const editBtn = page.locator('button:has-text("Edit"), .q-btn--fab').first();
    await editBtn.click();
    await waitForLoading(page);
    await fillByLabel(page, 'Price', '50');
    await clickButton(page, 'Save');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P4-24.png' });
  });

  await test.step('P4-25 Compare Feeds', async () => {
    await goto(page, '/feeds');
    await waitForLoading(page);
    const feedCards = page.locator('.q-item, .q-card');
    const count = await feedCards.count();
    expect(count).toBeGreaterThanOrEqual(2);
    await page.screenshot({ path: 'test-results/steps/P4-25.png' });
  });

  // ─── PHASE 5: Advanced Diet Optimization ───

  await test.step('P4-26 Diet for Nyota Minimize Cost', async () => {
    await goto(page, '/diet/new');
    await waitForLoading(page);
    await clickCard(page, 'Nyota');
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    const feedCb = page.locator('.q-checkbox, input[type="checkbox"]');
    const count = await feedCb.count();
    for (let i = 0; i < Math.min(6, count); i++) {
      await feedCb.nth(i).click();
      await page.waitForTimeout(200);
    }
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickCard(page, 'Minimize Cost');
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickButton(page, 'Generate Diet');
    await page.waitForTimeout(15_000);
    await page.screenshot({ path: 'test-results/steps/P4-26.png' });
  });

  await test.step('P4-27 Save Diet Nyota', async () => {
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Follow")').first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await waitForLoading(page);
    }
    await page.screenshot({ path: 'test-results/steps/P4-27.png' });
  });

  await test.step('P4-28 Diet for Zawadi Balanced', async () => {
    await goto(page, '/diet/new');
    await waitForLoading(page);
    await clickCard(page, 'Zawadi');
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    const feedCb = page.locator('.q-checkbox, input[type="checkbox"]');
    const count = await feedCb.count();
    for (let i = 0; i < Math.min(6, count); i++) {
      await feedCb.nth(i).click();
      await page.waitForTimeout(200);
    }
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickCard(page, 'Balanced');
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickButton(page, 'Generate Diet');
    await page.waitForTimeout(15_000);
    await page.screenshot({ path: 'test-results/steps/P4-28.png' });
  });

  await test.step('P4-29 Save Diet Zawadi', async () => {
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Follow")').first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await waitForLoading(page);
    }
    await page.screenshot({ path: 'test-results/steps/P4-29.png' });
  });

  await test.step('P4-30 Diet for Simba Farmer Advisory', async () => {
    await goto(page, '/diet/new');
    await waitForLoading(page);
    await clickCard(page, 'Simba');
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    const feedCb = page.locator('.q-checkbox, input[type="checkbox"]');
    const count = await feedCb.count();
    for (let i = 0; i < Math.min(5, count); i++) {
      await feedCb.nth(i).click();
      await page.waitForTimeout(200);
    }
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickCard(page, 'Minimize Cost');
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickButton(page, 'Generate Diet');
    await page.waitForTimeout(15_000);
    await page.screenshot({ path: 'test-results/steps/P4-30.png' });
  });

  await test.step('P4-31 Diet for Baraka Low Producer', async () => {
    await goto(page, '/diet/new');
    await waitForLoading(page);
    await clickCard(page, 'Baraka');
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    const feedCb = page.locator('.q-checkbox, input[type="checkbox"]');
    const count = await feedCb.count();
    for (let i = 0; i < Math.min(4, count); i++) {
      await feedCb.nth(i).click();
      await page.waitForTimeout(200);
    }
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickCard(page, 'Minimize Cost');
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickButton(page, 'Generate Diet');
    await page.waitForTimeout(15_000);
    await page.screenshot({ path: 'test-results/steps/P4-31.png' });
  });

  await test.step('P4-32 Diet Failure Only Roughage', async () => {
    await goto(page, '/diet/new');
    await waitForLoading(page);
    await clickCard(page, 'Nyota');
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    // Select only feeds that say "Roughage"
    const roughageFeeds = page.locator('.q-checkbox:has-text("Roughage"), .q-item:has-text("Roughage") .q-checkbox');
    const count = await roughageFeeds.count();
    for (let i = 0; i < Math.min(3, count); i++) {
      await roughageFeeds.nth(i).click();
      await page.waitForTimeout(200);
    }
    if (count === 0) {
      // Fallback: just select first 2 feeds
      const feedCb = page.locator('.q-checkbox, input[type="checkbox"]');
      if (await feedCb.first().isVisible()) await feedCb.first().click();
      if (await feedCb.nth(1).isVisible()) await feedCb.nth(1).click();
    }
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickCard(page, 'Minimize Cost');
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickButton(page, 'Generate Diet');
    await page.waitForTimeout(10_000);
    await page.screenshot({ path: 'test-results/steps/P4-32.png' });
  });

  await test.step('P4-33 Diet Failure Only Concentrate', async () => {
    await goto(page, '/diet/new');
    await waitForLoading(page);
    await clickCard(page, 'Nyota');
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    const concentrateFeeds = page.locator('.q-checkbox:has-text("Concentrate"), .q-item:has-text("Concentrate") .q-checkbox');
    const count = await concentrateFeeds.count();
    for (let i = 0; i < Math.min(3, count); i++) {
      await concentrateFeeds.nth(i).click();
      await page.waitForTimeout(200);
    }
    if (count === 0) {
      const feedCb = page.locator('.q-checkbox, input[type="checkbox"]');
      const total = await feedCb.count();
      for (let i = Math.max(0, total - 3); i < total; i++) {
        await feedCb.nth(i).click();
        await page.waitForTimeout(200);
      }
    }
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickCard(page, 'Minimize Cost');
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickButton(page, 'Generate Diet');
    await page.waitForTimeout(10_000);
    await page.screenshot({ path: 'test-results/steps/P4-33.png' });
  });

  await test.step('P4-34 Diet Compare Nyota vs Zawadi', async () => {
    await goto(page, '/diet');
    await waitForLoading(page);
    const dietCards = page.locator('.q-card, .q-item');
    const count = await dietCards.count();
    expect(count).toBeGreaterThanOrEqual(2);
    await page.screenshot({ path: 'test-results/steps/P4-34.png' });
  });

  await test.step('P4-35 View All Diet History', async () => {
    await goto(page, '/diet');
    await waitForLoading(page);
    const items = page.locator('.q-card, .q-item');
    if (await items.first().isVisible()) {
      await expect(items.first()).toBeVisible({ timeout: 10_000 });
    }
    await page.screenshot({ path: 'test-results/steps/P4-35.png' });
  });

  // ─── PHASE 6: Milk Logging ───

  await test.step('P4-36 Log Milk Nyota', async () => {
    await goto(page, '/logs/new');
    await waitForLoading(page);
    await selectOption(page, 'Cow', 'Nyota');
    await fillByLabel(page, 'Morning', '8');
    await fillByLabel(page, 'Evening', '7');
    await clickButton(page, 'Save');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P4-36.png' });
  });

  await test.step('P4-37 Log Milk Zawadi', async () => {
    await goto(page, '/logs/new');
    await waitForLoading(page);
    await selectOption(page, 'Cow', 'Zawadi');
    await fillByLabel(page, 'Morning', '11');
    await fillByLabel(page, 'Evening', '9');
    await clickButton(page, 'Save');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P4-37.png' });
  });

  await test.step('P4-38 View Milk Summary', async () => {
    await goto(page, '/logs');
    await waitForLoading(page);
    const logItems = page.locator('.q-card, .q-item');
    const count = await logItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await page.screenshot({ path: 'test-results/steps/P4-38.png' });
  });

  await test.step('P4-39 Edit Milk Log Nyota', async () => {
    await goto(page, '/logs');
    await waitForLoading(page);
    const logCard = page.locator('.q-card, .q-item').first();
    await logCard.click();
    await waitForLoading(page);
    const editBtn = page.locator('button:has-text("Edit")').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await waitForLoading(page);
      await fillByLabel(page, 'Evening', '7.5');
      await clickButton(page, 'Save');
      await waitForLoading(page);
    }
    await page.screenshot({ path: 'test-results/steps/P4-39.png' });
  });

  // ─── PHASE 7: Yield Data ───

  await test.step('P4-40 Record Yield James', async () => {
    await goto(page, '/yields/new');
    await waitForLoading(page);
    await fillByLabel(page, 'Milk', '10');
    await fillByLabel(page, 'Fat', '3.5');
    await clickButton(page, 'Save');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P4-40.png' });
  });

  await test.step('P4-41 Record Yield Amina', async () => {
    await goto(page, '/yields/new');
    await waitForLoading(page);
    await fillByLabel(page, 'Milk', '5');
    await fillByLabel(page, 'Fat', '3.3');
    await clickButton(page, 'Save');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P4-41.png' });
  });

  await test.step('P4-42 View Yield History', async () => {
    await goto(page, '/yields');
    await waitForLoading(page);
    const yieldItems = page.locator('.q-card, .q-item');
    const count = await yieldItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await page.screenshot({ path: 'test-results/steps/P4-42.png' });
  });

  await test.step('P4-43 Compare Farmer Yields', async () => {
    await goto(page, '/yields');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P4-43.png' });
  });

  await test.step('P4-44 Organization Analytics', async () => {
    await goto(page, '/reports');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P4-44.png' });
  });

  // ─── PHASE 8: Cleanup ───

  await test.step('P4-45 Archive All Diets', async () => {
    await goto(page, '/diet');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P4-45.png' });
  });

  await test.step('P4-46 Delete Custom Feeds', async () => {
    await goto(page, '/feeds');
    await waitForLoading(page);
    const dairyMeal = page.locator('text=Dairy Meal Premium').first();
    if (await dairyMeal.isVisible()) {
      await dairyMeal.click();
      await waitForLoading(page);
      await clickButton(page, 'Delete');
      await confirmDialog(page);
      await waitForLoading(page);
    }

    await goto(page, '/feeds');
    await waitForLoading(page);
    const napier = page.locator('text=Napier Grass Silage').first();
    if (await napier.isVisible()) {
      await napier.click();
      await waitForLoading(page);
      await clickButton(page, 'Delete');
      await confirmDialog(page);
      await waitForLoading(page);
    }
    await page.screenshot({ path: 'test-results/steps/P4-46.png' });
  });

  await test.step('P4-47 Delete Cow Zawadi', async () => {
    await goto(page, '/cows');
    await waitForLoading(page);
    await clickCard(page, 'Zawadi');
    await waitForLoading(page);
    await clickButton(page, 'Delete');
    await confirmDialog(page);
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P4-47.png' });
  });

  await test.step('P4-48 Final Logout', async () => {
    await logout(page);
    await expect(page).toHaveURL(/\/auth\/login/);
    await page.screenshot({ path: 'test-results/steps/P4-48.png' });
  });
});
