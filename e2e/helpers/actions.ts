import { type Page, expect } from '@playwright/test';

const RUN_STAMP = Date.now().toString().slice(-6);

/** Generate a unique test email for this run */
export function testEmail(prefix: string): string {
  return `${prefix}_e2e_${RUN_STAMP}@test.rationsmart.org`;
}

/** Generate a unique phone (last 6 digits from timestamp) */
export function testPhone(base: string): string {
  return base.replace('XXXXXX', RUN_STAMP);
}

// --------------- Navigation helpers ---------------

export async function goto(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
}

export async function waitForRoute(page: Page, path: string) {
  await page.waitForURL(`**${path}`, { timeout: 15_000 });
}

// --------------- Form helpers ---------------

/**
 * Fill a Quasar q-input by its accessible name (the floating label text).
 * Tries textbox first, then spinbutton (number inputs), then placeholder fallback.
 */
export async function fillByLabel(page: Page, label: string, value: string) {
  // Try textbox role first
  let input = page.getByRole('textbox', { name: label, exact: false });
  let count = await input.count();
  if (count === 0) {
    // Try spinbutton role (number inputs)
    input = page.getByRole('spinbutton', { name: label, exact: false });
    count = await input.count();
  }
  if (count === 0) {
    // Fallback: find by placeholder or label text in DOM
    input = page.locator(`input[placeholder*="${label}" i], textarea[placeholder*="${label}" i]`).first();
  } else {
    input = input.first();
  }
  await input.waitFor({ state: 'visible', timeout: 8_000 });
  await input.click();
  await input.fill(value);
}

/** Fill a Quasar q-input that's inside a specific container */
export async function fillInput(page: Page, selector: string, value: string) {
  const input = page.locator(selector).first();
  await input.waitFor({ state: 'visible', timeout: 5_000 });
  await input.click();
  await input.fill(value);
}

/** Click a Quasar q-select (combobox) and pick an option by visible text */
export async function selectOption(page: Page, selectLabel: string, optionText: string) {
  // Use combobox role which is what Quasar q-select renders
  let select = page.getByRole('combobox', { name: selectLabel, exact: false });
  const count = await select.count();
  if (count === 0) {
    select = page.locator(`label:has-text("${selectLabel}"), [aria-label="${selectLabel}"]`).first();
  } else {
    select = select.first();
  }
  await select.click();
  await page.waitForTimeout(500);
  // Options appear in a portal/popup
  const option = page.locator(`.q-item:has-text("${optionText}"), [role="option"]:has-text("${optionText}"), .q-menu .q-item:has-text("${optionText}")`).first();
  await option.waitFor({ state: 'visible', timeout: 8_000 });
  await option.click();
  await page.waitForTimeout(300);
}

/** Click a button by its visible text */
export async function clickButton(page: Page, text: string) {
  // Build candidate list: exact text first, then common alternatives
  const candidates = [text];
  if (text === 'Save') {
    // App uses "Update Cow", "Update Farmer", etc. instead of generic "Save"
    candidates.push('Update Cow', 'Update Farmer', 'Update');
  }

  for (const candidate of candidates) {
    const btn = page.getByRole('button', { name: candidate, exact: false }).first();
    const count = await btn.count();
    if (count > 0 && await btn.isVisible().catch(() => false)) {
      await btn.click();
      return;
    }
    const fallback = page.locator(`button:has-text("${candidate}")`).first();
    const fbCount = await fallback.count();
    if (fbCount > 0 && await fallback.isVisible().catch(() => false)) {
      await fallback.click();
      return;
    }
  }

  // Final fallback: wait for first candidate
  const btn = page.getByRole('button', { name: text, exact: false }).first();
  await btn.waitFor({ state: 'visible', timeout: 8_000 });
  await btn.click();
}

/**
 * Click the primary action button in onboarding steps (Next/Done).
 * Handles i18n — the button text may be translated to Hindi, Nepali, Amharic, etc.
 * The action button is always the LAST visible button in the onboarding layout.
 */
