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

      <!-- Simple table view for milk production data -->
      <div v-if="chartData.length > 0 && !loading" class="chart-table" style="overflow-x: auto">
        <q-markup-table flat bordered dense class="text-left" style="min-width: 320px">
          <thead>
            <tr class="bg-grey-2">
              <th>{{ $t('chart.date') }}</th>
              <th class="text-right">{{ $t('chart.morning') }}</th>
              <th class="text-right">{{ $t('chart.evening') }}</th>
              <th class="text-right">{{ $t('chart.totalMilk') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in displayData" :key="day.date" :class="{ 'bg-primary-1': isToday(day.date) }">
              <td>{{ formatDateShort(day.date) }}</td>
              <td class="text-right text-primary">{{ day.morning.toFixed(1) }}L</td>
              <td class="text-right text-secondary">{{ day.evening.toFixed(1) }}L</td>
              <td class="text-right text-weight-medium">{{ day.total.toFixed(1) }}L</td>
            </tr>
          </tbody>
        </q-markup-table>
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
import { format, subDays, parseISO, isToday as dateFnsIsToday } from 'date-fns';
import { useMilkLogsStore } from 'src/stores/milkLogs';

const props = defineProps<{
  height?: number;
  cowId?: string; // Optional: filter by specific cow
}>();

useI18n(); // Used for template translations via $t
const milkLogsStore = useMilkLogsStore();

const period = ref<'7d' | '14d'>('7d');
const loading = ref(false);

const periodOptions = [
  { label: '7D', value: '7d' },
  { label: '14D', value: '14d' },
];

// Chart data processing
interface DailyData {
  date: string;
  morning: number;
  evening: number;
  total: number;
}

const chartData = shallowRef<DailyData[]>([]);

// Get display data (most recent days first for table display)
const displayData = computed(() => {
  return [...chartData.value].reverse();
});

// Format date for display
function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d');
}

// Check if date is today
function isToday(dateStr: string): boolean {
  return dateFnsIsToday(parseISO(dateStr));
}

// Process logs into daily aggregates
function processLogs() {
  const days = period.value === '7d' ? 7 : 14;
  const endDate = new Date();
  const startDate = subDays(endDate, days - 1);

  // Create a map for each day in the range
  const dailyMap = new Map<string, DailyData>();

  for (let i = 0; i < days; i++) {
    const date = format(subDays(endDate, days - 1 - i), 'yyyy-MM-dd');
    dailyMap.set(date, { date, morning: 0, evening: 0, total: 0 });
  }

  // Filter and aggregate logs
  const logs = milkLogsStore.logs.filter((log) => {
    const logDate = parseISO(log.log_date);
    const inRange = logDate >= startDate && logDate <= endDate;
    const matchesCow = !props.cowId || log.cow_id === props.cowId;
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
  // Only show the chart if there's at least one day with actual data
  chartData.value = allData.some((d) => d.total > 0) ? allData : [];
}

// Summary statistics
const totalProduction = computed(() =>
  chartData.value.reduce((sum, d) => sum + d.total, 0)
);

const averageDaily = computed(() => {
  const daysWithData = chartData.value.filter((d) => d.total > 0).length;
  return daysWithData > 0 ? totalProduction.value / daysWithData : 0;
});

// Trend calculation (compare last 3 days to previous 3 days)
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

// Watch for period changes
watch(period, () => {
  processLogs();
});

// Watch for store changes
watch(
  () => milkLogsStore.logs,
  () => {
    processLogs();
  },
  { deep: true }
);

// Initial load
onMounted(async () => {
  loading.value = true;
  try {
    // Ensure logs are loaded
    if (milkLogsStore.logs.length === 0) {
      await milkLogsStore.fetchLogs();
    }
    processLogs();
  } finally {
    loading.value = false;
  }
});

// Expose refresh method
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
  border-radius: 12px;
}

.period-toggle {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;

  .q-btn {
    border-radius: 0;
    min-height: 28px;
    padding: 2px 12px;
    font-weight: 500;
    font-size: 0.75rem;
  }
}

.chart-table {
  :deep(.q-table) {
    font-size: 12px;
  }

  :deep(th) {
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  :deep(td), :deep(th) {
    padding: 8px 12px;
  }
}

.bg-primary-1 {
  background-color: rgba(25, 118, 210, 0.08);
}
</style>
