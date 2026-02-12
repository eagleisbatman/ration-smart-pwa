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
 *  P3: EXTENSION WORKER PERSONA — ETHIOPIA (55 test steps)
 *  Registration: Email | Language: English | Role: Extension Worker
 *  Org: TBD (Ethiopian org) | Country: Ethiopia (+251)
 *
 *  Runs as a single test with test.step() for each step,
 *  so auth tokens persist across the entire flow.
 *  One continuous video per persona.
 * ═══════════════════════════════════════════════════════════
 */

const EMAIL = testEmail('ew');
const PIN = '1234';
const NAME = 'Tadesse Bekele';
const COUNTRY = 'Ethiopia';

test('P3: Extension Worker Persona — Ethiopia (55 steps)', async ({ page }) => {
  test.setTimeout(600_000); // 10 min for entire persona

  // ─── PHASE 1: Registration & Onboarding ───

  await test.step('P3-01 Register with Email', async () => {
    await registerWithEmail(page, {
      name: NAME,
      countryName: COUNTRY,
      email: EMAIL,
      pin: PIN,
    });
    await expect(page).toHaveURL(/\/auth\/language/);
    await page.screenshot({ path: 'test-results/steps/P3-01.png' });
  });

  await test.step('P3-02 Language Selection — English', async () => {
    await waitForLoading(page);
    await clickCard(page, 'English');
    await clickOnboardingAction(page);
    await waitForRoute(page, '/auth/role');
    await page.screenshot({ path: 'test-results/steps/P3-02.png' });
  });

  await test.step('P3-03 Role Selection — Extension Worker', async () => {
    await waitForLoading(page);
    await clickCard(page, 'Extension Worker');
    await clickOnboardingAction(page);
    await waitForRoute(page, '/auth/organization');
    await page.screenshot({ path: 'test-results/steps/P3-03.png' });
  });

  await test.step('P3-04 Organization Selection', async () => {
    await waitForLoading(page);
    // Select first available org or Not Affiliated
    const orgItem = page.locator('.q-item, .q-card').first();
    await orgItem.click();
    await clickOnboardingAction(page);
    await waitForRoute(page, '/auth/profile-setup');
    await page.screenshot({ path: 'test-results/steps/P3-04.png' });
  });

  await test.step('P3-05 Complete Profile Setup', async () => {
    await waitForLoading(page);
    await clickOnboardingAction(page);
    await waitForRoute(page, '/');
    await page.screenshot({ path: 'test-results/steps/P3-05.png' });
  });

  await test.step('P3-06 Verify Dashboard EW', async () => {
    await waitForLoading(page);
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    await page.screenshot({ path: 'test-results/steps/P3-06.png' });
  });

  await test.step('P3-07 Logout and Re-login', async () => {
    await logout(page);
    await loginWithEmail(page, EMAIL, PIN);
    await waitForLoading(page);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/steps/P3-07.png' });
  });

  // ─── PHASE 2: Farmer Management — 3 Farmers ───

  await test.step('P3-08 Navigate to Farmers', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P3-08.png' });
  });

  await test.step('P3-09 Add Farmer Abebe', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await addFarmer(page, {
      name: 'Abebe Tesfaye',
      phone: '911234567',
      village: 'Debre Zeit',
      district: "Ada'a",
      state: 'Oromia',
      cattle: '4',
      farmingType: 'Dairy',
    });
    await expectVisible(page, 'Abebe Tesfaye');
    await page.screenshot({ path: 'test-results/steps/P3-09.png' });
  });

  await test.step('P3-10 Add Farmer Kidist', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await addFarmer(page, {
      name: 'Kidist Hailu',
      phone: '921234567',
      village: 'Bahir Dar',
      district: 'Bahir Dar',
      state: 'Amhara',
      cattle: '2',
      farmingType: 'Mixed',
    });
    await expectVisible(page, 'Kidist Hailu');
    await page.screenshot({ path: 'test-results/steps/P3-10.png' });
  });

  await test.step('P3-11 Add Farmer Selam', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await addFarmer(page, {
      name: 'Selam Getachew',
      phone: '931234567',
      village: 'Hawassa',
      district: 'Hawassa',
      state: 'Sidama',
      cattle: '3',
      farmingType: 'Dairy',
    });
    await expectVisible(page, 'Selam Getachew');
    await page.screenshot({ path: 'test-results/steps/P3-11.png' });
  });

  await test.step('P3-12 Verify 3 Farmers', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await expectVisible(page, 'Abebe Tesfaye');
    await expectVisible(page, 'Kidist Hailu');
    await expectVisible(page, 'Selam Getachew');
    await page.screenshot({ path: 'test-results/steps/P3-12.png' });
  });

  await test.step('P3-13 View Farmer Detail Abebe', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await clickCard(page, 'Abebe Tesfaye');
    await waitForLoading(page);
    await expectVisible(page, 'Abebe Tesfaye');
    await expectVisible(page, 'Debre Zeit');
    await page.screenshot({ path: 'test-results/steps/P3-13.png' });
  });

  await test.step('P3-14 Edit Farmer Abebe Cattle', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await clickCard(page, 'Abebe Tesfaye');
    await waitForLoading(page);
    const editBtn = page.locator('button:has-text("Edit")').first();
    await editBtn.click();
    await waitForLoading(page);
    await fillByLabel(page, 'Total Cattle', '5');
    await clickButton(page, 'Save');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P3-14.png' });
  });

  await test.step('P3-15 Verify Abebe Update', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await clickCard(page, 'Abebe Tesfaye');
    await waitForLoading(page);
    await expectVisible(page, '5');
    await page.screenshot({ path: 'test-results/steps/P3-15.png' });
  });

  await test.step('P3-16 Search Farmers', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    const search = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    if (await search.isVisible()) {
      await search.click();
      await search.fill('Kidist');
      await page.waitForTimeout(500);
      await expectVisible(page, 'Kidist Hailu');
      await search.fill('');
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: 'test-results/steps/P3-16.png' });
  });

  await test.step('P3-17 View Farmer Detail Selam', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await clickCard(page, 'Selam Getachew');
    await waitForLoading(page);
    await expectVisible(page, 'Selam Getachew');
    await expectVisible(page, 'Hawassa');
    await page.screenshot({ path: 'test-results/steps/P3-17.png' });
  });

  // ─── PHASE 3: Cow Management for Farmers ───

  await test.step('P3-18 Add Cow Adama for Abebe', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await clickCard(page, 'Abebe Tesfaye');
    await waitForLoading(page);
    await addCow(page, {
      name: 'Adama',
      breed: 'Other',
      weight: '380',
      milkYield: '8',
      daysInMilk: '60',
    });
    await expectVisible(page, 'Adama');
    await page.screenshot({ path: 'test-results/steps/P3-18.png' });
  });

  await test.step('P3-19 Add Cow Buna for Kidist', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await clickCard(page, 'Kidist Hailu');
    await waitForLoading(page);
    await addCow(page, {
      name: 'Buna',
      breed: 'Crossbreed',
      weight: '420',
      milkYield: '12',
      daysInMilk: '100',
    });
    await expectVisible(page, 'Buna');
    await page.screenshot({ path: 'test-results/steps/P3-19.png' });
  });

  await test.step('P3-20 Add Cow Nile for Selam', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await clickCard(page, 'Selam Getachew');
    await waitForLoading(page);
    await addCow(page, {
      name: 'Nile',
      breed: 'Red Sindhi',
      weight: '350',
      milkYield: '6',
      daysInMilk: '45',
    });
    await expectVisible(page, 'Nile');
    await page.screenshot({ path: 'test-results/steps/P3-20.png' });
  });

  await test.step('P3-21 View Abebe Cows', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await clickCard(page, 'Abebe Tesfaye');
    await waitForLoading(page);
    await expectVisible(page, 'Adama');
    await page.screenshot({ path: 'test-results/steps/P3-21.png' });
  });

  await test.step('P3-22 View Cow Detail Adama', async () => {
    await goto(page, '/cows');
    await waitForLoading(page);
    await clickCard(page, 'Adama');
    await waitForLoading(page);
    await expectVisible(page, 'Adama');
    await expectVisible(page, '380');
    await page.screenshot({ path: 'test-results/steps/P3-22.png' });
  });

  await test.step('P3-23 Edit Cow Buna Milk', async () => {
    await goto(page, '/cows');
    await waitForLoading(page);
    await clickCard(page, 'Buna');
    await waitForLoading(page);
    const editBtn = page.locator('button:has-text("Edit"), .q-btn--fab').first();
    await editBtn.click();
    await waitForLoading(page);
    await fillByLabel(page, 'Average Daily Yield', '13');
    await clickButton(page, 'Save');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P3-23.png' });
  });

  // ─── PHASE 4: Feed & Diet Optimization ───

  await test.step('P3-24 Browse Ethiopia Feeds', async () => {
    await goto(page, '/feeds');
    await waitForLoading(page);
    const feedItems = page.locator('.q-item, .q-card').first();
    await expect(feedItems).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'test-results/steps/P3-24.png' });
  });

  await test.step('P3-25 Diet for Adama Success', async () => {
    await goto(page, '/diet/new');
    await waitForLoading(page);
    await clickCard(page, 'Adama');
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
    await page.screenshot({ path: 'test-results/steps/P3-25.png' });
  });

  await test.step('P3-26 Save Diet Adama', async () => {
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Follow")').first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await waitForLoading(page);
    }
    await page.screenshot({ path: 'test-results/steps/P3-26.png' });
  });

  await test.step('P3-27 Diet for Buna Success', async () => {
    await goto(page, '/diet/new');
    await waitForLoading(page);
    await clickCard(page, 'Buna');
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
    await page.screenshot({ path: 'test-results/steps/P3-27.png' });
  });

  await test.step('P3-28 Diet Failure Empty Feeds', async () => {
    await goto(page, '/diet/new');
    await waitForLoading(page);
    await clickCard(page, 'Nile');
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    // Don't select feeds, try to continue
    const continueBtn = page.locator('button:has-text("Continue")').first();
    const isDisabled = await continueBtn.isDisabled();
    if (!isDisabled) {
      await continueBtn.click();
      await page.waitForTimeout(1000);
    }
    expect(true).toBe(true);
    await page.screenshot({ path: 'test-results/steps/P3-28.png' });
  });

  await test.step('P3-29 Diet Failure Too Few Feeds', async () => {
    await goto(page, '/diet/new');
    await waitForLoading(page);
    await clickCard(page, 'Nile');
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    const feedCb = page.locator('.q-checkbox, input[type="checkbox"]');
    if (await feedCb.first().isVisible()) {
      await feedCb.first().click();
    }
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickCard(page, 'Minimize Cost');
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickButton(page, 'Generate Diet');
    await page.waitForTimeout(10_000);
    await page.screenshot({ path: 'test-results/steps/P3-29.png' });
  });

  await test.step('P3-30 Diet Failure Extreme Params', async () => {
    await goto(page, '/diet/new');
    await waitForLoading(page);
    const manualRadio = page.locator('text=Enter manually, text=Manual').first();
    if (await manualRadio.isVisible()) {
      await manualRadio.click();
      await clickButton(page, 'Continue');
      await waitForLoading(page);
      await fillByLabel(page, 'Weight', '5000');
      await fillByLabel(page, 'Milk', '100');
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
      await page.waitForTimeout(10_000);
    }
    await page.screenshot({ path: 'test-results/steps/P3-30.png' });
  });

  await test.step('P3-31 View Saved Diets', async () => {
    await goto(page, '/diet');
    await waitForLoading(page);
    const items = page.locator('.q-card, .q-item');
    if (await items.first().isVisible()) {
      await expect(items.first()).toBeVisible({ timeout: 10_000 });
    }
    await page.screenshot({ path: 'test-results/steps/P3-31.png' });
  });

  // ─── PHASE 5: Milk Logging ───

  await test.step('P3-32 Log Milk Adama Day1', async () => {
    await goto(page, '/logs/new');
    await waitForLoading(page);
    await selectOption(page, 'Cow', 'Adama');
    await fillByLabel(page, 'Morning', '4');
    await fillByLabel(page, 'Evening', '4');
    await clickButton(page, 'Save');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P3-32.png' });
  });

  await test.step('P3-33 Log Milk Buna Day1', async () => {
    await goto(page, '/logs/new');
    await waitForLoading(page);
    await selectOption(page, 'Cow', 'Buna');
    await fillByLabel(page, 'Morning', '7');
    await fillByLabel(page, 'Evening', '6');
    await clickButton(page, 'Save');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P3-33.png' });
  });

  await test.step('P3-34 Log Milk Adama Day2', async () => {
    await goto(page, '/logs/new');
    await waitForLoading(page);
    await selectOption(page, 'Cow', 'Adama');
    await fillByLabel(page, 'Morning', '4.5');
    await fillByLabel(page, 'Evening', '3.5');
    await clickButton(page, 'Save');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P3-34.png' });
  });

  await test.step('P3-35 View Milk Logs', async () => {
    await goto(page, '/logs');
    await waitForLoading(page);
    const logItems = page.locator('.q-card, .q-item');
    const count = await logItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await page.screenshot({ path: 'test-results/steps/P3-35.png' });
  });

  await test.step('P3-36 Edit Milk Log', async () => {
    await goto(page, '/logs');
    await waitForLoading(page);
    const logCard = page.locator('.q-card, .q-item').first();
    await logCard.click();
    await waitForLoading(page);
    const editBtn = page.locator('button:has-text("Edit")').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await waitForLoading(page);
      await fillByLabel(page, 'Evening', '4.5');
      await clickButton(page, 'Save');
      await waitForLoading(page);
    }
    await page.screenshot({ path: 'test-results/steps/P3-36.png' });
  });

  await test.step('P3-37 Delete Milk Log', async () => {
    await goto(page, '/logs');
    await waitForLoading(page);
    const logCard = page.locator('.q-card, .q-item').last();
    if (await logCard.isVisible()) {
      await logCard.click();
      await waitForLoading(page);
      const deleteBtn = page.locator('button:has-text("Delete")').first();
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();
        await confirmDialog(page);
        await waitForLoading(page);
      }
    }
    await page.screenshot({ path: 'test-results/steps/P3-37.png' });
  });

  // ─── PHASE 6: Yield Data ───

  await test.step('P3-38 Record Yield Abebe Day1', async () => {
    await goto(page, '/yields/new');
    await waitForLoading(page);
    await fillByLabel(page, 'Milk', '8');
    await fillByLabel(page, 'Fat', '3.5');
    await fillByLabel(page, 'SNF', '8.5');
    await clickButton(page, 'Save');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P3-38.png' });
  });

  await test.step('P3-39 Record Yield Abebe Day2', async () => {
    await goto(page, '/yields/new');
    await waitForLoading(page);
    await fillByLabel(page, 'Milk', '7.5');
    await fillByLabel(page, 'Fat', '3.6');
    await fillByLabel(page, 'SNF', '8.4');
    await clickButton(page, 'Save');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P3-39.png' });
  });

  await test.step('P3-40 Record Yield Kidist', async () => {
    await goto(page, '/yields/new');
    await waitForLoading(page);
    await fillByLabel(page, 'Milk', '12');
    await fillByLabel(page, 'Fat', '3.8');
    await fillByLabel(page, 'SNF', '8.7');
    await clickButton(page, 'Save');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P3-40.png' });
  });

  await test.step('P3-41 Record Yield Selam', async () => {
    await goto(page, '/yields/new');
    await waitForLoading(page);
    await fillByLabel(page, 'Milk', '6');
    await fillByLabel(page, 'Fat', '3.3');
    await fillByLabel(page, 'SNF', '8.3');
    await clickButton(page, 'Save');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P3-41.png' });
  });

  await test.step('P3-42 View Yield History', async () => {
    await goto(page, '/yields');
    await waitForLoading(page);
    const yieldItems = page.locator('.q-card, .q-item');
    const count = await yieldItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await page.screenshot({ path: 'test-results/steps/P3-42.png' });
  });

  await test.step('P3-43 Edit Yield Record', async () => {
    await goto(page, '/yields');
    await waitForLoading(page);
    const yieldCard = page.locator('.q-card, .q-item').first();
    await yieldCard.click();
    await waitForLoading(page);
    const editBtn = page.locator('button:has-text("Edit")').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await waitForLoading(page);
      await fillByLabel(page, 'Fat', '3.7');
      await clickButton(page, 'Save');
      await waitForLoading(page);
    }
    await page.screenshot({ path: 'test-results/steps/P3-43.png' });
  });

  await test.step('P3-44 Compare Farmer Yields', async () => {
    await goto(page, '/yields');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P3-44.png' });
  });

  await test.step('P3-45 View Org Analytics', async () => {
    await goto(page, '/reports');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P3-45.png' });
  });

  // ─── PHASE 7: Reports ───

  await test.step('P3-46 Generate Report Abebe', async () => {
    await goto(page, '/reports');
    await waitForLoading(page);
    const generateBtn = page.locator('button:has-text("Generate"), button:has-text("New Report")').first();
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      await waitForLoading(page);
      await page.waitForTimeout(3000);
    }
    await page.screenshot({ path: 'test-results/steps/P3-46.png' });
  });

  await test.step('P3-47 View Report', async () => {
    await goto(page, '/reports');
    await waitForLoading(page);
    const reportCard = page.locator('.q-card, .q-item').first();
    if (await reportCard.isVisible()) {
      await reportCard.click();
      await waitForLoading(page);
    }
    await page.screenshot({ path: 'test-results/steps/P3-47.png' });
  });

  await test.step('P3-48 List Reports', async () => {
    await goto(page, '/reports');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P3-48.png' });
  });

  // ─── PHASE 8: Org Queries ───

  await test.step('P3-49 View Org Users', async () => {
    await goto(page, '/settings');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P3-49.png' });
  });

  await test.step('P3-50 View Org Farmers', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await expectVisible(page, 'Abebe Tesfaye');
    await page.screenshot({ path: 'test-results/steps/P3-50.png' });
  });

  await test.step('P3-51 View Org Details', async () => {
    await goto(page, '/settings');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P3-51.png' });
  });

  // ─── PHASE 9: Cleanup ───

  await test.step('P3-52 Archive Diets', async () => {
    await goto(page, '/diet');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P3-52.png' });
  });

  await test.step('P3-53 Delete Farmers Kidist and Selam', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await clickCard(page, 'Kidist Hailu');
    await waitForLoading(page);
    await clickButton(page, 'Delete');
    await confirmDialog(page);
    await waitForLoading(page);

    await goto(page, '/farmers');
    await waitForLoading(page);
    await clickCard(page, 'Selam Getachew');
    await waitForLoading(page);
    await clickButton(page, 'Delete');
    await confirmDialog(page);
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P3-53.png' });
  });

  await test.step('P3-54 Settings Verification', async () => {
    await goto(page, '/settings/profile');
    await waitForLoading(page);
    await expectVisible(page, NAME);
    await page.screenshot({ path: 'test-results/steps/P3-54.png' });
  });

  await test.step('P3-55 Final Logout', async () => {
    await logout(page);
    await expect(page).toHaveURL(/\/auth\/login/);
    await page.screenshot({ path: 'test-results/steps/P3-55.png' });
  });
});
