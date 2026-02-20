# RationSmart PWA — UI/UX Audit Report

**Date:** 2026-02-20
**Auditor:** Claude (Playwright MCP, Pixel 7 viewport 412x915)
**App Version:** 1.0.0
**Backend:** Railway production (ration-smart-backend.up.railway.app)
**Test Account:** +919900001111 (Super Admin / EW) PIN=1111

---

## Summary

| Category | Count |
|---|---|
| **Critical** | 5 |
| **Warning** | 13 |
| **Suggestion** | 8 |
| **Pass** | ~60 checkpoints |

---

## Critical Issues

### C1. Milk Summary: Farmer filter shows raw UUID instead of name
- **Page:** Milk Summary / Yields (`/yields`)
- **Screenshot:** `test-results/audit/19-yields-page.png`
- **Lenses:** L1, L2
- **Description:** The "Select Farmer" dropdown displays the raw UUID (`ec40138f-9f81-4230-8ead-b41e4ebb7763`) instead of the farmer's name. This is completely unusable for EWs managing multiple farmers.
- **Proposed Fix:** In the yields store or page, resolve farmer profile IDs to names before populating the dropdown. Use the farmer profiles already loaded in the farmers store.

### C2. IP geolocation service fails → wrong default country on login/register
- **Page:** LoginPage, RegisterPage, ForgotPinPage
- **Screenshot:** `test-results/audit/34-register-page.png`
- **Lenses:** L2, L4, L5
- **Description:** The `ipwho.is` API returns HTTP 403, causing the country selector to default to Vietnam (+84) instead of India (+91) for fresh sessions (no stored preference). Console error: `Failed to load resource: the server responded with a status of 403`. Indian farmers would see Vietnam flag and +84 dial code, making registration confusing.
- **Proposed Fix:** Add a fallback: if IP geolocation fails, default to India (the primary market) or the first country in the list. Also consider caching the last-used country in localStorage.

### C3. Admin Users: `super_admin` level displayed as raw string
- **Page:** Admin User Management (`/admin/users`)
- **Screenshot:** `test-results/audit/30-admin-users.png`
- **Lenses:** L1, L6
- **Description:** The admin level dropdown for the super_admin user shows `super_admin` (raw, with underscore) instead of "Super Admin" (human-readable). Other levels ("Regular User", "Country Admin", "Org Admin") display correctly.
- **Proposed Fix:** Add `super_admin` to the display name mapping in the admin users component/store.

### C4. Analytics data mismatch between global and country drill-down
- **Page:** Analytics (`/analytics`)
- **Screenshots:** `test-results/audit/31-analytics-global.png`, `test-results/audit/32-analytics-country-drill.png`
- **Lenses:** L2
- **Description:** Global analytics shows "India: 79 Users · 111 Farmers" but drilling into India shows "0 Farmers, 0 Cows". The country-level API query returns different numbers than the global summary, suggesting the country drill-down endpoint counts differently or filters by organization membership.
- **Proposed Fix:** Investigate the backend endpoints `/admin/analytics/global` vs `/admin/analytics/country/{id}`. Ensure farmer counts are consistent — likely the country endpoint only counts farmers linked to orgs while the global endpoint counts all farmers with that country code.

### C5. Onboarding step numbering inconsistency
- **Pages:** RoleSelectPage, OrgSelectPage, MyProfileSetupPage
- **Screenshots:** `test-results/audit/36-role-select.png`, `test-results/audit/37-org-select.png`, `test-results/audit/38-profile-setup.png`
- **Lenses:** L1, L8
- **Description:** Role Select shows "Step 1 of 2", Org Select shows "Step 2 of 2", but Profile Setup shows "Step 3 of 3". The profile setup page was added as a third step but the role/org pages weren't updated to say "Step X of 3".
- **Proposed Fix:** Update all three onboarding pages to consistently show "Step 1 of 3", "Step 2 of 3", "Step 3 of 3".

---

## Warnings

### W1. Farmer list: "0 Farmers" badge but 1 farmer shown
- **Page:** Farmer List (`/farmers`)
- **Screenshot:** `test-results/audit/26-farmer-list.png`
- **Lenses:** L2
- **Description:** The badge shows "0 Farmers" but the self-profile "Test SuperAdmin (You)" is visible in the list. The count excludes self but the list includes it.
- **Proposed Fix:** Either include self in count ("1 Farmer") or exclude self from the list entirely (with a separate "My Profile" section).

