import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import {
  isSyncing,
  syncProgress,
  lastSyncTime,
  pendingCount,
  hasPendingChanges,
  syncPendingChanges,
  initSyncManager,
  conflictCount,
  hasConflicts,
  resolveConflict,
  updateConflictCount,
} from 'src/lib/offline/sync-manager';
import { db } from 'src/lib/offline/db';
import { isOnline } from 'src/boot/pwa';

/** Threshold (0-1) at which a storage warning is shown */
const STORAGE_QUOTA_WARN_THRESHOLD = 0.8;

/** Track whether the warning has already been shown this session */
let storageWarningShown = false;

export const storageUsagePercent = ref<number | null>(null);

/**
 * Check IndexedDB / storage quota and warn the user when usage exceeds the
 * configured threshold.
 */
async function checkStorageQuota(
  notify: (opts: Record<string, unknown>) => void,
  t: (key: string, named?: Record<string, unknown>) => string,
): Promise<void> {
  if (storageWarningShown) return;
  if (!navigator.storage?.estimate) return;

  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    if (quota === 0) return;

    const percent = Math.round((usage / quota) * 100);
    storageUsagePercent.value = percent;

    if (usage / quota >= STORAGE_QUOTA_WARN_THRESHOLD) {
      storageWarningShown = true;
      const usageMB = Math.round(usage / 1024 / 1024);
      const quotaMB = Math.round(quota / 1024 / 1024);
      notify({
        type: 'warning',
        message: t('storage.quotaWarning', { usageMB, quotaMB, percent }),
        icon: 'storage',
        timeout: 8000,
      });
    }
  } catch {
    // Storage API not available or failed – silently ignore
  }
}

export function useOfflineSync() {
  const $q = useQuasar();
  const { t } = useI18n();

  // Initialize sync manager on first use
  initSyncManager();

  // Check storage quota on composable init
  void checkStorageQuota($q.notify.bind($q), t);

  // Watch for sync conflicts
  watch(
    () => conflictCount.value,
    (count, prevCount) => {
      if (count > 0 && count !== prevCount) {
        $q.notify({
          type: 'warning',
          message: t('sync.conflict.title'),
          caption: t('sync.conflict.conflictCount', { count }),
          icon: 'warning',
          timeout: 5000,
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
        return t('sync.offline');
      case 'syncing':
        return t('sync.syncing', { percent: syncProgress.value });
      case 'pending':
        return t('sync.pending', { count: pendingCount.value });
      case 'synced':
        return t('sync.synced');
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
        return 'grey-7';
      default:
        return 'grey';
    }
  });

  async function manualSync(): Promise<void> {
    if (!isOnline.value) {
      $q.notify({
        type: 'warning',
        message: t('offline.cannotSyncWhileOffline'),
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
        message: t('offline.changesCouldNotSync', { count: pendingCount.value }),
        icon: 'warning',
      });
    }
  }

  async function resolveAllConflicts(choice: 'local' | 'server'): Promise<void> {
    const conflicts = await db.getSyncConflicts();
    for (const conflict of conflicts) {
      if (conflict.id !== undefined) {
        await resolveConflict(conflict.id, choice);
      }
    }
    await updateConflictCount();
    $q.notify({
      type: 'positive',
      message: t('sync.conflict.resolved'),
      icon: 'check_circle',
      timeout: 2000,
    });
  }

  return {
    isOnline,
    isSyncing,
    syncProgress,
    lastSyncTime,
    pendingCount,
    hasPendingChanges,
    conflictCount,
    hasConflicts,
    syncStatus,
    syncStatusText,
    syncStatusIcon,
    syncStatusColor,
    storageUsagePercent,
    manualSync,
    resolveConflict,
    resolveAllConflicts,
  };
}
