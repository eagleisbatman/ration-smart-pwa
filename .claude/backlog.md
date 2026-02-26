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

## Pending

### Informational / Architectural (no immediate action required)
- [ ] **[ARCH] APP_API_KEY in browser** — `axios.ts:43` sends APP_API_KEY in every browser request header. Either remove (bearer token is sufficient) or proxy via server. Requires backend decision on whether this key gate is meaningful for a public SPA.
- [ ] **[MED] Offline banner** — show "Viewing cached data" notification when stores fall back to IndexedDB on API failure.
