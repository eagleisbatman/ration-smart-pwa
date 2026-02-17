<template>
  <q-card flat bordered class="milk-production-chart">
    <q-card-section>
      <div class="row items-center q-mb-sm">
        <q-space />
        <q-btn-group flat class="period-toggle">
          <q-btn
            v-for="opt in periodOptions"
            :key="opt.value"
            :label="opt.label"
            dense
            no-caps
            size="sm"
            :flat="period !== opt.value"
            :unelevated="period === opt.value"
            :color="period === opt.value ? 'primary' : undefined"
            :text-color="period !== opt.value ? 'grey-7' : undefined"
            @click="period = opt.value"
          />
        </q-btn-group>
      </div>

      <!-- Chart View -->
      <div v-if="chartData.length > 0 && !loading" style="height: 180px; position: relative">
        <Bar :data="barChartData" :options="barChartOptions" />
      </div>

      <!-- Summary Stats -->
      <div v-if="chartData.length > 0 && !loading" class="row q-col-gutter-sm q-mt-md">
        <div class="col-4">
          <div class="stat-inline">
            <div class="text-h6 text-primary">{{ totalProduction.toFixed(1) }}L</div>
            <div class="text-caption text-grey-6">{{ $t('chart.total') }}</div>
          </div>
        </div>
        <div class="col-4">
          <div class="stat-inline">
            <div class="text-h6 text-secondary">{{ averageDaily.toFixed(1) }}L</div>
            <div class="text-caption text-grey-6">{{ $t('chart.avgDaily') }}</div>
          </div>
        </div>
        <div class="col-4">
          <div class="stat-inline">
            <div class="text-h6" :class="trendClass">
              <q-icon :name="trendIcon" size="16px" class="q-mr-xs" />
              {{ trendPercent }}%
            </div>
            <div class="text-caption text-grey-6">{{ $t('chart.trend') }}</div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!loading && chartData.length === 0" class="text-center q-py-md">
        <q-icon name="water_drop" size="32px" color="grey-4" />
        <div class="text-body2 text-grey-6 q-mt-xs">{{ $t('chart.noDataPeriod') }}</div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center q-py-lg">
        <q-spinner-dots color="primary" size="40px" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { format, subDays, parseISO } from 'date-fns';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useMilkLogsStore } from 'src/stores/milkLogs';
import { useChartColors } from 'src/lib/chart-colors';
import type { ChartData, ChartOptions } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const props = defineProps<{
  height?: number;
  cowId?: string;
  cowIds?: string[];
}>();

useI18n();
const milkLogsStore = useMilkLogsStore();
const colors = useChartColors();

const period = ref<'7d' | '14d'>('7d');
const loading = ref(false);

const periodOptions = [
  { label: '7D', value: '7d' as const },
  { label: '14D', value: '14d' as const },
];

interface DailyData {
  date: string;
  morning: number;
  evening: number;
  total: number;
}

const chartData = shallowRef<DailyData[]>([]);

function processLogs() {
  const days = period.value === '7d' ? 7 : 14;
  const endDate = new Date();
  const startDate = subDays(endDate, days - 1);

  const dailyMap = new Map<string, DailyData>();

  for (let i = 0; i < days; i++) {
    const date = format(subDays(endDate, days - 1 - i), 'yyyy-MM-dd');
    dailyMap.set(date, { date, morning: 0, evening: 0, total: 0 });
  }

  const logs = milkLogsStore.logs.filter((log) => {
    const logDate = parseISO(log.log_date);
    const inRange = logDate >= startDate && logDate <= endDate;
    const matchesCow = props.cowIds
      ? props.cowIds.includes(log.cow_id)
      : !props.cowId || log.cow_id === props.cowId;
    return inRange && matchesCow && !log._deleted;
  });

  for (const log of logs) {
    const existing = dailyMap.get(log.log_date);
    if (existing) {
      existing.morning += log.morning_liters || 0;
      existing.evening += log.evening_liters || 0;
      existing.total += log.total_liters || 0;
    }
  }

  const allData = Array.from(dailyMap.values());
  const firstDataIdx = allData.findIndex((d) => d.total > 0);
  if (firstDataIdx === -1) {
    chartData.value = [];
  } else {
    chartData.value = allData.slice(firstDataIdx);
  }
}

