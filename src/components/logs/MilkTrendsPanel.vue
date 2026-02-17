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
      <div v-if="dailyTotals.length > 0" style="height: 100px; position: relative">
        <Bar :data="barChartData" :options="barChartOptions" />
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
              :color="cow.declining ? 'warning' : cow.changePercent > 0 ? 'positive' : undefined"
              :text-color="cow.declining || cow.changePercent > 0 ? 'white' : undefined"
              :outline="!cow.declining && cow.changePercent <= 0"
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
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { useMilkLogsStore } from 'src/stores/milkLogs';
import { useCowsStore } from 'src/stores/cows';
import { useChartColors } from 'src/lib/chart-colors';
import { COW_ICON } from 'src/boot/icons';
import type { ChartData, ChartOptions } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

defineEmits<{
  (e: 'cowClick', cowId: string): void;
}>();

const { t } = useI18n();
const milkLogsStore = useMilkLogsStore();
const cowsStore = useCowsStore();
const colors = useChartColors();

const period = ref<'7d' | '30d' | 'all'>('7d');

const periodOptions = computed(() => [
  { label: t('logs.trends.7days'), value: '7d' as const },
  { label: t('logs.trends.30days'), value: '30d' as const },
  { label: t('logs.trends.all'), value: 'all' as const },
]);

interface DailyTotal {
  date: string;
  total: number;
}

const periodDays = computed(() => {
  if (period.value === '7d') return 7;
  if (period.value === '30d') return 30;
  return 90;
});

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
  const firstDataIdx = result.findIndex((d) => d.total > 0);
  if (firstDataIdx === -1) return [];
  return result.slice(firstDataIdx);
});

const periodTotal = computed(() =>
  dailyTotals.value.reduce((sum, d) => sum + d.total, 0)
);

/** Chart.js bar chart data */
const barChartData = computed((): ChartData<'bar'> => {
  const c = colors.value;
  const totals = dailyTotals.value;

  const labels = totals.map((d) => {
    if (totals.length <= 7) {
      return format(parseISO(d.date), 'EEE').charAt(0);
    }
    const step = Math.ceil(totals.length / 7);
    const idx = totals.indexOf(d);
    return idx % step === 0 ? format(parseISO(d.date), 'MM/dd') : '';
  });

  return {
    labels,
    datasets: [
      {
        data: totals.map((d) => d.total),
        backgroundColor: totals.map((d) =>
          d.total > 0 ? c.primary : (c.grid + '60')
        ),
        borderRadius: 2,
        barPercentage: 0.85,
        categoryPercentage: 0.9,
      },
    ],
  };
});

const barChartOptions = computed((): ChartOptions<'bar'> => {
  const c = colors.value;
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { size: 11 },
        bodyFont: { size: 11 },
        padding: 6,
        cornerRadius: 4,
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex;
            if (idx == null) return '';
            const d = dailyTotals.value[idx];
            return format(parseISO(d.date), 'MMM d');
          },
          label: (ctx) => `${ctx.parsed.y.toFixed(1)}L`,
        },
      },
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: {
          color: c.axisTextLight,
          font: { size: 10 },
          maxRotation: 0,
        },
        grid: { display: false },
      },
      y: {
        ticks: { display: false },
        grid: { display: false },
      },
    },
  };
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

  const currentLogs = milkLogsStore.logs.filter(
    (l) => !l._deleted && l.log_date >= cutoff
  );
  const prevLogs = milkLogsStore.logs.filter(
    (l) => !l._deleted && l.log_date >= prevCutoff && l.log_date < cutoff
  );

  const cowMap = new Map<string, { total: number; count: number; cowName?: string }>();
  const prevCowMap = new Map<string, { total: number; count: number }>();

  for (const log of currentLogs) {
    const entry = cowMap.get(log.cow_id) || { total: 0, count: 0 };
    entry.total += log.total_liters;
    entry.count += 1;
    if (log.cow_name && !entry.cowName) entry.cowName = log.cow_name;
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
      name: cow?.name || data.cowName || 'Unknown',
      average: avg,
      previousAverage: prevAvg,
      changePercent,
      declining: changePercent !== null && changePercent < -20,
    });
  }

  results.sort((a, b) => b.average - a.average);
  return results;
});

const maxCowAvg = computed(() =>
  Math.max(...cowBreakdowns.value.map((c) => c.average), 0.1)
);
</script>

<style lang="scss" scoped>
.milk-trends-panel {
  border-radius: $radius-loose;

  :deep(.q-btn-toggle) {
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: $radius-default;
    overflow: hidden;

    .q-btn {
      border-radius: 0;
      min-height: 28px;
      padding: 2px 10px;
    }
  }
}

.cow-breakdown-row {
  cursor: pointer;
  padding: 4px 8px;
  border-radius: $radius-default;
  transition: background-color 0.15s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.03);
  }
}
</style>
