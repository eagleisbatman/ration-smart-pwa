import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/lib/api';
import { db, FarmerProfile } from 'src/lib/offline/db';
import { useAuthStore } from './auth';
import { v4 as uuidv4 } from 'uuid';
import { i18n } from 'src/boot/i18n';

export interface FarmerInput {
  organization_id?: string;
  name: string;
  phone?: string;
  village?: string;
  district?: string;
  state?: string;
  country_id?: string;
  total_cattle?: number;
  land_acres?: number;
  farming_type?: string;
  image_url?: string;
}

export interface FarmerSummary {
  farmer: FarmerProfile;
  statistics: {
    total_active_cows: number;
    lactating_cows: number;
    dry_cows: number;
    total_daily_milk_production: number;
    avg_milk_per_lactating_cow: number;
  };
}

export const useFarmersStore = defineStore('farmers', () => {
  // State
  const farmers = ref<FarmerProfile[]>([]);
  const currentFarmer = ref<FarmerProfile | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const farmerCount = computed(() => farmers.value.length);
  const activeFarmers = computed(() => farmers.value.filter((f) => f.is_active));
  // Managed farmers = active farmers excluding the user's own self-profile
  const managedFarmers = computed(() => activeFarmers.value.filter((f) => !f.is_self_profile));
  const activeFarmerCount = computed(() => managedFarmers.value.length);
  const isManagingFarmers = computed(() => managedFarmers.value.length > 0);

  // Helper to get translated text
  const t = i18n.global.t;

  // Helper to extract error message
  function extractErrorMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      return axiosError.response?.data?.detail || t('errors.generic');
    }
    if (err instanceof Error) {
      return err.message;
    }
    return t('errors.generic');
  }

  // Actions
  async function fetchFarmers(options?: {
    organizationId?: string;
    search?: string;
    includeInactive?: boolean;
  }): Promise<void> {
    loading.value = true;
    error.value = null;
    const authStore = useAuthStore();

    try {
      const response = await api.get('/api/v1/farmer-profiles', {
        params: {
          user_id: authStore.userId,
          organization_id: options?.organizationId,
          search: options?.search,
          include_inactive: options?.includeInactive || false,
        },
      });

      farmers.value = response.data.farmer_profiles || [];

      // Cache to IndexedDB
      await db.farmerProfiles.clear();
      for (const farmer of farmers.value) {
        await db.farmerProfiles.put({ ...farmer, _synced: true, _deleted: false });
      }
    } catch (err) {
      error.value = extractErrorMessage(err);

      // Try to load from IndexedDB cache
      const cached = await db.farmerProfiles
        .where('managed_by_user_id')
        .equals(authStore.userId || '')
        .toArray();
      if (cached.length > 0) {
        farmers.value = cached.filter((f) => !f._deleted);
      }
    } finally {
      loading.value = false;
    }
  }

  async function fetchFarmer(id: string): Promise<FarmerProfile | null> {
    loading.value = true;
    error.value = null;
    const authStore = useAuthStore();

    try {
      const response = await api.get(`/api/v1/farmer-profiles/${id}`, {
        params: { user_id: authStore.userId },
      });
      const farmer = response.data as FarmerProfile;

      // Update in local state
      const index = farmers.value.findIndex((f) => f.id === id);
      if (index !== -1) {
        farmers.value[index] = farmer;
      } else {
        farmers.value.push(farmer);
      }

      // Update cache
      await db.farmerProfiles.put({ ...farmer, _synced: true, _deleted: false });

      return farmer;
    } catch (err) {
      error.value = extractErrorMessage(err);

      // Try cache
      const cached = await db.farmerProfiles.get(id);
      return cached && !cached._deleted ? cached : null;
    } finally {
      loading.value = false;
    }
  }

  async function createFarmer(input: FarmerInput): Promise<FarmerProfile | null> {
    loading.value = true;
    error.value = null;
    const authStore = useAuthStore();

    // Create optimistic local record
    const localId = uuidv4();
    const now = new Date().toISOString();
    const localFarmer: FarmerProfile = {
      id: localId,
      organization_id: input.organization_id,
      managed_by_user_id: authStore.userId || '',
      name: input.name,
      phone: input.phone,
      village: input.village,
      district: input.district,
      state: input.state,
      country_id: input.country_id,
      total_cattle: input.total_cattle || 0,
      land_acres: input.land_acres,
      farming_type: input.farming_type,
      image_url: input.image_url,
      is_active: true,
      created_at: now,
      updated_at: now,
      _synced: false,
      _deleted: false,
    };

    try {
      const response = await api.post('/api/v1/farmer-profiles', input, {
        params: { user_id: authStore.userId },
      });
      const farmer = response.data as FarmerProfile;

      // Add to local state
      farmers.value.push(farmer);

      // Cache to IndexedDB
      await db.farmerProfiles.put({ ...farmer, _synced: true, _deleted: false });

      return farmer;
    } catch (err) {
      error.value = extractErrorMessage(err);

      // Save locally for offline sync
      farmers.value.push(localFarmer);
      await db.farmerProfiles.put(localFarmer);
      await db.addToSyncQueue('farmer', localId, 'create', input as unknown as Record<string, unknown>);

      return localFarmer;
    } finally {
      loading.value = false;
    }
  }

  async function updateFarmer(id: string, input: Partial<FarmerInput>): Promise<boolean> {
    loading.value = true;
    error.value = null;
    const authStore = useAuthStore();

    // Find current farmer for optimistic update
    const farmer = farmers.value.find((f) => f.id === id);
    if (!farmer) {
      error.value = t('farmer.farmerNotFound');
      loading.value = false;
      return false;
    }

    // Optimistic update
    const updatedFarmer = { ...farmer, ...input, updated_at: new Date().toISOString() };
    const index = farmers.value.findIndex((f) => f.id === id);
    farmers.value[index] = updatedFarmer;

    try {
      const response = await api.put(`/api/v1/farmer-profiles/${id}`, input, {
        params: { user_id: authStore.userId },
      });
      const serverFarmer = response.data as FarmerProfile;

      // Update with server response
      farmers.value[index] = serverFarmer;

      // Update current farmer if it's the one being edited
      if (currentFarmer.value?.id === id) {
        currentFarmer.value = serverFarmer;
      }

      // Update cache
      await db.farmerProfiles.put({ ...serverFarmer, _synced: true, _deleted: false });

      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);

      // Keep optimistic update and queue for sync
      await db.farmerProfiles.put({ ...updatedFarmer, _synced: false, _deleted: false });
      await db.addToSyncQueue('farmer', id, 'update', input as Record<string, unknown>);

      return true; // Return true since local update succeeded
    } finally {
      loading.value = false;
    }
  }

  async function archiveFarmer(id: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    const authStore = useAuthStore();

    try {
      await api.delete(`/api/v1/farmer-profiles/${id}`, {
        params: { user_id: authStore.userId, hard_delete: false },
      });

      // Update local state
      const index = farmers.value.findIndex((f) => f.id === id);
      if (index !== -1) {
        farmers.value[index].is_active = false;
      }

      // Clear current if it was archived
      if (currentFarmer.value?.id === id) {
        currentFarmer.value = null;
      }

      // Update cache
      const cached = await db.farmerProfiles.get(id);
      if (cached) {
        await db.farmerProfiles.put({ ...cached, is_active: false, _synced: true });
      }

      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);

      // Queue for sync
      await db.addToSyncQueue('farmer', id, 'delete', { soft: true });

      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteFarmer(id: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    const authStore = useAuthStore();

    try {
      await api.delete(`/api/v1/farmer-profiles/${id}`, {
        params: { user_id: authStore.userId, hard_delete: true },
      });

      // Remove from local state
      farmers.value = farmers.value.filter((f) => f.id !== id);

      // Clear current if it was deleted
      if (currentFarmer.value?.id === id) {
        currentFarmer.value = null;
      }

      // Remove from cache
      await db.farmerProfiles.delete(id);

      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function getFarmerSummary(id: string): Promise<FarmerSummary | null> {
    try {
      const response = await api.get(`/api/v1/farmer-profiles/${id}/summary`);
      return response.data as FarmerSummary;
    } catch (err) {
      error.value = extractErrorMessage(err);
      return null;
    }
  }

  async function getFarmerCows(id: string): Promise<unknown[]> {
    try {
      const response = await api.get(`/api/v1/farmer-profiles/${id}/cows`);
      return response.data.cows || [];
    } catch (err) {
      error.value = extractErrorMessage(err);
      return [];
    }
  }

  function selectFarmer(farmer: FarmerProfile | null): void {
    currentFarmer.value = farmer;
  }

  function clearError(): void {
    error.value = null;
  }

  function reset(): void {
    farmers.value = [];
    currentFarmer.value = null;
    loading.value = false;
    error.value = null;
  }

  // Load from IndexedDB cache on init
  async function loadFromCache(): Promise<void> {
    const authStore = useAuthStore();
    if (!authStore.userId) return;

    const cached = await db.farmerProfiles
      .where('managed_by_user_id')
      .equals(authStore.userId)
      .toArray();

    if (cached.length > 0) {
      farmers.value = cached.filter((f) => !f._deleted);
    }
  }

  return {
    // State
    farmers,
    currentFarmer,
    loading,
    error,
    // Computed
    farmerCount,
    activeFarmers,
    managedFarmers,
    activeFarmerCount,
    isManagingFarmers,
    // Actions
    fetchFarmers,
    fetchFarmer,
    createFarmer,
    updateFarmer,
    archiveFarmer,
    deleteFarmer,
    getFarmerSummary,
    getFarmerCows,
    selectFarmer,
    clearError,
    reset,
    loadFromCache,
  };
});
