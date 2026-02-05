<template>
  <q-page class="q-pa-md">
    <PullToRefresh @refresh="onRefresh">
      <!-- Filters -->
      <div class="row q-gutter-sm q-mb-md">
        <q-select
          v-model="selectedFarmer"
          :options="farmerOptions"
          label="Filter by Farmer"
          outlined
          dense
          clearable
          emit-value
          map-options
          class="col"
        />
        <q-btn
          flat
          round
          icon="date_range"
          @click="showDateFilter = true"
        />
      </div>

      <!-- Date Range Display -->
      <div v-if="dateFrom || dateTo" class="q-mb-md">
        <q-chip
          removable
          color="primary"
          text-color="white"
          @remove="clearDateFilter"
        >
          {{ formatDateRange }}
        </q-chip>
      </div>

      <!-- Loading State -->
      <template v-if="loading && yieldRecords.length === 0">
        <SkeletonList :count="5" />
      </template>

      <!-- Empty State -->
      <template v-else-if="yieldRecords.length === 0">
        <EmptyState
          icon="analytics"
          title="No Yield Records"
          description="Start recording milk yields to track production over time."
          action-label="Record Yield"
          action-icon="add_chart"
          @action="router.push('/yields/new')"
        />
      </template>

      <!-- Yield List -->
      <template v-else>
        <!-- Summary Card -->
        <q-card class="q-mb-md bg-primary text-white">
          <q-card-section>
            <div class="row q-gutter-md text-center">
              <div class="col">
                <div class="text-h5">{{ totalRecords }}</div>
                <div class="text-caption">Records</div>
              </div>
              <div class="col">
                <div class="text-h5">{{ avgYield }}</div>
                <div class="text-caption">Avg L/day</div>
              </div>
              <div class="col">
                <div class="text-h5">{{ avgFat }}%</div>
                <div class="text-caption">Avg Fat</div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <q-list separator class="rounded-borders" bordered>
          <q-item
            v-for="record in yieldRecords"
            :key="record.id"
            v-ripple
            clickable
          >
            <q-item-section avatar>
              <q-avatar color="positive" text-color="white">
                <q-icon name="water_drop" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ formatDate(record.collection_date) }}</q-item-label>
              <q-item-label caption>
                {{ record.milk_yield_liters?.toFixed(1) || '0' }}L
                <span v-if="record.fat_percentage"> &middot; Fat: {{ record.fat_percentage }}%</span>
                <span v-if="record.snf_percentage"> &middot; SNF: {{ record.snf_percentage }}%</span>
              </q-item-label>
              <q-item-label v-if="record.notes" caption class="text-grey-6">
                {{ record.notes }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-chip
                v-if="!record._synced"
                size="sm"
                color="warning"
                text-color="white"
                icon="sync"
                dense
              >
                Pending
              </q-chip>
            </q-item-section>
          </q-item>
        </q-list>
      </template>
    </PullToRefresh>

    <!-- FAB for adding new yield -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn
        fab
        icon="add_chart"
        color="primary"
        @click="navigateToNewYield"
      />
    </q-page-sticky>

    <!-- Date Range Dialog -->
    <q-dialog v-model="showDateFilter">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Filter by Date</div>
        </q-card-section>

        <q-card-section class="q-gutter-md">
          <q-input
            v-model="dateFrom"
            label="From"
            type="date"
            outlined
            dense
          />
          <q-input
            v-model="dateTo"
            label="To"
            type="date"
            outlined
            dense
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Clear" @click="clearDateFilter" />
          <q-btn v-close-popup flat label="Apply" color="primary" @click="applyDateFilter" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useYieldsStore } from 'src/stores/yields';
import { useFarmersStore } from 'src/stores/farmers';
import PullToRefresh from 'src/components/ui/PullToRefresh.vue';
import SkeletonList from 'src/components/ui/SkeletonList.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';

const router = useRouter();
const route = useRoute();
const yieldsStore = useYieldsStore();
const farmersStore = useFarmersStore();

const selectedFarmer = ref<string | null>(null);
const dateFrom = ref<string | null>(null);
const dateTo = ref<string | null>(null);
const showDateFilter = ref(false);

const loading = computed(() => yieldsStore.loading);
const yieldRecords = computed(() => yieldsStore.yieldRecords);

const totalRecords = computed(() => yieldRecords.value.length);
const avgYield = computed(() => yieldsStore.averageMilkYield.toFixed(1));
const avgFat = computed(() => {
  const records = yieldRecords.value.filter((y) => y.fat_percentage != null);
  if (records.length === 0) return '0.0';
  const sum = records.reduce((acc, y) => acc + (y.fat_percentage || 0), 0);
  return (sum / records.length).toFixed(1);
});

const farmerOptions = computed(() =>
  farmersStore.activeFarmers.map((f) => ({
    label: f.name,
    value: f.id,
  }))
);

const formatDateRange = computed(() => {
  if (dateFrom.value && dateTo.value) {
    return `${formatDate(dateFrom.value)} - ${formatDate(dateTo.value)}`;
  }
  if (dateFrom.value) {
    return `From ${formatDate(dateFrom.value)}`;
  }
  if (dateTo.value) {
    return `Until ${formatDate(dateTo.value)}`;
  }
  return '';
});

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

async function loadData() {
  if (selectedFarmer.value) {
    await yieldsStore.fetchFarmerYieldHistory(selectedFarmer.value, {
      dateFrom: dateFrom.value || undefined,
      dateTo: dateTo.value || undefined,
    });
  } else {
    await yieldsStore.fetchYieldHistory({
      dateFrom: dateFrom.value || undefined,
      dateTo: dateTo.value || undefined,
    });
  }
}

async function onRefresh(done: () => void) {
  await loadData();
  done();
}

function clearDateFilter() {
  dateFrom.value = null;
  dateTo.value = null;
  loadData();
}

function applyDateFilter() {
  loadData();
}

function navigateToNewYield() {
  const query: Record<string, string> = {};
  if (selectedFarmer.value) {
    query.farmer = selectedFarmer.value;
  }
  router.push({ path: '/yields/new', query });
}

// Watch for farmer filter changes
watch(selectedFarmer, () => {
  loadData();
});

onMounted(() => {
  // Check for farmer query param
  if (route.query.farmer) {
    selectedFarmer.value = route.query.farmer as string;
  }
  loadData();
  farmersStore.fetchFarmers();
});
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: 12px;
  overflow: hidden;
}
</style>
