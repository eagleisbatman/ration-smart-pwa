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
          icon="restaurant"
          title="No Diet Plans"
          description="Create your first diet plan to optimize your cattle's nutrition and reduce feed costs."
          action-label="Create Diet"
          action-icon="add"
          @action="router.push('/diet/new')"
        />
      </template>

      <!-- Diet List -->
      <template v-else>
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
                  {{ diet.cow_name || 'General Diet' }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ formatDate(diet.created_at) }}
                </div>
              </div>

              <div class="text-right">
                <q-chip
                  :color="getStatusColor(diet.status)"
                  text-color="white"
                  size="sm"
                  dense
                >
                  {{ diet.status }}
                </q-chip>
                <div v-if="diet.total_cost" class="text-caption text-grey-7 q-mt-xs">
                  ₹{{ diet.total_cost.toFixed(2) }}/day
                </div>
              </div>
            </div>

            <!-- Summary for completed diets -->
            <div v-if="diet.status === 'completed' && diet.dm_intake" class="row q-mt-sm q-col-gutter-sm">
              <div class="col-4 text-center">
                <div class="text-caption text-grey-7">DM Intake</div>
                <div class="text-body2">{{ diet.dm_intake.toFixed(1) }} kg</div>
              </div>
              <div class="col-4 text-center">
                <div class="text-caption text-grey-7">Goal</div>
                <div class="text-body2 text-capitalize">{{ formatGoal(diet.optimization_goal) }}</div>
              </div>
              <div class="col-4 text-center">
                <div class="text-caption text-grey-7">Cost</div>
                <div class="text-body2">₹{{ diet.total_cost?.toFixed(0) }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </template>
    </PullToRefresh>

    <!-- FAB for new diet -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="router.push('/diet/new')" />
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { format } from 'date-fns';
import { useDietsStore } from 'src/stores/diets';

const router = useRouter();
import PullToRefresh from 'src/components/ui/PullToRefresh.vue';
import SkeletonCard from 'src/components/ui/SkeletonCard.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';

const dietsStore = useDietsStore();

const loading = computed(() => dietsStore.loading);
const diets = computed(() => dietsStore.diets);

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
}

function formatGoal(goal: string): string {
  const goals: Record<string, string> = {
    minimize_cost: 'Min Cost',
    maximize_milk: 'Max Milk',
    balanced: 'Balanced',
  };
  return goals[goal] || goal;
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'positive';
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
      return 'check';
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
  border-radius: 12px;
}
</style>
