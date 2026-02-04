<template>
  <q-page class="q-pa-md">
    <!-- Stepper -->
    <q-stepper
      v-model="step"
      ref="stepper"
      color="primary"
      animated
      flat
      bordered
      class="diet-stepper"
    >
      <!-- Step 1: Select Cow -->
      <q-step :name="1" title="Cow" icon="pets" :done="step > 1">
        <div class="text-subtitle1 q-mb-md">Select a cow or enter details manually</div>

        <q-option-group
          v-model="inputMode"
          :options="[
            { label: 'Select from my cows', value: 'select' },
            { label: 'Enter manually', value: 'manual' },
          ]"
          color="primary"
          class="q-mb-md"
        />

        <template v-if="inputMode === 'select'">
          <q-select
            v-model="form.cow_id"
            label="Select Cow"
            outlined
            :options="cowOptions"
            emit-value
            map-options
            @update:model-value="onCowSelected"
          />
        </template>

        <template v-else>
          <q-input
            v-model="form.cow_name"
            label="Cow Name (optional)"
            outlined
            class="q-mb-sm"
          />
        </template>
      </q-step>

      <!-- Step 2: Animal Details -->
      <q-step :name="2" title="Details" icon="info" :done="step > 2">
        <div class="text-subtitle1 q-mb-md">Animal Information</div>

        <div class="row q-col-gutter-sm">
          <div class="col-6">
            <q-input
              v-model.number="form.weight_kg"
              label="Weight (kg)"
              type="number"
              outlined
              :rules="[(val) => val > 0 || 'Required']"
            />
          </div>
          <div class="col-6">
            <q-input
              v-model.number="form.milk_yield_liters"
              label="Milk Yield (L/day)"
              type="number"
              step="0.1"
              outlined
            />
          </div>
        </div>

        <div class="row q-col-gutter-sm q-mt-sm">
          <div class="col-6">
            <q-input
              v-model.number="form.milk_fat_percentage"
              label="Milk Fat %"
              type="number"
              step="0.1"
              outlined
            />
          </div>
          <div class="col-6">
            <q-select
              v-model="form.lactation_stage"
              label="Lactation Stage"
              outlined
              :options="lactationOptions"
              emit-value
              map-options
            />
          </div>
        </div>

        <q-toggle v-model="form.is_pregnant" label="Pregnant" class="q-mt-sm" />

        <q-input
          v-if="form.is_pregnant"
          v-model.number="form.pregnancy_month"
          label="Pregnancy Month"
          type="number"
          outlined
          class="q-mt-sm"
        />
      </q-step>

      <!-- Step 3: Select Feeds -->
      <q-step :name="3" title="Feeds" icon="grass" :done="step > 3">
        <div class="text-subtitle1 q-mb-md">
          Select available feeds ({{ form.available_feeds.length }} selected)
        </div>

        <q-input
          v-model="feedSearch"
          outlined
          dense
          placeholder="Search feeds..."
          class="q-mb-md"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>

        <q-list bordered separator class="rounded-borders" style="max-height: 300px; overflow: auto">
          <q-item
            v-for="feed in filteredFeeds"
            :key="feed.id"
            tag="label"
            v-ripple
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
                {{ feed.category }} · CP: {{ feed.cp_percentage }}% · TDN: {{ feed.tdn_percentage }}%
              </q-item-label>
            </q-item-section>
            <q-item-section side v-if="feed.price_per_kg">
              <q-item-label caption>₹{{ feed.price_per_kg }}/kg</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <q-banner v-if="form.available_feeds.length < 3" class="bg-warning text-white q-mt-md" rounded>
          Select at least 3 feeds for better optimization results
        </q-banner>
      </q-step>

      <!-- Step 4: Optimization Goal -->
      <q-step :name="4" title="Goal" icon="flag" :done="step > 4">
        <div class="text-subtitle1 q-mb-md">What do you want to optimize?</div>

        <q-option-group
          v-model="form.optimization_goal"
          :options="goalOptions"
          color="primary"
        >
          <template v-slot:label="opt">
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
          label="Daily Budget (optional)"
          type="number"
          outlined
          prefix="₹"
          hint="Leave empty for no budget limit"
          class="q-mt-lg"
        />
      </q-step>

      <!-- Step 5: Review & Submit -->
      <q-step :name="5" title="Review" icon="check">
        <div class="text-subtitle1 q-mb-md">Review and Generate Diet</div>

        <q-card flat bordered class="q-mb-md">
          <q-list>
            <q-item>
              <q-item-section>
                <q-item-label caption>Cow</q-item-label>
                <q-item-label>{{ form.cow_name || 'Manual Entry' }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>Weight / Milk Yield</q-item-label>
                <q-item-label>{{ form.weight_kg }} kg / {{ form.milk_yield_liters }} L/day</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>Selected Feeds</q-item-label>
                <q-item-label>{{ form.available_feeds.length }} feeds</q-item-label>
              </q-item-section>
            </q-item>
            <q-item>
              <q-item-section>
                <q-item-label caption>Optimization Goal</q-item-label>
                <q-item-label class="text-capitalize">{{ formatGoal(form.optimization_goal) }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Offline Warning -->
        <q-banner v-if="!isOnline" class="bg-warning text-white q-mb-md" rounded>
          <template v-slot:avatar>
            <q-icon name="cloud_off" />
          </template>
          Diet optimization requires an internet connection. Please go online to continue.
        </q-banner>
      </q-step>

      <!-- Navigation -->
      <template v-slot:navigation>
        <q-stepper-navigation>
          <q-btn
            v-if="step > 1"
            flat
            color="primary"
            label="Back"
            @click="stepper?.previous()"
            class="q-mr-sm"
          />
          <q-btn
            v-if="step < 5"
            color="primary"
            label="Continue"
            @click="stepper?.next()"
            :disable="!canProceed"
          />
          <q-btn
            v-else
            color="primary"
            label="Generate Diet"
            @click="submitDiet"
            :loading="optimizing"
            :disable="!isOnline || form.available_feeds.length < 2"
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
import { useDietsStore, DietInput } from 'src/stores/diets';
import { useCowsStore } from 'src/stores/cows';
import { useFeedsStore } from 'src/stores/feeds';
import { isOnline } from 'src/boot/pwa';

// Template refs
const stepper = ref<QStepper | null>(null);

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const dietsStore = useDietsStore();
const cowsStore = useCowsStore();
const feedsStore = useFeedsStore();

const step = ref(1);
const inputMode = ref<'select' | 'manual'>('select');
const feedSearch = ref('');

const queryCowId = route.query.cow_id as string | undefined;

const form = reactive<DietInput>({
  cow_id: queryCowId,
  cow_name: '',
  weight_kg: 400,
  milk_yield_liters: 10,
  milk_fat_percentage: 4.0,
  lactation_stage: 'mid',
  is_pregnant: false,
  pregnancy_month: undefined,
  activity_level: 'normal',
  optimization_goal: 'balanced',
  available_feeds: [],
  budget_per_day: undefined,
});

const optimizing = computed(() => dietsStore.optimizing);

const cowOptions = computed(() =>
  cowsStore.activeCows.map((cow) => ({
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

const lactationOptions = [
  { label: 'Early (0-100 days)', value: 'early' },
  { label: 'Mid (100-200 days)', value: 'mid' },
  { label: 'Late (200+ days)', value: 'late' },
  { label: 'Dry', value: 'dry' },
];

const goalOptions = [
  {
    label: 'Minimize Cost',
    value: 'minimize_cost',
    icon: 'savings',
    color: 'positive',
    description: 'Get the cheapest diet that meets nutritional needs',
  },
  {
    label: 'Maximize Milk',
    value: 'maximize_milk',
    icon: 'water_drop',
    color: 'primary',
    description: 'Optimize for maximum milk production',
  },
  {
    label: 'Balanced',
    value: 'balanced',
    icon: 'balance',
    color: 'secondary',
    description: 'Balance between cost and production',
  },
];

const canProceed = computed(() => {
  switch (step.value) {
    case 1:
      return inputMode.value === 'manual' || form.cow_id;
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

function onCowSelected(cowId: string) {
  const cow = cowsStore.activeCows.find((c) => c.id === cowId);
  if (cow) {
    form.cow_name = cow.name;
    form.weight_kg = cow.weight_kg;
    form.milk_yield_liters = cow.milk_yield_liters;
    form.milk_fat_percentage = cow.milk_fat_percentage;
    form.lactation_stage = cow.lactation_stage;
    form.is_pregnant = cow.is_pregnant;
    form.pregnancy_month = cow.pregnancy_month;
    form.activity_level = cow.activity_level;
  }
}

function formatGoal(goal: string): string {
  const goals: Record<string, string> = {
    minimize_cost: 'Minimize Cost',
    maximize_milk: 'Maximize Milk',
    balanced: 'Balanced',
  };
  return goals[goal] || goal;
}

async function submitDiet() {
  const diet = await dietsStore.optimizeDiet(form);

  if (diet) {
    $q.notify({
      type: 'positive',
      message: 'Diet optimization started!',
    });
    router.push(`/diet/${diet.id}`);
  }
}

onMounted(async () => {
  await cowsStore.fetchCows();
  await feedsStore.fetchAllFeeds();

  // Pre-select cow if from query
  if (queryCowId) {
    inputMode.value = 'select';
    onCowSelected(queryCowId);
  }
});
</script>

<style lang="scss" scoped>
.diet-stepper {
  border-radius: 12px;
}

.rounded-borders {
  border-radius: 12px;
  overflow: hidden;
}
</style>
