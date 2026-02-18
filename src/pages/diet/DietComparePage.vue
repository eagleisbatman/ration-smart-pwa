<template>
  <q-page class="q-pa-md q-page--full-width">
    <!-- Loading -->
    <template v-if="loading">
      <SkeletonCard />
    </template>

    <!-- Empty state: fewer than 2 completed diets -->
    <template v-else-if="completedDietOptions.length < 2">
      <EmptyState
        icon="compare_arrows"
        icon-color="grey-5"
        :title="$t('diet.compareDiets')"
        :description="$t('diet.noDietsToCompare')"
        :action-label="$t('diet.createDiet')"
        action-icon="add"
        @action="router.push('/diet/new')"
      />
    </template>

    <!-- Compare View -->
    <template v-else>
      <!-- Diet Selectors -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-subtitle1 q-mb-sm">{{ $t('diet.compareDiets') }}</div>
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-select
                v-model="selectedDietA"
                :options="completedDietOptions"
                :label="$t('diet.selectDietA')"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                outlined
                dense
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="selectedDietB"
                :options="completedDietOptions"
                :label="$t('diet.selectDietB')"
                option-value="value"
                option-label="label"
                emit-value
                map-options
                outlined
                dense
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Comparison Content -->
      <template v-if="dietA && dietB">
        <!-- Summary Comparison -->
        <div class="text-subtitle1 q-mb-sm">{{ $t('diet.costDifference') }}</div>
        <div class="row q-col-gutter-sm q-mb-md">
          <!-- Cost -->
          <div class="col-4">
            <q-card flat bordered class="q-pa-sm">
              <div class="text-caption text-grey-7 text-center">{{ $t('diet.dailyCost') }}</div>
              <div class="row items-center justify-center q-mt-xs">
                <div class="text-center col">
                  <div class="text-body1 text-weight-bold text-primary">{{ formatCurrency(dietA.total_cost ?? 0) }}</div>
                  <div class="text-caption text-grey-6">A</div>
                </div>
                <div class="col-auto q-px-xs">
                  <q-icon
                    :name="costDiff < 0 ? 'arrow_downward' : costDiff > 0 ? 'arrow_upward' : 'drag_handle'"
                    :color="costDiff < 0 ? 'positive' : costDiff > 0 ? 'negative' : 'grey'"
                    size="xs"
                  />
                  <span
                    class="text-caption"
                    :class="costDiff < 0 ? 'text-positive' : costDiff > 0 ? 'text-negative' : 'text-grey'"
                  >
                    {{ Math.abs(costDiff).toFixed(1) }}%
                  </span>
                </div>
                <div class="text-center col">
                  <div class="text-body1 text-weight-bold text-primary">{{ formatCurrency(dietB.total_cost ?? 0) }}</div>
                  <div class="text-caption text-grey-6">B</div>
                </div>
              </div>
              <div v-if="costDiff !== 0" class="text-caption text-center q-mt-xs" :class="costDiff < 0 ? 'text-positive' : 'text-negative'">
                {{ costDiff < 0 ? $t('diet.cheaper') : $t('diet.moreExpensive') }}
              </div>
            </q-card>
          </div>

          <!-- DM Intake -->
          <div class="col-4">
            <q-card flat bordered class="q-pa-sm">
              <div class="text-caption text-grey-7 text-center">{{ $t('diet.dryMatterIntake') }}</div>
              <div class="row items-center justify-center q-mt-xs">
                <div class="text-center col">
                  <div class="text-body1 text-weight-bold text-secondary">{{ dietA.dm_intake?.toFixed(1) ?? '0' }}</div>
                  <div class="text-caption text-grey-6">A</div>
                </div>
                <div class="col-auto q-px-xs">
                  <q-icon
                    :name="dmDiff > 0 ? 'arrow_upward' : dmDiff < 0 ? 'arrow_downward' : 'drag_handle'"
                    :color="dmDiff > 0 ? 'positive' : dmDiff < 0 ? 'negative' : 'grey'"
                    size="xs"
                  />
                  <span
                    class="text-caption"
                    :class="dmDiff > 0 ? 'text-positive' : dmDiff < 0 ? 'text-negative' : 'text-grey'"
                  >
                    {{ Math.abs(dmDiff).toFixed(1) }}%
                  </span>
                </div>
                <div class="text-center col">
                  <div class="text-body1 text-weight-bold text-secondary">{{ dietB.dm_intake?.toFixed(1) ?? '0' }}</div>
                  <div class="text-caption text-grey-6">B</div>
                </div>
              </div>
              <div v-if="dmDiff !== 0" class="text-caption text-center q-mt-xs" :class="dmDiff > 0 ? 'text-positive' : 'text-negative'">
                {{ dmDiff > 0 ? $t('diet.moreDM') : $t('diet.lessDM') }}
              </div>
            </q-card>
          </div>

          <!-- Feed Count -->
          <div class="col-4">
            <q-card flat bordered class="q-pa-sm">
              <div class="text-caption text-grey-7 text-center">{{ $t('diet.feeds') }}</div>
              <div class="row items-center justify-center q-mt-xs">
                <div class="text-center col">
                  <div class="text-body1 text-weight-bold text-accent">{{ resultDataA.feeds?.length ?? 0 }}</div>
                  <div class="text-caption text-grey-6">A</div>
                </div>
                <div class="col-auto q-px-sm">
                  <q-icon name="drag_handle" color="grey" size="xs" />
                </div>
                <div class="text-center col">
                  <div class="text-body1 text-weight-bold text-accent">{{ resultDataB.feeds?.length ?? 0 }}</div>
                  <div class="text-caption text-grey-6">B</div>
                </div>
              </div>
            </q-card>
          </div>
        </div>

        <!-- Nutrient Balance Comparison -->
        <div class="text-subtitle1 q-mb-sm">{{ $t('diet.nutrientBalance') }}</div>
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <!-- Metabolizable Protein (MP) -->
            <div class="q-mb-md">
              <div class="text-caption text-grey-7 q-mb-xs">{{ $t('diet.metabolizableProtein') }}</div>
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <div class="row justify-between text-caption q-mb-xs">
                    <span>A</span>
                    <span>{{ mpDisplayA.supplied }} / {{ mpDisplayA.requirement }} g/day</span>
                  </div>
                  <q-linear-progress
                    :value="mpProgressA"
                    :color="mpProgressA >= 1 ? 'positive' : 'warning'"
                    rounded
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <div class="row justify-between text-caption q-mb-xs">
                    <span>B</span>
                    <span>{{ mpDisplayB.supplied }} / {{ mpDisplayB.requirement }} g/day</span>
                  </div>
                  <q-linear-progress
                    :value="mpProgressB"
                    :color="mpProgressB >= 1 ? 'positive' : 'warning'"
                    rounded
                  />
                </div>
              </div>
            </div>

            <!-- Net Energy Lactation (NEL) -->
            <div class="q-mb-md">
              <div class="text-caption text-grey-7 q-mb-xs">{{ $t('diet.netEnergyLactation') }}</div>
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <div class="row justify-between text-caption q-mb-xs">
                    <span>A</span>
                    <span>{{ nelDisplayA.supplied }} / {{ nelDisplayA.requirement }} Mcal/day</span>
                  </div>
                  <q-linear-progress
                    :value="nelProgressA"
                    :color="nelProgressA >= 1 ? 'positive' : 'warning'"
                    rounded
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <div class="row justify-between text-caption q-mb-xs">
                    <span>B</span>
                    <span>{{ nelDisplayB.supplied }} / {{ nelDisplayB.requirement }} Mcal/day</span>
                  </div>
                  <q-linear-progress
                    :value="nelProgressB"
                    :color="nelProgressB >= 1 ? 'positive' : 'warning'"
                    rounded
                  />
                </div>
              </div>
            </div>

            <!-- Calcium -->
            <div v-if="hasCaData" class="q-mb-md">
              <div class="text-caption text-grey-7 q-mb-xs">Calcium</div>
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <div class="row justify-between text-caption q-mb-xs">
                    <span>A</span>
                    <span>{{ caDisplayA.supplied }} / {{ caDisplayA.requirement }} g/day</span>
                  </div>
                  <q-linear-progress
                    :value="caProgressA"
                    :color="caProgressA >= 1 ? 'positive' : 'warning'"
                    rounded
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <div class="row justify-between text-caption q-mb-xs">
                    <span>B</span>
                    <span>{{ caDisplayB.supplied }} / {{ caDisplayB.requirement }} g/day</span>
                  </div>
                  <q-linear-progress
                    :value="caProgressB"
                    :color="caProgressB >= 1 ? 'positive' : 'warning'"
                    rounded
                  />
                </div>
              </div>
            </div>

            <!-- Phosphorus -->
            <div v-if="hasPData" class="q-mb-md">
              <div class="text-caption text-grey-7 q-mb-xs">Phosphorus</div>
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <div class="row justify-between text-caption q-mb-xs">
                    <span>A</span>
                    <span>{{ pDisplayA.supplied }} / {{ pDisplayA.requirement }} g/day</span>
                  </div>
                  <q-linear-progress
                    :value="pProgressA"
                    :color="pProgressA >= 1 ? 'positive' : 'warning'"
                    rounded
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <div class="row justify-between text-caption q-mb-xs">
                    <span>B</span>
                    <span>{{ pDisplayB.supplied }} / {{ pDisplayB.requirement }} g/day</span>
                  </div>
                  <q-linear-progress
                    :value="pProgressB"
                    :color="pProgressB >= 1 ? 'positive' : 'warning'"
                    rounded
                  />
                </div>
              </div>
            </div>

            <!-- Dry Matter Intake -->
            <div>
              <div class="text-caption text-grey-7 q-mb-xs">{{ $t('diet.dryMatterIntake') }}</div>
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <div class="row justify-between text-caption q-mb-xs">
                    <span>A</span>
                    <span>{{ resultDataA.nutrient_balance?.dm_supplied?.toFixed(2) ?? 0 }} / {{ resultDataA.nutrient_balance?.dm_requirement?.toFixed(2) ?? 0 }}{{ $t('diet.kg') }}</span>
                  </div>
                  <q-linear-progress
                    :value="dmProgressA"
                    :color="dmProgressA >= 0.95 && dmProgressA <= 1.05 ? 'positive' : 'warning'"
                    rounded
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <div class="row justify-between text-caption q-mb-xs">
                    <span>B</span>
                    <span>{{ resultDataB.nutrient_balance?.dm_supplied?.toFixed(2) ?? 0 }} / {{ resultDataB.nutrient_balance?.dm_requirement?.toFixed(2) ?? 0 }}{{ $t('diet.kg') }}</span>
                  </div>
                  <q-linear-progress
                    :value="dmProgressB"
                    :color="dmProgressB >= 0.95 && dmProgressB <= 1.05 ? 'positive' : 'warning'"
                    rounded
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Feed Comparison Table -->
        <div class="text-subtitle1 q-mb-sm">{{ $t('diet.feedComparison') }}</div>
        <q-card flat bordered class="q-mb-md">
          <q-list separator>
            <q-item v-for="feed in allFeeds" :key="feed.name" class="q-py-sm">
              <q-item-section>
                <q-item-label>
                  {{ feed.name }}
                  <q-badge
                    v-if="feed.onlyInA"
                    color="blue-3"
                    text-color="dark"
                    class="q-ml-xs"
                  >
                    {{ $t('diet.onlyInA') }}
                  </q-badge>
                  <q-badge
                    v-else-if="feed.onlyInB"
                    color="orange-3"
                    text-color="dark"
                    class="q-ml-xs"
                  >
                    {{ $t('diet.onlyInB') }}
                  </q-badge>
                  <q-badge
                    v-else
                    color="grey-3"
                    text-color="dark"
                    class="q-ml-xs"
                  >
                    {{ $t('diet.inBoth') }}
                  </q-badge>
                </q-item-label>
              </q-item-section>
              <q-item-section side class="text-right">
                <div class="row items-center q-gutter-sm">
                  <div class="text-caption compare-amount-col">
                    <div class="text-weight-bold" :class="feed.onlyInB ? 'text-grey-4' : ''">
                      {{ feed.amountA?.toFixed(2) ?? '-' }} {{ $t('diet.kg') }}
                    </div>
                    <div class="text-grey-6">A</div>
                  </div>
                  <div class="text-caption compare-amount-col">
                    <div class="text-weight-bold" :class="feed.onlyInA ? 'text-grey-4' : ''">
                      {{ feed.amountB?.toFixed(2) ?? '-' }} {{ $t('diet.kg') }}
                    </div>
                    <div class="text-grey-6">B</div>
                  </div>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </template>

      <!-- Prompt to select both diets -->
      <template v-else>
        <div class="text-center text-grey-6 q-pa-xl">
          <q-icon name="compare_arrows" size="64px" color="grey-4" />
          <div class="text-body1 q-mt-md">{{ $t('diet.selectDietA') }} & {{ $t('diet.selectDietB') }}</div>
        </div>
      </template>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { format } from 'date-fns';
