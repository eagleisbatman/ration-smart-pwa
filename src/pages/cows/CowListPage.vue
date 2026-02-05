<template>
  <q-page class="q-pa-md">
    <PullToRefresh @refresh="onRefresh">
      <!-- Search Bar -->
      <q-input
        v-model="searchQuery"
        outlined
        dense
        placeholder="Search cows..."
        class="q-mb-md"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
        <template v-if="searchQuery" #append>
          <q-icon name="close" class="cursor-pointer" @click="searchQuery = ''" />
        </template>
      </q-input>

      <!-- Loading State -->
      <template v-if="loading && cows.length === 0">
        <SkeletonList :count="5" />
      </template>

      <!-- Empty State -->
      <template v-else-if="cows.length === 0">
        <EmptyState
          icon="pets"
          title="No Cows Yet"
          description="Add your first cow to start tracking milk production and get diet recommendations."
          action-label="Add Cow"
          action-icon="add"
          @action="router.push('/cows/new')"
        />
      </template>

      <!-- Cow List -->
      <template v-else>
        <q-list separator class="rounded-borders" bordered>
          <q-item
            v-for="cow in filteredCows"
            :key="cow.id"
            v-ripple
            clickable
            @click="router.push(`/cows/${cow.id}`)"
          >
            <q-item-section avatar>
              <q-avatar :color="cow.is_active ? 'primary' : 'grey'" text-color="white">
                <q-icon name="pets" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ cow.name }}</q-item-label>
              <q-item-label caption>
                {{ cow.breed }} · {{ cow.weight_kg }}kg · {{ cow.milk_yield_liters }}L/day
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row items-center">
                <q-chip
                  v-if="!cow._synced"
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
        <div v-if="filteredCows.length === 0" class="text-center q-pa-xl">
          <q-icon name="search_off" size="48px" color="grey-4" />
          <div class="text-body2 text-grey-7 q-mt-sm">
            No cows found matching "{{ searchQuery }}"
          </div>
        </div>
      </template>
    </PullToRefresh>

    <!-- FAB for adding new cow -->
    <q-page-sticky position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="router.push('/cows/new')" />
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCowsStore } from 'src/stores/cows';

const router = useRouter();
import PullToRefresh from 'src/components/ui/PullToRefresh.vue';
import SkeletonList from 'src/components/ui/SkeletonList.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';

const cowsStore = useCowsStore();

const searchQuery = ref('');

const loading = computed(() => cowsStore.loading);
const cows = computed(() => cowsStore.activeCows);

const filteredCows = computed(() => {
  if (!searchQuery.value) return cows.value;

  const query = searchQuery.value.toLowerCase();
  return cows.value.filter(
    (cow) =>
      cow.name.toLowerCase().includes(query) ||
      cow.breed.toLowerCase().includes(query)
  );
});

async function onRefresh(done: () => void) {
  await cowsStore.fetchCows();
  done();
}

onMounted(() => {
  cowsStore.fetchCows();
});
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: 12px;
  overflow: hidden;
}
</style>
