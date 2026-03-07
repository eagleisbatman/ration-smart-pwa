<template>
  <q-page class="q-pa-md">
    <!-- Top buttons row: Custom Diet Limits + Custom Feed -->
    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-6">
        <q-btn
          outline
          no-caps
          color="primary"
          icon="tune"
          :label="$t('simulation.feedSelect.customLimits')"
          class="full-width top-btn"
          @click="showConstraints = true"
        />
      </div>
      <div class="col-6">
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="add"
          :label="$t('simulation.feedSelect.customFeed')"
          class="full-width top-btn"
          disable
        >
          <q-badge floating color="warning" text-color="dark" label="Coming Soon" />
        </q-btn>
      </div>
    </div>

    <!-- Diet Mode Radio Toggle -->
    <div class="row items-center q-mb-md mode-toggle" role="radiogroup" :aria-label="$t('simulation.dietMode', 'Diet mode')">
      <q-radio
        v-model="dietMode"
        val="recommendation"
        :label="$t('simulation.feedSelect.dietRecommendation')"
        color="primary"
        class="col-6"
      />
      <q-radio
        v-model="dietMode"
        val="evaluation"
        :label="$t('simulation.feedSelect.dietEvaluation')"
        color="primary"
        class="col-6"
      />
    </div>

    <!-- Feed Type Toggle -->
    <div class="view-toggle q-mb-md">
      <q-btn-toggle
        v-model="feedTypeFilter"
        spread
        no-caps
        rounded
        unelevated
        toggle-color="primary"
        color="white"
        text-color="primary"
        :options="[
          { label: $t('simulation.feedSelect.filterAll'), value: 'all' },
          { label: $t('simulation.feedSelect.filterForage'), value: 'Forage' },
          { label: $t('simulation.feedSelect.filterConcentrate'), value: 'Concentrate' },
        ]"
      />
    </div>

    <!-- Category Dropdown -->
    <q-select
      v-model="categoryFilter"
      :label="$t('simulation.feedSelect.category')"
      :options="categoryOptions"
      emit-value
      map-options
      outlined
      dense
      clearable
      behavior="menu"
      class="q-mb-md"
    />

    <!-- Search -->
    <q-input
      v-model="searchQuery"
      outlined
      dense
      :label="$t('feed.search.placeholder')"
      class="q-mb-md"
    >
      <template #prepend>
        <q-icon name="search" />
      </template>
      <template v-if="searchQuery" #append>
        <q-icon name="close" class="cursor-pointer" aria-label="Clear search" role="button" tabindex="0" @click="searchQuery = ''" />
      </template>
    </q-input>

    <!-- Feed List (checkboxes) -->
    <template v-if="feedsStore.loading && feedsStore.allFeeds.length === 0">
      <q-skeleton v-for="i in 6" :key="i" height="48px" class="q-mb-xs rounded-borders" />
    </template>

    <div v-else-if="feedsStore.error" class="text-center q-pa-md q-mb-md">
      <q-icon name="cloud_off" size="32px" color="negative" />
      <div class="text-body2 text-negative q-mt-xs">{{ feedsStore.error }}</div>
      <q-btn flat no-caps color="primary" :label="$t('common.retry')" class="q-mt-sm" @click="feedsStore.fetchAllFeeds()" />
    </div>

    <div v-else-if="filteredFeeds.length === 0" class="text-center text-grey-5 q-pa-md q-mb-md">
      <q-icon name="search_off" size="32px" />
      <div class="q-mt-xs">{{ $t('feed.search.noResults', { query: searchQuery }) }}</div>
    </div>

    <q-virtual-scroll
      v-else
      :items="filteredFeeds"
      :virtual-scroll-item-size="72"
      style="max-height: 45vh"
      class="rounded-borders q-mb-md bordered-scroll"
      separator
    >
      <template #default="{ item: feed }">
        <q-item :key="feed.id" dense>
          <q-item-section side>
            <q-checkbox
              :model-value="isSelected(feed.id)"
              @update:model-value="toggleFeed(feed)"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ getFeedDisplayName(feed, locale) }}</q-item-label>
            <q-item-label caption>
              {{ translateCategory(feed.category, t) }}
              <q-badge v-if="feed.fd_type" :label="translateFeedType(feed.fd_type)" color="grey-5" text-color="white" class="q-ml-xs" />
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-item-label v-if="feed.price_per_kg" caption>{{ formatCurrency(feed.price_per_kg) }}/{{ $t('simulation.units.kg') }}</q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-virtual-scroll>

    <!-- Selected Feeds Panel -->
    <template v-if="simStore.selectedFeeds.length > 0">
      <div class="text-subtitle1 text-weight-medium q-mb-sm">
        {{ $t('simulation.feedSelect.selectedFeeds') }} ({{ simStore.selectedFeeds.length }})
      </div>

      <q-card
        v-for="(sf, idx) in simStore.selectedFeeds"
        :key="sf.feed_id"
        flat
        bordered
        class="q-mb-sm rounded-borders"
      >
        <q-card-section class="q-py-sm">
          <div class="row items-center no-wrap q-mb-xs">
            <div class="col">
              <span class="text-body2 text-weight-medium">{{ sf.feed_name }}</span>
              <span class="text-caption text-grey-6"> ({{ idx + 1 }})</span>
            </div>
            <q-btn flat round dense icon="close" size="sm" color="grey-5" :aria-label="$t('common.remove', 'Remove') + ' ' + sf.feed_name" @click="removeFeed(idx)" />
          </div>

          <div class="text-caption text-grey-6 q-mb-sm">
            <span :class="sf.fd_type === 'Forage' ? 'text-green-7' : 'text-blue-7'">{{ translateFeedType(sf.fd_type) }}</span>
            <span v-if="sf.fd_category"> · {{ sf.fd_category }}</span>
          </div>

          <div class="row q-col-gutter-sm">
            <div :class="dietMode === 'evaluation' ? 'col-6' : 'col-12'">
              <q-input
                v-model.number="simStore.selectedFeeds[idx].price_per_kg"
                :label="$t('simulation.feedSelect.pricePerKg')"
                type="number"
                outlined
                dense
                step="0.1"
                :suffix="'/' + $t('simulation.units.kg')"
                hide-bottom-space
                :rules="[(v: number) => v > 0 || $t('simulation.validation.priceMin')]"
              />
            </div>
            <div v-if="dietMode === 'evaluation'" class="col-6">
              <q-input
                v-model.number="simStore.selectedFeeds[idx].quantity_as_fed"
                :label="$t('simulation.feedSelect.quantityKg')"
                type="number"
                outlined
                dense
                step="0.1"
                :suffix="$t('simulation.units.kg')"
                hide-bottom-space
                :rules="[(v: number) => v > 0 || $t('simulation.validation.quantityMin')]"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </template>

    <template v-else>
      <div class="text-center text-grey-5 q-pa-md q-mb-md">
        <q-icon name="playlist_add" size="32px" />
        <div class="q-mt-xs">{{ $t('simulation.feedSelect.noFeedsSelected') }}</div>
      </div>
    </template>

    <!-- Single Action Button (changes based on mode) -->
    <div class="action-bar">
      <q-btn
        :label="dietMode === 'recommendation'
          ? $t('simulation.feedSelect.generateRecommendation')
          : $t('simulation.feedSelect.getEvaluation')"
        color="primary"
        class="full-width action-btn"
        unelevated
        no-caps
        icon-right="arrow_forward"
        :loading="simStore.recommending || simStore.evaluating"
        :disable="simStore.selectedFeeds.length === 0"
        @click="dietMode === 'recommendation' ? runRecommendation() : runEvaluation()"
      />
    </div>

    <!-- Loading Overlay -->
    <q-dialog v-model="showGenerating" persistent>
      <q-card class="text-center q-pa-lg" style="min-width: 280px" aria-live="polite">
        <q-spinner-gears size="48px" color="primary" />
        <div class="text-body1 q-mt-md">{{ $t('simulation.generating') }}</div>
        <div class="text-caption text-grey-6 q-mt-xs">{{ $t('simulation.generatingDesc') }}</div>
        <q-btn flat no-caps color="grey-7" :label="$t('common.cancel')" class="q-mt-md" @click="showGenerating = false" />
      </q-card>
    </q-dialog>

    <!-- Custom Constraints Dialog -->
    <CustomConstraintsDialog v-model="showConstraints" />

    <!-- Custom Feed Dialog (placeholder) -->
    <q-dialog v-model="showCustomFeed">
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">{{ $t('simulation.feedSelect.customFeed') }}</div>
          <div class="text-caption text-grey-6 q-mt-sm">{{ $t('simulation.feedSelect.customFeedHint') }}</div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('common.close')" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useSimulationStore } from 'src/stores/simulation';
