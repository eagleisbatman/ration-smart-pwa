# Architecture

## Application Flow

```
Login/Register → HomePage → CattleInfoPage → FeedSelectionPage
                                                    ↓
                              ┌─────────────────────┴───────────────────────┐
                              ↓                                             ↓
                   RecommendationReportPage                    EvaluationReportPage
                   (optimizer picks quantities)                (user provides quantities)
```

## Core Simulation Pipeline

### 1. Cattle Information (`CattleInfoPage`)
User enters animal parameters:
- **Animal**: breed, body weight, body condition score
- **Milk**: lactating status, days in milk, production, fat %, protein %
- **Reproduction**: parity, days of pregnancy, calving interval
- **Environment**: temperature, topography, walking distance, grazing, BW gain

### 2. Feed Selection (`FeedSelectionPage`)
User selects feeds from the master feed catalog:
- Filter by type (Forage/Concentrate) and category
- Search by name (supports local names)
- Set price per kg for each selected feed
- Optionally set quantity per feed (for evaluation mode)

### 3. Diet Generation
Two modes:
- **Recommendation** (no quantities): Backend runs NSGA2 optimizer to find optimal feed quantities that minimize cost while meeting nutritional requirements
- **Evaluation** (with quantities): Backend evaluates the user-specified diet against NASEM nutrient requirements

### 4. Report Display
Reports show:
- Solution summary (status, daily cost, DM intake)
- Feed schedule (quantities, as-fed and DM basis)
- Nutrient adequacy table (requirements vs supplied)
- Milk production analysis
- Methane emission estimates
- Diet impact panel (adherence scoring)

## Stores Architecture

### `simulation.ts` (Main store)
- Holds `cattleInfo` form state, `selectedFeeds`, `customConstraints`
- Manages `simulationHistory` (list from backend)
- Actions: `generateRecommendation()`, `generateEvaluation()`, `fetchSimulationHistory()`, `restoreSimulation()`
- `resetForm()` resets all inputs to defaults
- Generates unique `simulationId` per run

### `feeds.ts`
- Fetches master feed catalog from backend
- Caches in IndexedDB via Dexie
- Provides `allFeeds` reactive list with lazy loading

### `auth.ts`
- Dual storage: localStorage (remember me) vs sessionStorage
- Manages user profile, admin level, country
- Token refresh and session expiry handling

### `admin.ts`
- Admin-only operations: user management, feed CRUD, feedback, reports, simulation stats
- All actions require `admin_user_id` param

### `settings.ts`
- Theme, language, milk price preferences
- Persisted to localStorage

## API Adapter Layer

`src/services/api-adapter.ts` maps frontend paths to backend endpoints:

```
Frontend: /api/v1/admin/list-feeds
Backend:  /admin/list-feeds

Frontend: /api/v1/simulation/recommend
Backend:  /animal/recommend
```

This decouples frontend URLs from backend router structure. All API calls go through axios interceptors in `src/boot/axios.ts`.

## Routing

All routes are in `src/router/routes.ts`. Key structure:

- `/auth/*` — AuthLayout (login, register, forgot-pin)
- `/` — MainLayout (requires auth)
  - `/` — HomePage (dashboard)
  - `/cattle-info` — CattleInfoPage
  - `/feed-selection` — FeedSelectionPage
  - `/recommendation-report` — RecommendationReportPage
  - `/evaluation-report` — EvaluationReportPage
  - `/diet-history` — DietHistoryPage
  - `/feeds` — Feed catalog
  - `/settings/*` — Settings pages
  - `/admin/*` — Admin pages (requiresAdmin)

## Internationalization

- 22 supported locales (en, hi, sw, ar, bn, etc.)
- RTL support for Arabic and Urdu via `postcss-rtlcss`
- Translation script: `scripts/translate_new_keys.py` (Gemini-powered)
- Boot file `i18n.ts` handles locale detection and RTL setup

## Theming

- 5 built-in themes (Zinc, Earthy, Ocean, Vibrant, Sunset)
- Light + dark mode support
- Theme picker in Settings page
- Applied via `applyTheme()` which sets Quasar CSS variables
