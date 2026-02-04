<template>
  <q-page class="q-pa-md">
    <template v-if="loading">
      <SkeletonCard />
    </template>

    <template v-else-if="feed">
      <!-- Header -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row items-center">
            <q-avatar :color="feed.is_custom ? 'secondary' : 'primary'" text-color="white" size="56px">
              <q-icon name="grass" size="32px" />
            </q-avatar>
            <div class="q-ml-md">
              <div class="text-h6">{{ feed.name }}</div>
              <div class="text-body2 text-grey-7">{{ feed.category }}</div>
              <q-chip v-if="feed.is_custom" size="sm" color="secondary" text-color="white" class="q-mt-xs">
                Custom Feed
              </q-chip>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Nutritional Info -->
      <div class="text-subtitle1 q-mb-sm">Nutritional Composition</div>
      <q-card flat bordered class="q-mb-md">
        <q-list separator>
          <q-item>
            <q-item-section>
              <q-item-label>Dry Matter (DM)</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-h6">{{ feed.dm_percentage }}%</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label>Crude Protein (CP)</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-h6">{{ feed.cp_percentage }}%</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label>Total Digestible Nutrients (TDN)</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-h6">{{ feed.tdn_percentage }}%</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="feed.ndf_percentage">
            <q-item-section>
              <q-item-label>Neutral Detergent Fiber (NDF)</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-h6">{{ feed.ndf_percentage }}%</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="feed.ca_percentage">
            <q-item-section>
              <q-item-label>Calcium (Ca)</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-h6">{{ feed.ca_percentage }}%</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="feed.p_percentage">
            <q-item-section>
              <q-item-label>Phosphorus (P)</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-h6">{{ feed.p_percentage }}%</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <!-- Price -->
      <template v-if="feed.price_per_kg">
        <div class="text-subtitle1 q-mb-sm">Pricing</div>
        <q-card flat bordered class="q-mb-md">
          <q-card-section class="text-center">
            <div class="text-h4 text-primary">₹{{ feed.price_per_kg }}</div>
            <div class="text-caption text-grey-7">per kilogram</div>
          </q-card-section>
        </q-card>
      </template>

      <!-- Edit button for custom feeds -->
      <q-btn
        v-if="feed.is_custom"
        label="Edit Feed"
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
        title="Feed Not Found"
        description="The feed you're looking for doesn't exist."
        action-label="Go Back"
        @action="router.back()"
      />
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
import { useFeedsStore } from 'src/stores/feeds';
import { Feed } from 'src/lib/offline/db';
import SkeletonCard from 'src/components/ui/SkeletonCard.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';

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