import { useFeedsStore } from 'src/stores/feeds';
import { useCurrency } from 'src/composables/useCurrency';
import { getFeedDisplayName, translateCategory } from 'src/composables/useFeedDisplayName';
import { Feed } from 'src/lib/offline/db';
import CustomConstraintsDialog from 'src/components/simulation/CustomConstraintsDialog.vue';

const { t, locale } = useI18n();
const router = useRouter();

function translateFeedType(fdType?: string): string {
  if (!fdType) return '';
  const key = `simulation.feedSelect.feedType_${fdType.toLowerCase()}`;
  const translated = t(key);
  return translated !== key ? translated : fdType;
}
const $q = useQuasar();
const simStore = useSimulationStore();
const feedsStore = useFeedsStore();
const { formatCurrency } = useCurrency();

const dietMode = ref<'recommendation' | 'evaluation'>('recommendation');
const feedTypeFilter = ref('all');
const categoryFilter = ref<string | null>(null);
const searchQuery = ref('');
const showConstraints = ref(false);
const showCustomFeed = ref(false);
const showGenerating = ref(false);

// Reset category filter when type filter changes to avoid stale cross-filter state
watch(feedTypeFilter, () => {
  categoryFilter.value = null;
});

const filteredFeeds = computed(() => {
  let feeds = feedsStore.allFeeds;

  // Type filter
  if (feedTypeFilter.value !== 'all') {
    feeds = feeds.filter((f) => f.fd_type === feedTypeFilter.value);
  }

  // Category filter
  if (categoryFilter.value) {
    feeds = feeds.filter((f) => f.category === categoryFilter.value);
  }

  // Search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    feeds = feeds.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.fd_name && f.fd_name.toLowerCase().includes(q)) ||
        (f.local_name && f.local_name.toLowerCase().includes(q)) ||
        f.category.toLowerCase().includes(q)
    );
  }

  return feeds;
});

