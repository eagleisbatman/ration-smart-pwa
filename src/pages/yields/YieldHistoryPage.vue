<template>
  <q-page class="q-pa-md">
    <PullToRefresh @refresh="onRefresh">
      <!-- Filters -->
      <div class="row q-gutter-sm q-mb-md items-center">
        <q-select
          v-model="selectedFarmer"
          :options="farmerOptions"
          :label="$t('logs.yield.filterByFarmer')"
          outlined
          dense
          clearable
          emit-value
          map-options
          class="col"
        />
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
          <q-tooltip>{{ $t('yields.compare.title') }}</q-tooltip>
        </q-btn>
        <q-btn
          flat
          round
          icon="file_download"
          :disable="yieldRecords.length === 0"
          @click="showExportSheet = true"
        />
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
      <template v-if="loading && yieldRecords.length === 0">
        <SkeletonList :count="5" />
      </template>

      <!-- Empty State -->
      <template v-else-if="yieldRecords.length === 0">
        <EmptyState
          icon="analytics"
          :title="$t('logs.yield.noYieldRecords')"
          :description="$t('logs.yield.noYieldRecordsDesc')"
          :action-label="$t('logs.yield.recordYield')"
          action-icon="add_chart"
          @action="router.push('/yields/new')"
        />
      </template>

      <!-- Yield Data -->
      <template v-else>
        <!-- Summary Card -->
        <q-card class="q-mb-md bg-primary text-white">
          <q-card-section>
            <div class="row q-gutter-md text-center">
              <div class="col">
                <div class="text-h5">{{ totalRecords }}</div>
                <div class="text-caption">{{ $t('logs.yield.records') }}</div>
              </div>
              <div class="col">
                <div class="text-h5">{{ avgYield }}</div>
                <div class="text-caption">{{ $t('logs.yield.avgLPerDay') }}</div>
              </div>
              <div class="col">
                <div class="text-h5">{{ avgFat }}%</div>
                <div class="text-caption">{{ $t('logs.yield.avgFat') }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Chart View -->
        <template v-if="viewMode === 'chart'">
          <q-card flat bordered class="q-mb-md rounded-borders">
            <q-card-section>
              <div class="text-subtitle2 q-mb-sm">{{ $t('chart.yieldTrend') }}</div>
              <YieldTrendChart
                :data="chartYieldData"
                :show-fat="true"
                :height="250"
              />
            </q-card-section>
          </q-card>
        </template>

        <!-- List View -->
        <template v-else>
          <q-list separator class="rounded-borders" bordered>
            <q-item
              v-for="record in yieldRecords"
              :key="record.id"
              v-ripple
              clickable
              @click="editYield(record.id)"
            >
              <q-item-section avatar>
                <q-avatar color="positive" text-color="white">
                  <q-icon name="water_drop" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ formatDate(record.collection_date) }}</q-item-label>
                <q-item-label caption>
                  {{ record.milk_yield_liters?.toFixed(1) || '0' }}{{ $t('units.l') }}
                  <span v-if="record.fat_percentage"> &middot; {{ $t('logs.yield.fat') }}: {{ record.fat_percentage }}%</span>
                  <span v-if="record.snf_percentage"> &middot; {{ $t('logs.yield.snf') }}: {{ record.snf_percentage }}%</span>
                </q-item-label>
                <q-item-label v-if="record.notes" caption class="text-grey-6">
                  {{ record.notes }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-chip
                  v-if="!record._synced"
                  size="sm"
                  color="warning"
                  text-color="white"
                  icon="sync"
                  dense
                >
                  {{ $t('logs.yield.pending') }}
                </q-chip>
              </q-item-section>
            </q-item>
          </q-list>
        </template>
      </template>
    </PullToRefresh>

    <!-- FAB for adding new yield -->
    <q-page-sticky position="bottom-right" :offset="[16, 72]">
      <q-btn
        fab
        icon="add_chart"
        color="primary"
        @click="navigateToNewYield"
      />
    </q-page-sticky>

    <!-- Export Bottom Sheet -->
    <q-dialog v-model="showExportSheet" position="bottom">
      <q-card class="dialog-card">
        <q-card-section>
          <div class="text-h6">{{ $t('logs.yield.export') }}</div>
        </q-card-section>
        <q-list>
          <q-item v-close-popup clickable @click="exportYieldData('csv')">
            <q-item-section avatar>
              <q-icon name="description" color="green" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('logs.yield.exportCSV') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-close-popup clickable @click="exportYieldData('pdf')">
            <q-item-section avatar>
              <q-icon name="picture_as_pdf" color="red" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('logs.yield.exportPDF') }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-dialog>

    <!-- Date Range Dialog -->
    <q-dialog v-model="showDateFilter">
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ $t('logs.yield.filterByDate') }}</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input
            v-model="dateFrom"
            :label="$t('logs.yield.from')"
            type="date"
            outlined
            dense
          />
          <q-input
            v-model="dateTo"
            :label="$t('logs.yield.to')"
            type="date"
            outlined
            dense
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="$t('logs.yield.clear')" @click="clearDateFilter" />
          <q-btn v-close-popup flat :label="$t('logs.yield.apply')" color="primary" @click="applyDateFilter" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useYieldsStore } from 'src/stores/yields';
