<template>
  <q-page class="q-pa-md">
    <!-- No result -->
    <template v-if="!result">
      <div class="text-center q-pa-xl">
        <q-icon name="assessment" size="64px" color="grey-4" />
        <div class="text-body1 text-grey-6 q-mt-md">{{ $t('simulation.evaluation.noData') }}</div>
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

      <!-- Overall Status -->
      <q-card v-if="evalSummary" flat bordered class="q-mb-md rounded-borders">
        <q-card-section>
          <div class="text-subtitle2 q-mb-xs">{{ $t('simulation.evaluation.overallStatus') }}</div>
          <q-chip
            :color="statusColor(evalSummary.overall_status)"
            text-color="white"
            :label="translateStatus(evalSummary.overall_status)"
          />
          <div v-if="evalSummary.limiting_factor" class="text-caption text-grey-6 q-mt-xs">
            {{ $t('simulation.evaluation.limitingNutrient') }}: {{ friendlyNutrient(evalSummary.limiting_factor) }}
          </div>
        </q-card-section>
      </q-card>

      <!-- Milk Production Analysis -->
      <q-card v-if="milkAnalysis" flat bordered class="q-mb-md rounded-borders">
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">{{ $t('simulation.evaluation.milkAnalysis') }}</div>
          <q-list dense separator>
            <q-item>
              <q-item-section>{{ $t('simulation.evaluation.targetMilk') }}</q-item-section>
              <q-item-section side class="text-weight-medium">{{ formatNum(milkAnalysis.target_milk) }} {{ $t('common.units.litersPerDay') }}</q-item-section>
            </q-item>
            <q-item>
              <q-item-section>{{ $t('simulation.evaluation.supportedByEnergy') }}</q-item-section>
              <q-item-section side class="text-weight-medium">{{ formatNum(milkAnalysis.supported_by_energy) }} {{ $t('common.units.litersPerDay') }}</q-item-section>
            </q-item>
            <q-item>
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

      <!-- Cost Analysis -->
      <q-card v-if="costAnalysis" flat bordered class="q-mb-md rounded-borders">
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">{{ $t('simulation.evaluation.costAnalysis') }}</div>
          <div class="row q-gutter-md">
            <div class="col text-center">
              <div class="text-h5 text-weight-bold">{{ formatCurrency(costAnalysis.total_cost ?? 0) }}</div>
              <div class="text-caption text-grey-6">{{ $t('simulation.evaluation.totalCost') }}</div>
            </div>
            <div v-if="costAnalysis.cost_per_kg_milk" class="col text-center">
              <div class="text-h5 text-weight-bold">{{ formatCurrency(costAnalysis.cost_per_kg_milk) }}</div>
              <div class="text-caption text-grey-6">{{ $t('simulation.evaluation.costPerKgMilk') }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Feed Breakdown -->
      <CostBreakdownTable v-if="feedBreakdown.length > 0" :feeds="feedBreakdown" />

      <!-- Methane -->
      <MethaneMetrics :data="methaneData" />

      <!-- Nutrient Balance -->
      <q-card v-if="nutrientBalance" flat bordered class="q-mb-md rounded-borders">
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

      <!-- Spacer for sticky bottom bar -->
      <div style="height: 72px;" class="print-hide" />

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

    <!-- Generate Recommendation Dialog -->
    <q-dialog v-model="showRecDialog">
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">{{ $t('simulation.evaluation.generateRecommendation') }}</div>
          <div class="text-caption text-grey-6 q-mt-xs">{{ $t('simulation.evaluation.generateRecommendationDesc') }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-toggle v-model="useCustomMilk" :label="$t('simulation.evaluation.milkOverride')" />
          <q-input
            v-if="useCustomMilk"
            v-model.number="milkOverride"
            :label="$t('simulation.evaluation.milkOverride')"
            type="number"
            outlined
            dense
            class="q-mt-sm"
            :hint="$t('simulation.evaluation.milkOverrideHint')"
            :rules="[
              (v: number) => v >= 1 || $t('simulation.validation.milkOverrideMin'),
              (v: number) => v <= 60 || $t('simulation.validation.milkOverrideMax'),
            ]"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat v-close-popup :label="$t('common.cancel')" />
          <q-btn
            color="primary"
            flat
            :label="$t('simulation.evaluation.generateRecommendation')"
            :loading="store.recommending"
            @click="onGenerateRecommendation"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Generating Overlay -->
    <q-dialog v-model="showGenerating" persistent>
      <q-card class="text-center q-pa-lg" style="min-width: 280px" aria-live="polite">
        <q-spinner-gears size="48px" color="primary" />
        <div class="text-body1 q-mt-md">{{ $t('simulation.generating') }}</div>
        <div class="text-caption text-grey-6 q-mt-xs">{{ $t('simulation.generatingDesc') }}</div>
        <q-btn flat no-caps color="grey-7" :label="$t('common.cancel')" class="q-mt-md" @click="showGenerating = false" />
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useSimulationStore, type NutrientBalanceEntry } from 'src/stores/simulation';
import { useCurrency } from 'src/composables/useCurrency';
import { useReportShare } from 'src/composables/useReportShare';
import AnimalCharacteristicsSummary from 'src/components/simulation/AnimalCharacteristicsSummary.vue';
import CostBreakdownTable from 'src/components/simulation/CostBreakdownTable.vue';
import MethaneMetrics from 'src/components/simulation/MethaneMetrics.vue';