const categoryOptions = computed(() => {
  let feeds = feedsStore.allFeeds;
  if (feedTypeFilter.value !== 'all') {
    feeds = feeds.filter((f) => f.fd_type === feedTypeFilter.value);
  }
  const cats = [...new Set(feeds.map((f) => f.category))].sort();
  return [
    { label: t('simulation.feedSelect.allCategories'), value: null },
    ...cats.map((c) => ({ label: translateCategory(c, t), value: c })),
  ];
});

const selectedFeedIds = computed(() => new Set(simStore.selectedFeeds.map((f) => f.feed_id)));

function isSelected(feedId: string): boolean {
  return selectedFeedIds.value.has(feedId);
}

const MAX_SELECTED_FEEDS = 30;

function toggleFeed(feed: Feed) {
  const idx = simStore.selectedFeeds.findIndex((f) => f.feed_id === feed.id);
  if (idx >= 0) {
    simStore.selectedFeeds.splice(idx, 1);
  } else {
    if (simStore.selectedFeeds.length >= MAX_SELECTED_FEEDS) {
      $q.notify({ type: 'warning', message: t('simulation.feedSelect.maxFeedsReached', { max: MAX_SELECTED_FEEDS }) });
      return;
    }
    simStore.selectedFeeds.push({
      feed_id: feed.id,
      feed_name: getFeedDisplayName(feed, locale.value),
      fd_type: feed.fd_type,
      fd_category: feed.category,
      price_per_kg: feed.price_per_kg || 0,
      quantity_as_fed: undefined,
    });
  }
}