import { useFarmersStore } from 'src/stores/farmers';
import { useDateFormat } from 'src/composables/useDateFormat';
import PullToRefresh from 'src/components/ui/PullToRefresh.vue';
import SkeletonList from 'src/components/ui/SkeletonList.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';
import YieldTrendChart from 'src/components/reports/YieldTrendChart.vue';

const { t } = useI18n();
const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const yieldsStore = useYieldsStore();
const farmersStore = useFarmersStore();
const { formatDate } = useDateFormat();

const selectedFarmer = ref<string | null>(null);
const dateFrom = ref<string | null>(null);
const dateTo = ref<string | null>(null);
const showDateFilter = ref(false);
const showExportSheet = ref(false);
const viewMode = ref<'list' | 'chart'>('list');

const loading = computed(() => yieldsStore.loading);
const yieldRecords = computed(() => yieldsStore.yieldRecords);

const totalRecords = computed(() => yieldRecords.value.length);
const avgYield = computed(() => yieldsStore.averageMilkYield.toFixed(1));
const avgFat = computed(() => {
  const records = yieldRecords.value.filter((y) => y.fat_percentage != null);
  if (records.length === 0) return '0.0';
  const sum = records.reduce((acc, y) => acc + (y.fat_percentage || 0), 0);
  return (sum / records.length).toFixed(1);
});

const chartYieldData = computed(() =>
  [...yieldRecords.value]
    .sort((a, b) => a.collection_date.localeCompare(b.collection_date))
    .map((r) => ({
      date: r.collection_date,
      yield: r.milk_yield_liters || 0,
      fat: r.fat_percentage,
    }))
);

const farmerOptions = computed(() =>
  farmersStore.activeFarmers.map((f) => ({
    label: f.name,
    value: f.id,
  }))
);

const formatDateRangeDisplay = computed(() => {
  if (dateFrom.value && dateTo.value) {
    return `${formatDate(dateFrom.value, 'PP')} - ${formatDate(dateTo.value, 'PP')}`;
  }
  if (dateFrom.value) {
    return `${t('logs.yield.from')} ${formatDate(dateFrom.value, 'PP')}`;
  }
  if (dateTo.value) {
    return `${t('logs.yield.to')} ${formatDate(dateTo.value, 'PP')}`;
  }
  return '';
});

async function loadData() {
  if (selectedFarmer.value) {
    await yieldsStore.fetchFarmerYieldHistory(selectedFarmer.value, {
      dateFrom: dateFrom.value || undefined,
      dateTo: dateTo.value || undefined,
    });
  } else {
    await yieldsStore.fetchYieldHistory({
      dateFrom: dateFrom.value || undefined,
      dateTo: dateTo.value || undefined,
    });
  }
}

async function onRefresh(done: () => void) {
  await loadData();
  done();
}

function clearDateFilter() {
  dateFrom.value = null;
  dateTo.value = null;
  loadData();
}

