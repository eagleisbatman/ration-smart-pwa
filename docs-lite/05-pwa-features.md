# PWA Features

## Manifest Identity

**File**: `src-pwa/manifest.json`

```json
{
  "id": "com.digitalgreen.rationsmart.lite",
  "name": "RationSmart Lite",
  "short_name": "RationSmart",
  "start_url": "/",
  "scope": "/"
}
```

The `id` field is a **stable, domain-independent identifier**. Chrome uses this to recognize the app across sessions. Without a unique `id`, reinstalling or accessing from a different URL could create duplicate app entries.

## Install Prompt (Add to Home Screen)

**Component**: `src/components/pwa/AddToHomeScreen.vue`

Behavior:
1. Banner appears after 30 seconds on the page
2. Full install prompt offered after 2 minutes
3. If dismissed, re-shown after 7 days
4. Suppressed during active simulation flow (`/cattle-info`, `/feed-selection`)
5. On successful install, dismissal flag is persisted to IndexedDB

### iOS
iOS Safari doesn't support `beforeinstallprompt`. The component shows manual instructions ("Add to Home Screen" via share menu) for iOS users.

## App Shortcuts

Two shortcuts are available when the app is installed:

| Shortcut | URL | Action |
|----------|-----|--------|
| New Simulation | `/cattle-info` | Jump to cattle info form |
| Diet History | `/diet-history` | View past simulations |

## Service Worker Updates

**Component**: `src/components/pwa/UpdatePrompt.vue`

When a new version is deployed:
1. Service worker detects the update in background
2. Update prompt banner appears to the user
3. User clicks "Update" to activate the new version
4. Page reloads with the latest code

The service worker does NOT auto-skip waiting — it waits for user confirmation to prevent mid-session disruptions.

## Offline Indicator

**Component**: `src/components/pwa/OfflineIndicator.vue`

Shows a non-intrusive banner when the device goes offline. Hides automatically when connectivity returns.

## Preventing Multiple Installs

Chrome identifies a PWA by the tuple `(origin, manifest.id)`. To prevent duplicates:

1. **Unique `id`**: Set to `com.digitalgreen.rationsmart.lite` (not `/`)
2. **Stable `start_url`**: Always `/`
3. **Single scope**: Always `/`
4. **A2HS dismissal**: Once installed, the prompt never reappears (IndexedDB flag)

If a user still sees duplicates:
- Old installs with `id: "/"` may coexist with the new `id`
- Solution: Uninstall old PWA, install fresh
