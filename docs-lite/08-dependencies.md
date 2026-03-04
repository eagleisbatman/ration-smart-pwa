# Dependencies

## Core

| Package | Purpose |
|---------|---------|
| quasar v2 | UI framework with PWA tooling |
| vue v3 | Frontend framework (Composition API) |
| vue-router v4 | Routing |
| pinia v2 | State management |
| typescript v5 | Type safety |

## PWA / Offline

| Package | Purpose |
|---------|---------|
| workbox-core v7 | Service worker toolkit |
| workbox-precaching | App shell caching |
| workbox-routing | Request interception |
| workbox-strategies | NetworkFirst, CacheFirst, etc. |
| workbox-background-sync | Queue mutations when offline |
| workbox-expiration | TTL and max entries for caches |
| dexie v4 | IndexedDB wrapper (offline data) |

## HTTP / Utils

| Package | Purpose |
|---------|---------|
| axios | HTTP client with interceptors |
| axios-retry | Exponential backoff retry |
| uuid | RFC4122 UUID generation |
| vue-i18n | Internationalization (22 locales) |

## Styling

| Package | Purpose |
|---------|---------|
| @fontsource-variable/inter | Inter font (variable weight) |
| postcss-rtlcss | RTL CSS generation for Arabic/Urdu |

## Dev

| Package | Purpose |
|---------|---------|
| @quasar/app-vite v2 | Quasar CLI with Vite bundler |
| eslint + typescript-eslint | Linting |
| sass | SCSS compilation |

## Build Output

- Total JS: ~3.2 MB (uncompressed), ~800 KB gzipped
- Total CSS: ~260 KB (uncompressed), ~43 KB gzipped
- Dexie: ~25 KB gzipped
- Workbox: ~15 KB gzipped
