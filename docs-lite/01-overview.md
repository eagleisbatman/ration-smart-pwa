# RationSmart Lite — Overview

## What is RationSmart Lite?

RationSmart Lite is a **lightweight, standalone cattle diet simulation tool** built as a Progressive Web App (PWA). It runs on the `app-lite` branch, completely separate from the full RationSmart product on `main`.

## Purpose

Farmers, extension workers, researchers, and students can:
1. Enter cattle information (breed, weight, milk production, environment)
2. Select available feeds with local prices
3. Generate **diet recommendations** (optimizer picks best feed quantities)
4. Generate **diet evaluations** (user provides quantities, system evaluates nutritional adequacy)
5. View detailed reports with nutrient analysis, cost breakdown, and methane estimates
6. Browse simulation history and re-run past simulations

## Key Differences from Full RationSmart (`main`)

| Feature | Lite (`app-lite`) | Full (`main`) |
|---------|-------------------|---------------|
| Cow management (CRUD) | No | Yes |
| Diet wizard / multi-step | No | Yes |
| Milk logs | No | Yes |
| Farmer management | No | Yes |
| Reports saved to S3 | Via backend | Yes |
| Offline diet generation | No (queued) | No (queued) |
| Onboarding flow | Simplified | 4-step |
| Admin panel | User mgmt, feeds, feedback, reports, stats | Full hierarchy + analytics |
| IndexedDB sync | Feeds + reports only | Full offline-first with sync queue |

## Tech Stack

- **Frontend**: Quasar v2 + Vue 3 Composition API + Pinia + TypeScript
- **Backend**: FastAPI + PostgreSQL (shared with `main`, deployed on Railway)
- **Package manager**: Bun
- **PWA**: Workbox (InjectManifest mode) with background sync
- **Offline storage**: Dexie.js (IndexedDB wrapper)
- **Deployment**: Railway (auto-deploys on push)

## Branch Architecture

- `app-lite` and `main` are **completely separate products**
- **Never cross-pollinate** code between branches
- Each has its own component set, routing, stores, and page structure
