<template>
  <q-page class="q-pa-md">
    <template v-if="loading">
      <SkeletonCard />
    </template>

    <template v-else-if="feed">
      <!-- Hero Image -->
      <q-card v-if="feed.image_url" flat bordered class="q-mb-md">
        <q-img
          :src="feed.image_url"
          :ratio="16/9"
          class="feed-hero-image"
        />
      </q-card>

      <!-- Header -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row items-center">
            <q-avatar :color="feed.is_custom ? 'secondary' : 'primary'" text-color="white" size="56px">
              <q-img
                v-if="feed.image_url"
                :src="feed.image_url"
                :ratio="1"
                style="width: 100%; height: 100%; border-radius: 50%"
              />
              <q-icon v-else name="grass" size="32px" />
            </q-avatar>
            <div class="q-ml-md">
              <div class="text-h6">{{ feed.name }}</div>
              <div class="text-body2 text-grey-7">{{ translateCategory(feed.category) }}</div>
              <q-chip v-if="feed.is_custom" size="sm" color="secondary" text-color="white" class="q-mt-xs">
                {{ $t('feed.customFeed') }}
              </q-chip>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Nutritional Info -->
      <div class="text-subtitle1 q-mb-sm">{{ $t('feed.labels.nutritionalComposition') }}</div>
      <q-card flat bordered class="q-mb-md">
        <q-list separator>
          <q-item>
            <q-item-section>
              <q-item-label>{{ $t('feed.labels.dmPercent') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-h6">{{ feed.dm_percentage }}%</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label>{{ $t('feed.labels.cpPercent') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-h6">{{ feed.cp_percentage }}%</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label>{{ $t('feed.labels.tdnPercent') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-h6">{{ feed.tdn_percentage }}%</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="feed.ndf_percentage">
            <q-item-section>
              <q-item-label>{{ $t('feed.labels.ndfPercent') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-h6">{{ feed.ndf_percentage }}%</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="feed.ca_percentage">
            <q-item-section>
              <q-item-label>{{ $t('feed.labels.caPercent') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-h6">{{ feed.ca_percentage }}%</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="feed.p_percentage">
            <q-item-section>
              <q-item-label>{{ $t('feed.labels.pPercent') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-h6">{{ feed.p_percentage }}%</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <!-- Price -->
      <template v-if="feed.price_per_kg">
        <div class="text-subtitle1 q-mb-sm">{{ $t('feed.labels.pricing') }}</div>
        <q-card flat bordered class="q-mb-md">
          <q-card-section class="text-center">
            <div class="text-h4 text-primary">{{ formatCurrency(feed.price_per_kg) }}</div>
            <div class="text-caption text-grey-7">{{ $t('feed.perKilogram') }}</div>
          </q-card-section>
        </q-card>
      </template>

      <!-- Price History -->
      <FeedPriceHistoryChart :feed-id="feedId" class="q-mb-md" />

      <!-- Edit button for custom feeds -->
      <q-btn
        v-if="feed.is_custom"
        :label="$t('feed.editFeed')"
        icon="edit"
        color="primary"
        class="full-width"
        unelevated
        @click="router.push(`/feeds/${feed.id}/edit`)"
      />
    </template>

    <template v-else>
      <EmptyState
        icon="error_outline"
        icon-color="negative"
        :title="$t('feed.empty.notFoundTitle')"
        :description="$t('feed.empty.notFoundDescription')"
        :action-label="$t('feed.actions.goBack')"
        @action="router.back()"
      />
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const router = useRouter();
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
import { useFeedsStore } from 'src/stores/feeds';
import { Feed } from 'src/lib/offline/db';
import SkeletonCard from 'src/components/ui/SkeletonCard.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';
import FeedPriceHistoryChart from 'src/components/feeds/FeedPriceHistoryChart.vue';
import { useCurrency } from 'src/composables/useCurrency';

const { formatCurrency } = useCurrency();

const route = useRoute();
const feedsStore = useFeedsStore();

const feedId = computed(() => route.params.id as string);
const feed = ref<Feed | null>(null);
const loading = ref(true);

onMounted(async () => {
  loading.value = true;
  feed.value = await feedsStore.getFeed(feedId.value);
  loading.value = false;
});
</script>

<style lang="scss" scoped>
.feed-hero-image {
  border-radius: 12px;
  max-height: 220px;
}
</style>