import { useDietsStore } from 'src/stores/diets';
import { Diet } from 'src/lib/offline/db';
import SkeletonCard from 'src/components/ui/SkeletonCard.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';
import { useCurrency } from 'src/composables/useCurrency';

interface DietResultFeed {
  feed_id: string;
  feed_name: string;
  amount_kg: number;
  cost: number;
  dm_contribution: number;
  cp_contribution: number;
}

interface NutrientBalance {
  mp_supplied: number;
  mp_requirement: number;
  nel_supplied: number;
  nel_requirement: number;
  dm_supplied: number;
  dm_requirement: number;
  ca_supplied: number;
  ca_requirement: number;
  p_supplied: number;
  p_requirement: number;
  // Legacy fallbacks
  cp_supplied?: number;
  cp_requirement?: number;
  tdn_supplied?: number;
  tdn_requirement?: number;
}

interface DietResultData {
  feeds?: DietResultFeed[];
  nutrient_balance?: NutrientBalance;
  recommendations?: string[];
  warnings?: string[];
}

interface ComparedFeed {
  name: string;
  amountA: number | null;
  amountB: number | null;
  costA: number | null;
  costB: number | null;
  onlyInA: boolean;
  onlyInB: boolean;
}

const router = useRouter();
const route = useRoute();
const dietsStore = useDietsStore();
const { formatCurrency } = useCurrency();

