<template>
  <q-page class="q-pa-md">
    <q-form @submit="onContinue" greedy>
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
            :options="breedOptions"
            option-label="name"
            option-value="name"
            emit-value
            map-options
            outlined
            dense
            :loading="breedsLoading"
            :rules="[(v: string) => !!v || $t('simulation.validation.breedRequired')]"
          />

          <q-input
            v-model.number="store.cattleInfo.body_weight"
            :label="$t('simulation.fields.bodyWeight')"
            type="number"
            outlined
            dense
            :rules="[
              (v: number) => (v >= 100) || $t('simulation.validation.bodyWeightMin'),
              (v: number) => (v <= 1200) || $t('simulation.validation.bodyWeightMax'),
            ]"
          />

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
          </div>
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
            <q-input
              v-model.number="store.cattleInfo.days_in_milk"
              :label="$t('simulation.fields.daysInMilk')"
              type="number"
              outlined
              dense
              :rules="[
                (v: number) => v >= 0 || $t('simulation.validation.minZero'),
                (v: number) => v <= 700 || $t('simulation.validation.daysInMilkMax'),
              ]"
            />

            <q-input
              v-model.number="store.cattleInfo.milk_production"
              :label="$t('simulation.fields.milkProduction')"
              type="number"
              outlined
              dense
              step="0.1"
              :rules="[
                (v: number) => v >= 0 || $t('simulation.validation.minZero'),
                (v: number) => v <= 80 || $t('simulation.validation.milkProductionMax'),
              ]"
            />

            <q-input
              v-model.number="store.cattleInfo.fat_milk"
              :label="$t('simulation.fields.fatMilk')"
              type="number"
              outlined
              dense
              step="0.1"
              :rules="[
                (v: number) => v >= 1 || $t('simulation.validation.fatMilkMin'),
                (v: number) => v <= 8 || $t('simulation.validation.fatMilkMax'),
              ]"
            />

            <q-input
              v-model.number="store.cattleInfo.tp_milk"
              :label="$t('simulation.fields.tpMilk')"
              type="number"
              outlined
              dense
              step="0.1"
              :rules="[
                (v: number) => v >= 1 || $t('simulation.validation.tpMilkMin'),
                (v: number) => v <= 6 || $t('simulation.validation.tpMilkMax'),
              ]"
            />
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
          <q-input
            v-model.number="store.cattleInfo.parity"
            :label="$t('simulation.fields.parity')"
            type="number"
            outlined
            dense
            :rules="[
              (v: number) => v >= 0 || $t('simulation.validation.minZero'),
              (v: number) => v <= 15 || $t('simulation.validation.parityMax'),
            ]"
          />

          <q-input
            v-model.number="store.cattleInfo.days_of_pregnancy"
            :label="$t('simulation.fields.daysOfPregnancy')"
            type="number"
            outlined
            dense
            :rules="[
              (v: number) => v >= 0 || $t('simulation.validation.minZero'),
              (v: number) => v <= 290 || $t('simulation.validation.daysOfPregnancyMax'),
            ]"
          />

          <q-input
            v-model.number="store.cattleInfo.calving_interval"
            :label="$t('simulation.fields.calvingInterval')"
            type="number"
            outlined
            dense
            :rules="[
              (v: number) => v >= 300 || $t('simulation.validation.calvingIntervalMin'),
              (v: number) => v <= 600 || $t('simulation.validation.calvingIntervalMax'),
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
            :rules="[
              (v: number) => v >= -20 || $t('simulation.validation.temperatureMin'),
              (v: number) => v <= 50 || $t('simulation.validation.temperatureMax'),
            ]"
          />

          <q-select
            v-model="store.cattleInfo.topography"
            :label="$t('simulation.fields.topography')"
            :options="topographyOptions"
            emit-value
            map-options
            outlined
            dense
          />

          <q-input
            v-model.number="store.cattleInfo.distance"
            :label="$t('simulation.fields.distance')"
            type="number"
            outlined
            dense
            step="0.1"
            :rules="[
              (v: number) => v >= 0 || $t('simulation.validation.minZero'),
              (v: number) => v <= 50 || $t('simulation.validation.distanceMax'),
            ]"
          />

          <q-toggle
            v-model="store.cattleInfo.grazing"
            :label="$t('simulation.fields.grazing')"
            color="primary"
          />

          <q-input
            v-model.number="store.cattleInfo.bw_gain"
            :label="$t('simulation.fields.bwGain')"
            type="number"
            outlined
            dense
            step="0.01"
            :rules="[
              (v: number) => v >= -1 || $t('simulation.validation.bwGainMin'),
              (v: number) => v <= 2 || $t('simulation.validation.bwGainMax'),
            ]"
          />
        </q-card-section>
      </q-card>

      <!-- Continue Button -->
      <q-btn
        :label="$t('simulation.continue')"
        type="submit"
        color="primary"
        class="full-width q-mt-md submit-btn"
        size="lg"
        unelevated
        no-caps
      />
    </q-form>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useSimulationStore } from 'src/stores/simulation';
import { useAuthStore } from 'src/stores/auth';
import { getCountryId, fetchAndCacheCountries } from 'src/services/api-adapter';
import { api } from 'src/lib/api';


const { t } = useI18n();
const router = useRouter();
const $q = useQuasar();
const store = useSimulationStore();
const authStore = useAuthStore();

const breedsLoading = ref(false);
const breedOptions = ref<Array<{ name: string }>>([]);

const topographyOptions = computed(() => [
  { label: t('simulation.topographyOptions.flat'), value: 'Flat' },
  { label: t('simulation.topographyOptions.hilly'), value: 'Hilly' },
  { label: t('simulation.topographyOptions.mountainous'), value: 'Mountainous' },
]);

const FALLBACK_BREEDS = [
  { name: 'Holstein Friesian' },
  { name: 'Jersey' },
  { name: 'Sahiwal' },
  { name: 'Gir' },
  { name: 'Red Sindhi' },
  { name: 'Crossbreed' },
];

async function fetchBreeds() {
  await fetchAndCacheCountries();
  const countryCode = authStore.userCountry || 'IN';
  const countryId = getCountryId(countryCode);
  if (!countryId) {
    breedOptions.value = FALLBACK_BREEDS;
    return;
  }

  breedsLoading.value = true;
  try {
    const response = await api.get(`/auth/breeds/${countryId}`);
    const data = response.data;
    const breeds = Array.isArray(data) ? data : data?.breeds ?? [];
    breedOptions.value = breeds.length > 0 ? breeds : FALLBACK_BREEDS;
  } catch {
    breedOptions.value = FALLBACK_BREEDS;
  } finally {
    breedsLoading.value = false;
  }
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

onMounted(() => {
  fetchBreeds();
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

.submit-btn {
  border-radius: $radius-loose;
  font-size: 1.05rem;
  letter-spacing: 0.025em;
  padding-top: 14px;
  padding-bottom: 14px;

  @media screen and (max-width: 599px) {
    position: sticky;
    bottom: 12px;
    z-index: 1;
  }
}
</style>
