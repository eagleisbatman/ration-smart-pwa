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
      bordered
      class="q-mb-lg action-card cursor-pointer"
      v-ripple
      @click="router.push('/cattle-info')"
    >
      <q-card-section horizontal>
        <q-card-section class="col">
          <div class="text-subtitle1 text-weight-medium">
            {{ $t('simulation.home.startSimulation') }}
          </div>
          <div class="text-caption text-grey-6 q-mt-xs">
            {{ $t('simulation.home.startSimulationDesc') }}
          </div>
        </q-card-section>
        <q-card-section class="col-auto flex flex-center q-pr-md">
          <q-avatar color="primary" text-color="white" size="48px">
            <q-icon name="science" />
          </q-avatar>
        </q-card-section>
      </q-card-section>
    </q-card>

    <!-- Recent Simulations -->
    <div class="q-mb-sm row items-center justify-between">
      <div class="text-subtitle1 text-weight-medium">
        {{ $t('simulation.home.recentSimulations') }}
      </div>
      <q-btn
        v-if="store.simulationHistory.length > 5"
        flat
        dense
        no-caps
        color="primary"
        :label="$t('simulation.home.viewAll')"
        @click="openHistoryCounter++"
      />
    </div>

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

    <!-- Empty State -->
    <template v-else-if="recentItems.length === 0">
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

    <!-- Simulation List -->
    <template v-else>
      <q-card flat bordered class="rounded-borders">
        <q-list separator>
          <q-item
            v-for="item in recentItems"
            :key="item.report_id"
            v-ripple
            clickable
            :disable="restoring"
            @click="onRestore(item.report_id)"
          >
            <q-item-section avatar>
              <q-avatar
                :color="item.report_type === 'rec' ? 'primary' : 'secondary'"
                text-color="white"
                size="40px"
              >
                <q-icon :name="item.report_type === 'rec' ? 'auto_fix_high' : 'assessment'" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label>
                {{ item.report_name || item.report_type_display }}
              </q-item-label>
              <q-item-label caption>
                {{ item.cattle_summary?.breed || '–' }}
                · {{ item.cattle_summary?.body_weight ?? '–' }}{{ $t('common.units.kg') }}
                · {{ item.cattle_summary?.milk_production ?? '–' }}{{ $t('common.units.litersPerDay') }}
              </q-item-label>
              <q-item-label caption class="text-grey-5">
                {{ formatDate(item.created_at) }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-icon name="chevron_right" color="grey-5" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </template>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useSimulationStore } from 'src/stores/simulation';
import { useAuthStore } from 'src/stores/auth';
const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();
const store = useSimulationStore();
const authStore = useAuthStore();

const loading = ref(false);
const restoring = ref(false);

const userName = computed(() => authStore.user?.name || 'User');

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return t('simulation.home.goodMorning');
  if (hour < 17) return t('simulation.home.goodAfternoon');
  return t('simulation.home.goodEvening');
});

/** Show at most 5 recent simulations. */
const recentItems = computed(() => store.simulationHistory.slice(0, 5));

async function retryFetch() {
  loading.value = true;
  try {
    await store.fetchSimulationHistory();
  } finally {
    loading.value = false;
  }
}

onMounted(retryFetch);

async function onRestore(reportId: string) {
  restoring.value = true;
  const ok = await store.restoreSimulation(reportId);
  restoring.value = false;
  if (ok) {
    router.push('/cattle-info');
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
