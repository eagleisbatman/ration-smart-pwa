import { defineStore } from 'pinia';
import { ref } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { api } from 'src/lib/api';
import { useAuthStore } from './auth';
import { getCountryId, fetchAndCacheCountries } from 'src/services/api-adapter';
import { getCurrencyCodeForCountry } from 'src/composables/useCurrency';
import { extractUserFriendlyError } from 'src/lib/error-messages';

// ---------------------------------------------------------------------------
// Types (matching backend Pydantic models)
// ---------------------------------------------------------------------------

export interface CattleInfoForm {
  body_weight: number;
  breed: string;
  bc_score: number;
  lactating: boolean;
  days_in_milk: number;
  milk_production: number;
  fat_milk: number;
  tp_milk: number;
  parity: number;
  days_of_pregnancy: number;
  temperature: number;
  topography: string; // Flat | Hilly | Mountainous
  distance: number;
  grazing: boolean; // UI-only (not sent to backend)
  calving_interval: number;
  bw_gain: number;
}

export interface SelectedFeed {
  feed_id: string;
  feed_name: string;
  fd_type?: string;
  fd_category?: string;
  price_per_kg: number;
  quantity_as_fed?: number;
}

export interface CustomConstraints {
  ndf_max?: number;
  starch_max?: number;
  ee_max?: number;
  ash_max?: number;
}

export interface SimulationListItem {
  report_id: string;
  simulation_id: string;
  report_type: string;
  report_type_display: string;
  created_at: string;
  report_name?: string;
  is_saved: boolean;
  cattle_summary?: {
    breed: string;
    body_weight: number;
    milk_production: number;
  } | null;
}

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

export interface EvaluationSummary {
  overall_status?: string;
  limiting_factor?: string;
}

export interface MilkProductionAnalysis {
  target_milk?: number;
  supported_by_energy?: number;
  supported_by_protein?: number;
  limiting_nutrient?: string;
}

export interface CostAnalysis {
  total_cost?: number;
  cost_per_kg_milk?: number;
}

export interface NutrientBalanceEntry {
  status?: string;
  balance?: string;
  [key: string]: unknown;
}

export interface FeedBreakdownItem {
  feed_name?: string;
  quantity_as_fed?: number;
  quantity_dm?: number;
  price_per_kg?: number;
  cost_per_day?: number;
  [key: string]: unknown;
}

export interface MethaneData {
  methane_production?: number;
  methane_yield?: number;
  methane_intensity?: number;
  energy_conversion_rate?: number;
  [key: string]: unknown;
}

export interface DietEvaluationResponse {
  evaluation_summary?: EvaluationSummary;
  milk_production_analysis?: MilkProductionAnalysis;
  cost_analysis?: CostAnalysis;
  methane_analysis?: MethaneData;
  nutrient_balance?: Record<string, NutrientBalanceEntry>;
  feed_breakdown?: FeedBreakdownItem[];
  [key: string]: unknown;
}

export interface DietSummary {
  total_cost?: number;
  total_dm_intake?: number;
  total_dm?: number;
  selected_feeds?: FeedBreakdownItem[];
  [key: string]: unknown;
}

