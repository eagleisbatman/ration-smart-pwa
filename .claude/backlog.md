# RationSmart Backlog

## Completed
- [x] UI/UX audit: 5 Critical, 11 Warnings, 7 Suggestions — all fixed & E2E verified
- [x] Admin hierarchy + tiered analytics with drill-down
- [x] Admin panel: dashboard, user management, org listing
- [x] E2E exhaustive testing (Phases 1-3)
- [x] Dashboard nudge banner when milk price not set
- [x] Sync milk price to backend user profile
- [x] S4: Reports queued reports section (already implemented in ReportListPage)
- [x] Feed price per kg visible in feed list caption line
- [x] DM/MP/NEL terminology simplified to farmer-friendly labels
- [x] Adherence/baseline labels simplified in DietImpactPanel
- [x] Diet action buttons made more prominent (failed-state recovery)
- [x] **Comprehensive full-stack 3-lens security + quality review (Feb 2026)** — all critical/high/med items resolved:
  - Auth race condition (Promise-based guard in router/index.ts)
  - Bot diet history AttributeError (evaluate_diet cow lookup fix)
  - IDOR on farmer profiles list (service token scoping)
  - PIN lockout bypass on change-contact endpoints
  - Email PII in logs (masked)
  - Language whitelist expanded to 22 locales
  - Rate limiting on change-contact endpoints
  - Unbounded telegram users list (pagination)
  - FK ON DELETE CASCADE on diet_reports/reports/user_feedback (migration 0041)
  - system_metadata table added to migrations (migration 0041)
  - FK constraints on farmer_reports.cow_profile_id/diet_recommendation_id (migration 0042)
  - Shared-device logout: axios.ts now calls logout() (clears IndexedDB)
  - Phone length guard in formatPhoneE164()
  - auth.py valid_roles: removed misleading 'admin' occupation
- [x] **PWA Visual Polish** — AdminDashboard welcome row, EWDashboard admin-conditional title, AdminAnalytics 3+2 layout, MainLayout drawer admin chip, i18n keys in all 22 locales
- [x] **Data Association Gaps** — 4 fixes deployed (migration 0043):
  - Auto-link cows to user's self-profile on creation
  - Enhanced cow query: farmers see EW-created cows linked via farmer profile
  - Farmer-level aggregation endpoints: GET /{farmer_id}/diets and /milk-logs
  - yield_data.diet_recommendation_id → UUID FK with referential integrity
  - Backfilled orphan cow_profiles.farmer_profile_id
- [x] **Multi-theme system** — 5 themes (Zinc, Earthy, Ocean, Vibrant, Sunset), light+dark mode, theme picker in Settings, persisted to localStorage
- [x] **RTL support for Arabic & Urdu** — `postcss-rtlcss` generates RTL CSS overrides, CSS logical properties, RTL-aware FAB positioning (7 pages), backend reports RTL, all translations updated
- [x] **RTL bug fixes** — 4 issues resolved:
  - Added `Lang.set({rtl: true})` so Quasar's layout system (q-layout/q-drawer) properly mirrors in RTL
  - Removed `q-ml-sm` from Settings/Help/Privacy section titles (broke `margin-inline: auto` centering)
  - Removed manual FAB RTL position overrides from 9 files (double-flipped with postcss-rtlcss)
  - Verified "Remember Me" login feature works correctly (dual localStorage/sessionStorage)
- [x] **Dashboard + Status Badges + Admin + Form Cleanup** (Mar 2026):
  - Backend: `solution_status` on SimulationListItem, `/admin/simulation-stats` endpoint
  - CattleInfoPage: 2-col layout, range hints, unit suffixes, BCS labels, reset button
  - FeedSelectionPage: Individual cards per selected feed with type badge + category
  - Status badges (Success/Failed) on HomePage + DietHistoryPage + filter tabs
  - Admin dashboard: simulation stats section + 5 action cards
  - 3 new admin pages: AdminFeedsPage, AdminFeedbackPage, AdminReportsPage
  - Cow icon integration across AuthLayout, MainLayout, HomePage
  - PWA manifest fix: unique `id` prevents duplicate installs
  - `docs-lite/` folder: 8 documentation files for app-lite

## Pending

### app-lite branch — Features
- [ ] **PDF download / Share** — Add ability to download or share recommendation report as PDF.

### app-lite branch — Multi-Country Setup
- [ ] **Create test users for Ethiopia, Bangladesh, Kenya** — No test users exist for these countries. Need backend seed data.
- [ ] **Add Kenya to country list** — Kenya (+254) missing from the country dropdown.

### app-lite-ec2 branch — EC2 Backend Integration
- [x] **EC2 auth migration** — Email+PIN login, no JWT, client-side auth only
- [x] **EC2 feed normalization** — `fd_*` → `_percentage` mapping, TDN estimation
- [x] **Multilingual feed names** — Static translations for 6 locales
- [x] **Mobile app alignment** — FeedSelectionPage card-based rewrite, report Save/Share flow, admin dashboard 5-card grid, history bottom sheet, topography radio buttons, navigation drawer order
- [ ] **More locale translations** — Feed names only cover 6 locales; add am, om, ar if needed

### Informational / Architectural (no immediate action required)
- [ ] **[ARCH] APP_API_KEY in browser** — `axios.ts:43` sends APP_API_KEY in every browser request header. Either remove (bearer token is sufficient) or proxy via server.
- [ ] **[MED] Offline banner** — Show "Viewing cached data" notification when stores fall back to IndexedDB on API failure.