export async function clickOnboardingAction(page: Page) {
  // The onboarding pages always have the action button (Next/Done) as the last button.
  // It may be disabled until a card is selected — wait for it to be enabled.
  const lastBtn = page.locator('button:visible').last();
  await lastBtn.waitFor({ state: 'visible', timeout: 8_000 });
  // Wait up to 5s for the button to become enabled
  await expect(lastBtn).toBeEnabled({ timeout: 5_000 });
  await lastBtn.click();
}

/** Click a card/item containing the given text */
export async function clickCard(page: Page, text: string) {
  const card = page.locator(`.q-card:has-text("${text}"), .q-item:has-text("${text}"), [class*="card"]:has-text("${text}"), [role="listitem"]:has-text("${text}")`).first();
  const count = await card.count();
  if (count > 0) {
    await card.waitFor({ state: 'visible', timeout: 8_000 });
    await card.click();
  } else {
    // Broadened fallback: find any visible element containing the text and click it
    const fallback = page.getByText(text, { exact: false }).first();
    await fallback.waitFor({ state: 'visible', timeout: 8_000 });
    await fallback.click();
  }
}

/**
 * Click a card by icon name (Material Design icon text in the DOM).
 * Useful when UI text is translated but icons remain consistent.
 * Maps common role names to their icon identifiers.
 */
const ROLE_ICON_MAP: Record<string, string> = {
  'Farmer': 'agriculture',
  'Student': 'school',
  'Extension Worker': 'groups',
  'Nutritionist': 'science',
  'Researcher': 'biotech',
  'Feed Supplier': 'storefront',
};

export async function clickRoleCard(page: Page, role: string) {
  // Try English text first
  const textMatch = page.getByText(role, { exact: false }).first();
  if (await textMatch.count() > 0 && await textMatch.isVisible()) {
    await textMatch.click();
    return;
  }
  // Fallback: find by icon name (icons are language-independent)
  const icon = ROLE_ICON_MAP[role];
  if (icon) {
    const iconEl = page.getByText(icon, { exact: true }).first();
    if (await iconEl.count() > 0) {
      // Click the parent card (the clickable container)
      await iconEl.locator('..').click();
      return;
    }
  }
  // Last resort: try clickCard
  await clickCard(page, role);
}

/** Click the FAB (floating action button) */
export async function clickFab(page: Page) {
  const fab = page.locator('.q-fab, .q-btn--fab, [class*="fab"]').first();
  await fab.waitFor({ state: 'visible', timeout: 5_000 });
  await fab.click();
}

/** Toggle to Phone Number mode on auth pages */
export async function toggleToPhone(page: Page) {
  const phoneBtn = page.getByRole('button', { name: 'Phone Number', exact: false }).first();
  await phoneBtn.click();
  await page.waitForTimeout(300);
}

/** Toggle to Email mode on auth pages */
export async function toggleToEmail(page: Page) {
  const emailBtn = page.getByRole('button', { name: 'Email', exact: false }).first();
  await emailBtn.click();
  await page.waitForTimeout(300);
}

/** Tap a bottom nav tab by its label */
export async function tapBottomNav(page: Page, label: string) {
  const tab = page.locator(`.q-tab:has-text("${label}"), [role="tab"]:has-text("${label}")`).first();
  await tab.waitFor({ state: 'visible', timeout: 5_000 });
  await tab.click();
  await page.waitForTimeout(500);
}

/** Wait for a toast/notification message */
export async function expectToast(page: Page, text: string) {
  const toast = page.locator(`.q-notification:has-text("${text}"), .q-banner:has-text("${text}")`).first();
  await toast.waitFor({ state: 'visible', timeout: 10_000 });
}

/** Check page contains text */
export async function expectVisible(page: Page, text: string) {
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible({ timeout: 10_000 });
}