### W2. Farmer list items missing key info
- **Page:** Farmer List (`/farmers`)
- **Screenshot:** `test-results/audit/26-farmer-list.png`
- **Lenses:** L1, L2
- **Description:** List items only show name + empty location pin icon. Missing: phone number, farming_type badge, "N cattle" badge. The location pin has no text (location not set for this profile).
- **Proposed Fix:** Show farming_type chip, cattle count badge, and phone (masked) on each list item. Hide location pin if no location is set.

### W3. Farmer detail: Missing location and phone in header
- **Page:** Farmer Detail (`/farmers/:id`)
- **Screenshot:** `test-results/audit/27-farmer-detail.png`
- **Lenses:** L1, L2
- **Description:** Header shows only name + avatar. No village/district/state, no phone number. Farm Details section only shows "Added On" date.
- **Proposed Fix:** Add location and phone to the header or a visible info section. Show farming_type, land size, total cattle in Farm Details.

### W4. Farmer Dashboard (Personal mode) missing "Log Milk" quick action
- **Page:** Home (`/`) → Personal tab
- **Screenshot:** `test-results/audit/06-farmer-dashboard-bottom.png`
- **Lenses:** L7, L8
- **Description:** Quick Actions shows only 2 buttons (Get Diet Recommendation, Add Cow). Missing "Log Milk" which is the most frequent farmer action.
- **Proposed Fix:** Add "Log Milk" as a quick action button, ideally as the first/most prominent option since it's the primary daily task.

### W5. Milk Log form: Date in raw ISO format
- **Page:** Log Milk (`/logs/new`)
- **Screenshot:** `test-results/audit/13-milk-log-form-top.png`
- **Lenses:** L1, L5
- **Description:** Date field shows "2026-02-20" (ISO format) instead of a localized, farmer-friendly format like "Feb 20, 2026" or "20/02/2026".
- **Proposed Fix:** Use locale-aware date formatting in the date field display value. Keep ISO internally.

### W6. Diet Wizard: Missing "Farmer's Cow" mode for EW
- **Page:** New Diet Plan (`/diet/new`)
- **Screenshot:** `test-results/audit/16-diet-wizard-step1.png`
- **Lenses:** L5
- **Description:** Step 1 only offers two modes: "Select from my cows" and "Enter manually". For Extension Workers, there should be a third option "Select from farmer's cows" to create diets on behalf of the farmers they manage.
- **Proposed Fix:** Add a "Select from a farmer's cow" radio option that shows a farmer picker first, then a cow picker for that farmer's cattle.

### W7. Admin Users: Phone/email not displayed
- **Page:** Admin User Management (`/admin/users`)
- **Screenshot:** `test-results/audit/30-admin-users.png`
- **Lenses:** L1, L2
- **Description:** User list items show "Name · — · role" where "—" should be the phone or email. Phone-only users show a dash instead of their phone number.
- **Proposed Fix:** Display the user's phone number (masked middle digits for privacy) or email if available.

### W8. Admin Orgs: No search/filter
- **Page:** Admin Organizations (`/admin/orgs`)
- **Screenshot:** `test-results/audit/33-admin-orgs.png`
- **Lenses:** L7
- **Description:** Organization list has no search bar or filter functionality. With 20+ organizations, finding a specific one requires scrolling.
- **Proposed Fix:** Add a search bar similar to the farmer list and user management pages.

### W9. Analytics summary: "Country" singular label
- **Page:** Analytics (`/analytics`)
- **Screenshot:** `test-results/audit/31-analytics-global.png`
- **Lenses:** L1
- **Description:** Summary card shows "10 Country" — should be "10 Countries" (plural).
- **Proposed Fix:** Pluralize label when count > 1.

### W10. Settings: Inconsistent row highlighting
- **Page:** Settings (`/settings`)
- **Screenshot:** `test-results/audit/21-settings-page.png`
- **Lenses:** L6
- **Description:** "Milk Price" and "Sync History" rows have darker background than sibling rows, creating visual inconsistency. Appears to be hover/active state stuck or CSS issue.
- **Proposed Fix:** Inspect CSS for these specific list items. Likely a `:hover` or focus state that's persisting on mobile touch.

### W11. PIN strength indicator not implemented
- **Page:** RegisterPage (`/auth/register`)
- **Screenshot:** `test-results/audit/34-register-page.png`
- **Lenses:** L2, L5
- **Description:** No PIN strength indicator visible. The plan expected visual feedback (weak for 1234, moderate for 1122, strong for random 4-digit).
- **Proposed Fix:** Add a strength meter below the PIN field with color-coded indicator.

