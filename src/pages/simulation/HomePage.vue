<template>
  <q-page class="q-pa-md">
    <!-- Greeting -->
    <div class="q-mb-lg">
      <div class="text-h5 text-weight-medium">
        {{ $t('simulation.home.welcome', { name: userName }) }}
      </div>
      <div class="text-caption text-grey-6">{{ greeting }}</div>
    </div>

    <!-- Action Card: Start New Simulation -->
    <q-card
      flat
      class="q-mb-lg action-card cursor-pointer bg-primary text-white"
      v-ripple
      @click="startNewSimulation"
    >
      <q-card-section horizontal>
        <q-card-section class="col">
          <div class="text-subtitle1 text-weight-medium">
            {{ $t('simulation.home.startSimulation') }}
          </div>
          <div class="text-caption q-mt-xs" style="opacity: 0.8">
            {{ $t('simulation.home.startSimulationDesc') }}
          </div>
        </q-card-section>
        <q-card-section class="col-auto flex flex-center q-pr-md">
          <q-btn round flat text-color="white" icon="arrow_forward" size="lg" />
        </q-card-section>
      </q-card-section>
    </q-card>

    <!-- Loading -->
    <template v-if="loading">
      <q-skeleton v-for="i in 3" :key="i" height="72px" class="q-mb-sm rounded-borders" />
    </template>

    <!-- Error State -->
    <template v-else-if="store.error">
      <q-card flat bordered class="rounded-borders">
        <q-card-section class="text-center q-pa-lg">
          <q-icon name="cloud_off" size="48px" color="negative" />
          <div class="text-body2 text-negative q-mt-sm">{{ store.error }}</div>
          <q-btn flat no-caps color="primary" :label="$t('common.retry')" class="q-mt-sm" @click="retryFetch" />
        </q-card-section>
      </q-card>
    </template>

    <!-- Empty State (no simulations at all) -->
    <template v-else-if="store.simulationHistory.length === 0">
      <q-card flat bordered class="rounded-borders">
        <q-card-section class="text-center q-pa-lg">
          <q-icon name="science" size="56px" color="grey-4" />
          <div class="text-body1 text-grey-6 q-mt-md">
            {{ $t('simulation.home.noSimulations') }}
          </div>
          <div class="text-caption text-grey-5">
            {{ $t('simulation.home.noSimulationsDesc') }}
          </div>
        </q-card-section>
      </q-card>
    </template>

    <!-- Categorized Simulation Lists -->
    <template v-else>
      <!-- Recommendations Section -->
      <div class="q-mb-sm row items-center justify-between">
        <div class="text-subtitle1 text-weight-medium">
          {{ $t('simulation.home.recommendations') }}
          <q-badge v-if="recentRecs.length" color="primary" :label="recentRecs.length" class="q-ml-xs" />
        </div>
        <q-btn
          v-if="allRecs.length > RECENT_LIMIT"
          flat dense no-caps color="primary"
          :label="$t('simulation.home.viewAll')"
          @click="router.push({ path: '/diet-history', query: { tab: 'rec' } })"
        />
      </div>

      <template v-if="recentRecs.length > 0">
        <q-card flat bordered class="q-mb-lg rounded-borders">
          <q-list separator>
            <q-item
              v-for="item in recentRecs"
              :key="item.report_id"
              v-ripple clickable
              :disable="restoring"
              @click="onViewReport(item.report_id)"
            >
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white" size="40px">
                  <q-icon name="auto_fix_high" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="row items-center no-wrap">
                  <span>{{ reportLabel(item) }}</span>
                  <q-badge v-if="isInfeasible(item)" color="negative" :label="$t('simulation.status.failed')" class="q-ml-sm" />
                  <q-badge v-else-if="item.solution_status" color="positive" :label="$t('simulation.status.success')" class="q-ml-sm" />
                </q-item-label>
                <q-item-label caption>
                  {{ item.cattle_summary?.breed || '–' }}
                  · {{ item.cattle_summary?.body_weight ?? '–' }}{{ $t('common.units.kg') }}
                  · {{ item.cattle_summary?.milk_production ?? '–' }}{{ $t('common.units.litersPerDay') }}
                </q-item-label>
                <q-item-label caption class="text-grey-5">{{ formatDate(item.created_at) }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" color="grey-5" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </template>
      <div v-else class="text-caption text-grey-5 q-mb-lg">{{ $t('simulation.home.noRecommendationsYet') }}</div>

      <!-- Evaluations Section -->
      <div class="q-mb-sm row items-center justify-between">
        <div class="text-subtitle1 text-weight-medium">
          {{ $t('simulation.home.evaluations') }}
          <q-badge v-if="recentEvals.length" color="secondary" :label="recentEvals.length" class="q-ml-xs" />
        </div>
        <q-btn
          v-if="allEvals.length > RECENT_LIMIT"
          flat dense no-caps color="primary"
          :label="$t('simulation.home.viewAll')"
          @click="router.push({ path: '/diet-history', query: { tab: 'eval' } })"
        />
      </div>

      <template v-if="recentEvals.length > 0">
        <q-card flat bordered class="rounded-borders">
          <q-list separator>
            <q-item
              v-for="item in recentEvals"
              :key="item.report_id"
              v-ripple clickable
              :disable="restoring"
              @click="onViewReport(item.report_id)"
            >
              <q-item-section avatar>
                <q-avatar color="secondary" text-color="white" size="40px">
                  <q-icon name="assessment" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="row items-center no-wrap">
                  <span>{{ reportLabel(item) }}</span>
                </q-item-label>
                <q-item-label caption>
                  {{ item.cattle_summary?.breed || '–' }}
                  · {{ item.cattle_summary?.body_weight ?? '–' }}{{ $t('common.units.kg') }}
                  · {{ item.cattle_summary?.milk_production ?? '–' }}{{ $t('common.units.litersPerDay') }}
                </q-item-label>
                <q-item-label caption class="text-grey-5">{{ formatDate(item.created_at) }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" color="grey-5" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </template>
      <div v-else class="text-caption text-grey-5">{{ $t('simulation.home.noEvaluationsYet') }}</div>
    </template>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useSimulationStore, type SimulationListItem } from 'src/stores/simulation';
import { useAuthStore } from 'src/stores/auth';
import {
  reportLabel as _reportLabel,
  isInfeasible,
} from 'src/lib/simulation-helpers';

const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();
const store = useSimulationStore();
const authStore = useAuthStore();
const loading = ref(false);
const restoring = ref(false);

function reportLabel(item: SimulationListItem): string {
  return _reportLabel(item, t);
}

const userName = computed(() => authStore.user?.name || 'User');

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return t('simulation.home.goodMorning');
  if (hour < 17) return t('simulation.home.goodAfternoon');
  return t('simulation.home.goodEvening');
});

