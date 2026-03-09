import { ref, computed } from 'vue';
import { db, SyncQueueItem, SyncHistoryEntry } from './db';
import { api } from 'src/lib/api';
import { isOnline } from 'src/boot/pwa';
import { i18n } from 'src/boot/i18n';

// Sync state
export const isSyncing = ref(false);
export const syncProgress = ref(0);
export const lastSyncTime = ref<Date | null>(null);
export const pendingCount = ref(0);

// Conflict state
export const conflictCount = ref(0);
export const hasConflicts = computed(() => conflictCount.value > 0);

// Computed
export const hasPendingChanges = computed(() => pendingCount.value > 0);

// EC2 API endpoint mapping for CREATE operations.
// Only feed and diet are relevant for app-lite on EC2.
const API_ENDPOINTS: Partial<Record<SyncQueueItem['entity_type'], string>> = {
  feed: '/insert-custom-feed/',
  diet: '/diet-recommendation-working/',
};

/**
 * Get the correct URL for read/update/delete operations on a specific entity.
 */
function getEntityUrl(
  entityType: SyncQueueItem['entity_type'],
  entityId: string,
  operation: 'read' | 'update' | 'delete',
): string {
  if (entityType === 'feed') {
    if (operation === 'update') return '/update-custom-feed/';
    if (operation === 'delete') return `/feeds/delete-feed/${entityId}`;
    return `/feeds/${entityId}`;
  }
  if (entityType === 'diet') {
    return `/fetch-simulation-details/${entityId}`;
  }
  // Unsupported entity types on EC2
  return `/${entityType}/${entityId}`;
}

// Update pending count
async function updatePendingCount(): Promise<void> {
  pendingCount.value = await db.syncQueue.count();
}

// Update conflict count
export async function updateConflictCount(): Promise<void> {
  const conflicts = await db.getSyncConflicts();
  conflictCount.value = conflicts.length;
}

// Guard against duplicate online event listeners (e.g. HMR re-init)
let onlineListenerRegistered = false;

// Initialize sync manager
export async function initSyncManager(): Promise<void> {
  await updatePendingCount();
  await updateConflictCount();

  // Auto-prune old sync history entries
  try {
    await db.pruneOldSyncHistory(30);
  } catch (e) {
    console.warn('Failed to prune sync history:', e);
  }

  // Listen for online events to trigger sync (only once)
  if (!onlineListenerRegistered) {
    onlineListenerRegistered = true;
    window.addEventListener('online', () => {
      syncPendingChanges().catch(err => console.error('[SyncManager] Online sync failed:', err));
    });
  }

  // Initial sync if online
  if (isOnline.value) {
    syncPendingChanges().catch(err => console.error('[SyncManager] Initial sync failed:', err));
  }
}

