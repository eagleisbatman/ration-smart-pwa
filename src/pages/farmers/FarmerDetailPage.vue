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
          icon="people"
          :title="$t('farmer.farmerNotFound')"
          :description="$t('farmer.farmerNotFoundDescription')"
          :action-label="$t('farmer.backToFarmers')"
          action-icon="arrow_back"
          @action="router.push('/farmers')"
        />
      </template>

      <!-- Farmer Details -->
      <template v-else>
        <!-- Header -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="row items-center q-gutter-md">
              <q-avatar v-if="farmer.image_url" size="64px">
                <q-img :src="farmer.image_url" :ratio="1" />
              </q-avatar>
              <q-avatar v-else size="64px" color="teal" text-color="white">
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
              <q-btn flat round icon="edit" @click="router.push({ name: 'farmer-edit', params: { id: farmerId } })" />
            </div>
          </q-card-section>
        </q-card>

        <!-- Statistics (3+2 grid per wireframe) -->
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-4">
            <div class="stat-inline">
              <div class="text-h5 text-primary">{{ summary?.statistics.total_active_cows ?? farmer.total_cattle }}</div>
              <div class="text-caption text-grey-6">{{ $t('farmer.totalCattle') }}</div>
            </div>
          </div>
          <div class="col-4">
            <div class="stat-inline">
              <div class="text-h5 text-positive">{{ summary?.statistics.lactating_cows || 0 }}</div>
              <div class="text-caption text-grey-6">{{ $t('farmer.lactating') }}</div>
            </div>
          </div>
          <div class="col-4">
            <div class="stat-inline">
              <div class="text-h5 text-grey-7">{{ dryCows }}</div>
              <div class="text-caption text-grey-6">{{ $t('cow.dry') }}</div>
            </div>
          </div>
          <div class="col-6">
            <div class="stat-inline">
              <div class="text-h5 text-info">{{ summary?.statistics.total_daily_milk_production?.toFixed(1) || '0' }}</div>
              <div class="text-caption text-grey-6">{{ $t('farmer.dailyMilk') }}</div>
            </div>
          </div>
          <div class="col-6">
            <div class="stat-inline">
              <div class="text-h5 text-warning">{{ summary?.statistics.avg_milk_per_lactating_cow?.toFixed(1) || '0' }}</div>
              <div class="text-caption text-grey-6">{{ $t('farmer.avgPerCow') }}</div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-6">
            <q-btn
              color="primary"
              class="full-width"
              unelevated
              :label="`${$t('farmer.viewCows')} (${cows.length})`"
              :icon="COW_ICON"
              @click="router.push({ path: '/cows', query: { farmer_id: farmerId } })"
            />
          </div>
          <div class="col-6">
            <q-btn
              outline
              color="primary"
              class="full-width"
              :label="$t('farmer.viewYields')"
              icon="analytics"
              @click="router.push({ path: '/yields', query: { farmer: farmerId } })"
            />
          </div>
        </div>

        <!-- Farm Details -->
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ $t('farmer.farmDetails') }}</div>
            <q-list dense>
              <q-item v-if="farmer.farming_type">
                <q-item-section avatar>
                  <q-icon name="agriculture" color="grey-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>{{ $t('farmer.farmingType') }}</q-item-label>
                  <q-item-label class="text-capitalize">{{ $t(`farmer.farmingTypes.${farmer.farming_type}`) }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="farmer.land_acres">
                <q-item-section avatar>
                  <q-icon name="landscape" color="grey-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>{{ $t('farmer.landArea') }}</q-item-label>
                  <q-item-label>{{ farmer.land_acres }} {{ $t('farmer.acres') }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item>
                <q-item-section avatar>
                  <q-icon name="calendar_today" color="grey-6" />
                </q-item-section>
                <q-item-section>
                  <q-item-label caption>{{ $t('farmer.addedOn') }}</q-item-label>
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
              <div class="text-subtitle1 text-weight-medium">{{ $t('farmer.totalCattle') }}</div>
              <q-btn
                flat
                dense
                color="primary"
                :label="$t('farmer.addCow')"
                icon="add"
                @click="addCowForFarmer"
              />
            </div>

            <template v-if="cows.length === 0">
              <div class="text-center q-pa-md text-grey-6">
                <q-icon :name="COW_ICON" size="32px" class="q-mb-sm" />
                <div>{{ $t('farmer.noCattleYet') }}</div>
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
                    <q-icon :name="COW_ICON" size="20px" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ cow.name }}</q-item-label>
                  <q-item-label caption>
                    {{ cow.breed }} &middot; {{ cow.body_weight }}{{ $t('units.kg') }}
                    <span v-if="cow.lactating"> &middot; {{ cow.milk_production }}{{ $t('units.l') }}{{ $t('units.perDay') }}</span>
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
        <div class="section-label">{{ $t('dashboard.quickActions') }}</div>
        <div class="action-row q-mb-md">
          <button class="action-row__btn" @click="addCowForFarmer">
            <q-icon name="add" />
            {{ $t('farmer.addCow') }}
          </button>
          <button class="action-row__btn" @click="router.push({ name: 'log-new', query: { farmer: farmerId } })">
            <q-icon name="water_drop" />
            {{ $t('logs.logMilk') }}
          </button>
          <button class="action-row__btn" @click="router.push({ path: '/diet/new', query: { farmer_id: farmerId } })">
            <q-icon name="menu_book" />
            {{ $t('dashboard.getFarmerDiet') }}
          </button>
        </div>
      </template>
    </PullToRefresh>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useFarmersStore, FarmerSummary } from 'src/stores/farmers';
import { useDateFormat } from 'src/composables/useDateFormat';
import PullToRefresh from 'src/components/ui/PullToRefresh.vue';
import SkeletonCard from 'src/components/ui/SkeletonCard.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';
import { COW_ICON } from 'src/boot/icons';

useI18n(); // Used for template translations via $t

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
const { formatDate } = useDateFormat();

const farmerId = computed(() => route.params.id as string);
const farmer = computed(() =>
  farmersStore.farmers.find((f) => f.id === farmerId.value)
);

const summary = ref<FarmerSummary | null>(null);
const cows = ref<CowInfo[]>([]);

const loading = computed(() => farmersStore.loading);

// Dry cows = total - lactating
const dryCows = computed(() => {
  const total = summary.value?.statistics.total_active_cows ?? farmer.value?.total_cattle ?? 0;
  const lactating = summary.value?.statistics.lactating_cows ?? 0;
  return Math.max(0, total - lactating);
});

async function loadFarmerData() {
  if (!farmerId.value) return;

  // Fetch farmer profile
  await farmersStore.fetchFarmer(farmerId.value);

  // Fetch summary with statistics
  summary.value = await farmersStore.getFarmerSummary(farmerId.value);

  // Fetch farmer's cattle
  const cowsData = await farmersStore.getFarmerCows(farmerId.value);
  cows.value = cowsData as CowInfo[];

  // Sync total_cattle with actual cow count so list page stays accurate
  const actualCount = summary.value?.statistics.total_active_cows ?? cows.value.length;
  if (farmer.value && farmer.value.total_cattle !== actualCount) {
    farmersStore.updateFarmer(farmerId.value, { total_cattle: actualCount });
  }
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
  border-radius: $radius-loose;
}
</style>
