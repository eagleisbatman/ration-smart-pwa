import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';
import { db, YieldData } from 'src/lib/offline/db';
import { useAuthStore } from './auth';
import { v4 as uuidv4 } from 'uuid';

export interface YieldInput {
  farmer_profile_id: string;
  cow_profile_id?: string;
  diet_recommendation_id?: string;
  collection_date: string;
  milk_yield_liters?: number;
  fat_percentage?: number;
  snf_percentage?: number;
  notes?: string;
}

export interface YieldAnalytics {
  total_records: number;
  avg_milk_yield: number | null;
  avg_fat_percentage: number | null;
  avg_snf_percentage: number | null;
  total_farmers: number;
  date_range_start: string | null;
  date_range_end: string | null;
}

export const useYieldsStore = defineStore('yields', () => {
  // State
  const yieldRecords = ref<YieldData[]>([]);
  const analytics = ref<YieldAnalytics | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const yieldCount = computed(() => yieldRecords.value.length);
  const recentYields = computed(() =>
    [...yieldRecords.value]
      .sort((a, b) => new Date(b.collection_date).getTime() - new Date(a.collection_date).getTime())
      .slice(0, 10)
  );
  const averageMilkYield = computed(() => {
    const yields = yieldRecords.value.filter((y) => y.milk_yield_liters != null);
    if (yields.length === 0) return 0;
    const sum = yields.reduce((acc, y) => acc + (y.milk_yield_liters || 0), 0);
    return Math.round((sum / yields.length) * 100) / 100;
  });

  // Helper to extract error message
  function extractErrorMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      return axiosError.response?.data?.detail || 'An error occurred';
    }
    if (err instanceof Error) {
      return err.message;
    }
    return 'An unexpected error occurred';
  }

  // Actions
  async function fetchYieldHistory(options?: {
    farmerProfileId?: string;
    cowProfileId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<void> {
    loading.value = true;
    error.value = null;
    const authStore = useAuthStore();

    try {
      const response = await api.get('/api/v1/yield-data', {
        params: {
          farmer_profile_id: options?.farmerProfileId,
          cow_profile_id: options?.cowProfileId,
          date_from: options?.dateFrom,
          date_to: options?.dateTo,
          collected_by_user_id: authStore.userId,
        },
      });

      yieldRecords.value = response.data.yield_data || [];

      // Cache to IndexedDB (only if filtering by farmer)
      if (options?.farmerProfileId) {
        // Clear existing records for this farmer
        await db.yieldData
          .where('farmer_profile_id')
          .equals(options.farmerProfileId)
          .delete();

        for (const record of yieldRecords.value) {
          await db.yieldData.put({ ...record, _synced: true, _deleted: false });
        }
      }
    } catch (err) {
      error.value = extractErrorMessage(err);

      // Try to load from IndexedDB cache
      if (options?.farmerProfileId) {
        const cached = await db.yieldData
          .where('farmer_profile_id')
          .equals(options.farmerProfileId)
          .toArray();
        if (cached.length > 0) {
          yieldRecords.value = cached.filter((y) => !y._deleted);
        }
      }
    } finally {
      loading.value = false;
    }
  }

  async function fetchFarmerYieldHistory(farmerId: string, options?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/api/v1/yield-data/farmer/${farmerId}`, {
        params: {
          date_from: options?.dateFrom,
          date_to: options?.dateTo,
        },
      });

      yieldRecords.value = response.data.yield_data || [];

      // Cache to IndexedDB
      await db.yieldData
        .where('farmer_profile_id')
        .equals(farmerId)
        .delete();

      for (const record of yieldRecords.value) {
        await db.yieldData.put({ ...record, _synced: true, _deleted: false });
      }
    } catch (err) {
      error.value = extractErrorMessage(err);

      // Try cache
      const cached = await db.yieldData
        .where('farmer_profile_id')
        .equals(farmerId)
        .toArray();
      if (cached.length > 0) {
        yieldRecords.value = cached.filter((y) => !y._deleted);
      }
    } finally {
      loading.value = false;
    }
  }

  async function fetchCowYieldHistory(cowId: string, options?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<void> {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/api/v1/yield-data/cow/${cowId}`, {
        params: {
          date_from: options?.dateFrom,
          date_to: options?.dateTo,
        },
      });

      yieldRecords.value = response.data.yield_data || [];

      // Cache to IndexedDB
      await db.yieldData
        .where('cow_profile_id')
        .equals(cowId)
        .delete();

      for (const record of yieldRecords.value) {
        await db.yieldData.put({ ...record, _synced: true, _deleted: false });
      }
    } catch (err) {
      error.value = extractErrorMessage(err);

      // Try cache
      const cached = await db.yieldData
        .where('cow_profile_id')
        .equals(cowId)
        .toArray();
      if (cached.length > 0) {
        yieldRecords.value = cached.filter((y) => !y._deleted);
      }
    } finally {
      loading.value = false;
    }
  }

  async function recordYield(input: YieldInput): Promise<YieldData | null> {
    loading.value = true;
    error.value = null;
    const authStore = useAuthStore();

    // Create optimistic local record
    const localId = uuidv4();
    const now = new Date().toISOString();
    const localRecord: YieldData = {
      id: localId,
      farmer_profile_id: input.farmer_profile_id,
      cow_profile_id: input.cow_profile_id,
      diet_recommendation_id: input.diet_recommendation_id,
      collection_date: input.collection_date,
      milk_yield_liters: input.milk_yield_liters,
      fat_percentage: input.fat_percentage,
      snf_percentage: input.snf_percentage,
      collected_by_user_id: authStore.userId || '',
      notes: input.notes,
      created_at: now,
      _synced: false,
      _deleted: false,
    };

    try {
      const response = await api.post('/api/v1/yield-data', input, {
        params: { user_id: authStore.userId },
      });
      const record = response.data as YieldData;

      // Add to local state
      yieldRecords.value.unshift(record);

      // Cache to IndexedDB
      await db.yieldData.put({ ...record, _synced: true, _deleted: false });

      return record;
    } catch (err) {
      error.value = extractErrorMessage(err);

      // Save locally for offline sync
      yieldRecords.value.unshift(localRecord);
      await db.yieldData.put(localRecord);
      await db.addToSyncQueue('yield', localId, 'create', input as Record<string, unknown>);

      return localRecord;
    } finally {
      loading.value = false;
    }
  }

  async function updateYield(id: string, input: Partial<YieldInput>): Promise<boolean> {
    loading.value = true;
    error.value = null;
    const authStore = useAuthStore();

    // Find current record for optimistic update
    const record = yieldRecords.value.find((y) => y.id === id);
    if (!record) {
      error.value = 'Yield record not found';
      loading.value = false;
      return false;
    }

    // Optimistic update
    const index = yieldRecords.value.findIndex((y) => y.id === id);
    const updatedRecord = { ...record, ...input };
    yieldRecords.value[index] = updatedRecord;

    try {
      const response = await api.put(`/api/v1/yield-data/${id}`, input, {
        params: { user_id: authStore.userId },
      });
      const serverRecord = response.data as YieldData;

      // Update with server response
      yieldRecords.value[index] = serverRecord;

      // Update cache
      await db.yieldData.put({ ...serverRecord, _synced: true, _deleted: false });

      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);

      // Keep optimistic update and queue for sync
      await db.yieldData.put({ ...updatedRecord, _synced: false, _deleted: false });
      await db.addToSyncQueue('yield', id, 'update', input as Record<string, unknown>);

      return true; // Return true since local update succeeded
    } finally {
      loading.value = false;
    }
  }

  async function deleteYield(id: string): Promise<boolean> {
    loading.value = true;
    error.value = null;
    const authStore = useAuthStore();

    try {
      await api.delete(`/api/v1/yield-data/${id}`, {
        params: { user_id: authStore.userId },
      });

      // Remove from local state
      yieldRecords.value = yieldRecords.value.filter((y) => y.id !== id);

      // Remove from cache
      await db.yieldData.delete(id);

      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);

      // Mark as deleted locally
      const cached = await db.yieldData.get(id);
      if (cached) {
        await db.yieldData.put({ ...cached, _deleted: true });
        await db.addToSyncQueue('yield', id, 'delete', {});
      }

      // Remove from local state
      yieldRecords.value = yieldRecords.value.filter((y) => y.id !== id);

      return true; // Return true since local delete succeeded
    } finally {
      loading.value = false;
    }
  }

  async function fetchOrganizationAnalytics(orgId: string, options?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<YieldAnalytics | null> {
    loading.value = true;
    error.value = null;

    try {
      const response = await api.get(`/api/v1/yield-data/analytics/organization/${orgId}`, {
        params: {
          date_from: options?.dateFrom,
          date_to: options?.dateTo,
        },
      });

      analytics.value = response.data as YieldAnalytics;
      return analytics.value;
    } catch (err) {
      error.value = extractErrorMessage(err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  function reset(): void {
    yieldRecords.value = [];
    analytics.value = null;
    loading.value = false;
    error.value = null;
  }

  // Load from IndexedDB cache on init
  async function loadFromCache(farmerProfileId?: string): Promise<void> {
    if (!farmerProfileId) return;

    const cached = await db.yieldData
      .where('farmer_profile_id')
      .equals(farmerProfileId)
      .toArray();

    if (cached.length > 0) {
      yieldRecords.value = cached.filter((y) => !y._deleted);
    }
  }

  return {
    // State
    yieldRecords,
    analytics,
    loading,
    error,
    // Computed
    yieldCount,
    recentYields,
    averageMilkYield,
    // Actions
    fetchYieldHistory,
    fetchFarmerYieldHistory,
    fetchCowYieldHistory,
    recordYield,
    updateYield,
    deleteYield,
    fetchOrganizationAnalytics,
    clearError,
    reset,
    loadFromCache,
  };
});