/** Wait for loading to finish (spinners gone) */
export async function waitForLoading(page: Page) {
  await page.waitForTimeout(500);
  const spinner = page.locator('.q-spinner, .q-loading, .q-inner-loading').first();
  if (await spinner.isVisible()) {
    await spinner.waitFor({ state: 'hidden', timeout: 30_000 });
  }
}

/** Confirm a dialog (click OK/Yes/Confirm/Delete) */
export async function confirmDialog(page: Page) {
  await page.waitForTimeout(300);
  const confirmBtn = page.locator('.q-dialog button:has-text("OK"), .q-dialog button:has-text("Yes"), .q-dialog button:has-text("Confirm"), .q-dialog button:has-text("Delete")').first();
  await confirmBtn.waitFor({ state: 'visible', timeout: 5_000 });
  await confirmBtn.click();
  await page.waitForTimeout(500);
}

// --------------- Composite flows ---------------

interface RegisterPhoneData {
  name: string;
  countryName: string;
  phone: string;
  pin: string;
}

export async function registerWithPhone(page: Page, data: RegisterPhoneData) {
  await goto(page, '/auth/register');
  await waitForLoading(page);

  // Country is pre-selected as India by default — only change if needed
  // Fill name first (it's visible by default in email mode)
  await fillByLabel(page, 'Full Name', data.name);

  // Switch to phone mode
  await toggleToPhone(page);
  await page.waitForTimeout(500);

  // Fill phone number
  const phoneInput = page.getByRole('textbox', { name: 'Phone Number' }).first();
  await phoneInput.click();
  await phoneInput.fill(data.phone);

  // Fill PIN fields (Quasar labels: "Create a 4-digit PIN", "Confirm PIN")
  await fillByLabel(page, 'Create a 4-digit PIN', data.pin);
  await fillByLabel(page, 'Confirm PIN', data.pin);

  await clickButton(page, 'Create Account');
  await waitForRoute(page, '/auth/language');
}

interface RegisterEmailData {
  name: string;
  countryName: string;
  email: string;
  pin: string;
}

export async function registerWithEmail(page: Page, data: RegisterEmailData) {
  await goto(page, '/auth/register');
  await waitForLoading(page);

  // Select country if not default
  if (data.countryName !== 'India') {
    await selectOption(page, 'Country', data.countryName);
    await page.waitForTimeout(300);
  }

  await fillByLabel(page, 'Full Name', data.name);

  // Email mode is the default, but ensure it's selected
  const emailToggle = page.getByRole('button', { name: 'Email', exact: false }).first();
  if (await emailToggle.isVisible()) {
    await emailToggle.click();
    await page.waitForTimeout(300);
  }

  await fillByLabel(page, 'Email', data.email);
  await fillByLabel(page, 'Create a 4-digit PIN', data.pin);
  await fillByLabel(page, 'Confirm PIN', data.pin);

  await clickButton(page, 'Create Account');
  await waitForRoute(page, '/auth/language');
}

export async function loginWithPhone(page: Page, countryName: string, phone: string, pin: string) {
  await goto(page, '/auth/login');
  await waitForLoading(page);
  await toggleToPhone(page);
  await page.waitForTimeout(300);

  if (countryName !== 'India') {
    await selectOption(page, 'Country', countryName);
  }

  const phoneInput = page.getByRole('textbox', { name: 'Phone Number' }).first();
  await phoneInput.click();
  await phoneInput.fill(phone);

  // Login page PIN label may differ from register
  const pinInput = page.getByRole('textbox', { name: /PIN/i }).first();
  await pinInput.click();
  await pinInput.fill(pin);

  await clickButton(page, 'Login');
}

export async function loginWithEmail(page: Page, email: string, pin: string) {
  await goto(page, '/auth/login');
  await waitForLoading(page);

  // Email mode should be default, but click to ensure
  const emailToggle = page.getByRole('button', { name: 'Email', exact: false }).first();
  if (await emailToggle.isVisible()) {
    await emailToggle.click();
    await page.waitForTimeout(300);
  }

  await fillByLabel(page, 'Email', email);

  const pinInput = page.getByRole('textbox', { name: /PIN/i }).first();
  await pinInput.click();
  await pinInput.fill(pin);

  await clickButton(page, 'Login');
}

