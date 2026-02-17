# RationSmart Backlog

## Recently Completed
- [x] Fix diet optimization response adapter (field mapping rewrite)
- [x] Add save-to-backend workflow for diets (generate → save → follow)
- [x] Fix diet detail page data display
- [x] Fix diet list page (ingredient count instead of DM intake)
- [x] Fix feeds route i18n keys (`feeds.*` → `feed.*`)
- [x] Standardize form layouts (gutters, two-column paired fields)
- [x] Connect milk log ↔ diet chain (LogFormPage edit mode, YieldFormPage diet link, cow name resolution)
- [x] Fix `common.you` i18n key (was missing from common namespace)
- [x] Repurpose Yield History → Milk Summary (aggregated from milk logs, actuals vs projected)
- [x] Move milk price to settings store (from localStorage-only MilkPriceCard)
- [x] Kill YieldFormPage (removed duplicate data entry)
- [x] FarmerYieldComparePage → uses milk logs instead of yield_data

## Pending
- [ ] Test diet save + follow workflow end-to-end in browser
- [ ] Dashboard nudge banner when milk price not set
- [ ] Sync milk price to backend user profile (currently localStorage only)
