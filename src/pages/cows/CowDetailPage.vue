<template>
  <q-page class="q-pa-md">
    <!-- Loading State -->
    <template v-if="loading">
      <SkeletonCard />
    </template>

    <!-- Cow Details -->
    <template v-else-if="cow">
      <!-- Header Card -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row items-center">
            <q-avatar size="64px" color="primary" text-color="white">
              <q-icon name="pets" size="36px" />
            </q-avatar>
            <div class="q-ml-md">
              <div class="text-h5">{{ cow.name }}</div>
              <div class="text-body2 text-grey-7">{{ cow.breed }}</div>
              <q-chip
                v-if="!cow._synced"
                size="sm"
                color="warning"
                text-color="white"
                icon="sync"
                class="q-mt-xs"
              >
                Pending sync
              </q-chip>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Quick Stats -->
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-4">
          <q-card flat bordered class="text-center q-pa-sm">
            <div class="text-h6 text-primary">{{ cow.weight_kg }}</div>
            <div class="text-caption text-grey-7">kg</div>
          </q-card>
        </div>
        <div class="col-4">
          <q-card flat bordered class="text-center q-pa-sm">
            <div class="text-h6 text-secondary">{{ cow.milk_yield_liters }}</div>
            <div class="text-caption text-grey-7">L/day</div>
          </q-card>
        </div>
        <div class="col-4">
          <q-card flat bordered class="text-center q-pa-sm">
            <div class="text-h6 text-accent">{{ cow.milk_fat_percentage }}%</div>
            <div class="text-caption text-grey-7">Fat</div>
          </q-card>
        </div>
      </div>

      <!-- Details List -->
      <q-card flat bordered class="q-mb-md">
        <q-list separator>
          <q-item>
            <q-item-section>
              <q-item-label caption>Lactation Stage</q-item-label>
              <q-item-label>{{ formatLactationStage(cow.lactation_stage) }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="cow.age_months">
            <q-item-section>
              <q-item-label caption>Age</q-item-label>
              <q-item-label>{{ formatAge(cow.age_months) }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="cow.body_condition_score">
            <q-item-section>
              <q-item-label caption>Body Condition Score</q-item-label>
              <q-item-label>{{ cow.body_condition_score }} / 5</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>Activity Level</q-item-label>
              <q-item-label class="text-capitalize">{{ cow.activity_level }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>Pregnancy Status</q-item-label>
              <q-item-label>
                {{ cow.is_pregnant ? `Pregnant (Month ${cow.pregnancy_month || 'N/A'})` : 'Not pregnant' }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="cow.notes">
            <q-item-section>
              <q-item-label caption>Notes</q-item-label>
              <q-item-label>{{ cow.notes }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <!-- Quick Actions -->
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-6">
          <q-btn
            label="Log Milk"
            icon="water_drop"
            color="primary"
            class="full-width"
            unelevated
            @click="router.push({ path: '/logs/new', query: { cow_id: cow.id } })"
          />
        </div>
        <div class="col-6">
          <q-btn
            label="Get Diet"
            icon="restaurant"
            color="secondary"
            class="full-width"
            unelevated
            @click="router.push({ path: '/diet/new', query: { cow_id: cow.id } })"
          />
        </div>
      </div>

      <!-- Recent Milk Logs -->
      <div class="text-subtitle1 q-mb-sm">Recent Milk Logs</div>
      <template v-if="recentLogs.length === 0">
        <q-card flat bordered class="text-center q-pa-md">
          <div class="text-body2 text-grey-7">No logs yet</div>
        </q-card>
      </template>
      <template v-else>
        <q-list bordered separator class="rounded-borders">
          <q-item v-for="log in recentLogs" :key="log.id">
            <q-item-section>
              <q-item-label>{{ formatDate(log.log_date) }}</q-item-label>
              <q-item-label caption>
                M: {{ log.morning_liters || 0 }}L · E: {{ log.evening_liters || 0 }}L
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-h6 text-primary">{{ log.total_liters }}L</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </template>

      <!-- Edit FAB -->
      <q-page-sticky position="bottom-right" :offset="[18, 18]">
        <q-btn
          fab
          icon="edit"
          color="primary"
          @click="router.push(`/cows/${cow.id}/edit`)"
        />
      </q-page-sticky>
    </template>

    <!-- Not Found -->
    <template v-else>
      <EmptyState
        icon="error_outline"
        icon-color="negative"
        title="Cow Not Found"
        description="The cow you're looking for doesn't exist or has been removed."
        action-label="Go Back"
        @action="router.back()"
      />
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
import { format } from 'date-fns';
import { useCowsStore } from 'src/stores/cows';
import { useMilkLogsStore } from 'src/stores/milkLogs';
import { Cow } from 'src/lib/offline/db';
import SkeletonCard from 'src/components/ui/SkeletonCard.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';

const route = useRoute();
const cowsStore = useCowsStore();
const milkLogsStore = useMilkLogsStore();

const cowId = computed(() => route.params.id as string);
const cow = ref<Cow | null>(null);
const recentLogs = ref<typeof milkLogsStore.logs>([]);
const loading = ref(true);

function formatLactationStage(stage: string): string {
  const stages: Record<string, string> = {
    early: 'Early (0-100 days)',
    mid: 'Mid (100-200 days)',
    late: 'Late (200+ days)',
    dry: 'Dry',
  };
  return stages[stage] || stage;
}

function formatAge(months: number): string {
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
  return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
}

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy');
}

onMounted(async () => {
  loading.value = true;
  cow.value = await cowsStore.getCow(cowId.value);

  if (cow.value) {
    recentLogs.value = await milkLogsStore.getLogsForCow(cowId.value);
  }

  loading.value = false;
});
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: 12px;
  overflow: hidden;
}
</style>
