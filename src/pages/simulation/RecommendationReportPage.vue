<template>
  <q-page class="q-pa-md">
    <!-- No result -->
    <template v-if="!result">
      <div class="text-center q-pa-xl">
        <q-icon name="auto_fix_high" size="64px" color="grey-4" />
        <div class="text-body1 text-grey-6 q-mt-md">{{ $t('simulation.recommendation.noData') }}</div>
        <q-btn flat color="primary" :label="$t('common.back')" icon="arrow_back" class="q-mt-md" @click="router.back()" />
      </div>
    </template>

    <template v-else>
      <!-- Simulation Name -->
      <div v-if="store.simulationName" class="text-h6 text-weight-medium q-mb-md">
        {{ store.simulationName }}
      </div>

      <!-- Animal Summary -->
      <AnimalCharacteristicsSummary :cattle-info="store.cattleInfo" />

      <!-- Infeasible diet banner -->
      <q-card v-if="isInfeasible" flat bordered class="q-mb-md rounded-borders bg-orange-1">
        <q-card-section class="text-center q-pa-lg">
          <q-icon name="warning_amber" size="48px" color="warning" />
          <div class="text-h6 q-mt-sm">{{ $t('simulation.recommendation.infeasible') }}</div>
          <div class="text-body2 text-grey-7 q-mt-xs">{{ $t('simulation.recommendation.infeasibleDetail') }}</div>
          <div class="text-body2 text-grey-8 q-mt-sm text-weight-medium">{{ $t('simulation.recommendation.infeasibleHint') }}</div>
          <q-btn
            :label="$t('simulation.recommendation.tryAgain')"
            color="warning"
            text-color="white"
            class="q-mt-md action-btn"
            unelevated
            no-caps
            icon="swap_horiz"
            @click="goToFeedSelection"
          />
        </q-card-section>
      </q-card>

      <!-- Valid result content -->
      <template v-if="!isInfeasible">
        <!-- Overall Status -->
        <q-card v-if="solutionStatus && solutionStatus !== 'UNKNOWN'" flat bordered class="q-mb-md rounded-borders">
          <q-card-section>
            <div class="text-subtitle2 q-mb-xs">{{ $t('simulation.evaluation.overallStatus') }}</div>
            <q-chip
              :color="statusColor(solutionStatus)"
              text-color="white"
              :label="translateStatus(solutionStatus)"
            />
            <div v-if="confidenceLevel" class="text-caption text-grey-6 q-mt-xs">{{ confidenceLevel }}</div>
          </q-card-section>
        </q-card>

        <!-- Milk Production Analysis -->
        <q-card v-if="milkAnalysis" flat bordered class="q-mb-md rounded-borders">
          <q-card-section>
            <div class="text-subtitle2 q-mb-sm">{{ $t('simulation.evaluation.milkAnalysis') }}</div>
            <q-list dense separator>
              <q-item v-if="milkAnalysis.target_milk">
                <q-item-section>{{ $t('simulation.evaluation.targetMilk') }}</q-item-section>
                <q-item-section side class="text-weight-medium">{{ formatNum(milkAnalysis.target_milk) }} {{ $t('common.units.litersPerDay') }}</q-item-section>
              </q-item>
              <q-item v-if="milkAnalysis.supported_by_energy">
                <q-item-section>{{ $t('simulation.evaluation.supportedByEnergy') }}</q-item-section>
                <q-item-section side class="text-weight-medium">{{ formatNum(milkAnalysis.supported_by_energy) }} {{ $t('common.units.litersPerDay') }}</q-item-section>
              </q-item>
              <q-item v-if="milkAnalysis.supported_by_protein">
                <q-item-section>{{ $t('simulation.evaluation.supportedByProtein') }}</q-item-section>
                <q-item-section side class="text-weight-medium">{{ formatNum(milkAnalysis.supported_by_protein) }} {{ $t('common.units.litersPerDay') }}</q-item-section>
              </q-item>
              <q-item v-if="milkAnalysis.limiting_nutrient">
                <q-item-section>{{ $t('simulation.evaluation.limitingNutrient') }}</q-item-section>
                <q-item-section side class="text-weight-medium">{{ friendlyNutrient(milkAnalysis.limiting_nutrient) }}</q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Solution Summary -->
        <q-card v-if="solutionData" flat bordered class="q-mb-md rounded-borders">
          <q-card-section>
            <div class="text-subtitle2 q-mb-sm">{{ $t('simulation.recommendation.solutionSummary') }}</div>
            <div class="row q-gutter-md">
              <div class="col text-center">
                <div class="text-h5 text-weight-bold">{{ formatCurrency(solutionData.total_cost ?? totalCost ?? 0) }}</div>
                <div class="text-caption text-grey-6">{{ $t('simulation.recommendation.dailyCost') }}</div>
              </div>
              <div v-if="solutionData.dm_intake" class="col text-center">
                <div class="text-h5 text-weight-bold">{{ formatNum(solutionData.dm_intake) }} {{ $t('common.units.kg') }}</div>
                <div class="text-caption text-grey-6">{{ $t('simulation.recommendation.dmIntake') }}</div>
              </div>
              <div v-if="solutionData.milk_production" class="col text-center">
                <div class="text-h5 text-weight-bold">{{ formatNum(solutionData.milk_production) }} {{ $t('common.units.liters') }}</div>
                <div class="text-caption text-grey-6">{{ $t('simulation.recommendation.milkProduction') }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Feed Breakdown -->
        <CostBreakdownTable v-if="feedBreakdown.length > 0" :feeds="feedBreakdown" />

        <!-- Methane -->
        <MethaneMetrics :data="methaneData" />

        <!-- Nutrient Balance -->
        <q-card v-if="nutrientBalance && Object.keys(nutrientBalance).length > 0" flat bordered class="q-mb-md rounded-borders">
          <q-card-section>
            <div class="text-subtitle2 q-mb-sm">{{ $t('simulation.evaluation.nutrientBalance') }}</div>
            <div class="nutrient-table">
              <div class="nutrient-row nutrient-header">
                <div class="nutrient-col nutrient-name">{{ $t('simulation.evaluation.nutrient', 'Nutrient') }}</div>
                <div class="nutrient-col nutrient-balance">{{ $t('simulation.evaluation.balance', 'Balance') }}</div>
                <div class="nutrient-col nutrient-status">{{ $t('simulation.evaluation.statusLabel', 'Status') }}</div>
              </div>
              <div v-for="(val, key) in nutrientBalance" :key="String(key)" class="nutrient-row">
                <div class="nutrient-col nutrient-name">{{ friendlyNutrient(String(key)) }}</div>
                <div class="nutrient-col nutrient-balance text-weight-medium">{{ getNutrientValue(val as NutrientBalanceEntry) }}</div>
                <div class="nutrient-col nutrient-status">
                  <q-badge
                    :color="getNutrientColor(val as NutrientBalanceEntry)"
                    :label="getNutrientStatus(val as NutrientBalanceEntry)"
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Warnings -->
        <q-card v-if="warnings.length > 0" flat bordered class="q-mb-md rounded-borders">
          <q-card-section>
            <div class="text-subtitle2 q-mb-sm text-warning">{{ $t('simulation.recommendation.warnings') }}</div>
            <q-list dense>
              <q-item v-for="(w, i) in warnings" :key="i">
                <q-item-section avatar>
                  <q-icon name="warning" color="warning" size="sm" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body2">{{ w }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Recommendations -->
        <q-card v-if="recommendations.length > 0" flat bordered class="q-mb-md rounded-borders">
          <q-card-section>
            <div class="text-subtitle2 q-mb-sm text-positive">{{ $t('simulation.recommendation.recommendations') }}</div>
            <q-list dense>
              <q-item v-for="(r, i) in recommendations" :key="i">
                <q-item-section avatar>
                  <q-icon name="lightbulb" color="positive" size="sm" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body2">{{ r }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </template>

      <!-- Spacer for sticky bottom bar -->
      <div style="height: 72px;" class="print-hide" />

      <!-- Report Info (subtle, at bottom) -->
      <div v-if="reportId || simulationId" class="q-mt-lg text-center text-caption text-grey-5">
        <span v-if="reportId">{{ $t('simulation.recommendation.reportId') }}: {{ reportId }}</span>
        <span v-if="reportId && simulationId" class="q-mx-xs">·</span>
        <span v-if="simulationId">{{ $t('simulation.recommendation.simulationId') }}: {{ simulationId }}</span>
      </div>

      <!-- Sticky Bottom Action Bar -->
      <div class="report-action-bar print-hide">
        <q-btn
          outline
          color="primary"
          icon="add"
          :label="$t('simulation.newCase')"
          no-caps
          class="col action-btn"
          @click="newCase"
        />
        <q-btn
          color="primary"
          icon="download"
          :label="$t('simulation.recommendation.saveReport')"
          no-caps
          unelevated
          class="col action-btn"
          @click="onSaveReport"
        />
      </div>

      <!-- Save Report Success Dialog -->
      <q-dialog v-model="showSaveDialog">
        <q-card class="save-dialog text-center q-pa-md">
          <q-icon name="check_circle" color="positive" size="56px" />
          <div class="text-h6 q-mt-md">{{ $t('simulation.recommendation.reportSaved') }}</div>
          <div class="text-body2 text-grey-7 q-mt-sm">
            {{ $t('simulation.recommendation.reportSavedDesc', 'Your report has been saved. You can find it under Feed Reports in the Navigation Panel. Would you like to share it?') }}
          </div>
          <div class="text-subtitle2 text-grey-6 q-mt-md">{{ $t('simulation.recommendation.sharePrompt', 'SHARE THIS REPORT?') }}</div>
          <div class="q-mt-md q-gutter-sm">
            <q-btn
              color="primary"
              icon="share"
              :label="$t('simulation.recommendation.yesShare', 'Yes, Share')"
              no-caps
              unelevated
              class="full-width action-btn"
              @click="onShareFromDialog"
            />
            <q-btn
              outline
              color="primary"
              :label="$t('simulation.recommendation.noDone', 'No, Done')"
              no-caps
              class="full-width action-btn"
              v-close-popup
            />
          </div>
        </q-card>
      </q-dialog>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useSimulationStore, type NutrientBalanceEntry } from 'src/stores/simulation';
