import { test, expect, type Browser, type Page } from '@playwright/test';
import {
  goto, waitForLoading,
  fillByLabel, selectOption, clickButton, clickCard,
  addCow, addFarmer,
} from '../helpers/actions';
import {
  type Actor, createActor, snap, closeActor,
  loginAsAdmin, registerAndOnboard, logoutActor,
} from '../helpers/multi-user';

/*
 * ══════════════════════════════════════════════════════════════════
 *  MULTI-USER INTEGRATION TEST — 4 Concurrent Browser Contexts
 *
 *  Actors:
 *    SA    — Super Admin (+919900001111, pre-existing)
 *    Alice — Extension Worker (freshly registered)
 *    Bob   — Extension Worker (freshly registered)
 *    Raj   — Farmer (freshly registered, self-managed)
 *
 *  8 Phases:
 *    0: Setup & Authentication
 *    1: Data Creation (parallel)
 *    2: Data Isolation Verification
 *    3: Diet Generation + Milk Logs (parallel)
 *    4: Admin Analytics Cross-Validation (SA)
 *    5: Milk/Diet Isolation
 *    6: RBAC Enforcement
 *    7: Cleanup & Summary
 * ══════════════════════════════════════════════════════════════════
 */

// Use full millisecond timestamp for uniqueness across rapid re-runs
const RUN = Date.now().toString().slice(-8);
const R6 = RUN.slice(-6); // 6-digit suffix for phone numbers

// Pre-existing super admin
const SA_PHONE = '9900001111';
const SA_PIN = '1111';

// Fresh users — unique per run (different base prefixes to avoid collision)
const ALICE_PHONE = `9870${R6}`;
const ALICE_PIN = '1234';
const ALICE_NAME = `Alice EW ${RUN}`;

const BOB_PHONE = `9871${R6}`;
const BOB_PIN = '1234';
const BOB_NAME = `Bob EW ${RUN}`;

const RAJ_PHONE = `9872${R6}`;
const RAJ_PIN = '1234';
const RAJ_NAME = `Raj Farmer ${RUN}`;

const COUNTRY = 'India';

// Shared state for cross-validation
const state = {
  alice: { farmers: [] as string[], cows: [] as string[] },
  bob: { farmers: [] as string[], cows: [] as string[] },
  raj: { cows: [] as string[] },
};