const RECENT_LIMIT = 3;
const allRecs = computed(() => store.simulationHistory.filter(i => i.report_type === 'rec'));
const allEvals = computed(() => store.simulationHistory.filter(i => i.report_type === 'eval'));
const recentRecs = computed(() => allRecs.value.slice(0, RECENT_LIMIT));
const recentEvals = computed(() => allEvals.value.slice(0, RECENT_LIMIT));

function startNewSimulation() {
  store.resetForm();
  router.push('/cattle-info');
}

async function retryFetch() {
  loading.value = true;
  try {
    await store.fetchSimulationHistory();
  } finally {
    loading.value = false;
  }
}

onMounted(retryFetch);

async function onViewReport(reportId: string) {
  if (restoring.value || store.viewingReport) return;
  restoring.value = true;
  const reportType = await store.viewSimulationReport(reportId);
  restoring.value = false;
  if (reportType === 'rec') {
    router.push('/recommendation-report');
  } else if (reportType === 'eval') {
    router.push('/evaluation-report');
  } else if (store.error) {
    $q.notify({ type: 'negative', message: store.error });
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}
</script>

<style lang="scss" scoped>
.action-card {
  border-radius: $radius-loose;
  overflow: hidden;
}

.rounded-borders {
  border-radius: $radius-loose;
  overflow: hidden;
}
</style>
