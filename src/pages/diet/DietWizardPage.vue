<template>
  <q-page :class="$q.screen.lt.md ? 'q-pa-none' : 'q-pa-md'">
    <!-- Stepper -->
    <q-stepper
      ref="stepper"
      v-model="step"
      color="primary"
      animated
      flat
      :bordered="!$q.screen.lt.md"
      :vertical="$q.screen.lt.md"
      :alternative-labels="!$q.screen.lt.md"
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
            <div class="text-caption text-grey-6 q-mt-xs">
              {{ $t('diet.wizard.ageDisclaimer') }}
            </div>
          </div>
        </div>
      </q-step>

      <!-- Step 3: Optimization Goal -->
      <q-step :name="3" :title="$t('diet.wizard.stepGoal')" icon="flag" :done="step > 3">
        <div class="text-subtitle1 q-mb-md">{{ $t('diet.wizard.whatToOptimize') }}</div>

        <div class="q-gutter-y-sm">
          <q-card
            v-for="opt in goalOptions"
            :key="opt.value"
            flat
            bordered
            :class="[
              'goal-option cursor-pointer',
              form.optimization_goal === opt.value ? 'goal-option--active' : ''
            ]"
            @click="form.optimization_goal = opt.value; onGoalChanged()"
          >
            <q-card-section class="row items-center no-wrap q-pa-sm">
              <q-radio
                :model-value="form.optimization_goal"
                :val="opt.value"
                dense
                class="q-mr-sm"
              />
              <q-avatar :color="opt.color + '-1'" size="36px" class="q-mr-sm">
                <q-icon :name="opt.icon" :color="opt.color" size="20px" />
              </q-avatar>
              <div class="col">
                <div class="text-body2 text-weight-medium">{{ opt.label }}</div>
                <div class="text-caption text-grey-7">{{ opt.description }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Minimize Cost → Budget chips -->
        <div v-if="form.optimization_goal === 'minimize_cost'" class="q-mt-md">
          <div class="text-body2 q-mb-sm">{{ $t('diet.wizard.selectBudget') }}</div>
          <div class="q-gutter-sm">
            <q-chip
              v-for="opt in budgetOptions"
              :key="opt.value"
              :outline="selectedBudgetChip !== opt.value"
              :color="selectedBudgetChip === opt.value ? 'primary' : undefined"
              :text-color="selectedBudgetChip === opt.value ? 'white' : undefined"
              clickable
              @click="selectBudget(opt.value)"
            >
              {{ opt.label }}
            </q-chip>
          </div>
          <q-input
            v-if="selectedBudgetChip === 'custom'"
            v-model.number="form.budget_per_day"
            :label="$t('diet.wizard.dailyBudgetOptional')"
            type="number"
            outlined
            dense
            :prefix="getCurrencySymbol()"
            class="q-mt-sm"
            style="max-width: 200px"
          />
        </div>

        <!-- Maximize Milk → Target milk yield chips -->
        <div v-if="form.optimization_goal === 'maximize_milk'" class="q-mt-md">
          <div class="text-body2 q-mb-sm">{{ $t('diet.wizard.targetMilkYield') }}</div>
          <div class="q-gutter-sm">
            <q-chip
              v-for="opt in milkTargetOptions"
              :key="opt.value"
              :outline="selectedMilkTargetChip !== opt.value"
              :color="selectedMilkTargetChip === opt.value ? 'primary' : undefined"
              :text-color="selectedMilkTargetChip === opt.value ? 'white' : undefined"
              clickable
              @click="selectMilkTarget(opt.value)"
            >
              {{ opt.label }}
            </q-chip>
          </div>
          <q-input
            v-if="selectedMilkTargetChip === 'custom'"
            v-model.number="form.target_milk_yield"
            :label="$t('diet.wizard.targetMilkYield')"
            type="number"
            step="0.5"
            outlined
            dense
            :suffix="$t('units.l') + '/' + $t('units.perDay').replace('/', '')"
            class="q-mt-sm"
            style="max-width: 200px"
          />
        </div>
      </q-step>

      <!-- Step 4: Select Feeds -->
      <q-step :name="4" :title="$t('diet.wizard.stepFeeds')" icon="grass" :done="step > 4">
        <div class="text-subtitle1 q-mb-md">{{ $t('diet.wizard.selectAvailableFeeds', { count: effectiveFeedIds.length }) }}</div>

        <!-- Auto / Manual toggle -->
        <q-option-group
          v-model="feedSelectionMode"
          :options="feedModeOptions"
          color="primary"
          inline
          class="q-mb-md"
        />

        <!-- Auto mode: show selected feed chips -->
        <template v-if="feedSelectionMode === 'auto'">
          <div class="text-body2 text-grey-7 q-mb-sm">
            {{ $t('diet.wizard.autoSelectExplain', { count: autoSelectedFeeds.length, goal: formatGoal(form.optimization_goal) }) }}
          </div>
          <div class="q-gutter-sm">
            <q-chip
              v-for="feed in autoSelectedFeeds"
              :key="feed.id"
              dense
              outline
              color="primary"
            >
              {{ getFeedDisplayName(feed, locale) }}
              <span v-if="feed.price_per_kg" class="text-caption q-ml-xs">
                {{ formatCurrency(feed.price_per_kg) }}/kg
              </span>
            </q-chip>
          </div>
        </template>

        <!-- Manual mode: search + category accordions -->
        <template v-else>
          <div class="row items-center q-mb-sm">
            <q-badge v-if="form.available_feeds.length > 0" color="primary" class="q-mr-sm">
              {{ form.available_feeds.length }} {{ $t('diet.wizard.feedsSelected') }}
            </q-badge>
            <q-space />
            <q-btn
              v-if="form.available_feeds.length > 0"
              flat
              dense
              size="sm"
              color="negative"
              :label="$t('common.clearAll')"
              icon="clear_all"
              no-caps
              @click="form.available_feeds = []"
            />
          </div>

          <q-input
            v-model="feedSearch"
            :label="$t('diet.wizard.searchFeeds')"
            outlined
            dense
            clearable
            class="q-mb-md"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>

          <q-list>
            <q-expansion-item
              v-for="cat in feedCategories"
              :key="cat.name"
              :label="cat.name"
              :caption="$t('diet.wizard.feedCategoryCount', { selected: countSelectedInCategory(cat.feeds), total: cat.feeds.length })"
              group="feed-categories"
              header-class="text-weight-medium"
            >
              <q-card>
                <q-card-section class="q-pa-sm">
                  <q-list dense>
                    <q-item v-for="feed in cat.feeds" :key="feed.id" tag="label">
                      <q-item-section side>
                        <q-checkbox v-model="form.available_feeds" :val="feed.id" color="primary" />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>{{ getFeedDisplayName(feed, locale) }}</q-item-label>
                        <q-item-label v-if="getFeedSecondaryName(feed, locale)" caption class="text-italic">
                          {{ getFeedSecondaryName(feed, locale) }}
                        </q-item-label>
                        <q-item-label v-if="feed.price_per_kg" caption>
                          {{ formatCurrency(feed.price_per_kg) }}/kg
                        </q-item-label>
                      </q-item-section>
                      <q-item-section v-if="form.available_feeds.includes(feed.id)" side>
                        <q-input
                          :model-value="feedPriceOverrides[feed.id] ?? feed.price_per_kg ?? ''"
                          type="number"
                          dense
                          outlined
                          :prefix="currencySymbol"
                          style="width: 100px"
                          :placeholder="String(feed.price_per_kg ?? '')"
                          @update:model-value="setFeedPrice(feed.id, $event)"
                        />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-card-section>
              </q-card>
            </q-expansion-item>
          </q-list>
        </template>
      </q-step>

      <!-- Step 5: Review & Submit -->
      <q-step :name="5" :title="$t('diet.wizard.stepReview')" icon="check">
        <div class="text-subtitle1 q-mb-md">{{ $t('diet.wizard.reviewAndGenerate') }}</div>

        <q-card flat bordered class="q-mb-md">
          <q-list>
            <q-item>
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white" size="36px">
                  <q-icon :name="COW_ICON" size="20px" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label caption>{{ $t('diet.wizard.cow') }}</q-item-label>
                <q-item-label>{{ form.cow_name || $t('diet.wizard.manualEntry') }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-avatar color="grey-3" text-color="grey-8" size="36px">
                  <q-icon name="monitor_weight" size="20px" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label caption>{{ $t('diet.wizard.weightMilkYield') }}</q-item-label>
                <q-item-label>{{ form.weight_kg }} {{ $t('diet.kg') }} · {{ form.milk_yield_liters }} {{ $t('units.l') }}/{{ $t('units.perDay').replace('/', '') }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-avatar color="grey-3" text-color="grey-8" size="36px">
                  <q-icon name="straighten" size="20px" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label caption>{{ $t('diet.wizard.bcsAndAge') }}</q-item-label>
                <q-item-label>{{ $t('cow.bcsValue', { score: form.body_condition_score }) }} · {{ form.age_months ? $t('diet.wizard.ageMonthsValue', { months: form.age_months }) : $t('diet.wizard.notSpecified') }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-avatar color="grey-3" text-color="grey-8" size="36px">
                  <q-icon name="grass" size="20px" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label caption>{{ $t('diet.wizard.selectedFeeds') }}</q-item-label>
                <q-item-label>
                  {{ effectiveFeedIds.length }} {{ $t('diet.wizard.feedsSelected') }}
                  <q-badge v-if="feedSelectionMode === 'auto'" color="primary" class="q-ml-xs">
                    {{ $t('diet.wizard.autoSelect') }}
                  </q-badge>
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section avatar>
                <q-avatar :color="reviewGoalColor" text-color="white" size="36px">
                  <q-icon :name="reviewGoalIcon" size="20px" />
                </q-avatar>
              </q-item-section>
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
            :style="!canProceed ? 'opacity: 0.4' : undefined"
            @click="onStepNext"
          />
          <q-btn
            v-else
            color="primary"
            :label="$t('diet.wizard.generateDiet')"
            :loading="optimizing"
            :disable="!isOnline || effectiveFeedIds.length < 2"
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
import { useAutoFeedSelection } from 'src/composables/useAutoFeedSelection';
import { getFeedDisplayName, getFeedSecondaryName } from 'src/composables/useFeedDisplayName';

const { t, locale } = useI18n();
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
const queryAutoFeeds = route.query.autoFeeds === 'true';

const form = reactive<DietInput>({
  cow_id: queryCowId,
  cow_name: '',
  diet_name: undefined,
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
  target_milk_yield: undefined,
});

// Feed price overrides (user-editable prices per feed)
const feedPriceOverrides = reactive<Record<string, number>>({});
const currencySymbol = computed(() => getCurrencySymbol());

// --- Auto / Manual feed selection ---
const feedSelectionMode = ref<'auto' | 'manual'>('auto');
const goalRef = computed(() => form.optimization_goal);
const { autoSelectedFeeds, autoSelectedFeedIds } = useAutoFeedSelection(goalRef);

const feedModeOptions = computed(() => [
  { label: t('diet.wizard.autoSelect'), value: 'auto' },
  { label: t('diet.wizard.chooseManually'), value: 'manual' },
]);

/** The feed IDs that will actually be sent — depends on mode */
const effectiveFeedIds = computed(() =>
  feedSelectionMode.value === 'auto' ? autoSelectedFeedIds.value : form.available_feeds
);

// --- Goal parameter chips ---
const selectedBudgetChip = ref<number | 'custom'>(0);
const selectedMilkTargetChip = ref<number | 'custom'>(0);

const budgetOptions = computed(() => {
  const symbol = getCurrencySymbol();
  return [
    { label: `${symbol}100`, value: 100 },
    { label: `${symbol}150`, value: 150 },
    { label: `${symbol}200`, value: 200 },
    { label: `${symbol}250`, value: 250 },
    { label: `${symbol}300`, value: 300 },
    { label: t('diet.wizard.customValue'), value: 'custom' as const },
  ];
});

const milkTargetOptions = computed(() => {
  const current = form.milk_yield_liters || 10;
  const pct20 = Math.round((current * 1.2) * 2) / 2;
  const pct40 = Math.round((current * 1.4) * 2) / 2;
  const pct60 = Math.round((current * 1.6) * 2) / 2;
  return [
    { label: t('diet.wizard.milkTarget', { liters: pct20, percent: 20 }), value: pct20 },
    { label: t('diet.wizard.milkTarget', { liters: pct40, percent: 40 }), value: pct40 },
    { label: t('diet.wizard.milkTarget', { liters: pct60, percent: 60 }), value: pct60 },
    { label: t('diet.wizard.customValue'), value: 'custom' as const },
  ];
});

function selectBudget(value: number | 'custom') {
  selectedBudgetChip.value = value;
  if (value !== 'custom') {
    form.budget_per_day = value;
  }
}

function selectMilkTarget(value: number | 'custom') {
  selectedMilkTargetChip.value = value;
  if (value !== 'custom') {
    form.target_milk_yield = value;
  }
}

function onGoalChanged() {
  // Reset goal-specific params when switching
  selectedBudgetChip.value = 0;
  selectedMilkTargetChip.value = 0;
  form.budget_per_day = undefined;
  form.target_milk_yield = undefined;

  // Auto-select a default budget based on cow weight for minimize_cost
  if (form.optimization_goal === 'minimize_cost') {
    const weight = form.weight_kg || 400;
    const defaultBudget = weight < 350 ? 150 : weight <= 500 ? 200 : 250;
    selectBudget(defaultBudget);
  }
  // Auto-select +20% for maximize_milk
  if (form.optimization_goal === 'maximize_milk') {
    const current = form.milk_yield_liters || 10;
    const target = Math.round((current * 1.2) * 2) / 2;
    selectMilkTarget(target);
  }
}

function setFeedPrice(feedId: string, value: string | number | null) {
  if (value === null || value === '') {
    delete feedPriceOverrides[feedId];
  } else {
    const num = Number(value);
    // Ignore negative or unreasonably large prices
    if (num >= 0 && num <= 100000) {
      feedPriceOverrides[feedId] = num;
    }
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
      (f.fd_name && f.fd_name.toLowerCase().includes(query)) ||
      (f.local_name && f.local_name.toLowerCase().includes(query)) ||
      f.category.toLowerCase().includes(query)
  );
});

interface FeedCategory {
  name: string;
  feeds: typeof feedsStore.allFeeds;
}

const feedCategories = computed<FeedCategory[]>(() => {
  const grouped: Record<string, typeof feedsStore.allFeeds> = {};
  for (const feed of filteredFeeds.value) {
    const cat = feed.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(feed);
  }
  return Object.entries(grouped)
    .map(([name, feeds]) => ({ name, feeds }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

function countSelectedInCategory(feeds: typeof feedsStore.allFeeds): number {
  return feeds.filter((f) => form.available_feeds.includes(f.id)).length;
}

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

/** Goal icon/color for the review step */
const reviewGoalIcon = computed(() => {
  const opt = goalOptions.value.find((g) => g.value === form.optimization_goal);
  return opt?.icon || 'flag';
});
const reviewGoalColor = computed(() => {
  const opt = goalOptions.value.find((g) => g.value === form.optimization_goal);
  return opt?.color || 'primary';
});

const canProceed = computed(() => {
  switch (step.value) {
    case 1:
      if (inputMode.value === 'manual') return true;
      if (inputMode.value === 'farmer') return !!selectedFarmerId.value && !!form.cow_id;
      return !!form.cow_id;
    case 2:
      return form.weight_kg > 0;
    case 3:
      return !!form.optimization_goal;
    case 4:
      return effectiveFeedIds.value.length >= 2;
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

  // Auto-generate a meaningful name if none set
  if (!form.diet_name) {
    const goalLabel = formatGoal(form.optimization_goal);
    if (form.cow_name) {
      form.diet_name = `${form.cow_name} — ${goalLabel}`;
    } else {
      const dateStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      form.diet_name = `${goalLabel} — ${dateStr}`;
    }
  }

  // Use effective feed IDs (auto or manual)
  form.available_feeds = [...effectiveFeedIds.value];
  // Attach any user price overrides to the form
  if (Object.keys(feedPriceOverrides).length > 0) {
    form.feed_price_overrides = { ...feedPriceOverrides };
  }
  const diet = await dietsStore.optimizeDiet(form);

  if (diet && diet.status !== 'failed') {
    success(); // Haptic feedback on successful operation
    $q.notify({
      type: 'positive',
      message: t('diet.wizard.dietStarted'),
    });
    router.push(`/diet/${diet.id}`);
  } else if (diet && diet.status === 'failed') {
    hapticError();
    $q.notify({
      type: 'warning',
      message: t('diet.wizard.optimizationFailed'),
      timeout: 6000,
    });
    router.push(`/diet/${diet.id}`);
  } else {
    hapticError(); // Haptic feedback on error
    $q.notify({
      type: 'negative',
      message: dietsStore.error || t('diet.wizard.generationFailed'),
      timeout: 6000,
    });
  }
}

onMounted(async () => {
  await Promise.all([
    cowsStore.fetchCows(),
    feedsStore.fetchAllFeeds(),
    farmersStore.fetchFarmers(),
  ]);

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
      form.target_milk_yield = inputData.target_milk_yield;
      inputMode.value = inputData.cow_id ? 'select' : 'manual';
      // Show the restored feeds in manual mode (auto mode would ignore them)
      if (inputData.available_feeds.length > 0) {
        feedSelectionMode.value = 'manual';
      }
      // Sync chip state with restored values
      if (inputData.budget_per_day) {
        const presetBudget = [100, 150, 200, 250, 300].includes(inputData.budget_per_day);
        selectedBudgetChip.value = presetBudget ? inputData.budget_per_day : 'custom';
      }
      if (inputData.target_milk_yield) {
        const current = inputData.milk_yield_liters || 10;
        const presets = [1.2, 1.4, 1.6].map((m) => Math.round((current * m) * 2) / 2);
        const matchIdx = presets.indexOf(inputData.target_milk_yield);
        selectedMilkTargetChip.value = matchIdx >= 0 ? presets[matchIdx] : 'custom';
      }
    }
  } else if (queryCowId) {
    // Pre-select cow if from query
    inputMode.value = 'select';
    onCowSelected(queryCowId);
  } else if (cowOptions.value.length === 1) {
    // Auto-select when user has only 1 cow
    inputMode.value = 'select';
    onCowSelected(cowOptions.value[0].value);
  }

  // Handle ?autoFeeds=true from failure retry flow
  if (queryAutoFeeds) {
    feedSelectionMode.value = 'auto';
    // Auto-advance to Review step if cow data is already filled (retry flow)
    if (form.cow_id && form.weight_kg > 0) {
      step.value = 5;
    }
  }
});
</script>

<style lang="scss" scoped>
.diet-stepper {
  border-radius: $radius-loose;

  // On vertical mode (mobile + tablet): full-width content
  @media (max-width: 1023px) {
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

// Desktop: prevent empty space below wizard content
@media (min-width: 1024px) {
  :deep(.q-stepper__content) {
    min-height: 50vh;
  }
}

.rounded-borders {
  border-radius: $radius-loose;
  overflow: hidden;
}

// Goal option cards (Step 3)
// Dark mode override for .goal-option--active lives in app.scss (.body--dark block)
// because scoped :global(.body--dark) compiles incorrectly in Vue/Quasar.
.goal-option {
  transition: border-color 0.2s, background 0.2s;
}
.goal-option--active {
  border-color: var(--q-primary);
  background: color-mix(in srgb, var(--q-primary) 4%, transparent);
}
</style>