// Chart.js stacked bar data
const barChartData = computed((): ChartData<'bar'> => {
  const c = colors.value;
  const data = chartData.value;

  return {
    labels: data.map((d) => format(parseISO(d.date), 'MMM d')),
    datasets: [
      {
        label: 'Morning',
        data: data.map((d) => d.morning),
        backgroundColor: c.primary,
        borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 2, bottomRight: 2 },
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
      {
        label: 'Evening',
        data: data.map((d) => d.evening),
        backgroundColor: c.primary + '80', // 50% opacity
        borderRadius: { topLeft: 2, topRight: 2, bottomLeft: 0, bottomRight: 0 },
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
    ],
  };
});

const barChartOptions = computed((): ChartOptions<'bar'> => {
  const c = colors.value;
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: { size: 11 },
        bodyFont: { size: 11 },
        padding: 8,
        cornerRadius: 4,
        callbacks: {
          afterBody: (items) => {
            const idx = items[0]?.dataIndex;
            if (idx == null) return '';
            const d = chartData.value[idx];
            return `Total: ${d.total.toFixed(1)}L`;
          },
          label: (ctx) => {
            const val = ctx.parsed.y;
            return `${ctx.dataset.label}: ${val.toFixed(1)}L`;
          },
        },
      },
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: c.axisText,
          usePointStyle: true,
          pointStyle: 'rect',
          padding: 12,
          font: { size: 11 },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: c.axisText,
          font: { size: 10 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7,
        },
        grid: { display: false },
      },
      y: {
        stacked: true,
        ticks: {
          color: c.axisTextLight,
          font: { size: 10 },
        },
        grid: {
          color: c.gridLight,
        },
      },
    },
  };
});

// Summary statistics
const totalProduction = computed(() =>
  chartData.value.reduce((sum, d) => sum + d.total, 0)
);

const averageDaily = computed(() => {
  const daysWithData = chartData.value.filter((d) => d.total > 0).length;
  return daysWithData > 0 ? totalProduction.value / daysWithData : 0;
});

const trendPercent = computed(() => {
  const data = chartData.value;
  if (data.length < 6) return '0';

  const recent = data.slice(-3).reduce((sum, d) => sum + d.total, 0);
  const previous = data.slice(-6, -3).reduce((sum, d) => sum + d.total, 0);

  if (previous === 0) return recent > 0 ? '+100' : '0';

  const change = ((recent - previous) / previous) * 100;
  return change >= 0 ? `+${change.toFixed(0)}` : change.toFixed(0);
});

const trendClass = computed(() => {
  const trend = parseFloat(trendPercent.value);
  if (trend > 0) return 'text-positive';
  if (trend < 0) return 'text-negative';
  return 'text-grey-6';
});

const trendIcon = computed(() => {
  const trend = parseFloat(trendPercent.value);
  if (trend > 0) return 'trending_up';
  if (trend < 0) return 'trending_down';
  return 'trending_flat';
});

watch([period, () => props.cowIds, () => props.cowId], () => {
  processLogs();
});

watch(
  () => milkLogsStore.logs,
  () => {
    processLogs();
  },
  { deep: true }
);

onMounted(async () => {
  loading.value = true;
  try {
    if (milkLogsStore.logs.length === 0) {
      await milkLogsStore.fetchLogs();
    }
    processLogs();
  } finally {
    loading.value = false;
  }
});

async function refresh() {
  loading.value = true;
  try {
    await milkLogsStore.fetchLogs();
    processLogs();
  } finally {
    loading.value = false;
  }
}

defineExpose({ refresh });
</script>

<style lang="scss" scoped>
.milk-production-chart {
  border-radius: $radius-loose;
}

.period-toggle {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: $radius-default;
  overflow: hidden;

  .q-btn {
    border-radius: 0;
    min-height: 28px;
    padding: 2px 12px;
    font-weight: 500;
    font-size: 0.75rem;
  }
}
</style>