export async function completeOnboarding(
  page: Page,
  language: string,
  role: string,
  org: string | null,
) {
  // Step 1: Language
  await waitForRoute(page, '/auth/language');
  await waitForLoading(page);
  await clickCard(page, language);
  await clickOnboardingAction(page);

  // Step 2: Role
  await waitForRoute(page, '/auth/role');
  await waitForLoading(page);
  await clickCard(page, role);
  await clickOnboardingAction(page);

  // Step 3: Organization
  await waitForRoute(page, '/auth/organization');
  await waitForLoading(page);
  if (org) {
    await clickCard(page, org);
  } else {
    await clickCard(page, 'Not Affiliated');
  }
  await clickOnboardingAction(page);

  // Step 4: Profile Setup
  await waitForRoute(page, '/auth/profile-setup');
  await waitForLoading(page);
  await clickOnboardingAction(page);

  // Should land on dashboard
  await waitForRoute(page, '/');
  await waitForLoading(page);
}

export async function logout(page: Page) {
  await tapBottomNav(page, 'More');
  await page.waitForTimeout(500);
  await clickButton(page, 'Logout');
  await page.waitForTimeout(300);
  await confirmDialog(page);
  await waitForRoute(page, '/auth/login');
}

interface CowData {
  name: string;
  breed: string;
  weight: string;
  milkYield: string;
  lactationStage?: string;
  daysInMilk?: string;
}

export async function addCow(page: Page, cow: CowData) {
  // Try direct "Add Cow" button first (empty state), then FAB menu
  const addBtn = page.getByRole('button', { name: 'Add Cow', exact: false }).first();
  if (await addBtn.count() > 0 && await addBtn.isVisible()) {
    await addBtn.click();
  } else {
    // Click the FAB to open menu, then click "Add Cow" from the menu
    await clickFab(page);
    await page.waitForTimeout(300);
    const menuItem = page.getByText('Add Cow', { exact: false }).first();
    await menuItem.waitFor({ state: 'visible', timeout: 5_000 });
    await menuItem.click();
  }
  await page.waitForTimeout(500);
  await waitForLoading(page);

  await fillByLabel(page, 'Cow Name', cow.name);
  await selectOption(page, 'Breed', cow.breed);
  await fillByLabel(page, 'Weight', cow.weight);
  await fillByLabel(page, 'Daily Yield', cow.milkYield);

  if (cow.lactationStage) {
    await selectOption(page, 'Lactation Stage', cow.lactationStage);
  }

  await clickButton(page, 'Add Cow');
  await waitForLoading(page);
  await page.waitForTimeout(1000);
}

interface FarmerData {
  name: string;
  phone: string;
  village: string;
  district: string;
  state: string;
  cattle: string;
  farmingType: string;
}

export async function addFarmer(page: Page, farmer: FarmerData) {
  // Navigate directly to the add farmer form (the person_add FAB just does router.push)
  await page.goto('/farmers/new', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  await waitForLoading(page);

  await fillByLabel(page, 'Farmer Name', farmer.name);

  const phoneInput = page.locator('input[type="tel"]').first();
  if (await phoneInput.isVisible()) {
    await phoneInput.click();
    await phoneInput.fill(farmer.phone);
  }

  await fillByLabel(page, 'Village', farmer.village);
  await fillByLabel(page, 'District', farmer.district);
  await fillByLabel(page, 'State', farmer.state);
  await fillByLabel(page, 'Total Cattle', farmer.cattle);
  await selectOption(page, 'Farming Type', farmer.farmingType);

  await clickButton(page, 'Add Farmer');
  await waitForLoading(page);
  await page.waitForTimeout(1000);
}
