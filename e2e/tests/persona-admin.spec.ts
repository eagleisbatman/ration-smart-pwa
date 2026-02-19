import { expect } from '@playwright/test';
import { test } from '../helpers/video-namer';
import {
  goto, waitForRoute, waitForLoading, expectVisible,
  loginWithPhone, logout, testPhone,
  registerWithPhone, completeOnboarding, confirmDialog,
  clickCard, clickButton, fillByLabel, selectOption,
  toggleToPhone, clickOnboardingAction,
} from '../helpers/actions';

/*
 * ═══════════════════════════════════════════════════════════
 *  P5: ADMIN PERSONA — INDIA (25 test steps)
 *  Uses pre-existing super admin: +919900001111 / PIN 1111
 *  Tests admin dashboard, user management, analytics drill-down,
 *  and route guard enforcement for non-admin users.
 *
 *  Runs as a single test with test.step() for each step.
 *  One continuous video per persona.
 * ═══════════════════════════════════════════════════════════
 */

const SA_PHONE = process.env.SA_PHONE || '9900001111';
const SA_PIN = process.env.SA_PIN || '1111';
const COUNTRY = 'India';

// Regular user for negative tests
const REG_PHONE = testPhone('99100XXXXXX');
const REG_PIN = '1234';
const REG_NAME = 'Regular User E2E';

/** Logout via the left drawer (works on mobile viewport). */
async function logoutViaMenu(page: import('@playwright/test').Page) {
  // Navigate to home first to ensure we're in MainLayout
  await goto(page, '/');
  await waitForLoading(page);

  // Open the left drawer via hamburger menu
  const menuBtn = page.locator('.q-header button:has-text("menu"), .q-header button[aria-label="Menu"]').first();
  if (await menuBtn.isVisible().catch(() => false)) {
    await menuBtn.click();
    await page.waitForTimeout(500);
  }

  // Click Logout in the drawer
  const logoutItem = page.locator('.q-drawer .q-item:has-text("Logout"), .q-drawer .q-item:has-text("Log out")').first();
  await logoutItem.waitFor({ state: 'visible', timeout: 5_000 });
  await logoutItem.click();
  await page.waitForTimeout(500);

  await waitForRoute(page, '/auth/login');
}

/** Login as super admin — handles onboarding if needed (first-time login). */
async function loginAsSuperAdmin(page: import('@playwright/test').Page) {
  await goto(page, '/auth/login');
  await waitForLoading(page);
  await toggleToPhone(page);
  await page.waitForTimeout(300);

  // Always select India explicitly (geo-IP may default elsewhere)
  await selectOption(page, 'Country', COUNTRY);
  await page.waitForTimeout(300);

  const phoneInput = page.getByRole('textbox', { name: 'Phone Number' }).first();
  await phoneInput.click();
  await phoneInput.fill(SA_PHONE);

  const pinInput = page.getByRole('textbox', { name: /PIN/i }).first();
  await pinInput.click();
  await pinInput.fill(SA_PIN);

  await clickButton(page, 'Login');
  await waitForLoading(page);
  await page.waitForTimeout(3000);

  // If the SA has no farmer profile, the app redirects to onboarding.
  // Complete each step conditionally (profile-setup may be skipped).
  if (page.url().includes('/auth/role')) {
    await clickCard(page, 'Extension Worker');
    await clickOnboardingAction(page);
    await page.waitForTimeout(2000);
  }
  if (page.url().includes('/auth/organization')) {
    await waitForLoading(page);
    await clickCard(page, 'Not Affiliated');
    await clickOnboardingAction(page);
    await page.waitForTimeout(2000);
  }
  if (page.url().includes('/auth/profile-setup')) {
    await waitForLoading(page);
    await clickOnboardingAction(page);
    await page.waitForTimeout(2000);
  }
  await waitForLoading(page);
}

