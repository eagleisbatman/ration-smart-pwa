import { computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import {
  isSyncing,
  syncProgress,
  lastSyncTime,
  pendingCount,
  hasPendingChanges,
  syncPendingChanges,
  initSyncManager,
} from 'src/lib/offline/sync-manager';
import { isOnline } from 'src/boot/pwa';

export function useOfflineSync() {
  const $q = useQuasar();

  // Initialize sync manager on first use
  initSyncManager();

  // Watch for sync completion and show notification
  watch(
    () => isSyncing.value,
    (syncing, wasSyncing) => {
      if (wasSyncing && !syncing && pendingCount.value === 0) {
        $q.notify({
          type: 'positive',
          message: 'All changes synced successfully',
          icon: 'cloud_done',
          timeout: 2000,
        });
      }
    }
  );

  // Watch for coming back online
  watch(
    () => isOnline.value,
    (online, wasOnline) => {
      if (online && !wasOnline && hasPendingChanges.value) {
        $q.notify({
          type: 'info',
          message: `Back online. Syncing ${pendingCount.value} pending changes...`,
          icon: 'sync',
          timeout: 3000,
        });
      }
    }
  );

  const syncStatus = computed(() => {
    if (!isOnline.value) {
      return 'offline';
    }
    if (isSyncing.value) {
      return 'syncing';
    }
    if (hasPendingChanges.value) {
      return 'pending';
    }
    return 'synced';
  });

  const syncStatusText = computed(() => {
    switch (syncStatus.value) {
      case 'offline':
        return 'Offline';
      case 'syncing':
        return `Syncing... ${syncProgress.value}%`;
      case 'pending':
        return `${pendingCount.value} pending`;
      case 'synced':
        return 'Synced';
      default:
        return '';
    }
  });

  const syncStatusIcon = computed(() => {
    switch (syncStatus.value) {
      case 'offline':
        return 'cloud_off';
      case 'syncing':
        return 'sync';
      case 'pending':
        return 'cloud_upload';
      case 'synced':
        return 'cloud_done';
      default:
        return 'cloud';
    }
  });

  const syncStatusColor = computed(() => {
    switch (syncStatus.value) {
      case 'offline':
        return 'grey';
      case 'syncing':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'synced':
        return 'positive';
      default:
        return 'grey';
    }
  });

  async function manualSync(): Promise<void> {
    if (!isOnline.value) {
      $q.notify({
        type: 'warning',
        message: 'Cannot sync while offline',
        icon: 'cloud_off',
      });
      return;
    }

    if (isSyncing.value) {
      return;
    }

    const success = await syncPendingChanges();

    if (!success && pendingCount.value > 0) {
      $q.notify({
        type: 'warning',
        message: `${pendingCount.value} changes could not be synced`,
        icon: 'warning',
      });
    }
  }

  return {
    isOnline,
    isSyncing,
    syncProgress,
    lastSyncTime,
    pendingCount,
    hasPendingChanges,
    syncStatus,
    syncStatusText,
    syncStatusIcon,
    syncStatusColor,
    manualSync,
  };
}