import { useCurrency } from 'src/composables/useCurrency';
import { useReportShare } from 'src/composables/useReportShare';
import AnimalCharacteristicsSummary from 'src/components/simulation/AnimalCharacteristicsSummary.vue';
import CostBreakdownTable from 'src/components/simulation/CostBreakdownTable.vue';
import MethaneMetrics from 'src/components/simulation/MethaneMetrics.vue';

const router = useRouter();
const { t } = useI18n();
const store = useSimulationStore();
const { formatCurrency } = useCurrency();
const { shareReport } = useReportShare();
const showSaveDialog = ref(false);

onMounted(() => {
  if (!store.recommendationResult) {
    router.replace('/');
  }
});

const result = computed(() => store.recommendationResult);

const reportId = computed(() => result.value?.report_id ?? '');
const simulationId = computed(() => result.value?.simulation_id ?? '');
const totalCost = computed(() => result.value?.total_cost ?? 0);
const solutionStatus = computed(() => result.value?.solution_status ?? '');
const confidenceLevel = computed(() => result.value?.confidence_level ?? '');

// The backend returns is_valid: false with empty least_cost_diet when no feasible diet exists
const isInfeasible = computed(() => {
  if (!result.value) return false;
  return result.value.is_valid === false && feedBreakdown.value.length === 0;
});
const methaneData = computed(() => result.value?.methane_emissions ?? null);
const warnings = computed(() => {
  const w = result.value?.warnings;
  return Array.isArray(w) ? w : [];
});
const recommendations = computed(() => {
  const r = result.value?.recommendations;
  return Array.isArray(r) ? r : [];
});

