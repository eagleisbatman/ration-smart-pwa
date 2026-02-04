# Setup Instructions

## Prerequisites

- **Node.js** 18+ or **Bun** (recommended)
- Backend API accessible (see `/ration-smart-backend`)
- HTTPS for testing PWA features (localhost works for dev)

## Installation Steps

### 1. Install Dependencies

```bash
cd ration-smart-pwa
bun install
```

### 2. Configure Environment

Create `.env` file in project root:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_API_KEY=your_app_api_key

# Optional: Push Notifications
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
```

For production, use `.env.production`:

```env
VITE_API_BASE_URL=https://api.rationsmart.com
VITE_APP_API_KEY=production_api_key
```

### 3. Run Development Server

```bash
bun dev
```

Opens at `http://localhost:9000`

**Note:** For full PWA testing in dev, enable HTTPS:

```bash
bun dev -- --https
```

### 4. Build for Production

```bash
bun run build
```

Output is in `dist/pwa` folder.

### 5. Preview Production Build

```bash
bun run preview
```

## PWA Testing

### Test Service Worker (Chrome DevTools)

1. Open DevTools → Application → Service Workers
2. Check "Update on reload" during development
3. Use "Offline" checkbox to test offline mode
4. Click "Update" to manually trigger update check

### Test Install Prompt

1. Build for production: `bun run build`
2. Serve with HTTPS: `bun run preview`
3. Open in Chrome
4. Use DevTools → Application → Manifest to verify
5. Install prompt should appear after engagement

### Test Offline Mode

1. Open app in Chrome
2. DevTools → Network → Check "Offline"
3. Navigate through app
4. Create a milk log (should queue)
5. Uncheck "Offline"
6. Log should sync automatically

### Run Lighthouse Audit

1. Build for production
2. Serve locally or deploy
3. Chrome DevTools → Lighthouse
4. Check "Progressive Web App"
5. Target: 90+ score

## Project Structure

```
ration-smart-pwa/
├── .planning/                 # Task management JSON
│   ├── initiative.json
│   └── sprints/
│       ├── sprint-01-foundation.json
│       ├── sprint-02-cow-profiles.json
│       └── ...
├── docs/                      # Documentation
│   ├── RESEARCH.md
│   ├── DEPENDENCIES.md
│   ├── SETUP.md
│   └── STRUCTURE.md
├── public/
│   ├── icons/                 # PWA icons (all sizes)
│   ├── screenshots/           # Store screenshots
│   └── favicon.ico
├── src/
│   ├── assets/                # Static assets
│   ├── boot/                  # Boot files (plugins)
│   │   ├── axios.ts
│   │   ├── dexie.ts
│   │   └── pwa.ts
│   ├── components/
│   │   ├── pwa/               # A2HS, UpdatePrompt, OfflineIndicator
│   │   ├── ui/                # Skeleton loaders, empty states
│   │   ├── forms/             # Form components
│   │   ├── cow/               # Cow-related components
│   │   ├── diet/              # Diet-related components
│   │   ├── feed/              # Feed-related components
│   │   ├── reports/           # Report components
│   │   └── auth/              # Auth components
│   ├── composables/           # Vue composables
│   │   ├── useAuth.ts
│   │   ├── useOfflineSync.ts
│   │   └── useNetworkStatus.ts
│   ├── layouts/
│   │   └── MainLayout.vue
│   ├── pages/
│   │   ├── auth/
│   │   ├── cows/
│   │   ├── diet/
│   │   ├── feeds/
│   │   ├── reports/
│   │   └── settings/
│   ├── router/
│   │   └── routes.ts
│   ├── stores/                # Pinia stores
│   │   ├── auth.ts
│   │   ├── cows.ts
│   │   ├── feeds.ts
│   │   ├── diets.ts
│   │   └── milkLogs.ts
│   ├── services/              # API services
│   │   ├── auth.service.ts
│   │   ├── cow.service.ts
│   │   └── ...
│   ├── lib/
│   │   └── offline/
│   │       ├── db.ts          # Dexie database
│   │       └── sync-manager.ts
│   └── css/
│       ├── app.scss
│       └── quasar.variables.scss
├── src-pwa/
│   ├── custom-service-worker.ts
│   ├── register-service-worker.ts
│   └── pwa-env.d.ts
├── quasar.config.ts
├── package.json
├── tsconfig.json
└── .env
```

## Troubleshooting

### Service Worker Not Updating
- Clear browser cache and hard refresh
- Check DevTools → Application → Service Workers → "Skip waiting"
- Ensure cache headers allow SW update checks

### PWA Not Installing
- Verify manifest.json is valid (DevTools → Application → Manifest)
- Ensure HTTPS is enabled
- Check all required manifest fields
- Verify icons exist and are correct sizes

### Offline Mode Not Working
- Check service worker is registered
- Verify Dexie database is initialized
- Check console for sync errors
- Ensure routes are precached

### API Calls Failing
- Verify `.env` has correct API URL
- Check network tab for CORS issues
- Ensure backend is running
- Verify API key is correct
