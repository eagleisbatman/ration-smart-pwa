<template>
  <q-page class="q-pa-md">
    <!-- Filter Tabs -->
    <q-tabs
      v-model="filterTab"
      dense
      no-caps
      class="q-mb-md text-grey-7"
      active-color="primary"
      indicator-color="primary"
      align="justify"
    >
      <q-tab name="all" :label="$t('common.all')" />
      <q-tab name="rec" :label="$t('simulation.filterTabs.recommendations')" />
      <q-tab name="eval" :label="$t('simulation.filterTabs.evaluations')" />
      <q-tab name="failed" :label="$t('simulation.filterTabs.failed')" />
    </q-tabs>

    <!-- Search (shown when >5 items) -->
    <q-input
      v-if="store.simulationHistory.length > 5"
      v-model="search"
      :placeholder="$t('simulation.home.searchPlaceholder')"
      outlined
      dense
      clearable
      class="q-mb-md"
    >
      <template #prepend>
        <q-icon name="search" />
      </template>
    </q-input>

    <!-- Loading -->
    <template v-if="loading">
      <q-card v-for="i in 4" :key="i" flat bordered class="q-mb-sm rounded-borders">
        <q-card-section horizontal>
          <q-card-section class="col-auto flex flex-center">
            <q-skeleton type="QAvatar" size="40px" />
          </q-card-section>
          <q-card-section class="col">
            <q-skeleton type="text" width="60%" />
            <q-skeleton type="text" width="80%" class="q-mt-xs" />
            <q-skeleton type="text" width="40%" class="q-mt-xs" />
          </q-card-section>
        </q-card-section>
      </q-card>
    </template>

    <!-- Error State -->
    <template v-else-if="store.error">
      <q-card flat bordered class="rounded-borders">
        <q-card-section class="text-center q-pa-lg">
          <q-icon name="cloud_off" size="56px" color="negative" />
          <div class="text-body1 text-grey-7 q-mt-md">{{ store.error }}</div>
          <q-btn
            flat
            no-caps
            color="primary"
            :label="$t('common.retry')"
            class="q-mt-sm"
            @click="retryFetch"
          />
        </q-card-section>
      </q-card>
    </template>

    <!-- Empty State -->
    <template v-else-if="filteredItems.length === 0 && !search">
      <q-card flat bordered class="rounded-borders">
        <q-card-section class="text-center q-pa-lg">
          <q-icon name="science" size="56px" color="grey-4" />
          <div class="text-body1 text-grey-6 q-mt-md">
            {{ filterTab === 'all' ? $t('simulation.historyEmpty') : $t('simulation.noFilterResults') }}
          </div>
          <div v-if="filterTab === 'all'" class="text-caption text-grey-5">
            {{ $t('simulation.historyEmptyDesc') }}
          </div>
          <q-btn
            v-if="filterTab === 'all'"
            flat
            no-caps
            color="primary"
            :label="$t('simulation.home.startSimulation')"
            class="q-mt-md"
            @click="router.push('/cattle-info')"
          />
        </q-card-section>
      </q-card>
    </template>

    <!-- No search results -->
    <template v-else-if="filteredItems.length === 0 && search">
      <div class="text-center q-pa-lg text-grey-6">
        {{ $t('common.noResults') }}
      </div>
    </template>

    <!-- Card List -->
    <template v-else>
      <q-card
        v-for="item in filteredItems"
        :key="item.report_id"
        flat
        bordered
        class="q-mb-sm rounded-borders cursor-pointer"
        v-ripple
        :class="{ 'opacity-50': restoring }"
        @click="onViewReport(item.report_id)"
      >
        <q-card-section horizontal class="items-center">
          <q-card-section class="col-auto">
            <q-avatar
              :color="item.report_type === 'rec' ? 'primary' : 'secondary'"
              text-color="white"
              size="40px"
            >
              <q-icon :name="item.report_type === 'rec' ? 'auto_fix_high' : 'assessment'" />
            </q-avatar>
          </q-card-section>

          <q-card-section class="col q-py-sm">
            <div class="row items-center no-wrap">
              <div class="text-body1 text-weight-medium">
                {{ reportLabel(item) }}
              </div>
              <q-badge
                v-if="isInfeasible(item)"
                color="negative"
                :label="$t('simulation.status.failed')"
                class="q-ml-sm"
              />
              <q-badge
                v-else-if="item.solution_status"
                color="positive"
                :label="$t('simulation.status.success')"
                class="q-ml-sm"
              />
            </div>
            <div class="text-caption text-grey-7">
              {{ item.cattle_summary?.breed || '–' }}
              · {{ item.cattle_summary?.body_weight ?? '–' }}{{ $t('common.units.kg') }}
              · {{ item.cattle_summary?.milk_production ?? '–' }}{{ $t('common.units.litersPerDay') }}
            </div>
            <div class="text-caption text-grey-5">
              {{ formatDate(item.created_at) }}
            </div>
          </q-card-section>

          <q-card-section class="col-auto">
            <q-icon name="chevron_right" color="grey-5" />
          </q-card-section>
        </q-card-section>
      </q-card>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useSimulationStore, type SimulationListItem } from 'src/stores/simulation';
import {
  reportLabel as _reportLabel,
  isInfeasible,
} from 'src/lib/simulation-helpers';

const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();
const store = useSimulationStore();

const loading = ref(false);
const restoring = ref(false);
const search = ref('');
const filterTab = ref('all');

function reportLabel(item: SimulationListItem): string {
  return _reportLabel(item, t);
}

const filteredItems = computed(() => {
  let items = store.simulationHistory;

  // Apply tab filter
  if (filterTab.value === 'rec') {
    items = items.filter((item) => item.report_type === 'rec');
  } else if (filterTab.value === 'eval') {
    items = items.filter((item) => item.report_type === 'eval');
  } else if (filterTab.value === 'failed') {
    items = items.filter((item) => isInfeasible(item));
  }

  // Apply search
  if (search.value) {
    const q = search.value.toLowerCase();
    items = items.filter((item) => {
      const label = reportLabel(item).toLowerCase();
      const breed = (item.cattle_summary?.breed || '').toLowerCase();
      return label.includes(q) || breed.includes(q);
    });
  }

  return items;
});

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
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: $radius-loose;
  overflow: hidden;
}
</style>
