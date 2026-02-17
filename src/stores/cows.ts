import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { api } from 'src/lib/api';
import { db, Cow } from 'src/lib/offline/db';
import { queueCreate, queueUpdate, queueDelete } from 'src/lib/offline/sync-manager';
import { useAuthStore } from './auth';
import { isOnline } from 'src/boot/pwa';
import { extractUserFriendlyError } from 'src/lib/error-messages';

export interface CowInput {
  name: string;
  tag_number?: string;
  coat_color?: string;
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
  image_url?: string;
  notes?: string;
  farmer_profile_id?: string;
}

export interface Breed {
  id: string;
  name: string;
}

export const useCowsStore = defineStore('cows', () => {
  // State
  const cows = ref<Cow[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const breeds = ref<Breed[]>([]);
  const breedsLoading = ref(false);

  // Computed
  const activeCows = computed(() =>
    cows.value.filter((cow) => cow.is_active && !cow._deleted)
  );

  const cowCount = computed(() => activeCows.value.length);

  // Getters
  function getCowsForFarmer(farmerProfileId: string): Cow[] {
    return cows.value.filter(
      (cow) => cow.farmer_profile_id === farmerProfileId && !cow._deleted
    );
  }

  // Actions
  async function fetchCows(farmerProfileId?: string): Promise<void> {
    const authStore = useAuthStore();
    if (!authStore.userId) return;

    loading.value = true;
    error.value = null;

    try {
      if (isOnline.value) {
        // Fetch from server — backend requires userId in path
        const params: Record<string, string> = {};
        if (farmerProfileId) {
          params.farmer_profile_id = farmerProfileId;
        }
        const response = await api.get(`/api/v1/cows/user/${authStore.userId}`, { params });
        // Adapter transforms backend fields → PWA fields and extracts array
        const serverCows = (Array.isArray(response.data) ? response.data : []).map((cow: Cow) => ({
          ...cow,
          user_id: cow.user_id || authStore.userId,
          _synced: true,
          _deleted: false,
        }));

        // Merge local-only fields with server data (server values take priority when present)
        const localCows = await db.cows.bulkGet(serverCows.map((c: Cow) => c.id));
        const mergedCows = serverCows.map((sc: Cow, i: number) => {
          const lc = localCows[i];
          if (!lc) return sc;
          return {
            ...sc,
            age_months: sc.age_months ?? lc.age_months,
            body_condition_score: sc.body_condition_score ?? lc.body_condition_score,
            activity_level: sc.activity_level ?? lc.activity_level,
            notes: sc.notes ?? lc.notes,
            tag_number: sc.tag_number ?? lc.tag_number,
            coat_color: sc.coat_color ?? lc.coat_color,
          };
        });

        // Update local database
        await db.cows.bulkPut(mergedCows);
      }

      // Load from local database
      if (farmerProfileId) {
        cows.value = await db.cows
          .where('farmer_profile_id')
          .equals(farmerProfileId)
          .filter((cow) => !cow._deleted)
          .toArray();
      } else if (authStore.userId) {
        cows.value = await db.cows
          .where({ user_id: authStore.userId })
          .filter((cow) => !cow._deleted)
          .toArray();
      }
    } catch (err) {
      // Fallback to local data (userId may have been cleared by 401 interceptor)
      if (farmerProfileId) {
        cows.value = await db.cows
          .where('farmer_profile_id')
          .equals(farmerProfileId)
          .filter((cow) => !cow._deleted)
          .toArray();
      } else if (authStore.userId) {
        cows.value = await db.cows
          .where({ user_id: authStore.userId })
          .filter((cow) => !cow._deleted)
          .toArray();
      }

      if (cows.value.length === 0 && authStore.userId) {
        error.value = extractUserFriendlyError(err);
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
        // Sync with server — adapter maps fields and backend resolves owner from token
        const response = await api.post('/api/v1/cows', input);
        const serverCow: Cow = { ...response.data, user_id: response.data.user_id || authStore.userId, _synced: true, _deleted: false };

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
      error.value = extractUserFriendlyError(err);

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
        // Sync with server — use update path so adapter maps to PUT /cow-profiles/:id
        await api.put(`/api/v1/cows/update/${id}`, input);
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
      error.value = extractUserFriendlyError(err);

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
        // Delete on server — adapter maps to DELETE /cow-profiles/:id
        await api.delete(`/api/v1/cows/delete/${id}`);
        await db.cows.delete(id);
      } else {
        // Queue for later sync
        await queueDelete('cow', id);
      }

      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);

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

  async function bulkDeleteCows(ids: string[]): Promise<number> {
    let successCount = 0;

    for (const id of ids) {
      const result = await deleteCow(id);
      if (result) successCount++;
    }

    return successCount;
  }

  async function bulkArchiveCows(ids: string[]): Promise<number> {
    let successCount = 0;

    for (const id of ids) {
      const result = await updateCow(id, { is_active: false } as Partial<CowInput>);
      if (result) successCount++;
    }

    return successCount;
  }

  async function fetchBreeds(countryId: string): Promise<void> {
    if (!countryId) return;

    breedsLoading.value = true;
    try {
      if (isOnline.value) {
        const response = await api.get(`/api/v1/auth/breeds/${countryId}`);
        const data = response.data as Breed[];
        breeds.value = data;
        // Cache in localStorage keyed by country
        localStorage.setItem(`cached_breeds_${countryId}`, JSON.stringify(data));
      } else {
        // Offline: load from localStorage cache
        const cached = localStorage.getItem(`cached_breeds_${countryId}`);
        if (cached) {
          breeds.value = JSON.parse(cached) as Breed[];
        }
      }
    } catch (err) {
      console.warn('[Cows] Failed to fetch breeds from API, trying localStorage cache:', err);
      // Fall back to localStorage cache
      const cached = localStorage.getItem(`cached_breeds_${countryId}`);
      if (cached) {
        try {
          breeds.value = JSON.parse(cached) as Breed[];
        } catch {
          console.warn('[Cows] Failed to parse cached breeds');
        }
      }
    } finally {
      breedsLoading.value = false;
    }
  }

  return {
    // State
    cows,
    loading,
    error,
    breeds,
    breedsLoading,
    // Computed
    activeCows,
    cowCount,
    // Getters
    getCowsForFarmer,
    // Actions
    fetchCows,
    getCow,
    createCow,
    updateCow,
    deleteCow,
    toggleCowActive,
    bulkDeleteCows,
    bulkArchiveCows,
    fetchBreeds,
  };
});
