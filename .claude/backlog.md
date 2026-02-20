# RationSmart Backlog

## Recently Completed
- [x] UI/UX audit: 5 Critical, 11 Warnings, 7 Suggestions — all fixed & E2E verified
  - C1: Yields farmer filter UUID → name
  - C2: IP geolocation fallback + ForgotPin country
  - C3: super_admin raw string → "Super Admin" label
  - C4: Analytics country drill-down data mismatch (unaffiliated farmers)
  - C5: Onboarding step numbering (2→3)
  - W1-W13: Farmer count badge, empty location, farm detail placeholders, Log Milk action, date format, admin users phone/role, orgs search, analytics plural, settings styling, org type icons, route aliases
  - S1-S3, S5-S8: Dashboard greeting, cow photo helper, currency by country, cow filter chips, evening icon color, bottom nav badge, admin dashboard counts
- [x] Admin hierarchy: Super Admin → Country Admin → Org Admin → EW → Farmer
- [x] Tiered analytics with drill-down
- [x] Admin panel: dashboard, user management, org listing
- [x] E2E exhaustive testing (Phases 1-3)

## Pending
- [ ] Dashboard nudge banner when milk price not set
- [ ] Sync milk price to backend user profile (currently localStorage only)
- [ ] S4: Reports queued reports section (deferred — needs offline queue infrastructure)

## UX Issues Found During E2E Testing (Low Priority)
- [ ] Feed table missing "price per kg" column
- [ ] DM/MP/NEL terminology in diet results too technical for farmers
- [ ] "Adherence" and "vs baseline" labels in DietImpactPanel too technical
- [ ] Text-only action buttons not prominent enough on diet detail page
