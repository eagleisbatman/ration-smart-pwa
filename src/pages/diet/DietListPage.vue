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
          v-for="diet in diets"
          :key="diet.id"
          flat
          bordered
          class="q-mb-sm diet-card"
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
                  {{ diet.cow_name || $t('diet.generalDiet') }}
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

            <!-- Summary for completed diets -->
            <div v-if="diet.status === 'completed' && diet.dm_intake" class="row q-mt-sm q-col-gutter-sm">
              <div class="col-4 text-center">
                <div class="text-caption text-grey-7">{{ $t('diet.dmIntake') }}</div>
                <div class="text-body2">{{ diet.dm_intake.toFixed(1) }} {{ $t('diet.kg') }}</div>
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
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { format } from 'date-fns';
import { useDietsStore } from 'src/stores/diets';
import { useCurrency } from 'src/composables/useCurrency';

const router = useRouter();
const { t } = useI18n();
const { formatCurrency } = useCurrency();
import PullToRefresh from 'src/components/ui/PullToRefresh.vue';
import SkeletonCard from 'src/components/ui/SkeletonCard.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';
import DietCostChart from 'src/components/diet/DietCostChart.vue';

const dietsStore = useDietsStore();

const loading = computed(() => dietsStore.loading);
const diets = computed(() => dietsStore.diets);
const completedDietsWithCost = computed(() =>
  diets.value.filter((d) => d.status === 'completed' && d.total_cost != null && d.total_cost > 0)
);

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

onMounted(() => {
  dietsStore.fetchDiets();
});
</script>

<style lang="scss" scoped>
.diet-card {
  border-radius: $radius-loose;
}
</style>
