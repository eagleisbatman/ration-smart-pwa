<template>
  <q-page class="q-pa-md">
    <PullToRefresh @refresh="onRefresh">
      <!-- Filters -->
      <div class="row q-gutter-sm q-mb-md items-center">
        <q-select
          v-model="selectedFarmer"
          :options="filteredFarmerOptions"
          :label="$t('milkSummary.filterByFarmer')"
          outlined
          dense
          clearable
          emit-value
          map-options
          use-input
          input-debounce="200"
          class="col"
          @filter="filterFarmers"
        >
          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">{{ $t('common.noResults') }}</q-item-section>
            </q-item>
          </template>
        </q-select>
        <q-btn
          flat
          round
          icon="date_range"
          @click="showDateFilter = true"
        />
        <q-btn-toggle
          v-model="viewMode"
          flat
          dense
          toggle-color="primary"
          :options="[
            { icon: 'view_list', value: 'list' },
            { icon: 'show_chart', value: 'chart' }
          ]"
          size="sm"
        />
        <q-btn
          flat
          round
          icon="compare_arrows"
          @click="router.push({ name: 'yield-farmer-compare' })"
        >
          <q-tooltip>{{ $t('milkSummary.compareFarmers') }}</q-tooltip>
        </q-btn>
      </div>

      <!-- Date Range Display -->
      <div v-if="dateFrom || dateTo" class="q-mb-md">
        <q-chip
          removable
          color="primary"
          text-color="white"
          @remove="clearDateFilter"
        >
          {{ formatDateRangeDisplay }}
        </q-chip>
      </div>

      <!-- Loading State -->
      <template v-if="loading">
        <SkeletonList :count="5" />
      </template>

      <!-- Empty State -->
      <template v-else-if="farmerLogs.length === 0">
        <EmptyState
          icon="analytics"
          :title="$t('milkSummary.noData')"
          :description="selectedFarmer ? $t('milkSummary.noDataForFarmer') : $t('milkSummary.selectFarmerHint')"
          :action-label="$t('milkSummary.logMilk')"
          action-icon="add"
          @action="router.push('/logs/new')"
        />
      </template>

      <!-- Summary Data -->
      <template v-else>
        <!-- Summary Card -->
        <q-card class="q-mb-md bg-primary text-white">
          <q-card-section>
            <div class="row q-gutter-md text-center">
              <div class="col">
                <div class="text-h5">{{ totalRecords }}</div>
                <div class="text-caption">{{ $t('milkSummary.records') }}</div>
              </div>
              <div class="col">
                <div class="text-h5">{{ avgDailyYield }}</div>
                <div class="text-caption">{{ $t('milkSummary.avgLPerDay') }}</div>
              </div>
              <div v-if="hasFatData" class="col">
                <div class="text-h5">{{ avgFat }}%</div>
                <div class="text-caption">{{ $t('milkSummary.avgFat') }}</div>
              </div>
              <div v-else class="col">
                <div class="text-h5">{{ daysLogged }}</div>
                <div class="text-caption">{{ $t('milkSummary.daysLogged') }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Revenue Card -->
        <q-card v-if="milkPrice" flat bordered class="q-mb-md">
          <q-card-section class="q-py-sm">
            <div class="row items-center q-gutter-x-sm">
              <q-icon name="payments" color="primary" />
              <span class="text-caption text-grey-7">{{ $t('milkSummary.revenue') }}</span>
            </div>
            <div class="row q-mt-xs q-gutter-x-lg">
              <div>
                <div class="text-body2 text-weight-medium">{{ formatCurrency(totalLiters * milkPrice) }}</div>
                <div class="text-caption text-grey-6">{{ $t('milkSummary.totalRevenue') }}</div>
              </div>
              <div>
                <div class="text-body2 text-weight-medium">{{ formatCurrency(avgDailyLiters * milkPrice) }}</div>
                <div class="text-caption text-grey-6">{{ $t('milkSummary.perDay') }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Actuals vs Projected (per cow with active diet) -->
        <template v-if="cowDietMetrics.length > 0">
          <div class="text-subtitle2 text-grey-7 q-mb-sm">{{ $t('milkSummary.actualsVsProjected') }}</div>
          <q-card v-for="metric in cowDietMetrics" :key="metric.cowId" flat bordered class="q-mb-sm">
            <q-card-section class="q-py-sm">
              <div class="row items-center justify-between q-mb-xs">
                <span class="text-body2 text-weight-medium">{{ metric.cowName }}</span>
                <q-chip
                  dense
                  size="sm"
                  :color="metric.yieldChange > 0 ? 'positive' : metric.yieldChange < 0 ? 'negative' : 'grey'"
                  text-color="white"
                >
                  {{ metric.yieldChange > 0 ? '+' : '' }}{{ metric.yieldChange }}%
                </q-chip>
              </div>
              <div class="row q-gutter-x-md text-caption">
                <div>
                  <span class="text-grey-6">{{ $t('milkSummary.baseline') }}:</span>
                  <span class="q-ml-xs">{{ metric.baseline }}L</span>
                </div>
                <div>
                  <span class="text-grey-6">{{ $t('milkSummary.actual') }}:</span>
                  <span class="q-ml-xs">{{ metric.actual }}L</span>
                </div>
                <div>
                  <span class="text-grey-6">{{ $t('milkSummary.adherence') }}:</span>
                  <span class="q-ml-xs">{{ metric.adherence }}%</span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </template>

        <!-- Chart View -->
        <template v-if="viewMode === 'chart'">
          <q-card flat bordered class="q-mb-md q-mt-md rounded-borders">
            <q-card-section>
              <div class="text-subtitle2 q-mb-sm">{{ $t('milkSummary.dailyTrend') }}</div>
              <YieldTrendChart
                :data="chartData"
                :show-fat="true"
                :height="250"
              />
            </q-card-section>
          </q-card>
        </template>

        <!-- List View -->
        <template v-else>
          <q-list separator class="rounded-borders q-mt-md" bordered>
            <q-item
              v-for="log in farmerLogs"
              :key="log.id"
              v-ripple
              clickable
              @click="router.push(`/logs/${log.id}/edit`)"
            >
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white">
                  <q-icon name="water_drop" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ formatDate(log.log_date) }} · {{ getCowName(log) }}</q-item-label>
                <q-item-label caption>
                  {{ (log.total_liters || 0).toFixed(1) }}{{ $t('units.l') }}
                  <span v-if="log.fat_percentage"> &middot; {{ $t('milkSummary.fat') }}: {{ log.fat_percentage }}%</span>
                  <span v-if="log.snf_percentage"> &middot; {{ $t('milkSummary.snf') }}: {{ log.snf_percentage }}%</span>
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-chip
                  v-if="log.fed_diet === true"
                  size="sm"
                  color="positive"
                  text-color="white"
                  dense
                >
                  {{ $t('logs.labels.fedDietBadge') }}
                </q-chip>
              </q-item-section>
            </q-item>
          </q-list>
        </template>
      </template>
    </PullToRefresh>

    <!-- Date Range Dialog -->
    <q-dialog v-model="showDateFilter">
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ $t('milkSummary.filterByDate') }}</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input
            v-model="dateFrom"
            :label="$t('milkSummary.from')"
            type="date"
            outlined
            dense
          />
          <q-input
            v-model="dateTo"
            :label="$t('milkSummary.to')"
            type="date"
            outlined
            dense
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="$t('common.cancel')" @click="clearDateFilter" />
          <q-btn v-close-popup flat :label="$t('milkSummary.apply')" color="primary" @click="loadData" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useMilkLogsStore } from 'src/stores/milkLogs';
