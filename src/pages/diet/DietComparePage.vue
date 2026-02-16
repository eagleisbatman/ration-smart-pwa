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
              <div class="text-caption text-grey-7 text-center">{{ $t('diet.dmKg') }}</div>
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
            <!-- CP -->
            <div class="q-mb-md">
              <div class="text-caption text-grey-7 q-mb-xs">{{ $t('diet.crudeProteinCP') }}</div>
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <div class="row justify-between text-caption q-mb-xs">
                    <span>A</span>
                    <span>{{ resultDataA.nutrient_balance?.cp_supplied?.toFixed(0) ?? 0 }} / {{ resultDataA.nutrient_balance?.cp_requirement?.toFixed(0) ?? 0 }}{{ $t('diet.g') }}</span>
                  </div>
                  <q-linear-progress
                    :value="cpProgressA"
                    :color="cpProgressA >= 1 ? 'positive' : 'warning'"
                    rounded
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <div class="row justify-between text-caption q-mb-xs">
                    <span>B</span>
                    <span>{{ resultDataB.nutrient_balance?.cp_supplied?.toFixed(0) ?? 0 }} / {{ resultDataB.nutrient_balance?.cp_requirement?.toFixed(0) ?? 0 }}{{ $t('diet.g') }}</span>
                  </div>
                  <q-linear-progress
                    :value="cpProgressB"
                    :color="cpProgressB >= 1 ? 'positive' : 'warning'"
                    rounded
                  />
                </div>
              </div>
            </div>

            <!-- TDN -->
            <div class="q-mb-md">
              <div class="text-caption text-grey-7 q-mb-xs">{{ $t('diet.totalDigestibleNutrients') }}</div>
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6">
                  <div class="row justify-between text-caption q-mb-xs">
                    <span>A</span>
                    <span>{{ resultDataA.nutrient_balance?.tdn_supplied?.toFixed(0) ?? 0 }} / {{ resultDataA.nutrient_balance?.tdn_requirement?.toFixed(0) ?? 0 }}{{ $t('diet.g') }}</span>
                  </div>
                  <q-linear-progress
                    :value="tdnProgressA"
                    :color="tdnProgressA >= 1 ? 'positive' : 'warning'"
                    rounded
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <div class="row justify-between text-caption q-mb-xs">
                    <span>B</span>
                    <span>{{ resultDataB.nutrient_balance?.tdn_supplied?.toFixed(0) ?? 0 }} / {{ resultDataB.nutrient_balance?.tdn_requirement?.toFixed(0) ?? 0 }}{{ $t('diet.g') }}</span>
                  </div>
                  <q-linear-progress
                    :value="tdnProgressB"
                    :color="tdnProgressB >= 1 ? 'positive' : 'warning'"
                    rounded
                  />
                </div>
              </div>
            </div>

            <!-- DM -->
            <div>
              <div class="text-caption text-grey-7 q-mb-xs">{{ $t('diet.dryMatterDM') }}</div>
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
  cp_supplied: number;
  cp_requirement: number;
  tdn_supplied: number;
  tdn_requirement: number;
  dm_supplied: number;
  dm_requirement: number;
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

// Nutrient progress for diet A
const cpProgressA = computed(() => {
  const nb = resultDataA.value.nutrient_balance;
  if (!nb || !nb.cp_requirement) return 0;
  return nb.cp_supplied / nb.cp_requirement;
});

const tdnProgressA = computed(() => {
  const nb = resultDataA.value.nutrient_balance;
  if (!nb || !nb.tdn_requirement) return 0;
  return nb.tdn_supplied / nb.tdn_requirement;
});

const dmProgressA = computed(() => {
  const nb = resultDataA.value.nutrient_balance;
  if (!nb || !nb.dm_requirement) return 0;
  return nb.dm_supplied / nb.dm_requirement;
});

// Nutrient progress for diet B
const cpProgressB = computed(() => {
  const nb = resultDataB.value.nutrient_balance;
  if (!nb || !nb.cp_requirement) return 0;
  return nb.cp_supplied / nb.cp_requirement;
});

const tdnProgressB = computed(() => {
  const nb = resultDataB.value.nutrient_balance;
  if (!nb || !nb.tdn_requirement) return 0;
  return nb.tdn_supplied / nb.tdn_requirement;
});

const dmProgressB = computed(() => {
  const nb = resultDataB.value.nutrient_balance;
  if (!nb || !nb.dm_requirement) return 0;
  return nb.dm_supplied / nb.dm_requirement;
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
