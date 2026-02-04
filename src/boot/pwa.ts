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
    console.log('PWA install prompt available');
  });

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    isInstalled.value = true;
    canInstall.value = false;
    deferredPrompt.value = null;
  });

  // Network status listeners
  window.addEventListener('online', () => {
    isOnline.value = true;
    console.log('App is online');
  });

  window.addEventListener('offline', () => {
    isOnline.value = false;
    console.log('App is offline');
  });

  // Service worker update detection
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((reg) => {
      registration.value = reg;

      // Check for updates periodically (every 60 seconds)
      setInterval(() => {
        reg.update().catch(console.error);
      }, 60 * 1000);

      // Listen for new service worker
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content available
              updateAvailable.value = true;
              console.log('New version available');
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
      console.log('User accepted the install prompt');
      canInstall.value = false;
      deferredPrompt.value = null;
      return true;
    } else {
      console.log('User dismissed the install prompt');
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
