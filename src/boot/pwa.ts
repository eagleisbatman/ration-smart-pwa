import { boot } from 'quasar/wrappers';
import { ref } from 'vue';

// PWA install prompt event
export const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
export const canInstall = ref(false);
export const isInstalled = ref(false);

// Service worker update available
export const updateAvailable = ref(false);
export const registration = ref<ServiceWorkerRegistration | null>(null);

// Network status
export const isOnline = ref(navigator.onLine);

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default boot(() => {
  // Check if already installed (standalone mode)
  isInstalled.value =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  // Listen for beforeinstallprompt event (Chrome/Android)
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferredPrompt.value = e as BeforeInstallPromptEvent;
    canInstall.value = true;
  });

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    isInstalled.value = true;
    canInstall.value = false;
    deferredPrompt.value = null;
  });

  // Network status listeners
  window.addEventListener('online', () => {
    isOnline.value = true;
  });

  window.addEventListener('offline', () => {
    isOnline.value = false;
  });

  // Service worker update detection
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      registration.value = reg;

      // Check for updates periodically (every 5 minutes, only when visible and online)
      setInterval(() => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
          reg.update().catch(console.error);
        }
      }, 5 * 60 * 1000);

      // Listen for new service worker
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available
              updateAvailable.value = true;
            }
          });
        }
      });
    });

    // Handle controller change (when skipWaiting is called)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Reload the page to get the new version
      window.location.reload();
    });
  }
});

// Function to trigger PWA install
export async function installPWA(): Promise<boolean> {
  if (!deferredPrompt.value) {
    return false;
  }

  try {
    await deferredPrompt.value.prompt();
    const { outcome } = await deferredPrompt.value.userChoice;

    if (outcome === 'accepted') {
      canInstall.value = false;
      deferredPrompt.value = null;
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error installing PWA:', error);
    return false;
  }
}

// Function to apply service worker update
export function applyUpdate(): void {
  if (registration.value?.waiting) {
    registration.value.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}
