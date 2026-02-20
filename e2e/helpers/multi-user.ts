import { type Browser, type BrowserContext, type Page, devices } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  goto, waitForLoading, waitForRoute,
  toggleToPhone, selectOption, clickButton,
  clickCard, clickOnboardingAction,
  fillByLabel,
} from './actions';

// ─── Types ───

export interface Actor {
  name: string;
  context: BrowserContext;
  page: Page;
}

export interface RegisterOpts {
  phone: string;
  pin: string;
  fullName: string;
  country: string;
  role: string;       // 'Farmer' | 'Extension Worker' | etc.
  org: string | null;  // null = 'Not Affiliated'
}

// ─── Actor Lifecycle ───

const pixel7 = devices['Pixel 7'];

export async function createActor(browser: Browser, name: string): Promise<Actor> {
  const context = await browser.newContext({
    ...pixel7,
    locale: 'en-US',
  });
  const page = await context.newPage();
  return { name, context, page };
}

export async function snap(actor: Actor, stepId: string): Promise<void> {
  const dir = path.join('test-results', 'integration', actor.name);
  fs.mkdirSync(dir, { recursive: true });
  await actor.page.screenshot({ path: path.join(dir, `${stepId}.png`) });
}

export async function closeActor(actor: Actor): Promise<void> {
  await actor.context.close();
}

// ─── Auth Flows ───

/** Login as phone user (pre-existing account) with conditional onboarding. */
export async function loginAsAdmin(actor: Actor, phone: string, pin: string, country = 'India') {
  const { page } = actor;
  await goto(page, '/auth/login');
  await waitForLoading(page);
  await toggleToPhone(page);
  await page.waitForTimeout(300);

  await selectOption(page, 'Country', country);
  await page.waitForTimeout(300);

  const phoneInput = page.getByRole('textbox', { name: 'Phone Number' }).first();
  await phoneInput.click();
  await phoneInput.fill(phone);

  const pinInput = page.getByRole('textbox', { name: /PIN/i }).first();
  await pinInput.click();
  await pinInput.fill(pin);

  await clickButton(page, 'Login');
  await waitForLoading(page);
  await page.waitForTimeout(3000);

  // Conditional onboarding (profile may or may not exist)
  await handleOnboarding(page, 'Extension Worker', null);
}

/** Register a new user and complete onboarding. */
export async function registerAndOnboard(actor: Actor, opts: RegisterOpts) {
  const { page } = actor;

  // Inline registration for more control (registerWithPhone has short timeouts)
  await goto(page, '/auth/register');
  await waitForLoading(page);
  await page.waitForTimeout(500);

  await fillByLabel(page, 'Full Name', opts.fullName);
  await selectOption(page, 'Country', opts.country);
  await page.waitForTimeout(300);

  await toggleToPhone(page);
  await page.waitForTimeout(500);

  const phoneInput = page.getByRole('textbox', { name: 'Phone Number' }).first();
  await phoneInput.click();
  await phoneInput.fill(opts.phone);

  await fillByLabel(page, 'Create a 4-digit PIN', opts.pin);
  await fillByLabel(page, 'Confirm PIN', opts.pin);

  await clickButton(page, 'Create Account');
  // Wait longer for registration API call
  await page.waitForTimeout(5000);
  await waitForLoading(page);

  await handleOnboarding(page, opts.role, opts.org);
}

/** Handle onboarding steps conditionally (each step may be skipped). */
async function handleOnboarding(page: Page, role: string, org: string | null) {
  // Role selection
  if (page.url().includes('/auth/role')) {
    await waitForLoading(page);
    await clickCard(page, role);
    await clickOnboardingAction(page);
    await page.waitForTimeout(2000);
  }

  // Organization selection
  if (page.url().includes('/auth/organization')) {
    await waitForLoading(page);
    await clickCard(page, org || 'Not Affiliated');
    await clickOnboardingAction(page);
    await page.waitForTimeout(2000);
  }

  // Profile setup (may be skipped)
  if (page.url().includes('/auth/profile-setup')) {
    await waitForLoading(page);
    await clickOnboardingAction(page);
    await page.waitForTimeout(2000);
  }

  await waitForLoading(page);
}

/** Logout via the left drawer (mobile viewport). */
export async function logoutActor(actor: Actor) {
  const { page } = actor;
  await goto(page, '/');
  await waitForLoading(page);

  const menuBtn = page.locator('.q-header button:has-text("menu"), .q-header button[aria-label="Menu"]').first();
  if (await menuBtn.isVisible().catch(() => false)) {
    await menuBtn.click();
    await page.waitForTimeout(500);
  }

  const logoutItem = page.locator('.q-drawer .q-item:has-text("Logout"), .q-drawer .q-item:has-text("Log out")').first();
  await logoutItem.waitFor({ state: 'visible', timeout: 5_000 });
  await logoutItem.click();
  await page.waitForTimeout(500);

  await waitForRoute(page, '/auth/login');
}