const loading = ref(true);
const selectedDietA = ref<string | null>(null);
const selectedDietB = ref<string | null>(null);

// Computed: options for diet dropdowns
const completedDietOptions = computed(() =>
  dietsStore.completedDiets.map((d) => ({
    label: `${d.cow_name || 'Diet'} - ${formatDate(d.created_at)}`,
    value: d.id,
  }))
);

// Computed: the actual diet objects
const dietA = computed<Diet | null>(() => {
  if (!selectedDietA.value) return null;
  return dietsStore.completedDiets.find((d) => d.id === selectedDietA.value) ?? null;
});

const dietB = computed<Diet | null>(() => {
  if (!selectedDietB.value) return null;
  return dietsStore.completedDiets.find((d) => d.id === selectedDietB.value) ?? null;
});

// Computed: result data for each diet
const resultDataA = computed<DietResultData>(() => (dietA.value?.result_data as DietResultData) || {});
const resultDataB = computed<DietResultData>(() => (dietB.value?.result_data as DietResultData) || {});

// Cost difference: positive means B is more expensive, negative means B is cheaper
const costDiff = computed(() => {
  const costA = dietA.value?.total_cost ?? 0;
  const costB = dietB.value?.total_cost ?? 0;
  if (costA === 0) return 0;
  return ((costB - costA) / costA) * 100;
});

