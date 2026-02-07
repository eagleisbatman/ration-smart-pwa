<template>
  <q-page class="q-pa-md">
    <!-- Farmer Selector -->
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 q-mb-sm">{{ $t('yields.compare.selectFarmers') }}</div>
        <q-select
          v-model="selectedFarmerIds"
          :options="farmerOptions"
          :label="$t('yields.compare.selectFarmers')"
          multiple
          use-chips
          emit-value
          map-options
          outlined
          dense
          :max-values="4"
        >
          <template #selected-item="scope">
            <q-chip
              removable
              dense
              :color="farmerColor(scope.index)"
              text-color="white"
              class="q-ma-xs"
              @remove="scope.removeAtIndex(scope.index)"
            >
              {{ scope.opt.label }}
            </q-chip>
          </template>
        </q-select>
      </q-card-section>
    </q-card>

    <!-- Date Range Filter -->
    <div class="row q-gutter-sm q-mb-md items-center">
      <div class="text-subtitle2">{{ $t('yields.compare.dateRange') }}</div>
      <q-input
        v-model="dateFrom"
        :label="$t('logs.yield.from')"
        type="date"
        outlined
        dense
        class="col"
      />
      <q-input
        v-model="dateTo"
        :label="$t('logs.yield.to')"
        type="date"
        outlined
        dense
        class="col"
      />
      <q-btn
        flat
        round
        icon="clear"
        size="sm"
        :disable="!dateFrom && !dateTo"
        @click="clearDateFilter"
      />
    </div>

    <!-- Loading State -->
    <template v-if="loading">
      <div class="text-center q-pa-lg">
        <q-spinner-dots size="40px" color="primary" />
        <div class="text-caption q-mt-sm">{{ $t('common.loading') }}</div>
      </div>
    </template>

    <!-- Empty State: No farmers selected -->
    <template v-else-if="selectedFarmerIds.length < 2">
      <div class="text-center q-pa-xl">
        <q-icon name="compare_arrows" size="64px" color="grey-4" />
        <div class="text-body1 text-grey-6 q-mt-md">
          {{ $t('yields.compare.noFarmersSelected') }}
        </div>
      </div>
    </template>

    <!-- Comparison Content -->
    <template v-else>
      <!-- Comparison Cards -->
      <div class="row q-col-gutter-sm q-mb-md">
        <div
          v-for="(stats, index) in farmerStats"
          :key="stats.farmerId"
          class="col-12 col-sm-6"
          :class="{ 'col-md-3': farmerStats.length <= 4 }"
        >
          <q-card flat bordered>
            <q-card-section class="q-pb-none">
              <div class="row items-center q-mb-sm">
                <q-badge
                  :color="farmerColor(index)"
                  rounded
                  class="q-mr-sm"
                  style="width: 12px; height: 12px; min-width: 12px;"
                />
                <div class="text-subtitle2 ellipsis">{{ stats.farmerName }}</div>
              </div>
            </q-card-section>
            <q-card-section class="q-pt-xs">
              <div class="q-gutter-xs">
                <div class="row justify-between">
                  <span class="text-caption text-grey-7">{{ $t('yields.compare.avgDailyYield') }}</span>
                  <span class="text-body2 text-weight-bold">{{ stats.avgDailyYield.toFixed(1) }} {{ $t('units.l') }}</span>
                </div>
                <q-separator />
                <div class="row justify-between">
                  <span class="text-caption text-grey-7">{{ $t('yields.compare.avgFat') }}</span>
                  <span class="text-body2 text-weight-bold">{{ stats.avgFat.toFixed(1) }}%</span>
                </div>
                <q-separator />
                <div class="row justify-between">
                  <span class="text-caption text-grey-7">{{ $t('yields.compare.avgSnf') }}</span>
                  <span class="text-body2 text-weight-bold">{{ stats.avgSnf.toFixed(1) }}%</span>
                </div>
                <q-separator />
                <div class="row justify-between">
                  <span class="text-caption text-grey-7">{{ $t('yields.compare.totalMilk') }}</span>
                  <span class="text-body2 text-weight-bold">{{ stats.totalMilk.toFixed(1) }} {{ $t('units.l') }}</span>
                </div>
                <q-separator />
                <div class="row justify-between">
                  <span class="text-caption text-grey-7">{{ $t('yields.compare.records') }}</span>
                  <span class="text-body2 text-weight-bold">{{ stats.recordCount }}</span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- SVG Bar Chart: Average Yield Comparison -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">{{ $t('yields.compare.avgDailyYield') }}</div>
          <svg
            :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
            :width="chartWidth"
            :height="chartHeight"
            class="full-width"
            style="max-width: 100%;"
            preserveAspectRatio="xMidYMid meet"
          >
            <!-- Y-axis labels -->
            <text
              v-for="tick in yAxisTicks"
              :key="'tick-' + tick"
              :x="chartPadding.left - 8"
              :y="yScale(tick) + 4"
              text-anchor="end"
              class="chart-label"
              font-size="11"
              fill="#999"
            >
              {{ tick }}
            </text>

            <!-- Grid lines -->
            <line
              v-for="tick in yAxisTicks"
              :key="'grid-' + tick"
              :x1="chartPadding.left"
              :y1="yScale(tick)"
              :x2="chartWidth - chartPadding.right"
              :y2="yScale(tick)"
              stroke="#eee"
              stroke-width="1"
            />

            <!-- Bars -->
            <g v-for="(stats, index) in farmerStats" :key="'bar-' + stats.farmerId">
              <rect
                :x="barX(index)"
                :y="yScale(stats.avgDailyYield)"
                :width="barWidth"
                :height="Math.max(0, plotAreaHeight - (yScale(stats.avgDailyYield) - chartPadding.top))"
                :fill="farmerColorHex(index)"
                rx="3"
                ry="3"
              />
              <!-- Value label above bar -->
              <text
                :x="barX(index) + barWidth / 2"
                :y="yScale(stats.avgDailyYield) - 6"
                text-anchor="middle"
                font-size="11"
                font-weight="bold"
                :fill="farmerColorHex(index)"
              >
                {{ stats.avgDailyYield.toFixed(1) }}
              </text>
              <!-- Farmer name below bar -->
              <text
                :x="barX(index) + barWidth / 2"
                :y="chartHeight - 4"
                text-anchor="middle"
                font-size="10"
                fill="#666"
              >
                {{ truncateName(stats.farmerName) }}
              </text>
            </g>

            <!-- Baseline -->
            <line
              :x1="chartPadding.left"
              :y1="chartHeight - chartPadding.bottom"
              :x2="chartWidth - chartPadding.right"
              :y2="chartHeight - chartPadding.bottom"
              stroke="#ccc"
              stroke-width="1"
            />
          </svg>
        </q-card-section>
      </q-card>

      <!-- Comparison Table -->
      <q-card flat bordered>
        <q-markup-table flat bordered separator="cell" dense>
          <thead>
            <tr>
              <th class="text-left">{{ $t('logs.yield.farmer') }}</th>
              <th class="text-right">{{ $t('yields.compare.avgDailyYield') }}</th>
              <th class="text-right">{{ $t('yields.compare.avgFat') }}</th>
              <th class="text-right">{{ $t('yields.compare.avgSnf') }}</th>
              <th class="text-right">{{ $t('yields.compare.totalMilk') }}</th>
              <th class="text-right">{{ $t('yields.compare.records') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(stats, index) in farmerStats" :key="'row-' + stats.farmerId">
              <td class="text-left">
                <div class="row items-center no-wrap">
                  <q-badge
                    :color="farmerColor(index)"
                    rounded
                    class="q-mr-sm"
                    style="width: 10px; height: 10px; min-width: 10px;"
                  />
                  <span class="ellipsis">{{ stats.farmerName }}</span>
                </div>
              </td>
              <td class="text-right text-weight-bold">{{ stats.avgDailyYield.toFixed(1) }}</td>
              <td class="text-right">{{ stats.avgFat.toFixed(1) }}%</td>
              <td class="text-right">{{ stats.avgSnf.toFixed(1) }}%</td>
              <td class="text-right">{{ stats.totalMilk.toFixed(1) }}</td>
              <td class="text-right">{{ stats.recordCount }}</td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { api } from 'src/boot/axios';
import { useFarmersStore } from 'src/stores/farmers';
import { YieldData } from 'src/lib/offline/db';

interface FarmerYieldStats {
  farmerId: string;
  farmerName: string;
  avgDailyYield: number;
  avgFat: number;
  avgSnf: number;
  totalMilk: number;
  recordCount: number;
}

const farmersStore = useFarmersStore();

const selectedFarmerIds = ref<string[]>([]);
const dateFrom = ref<string | null>(null);
const dateTo = ref<string | null>(null);
const loading = ref(false);

// Map of farmerId -> YieldData[]
const farmerYieldData = ref<Map<string, YieldData[]>>(new Map());

// Color palette for farmers
const colorPalette = ['primary', 'positive', 'orange', 'purple'] as const;
const colorHexPalette = ['#1976d2', '#21ba45', '#ff9800', '#9c27b0'];

function farmerColor(index: number): string {
  return colorPalette[index % colorPalette.length];
}

function farmerColorHex(index: number): string {
  return colorHexPalette[index % colorHexPalette.length];
}

const farmerOptions = computed(() =>
  farmersStore.activeFarmers.map((f) => ({
    label: f.name,
    value: f.id,
  }))
);

// Compute stats for each selected farmer
const farmerStats = computed<FarmerYieldStats[]>(() => {
  return selectedFarmerIds.value.map((farmerId) => {
    const records = farmerYieldData.value.get(farmerId) || [];
    const farmerName =
      farmersStore.activeFarmers.find((f) => f.id === farmerId)?.name || farmerId;

    const yieldRecords = records.filter((r) => r.milk_yield_liters != null);
    const fatRecords = records.filter((r) => r.fat_percentage != null);
    const snfRecords = records.filter((r) => r.snf_percentage != null);

    const totalMilk = yieldRecords.reduce((sum, r) => sum + (r.milk_yield_liters || 0), 0);
    const avgDailyYield =
      yieldRecords.length > 0 ? totalMilk / yieldRecords.length : 0;
    const avgFat =
      fatRecords.length > 0
        ? fatRecords.reduce((sum, r) => sum + (r.fat_percentage || 0), 0) / fatRecords.length
        : 0;
    const avgSnf =
      snfRecords.length > 0
        ? snfRecords.reduce((sum, r) => sum + (r.snf_percentage || 0), 0) / snfRecords.length
        : 0;

    return {
      farmerId,
      farmerName,
      avgDailyYield,
      avgFat,
      avgSnf,
      totalMilk,
      recordCount: records.length,
    };
  });
});

// --- SVG Chart computations ---
const chartWidth = 400;
const chartHeight = 220;
const chartPadding = { top: 20, right: 20, bottom: 30, left: 45 };
const plotAreaHeight = chartHeight - chartPadding.top - chartPadding.bottom;

const maxYield = computed(() => {
  const max = Math.max(...farmerStats.value.map((s) => s.avgDailyYield), 1);
  return Math.ceil(max / 5) * 5 || 10;
});

const yAxisTicks = computed(() => {
  const step = maxYield.value / 4;
  return [0, step, step * 2, step * 3, maxYield.value].map((v) =>
    Math.round(v * 10) / 10
  );
});

function yScale(value: number): number {
  const ratio = value / maxYield.value;
  return chartHeight - chartPadding.bottom - ratio * plotAreaHeight;
}

const barWidth = computed(() => {
  const count = farmerStats.value.length;
  if (count === 0) return 0;
  const availableWidth =
    chartWidth - chartPadding.left - chartPadding.right;
  const maxBarWidth = 60;
  const gap = 16;
  const totalBarSpace = availableWidth - gap * (count - 1);
  return Math.min(maxBarWidth, totalBarSpace / count);
});

function barX(index: number): number {
  const count = farmerStats.value.length;
  const gap = 16;
  const totalWidth = count * barWidth.value + (count - 1) * gap;
  const startX = chartPadding.left + (chartWidth - chartPadding.left - chartPadding.right - totalWidth) / 2;
  return startX + index * (barWidth.value + gap);
}

function truncateName(name: string): string {
  return name.length > 10 ? name.slice(0, 9) + '...' : name;
}

// Fetch yield data for all selected farmers
async function fetchComparisonData(): Promise<void> {
  if (selectedFarmerIds.value.length < 2) return;

  loading.value = true;
  const newData = new Map<string, YieldData[]>();

  try {
    const promises = selectedFarmerIds.value.map(async (farmerId) => {
      try {
        const response = await api.get(`/api/v1/yield-data/farmer/${farmerId}`, {
          params: {
            date_from: dateFrom.value || undefined,
            date_to: dateTo.value || undefined,
          },
        });
        const records: YieldData[] = response.data.yield_data || [];
        newData.set(farmerId, records);
      } catch {
        // If a single farmer fails, set empty array
        newData.set(farmerId, []);
      }
    });

    await Promise.all(promises);
    farmerYieldData.value = newData;
  } finally {
    loading.value = false;
  }
}

function clearDateFilter(): void {
  dateFrom.value = null;
  dateTo.value = null;
}

// Watch for changes to trigger re-fetch
watch(
  [selectedFarmerIds, dateFrom, dateTo],
  () => {
    if (selectedFarmerIds.value.length >= 2) {
      fetchComparisonData();
    }
  },
  { deep: true }
);

onMounted(async () => {
  await farmersStore.fetchFarmers();
});
</script>

<style lang="scss" scoped>
.chart-label {
  user-select: none;
}
</style>