### W12. Admin Orgs: Same icon for all org types
- **Page:** Admin Organizations (`/admin/orgs`)
- **Screenshot:** `test-results/audit/33-admin-orgs.png`
- **Lenses:** L6
- **Description:** All organizations use the same `business` icon regardless of type (ngo, university, research). In contrast, the onboarding Org Select page uses colored type-specific icons.
- **Proposed Fix:** Reuse the colored icon component from the onboarding OrgSelect page in the admin org list.

### W13. Route URLs don't match feature names — 404 for reasonable guesses
- **Pages:** `/milk-logs` (404), `/diets` (404), `/admin/analytics` (404)
- **Screenshot:** `test-results/audit/11-milk-logs-404.png`
- **Lenses:** L8, L1
- **Description:** The bottom nav tab labels ("Milk Logs", "Diet Plans") don't match the actual URL paths (`/logs`, `/diet`). Navigating to `/milk-logs` or `/diets` returns a 404 page. Similarly, the Analytics page lives at `/analytics` (not `/admin/analytics`), which is confusing since it requires admin access and is linked from the admin dashboard. While all internal navigation works correctly (router links use the right paths), users bookmarking or sharing URLs, or developers guessing routes, will hit 404s. This was observed during testing when navigating directly to `/milk-logs`.
- **Proposed Fix:** Either (a) add route aliases so `/milk-logs` redirects to `/logs`, `/diets` to `/diet`, and `/admin/analytics` to `/analytics`, or (b) rename the canonical routes to match their feature names for better discoverability.

---

## Suggestions

### S1. Dashboard greeting could be more personal for farmers
- Show cow count in greeting: "Good morning, Raj! Your 3 cows produced 24.5L yesterday."

### S2. Cow form: Photo upload area could show helper text
- "Take a photo for easy identification" would help farmers understand the purpose.

### S3. Feeds: Price column could show currency based on user's country
- Currently shows ₹ (correct for India) but should dynamically switch for other countries.

### S4. Reports: Add "Queued Reports" section for offline support
- Plan mentions offline-friendly queued reports section — not currently visible.

### S5. Cow list: Add filter chips for lactation status
- Similar to farmer list chips (All/Dairy/Mixed/Beef), cow list should filter by Lactating/Dry/All.

### S6. Milk Log form: Morning/Evening icons could use warmer/cooler colors
- Currently both use muted icon colors. Using warm amber for morning (sun) and cool blue for evening (moon) would improve visual distinction.

### S7. Bottom nav: Consider adding notification dot for pending syncs
- When offline milk logs are pending sync, show a red dot on the Milk Logs tab.

### S8. Admin dashboard: Consider adding summary stats
- Currently just 3 cards linking to subpages. Adding inline counts (X users, Y orgs) would reduce navigation.

---

## Pass Summary (Key Checkpoints)

| Area | Status | Notes |
|---|---|---|
| Login page layout | ✅ Pass | Flag, dial code, PIN visibility toggle, Remember Me, Forgot PIN all work |
| Language selector | ✅ Pass | 14 languages with native labels |
| Dashboard EW mode | ✅ Pass | Toggle, stat cards, quick actions, empty states, chart, activity feed |
| Dashboard Farmer mode | ✅ Pass | Stat cards, empty state with CTA, chart toggle |
| Cow list empty state | ✅ Pass | Cow icon, helpful message, Add Cow CTA |
| Cow form | ✅ Pass | All sections, sensible defaults, required/optional marking |
| Milk Logs list | ✅ Pass | Summary cards (Today/Yesterday/Week Avg), filter, empty state |
| Milk Log form | ✅ Pass | Cow selector, date, morning/evening, total, quality metrics optional |
| Diet Plans empty state | ✅ Pass | Icon, message, Create Diet CTA |
| Diet Wizard step 1 | ✅ Pass | Two modes, cow selector, disabled Continue button |
| Feeds list | ✅ Pass | Master/My Feeds toggle, search, categorized, nutrients, pricing |
| Reports page | ✅ Pass | Generate Diet Report CTA, recent reports section |
| Settings page | ✅ Pass | Profile, Preferences, App Settings, Data & Sync, About, Logout |
| Dark mode | ✅ Pass | All tested pages render correctly, proper color inversion |
| Admin dashboard | ✅ Pass | Level badge, 3 action cards |
| Admin analytics | ✅ Pass | Summary cards, country breakdown, drill-down with breadcrumbs |
| Onboarding role select | ✅ Pass | 7 roles with icons and descriptions |
| Onboarding org select | ✅ Pass | "Not affiliated" default, searchable list, colored type icons |
| Profile setup | ✅ Pass | Optional fields, location sharing, Back/Done buttons |
| Header/back navigation | ✅ Pass | Hamburger on home, back arrow on subpages, correct titles |
| Bottom nav | ✅ Pass | 4 tabs, active state highlights correctly |
| FAB | ✅ Pass | 3 actions (Add Cow, Log Milk, Get Diet), expands upward |
| 404 page | ✅ Pass | Clean design, "Go Home" button |
| Sync status chip | ✅ Pass | Shows Synced/Syncing states correctly |