// Sync all pending changes
export async function syncPendingChanges(): Promise<boolean> {
  if (isSyncing.value || !isOnline.value) {
    return false;
  }

  isSyncing.value = true;
  syncProgress.value = 0;

  try {
    const pendingItems = await db.getPendingSyncItems();
    const total = pendingItems.length;

    if (total === 0) {
      return true;
    }

    let completed = 0;

    for (const item of pendingItems) {
      const entityName = (item.data as Record<string, unknown>)?.name as string | undefined;

      // Skip entity types not supported on EC2
      if (!API_ENDPOINTS[item.entity_type] && item.operation === 'create') {
        console.warn(`[SyncManager] Skipping unsupported entity type: ${item.entity_type}`);
        await db.removeFromSyncQueue(item.id!);
        completed++;
        syncProgress.value = Math.round((completed / total) * 100);
        continue;
      }

      try {
        const synced = await syncItem(item);
        if (synced) {
          await db.removeFromSyncQueue(item.id!);
          await logSyncHistoryEntry({
            operation: 'push',
            entity_type: item.entity_type,
            entity_id: item.entity_id,
            entity_name: entityName,
            action: item.operation,
            status: 'success',
          });
        } else {
          await logSyncHistoryEntry({
            operation: 'push',
            entity_type: item.entity_type,
            entity_id: item.entity_id,
            entity_name: entityName,
            action: item.operation,
            status: 'conflict',
            error_message: 'Server has a newer version',
          });
        }
        completed++;
        syncProgress.value = Math.round((completed / total) * 100);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);

        const t = i18n.global.t;
        const errorMessage = error instanceof Error ? error.message : t('sync.unknownError');
        await db.updateSyncQueueRetry(item.id!, errorMessage);

        await logSyncHistoryEntry({
          operation: 'push',
          entity_type: item.entity_type,
          entity_id: item.entity_id,
          entity_name: entityName,
          action: item.operation,
          status: 'failed',
          error_message: errorMessage,
        });

        // Remove after too many retries
        const updatedItem = await db.syncQueue.get(item.id!);
        if (updatedItem && updatedItem.retry_count >= 5) {
          console.warn(`Item ${item.id} exceeded retry limit — removing from queue`);
          await db.removeFromSyncQueue(item.id!);
        }
      }
    }

    lastSyncTime.value = new Date();
    await updatePendingCount();
    await updateConflictCount();

    return pendingCount.value === 0;
  } finally {
    isSyncing.value = false;
  }
}

// Sync a single item (returns true if synced, false if conflict detected)
async function syncItem(item: SyncQueueItem): Promise<boolean> {
  const endpoint = API_ENDPOINTS[item.entity_type];

  switch (item.operation) {
    case 'create':
      if (endpoint) {
        await api.post(endpoint, item.data);
      }
      break;

    case 'update': {
      const readUrl = getEntityUrl(item.entity_type, item.entity_id, 'read');
      const hasConflict = await checkForConflict(item, readUrl);
      if (hasConflict) {
        return false;
      }
      const updateUrl = getEntityUrl(item.entity_type, item.entity_id, 'update');
      if (item.entity_type === 'feed') {
        // EC2 uses POST for update-custom-feed
        await api.post(updateUrl, item.data);
      } else {
        await api.put(updateUrl, item.data);
      }
      break;
    }

    case 'delete': {
      const deleteUrl = getEntityUrl(item.entity_type, item.entity_id, 'delete');
      await api.delete(deleteUrl);
      break;
    }
  }

  await markEntitySynced(item.entity_type, item.entity_id, item.operation);
  return true;
}

