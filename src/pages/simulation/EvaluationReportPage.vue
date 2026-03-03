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
            {{ $t('simulation.evaluation.limitingNutrient') }}: {{ evalSummary.limiting_factor }}
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
              <q-item-section side class="text-weight-medium">{{ formatNutrientLabel(milkAnalysis.limiting_nutrient) }}</q-item-section>
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
          <q-list dense separator>
            <q-item v-for="(val, key) in nutrientBalance" :key="String(key)">
              <q-item-section>{{ formatNutrientLabel(String(key)) }}</q-item-section>
              <q-item-section side>
                <q-badge
                  :color="getNutrientColor(val as NutrientBalanceEntry)"
                  :label="getNutrientStatus(val as NutrientBalanceEntry)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>

      <!-- Actions -->
      <div class="q-gutter-sm q-mt-lg">
        <q-btn
          :label="$t('simulation.evaluation.generateRecommendation')"
          color="primary"
          class="full-width action-btn"
          unelevated
          no-caps
          icon="auto_fix_high"
          @click="showRecDialog = true"
        />
        <q-btn
          :label="$t('simulation.newCase')"
          color="grey-7"
          flat
          class="full-width"
          no-caps
          icon="add"
          @click="newCase"
        />
      </div>
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
      <q-card class="text-center q-pa-lg" style="min-width: 280px">
        <q-spinner-gears size="48px" color="primary" />
        <div class="text-body1 q-mt-md">{{ $t('simulation.generating') }}</div>
        <div class="text-caption text-grey-6 q-mt-xs">{{ $t('simulation.generatingDesc') }}</div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useSimulationStore, type NutrientBalanceEntry } from 'src/stores/simulation';
import { useCurrency } from 'src/composables/useCurrency';
import AnimalCharacteristicsSummary from 'src/components/simulation/AnimalCharacteristicsSummary.vue';
import CostBreakdownTable from 'src/components/simulation/CostBreakdownTable.vue';
import MethaneMetrics from 'src/components/simulation/MethaneMetrics.vue';

const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();
const store = useSimulationStore();
const { formatCurrency } = useCurrency();

const showRecDialog = ref(false);
const showGenerating = ref(false);
const useCustomMilk = ref(false);
const milkOverride = ref(store.cattleInfo.milk_production);

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

function formatNutrientLabel(key: string): string {
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
  return String(val?.status || val?.balance || '–');
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

function newCase() {
  store.resetForm();
  router.push('/');
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
</style>
