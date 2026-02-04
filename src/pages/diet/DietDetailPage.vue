<template>
  <q-page class="q-pa-md">
    <!-- Loading -->
    <template v-if="loading">
      <SkeletonCard />
    </template>

    <!-- Diet Details -->
    <template v-else-if="diet">
      <!-- Status Banner -->
      <q-banner
        v-if="diet.status !== 'completed'"
        :class="`bg-${getStatusColor(diet.status)} text-white q-mb-md`"
        rounded
      >
        <template v-slot:avatar>
          <q-icon :name="getStatusIcon(diet.status)" />
        </template>
        <template v-if="diet.status === 'processing'">
          Optimization in progress... This may take a few seconds.
        </template>
        <template v-else-if="diet.status === 'failed'">
          Optimization failed. Please try again with different parameters.
        </template>
        <template v-else>
          Waiting to start optimization...
        </template>
      </q-banner>

      <!-- Header -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row items-center">
            <div class="col">
              <div class="text-h6">{{ diet.cow_name || 'Diet Plan' }}</div>
              <div class="text-caption text-grey-7">{{ formatDate(diet.created_at) }}</div>
            </div>
            <q-chip
              :color="getStatusColor(diet.status)"
              text-color="white"
            >
              {{ diet.status }}
            </q-chip>
          </div>
        </q-card-section>
      </q-card>

      <!-- Results (for completed diets) -->
      <template v-if="diet.status === 'completed' && diet.result_data">
        <!-- Summary Stats -->
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-4">
            <q-card flat bordered class="text-center q-pa-sm">
              <div class="text-h5 text-primary">₹{{ diet.total_cost?.toFixed(0) }}</div>
              <div class="text-caption text-grey-7">Daily Cost</div>
            </q-card>
          </div>
          <div class="col-4">
            <q-card flat bordered class="text-center q-pa-sm">
              <div class="text-h5 text-secondary">{{ diet.dm_intake?.toFixed(1) }}</div>
              <div class="text-caption text-grey-7">DM (kg)</div>
            </q-card>
          </div>
          <div class="col-4">
            <q-card flat bordered class="text-center q-pa-sm">
              <div class="text-h5 text-accent">{{ resultData.feeds?.length || 0 }}</div>
              <div class="text-caption text-grey-7">Feeds</div>
            </q-card>
          </div>
        </div>

        <!-- Feed Breakdown -->
        <div class="text-subtitle1 q-mb-sm">Recommended Feeds</div>
        <q-card flat bordered class="q-mb-md">
          <q-list separator>
            <q-item v-for="feed in resultData.feeds" :key="feed.feed_id">
              <q-item-section>
                <q-item-label>{{ feed.feed_name }}</q-item-label>
                <q-item-label caption>
                  DM: {{ feed.dm_contribution?.toFixed(2) }}kg ·
                  CP: {{ feed.cp_contribution?.toFixed(1) }}g
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label class="text-h6">{{ feed.amount_kg?.toFixed(2) }} kg</q-item-label>
                <q-item-label caption>₹{{ feed.cost?.toFixed(2) }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>

        <!-- Nutrient Balance -->
        <div class="text-subtitle1 q-mb-sm">Nutrient Balance</div>
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="q-mb-md">
              <div class="row justify-between q-mb-xs">
                <span>Crude Protein (CP)</span>
                <span>{{ resultData.nutrient_balance?.cp_supplied?.toFixed(0) }} / {{ resultData.nutrient_balance?.cp_requirement?.toFixed(0) }}g</span>
              </div>
              <q-linear-progress
                :value="cpProgress"
                :color="cpProgress >= 1 ? 'positive' : 'warning'"
                rounded
              />
            </div>

            <div class="q-mb-md">
              <div class="row justify-between q-mb-xs">
                <span>Total Digestible Nutrients (TDN)</span>
                <span>{{ resultData.nutrient_balance?.tdn_supplied?.toFixed(0) }} / {{ resultData.nutrient_balance?.tdn_requirement?.toFixed(0) }}g</span>
              </div>
              <q-linear-progress
                :value="tdnProgress"
                :color="tdnProgress >= 1 ? 'positive' : 'warning'"
                rounded
              />
            </div>

            <div>
              <div class="row justify-between q-mb-xs">
                <span>Dry Matter (DM)</span>
                <span>{{ resultData.nutrient_balance?.dm_supplied?.toFixed(2) }} / {{ resultData.nutrient_balance?.dm_requirement?.toFixed(2) }}kg</span>
              </div>
              <q-linear-progress
                :value="dmProgress"
                :color="dmProgress >= 0.95 && dmProgress <= 1.05 ? 'positive' : 'warning'"
                rounded
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Recommendations -->
        <template v-if="resultData.recommendations?.length">
          <div class="text-subtitle1 q-mb-sm">Recommendations</div>
          <q-card flat bordered class="q-mb-md">
            <q-list>
              <q-item v-for="(rec, i) in resultData.recommendations" :key="i">
                <q-item-section avatar>
                  <q-icon name="lightbulb" color="warning" />
                </q-item-section>
                <q-item-section>{{ rec }}</q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </template>

        <!-- Warnings -->
        <template v-if="resultData.warnings?.length">
          <div class="text-subtitle1 q-mb-sm">Warnings</div>
          <q-card flat bordered class="bg-negative-light">
            <q-list>
              <q-item v-for="(warn, i) in resultData.warnings" :key="i">
                <q-item-section avatar>
                  <q-icon name="warning" color="negative" />
                </q-item-section>
                <q-item-section class="text-negative">{{ warn }}</q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </template>
      </template>

      <!-- Actions -->
      <div class="row q-col-gutter-sm q-mt-md">
        <div class="col-6">
          <q-btn
            label="New Diet"
            icon="add"
            color="primary"
            class="full-width"
            unelevated
            @click="router.push('/diet/new')"
          />
        </div>
        <div class="col-6">
          <q-btn
            label="Delete"
            icon="delete"
            color="negative"
            flat
            class="full-width"
            @click="confirmDelete"
          />
        </div>
      </div>
    </template>

    <!-- Not Found -->
    <template v-else>
      <EmptyState
        icon="error_outline"
        icon-color="negative"
        title="Diet Not Found"
        description="The diet plan you're looking for doesn't exist."
        action-label="Go Back"
        @action="router.back()"
      />
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { format } from 'date-fns';
import { useDietsStore } from 'src/stores/diets';
import { Diet } from 'src/lib/offline/db';
import SkeletonCard from 'src/components/ui/SkeletonCard.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';

// Type for diet result data
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

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const dietsStore = useDietsStore();

const dietId = computed(() => route.params.id as string);
const diet = ref<Diet | null>(null);
const loading = ref(true);

const resultData = computed<DietResultData>(() => (diet.value?.result_data as DietResultData) || {});

const cpProgress = computed(() => {
  const nb = resultData.value.nutrient_balance;
  if (!nb) return 0;
  return nb.cp_requirement ? nb.cp_supplied / nb.cp_requirement : 0;
});

const tdnProgress = computed(() => {
  const nb = resultData.value.nutrient_balance;
  if (!nb) return 0;
  return nb.tdn_requirement ? nb.tdn_supplied / nb.tdn_requirement : 0;
});

const dmProgress = computed(() => {
  const nb = resultData.value.nutrient_balance;
  if (!nb) return 0;
  return nb.dm_requirement ? nb.dm_supplied / nb.dm_requirement : 0;
});

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMMM d, yyyy h:mm a');
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
      return 'check_circle';
    case 'processing':
      return 'hourglass_empty';
    case 'failed':
      return 'error';
    default:
      return 'schedule';
  }
}

function confirmDelete() {
  $q.dialog({
    title: 'Delete Diet Plan',
    message: 'Are you sure you want to delete this diet plan?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const success = await dietsStore.deleteDiet(dietId.value);
    if (success) {
      $q.notify({ type: 'positive', message: 'Diet deleted' });
      router.push('/diet');
    }
  });
}

onMounted(async () => {
  loading.value = true;
  diet.value = await dietsStore.getDiet(dietId.value);
  loading.value = false;
});
</script>

<style lang="scss" scoped>
.bg-negative-light {
  background-color: rgba($negative, 0.1);
}
</style>