const solutionData = computed(() => {
  const ds = result.value?.diet_summary;
  const dsd = result.value?.diet_summary_detailed;
  return {
    total_cost: dsd?.total_cost ?? ds?.total_cost ?? totalCost.value,
    dm_intake: dsd?.total_dm ?? ds?.total_dm_intake ?? null,
    milk_production: result.value?.animal_requirements?.milk_production ?? null,
  };
});

const feedBreakdown = computed(() => {
  const dsd = result.value?.diet_summary_detailed;
  if (dsd?.selected_feeds && Array.isArray(dsd.selected_feeds)) {
    return dsd.selected_feeds;
  }
  const ds = result.value?.diet_summary;
  if (ds?.selected_feeds && Array.isArray(ds.selected_feeds)) return ds.selected_feeds;
  return [];
});

const nutrientBalance = computed(() => result.value?.nutrient_balance ?? null);
const milkAnalysis = computed(() => result.value?.milk_production_analysis ?? null);

function formatNum(val: unknown): string {
  return val != null ? Number(val).toFixed(1) : '–';
}

function friendlyNutrient(key: string): string {
  const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/__+/g, '_').replace(/^_|_$/g, '');
  const i18nKey = `simulation.nutrientLabels.${normalized}`;
  const translated = t(i18nKey);
  if (translated !== i18nKey) return translated;
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusColor(status: string): string {
  const s = (status || '').toLowerCase();
  if (s.includes('optimal') || s.includes('perfect') || s.includes('good') || s.includes('adequate') || s.includes('met')) return 'positive';
  if (s.includes('marginal') || s.includes('close') || s.includes('warning')) return 'warning';
  return 'negative';
}

