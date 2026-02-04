import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { api } from 'src/boot/axios';
import { db, Diet } from 'src/lib/offline/db';
import { useAuthStore } from './auth';
import { isOnline } from 'src/boot/pwa';

export interface DietInput {
  cow_id?: string;
  cow_name?: string;
  // Animal details
  weight_kg: number;
  milk_yield_liters: number;
  milk_fat_percentage: number;
  lactation_stage: string;
  age_months?: number;
  body_condition_score?: number;
  is_pregnant?: boolean;
  pregnancy_month?: number;
  activity_level?: string;
  // Optimization settings
  optimization_goal: 'minimize_cost' | 'maximize_milk' | 'balanced';
  available_feeds: string[]; // Feed IDs
  feed_constraints?: Record<string, { min?: number; max?: number }>;
  budget_per_day?: number;
}

export interface DietResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_cost: number;
  dm_intake: number;
  cp_percentage: number;
  tdn_percentage: number;
  feeds: Array<{
    feed_id: string;
    feed_name: string;
    amount_kg: number;
    cost: number;
    dm_contribution: number;
    cp_contribution: number;
    tdn_contribution: number;
  }>;
  nutrient_balance: {
    cp_requirement: number;
    cp_supplied: number;
    tdn_requirement: number;
    tdn_supplied: number;
    dm_requirement: number;
    dm_supplied: number;
  };
  recommendations?: string[];
  warnings?: string[];
}

export const useDietsStore = defineStore('diets', () => {
  // State
  const diets = ref<Diet[]>([]);
  const currentDiet = ref<Diet | null>(null);
  const loading = ref(false);
  const optimizing = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const completedDiets = computed(() =>
    diets.value.filter((d) => d.status === 'completed')
  );

  const recentDiets = computed(() =>
    [...diets.value]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
  );

  // Actions
  async function fetchDiets(): Promise<void> {
    const authStore = useAuthStore();
    if (!authStore.userId) return;

    loading.value = true;
    error.value = null;

    try {
      if (isOnline.value) {
        const response = await api.get('/api/v1/diet/history');
        const serverDiets = response.data.map((diet: Diet) => ({
          ...diet,
          _synced: true,
        }));

        // Update local database
        await db.diets.bulkPut(serverDiets);
      }

      // Load from local database
      diets.value = await db.diets
        .where({ user_id: authStore.userId })
        .reverse()
        .sortBy('created_at');
    } catch (err) {
      // Fallback to local data
      diets.value = await db.diets
        .where({ user_id: authStore.userId })
        .reverse()
        .sortBy('created_at');

      if (diets.value.length === 0) {
        error.value = extractErrorMessage(err);
      }
    } finally {
      loading.value = false;
    }
  }

  async function getDiet(id: string): Promise<Diet | null> {
    // Try local first
    let diet = await db.diets.get(id);

    if (!diet && isOnline.value) {
      try {
        const response = await api.get(`/api/v1/diet/${id}`);
        const serverDiet: Diet = { ...response.data, _synced: true };
        await db.diets.put(serverDiet);
        currentDiet.value = serverDiet;
        return serverDiet;
      } catch {
        return null;
      }
    }

    currentDiet.value = diet ?? null;
    return diet ?? null;
  }

  async function optimizeDiet(input: DietInput): Promise<Diet | null> {
    const authStore = useAuthStore();
    if (!authStore.userId) return null;

    if (!isOnline.value) {
      error.value = 'Diet optimization requires an internet connection';
      return null;
    }

    optimizing.value = true;
    error.value = null;

    const localId = uuidv4();

    // Create placeholder diet
    const placeholderDiet: Diet = {
      id: localId,
      user_id: authStore.userId,
      cow_id: input.cow_id,
      cow_name: input.cow_name,
      optimization_goal: input.optimization_goal,
      status: 'pending',
      input_data: input as unknown as Record<string, unknown>,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _synced: false,
    };

    try {
      // Add placeholder to state
      diets.value.unshift(placeholderDiet);
      currentDiet.value = placeholderDiet;

      // Call optimization API
      const response = await api.post('/api/v1/diet/optimize', input);
      const serverDiet: Diet = {
        ...response.data,
        _synced: true,
      };

      // Remove placeholder and add server response
      diets.value = diets.value.filter((d) => d.id !== localId);
      diets.value.unshift(serverDiet);

      // Save to local database
      await db.diets.put(serverDiet);

      currentDiet.value = serverDiet;
      return serverDiet;
    } catch (err) {
      error.value = extractErrorMessage(err);

      // Remove placeholder on error
      diets.value = diets.value.filter((d) => d.id !== localId);
      currentDiet.value = null;

      return null;
    } finally {
      optimizing.value = false;
    }
  }

  async function evaluateDiet(
    dietId: string,
    actualFeeds: Array<{ feed_id: string; amount_kg: number }>
  ): Promise<Record<string, unknown> | null> {
    if (!isOnline.value) {
      error.value = 'Diet evaluation requires an internet connection';
      return null;
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await api.post(`/api/v1/diet/${dietId}/evaluate`, {
        actual_feeds: actualFeeds,
      });
      return response.data;
    } catch (err) {
      error.value = extractErrorMessage(err);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function deleteDiet(id: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      if (isOnline.value) {
        await api.delete(`/api/v1/diet/${id}`);
      }

      await db.diets.delete(id);
      diets.value = diets.value.filter((d) => d.id !== id);

      if (currentDiet.value?.id === id) {
        currentDiet.value = null;
      }

      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function getDietsForCow(cowId: string): Promise<Diet[]> {
    return db.diets
      .where({ cow_id: cowId })
      .reverse()
      .sortBy('created_at');
  }

  function clearCurrentDiet(): void {
    currentDiet.value = null;
  }

  return {
    // State
    diets,
    currentDiet,
    loading,
    optimizing,
    error,
    // Computed
    completedDiets,
    recentDiets,
    // Actions
    fetchDiets,
    getDiet,
    optimizeDiet,
    evaluateDiet,
    deleteDiet,
    getDietsForCow,
    clearCurrentDiet,
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
