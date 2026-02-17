<template>
  <q-page :class="$q.screen.lt.sm ? 'q-pa-none' : 'q-pa-md'">
    <!-- Stepper -->
    <q-stepper
      ref="stepper"
      v-model="step"
      color="primary"
      animated
      flat
      :bordered="!$q.screen.lt.sm"
      :vertical="$q.screen.lt.sm"
      :alternative-labels="!$q.screen.lt.sm"
      class="diet-stepper"
    >
      <!-- Step 1: Select Cow -->
      <q-step :name="1" :title="$t('diet.wizard.stepCow')" :icon="COW_ICON" :done="step > 1">
        <div class="text-subtitle1 q-mb-md">{{ $t('diet.wizard.selectCowOrManual') }}</div>

        <q-option-group
          v-model="inputMode"
          :options="inputModeOptions"
          color="primary"
          class="q-mb-md"
          @update:model-value="onInputModeChange"
        />

        <!-- My cows -->
        <template v-if="inputMode === 'select'">
          <q-select
            v-model="form.cow_id"
            :label="$t('diet.wizard.selectCow')"
            outlined
            :options="cowOptions"
            emit-value
            map-options
            @update:model-value="onCowSelected"
          />
        </template>

        <!-- Farmer's cow -->
        <template v-else-if="inputMode === 'farmer'">
          <q-select
            v-model="selectedFarmerId"
            :label="$t('diet.wizard.selectFarmer')"
            outlined
            :options="farmerOptions"
            emit-value
            map-options
            class="q-mb-md"
            @update:model-value="onFarmerSelected"
          />
          <q-select
            v-if="selectedFarmerId"
            v-model="form.cow_id"
            :label="$t('diet.wizard.selectCow')"
            outlined
            :options="farmerCowOptions"
            emit-value
            map-options
            :loading="loadingFarmerCows"
            :disable="loadingFarmerCows"
            @update:model-value="onFarmerCowSelected"
          />
          <div v-if="selectedFarmerId && !loadingFarmerCows && farmerCowOptions.length === 0" class="text-caption text-negative q-mt-sm">
            {{ $t('diet.wizard.noCowsForFarmer') }}
          </div>
        </template>

        <!-- Manual entry -->
        <template v-else>
          <q-input
            v-model="form.cow_name"
            :label="$t('diet.wizard.cowNameOptional')"
            outlined
            class="q-mb-sm"
          />
        </template>
      </q-step>

      <!-- Step 2: Animal Details -->
      <q-step :name="2" :title="$t('diet.wizard.stepDetails')" icon="info" :done="step > 2">
        <div class="text-subtitle1 q-mb-md">{{ $t('diet.wizard.animalInformation') }}</div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input
              v-model.number="form.weight_kg"
              :label="$t('diet.wizard.weightKg')"
              type="number"
              outlined
              :rules="[(val) => val > 0 || $t('diet.wizard.required')]"
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-model.number="form.milk_yield_liters"
              :label="$t('diet.wizard.milkYieldPerDay')"
              type="number"
              step="0.1"
              outlined
            />
          </div>
        </div>

        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-12 col-sm-6">
            <q-input
              v-model.number="form.milk_fat_percentage"
              :label="$t('diet.wizard.milkFatPercent')"
              type="number"
              step="0.1"
              outlined
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-select
              v-model="form.lactation_stage"
              :label="$t('diet.wizard.lactationStage')"
              outlined
              :options="lactationOptions"
              emit-value
              map-options
            />
          </div>
        </div>

        <q-toggle v-model="form.is_pregnant" :label="$t('diet.wizard.pregnant')" class="q-mt-sm" />

        <q-input
          v-if="form.is_pregnant"
          v-model.number="form.pregnancy_month"
          :label="$t('diet.wizard.pregnancyMonth')"
          type="number"
          outlined
          class="q-mt-sm"
        />

        <div class="row q-col-gutter-md q-mt-sm">
          <div class="col-12 col-sm-6">
            <div class="text-caption q-mb-xs">{{ $t('diet.wizard.bodyConditionScore') }}</div>
            <q-slider
              v-model="form.body_condition_score"
              :min="1"
              :max="5"
              :step="0.5"
              snap
              label
              :label-value="$t('cow.bcsValue', { score: form.body_condition_score })"
              color="primary"
              markers
              class="q-mx-sm"
            />
            <div class="text-caption text-grey-6 text-center">{{ $t('cow.bcsHint') }}</div>
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-model.number="form.age_months"
              :label="$t('diet.wizard.ageMonths')"
              type="number"
              outlined
              :hint="$t('diet.wizard.ageMonthsHint')"
            />
          </div>
        </div>
      </q-step>

      <!-- Step 3: Select Feeds -->
      <q-step :name="3" :title="$t('diet.wizard.stepFeeds')" icon="grass" :done="step > 3">
        <div class="text-subtitle1 q-mb-md">
          {{ $t('diet.wizard.selectAvailableFeeds', { count: form.available_feeds.length }) }}
        </div>

        <q-input
          v-model="feedSearch"
          outlined
          dense
          :placeholder="$t('diet.wizard.searchFeeds')"
          class="q-mb-md"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-list bordered separator class="rounded-borders scroll-list scroll-list--300">
          <q-item
            v-for="feed in filteredFeeds"
            :key="feed.id"
            v-ripple
            tag="label"
          >
            <q-item-section side>
              <q-checkbox
                v-model="form.available_feeds"
                :val="feed.id"
                color="primary"
              />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ feed.name }}</q-item-label>
              <q-item-label caption>
                {{ feed.category }} · {{ $t('diet.cpLabel') }}: {{ feed.cp_percentage != null ? feed.cp_percentage + '%' : '–' }} · {{ $t('diet.tdnLabel') }}: {{ feed.tdn_percentage != null ? feed.tdn_percentage + '%' : '–' }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-input
                v-if="form.available_feeds.includes(feed.id)"
                :model-value="feedPriceOverrides[feed.id] ?? feed.price_per_kg ?? ''"
                type="number"
                dense
                outlined
                :prefix="currencySymbol"
                :suffix="$t('units.perKg')"
                input-style="text-align: right; width: 50px"
                style="max-width: 110px"
                @update:model-value="(v: string | number | null) => setFeedPrice(feed.id, v)"
                @click.stop
              />
              <q-item-label v-else-if="feed.price_per_kg" caption>
                {{ formatCurrency(feed.price_per_kg) }}{{ $t('units.perKg') }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <q-banner v-if="form.available_feeds.length < 3" class="bg-warning text-white q-mt-md" rounded>
          {{ $t('diet.wizard.selectAtLeast3Feeds') }}
        </q-banner>
      </q-step>

      <!-- Step 4: Optimization Goal -->
      <q-step :name="4" :title="$t('diet.wizard.stepGoal')" icon="flag" :done="step > 4">
        <div class="text-subtitle1 q-mb-md">{{ $t('diet.wizard.whatToOptimize') }}</div>

        <q-option-group
          v-model="form.optimization_goal"
          :options="goalOptions"
          color="primary"
        >
          <template #label="opt">
            <div class="row items-center">
              <q-icon :name="opt.icon" size="24px" class="q-mr-sm" :color="opt.color" />
              <div>
                <div>{{ opt.label }}</div>
                <div class="text-caption text-grey-7">{{ opt.description }}</div>
              </div>
            </div>
          </template>
        </q-option-group>

        <q-input
          v-model.number="form.budget_per_day"
          :label="$t('diet.wizard.dailyBudgetOptional')"
          type="number"
          outlined
          :prefix="getCurrencySymbol()"
          :hint="$t('diet.wizard.noBudgetLimit')"
          class="q-mt-lg"
        />
      </q-step>

      <!-- Step 5: Review & Submit -->
      <q-step :name="5" :title="$t('diet.wizard.stepReview')" icon="check">
        <div class="text-subtitle1 q-mb-md">{{ $t('diet.wizard.reviewAndGenerate') }}</div>

        <q-card flat bordered class="q-mb-md">
          <q-list>
            <q-item>
              <q-item-section>
                <q-item-label caption>{{ $t('diet.wizard.cow') }}</q-item-label>
                <q-item-label>{{ form.cow_name || $t('diet.wizard.manualEntry') }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>{{ $t('diet.wizard.weightMilkYield') }}</q-item-label>
                <q-item-label>{{ form.weight_kg }} {{ $t('diet.kg') }} / {{ form.milk_yield_liters }} {{ $t('units.l') }}/{{ $t('units.perDay').replace('/', '') }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>{{ $t('diet.wizard.bcsAndAge') }}</q-item-label>
                <q-item-label>{{ $t('cow.bcsValue', { score: form.body_condition_score }) }} · {{ form.age_months ? $t('diet.wizard.ageMonthsValue', { months: form.age_months }) : $t('diet.wizard.notSpecified') }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>{{ $t('diet.wizard.selectedFeeds') }}</q-item-label>
                <q-item-label>{{ $t('diet.wizard.feedsCount', { count: form.available_feeds.length }) }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>{{ $t('diet.wizard.optimizationGoal') }}</q-item-label>
                <q-item-label class="text-capitalize">{{ formatGoal(form.optimization_goal) }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Offline Warning -->
        <q-banner v-if="!isOnline" class="bg-warning text-white q-mb-md" rounded>
          <template #avatar>
            <q-icon name="cloud_off" />
          </template>
          {{ $t('diet.wizard.offlineWarning') }}
        </q-banner>
      </q-step>

      <!-- Navigation -->
      <template #navigation>
        <q-stepper-navigation>
          <q-btn
            v-if="step > 1"
            flat
            color="primary"
            :label="$t('diet.wizard.back')"
            class="q-mr-sm"
            @click="onStepBack"
          />
          <q-btn
            v-if="step < 5"
            color="primary"
            :label="$t('diet.wizard.continue')"
            :disable="!canProceed"
            @click="onStepNext"
          />
          <q-btn
            v-else
            color="primary"
            :label="$t('diet.wizard.generateDiet')"
            :loading="optimizing"
            :disable="!isOnline || form.available_feeds.length < 2"
            @click="submitDiet"
          />
        </q-stepper-navigation>
      </template>
    </q-stepper>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar, QStepper } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useDietsStore, DietInput } from 'src/stores/diets';
import { useCowsStore } from 'src/stores/cows';
import { useFeedsStore } from 'src/stores/feeds';
import { useFarmersStore } from 'src/stores/farmers';
import { isOnline } from 'src/boot/pwa';
import { COW_ICON } from 'src/boot/icons';
import { useCurrency } from 'src/composables/useCurrency';
import { useHapticFeedback } from 'src/composables/useHapticFeedback';

const { t } = useI18n();
const { formatCurrency, getCurrencySymbol } = useCurrency();
const { success, error: hapticError, light, medium } = useHapticFeedback();

// Template refs
const stepper = ref<QStepper | null>(null);

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const dietsStore = useDietsStore();
const cowsStore = useCowsStore();
const feedsStore = useFeedsStore();
const farmersStore = useFarmersStore();

const step = ref(1);
const inputMode = ref<'select' | 'manual' | 'farmer'>('select');
const feedSearch = ref('');
const selectedFarmerId = ref<string | null>(null);
const farmerCowsList = ref<{ id: string; name: string; weight_kg: number; milk_yield_liters: number; milk_fat_percentage: number; lactation_stage: string; is_pregnant: boolean; pregnancy_month?: number; activity_level: string; body_condition_score?: number; age_months?: number; breed?: string; _backend_days_in_milk?: number; _backend_parity?: number; _backend_milk_protein_percent?: number }[]>([]);
const loadingFarmerCows = ref(false);

const queryCowId = route.query.cow_id as string | undefined;
const regenerateFromId = route.query.regenerateFrom as string | undefined;

const form = reactive<DietInput>({
  cow_id: queryCowId,
  cow_name: '',
  weight_kg: 400,
  milk_yield_liters: 10,
  milk_fat_percentage: 4.0,
  lactation_stage: 'mid',
  body_condition_score: 3,
  age_months: undefined,
  is_pregnant: false,
  pregnancy_month: undefined,
  activity_level: 'normal',
  optimization_goal: 'balanced',
  available_feeds: [],
  budget_per_day: undefined,
});

// Feed price overrides (user-editable prices per feed)
const feedPriceOverrides = reactive<Record<string, number>>({});
const currencySymbol = computed(() => getCurrencySymbol());

function setFeedPrice(feedId: string, value: string | number | null) {
  if (value === null || value === '') {
    delete feedPriceOverrides[feedId];
  } else {
    feedPriceOverrides[feedId] = Number(value);
  }
}

const optimizing = computed(() => dietsStore.optimizing);

const hasManagedFarmers = computed(() => farmersStore.managedFarmers.length > 0);

const inputModeOptions = computed(() => {
  const opts = [
    { label: t('diet.wizard.selectFromMyCows'), value: 'select' },
  ];
  if (hasManagedFarmers.value) {
    opts.push({ label: t('diet.wizard.selectFromFarmerCows'), value: 'farmer' });
  }
  opts.push({ label: t('diet.wizard.enterManually'), value: 'manual' });
  return opts;
});

const cowOptions = computed(() =>
  cowsStore.activeCows.map((cow) => ({
    label: cow.name,
    value: cow.id,
  }))
);

const farmerOptions = computed(() =>
  farmersStore.managedFarmers.map((f) => ({
    label: f.name,
    value: f.id,
  }))
);

const farmerCowOptions = computed(() =>
  farmerCowsList.value.map((cow) => ({
    label: cow.name,
    value: cow.id,
  }))
);

const filteredFeeds = computed(() => {
  const all = feedsStore.allFeeds;
  if (!feedSearch.value) return all;
  const query = feedSearch.value.toLowerCase();
  return all.filter(
    (f) =>
      f.name.toLowerCase().includes(query) ||
      f.category.toLowerCase().includes(query)
  );
});

const lactationOptions = computed(() => [
  { label: t('diet.wizard.lactationEarly'), value: 'early' },
  { label: t('diet.wizard.lactationMid'), value: 'mid' },
  { label: t('diet.wizard.lactationLate'), value: 'late' },
  { label: t('diet.wizard.lactationDry'), value: 'dry' },
]);

const goalOptions = computed(() => [
  {
    label: t('diet.goals.minimizeCost'),
    value: 'minimize_cost',
    icon: 'savings',
    color: 'positive',
    description: t('diet.goals.minimizeCostDesc'),
  },
  {
    label: t('diet.goals.maximizeMilk'),
    value: 'maximize_milk',
    icon: 'water_drop',
    color: 'primary',
    description: t('diet.goals.maximizeMilkDesc'),
  },
  {
    label: t('diet.goals.balanced'),
    value: 'balanced',
    icon: 'balance',
    color: 'secondary',
    description: t('diet.goals.balancedDesc'),
  },
]);

const canProceed = computed(() => {
  switch (step.value) {
    case 1:
      if (inputMode.value === 'manual') return true;
      if (inputMode.value === 'farmer') return !!selectedFarmerId.value && !!form.cow_id;
      return !!form.cow_id;
    case 2:
      return form.weight_kg > 0;
    case 3:
      return form.available_feeds.length >= 2;
    case 4:
      return !!form.optimization_goal;
    default:
      return true;
  }
});

function onInputModeChange() {
  // Reset cow selection when switching modes
  form.cow_id = undefined;
  form.cow_name = '';
  form.farmer_profile_id = undefined;
  form.farmer_name = undefined;
  selectedFarmerId.value = null;
  farmerCowsList.value = [];
}

function fillFormFromCow(cow: { name: string; weight_kg: number; milk_yield_liters: number; milk_fat_percentage: number; lactation_stage: string; is_pregnant: boolean; pregnancy_month?: number; activity_level: string; body_condition_score?: number; age_months?: number; _backend_days_in_milk?: number; _backend_parity?: number; _backend_milk_protein_percent?: number }) {
  form.cow_name = cow.name;
  form.weight_kg = cow.weight_kg;
  form.milk_yield_liters = cow.milk_yield_liters;
  form.milk_fat_percentage = cow.milk_fat_percentage;
  form.lactation_stage = cow.lactation_stage;
  form.is_pregnant = cow.is_pregnant;
  form.pregnancy_month = cow.pregnancy_month;
  form.activity_level = cow.activity_level;
  form.body_condition_score = cow.body_condition_score ?? 3;
  form.age_months = cow.age_months;
}

function onCowSelected(cowId: string) {
  const cow = cowsStore.activeCows.find((c) => c.id === cowId);
  if (cow) {
    fillFormFromCow(cow);
  }
}

async function onFarmerSelected(farmerId: string) {
  form.cow_id = undefined;
  form.cow_name = '';
  farmerCowsList.value = [];
  loadingFarmerCows.value = true;

  const farmer = farmersStore.managedFarmers.find((f) => f.id === farmerId);
  form.farmer_profile_id = farmerId;
  form.farmer_name = farmer?.name;

  try {
    // Fetch cows for this farmer
    await cowsStore.fetchCows(farmerId);
    farmerCowsList.value = cowsStore.getCowsForFarmer(farmerId);
  } finally {
    loadingFarmerCows.value = false;
  }
}

function onFarmerCowSelected(cowId: string) {
  const cow = farmerCowsList.value.find((c) => c.id === cowId);
  if (cow) {
    fillFormFromCow(cow);
  }
}

function formatGoal(goal: string): string {
  const goals: Record<string, string> = {
    minimize_cost: t('diet.goals.minimizeCost'),
    maximize_milk: t('diet.goals.maximizeMilk'),
    balanced: t('diet.goals.balanced'),
  };
  return goals[goal] || goal;
}

function onStepBack() {
  light(); // Haptic feedback on step change
  stepper.value?.previous();
}

function onStepNext() {
  light(); // Haptic feedback on step change
  stepper.value?.next();
}

async function submitDiet() {
  medium(); // Haptic feedback on submit
  // Attach any user price overrides to the form
  if (Object.keys(feedPriceOverrides).length > 0) {
    form.feed_price_overrides = { ...feedPriceOverrides };
  }
  const diet = await dietsStore.optimizeDiet(form);

  if (diet) {
    success(); // Haptic feedback on successful operation
    $q.notify({
      type: 'positive',
      message: t('diet.wizard.dietStarted'),
    });
    router.push(`/diet/${diet.id}`);
  } else {
    hapticError(); // Haptic feedback on error
  }
}

onMounted(async () => {
  await cowsStore.fetchCows();
  await feedsStore.fetchAllFeeds();
  await farmersStore.fetchFarmers();

  // Pre-fill from previous diet for regeneration
  if (regenerateFromId) {
    const inputData = await dietsStore.getInputDataForRegeneration(regenerateFromId);
    if (inputData) {
      form.cow_id = inputData.cow_id;
      form.cow_name = inputData.cow_name || '';
      form.weight_kg = inputData.weight_kg;
      form.milk_yield_liters = inputData.milk_yield_liters;
      form.milk_fat_percentage = inputData.milk_fat_percentage;
      form.lactation_stage = inputData.lactation_stage;
      form.body_condition_score = inputData.body_condition_score ?? 3;
      form.age_months = inputData.age_months;
      form.is_pregnant = inputData.is_pregnant ?? false;
      form.pregnancy_month = inputData.pregnancy_month;
      form.activity_level = inputData.activity_level ?? 'normal';
      form.optimization_goal = inputData.optimization_goal;
      form.available_feeds = inputData.available_feeds;
      form.feed_constraints = inputData.feed_constraints;
      form.budget_per_day = inputData.budget_per_day;
      inputMode.value = inputData.cow_id ? 'select' : 'manual';
    }
  } else if (queryCowId) {
    // Pre-select cow if from query
    inputMode.value = 'select';
    onCowSelected(queryCowId);
  }
});
</script>

<style lang="scss" scoped>
.diet-stepper {
  border-radius: $radius-loose;

  // On mobile vertical mode: full-width content
  @media (max-width: 599px) {
    border-radius: 0;

    // Hide the vertical connector line between steps — it steals horizontal space
    :deep(.q-stepper__dot::before),
    :deep(.q-stepper__dot::after) {
      display: none !important;
    }

    // Reduce the left indent so step content uses full width
    :deep(.q-stepper__step-inner) {
      padding: 0 12px 24px 12px;
    }

    // Compact step header
    :deep(.q-stepper__tab) {
      padding: 10px 12px;
      min-height: auto;
    }

    // Navigation buttons full-width
    :deep(.q-stepper__nav) {
      padding: 16px 12px 8px;
    }
  }
}

.rounded-borders {
  border-radius: $radius-loose;
  overflow: hidden;
}
</style>
