# Offline Storage System

## Storage Layers

RationSmart Lite uses three storage layers for offline support:

| Layer | Technology | Purpose | Cleared on Logout |
|-------|-----------|---------|-------------------|
| **IndexedDB** | Dexie.js | Feed catalog, reports, sync queue, settings | Yes (except master feeds) |
| **localStorage** | Web Storage API | Auth tokens, preferences, countries cache | Auth tokens only |
| **Service Worker Cache** | Workbox / Cache API | API responses, images, fonts, app shell | No (TTL-based expiry) |

## IndexedDB (Dexie.js)

**Database**: `RationSmartDB` (schema version 9)

### Tables

| Table | What's Stored | Size Estimate |
|-------|--------------|---------------|
| `feeds` | Master feed catalog + custom feeds | ~500 KB (500 feeds) |
| `reports` | Cached simulation reports | ~100 KB (100 reports) |
| `syncQueue` | Pending offline changes | ~1 KB (transient) |
| `syncHistory` | Audit trail of syncs | ~10 KB (pruned at 30 days) |
| `syncConflicts` | Detected data conflicts | ~1 KB (rare) |
| `reportQueue` | Queued report generation | ~1 KB (transient) |
| `settings` | App settings (a2hs_dismissed, etc.) | <1 KB |

**Note**: Tables like `cows`, `milkLogs`, `farmerProfiles`, `healthEvents`, `yieldData` exist in the schema (inherited from shared DB code) but are **not actively used** in app-lite. They remain empty.

### Key Operations

```typescript
// Feed caching
db.feeds.bulkPut(feeds);           // Cache master feeds
db.feeds.where('is_custom').equals(1).toArray(); // Get custom feeds

// Settings
db.setSetting('a2hs_dismissed', true);
db.getSetting('preferred_theme');

// Cleanup on logout
db.clearUserData();  // Clears everything except master feeds + sync history
```

## localStorage

| Key | Content | Persists After Logout |
|-----|---------|----------------------|
| `auth_token` | JWT bearer token | No |
| `user_id` | User UUID | No |
| `remember_me` | "1" flag | No |
| `preferred_language` | Locale code (en, hi, etc.) | Yes |
| `last_country_code` | Alpha-2 code for login pre-fill | Yes |
| `user_role` | farmer, researcher, etc. | Yes |
| `admin_level` | super_admin, country_admin, etc. | Yes |
| `milk_price_per_liter` | User's milk price setting | Yes |
| `milk_price_history` | JSON array of {price, date} | Yes |
| `cached_countries` | Full countries list JSON (~3 KB) | Yes |
| `app_theme` | Selected theme name | Yes |

### Dual Auth Storage

If "Remember Me" is checked, auth tokens go to **localStorage** (persistent). Otherwise, they go to **sessionStorage** (cleared when tab closes). On app reload, both are checked to find an existing session.

## Service Worker Caching

**File**: `src-pwa/custom-service-worker.ts`

| Route Pattern | Strategy | Cache Name | TTL | Max Entries |
|---------------|----------|-----------|-----|-------------|
| API GET (`/api/*`) | NetworkFirst | `api-cache-v1` | 24h | 100 |
| API mutations (POST/PUT/DELETE) | NetworkFirst + BackgroundSync | `mutations-queue` | 24h retry | — |
| Images | CacheFirst | `image-cache-v2` | 30 days | 60 |
| Google Fonts CSS | StaleWhileRevalidate | `google-fonts-stylesheets` | — | — |
| Google Fonts files | CacheFirst | `google-fonts-webfonts` | 1 year | 30 |
| Navigation (HTML) | NetworkFirst | `navigations` | 3s timeout | — |
| Build assets (JS/CSS) | Precache | auto | — | — |

### Background Sync

When the app is offline and a mutation (POST/PUT/DELETE) is attempted:
1. The service worker intercepts the failed request
2. It queues the request in IndexedDB (via Workbox BackgroundSync)
3. When connectivity returns, the request is automatically retried
4. HTTP 4xx errors are NOT retried (would loop forever)
5. Retries expire after 24 hours

## Total Storage Per User

| Component | Estimate |
|-----------|----------|
| localStorage | ~6 KB |
| IndexedDB (typical usage) | ~600 KB |
| Service Worker cache | 1–5 MB |
| **Total** | **~2–6 MB** |

Browser quota is typically 50% of available disk space (e.g., 50 MB on a device with 100 MB free).

## Cache Invalidation

| Storage | Invalidation Trigger | Notes |
|---------|---------------------|-------|
| IndexedDB user data | `logout()` call | Master feeds preserved |
| localStorage auth | `logout()` call | Preferences preserved |
| sessionStorage | Tab close | — |
| SW API cache | 24h TTL | Auto-expires |
| SW image cache | 30-day TTL | Auto-expires |

## Known Limitations

1. **Countries cache has no TTL** — cached indefinitely in localStorage until next login overwrites it
2. **Master feeds never auto-refresh** — cached until user clears browser data or reinstalls
3. **Sync history pruned at 30 days** — older audit trail is lost
4. **No storage quota monitoring** — app doesn't warn if approaching browser limits
5. **Report cache has no invalidation** — stale reports persist until logout
