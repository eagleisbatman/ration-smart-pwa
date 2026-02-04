<template>
  <q-page class="q-pa-md">
    <PullToRefresh @refresh="onRefresh">
      <!-- Search Bar -->
      <q-input
        v-model="searchQuery"
        outlined
        dense
        placeholder="Search farmers..."
        class="q-mb-md"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
        <template v-slot:append v-if="searchQuery">
          <q-icon name="close" class="cursor-pointer" @click="searchQuery = ''" />
        </template>
      </q-input>

      <!-- Filter Chips -->
      <div class="row q-gutter-sm q-mb-md">
        <q-chip
          :outline="filterType !== 'all'"
          :color="filterType === 'all' ? 'primary' : undefined"
          clickable
          @click="filterType = 'all'"
        >
          All ({{ farmerCount }})
        </q-chip>
        <q-chip
          :outline="filterType !== 'dairy'"
          :color="filterType === 'dairy' ? 'primary' : undefined"
          clickable
          @click="filterType = 'dairy'"
        >
          Dairy
        </q-chip>
        <q-chip
          :outline="filterType !== 'mixed'"
          :color="filterType === 'mixed' ? 'primary' : undefined"
          clickable
          @click="filterType = 'mixed'"
        >
          Mixed
        </q-chip>
      </div>

      <!-- Loading State -->
      <template v-if="loading && farmers.length === 0">
        <SkeletonList :count="5" />
      </template>

      <!-- Empty State -->
      <template v-else-if="farmers.length === 0">
        <EmptyState
          icon="people"
          title="No Farmers Yet"
          description="Add farmer profiles to manage their cattle and track milk production data."
          action-label="Add Farmer"
          action-icon="person_add"
          @action="router.push('/farmers/new')"
        />
      </template>

      <!-- Farmer List -->
      <template v-else>
        <q-list separator class="rounded-borders" bordered>
          <q-item
            v-for="farmer in filteredFarmers"
            :key="farmer.id"
            clickable
            v-ripple
            @click="router.push(`/farmers/${farmer.id}`)"
          >
            <q-item-section avatar>
              <q-avatar :color="farmer.is_active ? 'teal' : 'grey'" text-color="white">
                <q-icon name="person" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ farmer.name }}</q-item-label>
              <q-item-label caption>
                <span v-if="farmer.village">{{ farmer.village }}</span>
                <span v-if="farmer.village && farmer.district">, </span>
                <span v-if="farmer.district">{{ farmer.district }}</span>
              </q-item-label>
              <q-item-label caption class="text-grey-6">
                {{ farmer.total_cattle }} cattle
                <span v-if="farmer.farming_type"> &middot; {{ farmer.farming_type }}</span>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row items-center">
                <q-chip
                  v-if="!farmer._synced"
                  size="sm"
                  color="warning"
                  text-color="white"
                  icon="sync"
                  dense
                >
                  Pending
                </q-chip>
                <q-icon name="chevron_right" color="grey" />
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <!-- No Search Results -->
        <div v-if="filteredFarmers.length === 0" class="text-center q-pa-xl">
          <q-icon name="search_off" size="48px" color="grey-4" />
          <div class="text-body2 text-grey-7 q-mt-sm">
            No farmers found matching "{{ searchQuery }}"
          </div>
        </div>
      </template>
    </PullToRefresh>

    <!-- FAB for adding new farmer -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="person_add" color="primary" @click="router.push('/farmers/new')" />
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useFarmersStore } from 'src/stores/farmers';
import PullToRefresh from 'src/components/ui/PullToRefresh.vue';
import SkeletonList from 'src/components/ui/SkeletonList.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';

const router = useRouter();
const farmersStore = useFarmersStore();

const searchQuery = ref('');
const filterType = ref<'all' | 'dairy' | 'mixed' | 'crop'>('all');

const loading = computed(() => farmersStore.loading);
const farmers = computed(() => farmersStore.activeFarmers);
const farmerCount = computed(() => farmersStore.activeFarmerCount);

const filteredFarmers = computed(() => {
  let result = farmers.value;

  // Filter by farming type
  if (filterType.value !== 'all') {
    result = result.filter((f) => f.farming_type === filterType.value);
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (farmer) =>
        farmer.name.toLowerCase().includes(query) ||
        farmer.village?.toLowerCase().includes(query) ||
        farmer.district?.toLowerCase().includes(query) ||
        farmer.phone?.includes(query)
    );
  }

  return result;
});

async function onRefresh(done: () => void) {
  await farmersStore.fetchFarmers();
  done();
}

onMounted(() => {
  farmersStore.fetchFarmers();
});
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: 12px;
  overflow: hidden;
}
</style>
