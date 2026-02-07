import { ref, computed } from 'vue';
import { db, SyncQueueItem, SyncHistoryEntry } from './db';
import { api } from 'src/boot/axios';
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

// API endpoint mapping
// These must use the frontend path convention (/api/v1/...) so the
// api-adapter request interceptor can map them to backend paths.
const API_ENDPOINTS: Record<SyncQueueItem['entity_type'], string> = {
  cow: '/api/v1/cows',
  feed: '/api/v1/feeds/custom',
  diet: '/api/v1/diet/history',
  milk_log: '/api/v1/milk-logs',
  farmer: '/api/v1/farmer-profiles',
  yield: '/api/v1/yield-data',
};

// Update pending count
async function updatePendingCount(): Promise<void> {
  pendingCount.value = await db.syncQueue.count();
}

// Update conflict count
export async function updateConflictCount(): Promise<void> {
  const conflicts = await db.getSyncConflicts();
  conflictCount.value = conflicts.length;
}

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

  // Listen for online events to trigger sync
  window.addEventListener('online', () => {
    console.log('Back online - starting sync');
    syncPendingChanges();
  });

  // Initial sync if online
  if (isOnline.value) {
    syncPendingChanges();
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

      try {
        const synced = await syncItem(item);
        if (synced) {
          await db.removeFromSyncQueue(item.id!);
          // Log success to sync history
          await logSyncHistoryEntry({
            operation: 'push',
            entity_type: item.entity_type,
            entity_id: item.entity_id,
            entity_name: entityName,
            action: item.operation,
            status: 'success',
          });
        } else {
          // syncItem returned false means conflict was detected
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

        // Update retry count
        const t = i18n.global.t;
        const errorMessage = error instanceof Error ? error.message : t('sync.unknownError');
        await db.updateSyncQueueRetry(item.id!, errorMessage);

        // Log failure to sync history
        await logSyncHistoryEntry({
          operation: 'push',
          entity_type: item.entity_type,
          entity_id: item.entity_id,
          entity_name: entityName,
          action: item.operation,
          status: 'failed',
          error_message: errorMessage,
        });

        // If too many retries, skip this item for now
        const updatedItem = await db.syncQueue.get(item.id!);
        if (updatedItem && updatedItem.retry_count >= 5) {
          console.warn(`Item ${item.id} exceeded retry limit, skipping`);
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
      await api.post(endpoint, item.data);
      break;

    case 'update': {
      // Check for conflicts before pushing update
      const hasConflict = await checkForConflict(item, endpoint);
      if (hasConflict) {
        return false;
      }
      await api.put(`${endpoint}/${item.entity_id}`, item.data);
      break;
    }

    case 'delete':
      await api.delete(`${endpoint}/${item.entity_id}`);
      break;
  }

  // Mark local entity as synced
  await markEntitySynced(item.entity_type, item.entity_id, item.operation);
  return true;
}

// Check for conflict on update operations
async function checkForConflict(
  item: SyncQueueItem,
  endpoint: string
): Promise<boolean> {
  try {
    const response = await api.get(`${endpoint}/${item.entity_id}`);
    const serverData = response.data as Record<string, unknown>;

    // Compare updated_at timestamps
    const serverUpdatedAt = serverData.updated_at as string | undefined;
    const localUpdatedAt = item.data.updated_at as string | undefined;

    if (serverUpdatedAt && localUpdatedAt) {
      const serverTime = new Date(serverUpdatedAt).getTime();
      const localTime = new Date(localUpdatedAt).getTime();

      if (serverTime > localTime) {
        // Conflict detected - server has a newer version
        await db.addSyncConflict(
          item.entity_type,
          item.entity_id,
          item.data,
          serverData
        );
        // Remove from sync queue since we stored the conflict
        await db.removeFromSyncQueue(item.id!);
        return true;
      }
    }

    return false;
  } catch (error) {
    // If server fetch fails (404, network error, etc.), skip conflict check
    // and proceed with normal sync
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

  const endpoint = API_ENDPOINTS[conflict.entity_type];

  if (choice === 'local') {
    // Push local data to server
    await api.put(`${endpoint}/${conflict.entity_id}`, conflict.local_data);
  } else {
    // Update local IndexedDB with server data
    const table = getTableForEntityType(conflict.entity_type);
    if (table) {
      await table.update(conflict.entity_id, {
        ...conflict.server_data,
        _synced: true,
      });
    }
  }

  // Mark conflict as resolved
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
    // Remove from local DB after successful delete sync
    await table.delete(entityId);
  } else {
    // Mark as synced
    await table.update(entityId, { _synced: true });
  }
}

// Get Dexie table for entity type
function getTableForEntityType(entityType: SyncQueueItem['entity_type']) {
  switch (entityType) {
    case 'cow':
      return db.cows;
    case 'feed':
      return db.feeds;
    case 'diet':
      return db.diets;
    case 'milk_log':
      return db.milkLogs;
    case 'farmer':
      return db.farmerProfiles;
    case 'yield':
      return db.yieldData;
    default:
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

  // Try to sync immediately if online
  if (isOnline.value) {
    syncPendingChanges();
  }
}

// Queue an update operation
export async function queueUpdate(
  entityType: SyncQueueItem['entity_type'],
  entityId: string,
  data: Record<string, unknown>
): Promise<void> {
  // Check if there's already a pending create for this entity
  const existingCreate = await db.syncQueue
    .where({ entity_type: entityType, entity_id: entityId, operation: 'create' })
    .first();

  if (existingCreate) {
    // Update the create operation's data instead
    await db.syncQueue.update(existingCreate.id!, { data });
  } else {
    // Check for existing update
    const existingUpdate = await db.syncQueue
      .where({ entity_type: entityType, entity_id: entityId, operation: 'update' })
      .first();

    if (existingUpdate) {
      // Merge with existing update
      await db.syncQueue.update(existingUpdate.id!, {
        data: { ...existingUpdate.data, ...data },
      });
    } else {
      await db.addToSyncQueue(entityType, entityId, 'update', data);
    }
  }

  await updatePendingCount();

  // Try to sync immediately if online
  if (isOnline.value) {
    syncPendingChanges();
  }
}

// Queue a delete operation
export async function queueDelete(
  entityType: SyncQueueItem['entity_type'],
  entityId: string
): Promise<void> {
  // Remove any pending creates or updates for this entity
  await db.syncQueue
    .where({ entity_type: entityType, entity_id: entityId })
    .delete();

  // Check if entity was ever synced (has _synced: true)
  const table = getTableForEntityType(entityType);
  if (!table) return;

  const entity = await table.get(entityId);

  if (entity && (entity as { _synced?: boolean })._synced) {
    // Entity exists on server, queue delete
    await db.addToSyncQueue(entityType, entityId, 'delete', {});
  }

  // Mark as deleted locally
  await table.update(entityId, { _deleted: true });

  await updatePendingCount();

  // Try to sync immediately if online
  if (isOnline.value) {
    syncPendingChanges();
  }
}

// Force sync (pull from server)
export async function forcePullFromServer(
  entityType: SyncQueueItem['entity_type']
): Promise<void> {
  if (!isOnline.value) {
    throw new Error(i18n.global.t('offline.cannotSyncWhileOffline'));
  }

  const endpoint = API_ENDPOINTS[entityType];
  const response = await api.get(endpoint);
  const serverData = response.data;

  // Clear local data and replace with server data
  switch (entityType) {
    case 'cow':
      await db.cows.clear();
      if (Array.isArray(serverData)) {
        await db.cows.bulkPut(
          serverData.map((item) => ({ ...item, _synced: true, _deleted: false }))
        );
      }
      break;
    case 'feed':
      await db.feeds.clear();
      if (Array.isArray(serverData)) {
        await db.feeds.bulkPut(
          serverData.map((item) => ({ ...item, _synced: true, _deleted: false }))
        );
      }
      break;
    case 'diet':
      await db.diets.clear();
      if (Array.isArray(serverData)) {
        await db.diets.bulkPut(
          serverData.map((item) => ({ ...item, _synced: true }))
        );
      }
      break;
    case 'milk_log':
      await db.milkLogs.clear();
      if (Array.isArray(serverData)) {
        await db.milkLogs.bulkPut(
          serverData.map((item) => ({ ...item, _synced: true, _deleted: false }))
        );
      }
      break;
    case 'farmer':
      await db.farmerProfiles.clear();
      if (Array.isArray(serverData)) {
        await db.farmerProfiles.bulkPut(
          serverData.map((item) => ({ ...item, _synced: true, _deleted: false }))
        );
      }
      break;
    case 'yield':
      await db.yieldData.clear();
      if (Array.isArray(serverData)) {
        await db.yieldData.bulkPut(
          serverData.map((item) => ({ ...item, _synced: true, _deleted: false }))
        );
      }
      break;
  }
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
