import { ref, onMounted, onUnmounted } from 'vue';
import { isOnline as pwaIsOnline } from 'src/boot/pwa';

export function useNetworkStatus() {
  const isOnline = ref(navigator.onLine);
  const connectionType = ref<string | null>(null);
  const effectiveType = ref<string | null>(null);
  const downlink = ref<number | null>(null);

  function updateConnectionInfo() {
    const connection = (navigator as Navigator & {
      connection?: {
        type?: string;
        effectiveType?: string;
        downlink?: number;
      };
    }).connection;

    if (connection) {
      connectionType.value = connection.type || null;
      effectiveType.value = connection.effectiveType || null;
      downlink.value = connection.downlink || null;
    }
  }

  function handleOnline() {
    isOnline.value = true;
    updateConnectionInfo();
  }

  function handleOffline() {
    isOnline.value = false;
  }

  onMounted(() => {
    // Sync with PWA boot state
    isOnline.value = pwaIsOnline.value;

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes
    const connection = (navigator as Navigator & {
      connection?: EventTarget;
    }).connection;

    if (connection) {
      connection.addEventListener('change', updateConnectionInfo);
      updateConnectionInfo();
    }
  });

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);

    const connection = (navigator as Navigator & {
      connection?: EventTarget;
    }).connection;

    if (connection) {
      connection.removeEventListener('change', updateConnectionInfo);
    }
  });

  return {
    isOnline,
    connectionType,
    effectiveType,
    downlink,
  };
}