export interface DietRecommendationResponse {
  report_id?: string;
  simulation_id?: string;
  is_valid?: boolean;
  total_cost?: number;
  solution_status?: string;
  confidence_level?: string;
  methane_emissions?: MethaneData;
  warnings?: string[];
  recommendations?: string[];
  diet_summary?: DietSummary;
  diet_summary_detailed?: DietSummary;
  animal_requirements?: { milk_production?: number; [key: string]: unknown };
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Response Normalization (backend → frontend types)
// ---------------------------------------------------------------------------

/** Extract a number from a string like "15 Liter" or "450 Kg", or return the number directly. */
function parseNumericValue(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const match = val.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }
  return 0;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Normalize a recommendation API response to DietRecommendationResponse. */
function normalizeRecResponse(raw: Record<string, any>): DietRecommendationResponse {
  const reportInfo = raw.report_info ?? {};
  const solutionSummary = raw.solution_summary ?? {};
  const dietStatus = raw.diet_status ?? {};
  const envImpact = raw.environmental_impact ?? {};
  const addInfo = raw.additional_information ?? {};
  const leastCostDiet: any[] = Array.isArray(raw.least_cost_diet) ? raw.least_cost_diet : [];

  return {
    report_id: String(reportInfo.report_id ?? ''),
    simulation_id: String(reportInfo.simulation_id ?? ''),
    is_valid: Boolean(dietStatus.is_valid),
    total_cost: Number(raw.total_diet_cost) || Number(solutionSummary.daily_cost) || 0,
    solution_status: String(dietStatus.status_classification ?? ''),
    confidence_level: String(dietStatus.summary ?? ''),
    methane_emissions: {
      methane_production: parseFloat(String(envImpact.methane_production_grams_per_day ?? 0)),
      methane_yield: parseFloat(String(envImpact.methane_yield_grams_per_kg_dmi ?? 0)),
      methane_intensity: parseFloat(String(envImpact.methane_intensity_grams_per_kg_ecm ?? 0)),
      energy_conversion_rate: parseFloat(String(envImpact.methane_conversion_rate_percent ?? 0)),
    },
    warnings: Array.isArray(addInfo.warnings) ? addInfo.warnings : [],
    recommendations: Array.isArray(addInfo.recommendations) ? addInfo.recommendations : [],
    diet_summary: {
      total_cost: Number(raw.total_diet_cost) || Number(solutionSummary.daily_cost) || 0,
      total_dm_intake: parseNumericValue(solutionSummary.dry_matter_intake),
      selected_feeds: leastCostDiet.map(normalizeFeedItem),
    },
    animal_requirements: {
      milk_production: parseNumericValue(solutionSummary.milk_production),
    },
  };
}

/** Normalize a single feed item from either recommendation or evaluation response. */
function normalizeFeedItem(f: Record<string, any>): FeedBreakdownItem {
  const cost = Number(f.daily_cost ?? f.total_cost ?? f.cost_per_day ?? f.cost ?? 0);
  return {
    feed_name: String(f.feed_name ?? f.name ?? ''),
    quantity_as_fed: Number(f.quantity_kg_per_day ?? f.quantity_as_fed_kg_per_day ?? f.quantity_as_fed ?? f.quantity ?? 0),
    quantity_dm: Number(f.quantity_dm_kg_per_day ?? f.quantity_dm ?? 0),
    price_per_kg: Number(f.price_per_kg ?? 0),
    cost_per_day: cost,
    cost, // alias for CostBreakdownTable compatibility
  };
}

/** Normalize an evaluation API response to DietEvaluationResponse. */
function normalizeEvalResponse(raw: Record<string, any>): DietEvaluationResponse {
  const evalSummary = raw.evaluation_summary ?? {};
  const milkAnalysis = raw.milk_production_analysis ?? {};
  const costAnalysis = raw.cost_analysis ?? {};
  const methaneAnalysis = raw.methane_analysis ?? {};
  const nutrientBal = raw.nutrient_balance ?? {};
  const feedBreakdown: any[] = Array.isArray(raw.feed_breakdown) ? raw.feed_breakdown : [];

  return {
    evaluation_summary: {
      overall_status: String(evalSummary.overall_status ?? ''),
      limiting_factor: String(evalSummary.limiting_factor ?? ''),
    },
    milk_production_analysis: {
      target_milk: Number(milkAnalysis.target_production_kg_per_day ?? milkAnalysis.target_milk ?? 0),
      supported_by_energy: Number(milkAnalysis.milk_supported_by_energy_kg_per_day ?? milkAnalysis.supported_by_energy ?? 0),
      supported_by_protein: Number(milkAnalysis.milk_supported_by_protein_kg_per_day ?? milkAnalysis.supported_by_protein ?? 0),
      limiting_nutrient: String(milkAnalysis.limiting_nutrient ?? ''),
    },
    cost_analysis: {
      total_cost: Number(costAnalysis.total_diet_cost_as_fed ?? costAnalysis.total_cost ?? 0),
      cost_per_kg_milk: Number(costAnalysis.feed_cost_per_kg_milk ?? costAnalysis.cost_per_kg_milk ?? 0),
    },
    methane_analysis: {
      methane_production: Number(methaneAnalysis.methane_production_g_per_day ?? methaneAnalysis.methane_production ?? 0),
      methane_yield: Number(methaneAnalysis.methane_yield_g_per_kg_dmi ?? methaneAnalysis.methane_yield ?? 0),
      methane_intensity: Number(methaneAnalysis.methane_intensity_g_per_kg_ecm ?? methaneAnalysis.methane_intensity ?? 0),
      energy_conversion_rate: Number(methaneAnalysis['Ym (%)'] ?? methaneAnalysis.ym_percent ?? methaneAnalysis.methane_conversion_rate_percent ?? methaneAnalysis.energy_conversion_rate ?? 0),
    },
    nutrient_balance: normalizeNutrientBalance(nutrientBal),
    feed_breakdown: feedBreakdown.map(normalizeFeedItem),
  };
}

/** Convert flat nutrient balance object to Record<string, NutrientBalanceEntry>. */
function normalizeNutrientBalance(nb: Record<string, any>): Record<string, NutrientBalanceEntry> {
  // If already in the expected format (Record<string, {status, balance}>), return as-is
  const firstVal = Object.values(nb)[0];
  if (firstVal && typeof firstVal === 'object' && ('status' in firstVal || 'balance' in firstVal)) {
    return nb as Record<string, NutrientBalanceEntry>;
  }

  // Convert flat numeric fields to NutrientBalanceEntry format
  const result: Record<string, NutrientBalanceEntry> = {};
  const nutrientMap: Record<string, string> = {
    energy_balance_mcal: 'Energy (Mcal)',
    protein_balance_kg: 'Protein (kg)',
    calcium_balance_kg: 'Calcium (kg)',
    phosphorus_balance_kg: 'Phosphorus (kg)',
    ndf_balance_kg: 'NDF (kg)',
  };

  for (const [key, label] of Object.entries(nutrientMap)) {
    if (nb[key] != null) {
      const val = Number(nb[key]);
      if (Number.isFinite(val)) {
        result[label] = {
          status: val > 0.01 ? 'Adequate' : val > -0.01 ? 'Marginal' : 'Deficient',
          balance: `${val > 0 ? '+' : ''}${val.toFixed(3)}`,
        };
      }
    }
  }
  return result;
}

/* eslint-enable @typescript-eslint/no-explicit-any */

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

function defaultCattleInfo(): CattleInfoForm {
  return {
    body_weight: 450,
    breed: '',
    bc_score: 3,
    lactating: true,
    days_in_milk: 100,
    milk_production: 15,
    fat_milk: 3.8,
    tp_milk: 3.2,
    parity: 2,
    days_of_pregnancy: 0,
    temperature: 25,
    topography: 'Flat',
    distance: 1,
    grazing: false,
    calving_interval: 370,
    bw_gain: 0.2,
  };
}

function defaultConstraints(): CustomConstraints {
  return {
    ndf_max: 45,
    starch_max: 26,
    ee_max: 7,
    ash_max: 10,
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSimulationStore = defineStore('simulation', () => {
  // State
  const cattleInfo = ref<CattleInfoForm>(defaultCattleInfo());
  const selectedFeeds = ref<SelectedFeed[]>([]);
  const customConstraints = ref<CustomConstraints>(defaultConstraints());
  const evaluationResult = ref<DietEvaluationResponse | null>(null);
  const recommendationResult = ref<DietRecommendationResponse | null>(null);
  const simulationHistory = ref<SimulationListItem[]>([]);
  const evaluating = ref(false);
  const recommending = ref(false);
  const fetchingHistory = ref(false);
  const restoringSimulation = ref(false);
  const error = ref<string | null>(null);
  const currentSimulationId = ref<string>('');

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function newSimulationId(): string {
    const id = `sim-${uuidv4().slice(0, 8)}`;
    currentSimulationId.value = id;
    return id;
  }

  /** Coerce a value to a finite number, falling back to a default. */
  function safeNum(val: unknown, fallback: number): number {
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
  }

  /** Build the cattle_info payload (exclude UI-only fields like `grazing`). */
  function buildCattlePayload(): Record<string, unknown> {
    const c = cattleInfo.value;
    return {
      body_weight: safeNum(c.body_weight, 450),
      breed: c.breed || '',
      bc_score: safeNum(c.bc_score, 3),
      lactating: c.lactating,
      days_in_milk: safeNum(c.days_in_milk, 0),
      milk_production: safeNum(c.milk_production, 0),
      fat_milk: safeNum(c.fat_milk, 3.8),
      tp_milk: safeNum(c.tp_milk, 3.2),
      parity: safeNum(c.parity, 2),
      days_of_pregnancy: safeNum(c.days_of_pregnancy, 0),
      temperature: safeNum(c.temperature, 25),
      topography: c.topography || 'Flat',
      distance: safeNum(c.distance, 1),
      calving_interval: safeNum(c.calving_interval, 370),
      bw_gain: safeNum(c.bw_gain, 0.2),
    };
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /**
   * POST /diet-evaluation-working/
   * Requires quantities on every selected feed.
   */
  async function generateEvaluation(): Promise<boolean> {
    const authStore = useAuthStore();
    if (!authStore.userId) {
      error.value = 'Not authenticated';
      return false;
    }

    evaluating.value = true;
    error.value = null;

    try {
      // Ensure country cache is populated for country_code → country_id mapping
      await fetchAndCacheCountries();

      const simId = currentSimulationId.value || newSimulationId();
      const countryCode = authStore.userCountry || 'IN';
      const countryId = getCountryId(countryCode) || '';
      const currency = getCurrencyCodeForCountry(countryCode);

      const payload = {
        user_id: authStore.userId,
        country_id: countryId,
        simulation_id: simId,
        currency,
        cattle_info: buildCattlePayload(),
        feed_evaluation: selectedFeeds.value.map((f) => ({
          feed_id: f.feed_id,
          quantity_as_fed: f.quantity_as_fed ?? 0,
          price_per_kg: f.price_per_kg,
        })),
      };

      const response = await api.post('/diet-evaluation-working/', payload, { timeout: 120000 });
      evaluationResult.value = normalizeEvalResponse(response.data as Record<string, unknown>);
      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return false;
    } finally {
      evaluating.value = false;
    }
  }

  /**
   * POST /diet-recommendation-working/
   * No quantities needed — only feed IDs and prices.
   * @param milkOverride – optional milk production override (from eval → rec flow)
   */
  async function generateRecommendation(milkOverride?: number): Promise<boolean> {
    const authStore = useAuthStore();
    if (!authStore.userId) {
      error.value = 'Not authenticated';
      return false;
    }

    recommending.value = true;
    error.value = null;

    try {
      // Ensure country cache is populated for country_code → country_id mapping
      await fetchAndCacheCountries();

      const simId = currentSimulationId.value || newSimulationId();
      const countryCode = authStore.userCountry || 'IN';
      const countryId = getCountryId(countryCode) || '';

      const cattlePayload = buildCattlePayload();
      if (milkOverride !== undefined) {
        cattlePayload.milk_production = milkOverride;
      }

      // Build base_thresholds only if any constraint differs from null/undefined
      const constraints = customConstraints.value;
      const hasConstraints =
        constraints.ndf_max != null ||
        constraints.starch_max != null ||
        constraints.ee_max != null ||
        constraints.ash_max != null;

      const payload: Record<string, unknown> = {
        simulation_id: simId,
        user_id: authStore.userId,
        country_id: countryId || undefined,
        cattle_info: cattlePayload,
        feed_selection: selectedFeeds.value.map((f) => ({
          feed_id: f.feed_id,
          price_per_kg: f.price_per_kg,
        })),
      };

      if (hasConstraints) {
        payload.base_thresholds = constraints;
      }

      const response = await api.post('/diet-recommendation-working/', payload, { timeout: 120000 });
      recommendationResult.value = normalizeRecResponse(response.data as Record<string, unknown>);
      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return false;
    } finally {
      recommending.value = false;
    }
  }

  /**
   * POST /fetch-all-simulations/
   */
  async function fetchSimulationHistory(): Promise<void> {
    const authStore = useAuthStore();
    if (!authStore.userId) return;

    fetchingHistory.value = true;
    error.value = null;

    try {
      const response = await api.post('/fetch-all-simulations/', {
        user_id: authStore.userId,
      });

      const data = response.data as {
        success: boolean;
        simulations: SimulationListItem[];
      };

      if (data.success) {
        simulationHistory.value = data.simulations ?? [];
      }
    } catch (err) {
      error.value = extractUserFriendlyError(err);
    } finally {
      fetchingHistory.value = false;
    }
  }

  /**
   * POST /fetch-simulation-details/
   * Populates cattleInfo, selectedFeeds, and customConstraints from a saved simulation.
   */
  async function restoreSimulation(reportId: string): Promise<boolean> {
    const authStore = useAuthStore();
    if (!authStore.userId) return false;

    restoringSimulation.value = true;
    error.value = null;

    try {
      const response = await api.post('/fetch-simulation-details/', {
        user_id: authStore.userId,
        report_id: reportId,
      });

      const data = response.data as {
        success: boolean;
        report_type: string;
        cattle_info: Record<string, unknown>;
        feed_selection: Array<Record<string, unknown>>;
        feed_evaluation?: Array<Record<string, unknown>>;
        custom_constraints?: Record<string, unknown>;
        full_result?: Record<string, unknown>;
      };

      if (!data.success) {
        error.value = 'Failed to restore simulation';
        return false;
      }

      // Restore cattle info (use safeNum to handle NaN/null without treating 0 as missing)
      const ci = data.cattle_info;
      cattleInfo.value = {
        body_weight: safeNum(ci.body_weight, 450),
        breed: String(ci.breed || ''),
        bc_score: safeNum(ci.bc_score, 3),
        lactating: Boolean(ci.lactating),
        days_in_milk: safeNum(ci.days_in_milk, 100),
        milk_production: safeNum(ci.milk_production, 15),
        fat_milk: safeNum(ci.fat_milk, 3.8),
        tp_milk: safeNum(ci.tp_milk, 3.2),
        parity: safeNum(ci.parity, 2),
        days_of_pregnancy: safeNum(ci.days_of_pregnancy, 0),
        temperature: safeNum(ci.temperature, 25),
        topography: String(ci.topography || 'Flat'),
        distance: safeNum(ci.distance, 1),
        grazing: false,
        calving_interval: safeNum(ci.calving_interval, 370),
        bw_gain: safeNum(ci.bw_gain, 0.2),
      };

      // Restore feeds — use feed_evaluation if available (eval report), otherwise feed_selection
      const feedList = data.feed_evaluation ?? data.feed_selection ?? [];
      selectedFeeds.value = feedList.map((f) => ({
        feed_id: String(f.feed_id || ''),
        feed_name: String(f.feed_name || ''),
        fd_type: f.feed_type as string | undefined,
        fd_category: f.feed_category as string | undefined,
        price_per_kg: Number(f.price_per_kg) || 0,
        quantity_as_fed: f.quantity_as_fed != null ? Number(f.quantity_as_fed) : undefined,
      }));

      // Restore custom constraints
      if (data.custom_constraints) {
        const cc = data.custom_constraints;
        customConstraints.value = {
          ndf_max: cc.ndf_max != null ? Number(cc.ndf_max) : undefined,
          starch_max: cc.starch_max != null ? Number(cc.starch_max) : undefined,
          ee_max: cc.ee_max != null ? Number(cc.ee_max) : undefined,
          ash_max: cc.ash_max != null ? Number(cc.ash_max) : undefined,
        };
      } else {
        customConstraints.value = defaultConstraints();
      }

      // Generate a new simulation ID for re-running
      newSimulationId();

      return true;
    } catch (err) {
      error.value = extractUserFriendlyError(err);
      return false;
    } finally {
      restoringSimulation.value = false;
    }
  }

  /**
   * Reset all form state for a fresh simulation.
   */
  function resetForm(): void {
    cattleInfo.value = defaultCattleInfo();
    selectedFeeds.value = [];
    customConstraints.value = defaultConstraints();
    evaluationResult.value = null;
    recommendationResult.value = null;
    error.value = null;
    currentSimulationId.value = '';
  }

  return {
    // State
    cattleInfo,
    selectedFeeds,
    customConstraints,
    evaluationResult,
    recommendationResult,
    simulationHistory,
    evaluating,
    recommending,
    fetchingHistory,
    restoringSimulation,
    error,
    currentSimulationId,
    // Actions
    newSimulationId,
    generateEvaluation,
    generateRecommendation,
    fetchSimulationHistory,
    restoreSimulation,
    resetForm,
  };
});
