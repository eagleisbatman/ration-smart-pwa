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
        <q-tab name="master" :label="$t('feed.tabs.master')" />
        <q-tab name="custom" :label="$t('feed.tabs.custom')" />
      </q-tabs>

      <!-- Search & Compare Toggle -->
      <div class="row q-gutter-sm q-mb-md items-center">
        <q-input
          v-model="searchQuery"
          outlined
          dense
          :placeholder="$t('feed.search.placeholder')"
          class="col"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
          <template v-if="searchQuery" #append>
            <q-icon name="close" class="cursor-pointer" @click="searchQuery = ''" />
          </template>
        </q-input>
        <q-btn
          :flat="!compareMode"
          :outline="compareMode"
          :color="compareMode ? 'primary' : 'grey-7'"
          icon="compare_arrows"
          dense
          round
          @click="toggleCompareMode"
        >
          <q-tooltip>{{ $t('feed.compare') }}</q-tooltip>
        </q-btn>
      </div>

      <!-- Compare Banner -->
      <q-banner v-if="compareMode" class="bg-blue-1 q-mb-md rounded-borders" dense>
        <template #avatar>
          <q-icon name="compare_arrows" color="primary" />
        </template>
        {{ $t('feed.selectToCompare') }}
        <span v-if="selectedFeeds.length > 0" class="text-weight-bold"> ({{ selectedFeeds.length }}/2)</span>
        <template #action>
          <q-btn
            v-if="selectedFeeds.length === 2"
            flat
            color="primary"
            :label="$t('feed.compareFeeds')"
            @click="showCompareDialog = true"
          />
          <q-btn flat color="grey" :label="$t('common.cancel')" @click="toggleCompareMode" />
        </template>
      </q-banner>

      <!-- Loading -->
      <template v-if="loading && feeds.length === 0">
        <SkeletonList :count="5" />
      </template>

      <!-- Empty State -->
      <template v-else-if="feeds.length === 0">
        <EmptyState
          v-if="activeTab === 'custom'"
          icon="grass"
          :title="$t('feed.empty.customTitle')"
          :description="$t('feed.empty.customDescription')"
          :action-label="$t('feed.addFeed')"
          action-icon="add"
          @action="router.push('/feeds/new')"
        />
        <EmptyState
          v-else
          icon="grass"
          :title="$t('feed.empty.masterTitle')"
          :description="$t('feed.empty.masterDescription')"
        />
      </template>

      <!-- Feed List grouped by category -->
      <template v-else>
        <div v-for="(categoryFeeds, category) in groupedFeeds" :key="category" class="q-mb-md">
          <div class="text-subtitle2 text-grey-7 q-mb-xs">{{ translateCategory(String(category)) }}</div>
          <q-list bordered separator class="rounded-borders">
            <q-item
              v-for="feed in categoryFeeds"
              :key="feed.id"
              v-ripple
              clickable
              :class="{ 'bg-blue-1': compareMode && isSelected(feed.id) }"
              @click="compareMode ? toggleFeedSelection(feed) : router.push(`/feeds/${feed.id}`)"
            >
              <q-item-section v-if="compareMode" side>
                <q-checkbox
                  :model-value="isSelected(feed.id)"
                  @update:model-value="toggleFeedSelection(feed)"
                  @click.stop
                />
              </q-item-section>
              <q-item-section avatar>
                <q-avatar :color="feed.is_custom ? 'secondary' : 'primary'" text-color="white">
                  <q-img
                    v-if="feed.image_url"
                    :src="feed.image_url"
                    :ratio="1"
                    style="width: 100%; height: 100%; border-radius: 50%"
                  />
                  <q-icon v-else name="grass" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label>{{ feed.name }}</q-item-label>
                <q-item-label v-if="feed.fd_name && feed.fd_name !== feed.name" caption class="text-grey-5 text-italic">
                  {{ feed.fd_name }}
                </q-item-label>
                <q-item-label caption>
                  {{ $t('feed.labels.cpPercentShort') }}: {{ feed.cp_percentage != null ? feed.cp_percentage + '%' : '–' }} · {{ $t('feed.labels.tdnPercentShort') }}: {{ feed.tdn_percentage != null ? feed.tdn_percentage + '%' : '–' }} · {{ $t('feed.labels.dmPercentShort') }}: {{ feed.dm_percentage != null ? feed.dm_percentage + '%' : '–' }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-item-label v-if="feed.price_per_kg">{{ formatCurrency(feed.price_per_kg) }}{{ $t('units.perKg') }}</q-item-label>
                <q-chip v-if="feed.is_custom" size="sm" color="secondary" text-color="white" dense>
                  {{ $t('feed.custom') }}
                </q-chip>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- No search results -->
        <div v-if="Object.keys(groupedFeeds).length === 0" class="text-center q-pa-xl">
          <q-icon name="search_off" size="48px" color="grey-4" />
          <div class="text-body2 text-grey-7 q-mt-sm">
            {{ $t('feed.search.noResults', { query: searchQuery }) }}
          </div>
        </div>
      </template>
    </PullToRefresh>

    <!-- FAB for adding custom feed -->
    <q-page-sticky v-if="activeTab === 'custom' && !compareMode" position="bottom-right" :offset="[16, 72]">
      <q-btn fab icon="add" color="primary" @click="router.push('/feeds/new')" />
    </q-page-sticky>

    <!-- Feed Compare Dialog -->
    <FeedCompareDialog
      v-model="showCompareDialog"
      :feed-a="compareFeedA"
      :feed-b="compareFeedB"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useFeedsStore } from 'src/stores/feeds';
