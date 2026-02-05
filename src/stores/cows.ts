import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { api } from 'src/boot/axios';
import { db, Cow } from 'src/lib/offline/db';
import { queueCreate, queueUpdate, queueDelete } from 'src/lib/offline/sync-manager';
import { useAuthStore } from './auth';
import { isOnline } from 'src/boot/pwa';

export interface CowInput {
  name: string;
  breed: string;
  weight_kg: number;
  milk_yield_liters: number;
  milk_fat_percentage: number;
  lactation_stage: string;
  age_months?: number;
  body_condition_score?: number;
  is_pregnant?: boolean;
  pregnancy_month?: number;
  activity_level?: string;
  notes?: string;
}

export const useCowsStore = defineStore('cows', () => {
  // State
  const cows = ref<Cow[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const activeCows = computed(() =>
    cows.value.filter((cow) => cow.is_active && !cow._deleted)
  );

  const cowCount = computed(() => activeCows.value.length);

  // Actions
  async function fetchCows(): Promise<void> {
    const authStore = useAuthStore();
    if (!authStore.userId) return;

    loading.value = true;
    error.value = null;

    try {
      if (isOnline.value) {
        // Fetch from server
        const response = await api.get('/api/v1/cows');
        const serverCows = response.data.map((cow: Cow) => ({
          ...cow,
          _synced: true,
          _deleted: false,
        }));

        // Update local database
        await db.cows.bulkPut(serverCows);
      }

      // Load from local database
      cows.value = await db.cows
        .where({ user_id: authStore.userId })
        .filter((cow) => !cow._deleted)
        .toArray();
    } catch (err) {
      // Fallback to local data
      cows.value = await db.cows
        .where({ user_id: authStore.userId })
        .filter((cow) => !cow._deleted)
        .toArray();

      if (cows.value.length === 0) {
        error.value = extractErrorMessage(err);
      }
    } finally {
      loading.value = false;
    }
  }

  async function getCow(id: string): Promise<Cow | null> {
    // Try local first
    const cow = await db.cows.get(id);

    if (!cow && isOnline.value) {
      try {
        const response = await api.get(`/api/v1/cows/${id}`);
        const serverCow: Cow = { ...response.data, _synced: true, _deleted: false };
        await db.cows.put(serverCow);
        return serverCow;
      } catch {
        return null;
      }
    }

    return cow ?? null;
  }

  async function createCow(input: CowInput): Promise<Cow | null> {
    const authStore = useAuthStore();
    if (!authStore.userId) return null;

    loading.value = true;
    error.value = null;

    const newCow: Cow = {
      id: uuidv4(),
      user_id: authStore.userId,
      ...input,
      is_pregnant: input.is_pregnant ?? false,
      activity_level: input.activity_level ?? 'normal',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _synced: false,
      _deleted: false,
    };

    try {
      // Save to local database immediately (optimistic)
      await db.cows.put(newCow);
      cows.value.push(newCow);

      if (isOnline.value) {
        // Sync with server
        const response = await api.post('/api/v1/cows', input);
        const serverCow = { ...response.data, _synced: true, _deleted: false };

        // Update with server response (may have different ID)
        await db.cows.delete(newCow.id);
        await db.cows.put(serverCow);

        // Update local state
        const index = cows.value.findIndex((c) => c.id === newCow.id);
        if (index !== -1) {
          cows.value[index] = serverCow;
        }

        return serverCow;
      } else {
        // Queue for later sync
        await queueCreate('cow', newCow.id, input as unknown as Record<string, unknown>);
        return newCow;
      }
    } catch (err) {
      error.value = extractErrorMessage(err);

      // Still keep local if online sync failed
      if (!isOnline.value) {
        await queueCreate('cow', newCow.id, input as unknown as Record<string, unknown>);
        return newCow;
      }

      // Remove optimistically added cow on error
      await db.cows.delete(newCow.id);
      cows.value = cows.value.filter((c) => c.id !== newCow.id);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function updateCow(id: string, input: Partial<CowInput>): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const existingCow = await db.cows.get(id);
      if (!existingCow) {
        error.value = 'Cow not found';
        return false;
      }

      const updatedData = {
        ...input,
        updated_at: new Date().toISOString(),
      };

      // Update locally immediately (optimistic)
      await db.cows.update(id, { ...updatedData, _synced: false });

      // Update local state
      const index = cows.value.findIndex((c) => c.id === id);
      if (index !== -1) {
        cows.value[index] = { ...cows.value[index], ...updatedData, _synced: false };
      }

      if (isOnline.value) {
        // Sync with server
        await api.put(`/api/v1/cows/${id}`, input);
        await db.cows.update(id, { _synced: true });

        if (index !== -1) {
          cows.value[index]._synced = true;
        }
      } else {
        // Queue for later sync
        await queueUpdate('cow', id, input as unknown as Record<string, unknown>);
      }

      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);

      if (!isOnline.value) {
        await queueUpdate('cow', id, input as unknown as Record<string, unknown>);
        return true;
      }

      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteCow(id: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      // Mark as deleted locally (optimistic)
      await db.cows.update(id, { _deleted: true, is_active: false });
      cows.value = cows.value.filter((c) => c.id !== id);

      if (isOnline.value) {
        // Delete on server
        await api.delete(`/api/v1/cows/${id}`);
        await db.cows.delete(id);
      } else {
        // Queue for later sync
        await queueDelete('cow', id);
      }

      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);

      if (!isOnline.value) {
        await queueDelete('cow', id);
        return true;
      }

      // Restore on error
      await db.cows.update(id, { _deleted: false, is_active: true });
      await fetchCows();
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function toggleCowActive(id: string): Promise<boolean> {
    const cow = await db.cows.get(id);
    if (!cow) return false;

    return updateCow(id, { is_active: !cow.is_active } as Partial<CowInput>);
  }

  return {
    // State
    cows,
    loading,
    error,
    // Computed
    activeCows,
    cowCount,
    // Actions
    fetchCows,
    getCow,
    createCow,
    updateCow,
    deleteCow,
    toggleCowActive,
  };
});

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { detail?: string } } }).response;
    if (response?.data?.detail) {
      return response.data.detail;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'An unexpected error occurred';
}
