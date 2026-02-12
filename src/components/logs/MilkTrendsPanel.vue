<template>
  <q-card flat bordered class="q-mb-md milk-trends-panel">
    <q-card-section class="q-pb-none">
      <div class="row items-center justify-between">
        <div class="text-subtitle1 text-weight-medium">{{ $t('logs.trends.title') }}</div>
        <q-btn-toggle
          v-model="period"
          no-caps
          dense
          unelevated
          toggle-color="primary"
          size="sm"
          :options="periodOptions"
        />
      </div>
    </q-card-section>

    <!-- Herd Total Bar Chart -->
    <q-card-section class="q-py-sm">
      <div class="text-caption text-grey-7 q-mb-xs">
        {{ $t('logs.trends.herdTotal') }}: {{ periodTotal.toFixed(1) }}{{ $t('units.l') }}
      </div>
      <svg
        :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
        :width="chartWidth"
        :height="chartHeight"
        class="herd-chart"
        preserveAspectRatio="none"
      >
        <rect
          v-for="(bar, idx) in bars"
          :key="idx"
          :x="bar.x"
          :y="bar.y"
          :width="bar.width"
          :height="bar.height"
          :fill="bar.total > 0 ? 'var(--q-primary)' : '#e0e0e0'"
          :opacity="bar.total > 0 ? 0.8 : 0.3"
          rx="2"
        />
      </svg>
      <div class="row justify-between text-caption text-grey-5" style="margin-top: 2px">
        <span v-for="(label, idx) in barLabels" :key="idx" class="bar-label">{{ label }}</span>
      </div>
    </q-card-section>

    <!-- Per-Cow Breakdown -->
    <q-card-section v-if="cowBreakdowns.length > 0" class="q-pt-none">
      <div class="text-caption text-grey-7 q-mb-sm">{{ $t('logs.trends.perCow') }}</div>
      <div
        v-for="cow in cowBreakdowns"
        :key="cow.id"
        class="row items-center q-mb-sm cow-breakdown-row"
        @click="$emit('cowClick', cow.id)"
      >
        <q-avatar size="28px" :color="cow.declining ? 'orange' : 'primary'" text-color="white" class="q-mr-sm">
          <q-icon :name="COW_ICON" size="16px" />
        </q-avatar>
        <div class="col">
          <div class="row items-center">
            <span class="text-body2 text-weight-medium">{{ cow.name }}</span>
            <q-space />
            <span class="text-body2 text-primary text-weight-bold">{{ cow.average.toFixed(1) }}L</span>
            <q-chip
              v-if="cow.changePercent !== null"
              :color="cow.declining ? 'orange' : cow.changePercent > 0 ? 'green' : 'grey-4'"
              :text-color="cow.declining ? 'white' : cow.changePercent > 0 ? 'white' : 'grey-8'"
              size="sm"
              dense
              class="q-ml-xs"
            >
              <q-icon
                :name="cow.changePercent > 0 ? 'trending_up' : cow.changePercent < 0 ? 'trending_down' : 'trending_flat'"
                size="12px"
                class="q-mr-xs"
              />
              {{ Math.abs(cow.changePercent).toFixed(0) }}%
            </q-chip>
          </div>
          <!-- Mini bar for this cow -->
          <q-linear-progress
            :value="cow.average / (maxCowAvg || 1)"
            :color="cow.declining ? 'orange' : 'primary'"
            size="4px"
            class="q-mt-xs"
            rounded
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { format, subDays, parseISO } from 'date-fns';
import { useMilkLogsStore } from 'src/stores/milkLogs';
import { useCowsStore } from 'src/stores/cows';
import { COW_ICON } from 'src/boot/icons';

defineEmits<{
  (e: 'cowClick', cowId: string): void;
}>();

const { t } = useI18n();
const milkLogsStore = useMilkLogsStore();
const cowsStore = useCowsStore();

const period = ref<'7d' | '30d' | 'all'>('7d');

const periodOptions = computed(() => [
  { label: t('logs.trends.7days'), value: '7d' as const },
  { label: t('logs.trends.30days'), value: '30d' as const },
  { label: t('logs.trends.all'), value: 'all' as const },
]);

const chartWidth = 280;
const chartHeight = 80;
const barGap = 2;

interface DailyTotal {
  date: string;
  total: number;
}

/** Get the number of days for the selected period */
const periodDays = computed(() => {
  if (period.value === '7d') return 7;
  if (period.value === '30d') return 30;
  return 90; // "all" shows up to 90 days
});