function translateStatus(status: string): string {
  const s = (status || '').toLowerCase();
  if (s.includes('optimal')) return t('simulation.status.optimal');
  if (s.includes('perfect')) return t('simulation.status.perfect');
  if (s.includes('good')) return t('simulation.status.good');
  if (s.includes('adequate')) return t('simulation.status.adequate');
  if (s.includes('marginal')) return t('simulation.status.marginal');
  if (s.includes('deficient')) return t('simulation.status.deficient');
  if (s.includes('excess')) return t('simulation.status.excess');
  return status;
}

function getNutrientColor(val: NutrientBalanceEntry): string {
  const status = String(val?.status || '').toLowerCase();
  if (status.includes('adequate') || status.includes('met')) return 'positive';
  if (status.includes('marginal') || status.includes('close')) return 'warning';
  if (status.includes('deficient') || status.includes('excess')) return 'negative';
  return 'grey';
}

function getNutrientStatus(val: NutrientBalanceEntry): string {
  const raw = String(val?.status || val?.balance || '–');
  return translateStatus(raw);
}

function getNutrientValue(val: NutrientBalanceEntry): string {
  if (val?.balance != null) return String(val.balance);
  if (val?.value != null) return String(val.value);
  if (val?.supplied != null && val?.required != null) return `${val.supplied} / ${val.required}`;
  return '–';
}

function goToFeedSelection() {
  router.push('/feed-selection');
}

function rerunSimulation() {
  // Data is already in the store from viewSimulationReport; navigate to cattle-info to tweak
  store.newSimulationId();
  router.push('/cattle-info');
}

function newCase() {
  store.newCaseFromPrevious();
  router.push('/cattle-info');
}

function onSaveReport() {
  showSaveDialog.value = true;
}

function onShareFromDialog() {
  showSaveDialog.value = false;
  void shareReport({
    title: t('simulation.recommendation.title'),
    simulationName: store.simulationName || undefined,
    totalCost: solutionData.value.total_cost ?? undefined,
    dmIntake: solutionData.value.dm_intake ?? undefined,
    milkProduction: solutionData.value.milk_production ?? undefined,
    feeds: feedBreakdown.value,
    warnings: warnings.value,
    recommendations: recommendations.value,
    reportId: reportId.value || undefined,
    simulationId: simulationId.value || undefined,
  });
}
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: $radius-loose;
  overflow: hidden;
}

.action-btn {
  border-radius: $radius-loose;
  font-size: 1rem;
  padding-top: 12px;
  padding-bottom: 12px;
}

.report-action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 12px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: var(--q-background, #fff);
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  z-index: 10;

  .body--dark & {
    background: var(--q-dark-page, #121212);
    border-top-color: rgba(255, 255, 255, 0.1);
  }
}

.save-dialog {
  border-radius: 16px;
  min-width: 300px;
  max-width: 400px;
}

.nutrient-table {
  width: 100%;
}

.nutrient-row {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  .body--dark & {
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }
}

.nutrient-header {
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: rgba(0, 0, 0, 0.5);

  .body--dark & {
    color: rgba(255, 255, 255, 0.5);
  }
}

.nutrient-col {
  &.nutrient-name { flex: 1; }
  &.nutrient-balance { width: 80px; text-align: right; padding-right: 12px; font-size: 0.85rem; }
  &.nutrient-status { width: 90px; text-align: center; }
}
</style>