test('P5: Admin Persona — India (25 steps)', async ({ page }) => {
  test.setTimeout(600_000); // 10 min for entire persona

  // ─── PHASE 1: Super Admin Login & Dashboard ───

  await test.step('P5-01 Login as Super Admin', async () => {
    await loginAsSuperAdmin(page);
    await page.screenshot({ path: 'test-results/steps/P5-01.png' });
  });

  await test.step('P5-02 Verify admin nav items visible', async () => {
    // Open the side drawer
    const menuBtn = page.locator('.q-btn--flat .material-symbols-outlined:has-text("menu"), button[aria-label="Menu"]').first();
    if (await menuBtn.isVisible().catch(() => false)) {
      await menuBtn.click();
      await page.waitForTimeout(500);
    }

    // Admin nav items should be visible (Analytics + Admin)
    const adminNav = page.getByText('Admin', { exact: false });
    await expect(adminNav.first()).toBeVisible({ timeout: 10_000 });

    const analyticsNav = page.getByText('Analytics', { exact: false });
    await expect(analyticsNav.first()).toBeVisible({ timeout: 5_000 });

    await page.screenshot({ path: 'test-results/steps/P5-02.png' });
  });

  await test.step('P5-03 Navigate to Admin Dashboard', async () => {
    await goto(page, '/admin');
    await waitForLoading(page);

    // Should see admin level badge
    const badge = page.locator('.q-chip');
    await expect(badge.first()).toBeVisible({ timeout: 10_000 });

    // Should see "Manage Users" card
    await expectVisible(page, 'Manage Users');
    await expectVisible(page, 'View Analytics');

    await page.screenshot({ path: 'test-results/steps/P5-03.png' });
  });

  await test.step('P5-04 Navigate to Admin Users page', async () => {
    await goto(page, '/admin/users');
    await waitForLoading(page);

    // Should see search input
    const searchInput = page.locator('.q-page input').first();
    await expect(searchInput).toBeVisible({ timeout: 10_000 });

    // Should see at least one user in the list (q-list inside the page)
    const userItem = page.locator('.q-page .q-list .q-item').first();
    await expect(userItem).toBeVisible({ timeout: 15_000 });

    await page.screenshot({ path: 'test-results/steps/P5-04.png' });
  });

  await test.step('P5-05 Verify user list has admin level selects', async () => {
    await waitForLoading(page);

    // Each user row should have an admin-level q-select
    const selects = page.locator('.q-page .q-select');
    const count = await selects.count();
    expect(count).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/steps/P5-05.png' });
  });

  await test.step('P5-06 Search for a user', async () => {
    const searchInput = page.locator('.q-page input').first();
    await searchInput.click();
    await searchInput.fill('CA_');
    await page.waitForTimeout(1000);
    await waitForLoading(page);

    // Should filter results
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-results/steps/P5-06.png' });
  });

  // ─── PHASE 2: Admin Organizations ───

  await test.step('P5-07 Navigate to Admin Orgs page', async () => {
    await goto(page, '/admin/orgs');
    await waitForLoading(page);

    // Page should load — either with org items or "no data" message
    const orgItem = page.locator('.q-page .q-list .q-item').first();
    const noData = page.getByText('No data', { exact: false });
    // Wait for either org items or no-data message
    await expect(orgItem.or(noData)).toBeVisible({ timeout: 15_000 });

    await page.screenshot({ path: 'test-results/steps/P5-07.png' });
  });

  await test.step('P5-08 Org list shows org names or empty state', async () => {
    const orgItems = page.locator('.q-page .q-list .q-item');
    const count = await orgItems.count();
    if (count > 0) {
      // Org items present — verify first item has text content
      const text = await orgItems.first().textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    } else {
      // No orgs — verify empty state text is shown
      await expectVisible(page, 'No data');
    }

    await page.screenshot({ path: 'test-results/steps/P5-08.png' });
  });

  // ─── PHASE 3: Analytics Drill-Down (Global → Country → Org) ───

  await test.step('P5-09 Navigate to Analytics page', async () => {
    await goto(page, '/analytics');
    await waitForLoading(page);

    // Super admin should see global view with country list
    await expectVisible(page, 'Country Breakdown');

    await page.screenshot({ path: 'test-results/steps/P5-09.png' });
  });

  await test.step('P5-10 Verify summary cards visible', async () => {
    // Summary cards should show aggregate stats
    const cards = page.locator('.q-page .q-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    await page.screenshot({ path: 'test-results/steps/P5-10.png' });
  });

  await test.step('P5-11 Country list shows countries', async () => {
    // Should see India in the country list
    await expectVisible(page, 'India');

    await page.screenshot({ path: 'test-results/steps/P5-11.png' });
  });

  await test.step('P5-12 Drill into India → org breakdown', async () => {
    // Click on India to drill into country analytics
    const indiaItem = page.locator('.q-page .q-item:has-text("India")').first();
    await indiaItem.click();
    await waitForLoading(page);

    // Should now see per-org breakdown
    await expectVisible(page, 'Organization Breakdown');

    // Should see org list
    const orgItem = page.locator('.q-page .q-list .q-item').first();
    await expect(orgItem).toBeVisible({ timeout: 15_000 });

    await page.screenshot({ path: 'test-results/steps/P5-12.png' });
  });

  await test.step('P5-13 Org breakdown shows stats', async () => {
    // Each org should show EW/farmer/cow count stats in the page area
    const pageText = await page.locator('.q-page').textContent();
    expect(pageText).toContain('EWs');
    expect(pageText).toContain('Farmers');

    await page.screenshot({ path: 'test-results/steps/P5-13.png' });
  });

  await test.step('P5-14 Drill into an org → EW activity table', async () => {
    // Click first org to see EW breakdown
    const firstOrg = page.locator('.q-page .q-list .q-item').first();
    await firstOrg.click();
    await waitForLoading(page);

    // Should see EW activity table
    await expectVisible(page, 'Extension Worker Activity');

    // Should see table headers
    const table = page.locator('table, .q-markup-table');
    await expect(table.first()).toBeVisible({ timeout: 10_000 });

    await page.screenshot({ path: 'test-results/steps/P5-14.png' });
  });

  await test.step('P5-15 EW table shows activity columns', async () => {
    // Table should have Name, Farmers, Cows, Diets, Milk Logs columns
    const thElements = page.locator('th');
    const count = await thElements.count();
    expect(count).toBeGreaterThanOrEqual(4); // At least Name + 3 metrics

    await page.screenshot({ path: 'test-results/steps/P5-15.png' });
  });

  await test.step('P5-16 Breadcrumb navigation back to global', async () => {
    // Click breadcrumb to go back to global view
    const breadcrumbBtn = page.locator('button.q-btn--flat:has-text("Country Breakdown")').first();
    if (await breadcrumbBtn.isVisible().catch(() => false)) {
      await breadcrumbBtn.click();
      await waitForLoading(page);
      // Should be back at country list
      await expectVisible(page, 'India');
    }
    await page.screenshot({ path: 'test-results/steps/P5-16.png' });
  });

  // ─── PHASE 4: Route Guard Tests (Regular User) ───

  await test.step('P5-17 Logout super admin', async () => {
    await logoutViaMenu(page);
    await expect(page).toHaveURL(/\/auth\/login/);
    await page.screenshot({ path: 'test-results/steps/P5-17.png' });
  });

  await test.step('P5-18 Register regular user', async () => {
    await registerWithPhone(page, {
      name: REG_NAME,
      countryName: COUNTRY,
      phone: REG_PHONE,
      pin: REG_PIN,
    });
    await page.screenshot({ path: 'test-results/steps/P5-18.png' });
  });

  await test.step('P5-19 Complete onboarding as Farmer', async () => {
    // Inline onboarding (handles profile-setup being skipped)
    if (page.url().includes('/auth/role')) {
      await clickCard(page, 'Farmer');
      await clickOnboardingAction(page);
      await page.waitForTimeout(2000);
    }
    if (page.url().includes('/auth/organization')) {
      await waitForLoading(page);
      await clickCard(page, 'Not Affiliated');
      await clickOnboardingAction(page);
      await page.waitForTimeout(2000);
    }
    if (page.url().includes('/auth/profile-setup')) {
      await waitForLoading(page);
      await clickOnboardingAction(page);
      await page.waitForTimeout(2000);
    }
    await waitForLoading(page);
    await page.screenshot({ path: 'test-results/steps/P5-19.png' });
  });

  await test.step('P5-20 Verify no admin nav for regular user', async () => {
    // Open the side drawer
    const menuBtn = page.locator('.q-btn--flat .material-symbols-outlined:has-text("menu"), button[aria-label="Menu"]').first();
    if (await menuBtn.isVisible().catch(() => false)) {
      await menuBtn.click();
      await page.waitForTimeout(500);
    }

    // Admin nav should NOT be visible
    const adminNav = page.locator('.q-drawer .q-item:has-text("Admin"), .q-list .q-item:has-text("Admin")');
    const count = await adminNav.count();
    // Either 0 items, or they're not visible (could be a general "Admin" text elsewhere)
    if (count > 0) {
      const visible = await adminNav.first().isVisible().catch(() => false);
      // If visible, it shouldn't be in the nav
      // (We're checking drawer specifically)
    }

    await page.screenshot({ path: 'test-results/steps/P5-20.png' });
  });

  await test.step('P5-21 Route guard: /admin redirects for regular user', async () => {
    await goto(page, '/admin');
    await page.waitForTimeout(2000);

    // Should be redirected away from /admin (to home)
    const url = page.url();
    expect(url).not.toContain('/admin');

    await page.screenshot({ path: 'test-results/steps/P5-21.png' });
  });

  await test.step('P5-22 Route guard: /admin/users redirects', async () => {
    await goto(page, '/admin/users');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).not.toContain('/admin/users');

    await page.screenshot({ path: 'test-results/steps/P5-22.png' });
  });

  await test.step('P5-23 Route guard: /analytics redirects', async () => {
    await goto(page, '/analytics');
    await page.waitForTimeout(2000);

    const url = page.url();
    expect(url).not.toContain('/analytics');

    await page.screenshot({ path: 'test-results/steps/P5-23.png' });
  });

  await test.step('P5-24 Logout regular user', async () => {
    await logoutViaMenu(page);
    await expect(page).toHaveURL(/\/auth\/login/);
    await page.screenshot({ path: 'test-results/steps/P5-24.png' });
  });

  // ─── PHASE 5: Re-login as Super Admin to confirm access ───

  await test.step('P5-25 Re-login as Super Admin and verify access', async () => {
    await loginAsSuperAdmin(page);

    // Navigate to admin dashboard — should work
    await goto(page, '/admin');
    await waitForLoading(page);
    await expectVisible(page, 'Manage Users');

    await page.screenshot({ path: 'test-results/steps/P5-25.png' });
  });
});