import { useFarmersStore } from 'src/stores/farmers';
import { useCowsStore } from 'src/stores/cows';
import { useDietsStore } from 'src/stores/diets';
import { useAuthStore } from 'src/stores/auth';
import { useSettingsStore } from 'src/stores/settings';
import { useDateFormat } from 'src/composables/useDateFormat';
import { useCurrency } from 'src/composables/useCurrency';
import PullToRefresh from 'src/components/ui/PullToRefresh.vue';
import SkeletonList from 'src/components/ui/SkeletonList.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';
import YieldTrendChart from 'src/components/reports/YieldTrendChart.vue';
import type { MilkLog } from 'src/lib/offline/db';

const { t } = useI18n();
const router = useRouter();
const milkLogsStore = useMilkLogsStore();
const farmersStore = useFarmersStore();
const cowsStore = useCowsStore();
const dietsStore = useDietsStore();
const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const { formatDate } = useDateFormat();
const { formatCurrency } = useCurrency();

const selectedFarmer = ref<string | null>(null);
const dateFrom = ref<string | null>(null);
const dateTo = ref<string | null>(null);
const showDateFilter = ref(false);
const viewMode = ref<'list' | 'chart'>('list');
const loading = ref(false);
const farmerLogs = ref<MilkLog[]>([]);
const farmerCowIds = ref<string[]>([]);

interface CowDietMetric {
  cowId: string;
  cowName: string;
  baseline: number;
  actual: number;
  yieldChange: number;
  adherence: number;
}

const cowDietMetrics = ref<CowDietMetric[]>([]);

const milkPrice = computed(() => settingsStore.milkPricePerLiter);

const totalRecords = computed(() => farmerLogs.value.length);
const totalLiters = computed(() =>
  farmerLogs.value.reduce((sum, l) => sum + (l.total_liters || 0), 0)
);

// Average liters per unique date
const avgDailyLiters = computed(() => {
  const dates = new Set(farmerLogs.value.map((l) => l.log_date));
  if (dates.size === 0) return 0;
  return Math.round((totalLiters.value / dates.size) * 10) / 10;
});

const avgDailyYield = computed(() => avgDailyLiters.value.toFixed(1));

const hasFatData = computed(() =>
  farmerLogs.value.some((l) => l.fat_percentage != null && l.fat_percentage > 0)
);

const daysLogged = computed(() => {
  const dates = new Set(farmerLogs.value.map((l) => l.log_date));
  return dates.size;
});

