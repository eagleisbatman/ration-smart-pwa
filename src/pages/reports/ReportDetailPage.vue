<template>
  <q-page class="q-pa-md">
    <template v-if="loading">
      <SkeletonCard />
    </template>

    <template v-else-if="reportData">
      <!-- Header -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-h6">{{ reportData.farmer_name }}</div>
          <div class="text-caption text-grey-7">{{ reportData.farmer_location }}</div>
          <div class="text-caption text-grey-7">{{ formatDate(reportData.generated_at, 'PPPp') }}</div>
        </q-card-section>
      </q-card>

      <!-- Cow Details + Summary -->
      <q-card v-if="reportData.cow_name" flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle2 q-mb-xs">{{ $t('reports.cowDetails') }}</div>
          <div class="text-body2 text-weight-medium">{{ reportData.cow_name }}</div>
          <div v-if="reportData.cow_details" class="text-caption text-grey-7 q-mb-sm">{{ reportData.cow_details }}</div>
          <div v-if="reportData.total_cost_daily || reportData.total_dm_kg" class="row q-col-gutter-sm q-mt-xs">
            <div v-if="reportData.total_cost_daily" class="col">
              <div class="text-h6 text-primary">{{ formatCurrencyWhole(reportData.total_cost_daily) }}</div>
              <div class="text-caption text-grey-7">{{ $t('reports.dailyCost') }}</div>
            </div>
            <div v-if="reportData.total_dm_kg" class="col">
              <div class="text-h6 text-primary">{{ reportData.total_dm_kg }} kg</div>
              <div class="text-caption text-grey-7">{{ $t('reports.dmIntake') }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Feed Table -->
      <div v-if="reportData.diet_feeds?.length" class="q-mb-md">
        <div class="text-subtitle1 q-mb-sm">
          {{ $t('reports.recommendedDiet') }}
          <span v-if="reportData.diet_name" class="text-caption text-grey-7"> — {{ reportData.diet_name }}</span>
        </div>
        <q-card flat bordered>
          <q-markup-table flat separator="horizontal" dense>
            <thead>
              <tr>
                <th class="text-left">{{ $t('reports.feedName') }}</th>
                <th class="text-right">{{ $t('reports.amount') }}</th>
                <th class="text-right">{{ $t('reports.cost') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(feed, idx) in reportData.diet_feeds" :key="idx">
                <td>{{ feed.feed_name }}</td>
                <td class="text-right text-weight-medium">{{ feed.amount_kg?.toFixed(2) }} kg</td>
                <td class="text-right text-weight-medium">{{ formatCurrencyValue(feed.cost || 0) }}</td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card>
      </div>

      <!-- Nutrient Balance -->
      <div v-if="reportData.nutrient_balance?.length" class="q-mb-md">
        <div class="text-subtitle1 q-mb-sm">{{ $t('reports.nutrientBalance') }}</div>
        <q-card flat bordered>
          <q-list separator dense>
            <q-item v-for="(nb, idx) in reportData.nutrient_balance" :key="idx">
              <q-item-section>
                <q-item-label>{{ nb.parameter }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label>
                  <span :class="nb.supply >= nb.requirement * 0.95 ? 'text-positive' : 'text-negative'">
                    {{ formatNutrientValue(nb.supply) }}
                  </span>
                  / {{ formatNutrientValue(nb.requirement) }} {{ nb.unit }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

      <!-- Yield History -->
      <div v-if="reportData.yield_history?.length" class="q-mb-md">
        <div class="text-subtitle1 q-mb-sm">{{ $t('reports.yieldHistory') }}</div>
        <q-card flat bordered>
          <q-markup-table flat separator="horizontal" dense>
            <thead>
              <tr>
                <th class="text-left">{{ $t('reports.date') }}</th>
                <th class="text-right">{{ $t('reports.milk') }}</th>
                <th class="text-right">{{ $t('reports.fatPct') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in reportData.yield_history" :key="idx">
                <td>{{ row.date }}</td>
                <td class="text-right text-weight-medium">{{ row.milk_liters?.toFixed(1) }} L</td>
                <td class="text-right">{{ row.fat_pct != null && row.fat_pct !== '' ? `${row.fat_pct}%` : '—' }}</td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card>
      </div>

      <!-- Actions -->
      <div class="row q-gutter-sm q-mb-md">
        <q-btn
          :label="$t('reports.downloadReport')"
          icon="download"
          color="primary"
          class="col"
          unelevated
          @click="downloadReport"
        />
        <q-btn
          :label="$t('reports.shareReport')"
          icon="share"
          outline
          color="primary"
          class="col"
          @click="showShareSheet = true"
        />
      </div>

      <!-- Share Bottom Sheet -->
      <q-dialog v-model="showShareSheet" position="bottom">
        <q-card class="dialog-card">
          <q-card-section>
            <div class="text-h6">{{ $t('reports.shareReport') }}</div>
          </q-card-section>
          <q-list>
            <q-item v-close-popup clickable @click="shareReportViaWhatsApp">
              <q-item-section avatar>
                <q-icon name="chat" color="green" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ $t('reports.shareViaWhatsApp') }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-close-popup clickable @click="shareReportViaOther">
              <q-item-section avatar>
                <q-icon name="share" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ $t('reports.shareViaOther') }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </q-dialog>
    </template>

    <template v-else>
      <EmptyState
        icon="error_outline"
        icon-color="negative"
        :title="$t('reports.notFound')"
        :description="$t('reports.notFoundDescription')"
        :action-label="$t('reports.goBack')"
        @action="router.back()"
      />
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from 'src/lib/api';
import { useDateFormat } from 'src/composables/useDateFormat';
import { useExport } from 'src/composables/useExport';
import { useCurrency } from 'src/composables/useCurrency';
import SkeletonCard from 'src/components/ui/SkeletonCard.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';

interface ReportFeed {
  feed_name: string;
  amount_kg: number;
  cost: number;
  price_per_kg?: number;
}

interface NutrientRow {
  parameter: string;
  requirement: number;
  supply: number;
  unit: string;
}

interface YieldRow {
  date: string;
  milk_liters: number;
  fat_pct: number | string;
}

interface ReportData {
  farmer_name: string;
  farmer_location?: string;
  cow_name?: string;
  cow_details?: string;
  diet_name?: string;
  diet_feeds?: ReportFeed[];
  nutrient_balance?: NutrientRow[];
  total_dm_kg?: number;
  total_cost_daily?: number;
  yield_history?: YieldRow[];
  generated_at: string;
}

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { formatDate } = useDateFormat();
const { shareContent, shareViaWhatsApp } = useExport();
const { formatCurrency, formatCurrencyWhole, getCurrencySymbol } = useCurrency();

/** Format currency with up to 2 decimal places (not rounded to whole) */
const formatCurrencyValue = (amount: number) => formatCurrency(amount);

/** Format nutrient values smartly: use more decimals for small values */
function formatNutrientValue(val: number | null | undefined): string {
  if (val == null) return '—';
  if (val === 0) return '0';
  if (Math.abs(val) < 0.1) return val.toFixed(2);
  if (Math.abs(val) < 1) return val.toFixed(1);
  return val.toFixed(1);
}

const reportId = computed(() => route.params.id as string);
const reportData = ref<ReportData | null>(null);
const downloadUrl = ref<string | null>(null);
const loading = ref(true);
const showShareSheet = ref(false);

async function downloadReport() {
  try {
    const resp = await api.get(`/api/v1/reports/${reportId.value}/download`, {
      responseType: 'text',
    });
    const html = resp.data as string;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch {
    // silent
  }
}

function buildReportSummaryText(): string {
  if (!reportData.value) return '';
  const r = reportData.value;
  let text = `${t('reports.dietReport')}\n`;
  text += `${r.farmer_name}\n`;
  if (r.farmer_location) text += `${r.farmer_location}\n`;
  if (r.cow_name) text += `\n${t('reports.cowDetails')}: ${r.cow_name} ${r.cow_details || ''}\n`;
  if (r.diet_feeds?.length) {
    text += `\n${t('reports.recommendedDiet')}:\n`;
    for (const feed of r.diet_feeds) {
      text += `  ${feed.feed_name}: ${feed.amount_kg?.toFixed(2)} kg\n`;
    }
  }
  if (r.total_cost_daily) text += `\n${t('reports.dailyCost')}: ${getCurrencySymbol()}${Math.round(r.total_cost_daily)}`;
  if (r.total_dm_kg) text += `\n${t('reports.dmIntake')}: ${r.total_dm_kg} kg`;
  text += `\n\n${t('export.generatedBy')}`;
  return text;
}

function shareReportViaWhatsApp() {
  shareViaWhatsApp(buildReportSummaryText());
}

async function shareReportViaOther() {
  await shareContent(t('reports.shareReport'), buildReportSummaryText());
}

onMounted(async () => {
  loading.value = true;

  try {
    const response = await api.get(`/api/v1/reports/${reportId.value}`);
    const data = response.data;

    // The detail endpoint now returns report_data with structured content
    if (data.report_data) {
      reportData.value = data.report_data as ReportData;
    } else {
      // Fallback for old reports without report_data
      reportData.value = {
        farmer_name: data.farmer_name || data.report_type,
        generated_at: data.generated_at,
      };
    }

    downloadUrl.value = data.download_url;
  } catch {
    reportData.value = null;
  }

  loading.value = false;
});
</script>
