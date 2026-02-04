# PWA Research Findings

## Sources Consulted

- [Quasar PWA Documentation](https://quasar.dev/quasar-cli-vite/developing-pwa/configuring-pwa/) - Official Quasar PWA configuration
- [Quasar Service Worker Handling](https://quasar.dev/quasar-cli-vite/developing-pwa/handling-service-worker/) - Workbox modes and SW architecture
- [Building PWAs with Quasar](https://dev.to/ivanrochacardoso/building-progressive-web-apps-with-quasar-framework-a-complete-guide-to-offline-first-development-3170) - Complete offline-first guide
- [Quasar Caching Strategies](https://priyankdesai515.medium.com/precaching-and-caching-strategies-for-quasar-project-d98f7c43d7a5) - Workbox caching patterns

## Current PWA Best Practices (2025/2026)

### Workbox Operating Modes
- **generateSW** (default): Simple precaching and runtime configuration
- **injectManifest**: Full control over service worker, recommended for complex apps

We're using **InjectManifest** mode because we need:
- Background sync for offline mutations
- Custom caching strategies for API responses
- Push notification handling

### Service Worker Architecture
- Service worker runs in separate thread
- Interact from app-space via `/src-pwa/register-service-worker.ts`
- Update detection via `updatefound` event
- Use `skipWaiting()` + `clients.claim()` for immediate activation

### Caching Strategies
| Asset Type | Strategy | Rationale |
|------------|----------|-----------|
| App shell | Precache | Core app always available |
| Static assets | CacheFirst | Rarely change, fast load |
| API GET requests | NetworkFirst | Fresh data, fallback to cache |
| API mutations | Background Sync | Queue when offline, retry on reconnect |
| Images | CacheFirst | Large, cache for 30 days |
| Fonts | CacheFirst | Stable, cache for 1 year |

### Offline-First Pattern
1. Always read from local (Dexie.js) first
2. Sync with server in background
3. Queue mutations when offline
4. Auto-sync when back online
5. Show sync status to user

## Browser Support Notes

### iOS Safari Limitations
- No `beforeinstallprompt` event - need manual install instructions
- Push notifications require iOS 16.4+
- Limited Background Sync support
- Must use iOS-specific meta tags for:
  - `apple-mobile-web-app-capable`
  - `apple-mobile-web-app-status-bar-style`
  - `apple-touch-icon`
  - Apple splash screen images

### Chrome/Android Features
- Full PWA support
- `beforeinstallprompt` for custom install UI
- Background Sync API
- Push notifications
- Maskable icons for adaptive icon shape

### Firefox Considerations
- PWA support but no A2HS on desktop
- Good service worker support
- Push notifications work

## Decisions Made

### Framework: Quasar v2
**Reasoning:**
- Best-in-class PWA tooling with built-in Workbox integration
- Vue 3 + TypeScript + Composition API
- Material + iOS adaptive styling
- Excellent component library (forms, lists, bottom nav)
- Easy path to Capacitor if native needed later

### State Management: Pinia
**Reasoning:**
- Official Vue 3 state management
- TypeScript support
- Simpler than Vuex
- Integrates well with Composition API

### Offline Storage: Dexie.js
**Reasoning:**
- Best DX for IndexedDB
- Promise-based API
- Live queries for reactive data
- Transactions and migrations
- Battle-tested in production

### Service Worker: InjectManifest Mode
**Reasoning:**
- Full control over SW behavior
- Custom caching for API responses
- Background sync for mutations
- Push notification handling

### CSS: SCSS with Design Tokens
**Reasoning:**
- Quasar uses SCSS natively
- Variables for consistent theming
- Material 3 design system
- Agriculture-themed color palette (greens)

## Technical Architecture

```
┌─────────────────────────────────────────────┐
│                 Vue 3 App                    │
│    (Quasar Framework, Composition API)       │
├─────────────────────────────────────────────┤
│              Pinia Stores                    │
│   (auth, cows, feeds, diets, milkLogs)       │
├─────────────────────────────────────────────┤
│             Sync Manager                     │
│   (Queue operations, process on reconnect)   │
├─────────────────────────────────────────────┤
│              Dexie.js                        │
│        (IndexedDB abstraction)               │
├─────────────────────────────────────────────┤
│           Service Worker                     │
│  (Workbox: precache, runtime cache, sync)    │
├─────────────────────────────────────────────┤
│         FastAPI Backend                      │
│       (RationSmart API)                      │
└─────────────────────────────────────────────┘
```
