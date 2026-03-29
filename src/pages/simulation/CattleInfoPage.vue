<template>
  <q-page class="q-pa-md">
    <q-form @submit="onContinue" greedy>
      <!-- Simulation Details -->
      <div class="section-header">
        <q-icon name="grid_view" color="primary" size="sm" class="q-mr-sm" />
        <span class="text-subtitle1 text-weight-medium">{{ $t('simulation.sections.simulationDetails') }}</span>
        <q-space />
        <q-btn flat round dense icon="schedule" color="primary" @click="showHistorySheet = true" />
      </div>
      <q-card flat bordered class="q-mb-md section-card">
        <q-card-section class="q-gutter-sm">
          <q-input
            v-model="store.simulationName"
            :label="$t('simulation.fields.simulationName')"
            outlined
            dense
            autofocus
            maxlength="100"
            :rules="[
              (v: string) => (v && v.trim().length > 0) || $t('simulation.validation.required'),
              (v: string) => v.trim().length <= 100 || $t('simulation.validation.simulationNameMax'),
            ]"
            hint=" "
          />
          <q-select
            v-model="simulationCountry"
            :label="$t('simulation.fields.simulationCountry')"
            :options="countryOptions"
            emit-value
            map-options
            outlined
            dense
            behavior="menu"
            :loading="authStore.countriesLoading"
            :hint="$t('simulation.hints.simulationCountry')"
          />
        </q-card-section>
      </q-card>

      <!-- Section: Animal Characteristics -->
      <div class="section-header">
        <q-icon name="pets" color="primary" size="sm" class="q-mr-sm" />
        <span class="text-subtitle1 text-weight-medium">{{ $t('simulation.sections.animalCharacteristics') }}</span>
      </div>
      <q-card flat bordered class="q-mb-md section-card">
        <q-card-section class="q-gutter-sm">
          <q-select
            v-model="store.cattleInfo.breed"
            :label="$t('simulation.fields.breed')"
            :options="filteredBreedOptions"
            option-label="name"
            option-value="name"
            emit-value
            map-options
            outlined
            dense
            use-input
            input-debounce="200"
            :loading="breedsLoading"
            :rules="[(v: string) => !!v || $t('simulation.validation.breedRequired')]"
            hint=" "
            @filter="filterBreeds"
          />

          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="store.cattleInfo.body_weight"
                :label="$t('simulation.fields.bodyWeight')"
                type="number"
                outlined
                dense
                :suffix="$t('simulation.units.kg')"
                :hint="$t('simulation.hints.bodyWeight')"
                :rules="[
                  (v: number) => (v >= 100) || $t('simulation.validation.bodyWeightMin'),
                  (v: number) => (v <= 1200) || $t('simulation.validation.bodyWeightMax'),
                ]"
              />
            </div>
            <div class="col-12 col-sm-6">
              <div>
                <div class="text-body2 q-mb-xs">{{ $t('simulation.fields.bcScore') }}: {{ store.cattleInfo.bc_score }}</div>
                <q-slider
                  v-model="store.cattleInfo.bc_score"
                  :min="1"
                  :max="5"
                  :step="0.5"
                  snap
                  label
                  color="primary"
                  markers
                />
                <div class="row justify-between text-caption text-grey-6" style="margin-top: -4px">
                  <span>1 ({{ $t('simulation.bcsLabels.thin') }})</span>
                  <span>5 ({{ $t('simulation.bcsLabels.obese') }})</span>
                </div>
              </div>
            </div>
          </div>

          <q-input
            v-model.number="store.cattleInfo.bw_gain"
            :label="$t('simulation.fields.bwGain')"
            type="number"
            outlined
            dense
            step="0.01"
            :suffix="$t('simulation.units.kgPerDay')"
            :hint="$t('simulation.hints.bwGain')"
            :rules="[
              (v: number) => v >= -1 || $t('simulation.validation.bwGainMin'),
              (v: number) => v <= 2 || $t('simulation.validation.bwGainMax'),
            ]"
          />
        </q-card-section>
      </q-card>

      <!-- Section: Milk Production -->
      <div class="section-header">
        <q-icon name="water_drop" color="primary" size="sm" class="q-mr-sm" />
        <span class="text-subtitle1 text-weight-medium">{{ $t('simulation.sections.milkProduction') }}</span>
      </div>
      <q-card flat bordered class="q-mb-md section-card">
        <q-card-section class="q-gutter-sm">
          <q-toggle
            v-model="store.cattleInfo.lactating"
            :label="$t('simulation.fields.lactating')"
            color="primary"
          />

          <template v-if="store.cattleInfo.lactating">
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="store.cattleInfo.days_in_milk"
                  :label="$t('simulation.fields.daysInMilk')"
                  type="number"
                  outlined
                  dense
                  :hint="$t('simulation.hints.daysInMilk')"
                  :rules="[
                    (v: number) => v >= 0 || $t('simulation.validation.minZero'),
                    (v: number) => v <= 700 || $t('simulation.validation.daysInMilkMax'),
                  ]"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="store.cattleInfo.milk_production"
                  :label="$t('simulation.fields.milkProduction')"
                  type="number"
                  outlined
                  dense
                  step="0.1"
                  :suffix="$t('simulation.units.litersPerDay')"
                  :hint="$t('simulation.hints.milkProduction')"
                  :rules="[
                    (v: number) => v >= 0 || $t('simulation.validation.minZero'),
                    (v: number) => v <= 80 || $t('simulation.validation.milkProductionMax'),
                  ]"
                />
              </div>
            </div>

            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="store.cattleInfo.fat_milk"
                  :label="$t('simulation.fields.fatMilk')"
                  type="number"
                  outlined
                  dense
                  step="0.1"
                  :suffix="$t('simulation.units.percent')"
                  :hint="$t('simulation.hints.fatMilk')"
                  :rules="[
                    (v: number) => v >= 1 || $t('simulation.validation.fatMilkMin'),
                    (v: number) => v <= 8 || $t('simulation.validation.fatMilkMax'),
                  ]"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="store.cattleInfo.tp_milk"
                  :label="$t('simulation.fields.tpMilk')"
                  type="number"
                  outlined
                  dense
                  step="0.1"
                  :suffix="$t('simulation.units.percent')"
                  :hint="$t('simulation.hints.tpMilk')"
                  :rules="[
                    (v: number) => v >= 1 || $t('simulation.validation.tpMilkMin'),
                    (v: number) => v <= 6 || $t('simulation.validation.tpMilkMax'),
                  ]"
                />
              </div>
            </div>
          </template>
        </q-card-section>
      </q-card>

      <!-- Section: Reproductive Data -->
      <div class="section-header">
        <q-icon name="monitor_heart" color="primary" size="sm" class="q-mr-sm" />
        <span class="text-subtitle1 text-weight-medium">{{ $t('simulation.sections.reproductiveData') }}</span>
      </div>
      <q-card flat bordered class="q-mb-md section-card">
        <q-card-section class="q-gutter-sm">
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="store.cattleInfo.parity"
                :label="$t('simulation.fields.parity')"
                type="number"
                outlined
                dense
                :hint="$t('simulation.hints.parity')"
                :rules="[
                  (v: number) => v >= 0 || $t('simulation.validation.minZero'),
                  (v: number) => v <= 15 || $t('simulation.validation.parityMax'),
                ]"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="store.cattleInfo.days_of_pregnancy"
                :label="$t('simulation.fields.daysOfPregnancy')"
                type="number"
                outlined
                dense
                :hint="$t('simulation.hints.daysOfPregnancy')"
                :rules="[
                  (v: number) => v >= 0 || $t('simulation.validation.minZero'),
                  (v: number) => v <= 290 || $t('simulation.validation.daysOfPregnancyMax'),
                ]"
              />
            </div>
          </div>

          <q-input
            v-model.number="store.cattleInfo.calving_interval"
            :label="$t('simulation.fields.calvingInterval')"
            type="number"
            outlined
            dense
            :suffix="$t('simulation.units.days')"
            :hint="$t('simulation.hints.calvingInterval')"
            :rules="[
              (v: number) => v >= 300 || $t('simulation.validation.calvingIntervalMin'),
              (v: number) => v <= 700 || $t('simulation.validation.calvingIntervalMax'),
            ]"
          />

        </q-card-section>
      </q-card>

      <!-- Section: Environment -->
      <div class="section-header">
        <q-icon name="thermostat" color="primary" size="sm" class="q-mr-sm" />
        <span class="text-subtitle1 text-weight-medium">{{ $t('simulation.sections.environment') }}</span>
      </div>
      <q-card flat bordered class="q-mb-md section-card">
        <q-card-section class="q-gutter-sm">
          <q-input
            v-model.number="store.cattleInfo.temperature"
            :label="$t('simulation.fields.temperature')"
            type="number"
            outlined
            dense
            :suffix="$t('simulation.units.degreeC')"
            :hint="$t('simulation.hints.temperature')"
            :rules="[
              (v: number) => v >= -20 || $t('simulation.validation.temperatureMin'),
              (v: number) => v <= 50 || $t('simulation.validation.temperatureMax'),
            ]"
          />

          <!-- Active Grazing -->
          <q-toggle
            v-model="activeGrazing"
            :label="$t('simulation.fields.activeGrazing')"
            color="primary"
          />

          <template v-if="activeGrazing">
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <div class="text-caption text-grey-7 q-mb-xs">{{ $t('simulation.fields.topography') }}</div>
                <q-option-group
                  v-model="store.cattleInfo.topography"
                  :options="topographyOptions"
                  type="radio"
                  color="primary"
                  inline
                  dense
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model.number="store.cattleInfo.distance"
                  :label="$t('simulation.fields.distance')"
                  type="number"
                  outlined
                  dense
                  step="0.1"
                  :suffix="$t('simulation.units.km')"
                  :hint="$t('simulation.hints.distance')"
                  :rules="[
                    (v: number) => v >= 0 || $t('simulation.validation.minZero'),
                    (v: number) => v <= 50 || $t('simulation.validation.distanceMax'),
                  ]"
                />
              </div>
            </div>
          </template>
        </q-card-section>
      </q-card>

      <!-- Action Buttons -->
      <div class="row q-col-gutter-sm q-mt-md action-bar">
        <div class="col-4">
          <q-btn
            outline
            color="grey-7"
            :label="$t('simulation.reset')"
            class="full-width action-btn"
            no-caps
            @click="resetForm"
          />
        </div>
        <div class="col-8">
          <q-btn
            :label="$t('simulation.continue')"
            type="submit"
            color="primary"
            class="full-width action-btn"
            unelevated
            no-caps
          />
        </div>
      </div>
    </q-form>

    <!-- History Bottom Sheet -->
    <q-dialog v-model="showHistorySheet" position="bottom">
      <q-card class="history-sheet">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-subtitle1 text-weight-medium">{{ $t('simulation.loadFromHistory') }}</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section v-if="historyLoading" class="text-center q-pa-lg">
          <q-spinner color="primary" size="2em" />
        </q-card-section>

        <q-card-section v-else-if="store.simulationHistory.length === 0" class="text-center q-pa-lg text-grey-6">
          {{ $t('simulation.historyEmpty') }}
        </q-card-section>

        <q-card-section v-else class="q-pa-sm" style="max-height: 60vh; overflow-y: auto;">
          <q-list separator>
            <q-item
              v-for="item in store.simulationHistory"
              :key="item.report_id"
              clickable
              v-ripple
              @click="onLoadHistory(item.report_id)"
            >
              <q-item-section avatar>
                <q-avatar
                  :color="item.report_type === 'rec' ? 'primary' : 'secondary'"
                  text-color="white"
                  size="36px"
                >
                  <q-icon :name="item.report_type === 'rec' ? 'auto_fix_high' : 'assessment'" size="18px" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ item.report_name || item.report_id }}</q-item-label>
                <q-item-label caption>
                  {{ item.cattle_summary?.breed || '–' }}
                  · {{ item.cattle_summary?.body_weight ?? '–' }}{{ $t('common.units.kg') }}
                </q-item-label>
                <q-item-label caption class="text-grey-5">
                  {{ formatHistoryDate(item.created_at) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" color="grey-5" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useSimulationStore } from 'src/stores/simulation';
import { useAuthStore } from 'src/stores/auth';
import { toAlpha2 } from 'src/services/api-adapter';

const { t } = useI18n();
const router = useRouter();
const $q = useQuasar();
const store = useSimulationStore();
const authStore = useAuthStore();

const simulationCountry = ref(authStore.userCountry || 'IN');
const showHistorySheet = ref(false);
const historyLoading = ref(false);

const countryOptions = computed(() =>
  authStore.countries.map((c) => ({
    label: c.name || c.country_code,
    value: toAlpha2(c.country_code),
  }))
);

// Re-fetch breeds when simulation country changes
watch(simulationCountry, () => {
  store.cattleInfo.breed = '';
  loadBreeds();
});

const activeGrazing = ref(
  store.cattleInfo.topography !== 'Flat' || (store.cattleInfo.distance > 0)
);
const breedsLoading = ref(false);
const breedOptions = ref<Array<{ name: string }>>([]);
const filteredBreedOptions = ref<Array<{ name: string }>>([]);

function filterBreeds(val: string, update: (fn: () => void) => void) {
  update(() => {
    if (!val) {
      filteredBreedOptions.value = breedOptions.value;
    } else {
      const q = val.toLowerCase();
      filteredBreedOptions.value = breedOptions.value.filter(
        (b) => b.name.toLowerCase().includes(q)
      );
    }
  });
}

const topographyOptions = computed(() => [
  { label: t('simulation.topographyOptions.flat'), value: 'Flat' },
  { label: t('simulation.topographyOptions.hilly'), value: 'Hilly' },
]);

const FALLBACK_BREEDS = [
  { name: 'Holstein Friesian' },
  { name: 'Jersey' },
  { name: 'Sahiwal' },
  { name: 'Gir' },
  { name: 'Red Sindhi' },
  { name: 'Crossbreed' },
];

function loadBreeds() {
  // EC2 has no breeds endpoint — use hardcoded list
  breedOptions.value = FALLBACK_BREEDS;
  filteredBreedOptions.value = FALLBACK_BREEDS;
}

function resetForm() {
  $q.dialog({
    title: t('common.confirm'),
    message: t('simulation.resetConfirmMessage'),
    cancel: true,
  }).onOk(() => {
    store.resetForm();
    $q.notify({ type: 'info', message: t('simulation.formReset') });
  });
}

function onContinue() {
  const c = store.cattleInfo;

  // Auto-clear milk fields when not lactating
  if (!c.lactating) {
    const hadMilkData = c.days_in_milk > 0 || c.milk_production > 0 || c.fat_milk !== 3.8 || c.tp_milk !== 3.2;
    c.days_in_milk = 0;
    c.milk_production = 0;
    c.fat_milk = 3.8;
    c.tp_milk = 3.2;
    if (hadMilkData) {
      $q.notify({ type: 'info', message: t('simulation.validation.notLactatingCleared') });
    }
  }

  // Warn if lactating with very late pregnancy (>= 220 days)
  if (c.lactating && c.days_of_pregnancy >= 220) {
    $q.dialog({
      title: t('common.warning'),
      message: t('simulation.validation.lactatingLatePregnancy', { days: c.days_of_pregnancy }),
      cancel: true,
      persistent: true,
    }).onOk(() => {
      proceedToFeedSelection();
    });
    return;
  }

  proceedToFeedSelection();
}

function proceedToFeedSelection() {
  store.newSimulationId();
  router.push('/feed-selection');
}

async function loadHistory() {
  historyLoading.value = true;
  await store.fetchSimulationHistory();
  historyLoading.value = false;
}

async function onLoadHistory(reportId: string) {
  showHistorySheet.value = false;
  const reportType = await store.viewSimulationReport(reportId);
  if (reportType === 'rec') {
    router.push('/recommendation-report');
  } else if (reportType === 'eval') {
    router.push('/evaluation-report');
  } else if (store.error) {
    $q.notify({ type: 'negative', message: store.error });
  }
}

function formatHistoryDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// Watch history sheet open to load data
watch(showHistorySheet, (open) => {
  if (open && store.simulationHistory.length === 0) {
    loadHistory();
  }
});

onMounted(() => {
  loadBreeds();
});
</script>

<style lang="scss" scoped>
.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.section-card {
  border-radius: $radius-loose;
  overflow: hidden;
}

.action-bar {
  @media screen and (max-width: 599px) {
    position: sticky;
    bottom: 0;
    z-index: 1;
    background: var(--q-background, #fff);
    padding: 12px 0;
    margin-left: -16px;
    margin-right: -16px;
    padding-left: 16px;
    padding-right: 16px;
    border-top: 1px solid rgba(0, 0, 0, 0.08);

    .body--dark & {
      background: var(--q-dark-page, #121212);
      border-top-color: rgba(255, 255, 255, 0.1);
    }
  }
}

.action-btn {
  border-radius: $radius-loose;
  font-size: 1.05rem;
  letter-spacing: 0.025em;
  padding-top: 14px;
  padding-bottom: 14px;
}

.history-sheet {
  width: 100%;
  max-width: 500px;
  border-radius: 16px 16px 0 0;
}
</style>
