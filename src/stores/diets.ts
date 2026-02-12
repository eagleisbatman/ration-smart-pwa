import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { api } from 'src/boot/axios';
import { db, Diet } from 'src/lib/offline/db';
import { useAuthStore } from './auth';
import { useCowsStore } from './cows';
import { useFeedsStore } from './feeds';
import { isOnline } from 'src/boot/pwa';
import { getCountryId } from 'src/services/api-adapter';

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
  feed_price_overrides?: Record<string, number>; // Per-feed price overrides from user
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

/** Sort diets so actively followed ones appear first, then by created_at desc. */
function sortWithActiveFirst(list: Diet[]): Diet[] {
  return [...list].sort((a, b) => {
    if (a.is_active && !b.is_active) return -1;
    if (!a.is_active && b.is_active) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export const useDietsStore = defineStore('diets', () => {
  // State
  const diets = ref<Diet[]>([]);
  const currentDiet = ref<Diet | null>(null);
  const loading = ref(false);
  const optimizing = ref(false);
  const error = ref<string | null>(null);
  /** Map of cow_id → active (followed) diet */
  const activeDiets = ref<Record<string, Diet>>({});

  // Computed
  const completedDiets = computed(() =>
    diets.value.filter((d) => d.status === 'completed')
  );

  const recentDiets = computed(() =>
    [...diets.value]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
  );

  /** Diets currently being followed (is_active === true) */
  const followedDiets = computed(() =>
    diets.value.filter((d) => d.is_active)
  );

  // Actions
  async function fetchDiets(): Promise<void> {
    const authStore = useAuthStore();
    if (!authStore.userId) return;

    loading.value = true;
    error.value = null;

    try {
      if (isOnline.value) {
        const response = await api.get(`/api/v1/diet/history/user/${authStore.userId}`);
        // Adapter transforms backend fields → PWA fields and extracts array
        const serverDiets = (Array.isArray(response.data) ? response.data : []).map((diet: Diet) => ({
          ...diet,
          user_id: diet.user_id || authStore.userId,
          _synced: true,
        }));

        // Update local database
        await db.diets.bulkPut(serverDiets);
      }

      // Load from local database — active (followed) diets first
      const allDiets = await db.diets
        .where({ user_id: authStore.userId })
        .reverse()
        .sortBy('created_at');
      diets.value = sortWithActiveFirst(allDiets);

      // Populate activeDiets cache
      for (const d of allDiets) {
        if (d.is_active && d.cow_id) {
          activeDiets.value[d.cow_id] = d;
        }
      }
    } catch (err) {
      // Fallback to local data
      const allDiets = await db.diets
        .where({ user_id: authStore.userId })
        .reverse()
        .sortBy('created_at');
      diets.value = sortWithActiveFirst(allDiets);

      if (diets.value.length === 0) {
        error.value = extractErrorMessage(err);
      }
    } finally {
      loading.value = false;
    }
  }

  async function getDiet(id: string): Promise<Diet | null> {
    // Try local first
    const diet = await db.diets.get(id);

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

      // Build full DietRecommendationRequest for backend
      const cowsStore = useCowsStore();
      const feedsStore = useFeedsStore();
      const cow = input.cow_id
        ? cowsStore.activeCows.find((c) => c.id === input.cow_id)
        : null;

      // Map lactation_stage → days_in_milk
      const lactationStage = input.lactation_stage || 'mid';
      const daysInMilkMap: Record<string, number> = { early: 60, mid: 150, late: 250, dry: 0 };

      // Build feed_selection with prices from feeds store (or user overrides)
      const priceOverrides = input.feed_price_overrides as Record<string, number> | undefined;
      const feedSelection = input.available_feeds.map((feedId) => {
        const feed = feedsStore.allFeeds.find((f) => f.id === feedId);
        const price = priceOverrides?.[feedId] ?? feed?.price_per_kg ?? 0;
        return { feed_id: feedId, price_per_kg: price };
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cowAny = cow as any;
      const backendRequest = {
        simulation_id: localId,
        user_id: authStore.userId,
        country_id: getCountryId(authStore.userCountry) || undefined,
        cattle_info: {
          body_weight: input.weight_kg,
          breed: cow?.breed || 'Local Breed',
          lactating: lactationStage !== 'dry',
          milk_production: input.milk_yield_liters,
          days_in_milk: cowAny?._backend_days_in_milk ?? daysInMilkMap[lactationStage] ?? 150,
          parity: cowAny?._backend_parity ?? 2,
          days_of_pregnancy: input.is_pregnant ? (input.pregnancy_month ?? 0) * 30 : 0,
          tp_milk: cowAny?._backend_milk_protein_percent ?? 3.2,
          fat_milk: input.milk_fat_percentage ?? 4.0,
          temperature: 25.0,
          topography: 'Flat',
          distance: 1.0,
          calving_interval: 370,
          bw_gain: 0.2,
          bc_score: input.body_condition_score ?? 3.0,
        },
        feed_selection: feedSelection,
      };

      // Call optimization API
      const response = await api.post('/api/v1/diet/optimize', backendRequest);
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

  /**
   * Follow a diet — sets status to "following" and is_active to true.
   * Backend: PUT /bot-diet-history/:id with { status: "following", is_active: true }
   */
  async function followDiet(dietId: string): Promise<boolean> {
    if (!isOnline.value) {
      error.value = 'Following a diet requires an internet connection';
      return false;
    }

    loading.value = true;
    error.value = null;

    try {
      await api.put(`/api/v1/diet/${dietId}`, {
        status: 'following',
        is_active: true,
      });

      // Update local state
      const diet = diets.value.find((d) => d.id === dietId);
      if (diet) {
        diet.status = 'following';
        diet.is_active = true;
        await db.diets.put({ ...diet });

        // Cache as active diet for this cow
        if (diet.cow_id) {
          activeDiets.value[diet.cow_id] = diet;
        }
      }
      if (currentDiet.value?.id === dietId) {
        currentDiet.value = { ...currentDiet.value, status: 'following', is_active: true };
      }

      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Stop following a diet — archives it.
   * Backend: POST /bot-diet-history/:id/archive
   */
  async function stopFollowingDiet(dietId: string): Promise<boolean> {
    if (!isOnline.value) {
      error.value = 'This action requires an internet connection';
      return false;
    }

    loading.value = true;
    error.value = null;

    try {
      await api.post(`/api/v1/diet/${dietId}/archive`);

      // Update local state
      const diet = diets.value.find((d) => d.id === dietId);
      if (diet) {
        diet.status = 'archived';
        diet.is_active = false;
        await db.diets.put({ ...diet });

        // Remove from active diets cache
        if (diet.cow_id && activeDiets.value[diet.cow_id]?.id === dietId) {
          delete activeDiets.value[diet.cow_id];
        }
      }
      if (currentDiet.value?.id === dietId) {
        currentDiet.value = { ...currentDiet.value, status: 'archived', is_active: false };
      }

      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Get the currently active (followed) diet for a cow.
   * Backend: GET /bot-diet-history/active/:cowId
   */
  async function getActiveDietForCow(cowId: string): Promise<Diet | null> {
    // Check cache first
    if (activeDiets.value[cowId]) {
      return activeDiets.value[cowId];
    }

    if (!isOnline.value) {
      // Fallback: search local DB for a following diet for this cow
      const localDiets = await db.diets
        .where({ cow_id: cowId })
        .filter((d) => d.is_active === true)
        .toArray();
      if (localDiets.length > 0) {
        activeDiets.value[cowId] = localDiets[0];
        return localDiets[0];
      }
      return null;
    }

    try {
      const response = await api.get(`/api/v1/diet/active/${cowId}`);
      if (response.data) {
        const activeDiet: Diet = { ...response.data, _synced: true };
        await db.diets.put(activeDiet);
        activeDiets.value[cowId] = activeDiet;
        return activeDiet;
      }
      return null;
    } catch {
      return null;
    }
  }

  function clearCurrentDiet(): void {
    currentDiet.value = null;
  }

  async function getInputDataForRegeneration(dietId: string): Promise<DietInput | null> {
    const diet = await getDiet(dietId);
    if (!diet?.input_data) return null;
    const input = diet.input_data as unknown as DietInput;
    return {
      cow_id: input.cow_id || diet.cow_id,
      cow_name: input.cow_name || diet.cow_name,
      weight_kg: input.weight_kg ?? 400,
      milk_yield_liters: input.milk_yield_liters ?? 10,
      milk_fat_percentage: input.milk_fat_percentage ?? 4.0,
      lactation_stage: input.lactation_stage ?? 'mid',
      age_months: input.age_months,
      body_condition_score: input.body_condition_score,
      is_pregnant: input.is_pregnant ?? false,
      pregnancy_month: input.pregnancy_month,
      activity_level: input.activity_level ?? 'normal',
      optimization_goal: input.optimization_goal ?? diet.optimization_goal as DietInput['optimization_goal'] ?? 'balanced',
      available_feeds: input.available_feeds ?? [],
      feed_constraints: input.feed_constraints,
      budget_per_day: input.budget_per_day,
    };
  }

  return {
    // State
    diets,
    currentDiet,
    loading,
    optimizing,
    error,
    activeDiets,
    // Computed
    completedDiets,
    recentDiets,
    followedDiets,
    // Actions
    fetchDiets,
    getDiet,
    optimizeDiet,
    evaluateDiet,
    deleteDiet,
    getDietsForCow,
    followDiet,
    stopFollowingDiet,
    getActiveDietForCow,
    clearCurrentDiet,
    getInputDataForRegeneration,
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