/** Aggregate logs into daily totals for the selected period */
const dailyTotals = computed((): DailyTotal[] => {
  const now = new Date();
  const days = periodDays.value;
  const dateMap = new Map<string, number>();

  for (let i = days - 1; i >= 0; i--) {
    const dateStr = format(subDays(now, i), 'yyyy-MM-dd');
    dateMap.set(dateStr, 0);
  }

  for (const log of milkLogsStore.logs) {
    if (log._deleted) continue;
    const existing = dateMap.get(log.log_date);
    if (existing !== undefined) {
      dateMap.set(log.log_date, existing + (log.total_liters || 0));
    }
  }

  const result: DailyTotal[] = [];
  for (const [date, total] of dateMap) {
    result.push({ date, total });
  }
  return result;
});

const periodTotal = computed(() =>
  dailyTotals.value.reduce((sum, d) => sum + d.total, 0)
);

/** SVG bars for the herd total chart */
const bars = computed(() => {
  const totals = dailyTotals.value;
  const count = totals.length;
  if (count === 0) return [];

  const maxVal = Math.max(...totals.map((d) => d.total), 0.1);
  const barWidth = Math.max((chartWidth - (count - 1) * barGap) / count, 1);

  return totals.map((d, idx) => {
    const height = (d.total / maxVal) * (chartHeight - 4);
    return {
      x: idx * (barWidth + barGap),
      y: chartHeight - height,
      width: barWidth,
      height: Math.max(height, 1),
      total: d.total,
    };
  });
});

/** Labels for the x-axis */
const barLabels = computed(() => {
  const totals = dailyTotals.value;
  if (totals.length <= 7) {
    return totals.map((d) => format(parseISO(d.date), 'EEE').charAt(0));
  }
  // For 30d/all, show every ~5th label
  const step = Math.ceil(totals.length / 7);
  return totals.map((d, idx) =>
    idx % step === 0 ? format(parseISO(d.date), 'MM/dd') : ''
  );
});

/** Per-cow breakdown with trend indicators */
interface CowBreakdown {
  id: string;
  name: string;
  average: number;
  previousAverage: number;
  changePercent: number | null;
  declining: boolean;
}

const cowBreakdowns = computed((): CowBreakdown[] => {
  const now = new Date();
  const days = periodDays.value;
  const cutoff = format(subDays(now, days), 'yyyy-MM-dd');
  const prevCutoff = format(subDays(now, days * 2), 'yyyy-MM-dd');

  // Current period logs
  const currentLogs = milkLogsStore.logs.filter(
    (l) => !l._deleted && l.log_date >= cutoff
  );
  // Previous period logs (for trend comparison)
  const prevLogs = milkLogsStore.logs.filter(
    (l) => !l._deleted && l.log_date >= prevCutoff && l.log_date < cutoff
  );

  // Group by cow
  const cowMap = new Map<string, { total: number; count: number }>();
  const prevCowMap = new Map<string, { total: number; count: number }>();

  for (const log of currentLogs) {
    const entry = cowMap.get(log.cow_id) || { total: 0, count: 0 };
    entry.total += log.total_liters;
    entry.count += 1;
    cowMap.set(log.cow_id, entry);
  }

  for (const log of prevLogs) {
    const entry = prevCowMap.get(log.cow_id) || { total: 0, count: 0 };
    entry.total += log.total_liters;
    entry.count += 1;
    prevCowMap.set(log.cow_id, entry);
  }

  const results: CowBreakdown[] = [];

  for (const [cowId, data] of cowMap) {
    const cow = cowsStore.activeCows.find((c) => c.id === cowId);
    const avg = data.count > 0 ? data.total / data.count : 0;

    const prevData = prevCowMap.get(cowId);
    const prevAvg = prevData && prevData.count > 0 ? prevData.total / prevData.count : 0;

    let changePercent: number | null = null;
    if (prevAvg > 0) {
      changePercent = ((avg - prevAvg) / prevAvg) * 100;
    }

    results.push({
      id: cowId,
      name: cow?.name || 'Unknown',
      average: avg,
      previousAverage: prevAvg,
      changePercent,
      declining: changePercent !== null && changePercent < -20,
    });
  }

  // Sort by average descending
  results.sort((a, b) => b.average - a.average);
  return results;
});

const maxCowAvg = computed(() =>
  Math.max(...cowBreakdowns.value.map((c) => c.average), 0.1)
);
</script>

<style lang="scss" scoped>
.milk-trends-panel {
  border-radius: 12px;
}

.herd-chart {
  width: 100%;
  height: auto;
  display: block;
}

.bar-label {
  font-size: 10px;
  min-width: 20px;
  text-align: center;
}

.cow-breakdown-row {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background-color 0.15s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.03);
  }
}
</style>