import { useCurrency } from 'src/composables/useCurrency';

const { t } = useI18n();

const CATEGORY_I18N_MAP: Record<string, string> = {
  Concentrate: 'feed.categories.concentrate',
  Roughage: 'feed.categories.roughage',
  'Green Fodder': 'feed.categories.greenFodder',
  'Dry Fodder': 'feed.categories.dryFodder',
  Silage: 'feed.categories.silage',
  'By-product': 'feed.categories.byProduct',
  'Mineral Mix': 'feed.categories.mineralMix',
  Other: 'feed.categories.other',
};

function translateCategory(category: string): string {
  const key = CATEGORY_I18N_MAP[category];
  return key ? t(key) : category;
}

const router = useRouter();
const { formatCurrency } = useCurrency();
import PullToRefresh from 'src/components/ui/PullToRefresh.vue';
import SkeletonList from 'src/components/ui/SkeletonList.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';
import FeedCompareDialog from 'src/components/feeds/FeedCompareDialog.vue';
import { Feed } from 'src/lib/offline/db';

const feedsStore = useFeedsStore();

const activeTab = ref<'master' | 'custom'>('master');
const searchQuery = ref('');
const compareMode = ref(false);
const selectedFeeds = ref<Feed[]>([]);
const showCompareDialog = ref(false);

const compareFeedA = computed(() => selectedFeeds.value[0] || null);
const compareFeedB = computed(() => selectedFeeds.value[1] || null);

function toggleCompareMode() {
  compareMode.value = !compareMode.value;
  if (!compareMode.value) {
    selectedFeeds.value = [];
  }
}

function isSelected(feedId: string): boolean {
  return selectedFeeds.value.some((f) => f.id === feedId);
}

function toggleFeedSelection(feed: Feed) {
  const idx = selectedFeeds.value.findIndex((f) => f.id === feed.id);
  if (idx >= 0) {
    selectedFeeds.value.splice(idx, 1);
  } else if (selectedFeeds.value.length < 2) {
    selectedFeeds.value.push(feed);
  }
}

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
      f.category.toLowerCase().includes(query) ||
      translateCategory(f.category).toLowerCase().includes(query)
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