const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();
const store = useSimulationStore();
const { formatCurrency } = useCurrency();
const { shareReport } = useReportShare();

const showRecDialog = ref(false);
const showGenerating = ref(false);
const showSaveDialog = ref(false);
const useCustomMilk = ref(false);
const milkOverride = ref(store.cattleInfo.milk_production);

onMounted(() => {
  if (!store.evaluationResult) {
    router.replace('/');
  }
});

const result = computed(() => store.evaluationResult);
const evalSummary = computed(() => result.value?.evaluation_summary ?? null);
const milkAnalysis = computed(() => result.value?.milk_production_analysis ?? null);
const costAnalysis = computed(() => result.value?.cost_analysis ?? null);
const methaneData = computed(() => result.value?.methane_analysis ?? null);
const nutrientBalance = computed(() => result.value?.nutrient_balance ?? null);
const feedBreakdown = computed(() => {
  const fb = result.value?.feed_breakdown;
  return Array.isArray(fb) ? fb : [];
});

function formatNum(val: unknown): string {
  return val != null ? Number(val).toFixed(1) : '–';
}

function friendlyNutrient(key: string): string {
  // Try i18n lookup first, then title-case fallback
  const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/__+/g, '_').replace(/^_|_$/g, '');
  const i18nKey = `simulation.nutrientLabels.${normalized}`;
  const translated = t(i18nKey);
  if (translated !== i18nKey) return translated;
  // Fallback: title-case the raw key
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusColor(status: string): string {
  const s = (status || '').toLowerCase();
  if (s.includes('adequate') || s.includes('met') || s.includes('good')) return 'positive';
  if (s.includes('marginal') || s.includes('close') || s.includes('warning')) return 'warning';
  return 'negative';
}

function translateStatus(status: string): string {
  const s = (status || '').toLowerCase();
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

async function onGenerateRecommendation() {
  showRecDialog.value = false;
  showGenerating.value = true;
  try {
    const milk = useCustomMilk.value ? milkOverride.value : undefined;
    const ok = await store.generateRecommendation(milk);
    if (ok) {
      router.push('/recommendation-report');
    } else if (store.error) {
      $q.notify({ type: 'negative', message: store.error });
    }
  } catch {
    $q.notify({ type: 'negative', message: t('errors.generic') });
  } finally {
    showGenerating.value = false;
  }
}

function rerunSimulation() {
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
    title: t('simulation.evaluation.title'),
    simulationName: store.simulationName || undefined,
    totalCost: costAnalysis.value?.total_cost ?? undefined,
    milkProduction: milkAnalysis.value?.target_milk ?? undefined,
    feeds: feedBreakdown.value,
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