// DM difference: positive means B has more DM
const dmDiff = computed(() => {
  const dmA = dietA.value?.dm_intake ?? 0;
  const dmB = dietB.value?.dm_intake ?? 0;
  if (dmA === 0) return 0;
  return ((dmB - dmA) / dmA) * 100;
});

// Helper: convert kg to g for display (MP, Ca, P come in kg from backend)
function toGrams(val: number | undefined): string {
  if (!val) return '0';
  return (val * 1000).toFixed(0);
}

// MP display values (kg → g)
const mpDisplayA = computed(() => {
  const nb = resultDataA.value.nutrient_balance;
  return {
    supplied: toGrams(nb?.mp_supplied ?? nb?.cp_supplied),
    requirement: toGrams(nb?.mp_requirement ?? nb?.cp_requirement),
  };
});
const mpDisplayB = computed(() => {
  const nb = resultDataB.value.nutrient_balance;
  return {
    supplied: toGrams(nb?.mp_supplied ?? nb?.cp_supplied),
    requirement: toGrams(nb?.mp_requirement ?? nb?.cp_requirement),
  };
});

// NEL display values (Mcal/day — no conversion needed)
const nelDisplayA = computed(() => {
  const nb = resultDataA.value.nutrient_balance;
  return {
    supplied: (nb?.nel_supplied ?? nb?.tdn_supplied ?? 0).toFixed(1),
    requirement: (nb?.nel_requirement ?? nb?.tdn_requirement ?? 0).toFixed(1),
  };
});
const nelDisplayB = computed(() => {
  const nb = resultDataB.value.nutrient_balance;
  return {
    supplied: (nb?.nel_supplied ?? nb?.tdn_supplied ?? 0).toFixed(1),
    requirement: (nb?.nel_requirement ?? nb?.tdn_requirement ?? 0).toFixed(1),
  };
});

