<template>
  <q-page class="q-pa-md">
    <PullToRefresh @refresh="onRefresh">
      <!-- Loading State -->
      <template v-if="loading && diets.length === 0">
        <SkeletonCard v-for="i in 3" :key="i" class="q-mb-sm" />
      </template>

      <!-- Empty State -->
      <template v-else-if="diets.length === 0">
        <EmptyState
          icon="menu_book"
          :title="$t('diet.noDietPlans')"
          :description="$t('diet.createFirstDiet')"
          :action-label="$t('diet.createDiet')"
          action-icon="add"
          @action="router.push('/diet/new')"
        />
      </template>

      <!-- Diet List -->
      <template v-else>
        <!-- Filter Chips -->
        <div v-if="filterOptions.length > 1" class="q-mb-md filter-chips">
          <q-chip
            v-for="opt in filterOptions"
            :key="opt.value"
            :color="activeFilter === opt.value ? 'primary' : undefined"
            :text-color="activeFilter === opt.value ? 'white' : undefined"
            :outline="activeFilter !== opt.value"
            clickable
            size="sm"
            @click="activeFilter = opt.value"
          >
            {{ opt.label }}
          </q-chip>
        </div>

        <!-- Cost Trend Chart (collapsible) -->
        <q-card
          v-if="completedDietsWithCost.length >= 2"
          flat
          bordered
          class="q-mb-md"
        >
          <q-expansion-item
            icon="trending_up"
            :label="$t('diets.costTrend')"
            header-class="text-subtitle1"
            default-opened
          >
            <q-card-section class="q-pt-none">
              <DietCostChart :diets="diets" />
            </q-card-section>
          </q-expansion-item>
        </q-card>

        <q-card
          v-for="diet in filteredDiets"
          :key="diet.id"
          flat
          bordered
          class="q-mb-sm diet-card"
          :class="{ 'diet-card--following': diet.is_active }"
          clickable
          @click="router.push(`/diet/${diet.id}`)"
        >
          <q-card-section>
            <div class="row items-center">
              <q-avatar :color="getStatusColor(diet.status)" text-color="white" size="48px">
                <q-icon :name="getStatusIcon(diet.status)" />
              </q-avatar>

              <div class="col q-ml-md">
                <div class="text-subtitle1">
                  {{ getDietTitle(diet) }}
                </div>
                <div v-if="getDietSubtitle(diet)" class="text-caption text-grey-6">
                  {{ getDietSubtitle(diet) }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ formatDate(diet.created_at) }}
                </div>
              </div>

              <div class="text-right">
                <q-chip
                  v-if="diet.is_active"
                  color="positive"
                  text-color="white"
                  size="sm"
                  dense
                  icon="favorite"
                >
                  {{ $t('diet.following') }}
                </q-chip>
                <q-chip
                  v-else
                  :color="getStatusColor(diet.status)"
                  text-color="white"
                  size="sm"
                  dense
                >
                  {{ getStatusLabel(diet.status) }}
                </q-chip>
                <div v-if="diet.total_cost" class="text-caption text-grey-7 q-mt-xs">
                  {{ formatCurrency(diet.total_cost) }}{{ $t('diet.perDay') }}
                </div>
              </div>
            </div>

            <!-- Summary for completed/saved/following diets -->
            <div v-if="['completed', 'saved', 'following'].includes(diet.status)" class="row q-mt-sm q-col-gutter-sm">
              <div class="col-4 text-center">
                <div class="text-caption text-grey-7">{{ $t('diet.ingredients') }}</div>
                <div class="text-body2">{{ getIngredientCount(diet) }}</div>
              </div>
              <div class="col-4 text-center">
                <div class="text-caption text-grey-7">{{ $t('diet.goal') }}</div>
                <div class="text-body2 text-capitalize">{{ formatGoal(diet.optimization_goal) }}</div>
              </div>
              <div class="col-4 text-center">
                <div class="text-caption text-grey-7">{{ $t('diet.cost') }}</div>
                <div class="text-body2">{{ formatCurrency(diet.total_cost ?? 0) }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </template>
    </PullToRefresh>

    <!-- FAB for new diet -->
    <q-page-sticky position="bottom-right" :offset="[16, 72]">
      <q-btn fab icon="add" color="primary" @click="router.push('/diet/new')" />
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { format } from 'date-fns';
import { useDietsStore } from 'src/stores/diets';
import { useCowsStore } from 'src/stores/cows';
import { useFarmersStore } from 'src/stores/farmers';
import { useAuthStore } from 'src/stores/auth';
import { Diet } from 'src/lib/offline/db';
import { useCurrency } from 'src/composables/useCurrency';

const router = useRouter();
const { t } = useI18n();
const { formatCurrency } = useCurrency();
import PullToRefresh from 'src/components/ui/PullToRefresh.vue';
import SkeletonCard from 'src/components/ui/SkeletonCard.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';
import DietCostChart from 'src/components/diet/DietCostChart.vue';

const dietsStore = useDietsStore();
const cowsStore = useCowsStore();
const farmersStore = useFarmersStore();
const authStore = useAuthStore();

const activeFilter = ref('all');
const loading = computed(() => dietsStore.loading);
const diets = computed(() => dietsStore.diets);
const completedDietsWithCost = computed(() =>
  diets.value.filter((d) => ['completed', 'saved'].includes(d.status) && d.total_cost != null && d.total_cost > 0)
);

/** Build cow→farmer mapping from cows store */
const cowFarmerMap = computed(() => {
  const map: Record<string, { farmerId: string; farmerName: string }> = {};
  for (const cow of cowsStore.cows) {
    if (cow.farmer_profile_id) {
      const farmer = farmersStore.activeFarmers.find((f) => f.id === cow.farmer_profile_id);
      map[cow.id] = {
        farmerId: cow.farmer_profile_id,
        farmerName: farmer?.name || '',
      };
    }
  }
  return map;
});

/** Filter options: All + My Cows + one per managed farmer */
const filterOptions = computed(() => {
  const opts: { label: string; value: string }[] = [
    { label: t('diet.filter.all'), value: 'all' },
    { label: t('diet.filterFollowing'), value: 'following' },
    { label: t('diet.filter.saved'), value: 'saved' },
  ];
  if (farmersStore.managedFarmers.length > 0) {
    opts.push({ label: t('diet.filter.myCows'), value: 'my' });
    for (const farmer of farmersStore.managedFarmers) {
      opts.push({ label: farmer.name, value: `farmer:${farmer.id}` });
    }
  }
  return opts;
});

const filteredDiets = computed(() => {
  if (activeFilter.value === 'all') return diets.value;
  if (activeFilter.value === 'following') return diets.value.filter((d) => d.is_active);
  if (activeFilter.value === 'saved') return diets.value.filter((d) => ['completed', 'saved'].includes(d.status) && !d.is_active);
  const selfProfileId = authStore.selfFarmerProfileId;
  if (activeFilter.value === 'my') {
    return diets.value.filter((d) => {
      if (!d.cow_id) return true; // manual entries belong to user
      const cowInfo = cowFarmerMap.value[d.cow_id];
      return !cowInfo || cowInfo.farmerId === selfProfileId;
    });
  }
  // Filter by specific farmer
  const farmerId = activeFilter.value.replace('farmer:', '');
  return diets.value.filter((d) => {
    if (!d.cow_id) return false;
    const cowInfo = cowFarmerMap.value[d.cow_id];
    return cowInfo?.farmerId === farmerId;
  });
});

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
}

