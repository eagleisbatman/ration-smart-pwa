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

        <!-- Diet Status -->
        <StatusCard
          v-if="solutionStatus && solutionStatus !== 'UNKNOWN'"
          :status="solutionStatus"
          :message="confidenceLevel"
        />

        <!-- Methane -->
        <MethaneMetrics :data="methaneData" />

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

      <!-- Actions -->
      <div class="q-gutter-sm q-mt-lg">
        <q-btn
          :label="$t('simulation.newCase')"
          color="primary"
          class="full-width action-btn"
          unelevated
          no-caps
          icon="add"
          @click="newCase"
        />
      </div>

      <!-- Report Info (subtle, at bottom) -->
      <div v-if="reportId || simulationId" class="q-mt-lg text-center text-caption text-grey-5">
        <span v-if="reportId">{{ $t('simulation.recommendation.reportId') }}: {{ reportId }}</span>
        <span v-if="reportId && simulationId" class="q-mx-xs">·</span>
        <span v-if="simulationId">{{ $t('simulation.recommendation.simulationId') }}: {{ simulationId }}</span>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useSimulationStore } from 'src/stores/simulation';
import { useCurrency } from 'src/composables/useCurrency';
import AnimalCharacteristicsSummary from 'src/components/simulation/AnimalCharacteristicsSummary.vue';
import CostBreakdownTable from 'src/components/simulation/CostBreakdownTable.vue';
import MethaneMetrics from 'src/components/simulation/MethaneMetrics.vue';
import StatusCard from 'src/components/simulation/StatusCard.vue';

const router = useRouter();
const store = useSimulationStore();
const { formatCurrency } = useCurrency();

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

function formatNum(val: unknown): string {
  return val != null ? Number(val).toFixed(1) : '–';
}

function goToFeedSelection() {
  router.push('/feed-selection');
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
