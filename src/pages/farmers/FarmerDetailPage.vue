<template>
  <q-page class="q-pa-md">
    <PullToRefresh @refresh="onRefresh">
      <!-- Loading State -->
      <template v-if="loading && !farmer">
        <SkeletonCard />
      </template>

      <!-- Farmer Not Found -->
      <template v-else-if="!farmer">
        <EmptyState
          icon="person_off"
          title="Farmer Not Found"
          description="The farmer profile you're looking for doesn't exist or has been removed."
          action-label="Back to Farmers"
          action-icon="arrow_back"
          @action="router.push('/farmers')"
        />
      </template>

      <!-- Farmer Details -->
      <template v-else>
        <!-- Header Card -->
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="row items-center q-gutter-md">
              <q-avatar size="64px" color="teal" text-color="white">
                <q-icon name="person" size="32px" />
              </q-avatar>
              <div class="col">
                <div class="text-h6">{{ farmer.name }}</div>
                <div class="text-caption text-grey-6">
                  <span v-if="farmer.village">{{ farmer.village }}</span>
                  <span v-if="farmer.village && farmer.district">, </span>
                  <span v-if="farmer.district">{{ farmer.district }}</span>
                  <span v-if="farmer.state">, {{ farmer.state }}</span>
                </div>
                <div v-if="farmer.phone" class="text-caption text-grey-6">
                  <q-icon name="phone" size="12px" class="q-mr-xs" />
                  {{ farmer.phone }}
                </div>
              </div>
              <q-btn flat round icon="edit" @click="router.push(`/farmers/${farmerId}/edit`)" />
            </div>
          </q-card-section>
        </q-card>

        <!-- Statistics Cards -->
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-6">
            <q-card>
              <q-card-section class="text-center">
                <div class="text-h4 text-primary">{{ summary?.statistics.total_active_cows || farmer.total_cattle }}</div>
                <div class="text-caption text-grey-6">Total Cattle</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6">
            <q-card>
              <q-card-section class="text-center">
                <div class="text-h4 text-positive">{{ summary?.statistics.lactating_cows || 0 }}</div>
                <div class="text-caption text-grey-6">Lactating</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6">
            <q-card>
              <q-card-section class="text-center">
                <div class="text-h4 text-info">{{ summary?.statistics.total_daily_milk_production?.toFixed(1) || '0' }}</div>
                <div class="text-caption text-grey-6">Daily Milk (L)</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6">
            <q-card>
              <q-card-section class="text-center">
                <div class="text-h4 text-warning">{{ summary?.statistics.avg_milk_per_lactating_cow?.toFixed(1) || '0' }}</div>
                <div class="text-caption text-grey-6">Avg/Cow (L)</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Farm Details Card -->
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium q-mb-sm">Farm Details</div>
            <q-list dense>
              <q-item v-if="farmer.farming_type">
                <q-item-section avatar>
                  <q-icon name="agriculture" color="grey-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Farming Type</q-item-label>
                  <q-item-label class="text-capitalize">{{ farmer.farming_type }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="farmer.land_acres">
                <q-item-section avatar>
                  <q-icon name="landscape" color="grey-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Land Area</q-item-label>
                  <q-item-label>{{ farmer.land_acres }} acres</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="calendar_today" color="grey-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>Added On</q-item-label>
                  <q-item-label>{{ formatDate(farmer.created_at) }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Cattle List -->
        <q-card class="q-mb-md">
          <q-card-section>
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-subtitle1 text-weight-medium">Cattle</div>
              <q-btn
                flat
                dense
                color="primary"
                label="Add Cow"
                icon="add"
                @click="addCowForFarmer"
              />
            </div>

            <template v-if="cows.length === 0">
              <div class="text-center q-pa-md text-grey-6">
                <q-icon name="pets" size="32px" class="q-mb-sm" />
                <div>No cattle registered yet</div>
              </div>
            </template>

            <q-list v-else separator>
              <q-item
                v-for="cow in cows"
                :key="cow.id"
                v-ripple
                clickable
                @click="router.push(`/cows/${cow.id}`)"
              >
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white" size="40px">
                    <q-icon name="pets" size="20px" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ cow.name }}</q-item-label>
                  <q-item-label caption>
                    {{ cow.breed }} &middot; {{ cow.body_weight }}kg
                    <span v-if="cow.lactating"> &middot; {{ cow.milk_production }}L/day</span>
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" color="grey" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <!-- Quick Actions -->
        <div class="row q-gutter-sm">
          <q-btn
            class="col"
            outline
            color="primary"
            icon="add_chart"
            label="Record Yield"
            @click="router.push(`/yields/new?farmer=${farmerId}`)"
          />
          <q-btn
            class="col"
            outline
            color="secondary"
            icon="history"
            label="View History"
            @click="router.push(`/yields?farmer=${farmerId}`)"
          />
        </div>
      </template>
    </PullToRefresh>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useFarmersStore, FarmerSummary } from 'src/stores/farmers';
import PullToRefresh from 'src/components/ui/PullToRefresh.vue';
import SkeletonCard from 'src/components/ui/SkeletonCard.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';

interface CowInfo {
  id: string;
  name: string;
  breed: string;
  body_weight: number;
  lactating: boolean;
  milk_production: number;
  target_milk_yield?: number;
  is_active: boolean;
}

const router = useRouter();
const route = useRoute();
const farmersStore = useFarmersStore();

const farmerId = computed(() => route.params.id as string);
const farmer = computed(() =>
  farmersStore.farmers.find((f) => f.id === farmerId.value)
);

const summary = ref<FarmerSummary | null>(null);
const cows = ref<CowInfo[]>([]);

const loading = computed(() => farmersStore.loading);

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

async function loadFarmerData() {
  if (!farmerId.value) return;

  // Fetch farmer profile
  await farmersStore.fetchFarmer(farmerId.value);

  // Fetch summary with statistics
  summary.value = await farmersStore.getFarmerSummary(farmerId.value);

  // Fetch farmer's cattle
  const cowsData = await farmersStore.getFarmerCows(farmerId.value);
  cows.value = cowsData as CowInfo[];
}

async function onRefresh(done: () => void) {
  await loadFarmerData();
  done();
}

function addCowForFarmer() {
  // Navigate to cow form with farmer pre-selected
  router.push({
    path: '/cows/new',
    query: { farmer_id: farmerId.value },
  });
}

onMounted(() => {
  loadFarmerData();
});
</script>

<style lang="scss" scoped>
.q-card {
  border-radius: 12px;
}
</style>