// Ca display (kg → g)
const caDisplayA = computed(() => {
  const nb = resultDataA.value.nutrient_balance;
  return { supplied: toGrams(nb?.ca_supplied), requirement: toGrams(nb?.ca_requirement) };
});
const caDisplayB = computed(() => {
  const nb = resultDataB.value.nutrient_balance;
  return { supplied: toGrams(nb?.ca_supplied), requirement: toGrams(nb?.ca_requirement) };
});

// P display (kg → g)
const pDisplayA = computed(() => {
  const nb = resultDataA.value.nutrient_balance;
  return { supplied: toGrams(nb?.p_supplied), requirement: toGrams(nb?.p_requirement) };
});
const pDisplayB = computed(() => {
  const nb = resultDataB.value.nutrient_balance;
  return { supplied: toGrams(nb?.p_supplied), requirement: toGrams(nb?.p_requirement) };
});

// Whether Ca/P data exists in either diet
const hasCaData = computed(() => {
  const nbA = resultDataA.value.nutrient_balance;
  const nbB = resultDataB.value.nutrient_balance;
  return (nbA?.ca_supplied ?? 0) > 0 || (nbB?.ca_supplied ?? 0) > 0;
});
const hasPData = computed(() => {
  const nbA = resultDataA.value.nutrient_balance;
  const nbB = resultDataB.value.nutrient_balance;
  return (nbA?.p_supplied ?? 0) > 0 || (nbB?.p_supplied ?? 0) > 0;
});

// Nutrient progress for diet A
const mpProgressA = computed(() => {
  const nb = resultDataA.value.nutrient_balance;
  const req = nb?.mp_requirement ?? nb?.cp_requirement;
  const sup = nb?.mp_supplied ?? nb?.cp_supplied;
  if (!req) return 0;
  return (sup ?? 0) / req;
});

