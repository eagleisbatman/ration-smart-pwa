# Dependencies

## Core Dependencies

| Package | Version | Purpose | Why This Package? |
|---------|---------|---------|-------------------|
| quasar | ^2.14.0 | UI Framework | Best PWA tooling, Material + iOS design |
| vue | ^3.4.0 | Frontend Framework | Modern reactivity, Composition API |
| vue-router | ^4.2.0 | Routing | Official Vue router |
| pinia | ^2.1.0 | State Management | Official Vue 3 state, TypeScript support |

## PWA-Specific Dependencies

| Package | Version | Purpose | Why This Package? |
|---------|---------|---------|-------------------|
| workbox-core | ^7.0.0 | Service Worker | Google's PWA toolkit, Quasar integration |
| workbox-precaching | ^7.0.0 | Precaching | App shell caching |
| workbox-routing | ^7.0.0 | SW Routing | Request interception |
| workbox-strategies | ^7.0.0 | Caching Strategies | NetworkFirst, CacheFirst, etc. |
| workbox-background-sync | ^7.0.0 | Offline Sync | Queue requests when offline |
| workbox-expiration | ^7.0.0 | Cache Expiration | TTL and max entries |
| workbox-cacheable-response | ^7.0.0 | Response Caching | Cache valid responses |

## Offline Storage

| Package | Version | Purpose | Why This Package? |
|---------|---------|---------|-------------------|
| dexie | ^4.0.0 | IndexedDB | Best DX for IndexedDB, live queries |

## HTTP Client

| Package | Version | Purpose | Why This Package? |
|---------|---------|---------|-------------------|
| axios | ^1.6.0 | HTTP Client | Interceptors, cancellation, transforms |
| axios-retry | ^4.0.0 | Retry Logic | Exponential backoff, configurable |

## Utilities

| Package | Version | Purpose | Why This Package? |
|---------|---------|---------|-------------------|
| date-fns | ^3.0.0 | Date Manipulation | Tree-shakeable, immutable |
| uuid | ^9.0.0 | UUID Generation | RFC4122 compliant UUIDs |

## Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| typescript | ^5.3.0 | Type Safety |
| @types/uuid | ^9.0.0 | UUID Types |
| @quasar/app-vite | ^1.8.0 | Quasar CLI with Vite |
| eslint | ^8.0.0 | Linting |
| prettier | ^3.0.0 | Formatting |
| @typescript-eslint/parser | ^6.0.0 | TS ESLint |
| @typescript-eslint/eslint-plugin | ^6.0.0 | TS ESLint Rules |

## Packages Considered but NOT Chosen

| Package | Reason for Rejection |
|---------|---------------------|
| localForage | Dexie has better DX and live queries |
| idb | Dexie provides higher-level abstractions |
| vuex | Pinia is simpler and Vue 3 native |
| lodash | date-fns and native methods sufficient |
| moment.js | Large bundle, date-fns is better |
| fetch | axios provides interceptors and retry |
| workbox-window | Using Quasar's built-in SW registration |

## Bundle Size Considerations

- Use dynamic imports for routes (code splitting)
- Tree-shake date-fns functions
- Workbox only imports needed modules
- Dexie is ~25KB gzipped (acceptable for offline benefits)