function removeFeed(idx: number) {
  simStore.selectedFeeds.splice(idx, 1);
}

async function runEvaluation() {
  // Ensure all selected feeds have quantity > 0 for evaluation
  const missingQty = simStore.selectedFeeds.some(
    (f) => !f.quantity_as_fed || f.quantity_as_fed <= 0
  );
  if (missingQty) {
    $q.notify({ type: 'warning', message: t('simulation.feedSelect.quantityRequired') });
    return;
  }
  // Ensure all feeds have price > 0
  const missingPrice = simStore.selectedFeeds.some(
    (f) => !f.price_per_kg || f.price_per_kg <= 0
  );
  if (missingPrice) {
    $q.notify({ type: 'warning', message: t('simulation.feedSelect.priceRequired') });
    return;
  }
  showGenerating.value = true;
  try {
    const ok = await simStore.generateEvaluation();
    if (ok) {
      router.push('/evaluation-report');
    } else if (simStore.error) {
      $q.notify({ type: 'negative', message: simStore.error });
    }
  } catch {
    $q.notify({ type: 'negative', message: t('errors.generic') });
  } finally {
    showGenerating.value = false;
  }
}

async function runRecommendation() {
  // Validate all feeds have a price > 0
  const missingPrice = simStore.selectedFeeds.some(
    (f) => !f.price_per_kg || f.price_per_kg <= 0
  );
  if (missingPrice) {
    $q.notify({ type: 'warning', message: t('simulation.feedSelect.priceRequired') });
    return;
  }

  showGenerating.value = true;
  try {
    const ok = await simStore.generateRecommendation();
    if (ok) {
      router.push('/recommendation-report');
    } else if (simStore.error) {
      $q.notify({ type: 'negative', message: simStore.error });
    }
  } catch {
    $q.notify({ type: 'negative', message: t('errors.generic') });
  } finally {
    showGenerating.value = false;
  }
}

onMounted(() => {
  if (feedsStore.allFeeds.length === 0) {
    void feedsStore.fetchAllFeeds();
  }
});
</script>

<style lang="scss" scoped>
.top-btn {
  border-radius: $radius-loose;
  padding-top: 10px;
  padding-bottom: 10px;
}

.mode-toggle {
  background: rgba(0, 0, 0, 0.03);
  border-radius: $radius-loose;
  padding: 4px 8px;

  .body--dark & {
    background: rgba(255, 255, 255, 0.05);
  }
}

.view-toggle {
  .q-btn-toggle {
    border: 1px solid var(--q-primary);
    border-radius: $radius-default;
    overflow: hidden;
  }
}

.rounded-borders {
  border-radius: $radius-loose;
}

.bordered-scroll {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: $radius-loose;
  overflow-y: auto;

  .body--dark & {
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.action-bar {
  position: sticky;
  bottom: 0;
  background: var(--q-background, #fff);
  padding: 12px 0;
  margin-left: -16px;
  margin-right: -16px;
  padding-left: 16px;
  padding-right: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  z-index: 1;

  .body--dark & {
    background: var(--q-dark-page, #121212);
    border-top-color: rgba(255, 255, 255, 0.1);
  }
}

.action-btn {
  border-radius: $radius-loose;
  font-size: 1rem;
  padding-top: 14px;
  padding-bottom: 14px;
}
</style>
