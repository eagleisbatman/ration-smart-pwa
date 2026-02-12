/**
 * Web Push notification subscription management.
 *
 * Handles:
 * - Requesting notification permission
 * - Subscribing to push via the service worker
 * - Registering/unregistering the subscription with the backend
 */

import { api } from 'src/lib/api';
import { ref } from 'vue';

export const pushPermission = ref<NotificationPermission>(
  typeof Notification !== 'undefined' ? Notification.permission : 'default'
);
export const pushSubscribed = ref(false);
export const pushLoading = ref(false);

const PUSH_SUB_KEY = 'push_subscription_registered';

/**
 * Check if Web Push is supported in this browser.
 */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Fetch the VAPID public key from the backend.
 * Returns null if not configured.
 */
async function getVapidPublicKey(): Promise<string | null> {
  try {
    const res = await api.get('/api/v1/app/vapid-public-key');
    return res.data?.vapid_public_key || null;
  } catch {
    console.warn('Failed to fetch VAPID public key');
    return null;
  }
}

/**
 * Convert a URL-safe base64 string to a Uint8Array (for applicationServerKey).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Request notification permission and subscribe to Web Push.
 * Registers the subscription with the backend.
 *
 * @param userId - The current user's UUID
 * @returns true if successfully subscribed
 */
export async function subscribeToPush(userId: string): Promise<boolean> {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported');
    return false;
  }

  pushLoading.value = true;
  try {
    // Request permission
    const permission = await Notification.requestPermission();
    pushPermission.value = permission;
    if (permission !== 'granted') {
      return false;
    }

    // Get VAPID key from backend
    const vapidKey = await getVapidPublicKey();
    if (!vapidKey) {
      console.warn('VAPID key not available; push subscription skipped');
      return false;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    // Send subscription to backend
    const subscriptionJson = JSON.stringify(subscription.toJSON());
    await api.post('/api/v1/app/device-tokens', {
      user_id: userId,
      token: subscriptionJson,
      platform: 'web',
    });

    pushSubscribed.value = true;
    localStorage.setItem(PUSH_SUB_KEY, 'true');
    return true;
  } catch (err) {
    console.error('Failed to subscribe to push:', err);
    return false;
  } finally {
    pushLoading.value = false;
  }
}

/**
 * Unsubscribe from Web Push and deactivate the token on the backend.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  pushLoading.value = true;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const subscriptionJson = JSON.stringify(subscription.toJSON());

      // Deactivate on backend
      try {
        await api.delete(
          `/api/v1/app/device-tokens/${encodeURIComponent(subscriptionJson)}`
        );
      } catch {
        // Token may not exist on backend — that's fine
      }

      // Unsubscribe locally
      await subscription.unsubscribe();
    }

    pushSubscribed.value = false;
    localStorage.removeItem(PUSH_SUB_KEY);
    return true;
  } catch (err) {
    console.error('Failed to unsubscribe from push:', err);
    return false;
  } finally {
    pushLoading.value = false;
  }
}

/**
 * Check if the user is currently subscribed to push.
 */
export async function checkPushSubscription(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    pushSubscribed.value = !!subscription;
    return !!subscription;
  } catch {
    return false;
  }
}

/**
 * Initialize push state on app boot.
 * Checks current permission and subscription status.
 */
export async function initPushState(): Promise<void> {
  if (!isPushSupported()) return;

  pushPermission.value = Notification.permission;
  await checkPushSubscription();
}
