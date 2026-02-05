<template>
  <q-page class="q-pa-md">
    <PullToRefresh @refresh="onRefresh">
      <!-- Tabs for Master/Custom -->
      <q-tabs
        v-model="activeTab"
        class="text-grey q-mb-md"
        active-color="primary"
        indicator-color="primary"
        align="justify"
      >
        <q-tab name="master" label="Master Feeds" />
        <q-tab name="custom" label="My Feeds" />
      </q-tabs>

      <!-- Search -->
      <q-input
        v-model="searchQuery"
        outlined
        dense
        placeholder="Search feeds..."
        class="q-mb-md"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
        <template v-if="searchQuery" #append>
          <q-icon name="close" class="cursor-pointer" @click="searchQuery = ''" />
        </template>
      </q-input>

      <!-- Loading -->
      <template v-if="loading && feeds.length === 0">
        <SkeletonList :count="5" />
      </template>

      <!-- Empty State -->
      <template v-else-if="feeds.length === 0">
        <EmptyState
          v-if="activeTab === 'custom'"
          icon="grass"
          title="No Custom Feeds"
          description="Add your own feed ingredients with custom nutritional values and prices."
          action-label="Add Feed"
          action-icon="add"
          @action="router.push('/feeds/new')"
        />
        <EmptyState
          v-else
          icon="grass"
          title="No Master Feeds"
          description="Master feeds will be loaded from the server when online."
        />
      </template>

      <!-- Feed List grouped by category -->
      <template v-else>
        <div v-for="(categoryFeeds, category) in groupedFeeds" :key="category" class="q-mb-md">
          <div class="text-subtitle2 text-grey-7 q-mb-xs">{{ category }}</div>
          <q-list bordered separator class="rounded-borders">
            <q-item
              v-for="feed in categoryFeeds"
              :key="feed.id"
              v-ripple
              clickable
              @click="router.push(`/feeds/${feed.id}`)"
            >
              <q-item-section avatar>
                <q-avatar :color="feed.is_custom ? 'secondary' : 'primary'" text-color="white">
                  <q-icon name="grass" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ feed.name }}</q-item-label>
                <q-item-label caption>
                  CP: {{ feed.cp_percentage }}% · TDN: {{ feed.tdn_percentage }}% · DM: {{ feed.dm_percentage }}%
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-item-label v-if="feed.price_per_kg">₹{{ feed.price_per_kg }}/kg</q-item-label>
                <q-chip v-if="feed.is_custom" size="sm" color="secondary" text-color="white" dense>
                  Custom
                </q-chip>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- No search results -->
        <div v-if="Object.keys(groupedFeeds).length === 0" class="text-center q-pa-xl">
          <q-icon name="search_off" size="48px" color="grey-4" />
          <div class="text-body2 text-grey-7 q-mt-sm">
            No feeds found matching "{{ searchQuery }}"
          </div>
        </div>
      </template>
    </PullToRefresh>

    <!-- FAB for adding custom feed -->
    <q-page-sticky v-if="activeTab === 'custom'" position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="router.push('/feeds/new')" />
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useFeedsStore } from 'src/stores/feeds';

const router = useRouter();
import PullToRefresh from 'src/components/ui/PullToRefresh.vue';
import SkeletonList from 'src/components/ui/SkeletonList.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';

const feedsStore = useFeedsStore();

const activeTab = ref<'master' | 'custom'>('master');
const searchQuery = ref('');

const loading = computed(() => feedsStore.loading);

const feeds = computed(() =>
  activeTab.value === 'master' ? feedsStore.masterFeeds : feedsStore.customFeeds
);

const filteredFeeds = computed(() => {
  if (!searchQuery.value) return feeds.value;
  const query = searchQuery.value.toLowerCase();
  return feeds.value.filter(
    (f) =>
      f.name.toLowerCase().includes(query) ||
      f.category.toLowerCase().includes(query)
  );
});

const groupedFeeds = computed(() => {
  const groups: Record<string, typeof feeds.value> = {};
  for (const feed of filteredFeeds.value) {
    if (!groups[feed.category]) {
      groups[feed.category] = [];
    }
    groups[feed.category].push(feed);
  }
  return groups;
});

async function onRefresh(done: () => void) {
  await feedsStore.fetchAllFeeds();
  done();
}

watch(activeTab, () => {
  searchQuery.value = '';
});

onMounted(() => {
  feedsStore.fetchAllFeeds();
});
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: 12px;
  overflow: hidden;
}
</style>