---

## Prioritized Fix List

### Priority 1 (Fix before next release)
1. **C1** — Yields/Milk Summary farmer filter shows UUID → resolve to name
2. **C2** — IP geolocation fallback for country selector default
3. **C3** — Super_admin display name in admin users dropdown
4. **C5** — Onboarding step numbering (1 of 2 vs 3 of 3)
5. **W4** — Add "Log Milk" to farmer dashboard quick actions

### Priority 2 (Fix soon)
6. **C4** — Analytics global vs country farmer count mismatch (backend investigation)
7. **W1** — Farmer count badge vs list mismatch
8. **W2** — Farmer list missing info (phone, cattle count, farming type)
9. **W3** — Farmer detail missing location and phone
10. **W5** — Localize date format in milk log form
11. **W6** — Diet wizard "Farmer's Cow" mode for EWs
12. **W7** — Show phone in admin user list

### Priority 3 (Nice to have)
13. **W8** — Search/filter for admin orgs page
14. **W9** — Pluralize "Country" → "Countries" in analytics
15. **W10** — Settings row highlighting inconsistency
16. **W11** — PIN strength indicator on register
17. **W12** — Type-specific icons in admin org list
18. **W13** — Route URL aliases for discoverability (`/milk-logs` → `/logs`, `/diets` → `/diet`)
19. **S1-S8** — Suggestions (see above)

---

## Screenshots Index

| # | File | Page |
|---|---|---|
| 01 | `01-login-page.png` | Login page |
| 02 | `02-language-selector.png` | Language dropdown |
| 03 | `03-ew-dashboard-top.png` | EW Dashboard (top) |
| 04 | `04-ew-dashboard-bottom.png` | EW Dashboard (bottom) |
| 05 | `05-farmer-dashboard-personal.png` | Farmer Dashboard (Personal) |
| 06 | `06-farmer-dashboard-bottom.png` | Farmer Dashboard (bottom) |
| 07 | `07-left-drawer.png` | Left navigation drawer |
| 08 | `08-cow-list-page.png` | Cow list (empty) |
| 09 | `09-cow-form-top.png` | Add Cow form (top) |
| 10 | `10-cow-form-bottom.png` | Add Cow form (bottom) |
| 11 | `11-milk-logs-404.png` | 404 page (wrong URL) |
| 12 | `12-milk-logs-list.png` | Milk Logs list |
| 13 | `13-milk-log-form-top.png` | Milk Log form (top) |
| 14 | `14-milk-log-form-bottom.png` | Milk Log form (bottom) |
| 15 | `15-diet-plans-list.png` | Diet Plans list (empty) |
| 16 | `16-diet-wizard-step1.png` | Diet Wizard step 1 |
| 17 | `17-feeds-list.png` | Feeds list (top) |
| 18 | `18-feeds-list-bottom.png` | Feeds list (bottom) |
| 19 | `19-yields-page.png` | Milk Summary / Yields |
| 20 | `20-reports-page.png` | Reports page |
| 21 | `21-settings-page.png` | Settings (top) |
| 22 | `22-settings-bottom.png` | Settings (bottom) |
| 23 | `23-settings-dark-mode.png` | Settings (dark mode) |
| 24 | `24-dashboard-dark-mode.png` | Dashboard (dark mode) |
| 25 | `25-feeds-dark-mode.png` | Feeds (dark mode) |
| 26 | `26-farmer-list.png` | Farmer list |
| 27 | `27-farmer-detail.png` | Farmer detail |
| 28 | `28-farmer-form.png` | Add Farmer form |
| 29 | `29-admin-dashboard.png` | Admin Dashboard |
| 30 | `30-admin-users.png` | Admin User Management |
| 31 | `31-analytics-global.png` | Analytics (global) |
| 32 | `32-analytics-country-drill.png` | Analytics (India drill-down) |
| 33 | `33-admin-orgs.png` | Admin Organizations |
| 34 | `34-register-page.png` | Register page |
| 35 | `35-forgot-pin.png` | Forgot PIN page |
| 36 | `36-role-select.png` | Onboarding Role Select |
| 37 | `37-org-select.png` | Onboarding Org Select |
| 38 | `38-profile-setup.png` | Onboarding Profile Setup |