const nelProgressA = computed(() => {
  const nb = resultDataA.value.nutrient_balance;
  const req = nb?.nel_requirement ?? nb?.tdn_requirement;
  const sup = nb?.nel_supplied ?? nb?.tdn_supplied;
  if (!req) return 0;
  return (sup ?? 0) / req;
});

const dmProgressA = computed(() => {
  const nb = resultDataA.value.nutrient_balance;
  if (!nb || !nb.dm_requirement) return 0;
  return nb.dm_supplied / nb.dm_requirement;
});

const caProgressA = computed(() => {
  const nb = resultDataA.value.nutrient_balance;
  if (!nb?.ca_requirement) return 0;
  return (nb.ca_supplied ?? 0) / nb.ca_requirement;
});

const pProgressA = computed(() => {
  const nb = resultDataA.value.nutrient_balance;
  if (!nb?.p_requirement) return 0;
  return (nb.p_supplied ?? 0) / nb.p_requirement;
});

// Nutrient progress for diet B
const mpProgressB = computed(() => {
  const nb = resultDataB.value.nutrient_balance;
  const req = nb?.mp_requirement ?? nb?.cp_requirement;
  const sup = nb?.mp_supplied ?? nb?.cp_supplied;
  if (!req) return 0;
  return (sup ?? 0) / req;
});

const nelProgressB = computed(() => {
  const nb = resultDataB.value.nutrient_balance;
  const req = nb?.nel_requirement ?? nb?.tdn_requirement;
  const sup = nb?.nel_supplied ?? nb?.tdn_supplied;
  if (!req) return 0;
  return (sup ?? 0) / req;
});

const dmProgressB = computed(() => {
  const nb = resultDataB.value.nutrient_balance;
  if (!nb || !nb.dm_requirement) return 0;
  return nb.dm_supplied / nb.dm_requirement;
});

const caProgressB = computed(() => {
  const nb = resultDataB.value.nutrient_balance;
  if (!nb?.ca_requirement) return 0;
  return (nb.ca_supplied ?? 0) / nb.ca_requirement;
});

const pProgressB = computed(() => {
  const nb = resultDataB.value.nutrient_balance;
  if (!nb?.p_requirement) return 0;
  return (nb.p_supplied ?? 0) / nb.p_requirement;
});

// All feeds: union of feeds from both diets for comparison
const allFeeds = computed<ComparedFeed[]>(() => {
  const feedsA = resultDataA.value.feeds ?? [];
  const feedsB = resultDataB.value.feeds ?? [];

  const feedMap = new Map<string, ComparedFeed>();

  for (const f of feedsA) {
    feedMap.set(f.feed_name, {
      name: f.feed_name,
      amountA: f.amount_kg,
      amountB: null,
      costA: f.cost,
      costB: null,
      onlyInA: true,
      onlyInB: false,
    });
  }

  for (const f of feedsB) {
    const existing = feedMap.get(f.feed_name);
    if (existing) {
      existing.amountB = f.amount_kg;
      existing.costB = f.cost;
      existing.onlyInA = false;
      existing.onlyInB = false;
    } else {
      feedMap.set(f.feed_name, {
        name: f.feed_name,
        amountA: null,
        amountB: f.amount_kg,
        costA: null,
        costB: f.cost,
        onlyInA: false,
        onlyInB: true,
      });
    }
  }

  return Array.from(feedMap.values());
});

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy');
}

// Watch route query params for pre-selection
watch(
  () => [route.query.diet1, route.query.diet2],
  ([d1, d2]) => {
    if (d1 && typeof d1 === 'string') {
      selectedDietA.value = d1;
    }
    if (d2 && typeof d2 === 'string') {
      selectedDietB.value = d2;
    }
  },
  { immediate: true }
);

onMounted(async () => {
  loading.value = true;
  await dietsStore.fetchDiets();
  loading.value = false;
});
</script>

<style lang="scss" scoped>
.compare-amount-col {
  min-width: 60px;
}
</style>
