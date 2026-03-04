# Setup Instructions

## Prerequisites

- **Bun** (recommended) or Node.js 18+
- Backend API running (see `ration-smart-backend/`)
- Git on `app-lite` branch

## Installation

```bash
cd ration-smart-pwa
git checkout app-lite
bun install
```

## Environment Configuration

Create `.env` in project root:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_API_KEY=your_app_api_key
```

For production (`.env.production`):

```env
VITE_API_BASE_URL=https://ration-smart-backend.up.railway.app
VITE_APP_API_KEY=production_api_key
VITE_APP_ENV=production
```

## Development

```bash
bun dev                  # Start dev server at http://localhost:9000
bun dev -- --port 9001   # Custom port
```

## Production Build

```bash
npx quasar build -m pwa  # Build PWA → dist/pwa/
bun run preview           # Preview locally
```

## Project Structure

```
ration-smart-pwa/          (app-lite branch)
├── docs-lite/             # This documentation
├── public/
│   ├── icons/             # PWA icons (all sizes) + cow.svg
│   └── flags/             # Country flag SVGs
├── src/
│   ├── boot/              # Boot files
│   │   ├── axios.ts       # HTTP client setup + interceptors
│   │   ├── dexie.ts       # IndexedDB initialization
│   │   ├── icons.ts       # CowIcon registration + Material Symbols
│   │   ├── i18n.ts        # Internationalization + RTL support
│   │   ├── pwa.ts         # PWA install prompt + SW updates
│   │   └── theme.ts       # Multi-theme system
│   ├── components/
│   │   ├── icons/         # CowIcon.vue
│   │   ├── pwa/           # AddToHomeScreen, UpdatePrompt, OfflineIndicator
│   │   └── simulation/    # CustomConstraintsDialog, report panels
│   ├── composables/       # Vue composables
│   │   ├── useCowIcon.ts
│   │   ├── useCurrency.ts
│   │   ├── useFeedDisplayName.ts
│   │   └── useHapticFeedback.ts
│   ├── css/
│   │   ├── app.scss       # Global styles + dark mode
│   │   └── quasar.variables.scss
│   ├── i18n/              # 22 locale JSON files
│   ├── layouts/
│   │   ├── AuthLayout.vue
│   │   └── MainLayout.vue
│   ├── lib/
│   │   ├── api.ts         # Axios instance
│   │   ├── themes.ts      # Theme definitions
│   │   ├── error-messages.ts
│   │   └── offline/
│   │       ├── db.ts      # Dexie database schema
│   │       └── sync-manager.ts
│   ├── pages/
│   │   ├── auth/          # Login, Register, ForgotPin
│   │   ├── simulation/    # HomePage, CattleInfo, FeedSelection,
│   │   │                  # EvaluationReport, RecommendationReport,
│   │   │                  # DietHistory
│   │   ├── feeds/         # FeedList, FeedDetail
│   │   ├── admin/         # Dashboard, Users, Feeds, Feedback, Reports
│   │   └── settings/      # Settings, Profile, Help, Privacy, Feedback
│   ├── router/
│   │   └── routes.ts      # All route definitions
│   ├── services/
│   │   └── api-adapter.ts # Endpoint mapping + phone/country utilities
│   └── stores/            # Pinia stores
│       ├── auth.ts
│       ├── admin.ts
│       ├── feeds.ts
│       ├── settings.ts
│       └── simulation.ts
├── src-pwa/
│   ├── manifest.json      # PWA manifest (id, icons, shortcuts)
│   └── custom-service-worker.ts
├── quasar.config.ts
└── package.json
```

## Testing PWA Features

### Service Worker
1. DevTools → Application → Service Workers
2. Check "Update on reload" during development
3. Use "Offline" checkbox to test offline mode

### Install Prompt
1. Build production: `npx quasar build -m pwa`
2. Serve with HTTPS or use Chrome's localhost exception
3. DevTools → Application → Manifest to verify
4. Install prompt appears after engagement

### Lighthouse Audit
1. Build and deploy (or `bun run preview`)
2. DevTools → Lighthouse → Check "Progressive Web App"
3. Target: 90+ score
