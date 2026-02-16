import { ref, watch, toValue, type Ref, type MaybeRef } from 'vue';
import { useMilkLogsStore } from 'src/stores/milkLogs';
import { useDietsStore } from 'src/stores/diets';
import { differenceInDays } from 'date-fns';

/** Maximum number of daily yield bars shown in the mini-chart */
const MAX_CHART_POINTS = 30;

export interface DietImpactMetrics {
  loading: Ref<boolean>;
  hasData: Ref<boolean>;
  totalLogs: Ref<number>;
  /** 0-100, percentage of logs where fed_diet === true */
  adherenceRate: Ref<number>;
  /** Average total_liters across all linked logs */
  avgDailyYield: Ref<number>;
  /** Cow's milk yield at diet creation time (from input_data) */
  baselineYield: Ref<number | null>;
  /** Percentage change from baseline */
  yieldChange: Ref<number | null>;
  yieldTrend: Ref<'up' | 'down' | 'stable' | null>;
  /** Last N daily yields for the mini-chart (capped at MAX_CHART_POINTS) */
  dailyYields: Ref<Array<{ date: string; liters: number }>>;
  daysSinceStart: Ref<number>;
  refresh: () => Promise<void>;
}

export function useDietImpact(
  dietId: MaybeRef<string | undefined>,
): DietImpactMetrics {
  const milkLogsStore = useMilkLogsStore();
  const dietsStore = useDietsStore();

  const loading = ref(false);
  const hasData = ref(false);
  const totalLogs = ref(0);
  const adherenceRate = ref(0);
  const avgDailyYield = ref(0);
  const baselineYield = ref<number | null>(null);
  const yieldChange = ref<number | null>(null);
  const yieldTrend = ref<'up' | 'down' | 'stable' | null>(null);
  const dailyYields = ref<Array<{ date: string; liters: number }>>([]);
  const daysSinceStart = ref(0);

  async function refresh() {
    const id = toValue(dietId);
    if (!id) {
      hasData.value = false;
      return;
    }

    loading.value = true;

    try {
      // Get the diet to extract baseline and start date
      const diet = await dietsStore.getDiet(id);
      if (!diet) {
        hasData.value = false;
        return;
      }

      // Baseline yield from the diet's input data (cow's milk at diet creation)
      const inputData = diet.input_data as Record<string, unknown> | undefined;
      const baseline = inputData?.milk_yield_liters as number | undefined;
      baselineYield.value = baseline ?? null;

      // Days since diet was created
      daysSinceStart.value = differenceInDays(new Date(), new Date(diet.created_at));

      // Fetch all milk logs linked to this diet
      const logs = await milkLogsStore.getLogsByDietId(id);

      totalLogs.value = logs.length;
      hasData.value = logs.length > 0;

      if (logs.length === 0) {
        adherenceRate.value = 0;
        avgDailyYield.value = 0;
        yieldChange.value = null;
        yieldTrend.value = null;
        dailyYields.value = [];
        return;
      }

      // Adherence: % of logs where fed_diet is explicitly true
      const fedCount = logs.filter((l) => l.fed_diet === true).length;
      adherenceRate.value = Math.round((fedCount / logs.length) * 100);

      // Average daily yield
      const totalYield = logs.reduce((sum, l) => sum + l.total_liters, 0);
      avgDailyYield.value = Number((totalYield / logs.length).toFixed(1));

      // Yield change vs baseline
      if (baseline && baseline > 0) {
        yieldChange.value = Number((((avgDailyYield.value - baseline) / baseline) * 100).toFixed(1));
      } else {
        yieldChange.value = null;
      }

      // Daily yields for chart — show most recent N points to prevent SVG overflow
      const recentLogs = logs.length > MAX_CHART_POINTS
        ? logs.slice(-MAX_CHART_POINTS)
        : logs;
      dailyYields.value = recentLogs.map((l) => ({
        date: l.log_date,
        liters: l.total_liters,
      }));

      // Trend: compare first 3 vs last 3 days
      if (logs.length >= 4) {
        const first3 = logs.slice(0, 3);
        const last3 = logs.slice(-3);
        const avgFirst = first3.reduce((s, l) => s + l.total_liters, 0) / first3.length;
        const avgLast = last3.reduce((s, l) => s + l.total_liters, 0) / last3.length;
        const changePct = avgFirst > 0 ? ((avgLast - avgFirst) / avgFirst) * 100 : 0;

        if (changePct > 2) {
          yieldTrend.value = 'up';
        } else if (changePct < -2) {
          yieldTrend.value = 'down';
        } else {
          yieldTrend.value = 'stable';
        }
      } else {
        yieldTrend.value = null;
      }
    } catch (err) {
      // Silently handle — component shows empty state
      hasData.value = false;
      console.warn('[useDietImpact] Failed to load impact data:', err);
    } finally {
      loading.value = false;
    }
  }

  // Auto-refresh when dietId changes
  watch(
    () => toValue(dietId),
    () => { void refresh(); },
    { immediate: true },
  );

  return {
    loading,
    hasData,
    totalLogs,
    adherenceRate,
    avgDailyYield,
    baselineYield,
    yieldChange,
    yieldTrend,
    dailyYields,
    daysSinceStart,
    refresh,
  };
}