function applyDateFilter() {
  loadData();
}

function navigateToNewYield() {
  const query: Record<string, string> = {};
  if (selectedFarmer.value) {
    query.farmer = selectedFarmer.value;
  }
  router.push({ path: '/yields/new', query });
}

function editYield(id: string) {
  router.push(`/yields/${id}/edit`);
}

function getFarmerName(farmerId: string): string {
  const farmer = farmersStore.activeFarmers.find((f) => f.id === farmerId);
  return farmer?.name || farmerId;
}

function exportYieldData(format: 'csv' | 'pdf') {
  const records = yieldRecords.value;
  if (records.length === 0) return;

  if (format === 'csv') {
    const header = 'Date,Farmer,Cow,Yield (L),Fat %,SNF %,Notes';
    const rows = records.map((r) => {
      const date = r.collection_date;
      const farmer = getFarmerName(r.farmer_profile_id);
      const cow = r.cow_profile_id || '';
      const yieldL = r.milk_yield_liters?.toFixed(1) || '0';
      const fat = r.fat_percentage != null ? r.fat_percentage.toString() : '';
      const snf = r.snf_percentage != null ? r.snf_percentage.toString() : '';
      const notes = (r.notes || '').replace(/"/g, '""');
      return `${date},"${farmer}","${cow}",${yieldL},${fat},${snf},"${notes}"`;
    });

    const csvContent = [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `yield-data-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    $q.notify({ type: 'positive', message: t('logs.yield.exported') });
  } else {
    // PDF via print
    const tableRows = records
      .map(
        (r, i) => `
      <tr style="${i % 2 === 0 ? 'background-color: #f9f9f9;' : ''}">
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0;">${r.collection_date}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0;">${getFarmerName(r.farmer_profile_id)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${r.milk_yield_liters?.toFixed(1) || '0'} L</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${r.fat_percentage != null ? r.fat_percentage + '%' : '-'}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0; text-align: right;">${r.snf_percentage != null ? r.snf_percentage + '%' : '-'}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e0e0e0;">${r.notes || ''}</td>
      </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Yield Data Export</title>
  <style>
    @media print { body { margin: 0; padding: 20px; } }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; max-width: 900px; margin: 0 auto; padding: 24px; }
    h1 { color: #1976d2; font-size: 22px; border-bottom: 3px solid #1976d2; padding-bottom: 12px; }
    .summary { display: flex; gap: 16px; margin-bottom: 24px; }
    .summary-item { background: #f5f5f5; padding: 10px 16px; border-radius: 6px; flex: 1; text-align: center; }
    .summary-label { font-size: 12px; color: #888; text-transform: uppercase; }
    .summary-value { font-size: 18px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; }
    th { background-color: #1976d2; color: white; padding: 10px 12px; text-align: left; font-size: 13px; text-transform: uppercase; }
    .footer { margin-top: 32px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; padding-top: 16px; }
  </style>
</head>
<body>
  <h1>Yield Data Export</h1>
  <div class="summary">
    <div class="summary-item"><div class="summary-label">Records</div><div class="summary-value">${totalRecords.value}</div></div>
    <div class="summary-item"><div class="summary-label">Avg Yield</div><div class="summary-value">${avgYield.value} L</div></div>
    <div class="summary-item"><div class="summary-label">Avg Fat</div><div class="summary-value">${avgFat.value}%</div></div>
  </div>
  <table>
    <thead><tr><th>Date</th><th>Farmer</th><th style="text-align:right">Yield</th><th style="text-align:right">Fat %</th><th style="text-align:right">SNF %</th><th>Notes</th></tr></thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer"><p>Generated by RationSmart on ${new Date().toLocaleDateString()}</p></div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }
}

// Watch for farmer filter changes
watch(selectedFarmer, () => {
  loadData();
});

onMounted(() => {
  // Check for farmer query param
  if (route.query.farmer) {
    selectedFarmer.value = route.query.farmer as string;
  }
  loadData();
  farmersStore.fetchFarmers();
});
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: 12px;
  overflow: hidden;
}
</style>