function formatGoal(goal: string): string {
  const goals: Record<string, string> = {
    minimize_cost: t('diet.goals.minCost'),
    maximize_milk: t('diet.goals.maxMilk'),
    balanced: t('diet.goals.balanced'),
  };
  return goals[goal] || goal;
}

function getDietTitle(diet: Diet): string {
  if (diet.name) return diet.name;
  // Build a contextual title from cow name + goal
  const goalLabel = formatGoal(diet.optimization_goal);
  if (diet.cow_name) return `${diet.cow_name} — ${goalLabel}`;
  return goalLabel || t('diet.dietPlan');
}

function getDietSubtitle(diet: Diet): string | null {
  if (!diet.cow_id) return null;
  const cowInfo = cowFarmerMap.value[diet.cow_id];
  const selfProfileId = authStore.selfFarmerProfileId;
  if (cowInfo && cowInfo.farmerId !== selfProfileId && cowInfo.farmerName) {
    return t('diet.forFarmer', { name: cowInfo.farmerName });
  }
  return null;
}

function getIngredientCount(diet: Diet): number {
  const rd = diet.result_data as { feeds?: unknown[] } | undefined;
  return rd?.feeds?.length ?? 0;
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    completed: t('diet.statusLabel.completed'),
    processing: t('diet.statusLabel.processing'),
    failed: t('diet.statusLabel.failed'),
    following: t('diet.following'),
    archived: t('diet.stopped'),
    saved: t('diet.statusLabel.completed'),
  };
  return labels[status] || t('diet.statusLabel.pending');
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
    case 'saved':
      return 'positive';
    case 'following':
      return 'positive';
    case 'archived':
      return 'grey-6';
    case 'processing':
      return 'info';
    case 'failed':
      return 'negative';
    default:
      return 'warning';
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'completed':
    case 'saved':
      return 'check';
    case 'following':
      return 'favorite';
    case 'archived':
      return 'archive';
    case 'processing':
      return 'hourglass_empty';
    case 'failed':
      return 'error';
    default:
      return 'schedule';
  }
}

async function onRefresh(done: () => void) {
  await dietsStore.fetchDiets();
  done();
}

onMounted(async () => {
  await Promise.all([
    dietsStore.fetchDiets(),
    cowsStore.fetchCows(),
    farmersStore.fetchFarmers(),
  ]);
});
</script>

<style lang="scss" scoped>
.diet-card {
  border-radius: $radius-loose;

  &--following {
    border-inline-start: 4px solid $positive;
  }
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