// Check for conflict on update operations
async function checkForConflict(
  item: SyncQueueItem,
  readUrl: string
): Promise<boolean> {
  try {
    const response = await api.get(readUrl);
    const serverData = response.data as Record<string, unknown>;

    const serverUpdatedAt = serverData.updated_at as string | undefined;
    const localUpdatedAt = item.data.updated_at as string | undefined;

    if (serverUpdatedAt && localUpdatedAt) {
      const serverTime = new Date(serverUpdatedAt).getTime();
      const localTime = new Date(localUpdatedAt).getTime();

      if (serverTime > localTime) {
        await db.addSyncConflict(
          item.entity_type,
          item.entity_id,
          item.data,
          serverData
        );
        await db.removeFromSyncQueue(item.id!);
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

// Resolve a sync conflict
export async function resolveConflict(
  conflictId: number,
  choice: 'local' | 'server'
): Promise<void> {
  const conflict = await db.syncConflicts.get(conflictId);
  if (!conflict) return;

  if (choice === 'local') {
    const updateUrl = getEntityUrl(conflict.entity_type, conflict.entity_id, 'update');
    if (conflict.entity_type === 'feed') {
      await api.post(updateUrl, conflict.local_data);
    } else {
      await api.put(updateUrl, conflict.local_data);
    }
  } else {
    const table = getTableForEntityType(conflict.entity_type);
    if (table) {
      await table.update(conflict.entity_id, {
        ...conflict.server_data,
        _synced: true,
      });
    }
  }

  await db.resolveSyncConflict(conflictId);
  await updateConflictCount();
}

// Mark local entity as synced
async function markEntitySynced(
  entityType: SyncQueueItem['entity_type'],
  entityId: string,
  operation: SyncQueueItem['operation']
): Promise<void> {
  const table = getTableForEntityType(entityType);
  if (!table) return;

  if (operation === 'delete') {
    await table.delete(entityId);
  } else {
    await table.update(entityId, { _synced: true });
  }
}

// Get Dexie table for entity type
function getTableForEntityType(entityType: SyncQueueItem['entity_type']) {
  switch (entityType) {
    case 'feed':
      return db.feeds;
    case 'diet':
      return db.diets;
    default:
      // cow, milk_log, farmer, yield, health_event not used on EC2
      return undefined;
  }
}

// Queue a create operation
export async function queueCreate(
  entityType: SyncQueueItem['entity_type'],
  entityId: string,
  data: Record<string, unknown>
): Promise<void> {
  await db.addToSyncQueue(entityType, entityId, 'create', data);
  await updatePendingCount();

  if (isOnline.value) {
    syncPendingChanges().catch(err => console.error('[SyncManager] Sync after create failed:', err));
  }
}

// Queue an update operation
export async function queueUpdate(
  entityType: SyncQueueItem['entity_type'],
  entityId: string,
  data: Record<string, unknown>
): Promise<void> {
  const existingCreate = await db.syncQueue
    .where({ entity_type: entityType, entity_id: entityId, operation: 'create' })
    .first();

  if (existingCreate) {
    await db.syncQueue.update(existingCreate.id!, { data });
  } else {
    const existingUpdate = await db.syncQueue
      .where({ entity_type: entityType, entity_id: entityId, operation: 'update' })
      .first();

    if (existingUpdate) {
      await db.syncQueue.update(existingUpdate.id!, {
        data: { ...existingUpdate.data, ...data },
      });
    } else {
      await db.addToSyncQueue(entityType, entityId, 'update', data);
    }
  }

  await updatePendingCount();

  if (isOnline.value) {
    syncPendingChanges().catch(err => console.error('[SyncManager] Sync after update failed:', err));
  }
}

// Queue a delete operation
export async function queueDelete(
  entityType: SyncQueueItem['entity_type'],
  entityId: string
): Promise<void> {
  await db.syncQueue
    .where({ entity_type: entityType, entity_id: entityId })
    .delete();

  const table = getTableForEntityType(entityType);
  if (!table) return;

  const entity = await table.get(entityId);

  if (entity && (entity as { _synced?: boolean })._synced) {
    await db.addToSyncQueue(entityType, entityId, 'delete', {});
  }

  await table.update(entityId, { _deleted: true });
  await updatePendingCount();

  if (isOnline.value) {
    syncPendingChanges().catch(err => console.error('[SyncManager] Sync after delete failed:', err));
  }
}

// Force sync (pull from server) — only feed supported on EC2
export async function forcePullFromServer(
  entityType: SyncQueueItem['entity_type']
): Promise<void> {
  if (!isOnline.value) {
    throw new Error(i18n.global.t('offline.cannotSyncWhileOffline'));
  }

  if (entityType === 'feed') {
    // Feeds are fetched via the feeds store, not directly here
    const { useFeedsStore } = await import('src/stores/feeds');
    const feedsStore = useFeedsStore();
    await feedsStore.fetchAllFeeds();
    return;
  }

  console.warn(`[SyncManager] forcePullFromServer not supported for entity type: ${entityType}`);
}

// Log a sync history entry
async function logSyncHistoryEntry(
  entry: Omit<SyncHistoryEntry, 'id' | 'timestamp'>
): Promise<void> {
  try {
    await db.addSyncHistoryEntry({
      ...entry,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Failed to log sync history entry:', e);
  }
}

// Export sync history access for UI
export async function getSyncHistory(limit = 50, offset = 0) {
  return db.getSyncHistory(limit, offset);
}

export async function clearSyncHistory() {
  return db.clearSyncHistory();
}
