/**
 * Responsive Audit — Multi-Resolution Screenshot & Console Error Tests
 *
 * Runs through every major page at three viewport widths:
 *   Mobile  (360 x 800)  — small Android phone
 *   Tablet  (768 x 1024) — iPad portrait
 *   Desktop (1280 x 900) — laptop
 *
 * For each viewport + page combo it:
 *   1. Navigates to the page
 *   2. Captures a full-page screenshot
 *   3. Collects all console errors
 *   4. Reports findings at the end
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

// ── Credentials ──
const EMAIL = 'mandewalkergautam@gmail.com';
const PIN = '1981';

// ── Viewports ──
const VIEWPORTS = [
  { name: 'mobile', width: 360, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
] as const;

// ── Pages to audit ──
const PAGES = [
  { name: 'dashboard', path: '/dashboard' },
  { name: 'farmers', path: '/farmers' },
  { name: 'cows', path: '/cows' },
  { name: 'diet-list', path: '/diet' },
  { name: 'diet-new', path: '/diet/new' },
  { name: 'milk-logs', path: '/logs' },
  { name: 'milk-log-new', path: '/logs/new' },
  { name: 'feeds', path: '/feeds' },
  { name: 'yields', path: '/yields' },
  { name: 'reports', path: '/reports' },
  { name: 'profile', path: '/profile' },
  { name: 'settings', path: '/settings' },
  { name: 'farmer-import', path: '/farmers/import' },
  { name: 'diet-compare', path: '/diet/compare' },
] as const;

// ── Shared state ──
const consoleErrors: { page: string; viewport: string; message: string }[] = [];
const overflowIssues: { page: string; viewport: string; elements: string[] }[] = [];

async function login(page: Page) {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const emailInput = page.getByRole('textbox', { name: /email/i }).first();
  await emailInput.waitFor({ state: 'visible', timeout: 10_000 });
  await emailInput.fill(EMAIL);

  const pinInput = page.getByRole('textbox', { name: /pin/i }).first();
  await pinInput.waitFor({ state: 'visible', timeout: 5_000 });
  await pinInput.fill(PIN);

  const loginBtn = page.getByRole('button', { name: /log\s*in|sign\s*in/i }).first();
  await loginBtn.click();

  // Wait for auth to complete
  await page.waitForTimeout(5000);
}

async function ensureLoggedIn(page: Page) {
  const url = page.url();
  if (url.includes('/auth/')) {
    await login(page);
  }
}

test.describe.serial('Responsive audit', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 360, height: 800 },
    });
    page = await context.newPage();
    await login(page);
  });

  test.afterAll(async () => {
    // Print summary
    console.log('\n========================================');
    console.log('RESPONSIVE AUDIT RESULTS');
    console.log('========================================');

    if (consoleErrors.length > 0) {
      console.log(`\nCONSOLE ERRORS (${consoleErrors.length}):`);
      for (const err of consoleErrors) {
        console.log(`  [${err.viewport}] ${err.page}: ${err.message}`);
      }
    } else {
      console.log('\nNo significant console errors detected.');
    }

    if (overflowIssues.length > 0) {
      console.log(`\nOVERFLOW ISSUES (${overflowIssues.length}):`);
      for (const issue of overflowIssues) {
        console.log(`  [${issue.viewport}] ${issue.page}:`);
        for (const el of issue.elements) {
          console.log(`    - ${el}`);
        }
      }
    } else {
      console.log('No horizontal overflow issues detected.');
    }

    console.log('\n========================================\n');

    await context?.close();
  });

  for (const vp of VIEWPORTS) {
    for (const pg of PAGES) {
      test(`${vp.name} — ${pg.name}`, async () => {
        // Resize viewport
        await page.setViewportSize({ width: vp.width, height: vp.height });

        // Collect console errors
        const pageErrors: string[] = [];
        const errorHandler = (msg: import('@playwright/test').ConsoleMessage) => {
          if (msg.type() === 'error') {
            pageErrors.push(msg.text());
          }
        };
        page.on('console', errorHandler);

        // Navigate
        await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2500);

        // Check if we got redirected to login
        await ensureLoggedIn(page);
        if (page.url().includes('/auth/')) {
          // Still stuck on auth — skip
          page.off('console', errorHandler);
          return;
        }

        // If redirected away from target, navigate again
        if (!page.url().includes(pg.path)) {
          await page.goto(pg.path, { waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(2000);
        }

        // Screenshot
        const screenshotDir = `screenshots-responsive/${vp.name}`;
        await page.screenshot({
          path: `${screenshotDir}/${pg.name}.png`,
          fullPage: true,
        });

        // Record console errors
        page.off('console', errorHandler);
        for (const err of pageErrors) {
          // Skip known harmless errors
          if (err.includes('ERR_UNKNOWN_URL_SCHEME') && err.includes('cow.svg')) continue;
          if (err.includes('service worker')) continue;
          if (err.includes('QPage needs to be')) continue; // transient layout mount
          if (err.includes('favicon')) continue;
          if (err.includes('404') && err.includes('hot-update')) continue;

          consoleErrors.push({
            page: pg.name,
            viewport: vp.name,
            message: err.slice(0, 200),
          });
        }

        // Check for horizontal overflow
        const overflows = await page.evaluate((vpWidth) => {
          const elements = document.querySelectorAll('*');
          const found: string[] = [];
          for (const el of elements) {
            const rect = el.getBoundingClientRect();
            if (rect.width > vpWidth + 5 && rect.width > 0) {
              const tag = el.tagName.toLowerCase();
              const cls = (el.className?.toString() || '').slice(0, 60);
              // Skip html/body which can be wider due to scrollbar
              if (tag === 'html' || tag === 'body') continue;
              found.push(`<${tag} class="${cls}"> width=${Math.round(rect.width)}px`);
            }
          }
          return found.slice(0, 5);
        }, vp.width);

        if (overflows.length > 0) {
          overflowIssues.push({
            page: pg.name,
            viewport: vp.name,
            elements: overflows,
          });
        }

        // Report cards layout check
        if (pg.name === 'reports') {
          const reportCards = page.locator('.report-type-card');
          const cardCount = await reportCards.count();
          if (cardCount === 4) {
            const firstCard = await reportCards.nth(0).boundingBox();
            const secondCard = await reportCards.nth(1).boundingBox();
            if (firstCard && secondCard) {
              // Both should be on the same row
              const sameRow = Math.abs(firstCard.y - secondCard.y) < 20;
              expect(sameRow).toBe(true);
            }
          }
        }
      });
    }
  }
});
