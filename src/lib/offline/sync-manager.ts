import { ref, computed } from 'vue';
import { db, SyncQueueItem } from './db';
import { api } from 'src/boot/axios';
import { isOnline } from 'src/boot/pwa';

// Sync state
export const isSyncing = ref(false);
export const syncProgress = ref(0);
export const lastSyncTime = ref<Date | null>(null);
export const pendingCount = ref(0);

// Computed
export const hasPendingChanges = computed(() => pendingCount.value > 0);

// API endpoint mapping
const API_ENDPOINTS: Record<SyncQueueItem['entity_type'], string> = {
  cow: '/api/v1/cows',
  feed: '/api/v1/feeds/custom',
  diet: '/api/v1/diet',
  milk_log: '/api/v1/milk-logs',
};

// Update pending count
async function updatePendingCount(): Promise<void> {
  pendingCount.value = await db.syncQueue.count();
}

// Initialize sync manager
export async function initSyncManager(): Promise<void> {
  await updatePendingCount();

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
      try {
        await syncItem(item);
        await db.removeFromSyncQueue(item.id!);
        completed++;
        syncProgress.value = Math.round((completed / total) * 100);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);

        // Update retry count
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await db.updateSyncQueueRetry(item.id!, errorMessage);

        // If too many retries, skip this item for now
        const updatedItem = await db.syncQueue.get(item.id!);
        if (updatedItem && updatedItem.retry_count >= 5) {
          console.warn(`Item ${item.id} exceeded retry limit, skipping`);
        }
      }
    }

    lastSyncTime.value = new Date();
    await updatePendingCount();

    return pendingCount.value === 0;
  } finally {
    isSyncing.value = false;
  }
}

// Sync a single item
async function syncItem(item: SyncQueueItem): Promise<void> {
  const endpoint = API_ENDPOINTS[item.entity_type];

  switch (item.operation) {
    case 'create':
      await api.post(endpoint, item.data);
      break;

    case 'update':
      await api.put(`${endpoint}/${item.entity_id}`, item.data);
      break;

    case 'delete':
      await api.delete(`${endpoint}/${item.entity_id}`);
      break;
  }

  // Mark local entity as synced
  await markEntitySynced(item.entity_type, item.entity_id, item.operation);
}

// Mark local entity as synced
async function markEntitySynced(
  entityType: SyncQueueItem['entity_type'],
  entityId: string,
  operation: SyncQueueItem['operation']
): Promise<void> {
  const table = getTableForEntityType(entityType);

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
    throw new Error('Cannot sync while offline');
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
  }
}
