import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const BASE = 'http://localhost:9001';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots-audit');
const EMAIL = 'mandewalkergautam@gmail.com';
const PIN = '1981';

(async () => {
  // Clean/create screenshots directory
  if (fs.existsSync(SCREENSHOTS_DIR)) {
    fs.rmSync(SCREENSHOTS_DIR, { recursive: true });
  }
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  let shotNum = 0;
  async function screenshot(name: string) {
    shotNum++;
    const num = String(shotNum).padStart(2, '0');
    const filepath = path.join(SCREENSHOTS_DIR, `${num}-${name}.png`);
    await page.waitForTimeout(800); // let animations settle
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`  [${num}] ${name}`);
  }

  // ============================================================
  // 1. LOGIN
  // ============================================================
  console.log('\n=== AUTH PAGES ===');
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle', timeout: 15000 });
  await screenshot('login');

  // Fill login form
  await page.fill('input[type="text"], input[aria-label="Email"]', EMAIL);
  await page.fill('input[type="password"]', PIN);

  // Click Login button
  const loginBtn = page.locator('button:has-text("Login"), .q-btn:has-text("Login")');
  await loginBtn.click();

  // Wait for navigation after login
  try {
    await page.waitForURL('**/home**', { timeout: 15000 });
    console.log('  Login successful, redirected to home');
  } catch {
    // Might redirect to onboarding or other page
    console.log(`  After login, URL: ${page.url()}`);
    await screenshot('post-login');
  }

  // ============================================================
  // 2. DASHBOARD / HOME
  // ============================================================
  console.log('\n=== DASHBOARD ===');
  await page.goto(`${BASE}/home`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000); // wait for data to load
  await screenshot('dashboard-managed');

  // Check if there's a Personal tab
  const personalTab = page.locator('.q-btn-toggle .q-btn:has-text("Personal")');
  if (await personalTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await personalTab.click();
    await page.waitForTimeout(1500);
    await screenshot('dashboard-personal');

    // Switch back to managed
    const managedTab = page.locator('.q-btn-toggle .q-btn:has-text("My Farmers")');
    if (await managedTab.isVisible({ timeout: 1000 }).catch(() => false)) {
      await managedTab.click();
      await page.waitForTimeout(500);
    }
  }

  // ============================================================
  // 3. FARMERS
  // ============================================================
  console.log('\n=== FARMERS ===');
  await page.goto(`${BASE}/farmers`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await screenshot('farmers-list');

  // ============================================================
  // 4. FARMER IMPORT
  // ============================================================
  console.log('\n=== FARMER IMPORT ===');
  await page.goto(`${BASE}/farmers/import`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  await screenshot('farmer-import');

  // ============================================================
  // 5. COWS
  // ============================================================
  console.log('\n=== COWS ===');
  await page.goto(`${BASE}/cows`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await screenshot('cows-list');

  // ============================================================
  // 6. MILK LOGS
  // ============================================================
  console.log('\n=== MILK LOGS ===');
  await page.goto(`${BASE}/logs`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await screenshot('logs-list');

  // ============================================================
  // 7. DIET
  // ============================================================
  console.log('\n=== DIET ===');
  await page.goto(`${BASE}/diet`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await screenshot('diet-list');

  // ============================================================
  // 8. FEEDS
  // ============================================================
  console.log('\n=== FEEDS ===');
  await page.goto(`${BASE}/feeds`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await screenshot('feeds-master');

  // Check for MyFeeds tab
  const myFeedsTab = page.locator('.q-tab:has-text("My Feeds"), .q-tab:has-text("Custom")');
  if (await myFeedsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
    await myFeedsTab.click();
    await page.waitForTimeout(1500);
    await screenshot('feeds-custom');
  }

  // ============================================================
  // 9. YIELDS
  // ============================================================
  console.log('\n=== YIELDS ===');
  await page.goto(`${BASE}/yields`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await screenshot('yields-list');

  // ============================================================
  // 10. ANALYTICS
  // ============================================================
  console.log('\n=== ANALYTICS ===');
  await page.goto(`${BASE}/analytics`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await screenshot('analytics');

  // ============================================================
  // 11. REPORTS
  // ============================================================
  console.log('\n=== REPORTS ===');
  await page.goto(`${BASE}/reports`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await screenshot('reports');

  // ============================================================
  // 12. SETTINGS
  // ============================================================
  console.log('\n=== SETTINGS ===');
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await screenshot('settings');

  // ============================================================
  // 13. NEW COW FORM
  // ============================================================
  console.log('\n=== FORMS ===');
  await page.goto(`${BASE}/cows/new`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await screenshot('cow-new-form');

  // ============================================================
  // 14. NEW LOG FORM
  // ============================================================
  await page.goto(`${BASE}/logs/new`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await screenshot('log-new-form');

  // ============================================================
  // 15. NEW DIET FORM
  // ============================================================
  await page.goto(`${BASE}/diet/new`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await screenshot('diet-new-form');

  // ============================================================
  // 16. DRAWER (side navigation)
  // ============================================================
  console.log('\n=== NAVIGATION ===');
  await page.goto(`${BASE}/home`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  // Click hamburger menu if present
  const menuBtn = page.locator('.q-btn:has(.q-icon:text("menu")), button[aria-label="Menu"]').first();
  if (await menuBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await menuBtn.click();
    await page.waitForTimeout(800);
    await screenshot('drawer-open');
    // Close drawer
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  }

  // ============================================================
  // 17. SYNC OPTIONS (if accessible)
  // ============================================================
  // Check for sync button in settings or header
  await page.goto(`${BASE}/settings`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  const syncBtn = page.locator('.q-item:has-text("Sync"), .q-btn:has-text("Sync")').first();
  if (await syncBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await syncBtn.click();
    await page.waitForTimeout(1000);
    await screenshot('sync-options');
    await page.keyboard.press('Escape');
  }

  // ============================================================
  // 18. FARMER NEW FORM
  // ============================================================
  await page.goto(`${BASE}/farmers/new`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await screenshot('farmer-new-form');

  // ============================================================
  // 19. YIELD NEW FORM
  // ============================================================
  await page.goto(`${BASE}/yields/new`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await screenshot('yield-new-form');

  // ============================================================
  // LIGHT MODE COMPARISON (key pages only)
  // ============================================================
  console.log('\n=== LIGHT MODE COMPARISON ===');
  // Switch to light mode
  await page.evaluate(`document.body.classList.remove('body--dark'); document.body.classList.add('body--light');`);

  await page.goto(`${BASE}/home`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  // Force light mode
  await page.evaluate(`document.body.classList.remove('body--dark'); document.body.classList.add('body--light');`);
  await page.waitForTimeout(500);
  await screenshot('LIGHT-dashboard');

  await page.goto(`${BASE}/farmers`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.evaluate(`document.body.classList.remove('body--dark'); document.body.classList.add('body--light');`);
  await page.waitForTimeout(500);
  await screenshot('LIGHT-farmers');

  await page.goto(`${BASE}/feeds`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.evaluate(`document.body.classList.remove('body--dark'); document.body.classList.add('body--light');`);
  await page.waitForTimeout(500);
  await screenshot('LIGHT-feeds');

  await browser.close();
  console.log(`\n✅ Done! ${shotNum} screenshots saved to e2e/screenshots-audit/`);
})();