const avgFat = computed(() => {
  const records = farmerLogs.value.filter((l) => l.fat_percentage != null && l.fat_percentage > 0);
  if (records.length === 0) return '0.0';
  const sum = records.reduce((acc, l) => acc + (l.fat_percentage || 0), 0);
  return (sum / records.length).toFixed(1);
});

const farmerOptions = computed(() =>
  farmersStore.activeFarmers.map((f) => ({
    label: f.id === authStore.selfFarmerProfileId ? `${f.name} (${t('common.you')})` : f.name,
    value: f.id,
  }))
);

const filteredFarmerOptions = ref<{ label: string; value: string }[]>([]);

function filterFarmers(val: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = val.toLowerCase();
    filteredFarmerOptions.value = needle
      ? farmerOptions.value.filter((o) => o.label.toLowerCase().includes(needle))
      : farmerOptions.value;
  });
}

const chartData = computed(() =>
  [...farmerLogs.value]
    .sort((a, b) => a.log_date.localeCompare(b.log_date))
    .map((l) => ({
      date: l.log_date,
      yield: l.total_liters || 0,
      fat: l.fat_percentage,
    }))
);

const formatDateRangeDisplay = computed(() => {
  if (dateFrom.value && dateTo.value) {
    return `${formatDate(dateFrom.value, 'PP')} - ${formatDate(dateTo.value, 'PP')}`;
  }
  if (dateFrom.value) return `${t('milkSummary.from')} ${formatDate(dateFrom.value, 'PP')}`;
  if (dateTo.value) return `${t('milkSummary.to')} ${formatDate(dateTo.value, 'PP')}`;
  return '';
});

function getCowName(log: MilkLog): string {
  if (log.cow_name) return log.cow_name;
  const cow = cowsStore.activeCows.find((c) => c.id === log.cow_id);
  return cow?.name || t('logs.labels.unknownCow');
}

async function loadData() {
  if (!selectedFarmer.value) {
    farmerLogs.value = [];
    cowDietMetrics.value = [];
    return;
  }

  loading.value = true;

  try {
    // Get farmer's cows — try backend first, fall back to local cow store
    let cows = await farmersStore.getFarmerCows(selectedFarmer.value) as Array<{ id: string; name: string }>;
    if (cows.length === 0) {
      // Cows may not have farmer_profile_id set; fall back to local store
      const isSelf = selectedFarmer.value === authStore.selfFarmerProfileId;
      if (isSelf) {
        cows = cowsStore.activeCows.map((c) => ({ id: c.id, name: c.name }));
      } else {
        cows = cowsStore.getCowsForFarmer(selectedFarmer.value).map((c) => ({ id: c.id, name: c.name }));
      }
    }
    farmerCowIds.value = cows.map((c) => c.id);

    // Ensure milk logs are fetched from backend first
    await milkLogsStore.fetchLogs();

    // Get logs for all of this farmer's cows
    farmerLogs.value = await milkLogsStore.getLogsForFarmer(farmerCowIds.value, {
      startDate: dateFrom.value || undefined,
      endDate: dateTo.value || undefined,
    });

    // Build actuals vs projected for cows with active diets
    const metrics: CowDietMetric[] = [];
    for (const cow of cows) {
      const activeDiet = await dietsStore.getActiveDietForCow(cow.id);
      if (!activeDiet) continue;

      const inputData = activeDiet.input_data as Record<string, unknown> | undefined;
      const baseline = inputData?.milk_yield_liters as number | undefined;
      if (!baseline || baseline <= 0) continue;

      // Get logs linked to this diet
      const dietLogs = await milkLogsStore.getLogsByDietId(activeDiet.id);
      if (dietLogs.length === 0) continue;

      const avgYield = dietLogs.reduce((s, l) => s + (l.total_liters || 0), 0) / dietLogs.length;
      const change = Math.round(((avgYield - baseline) / baseline) * 1000) / 10;
      const fedCount = dietLogs.filter((l) => l.fed_diet === true).length;
      const adherence = Math.round((fedCount / dietLogs.length) * 100);

      metrics.push({
        cowId: cow.id,
        cowName: cow.name,
        baseline: Math.round(baseline * 10) / 10,
        actual: Math.round(avgYield * 10) / 10,
        yieldChange: change,
        adherence,
      });
    }
    cowDietMetrics.value = metrics;
  } finally {
    loading.value = false;
  }
}

function clearDateFilter() {
  dateFrom.value = null;
  dateTo.value = null;
  loadData();
}

async function onRefresh(done: () => void) {
  await loadData();
  done();
}

watch(selectedFarmer, () => {
  loadData();
});

// Keep filtered options in sync when farmer list changes
watch(farmerOptions, (opts) => {
  filteredFarmerOptions.value = opts;
  // Auto-select self once options are available (fixes UUID display on initial load)
  if (!selectedFarmer.value && authStore.selfFarmerProfileId && opts.some((o) => o.value === authStore.selfFarmerProfileId)) {
    selectedFarmer.value = authStore.selfFarmerProfileId;
  }
});

onMounted(async () => {
  await farmersStore.fetchFarmers();
  await cowsStore.fetchCows();
});
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: $radius-loose;
  overflow: hidden;
}
</style>