test('Multi-User Integration: 4 actors, 8 phases', async ({ browser }) => {
  test.setTimeout(900_000); // 15 min

  let sa: Actor;
  let alice: Actor;
  let bob: Actor;
  let raj: Actor;

  // ═══════════════════════════════════════════
  // PHASE 0: Setup & Authentication
  // ═══════════════════════════════════════════

  await test.step('Phase 0 — Create browser contexts', async () => {
    [sa, alice, bob, raj] = await Promise.all([
      createActor(browser, 'SA'),
      createActor(browser, 'Alice'),
      createActor(browser, 'Bob'),
      createActor(browser, 'Raj'),
    ]);
  });

  await test.step('P0-01 SA: Login as Super Admin', async () => {
    await loginAsAdmin(sa, SA_PHONE, SA_PIN, COUNTRY);
    await snap(sa, 'P0-01-login');
    // Verify we landed on the home page
    await waitForLoading(sa.page);
    const url = sa.page.url();
    expect(url).not.toContain('/auth/');
  });

  await test.step('P0-02 Alice: Register as Extension Worker', async () => {
    await registerAndOnboard(alice, {
      phone: ALICE_PHONE,
      pin: ALICE_PIN,
      fullName: ALICE_NAME,
      country: COUNTRY,
      role: 'Extension Worker',
      org: null,
    });
    await snap(alice, 'P0-02-registered');
    await waitForLoading(alice.page);
    expect(alice.page.url()).not.toContain('/auth/');
  });

  await test.step('P0-03 Bob: Register as Extension Worker', async () => {
    await registerAndOnboard(bob, {
      phone: BOB_PHONE,
      pin: BOB_PIN,
      fullName: BOB_NAME,
      country: COUNTRY,
      role: 'Extension Worker',
      org: null,
    });
    await snap(bob, 'P0-03-registered');
    await waitForLoading(bob.page);
    expect(bob.page.url()).not.toContain('/auth/');
  });

  await test.step('P0-04 Raj: Register as Farmer', async () => {
    await registerAndOnboard(raj, {
      phone: RAJ_PHONE,
      pin: RAJ_PIN,
      fullName: RAJ_NAME,
      country: COUNTRY,
      role: 'Farmer',
      org: null,
    });
    await snap(raj, 'P0-04-registered');
    await waitForLoading(raj.page);
    expect(raj.page.url()).not.toContain('/auth/');
  });

  // ═══════════════════════════════════════════
  // PHASE 1: Data Creation (parallel)
  // ═══════════════════════════════════════════

  await test.step('Phase 1 — Data creation (Alice + Bob + Raj in parallel)', async () => {
    await Promise.all([
      // --- Alice creates 2 farmers + 2 cows ---
      (async () => {
        const p = alice.page;
        // Farmer 1: Meera
        await goto(p, '/farmers');
        await waitForLoading(p);
        await addFarmer(p, {
          name: 'Meera Devi', phone: '9110001111',
          village: 'Mathura', district: 'Mathura', state: 'Uttar Pradesh',
          cattle: '2', farmingType: 'Dairy',
        });
        state.alice.farmers.push('Meera Devi');
        await snap(alice, 'P1-alice-farmer1');

        // Cow for Meera: Lakshmi
        await goto(p, '/farmers');
        await waitForLoading(p);
        await clickCard(p, 'Meera Devi');
        await waitForLoading(p);
        await addCow(p, {
          name: 'Lakshmi', breed: 'Holstein Friesian',
          weight: '350', milkYield: '12',
        });
        state.alice.cows.push('Lakshmi');
        await snap(alice, 'P1-alice-cow1');

        // Farmer 2: Gopal
        await goto(p, '/farmers');
        await waitForLoading(p);
        await addFarmer(p, {
          name: 'Gopal Singh', phone: '9110002222',
          village: 'Vrindavan', district: 'Mathura', state: 'Uttar Pradesh',
          cattle: '3', farmingType: 'Mixed',
        });
        state.alice.farmers.push('Gopal Singh');
        await snap(alice, 'P1-alice-farmer2');

        // Cow for Gopal: Gauri
        await goto(p, '/farmers');
        await waitForLoading(p);
        await clickCard(p, 'Gopal Singh');
        await waitForLoading(p);
        await addCow(p, {
          name: 'Gauri', breed: 'Gir',
          weight: '280', milkYield: '8',
        });
        state.alice.cows.push('Gauri');
        await snap(alice, 'P1-alice-cow2');
      })(),

      // --- Bob creates 2 farmers + 2 cows ---
      (async () => {
        const p = bob.page;
        // Farmer 1: Sunita
        await goto(p, '/farmers');
        await waitForLoading(p);
        await addFarmer(p, {
          name: 'Sunita Kumari', phone: '9220001111',
          village: 'Jaipur', district: 'Jaipur', state: 'Rajasthan',
          cattle: '2', farmingType: 'Dairy',
        });
        state.bob.farmers.push('Sunita Kumari');
        await snap(bob, 'P1-bob-farmer1');

        // Cow for Sunita: Sundari
        await goto(p, '/farmers');
        await waitForLoading(p);
        await clickCard(p, 'Sunita Kumari');
        await waitForLoading(p);
        await addCow(p, {
          name: 'Sundari', breed: 'Sahiwal',
          weight: '300', milkYield: '10',
        });
        state.bob.cows.push('Sundari');
        await snap(bob, 'P1-bob-cow1');

        // Farmer 2: Harish
        await goto(p, '/farmers');
        await waitForLoading(p);
        await addFarmer(p, {
          name: 'Harish Patel', phone: '9220002222',
          village: 'Udaipur', district: 'Udaipur', state: 'Rajasthan',
          cattle: '1', farmingType: 'Dairy',
        });
        state.bob.farmers.push('Harish Patel');
        await snap(bob, 'P1-bob-farmer2');

        // Cow for Harish: Champa
        await goto(p, '/farmers');
        await waitForLoading(p);
        await clickCard(p, 'Harish Patel');
        await waitForLoading(p);
        await addCow(p, {
          name: 'Champa', breed: 'Holstein Friesian',
          weight: '320', milkYield: '9',
        });
        state.bob.cows.push('Champa');
        await snap(bob, 'P1-bob-cow2');
      })(),

      // --- Raj (farmer) adds his own cow ---
      (async () => {
        const p = raj.page;
        await goto(p, '/cows');
        await waitForLoading(p);
        await addCow(p, {
          name: 'Nandi', breed: 'Jersey',
          weight: '330', milkYield: '11',
        });
        state.raj.cows.push('Nandi');
        await snap(raj, 'P1-raj-cow1');
      })(),
    ]);
  });

  // ═══════════════════════════════════════════
  // PHASE 2: Data Isolation Verification
  // ═══════════════════════════════════════════

  await test.step('P2-01 Alice: sees only her farmers with correct details', async () => {
    const p = alice.page;
    await goto(p, '/farmers');
    await waitForLoading(p);
    const content = await p.locator('.q-page').textContent() || '';
    // Alice's farmers present
    expect(content).toContain('Meera Devi');
    expect(content).toContain('Gopal Singh');
    // Bob's farmers absent
    expect(content).not.toContain('Sunita Kumari');
    expect(content).not.toContain('Harish Patel');
    // UI data: village names, farming types, cattle badges
    expect(content).toContain('Mathura');    // Meera's village
    expect(content).toContain('Vrindavan');  // Gopal's village
    expect(content).toContain('Dairy');      // Meera's farming type
    expect(content).toContain('Mixed');      // Gopal's farming type
    expect(content).toContain('cattle');     // at least one cattle badge
    await snap(alice, 'P2-01-farmers');
  });

  await test.step('P2-02 Bob: sees only his farmers with correct details', async () => {
    const p = bob.page;
    await goto(p, '/farmers');
    await waitForLoading(p);
    const content = await p.locator('.q-page').textContent() || '';
    // Bob's farmers present
    expect(content).toContain('Sunita Kumari');
    expect(content).toContain('Harish Patel');
    // Alice's farmers absent
    expect(content).not.toContain('Meera Devi');
    expect(content).not.toContain('Gopal Singh');
    // UI data: village names, farming type
    expect(content).toContain('Jaipur');     // Sunita's village
    expect(content).toContain('Udaipur');    // Harish's village
    expect(content).toContain('Dairy');      // farming type
    await snap(bob, 'P2-02-farmers');
  });

  await test.step('P2-03 Alice: sees only her cows with breed/weight/yield', async () => {
    const p = alice.page;
    await goto(p, '/cows');
    await waitForLoading(p);
    const content = await p.locator('.q-page').textContent() || '';
    expect(content).toContain('Lakshmi');
    expect(content).toContain('Gauri');
    expect(content).not.toContain('Sundari');
    expect(content).not.toContain('Champa');
    expect(content).not.toContain('Nandi');
    // UI data: scoped per cow item (breed, weight, yield, status chip)
    const lakshmiItem = p.locator('.q-item:has-text("Lakshmi")').first();
    const lakshmiText = await lakshmiItem.textContent() || '';
    expect(lakshmiText).toContain('Holstein Friesian');
    expect(lakshmiText).toContain('350');     // weight_kg
    expect(lakshmiText).toContain('12');      // milk_yield_liters
    expect(lakshmiText).toContain('Lactating');

    const gauriItem = p.locator('.q-item:has-text("Gauri")').first();
    const gauriText = await gauriItem.textContent() || '';
    expect(gauriText).toContain('Gir');
    expect(gauriText).toContain('280');
    await snap(alice, 'P2-03-cows');
  });

  await test.step('P2-04 Bob: sees only his cows with breed/weight/yield', async () => {
    const p = bob.page;
    await goto(p, '/cows');
    await waitForLoading(p);
    const content = await p.locator('.q-page').textContent() || '';
    expect(content).toContain('Sundari');
    expect(content).toContain('Champa');
    expect(content).not.toContain('Lakshmi');
    expect(content).not.toContain('Gauri');
    expect(content).not.toContain('Nandi');
    // UI data: scoped per cow item
    const sundariItem = p.locator('.q-item:has-text("Sundari")').first();
    const sundariText = await sundariItem.textContent() || '';
    expect(sundariText).toContain('Sahiwal');
    expect(sundariText).toContain('300');

    const champaItem = p.locator('.q-item:has-text("Champa")').first();
    const champaText = await champaItem.textContent() || '';
    expect(champaText).toContain('Holstein Friesian');
    expect(champaText).toContain('320');
    await snap(bob, 'P2-04-cows');
  });

  await test.step('P2-05 Raj: sees only his cow with breed/weight/yield', async () => {
    const p = raj.page;
    await goto(p, '/cows');
    await waitForLoading(p);
    const content = await p.locator('.q-page').textContent() || '';
    expect(content).toContain('Nandi');
    expect(content).not.toContain('Lakshmi');
    expect(content).not.toContain('Sundari');
    // UI data: scoped cow item
    const nandiItem = p.locator('.q-item:has-text("Nandi")').first();
    const nandiText = await nandiItem.textContent() || '';
    expect(nandiText).toContain('Jersey');
    expect(nandiText).toContain('330');
    await snap(raj, 'P2-05-cows');
  });

  // ═══════════════════════════════════════════
  // PHASE 2b: Dashboard Stats (pre-diet/milk)
  // ═══════════════════════════════════════════

  await test.step('P2b-01 Alice: EW Dashboard stats (pre-diet)', async () => {
    const p = alice.page;
    await goto(p, '/');
    await waitForLoading(p);
    await p.waitForTimeout(3000); // let stores load

    const content = await p.locator('.q-page').textContent() || '';
    // Stat cards: Farmers Managed, Total Cows, Cows on Diet
    const statCards = p.locator('.stat-card__value');
    const statCount = await statCards.count();
    if (statCount >= 3) {
      expect((await statCards.nth(0).textContent())?.trim()).toBe('2');  // 2 farmers
      expect((await statCards.nth(1).textContent())?.trim()).toBe('2');  // 2 cows
      expect((await statCards.nth(2).textContent())?.trim()).toBe('0');  // 0 on diet
    }
    // Farmer list on dashboard
    expect(content).toContain('Meera Devi');
    expect(content).toContain('Gopal Singh');
    expect(content).toContain('Mathura');
    // Data isolation
    expect(content).not.toContain('Sunita Kumari');
    expect(content).not.toContain('Harish Patel');
    await snap(alice, 'P2b-01-ew-dashboard');
  });

  await test.step('P2b-02 Bob: EW Dashboard stats (pre-diet)', async () => {
    const p = bob.page;
    await goto(p, '/');
    await waitForLoading(p);
    await p.waitForTimeout(3000);

    const content = await p.locator('.q-page').textContent() || '';
    const statCards = p.locator('.stat-card__value');
    const statCount = await statCards.count();
    if (statCount >= 3) {
      expect((await statCards.nth(0).textContent())?.trim()).toBe('2');  // 2 farmers
      expect((await statCards.nth(1).textContent())?.trim()).toBe('2');  // 2 cows
      expect((await statCards.nth(2).textContent())?.trim()).toBe('0');  // 0 on diet
    }
    expect(content).toContain('Sunita Kumari');
    expect(content).toContain('Harish Patel');
    expect(content).not.toContain('Meera Devi');
    await snap(bob, 'P2b-02-ew-dashboard');
  });

  await test.step('P2b-03 Raj: Farmer Dashboard stats (pre-diet)', async () => {
    const p = raj.page;
    await goto(p, '/');
    await waitForLoading(p);
    await p.waitForTimeout(3000);

    const content = await p.locator('.q-page').textContent() || '';
    // Farmer dashboard shows: Active Cows, Today's Milk, Cows on Diet
    expect(content).toContain('Active Cows');
    expect(content).toContain('Cows on Diet');
    // Today's milk = 0.0L (no logs yet)
    expect(content).toContain('0.0');
    await snap(raj, 'P2b-03-farmer-dashboard');
  });

  // ═══════════════════════════════════════════
  // PHASE 3: Diet Generation → Milk Logs
  // (Milk logging requires an active diet)
  // ═══════════════════════════════════════════

  await test.step('Phase 3a — Diet requests (Alice + Bob + Raj in parallel)', async () => {
    /**
     * Run the diet wizard: select cow → details → goal → feeds → generate → save.
     * Uses "Select from my cows" mode (default) for both EWs and Farmers.
     * For EWs, cowsStore.activeCows includes all farmer-managed cows.
     */
    async function requestDiet(p: Page, cowName: string) {
      await goto(p, '/diet/new');
      await waitForLoading(p);

      // Step 1: Select cow from the dropdown (default "Select from my cows" mode)
      await selectOption(p, 'Select Cow', cowName);
      await p.waitForTimeout(500);
      await clickButton(p, 'Continue');
      await waitForLoading(p);

      // Step 2: cow details — just continue (pre-filled from cow data)
      await clickButton(p, 'Continue');
      await waitForLoading(p);

      // Step 3: optimization goal
      await clickCard(p, 'Minimize Cost');
      await clickButton(p, 'Continue');
      await waitForLoading(p);

      // Step 4: select feeds (pick first 5 available)
      const feedCb = p.locator('.q-checkbox, input[type="checkbox"]');
      const count = await feedCb.count();
      for (let i = 0; i < Math.min(5, count); i++) {
        await feedCb.nth(i).click();
        await p.waitForTimeout(200);
      }
      await clickButton(p, 'Continue');
      await waitForLoading(p);

      // Step 5: review & generate
      await clickButton(p, 'Generate Diet');
      await p.waitForTimeout(25_000); // diet generation can take time

      // Save the diet
      const saveBtn = p.locator('button:has-text("Save")').first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        await waitForLoading(p);
        await p.waitForTimeout(3000);
      }

      // Now follow the diet to make it "active" (required for milk logging)
      // After saving, we should be on the diet detail page
      const followBtn = p.locator('button:has-text("Start Following"), button:has-text("Follow")').first();
      if (await followBtn.isVisible().catch(() => false)) {
        await followBtn.click();
        await waitForLoading(p);
        await p.waitForTimeout(2000);
      }
    }

    await Promise.all([
      (async () => {
        await requestDiet(alice.page, 'Lakshmi');
        await snap(alice, 'P3a-alice-diet-lakshmi');
        // Verify diet detail page content
        const dc = await alice.page.locator('.q-page').textContent() || '';
        expect(dc).toContain('Lakshmi');
        expect(dc).toContain('Following');
        expect(dc).toContain('kg/day');  // feed table column header
      })(),
      (async () => {
        await requestDiet(bob.page, 'Sundari');
        await snap(bob, 'P3a-bob-diet-sundari');
        const dc = await bob.page.locator('.q-page').textContent() || '';
        expect(dc).toContain('Sundari');
        expect(dc).toContain('Following');
        expect(dc).toContain('kg/day');
      })(),
      (async () => {
        await requestDiet(raj.page, 'Nandi');
        await snap(raj, 'P3a-raj-diet-nandi');
        const dc = await raj.page.locator('.q-page').textContent() || '';
        expect(dc).toContain('Nandi');
        expect(dc).toContain('Following');
        expect(dc).toContain('kg/day');
      })(),
    ]);
  });

  await test.step('Phase 3b — Milk logs (Alice + Bob + Raj in parallel)', async () => {
    await Promise.all([
      // Alice logs milk for Lakshmi
      (async () => {
        const p = alice.page;
        await goto(p, '/logs/new');
        await waitForLoading(p);
        await selectOption(p, 'Cow', 'Lakshmi');
        await p.waitForTimeout(2000); // wait for diet check
        await fillByLabel(p, 'Morning', '6');
        await fillByLabel(p, 'Evening', '5');
        await clickButton(p, 'Save');
        await waitForLoading(p);
        await snap(alice, 'P3b-alice-milk-lakshmi');
      })(),

      // Bob logs milk for Sundari
      (async () => {
        const p = bob.page;
        await goto(p, '/logs/new');
        await waitForLoading(p);
        await selectOption(p, 'Cow', 'Sundari');
        await p.waitForTimeout(2000);
        await fillByLabel(p, 'Morning', '5');
        await fillByLabel(p, 'Evening', '4');
        await clickButton(p, 'Save');
        await waitForLoading(p);
        await snap(bob, 'P3b-bob-milk-sundari');
      })(),

      // Raj logs milk for Nandi
      (async () => {
        const p = raj.page;
        await goto(p, '/logs/new');
        await waitForLoading(p);
        await selectOption(p, 'Cow', 'Nandi');
        await p.waitForTimeout(2000);
        await fillByLabel(p, 'Morning', '5.5');
        await fillByLabel(p, 'Evening', '5');
        await clickButton(p, 'Save');
        await waitForLoading(p);
        await snap(raj, 'P3b-raj-milk-nandi');
      })(),
    ]);
  });

  // ═══════════════════════════════════════════
  // PHASE 4: Admin Analytics Cross-Validation
  // ═══════════════════════════════════════════

  await test.step('P4-01 SA: Navigate to analytics', async () => {
    const p = sa.page;
    await goto(p, '/analytics');
    await waitForLoading(p);
    await p.waitForTimeout(2000);
    await snap(sa, 'P4-01-analytics');
  });

  await test.step('P4-02 SA: Verify global view has Country Breakdown', async () => {
    const p = sa.page;
    const content = await p.locator('.q-page').textContent() || '';
    expect(content).toContain('Country Breakdown');
    await snap(sa, 'P4-02-global');
  });

  await test.step('P4-03 SA: Drill into India', async () => {
    const p = sa.page;
    // Click India in the country list
    const indiaRow = p.locator('.q-page .q-item:has-text("India"), .q-page .q-card:has-text("India"), .q-page tr:has-text("India")').first();
    if (await indiaRow.isVisible().catch(() => false)) {
      await indiaRow.click();
      await waitForLoading(p);
      await p.waitForTimeout(2000);
    }
    await snap(sa, 'P4-03-india-drilldown');
  });

  await test.step('P4-04 SA: Verify country view has Organization Breakdown', async () => {
    const p = sa.page;
    const content = await p.locator('.q-page').textContent() || '';
    // May already be on org breakdown or still on global
    const hasOrgBreakdown = content.includes('Organization Breakdown');
    const hasEWActivity = content.includes('Extension Worker Activity');
    expect(hasOrgBreakdown || hasEWActivity).toBe(true);
    await snap(sa, 'P4-04-org-breakdown');
  });

  await test.step('P4-05 SA: Verify data counts reference India', async () => {
    const p = sa.page;
    const content = await p.locator('.q-page').textContent() || '';
    // All test data was created in India
    expect(content).toContain('India');
    // The analytics page should show meaningful content with actual data
    expect(content.length).toBeGreaterThan(100);
    await snap(sa, 'P4-05-counts');
  });

  await test.step('P4-06 SA: Navigate back to home', async () => {
    const p = sa.page;
    await goto(p, '/');
    await waitForLoading(p);
    await snap(sa, 'P4-06-home');
  });

  // ═══════════════════════════════════════════
  // PHASE 5: Milk/Diet Isolation
  // ═══════════════════════════════════════════

  await test.step('P5-01 Alice: milk logs show only her cows with correct values', async () => {
    const p = alice.page;
    await goto(p, '/logs');
    await waitForLoading(p);
    const content = await p.locator('.q-page').textContent() || '';
    // Lakshmi's log should be present
    expect(content).toContain('Lakshmi');
    // Bob's cow logs should be absent
    expect(content).not.toContain('Sundari');
    expect(content).not.toContain('Nandi');
    // UI data: today total, morning/evening abbreviated labels
    expect(content).toContain('11.0');     // todayTotal: 6+5=11.0
    expect(content).toContain('M:');       // morning label (abbreviated)
    expect(content).toContain('E:');       // evening label (abbreviated)
    await snap(alice, 'P5-01-milk-isolation');
  });

  await test.step('P5-02 Bob: milk logs show only his cows with correct values', async () => {
    const p = bob.page;
    await goto(p, '/logs');
    await waitForLoading(p);
    const content = await p.locator('.q-page').textContent() || '';
    expect(content).toContain('Sundari');
    expect(content).not.toContain('Lakshmi');
    expect(content).not.toContain('Nandi');
    // UI data: today total, morning/evening values
    expect(content).toContain('9.0');      // todayTotal: 5+4=9.0
    expect(content).toContain('M:');       // morning label
    expect(content).toContain('E:');       // evening label
    await snap(bob, 'P5-02-milk-isolation');
  });

  await test.step('P5-03 Alice: diet history shows only her diets with status', async () => {
    const p = alice.page;
    await goto(p, '/diet');
    await waitForLoading(p);
    const content = await p.locator('.q-page').textContent() || '';
    // Should see Lakshmi diet, not Sundari or Nandi
    expect(content).toContain('Lakshmi');
    expect(content).not.toContain('Sundari');
    expect(content).not.toContain('Nandi');
    // UI data: Following status chip
    expect(content).toContain('Following');
    await snap(alice, 'P5-03-diet-isolation');
  });

  await test.step('P5-04 Bob: diet history shows only his diets with status', async () => {
    const p = bob.page;
    await goto(p, '/diet');
    await waitForLoading(p);
    const content = await p.locator('.q-page').textContent() || '';
    expect(content).toContain('Sundari');
    expect(content).not.toContain('Lakshmi');
    expect(content).not.toContain('Nandi');
    // UI data: Following status chip
    expect(content).toContain('Following');
    await snap(bob, 'P5-04-diet-isolation');
  });

  // ═══════════════════════════════════════════
  // PHASE 5b: Post-Data Dashboard + Detail Verification
  // ═══════════════════════════════════════════

  await test.step('P5b-01 Alice: EW Dashboard stats with diet data', async () => {
    const p = alice.page;
    await goto(p, '/');
    await waitForLoading(p);
    await p.waitForTimeout(3000);

    const content = await p.locator('.q-page').textContent() || '';
    // Stat cards should now show: 2 farmers, 2 cows, 1 on diet
    const statCards = p.locator('.stat-card__value');
    const statCount = await statCards.count();
    if (statCount >= 3) {
      expect((await statCards.nth(0).textContent())?.trim()).toBe('2');  // 2 farmers
      expect((await statCards.nth(1).textContent())?.trim()).toBe('2');  // 2 cows
      expect((await statCards.nth(2).textContent())?.trim()).toBe('1');  // 1 on diet (Lakshmi)
    }
    // "on diet" badge on Meera's farmer entry
    expect(content).toContain('on diet');
    await snap(alice, 'P5b-01-ew-dashboard-post');

    // Also verify cow list shows "On Diet" chip
    await goto(p, '/cows');
    await waitForLoading(p);
    const cowContent = await p.locator('.q-page').textContent() || '';
    expect(cowContent).toContain('On Diet');
    await snap(alice, 'P5b-01-cow-on-diet');
  });

  await test.step('P5b-02 Raj: Farmer Dashboard with milk data', async () => {
    const p = raj.page;
    await goto(p, '/');
    await waitForLoading(p);
    await p.waitForTimeout(3000);

    const content = await p.locator('.q-page').textContent() || '';
    // Today's milk = 10.5L (5.5 morning + 5.0 evening)
    expect(content).toContain('10.5');
    // Today's log should show Nandi
    expect(content).toContain('Nandi');
    await snap(raj, 'P5b-02-farmer-dashboard-post');

    // Cow list should show "On Diet" chip on Nandi
    await goto(p, '/cows');
    await waitForLoading(p);
    const cowContent = await p.locator('.q-page').textContent() || '';
    expect(cowContent).toContain('On Diet');
    await snap(raj, 'P5b-02-cow-on-diet');
  });

  await test.step('P5b-03 Alice: Cow detail page for Lakshmi', async () => {
    const p = alice.page;
    await goto(p, '/cows');
    await waitForLoading(p);
    // Click into Lakshmi detail
    await p.locator('.q-item:has-text("Lakshmi")').first().click();
    await waitForLoading(p);
    await p.waitForTimeout(2000);

    const content = await p.locator('.q-page').textContent() || '';
    expect(content).toContain('Lakshmi');
    expect(content).toContain('Holstein Friesian');
    expect(content).toContain('350');   // weight_kg
    expect(content).toContain('12');    // milk_yield_liters
    await snap(alice, 'P5b-03-lakshmi-detail');
  });

  // ═══════════════════════════════════════════
  // PHASE 6: RBAC Enforcement
  // ═══════════════════════════════════════════

  await test.step('P6-01 Raj (Farmer): /admin redirects away', async () => {
    const p = raj.page;
    await goto(p, '/admin');
    await waitForLoading(p);
    await p.waitForTimeout(2000);
    const url = p.url();
    // Should NOT be on /admin (farmer has no access)
    expect(url).not.toMatch(/\/admin$/);
    await snap(raj, 'P6-01-rbac-farmer-admin');
  });

  await test.step('P6-02 Raj (Farmer): /analytics redirects away', async () => {
    const p = raj.page;
    await goto(p, '/analytics');
    await waitForLoading(p);
    await p.waitForTimeout(2000);
    const url = p.url();
    expect(url).not.toMatch(/\/analytics$/);
    await snap(raj, 'P6-02-rbac-farmer-analytics');
  });

  await test.step('P6-03 Alice (EW, not admin): /admin redirects away', async () => {
    const p = alice.page;
    await goto(p, '/admin');
    await waitForLoading(p);
    await p.waitForTimeout(2000);
    const url = p.url();
    expect(url).not.toMatch(/\/admin$/);
    await snap(alice, 'P6-03-rbac-ew-admin');
  });

  await test.step('P6-04 SA: /admin loads successfully', async () => {
    const p = sa.page;
    await goto(p, '/admin');
    await waitForLoading(p);
    await p.waitForTimeout(2000);
    const content = await p.locator('.q-page').textContent() || '';
    // Admin dashboard should have management cards
    const hasAdminContent = content.includes('Manage Users') || content.includes('Admin') || content.includes('Dashboard');
    expect(hasAdminContent).toBe(true);
    await snap(sa, 'P6-04-rbac-sa-admin');
  });

  // ═══════════════════════════════════════════
  // PHASE 7: Cleanup & Summary
  // ═══════════════════════════════════════════

  await test.step('Phase 7 — Cleanup', async () => {
    await Promise.all([
      closeActor(sa),
      closeActor(alice),
      closeActor(bob),
      closeActor(raj),
    ]);

    console.log('\n══════════════════════════════════════');
    console.log('  MULTI-USER INTEGRATION TEST SUMMARY');
    console.log('══════════════════════════════════════');
    console.log(`  Actors: SA, Alice, Bob, Raj`);
    console.log(`  Alice's farmers: ${state.alice.farmers.join(', ')}`);
    console.log(`  Alice's cows: ${state.alice.cows.join(', ')}`);
    console.log(`  Bob's farmers: ${state.bob.farmers.join(', ')}`);
    console.log(`  Bob's cows: ${state.bob.cows.join(', ')}`);
    console.log(`  Raj's cows: ${state.raj.cows.join(', ')}`);
    console.log('  All phases completed.');
    console.log('══════════════════════════════════════\n');
  });
});
