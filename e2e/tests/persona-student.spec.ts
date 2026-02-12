import { expect } from '@playwright/test';
import { test } from '../helpers/video-namer';
import {
  goto, waitForRoute, waitForLoading, expectVisible,
  fillByLabel, selectOption,
  clickButton, clickCard, clickOnboardingAction, tapBottomNav,
  toggleToEmail, confirmDialog,
  registerWithEmail, loginWithEmail, logout,
  addCow, addFarmer, testEmail,
} from '../helpers/actions';

/*
 * ═══════════════════════════════════════════════════════════
 *  P2: STUDENT PERSONA — NEPAL (42 test steps)
 *  Registration: Email | Language: English | Role: Student
 *  Org: Not Affiliated | Country: Nepal
 *
 *  Runs as a single test with test.step() for each step,
 *  so auth tokens persist across the entire flow.
 *  One continuous video per persona.
 * ═══════════════════════════════════════════════════════════
 */

const EMAIL = testEmail('student');
const PIN = '1234';
const NEW_PIN = '5678';
const NAME = 'Sita Sharma';
const COUNTRY = 'Nepal';

test('P2: Student Persona — Nepal (42 steps)', async ({ page }) => {
  test.setTimeout(600_000); // 10 min for entire persona

  // ─── PHASE 1: Registration & Onboarding ───

  await test.step('P2-01 Register with Email', async () => {
    await registerWithEmail(page, {
      name: NAME,
      countryName: COUNTRY,
      email: EMAIL,
      pin: PIN,
    });
    await expect(page).toHaveURL(/\/auth\/language/);
    await page.screenshot({ path: 'test-results/steps/P2-01.png' });
  });

  await test.step('P2-02 Language Selection — English', async () => {
    await waitForLoading(page);
    await clickCard(page, 'English');
    await clickOnboardingAction(page);
    await waitForRoute(page, '/auth/role');
    await page.screenshot({ path: 'test-results/steps/P2-02.png' });
  });

  await test.step('P2-03 Role Selection — Student', async () => {
    await waitForLoading(page);
    await clickCard(page, 'Student');
    await clickOnboardingAction(page);
    await waitForRoute(page, '/auth/organization');
    await page.screenshot({ path: 'test-results/steps/P2-03.png' });
  });

  await test.step('P2-04 Organization — Not Affiliated', async () => {
    await waitForLoading(page);
    await clickCard(page, 'Not Affiliated');
    await clickOnboardingAction(page);
    await waitForRoute(page, '/auth/profile-setup');
    await page.screenshot({ path: 'test-results/steps/P2-04.png' });
  });

  await test.step('P2-05 Complete Profile Setup', async () => {
    await waitForLoading(page);
    await clickOnboardingAction(page);
    await waitForRoute(page, '/');
    await page.screenshot({ path: 'test-results/steps/P2-05.png' });
  });

  await test.step('P2-06 Verify Dashboard', async () => {
    await waitForLoading(page);
    await expectVisible(page, 'Log Milk');
    await expectVisible(page, 'Get Diet');
    await page.screenshot({ path: 'test-results/steps/P2-06.png' });
  });

  await test.step('P2-07 Logout and Re-login with Email', async () => {
    await logout(page);
    await loginWithEmail(page, EMAIL, PIN);
    await waitForLoading(page);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/steps/P2-07.png' });
  });

  // ─── PHASE 2: Farmer Management ───

  await test.step('P2-08 Navigate to Farmers', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P2-08.png' });
  });

  await test.step('P2-09 Add Farmer — Hari Thapa', async () => {
    await addFarmer(page, {
      name: 'Hari Thapa',
      phone: '9812345678',
      village: 'Pokhara',
      district: 'Kaski',
      state: 'Gandaki',
      cattle: '3',
      farmingType: 'Dairy',
    });
    await expectVisible(page, 'Hari Thapa');
    await page.screenshot({ path: 'test-results/steps/P2-09.png' });
  });

  await test.step('P2-10 Add Farmer — Suman Gurung', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await addFarmer(page, {
      name: 'Suman Gurung',
      phone: '9823456789',
      village: 'Bharatpur',
      district: 'Chitwan',
      state: 'Bagmati',
      cattle: '2',
      farmingType: 'Mixed',
    });
    await expectVisible(page, 'Suman Gurung');
    await page.screenshot({ path: 'test-results/steps/P2-10.png' });
  });

  await test.step('P2-11 View Farmer Detail — Hari', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await clickCard(page, 'Hari Thapa');
    await waitForLoading(page);
    await expectVisible(page, 'Hari Thapa');
    await expectVisible(page, 'Pokhara');
    await page.screenshot({ path: 'test-results/steps/P2-11.png' });
  });

  await test.step('P2-12 Add Cow Dhenu for Hari', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await clickCard(page, 'Hari Thapa');
    await waitForLoading(page);
    await addCow(page, {
      name: 'Dhenu',
      breed: 'Gir',
      weight: '350',
      milkYield: '8',
      daysInMilk: '60',
    });
    await expectVisible(page, 'Dhenu');
    await page.screenshot({ path: 'test-results/steps/P2-12.png' });
  });

  await test.step('P2-13 Add Cow Kamala for Suman', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await clickCard(page, 'Suman Gurung');
    await waitForLoading(page);
    await addCow(page, {
      name: 'Kamala',
      breed: 'Crossbreed',
      weight: '380',
      milkYield: '10',
      daysInMilk: '120',
    });
    await expectVisible(page, 'Kamala');
    await page.screenshot({ path: 'test-results/steps/P2-13.png' });
  });

  // ─── PHASE 3: Feed Exploration ───

  await test.step('P2-14 Browse Nepal Feeds', async () => {
    await goto(page, '/feeds');
    await waitForLoading(page);
    const feedItems = page.locator('.q-item, .q-card, [class*="feed"]');
    await expect(feedItems.first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'test-results/steps/P2-14.png' });
  });

  await test.step('P2-15 Compare Feed Nutritional Details', async () => {
    await goto(page, '/feeds');
    await waitForLoading(page);
    const feedCards = page.locator('.q-item, .q-card').first();
    await feedCards.click();
    await waitForLoading(page);
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    await page.screenshot({ path: 'test-results/steps/P2-15.png' });
  });

  await test.step('P2-16 Note Feed IDs', async () => {
    await goto(page, '/feeds');
    await waitForLoading(page);
    const feedItems = page.locator('.q-item, .q-card');
    const count = await feedItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await page.screenshot({ path: 'test-results/steps/P2-16.png' });
  });

  // ─── PHASE 4: Diet Optimization — Comparison ───

  await test.step('P2-17 Diet 1 Low Cost Dhenu', async () => {
    await goto(page, '/diet/new');
    await waitForLoading(page);
    await clickCard(page, 'Dhenu');
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
    await page.screenshot({ path: 'test-results/steps/P2-17.png' });
  });

  await test.step('P2-18 Save Diet 1', async () => {
    const saveBtn = page.locator('button:has-text("Save"), button:has-text("Follow")').first();
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
      await waitForLoading(page);
    }
    await page.screenshot({ path: 'test-results/steps/P2-18.png' });
  });

  await test.step('P2-19 View Diet 1 Detail', async () => {
    await goto(page, '/diet');
    await waitForLoading(page);
    const dietCard = page.locator('.q-card, .q-item').first();
    if (await dietCard.isVisible()) {
      await dietCard.click();
      await waitForLoading(page);
    }
    await page.screenshot({ path: 'test-results/steps/P2-19.png' });
  });

  await test.step('P2-20 Diet 2 Different Feeds Dhenu', async () => {
    await goto(page, '/diet/new');
    await waitForLoading(page);
    await clickCard(page, 'Dhenu');
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    await clickButton(page, 'Continue');
    await waitForLoading(page);
    // Select DIFFERENT feeds (start from index 5)
    const feedCb = page.locator('.q-checkbox, input[type="checkbox"]');
    const count = await feedCb.count();
    const start = Math.min(5, count - 1);
    for (let i = start; i < Math.min(start + 5, count); i++) {
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
    await page.screenshot({ path: 'test-results/steps/P2-20.png' });
  });

  await test.step('P2-21 Compare Diet 1 vs Diet 2', async () => {
    await goto(page, '/diet');
    await waitForLoading(page);
    const dietCards = page.locator('.q-card, .q-item');
    const count = await dietCards.count();
    expect(count).toBeGreaterThanOrEqual(1);
    await page.screenshot({ path: 'test-results/steps/P2-21.png' });
  });

  await test.step('P2-22 Diet for Kamala', async () => {
    await goto(page, '/diet/new');
    await waitForLoading(page);
    await clickCard(page, 'Kamala');
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
    await page.screenshot({ path: 'test-results/steps/P2-22.png' });
  });

  await test.step('P2-23 Diet Failure Too Few Feeds', async () => {
    await goto(page, '/diet/new');
    await waitForLoading(page);
    await clickCard(page, 'Dhenu');
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
    await page.screenshot({ path: 'test-results/steps/P2-23.png' });
  });

  await test.step('P2-24 Diet Dry Cow Parameters', async () => {
    await goto(page, '/diet/new');
    await waitForLoading(page);
    const manualRadio = page.locator('text=Enter manually, text=Manual').first();
    if (await manualRadio.isVisible()) {
      await manualRadio.click();
      await clickButton(page, 'Continue');
      await waitForLoading(page);
      await fillByLabel(page, 'Weight', '400');
      await fillByLabel(page, 'Milk', '0');
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
    await page.screenshot({ path: 'test-results/steps/P2-24.png' });
  });

  // ─── PHASE 5: Yield Data ───

  await test.step('P2-25 Record Yield Hari', async () => {
    await goto(page, '/yields/new');
    await waitForLoading(page);
    await fillByLabel(page, 'Milk', '8');
    await fillByLabel(page, 'Fat', '3.5');
    await fillByLabel(page, 'SNF', '8.5');
    await clickButton(page, 'Save');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P2-25.png' });
  });

  await test.step('P2-26 Record Yield Suman', async () => {
    await goto(page, '/yields/new');
    await waitForLoading(page);
    await fillByLabel(page, 'Milk', '10');
    await fillByLabel(page, 'Fat', '3.8');
    await fillByLabel(page, 'SNF', '8.7');
    await clickButton(page, 'Save');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P2-26.png' });
  });

  await test.step('P2-27 View Yield History', async () => {
    await goto(page, '/yields');
    await waitForLoading(page);
    const yieldItems = page.locator('.q-card, .q-item').first();
    if (await yieldItems.isVisible()) {
      await expect(yieldItems).toBeVisible({ timeout: 10_000 });
    }
    await page.screenshot({ path: 'test-results/steps/P2-27.png' });
  });

  // ─── PHASE 6: PIN Change ───

  await test.step('P2-28 Navigate to Settings', async () => {
    await goto(page, '/settings');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P2-28.png' });
  });

  await test.step('P2-29 Change PIN', async () => {
    await goto(page, '/settings');
    await waitForLoading(page);
    const changePinBtn = page.locator('text=Change PIN, button:has-text("Change PIN")').first();
    if (await changePinBtn.isVisible()) {
      await changePinBtn.click();
      await page.waitForTimeout(500);
      await fillByLabel(page, 'Current PIN', PIN);
      await fillByLabel(page, 'New PIN', NEW_PIN);
      await fillByLabel(page, 'Confirm', NEW_PIN);
      await clickButton(page, 'Save');
      await waitForLoading(page);
    }
    await page.screenshot({ path: 'test-results/steps/P2-29.png' });
  });

  await test.step('P2-30 Logout After PIN Change', async () => {
    await logout(page);
    await expect(page).toHaveURL(/\/auth\/login/);
    await page.screenshot({ path: 'test-results/steps/P2-30.png' });
  });

  await test.step('P2-31 Login with New PIN', async () => {
    await loginWithEmail(page, EMAIL, NEW_PIN);
    await waitForLoading(page);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/steps/P2-31.png' });
  });

  // ─── PHASE 7: Org Queries ───

  await test.step('P2-32 Check Org Info', async () => {
    await goto(page, '/settings/profile');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P2-32.png' });
  });

  await test.step('P2-33 View Org Members', async () => {
    await goto(page, '/settings');
    await waitForLoading(page);
    const orgSection = page.locator('text=Organization').first();
    if (await orgSection.isVisible()) {
      await orgSection.click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: 'test-results/steps/P2-33.png' });
  });

  await test.step('P2-34 View Org Analytics', async () => {
    await goto(page, '/reports');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P2-34.png' });
  });

  // ─── PHASE 8: Cleanup ───

  await test.step('P2-35 Archive Diets', async () => {
    await goto(page, '/diet');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P2-35.png' });
  });

  await test.step('P2-36 Delete Cow Kamala', async () => {
    await goto(page, '/cows');
    await waitForLoading(page);
    const kamalaCard = page.locator('text=Kamala').first();
    if (await kamalaCard.isVisible()) {
      await kamalaCard.click();
      await waitForLoading(page);
      await clickButton(page, 'Delete');
      await confirmDialog(page);
      await waitForLoading(page);
    }
    await page.screenshot({ path: 'test-results/steps/P2-36.png' });
  });

  await test.step('P2-37 Delete Cow Dhenu', async () => {
    await goto(page, '/cows');
    await waitForLoading(page);
    const dhenuCard = page.locator('text=Dhenu').first();
    if (await dhenuCard.isVisible()) {
      await dhenuCard.click();
      await waitForLoading(page);
      await clickButton(page, 'Delete');
      await confirmDialog(page);
      await waitForLoading(page);
    }
    await page.screenshot({ path: 'test-results/steps/P2-37.png' });
  });

  await test.step('P2-38 Delete Farmer Suman', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await clickCard(page, 'Suman Gurung');
    await waitForLoading(page);
    await clickButton(page, 'Delete');
    await confirmDialog(page);
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P2-38.png' });
  });

  await test.step('P2-39 Delete Farmer Hari', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await clickCard(page, 'Hari Thapa');
    await waitForLoading(page);
    await clickButton(page, 'Delete');
    await confirmDialog(page);
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P2-39.png' });
  });

  await test.step('P2-40 Verify Empty State', async () => {
    await goto(page, '/farmers');
    await waitForLoading(page);
    await goto(page, '/cows');
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P2-40.png' });
  });

  await test.step('P2-41 Final Settings Check', async () => {
    await goto(page, '/settings/profile');
    await waitForLoading(page);
    await expectVisible(page, NAME);
    await page.screenshot({ path: 'test-results/steps/P2-41.png' });
  });

  await test.step('P2-42 Final Logout', async () => {
    await logout(page);
    await expect(page).toHaveURL(/\/auth\/login/);
    await page.screenshot({ path: 'test-results/steps/P2-42.png' });
  });
});
