/// <reference lib="webworker" />

import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import {
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
} from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope;

// Precache and route the build assets
precacheAndRoute(self.__WB_MANIFEST);

// Clean up outdated caches
cleanupOutdatedCaches();

// Cache names
const API_CACHE = 'api-cache-v1';
const IMAGE_CACHE = 'image-cache-v2';
const STATIC_CACHE = 'static-cache-v1';

// Background sync queue for mutations
// NOTE: Only network failures re-queue a request. HTTP 4xx errors (like 409
// Conflict) are NOT retried — retrying a conflict will never succeed and would
// loop for the full 24-hour retention window.
const bgSyncPlugin = new BackgroundSyncPlugin('mutations-queue', {
  maxRetentionTime: 24 * 60, // Retry for max of 24 hours (specified in minutes)
  onSync: async ({ queue }) => {
    let entry;
    while ((entry = await queue.shiftRequest())) {
      try {
        const response = await fetch(entry.request.clone());
        // Only re-queue if the request truly failed to reach the server (network
        // error). Server-side errors (4xx/5xx) are final for offline mutations.
        if (!response.ok && response.status < 500) {
          // 4xx: client error — retrying will not help; discard silently.
          console.warn(
            'BGSync: discarding non-retriable response',
            response.status,
            entry.request.url
          );
        }
        // 5xx errors: swallow and continue (server may recover by next sync)
      } catch (error) {
        // Network failure — put back so it retries on the next sync event
        console.error('BGSync replay failed (network error)', entry.request.url, error);
        await queue.unshiftRequest(entry);
        throw error;
      }
    }
  },
});

// API GET requests - Network First with cache fallback
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/api/') && request.method === 'GET',
  new NetworkFirst({
    cacheName: API_CACHE,
    networkTimeoutSeconds: 10,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// API mutations (POST, PUT, DELETE) - Background sync
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/api/') &&
    ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method),
  new NetworkFirst({
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/api/') &&
    ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method),
  new NetworkFirst({
    plugins: [bgSyncPlugin],
  }),
  'PUT'
);

registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith('/api/') &&
    ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method),
  new NetworkFirst({
    plugins: [bgSyncPlugin],
  }),
  'DELETE'
);

// Images - Cache First with expiration
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: IMAGE_CACHE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Google Fonts stylesheets - Stale While Revalidate
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

// Google Fonts webfont files - Cache First (long-lived)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
      }),
    ],
  })
);

// Static assets (JS, CSS) - Stale While Revalidate
registerRoute(
  ({ request }) =>
    request.destination === 'script' || request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: STATIC_CACHE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Navigation routes - Network First with offline fallback
const navigationRoute = new NavigationRoute(
  new NetworkFirst({
    cacheName: 'navigations',
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
  {
    // Return offline page for navigation failures
    denylist: [/^\/__/, /\/[^/?]+\.[^/]+$/],
  }
);
registerRoute(navigationRoute);

// Only skip waiting when explicitly requested by the user via the update prompt
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Claim clients immediately on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options: NotificationOptions & { vibrate?: number[]; actions?: Array<{ action: string; title: string; icon?: string }> } = {
    body: data.body || 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: {
      url: data.url || '/',
    },
  };

  // Add actions if provided
  if (data.actions && Array.isArray(data.actions)) {
    options.actions = data.actions;
  }

  // Add vibrate pattern if supported
  if ('vibrate' in navigator) {
    options.vibrate = [100, 50, 100];
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'RationSmart', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(async (windowClients) => {
      // Check if there's already a window/tab open
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          await client.focus();
          return;
        }
      }
      // Open a new window/tab
      if (self.clients.openWindow) {
        await self.clients.openWindow(urlToOpen);
      }
    })
  );
});
