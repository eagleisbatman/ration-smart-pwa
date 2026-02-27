<template>
  <q-page class="q-pa-md">
    <q-form class="q-gutter-md" @submit="onSubmit">
      <!-- Photo Section -->
      <PhotoUploadSection v-model="form.image_url" />

      <!-- Basic Info -->
      <q-input
        v-model="form.name"
        :label="$t('feed.feedNameRequired')"
        outlined
        :rules="[(val) => !!val || t('feed.validation.nameRequired')]"
      />

      <q-select
        v-model="form.fd_type"
        :label="$t('feed.labels.typeRequired')"
        outlined
        :options="typeOptions"
        :rules="[(val) => !!val || t('feed.validation.typeRequired')]"
        emit-value
        map-options
        @update:model-value="onTypeChanged"
      />

      <q-select
        v-model="form.category"
        :label="$t('feed.labels.categoryRequired')"
        outlined
        :options="categoryOptions"
        :rules="[(val) => !!val || t('feed.validation.categoryRequired')]"
        emit-value
        map-options
        use-input
        new-value-mode="add-unique"
      />

      <!-- Nutritional Values -->
      <q-separator />
      <div class="text-subtitle1">{{ $t('feed.labels.nutritionalValues') }}</div>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
          <q-input
            v-model.number="form.dm_percentage"
            :label="$t('feed.labels.dmPercentInput')"
            type="number"
            step="0.1"
            outlined
            :rules="[
              (val) => val > 0 || t('feed.validation.required'),
              (val) => val <= 100 || t('feed.validation.maxPercent'),
            ]"
          />
        </div>
        <div class="col-12 col-sm-6">
          <q-input
            v-model.number="form.cp_percentage"
            :label="$t('feed.labels.cpPercentInput')"
            type="number"
            step="0.1"
            outlined
            :rules="[
              (val) => val >= 0 || t('feed.validation.cannotBeNegative'),
              (val) => val <= 100 || t('feed.validation.maxPercent'),
            ]"
          />
        </div>
      </div>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
          <q-input
            v-model.number="form.tdn_percentage"
            :label="$t('feed.labels.tdnPercentInput')"
            type="number"
            step="0.1"
            outlined
            :rules="[
              (val) => val >= 0 || t('feed.validation.cannotBeNegative'),
              (val) => val <= 100 || t('feed.validation.maxPercent'),
            ]"
          />
        </div>
        <div class="col-12 col-sm-6">
          <q-input
            v-model.number="form.ndf_percentage"
            :label="$t('feed.labels.ndfPercentInput')"
            type="number"
            step="0.1"
            outlined
            :hint="$t('feed.hints.optional')"
          />
        </div>
      </div>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
          <q-input
            v-model.number="form.ca_percentage"
            :label="$t('feed.labels.caPercentInput')"
            type="number"
            step="0.01"
            outlined
            :hint="$t('feed.hints.optional')"
          />
        </div>
        <div class="col-12 col-sm-6">
          <q-input
            v-model.number="form.p_percentage"
            :label="$t('feed.labels.pPercentInput')"
            type="number"
            step="0.01"
            outlined
            :hint="$t('feed.hints.optional')"
          />
        </div>
      </div>

      <!-- Season -->
      <q-select
        v-model="form.season"
        :label="$t('feed.labels.season')"
        outlined
        :options="seasonOptions"
        emit-value
        map-options
        clearable
        :hint="$t('feed.hints.optional')"
      />

      <!-- Price -->
      <q-separator />
      <q-input
        v-model.number="form.price_per_kg"
        :label="$t('feed.pricePerKg')"
        type="number"
        step="0.5"
        outlined
        :prefix="getCurrencySymbol()"
        :hint="$t('feed.hints.priceHint')"
      />

      <!-- Error -->
      <q-banner v-if="error" dense class="bg-negative text-white" rounded>
        {{ error }}
      </q-banner>

      <!-- Submit -->
      <q-btn
        :label="isEditing ? $t('feed.updateFeed') : $t('feed.addFeed')"
        type="submit"
        color="primary"
        class="full-width"
        size="lg"
        unelevated
        :loading="loading"
      />

      <!-- Delete (edit mode) -->
      <q-btn
        v-if="isEditing"
        :label="$t('feed.deleteFeed')"
        color="negative"
        flat
        class="full-width q-mt-sm"
        @click="confirmDelete"
      />
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { v4 as uuidv4 } from 'uuid';
import { useFeedsStore, FeedInput } from 'src/stores/feeds';
import { useCurrency } from 'src/composables/useCurrency';
import { db } from 'src/lib/offline/db';
import PhotoUploadSection from 'src/components/shared/PhotoUploadSection.vue';

const router = useRouter();
const { t } = useI18n();
const { getCurrencySymbol } = useCurrency();
const route = useRoute();
const $q = useQuasar();
const feedsStore = useFeedsStore();

const originalPricePerKg = ref<number | undefined>(undefined);

const feedId = computed(() => route.params.id as string | undefined);
const isEditing = computed(() => !!feedId.value);

const form = reactive<FeedInput>({
  name: '',
  fd_type: 'Concentrate',
  category: 'Concentrate',
  dm_percentage: 90,
  cp_percentage: 10,
  tdn_percentage: 70,
  ca_percentage: undefined,
  p_percentage: undefined,
  ndf_percentage: undefined,
  price_per_kg: undefined,
  image_url: undefined,
  season: undefined,
});

const loading = computed(() => feedsStore.loading);
const error = computed(() => feedsStore.error);

const TYPE_VALUES = [
  { value: 'Forage', key: 'feed.types.forage' },
  { value: 'Concentrate', key: 'feed.types.concentrate' },
];

const typeOptions = computed(() =>
  TYPE_VALUES.map((tp) => ({ label: t(tp.key), value: tp.value }))
);

// Categories grouped by type (UCD hierarchy)
const CATEGORIES_BY_TYPE: Record<string, { value: string; key: string }[]> = {
  Forage: [
    { value: 'Roughage', key: 'feed.categories.roughage' },
    { value: 'Green Fodder', key: 'feed.categories.greenFodder' },
    { value: 'Dry Fodder', key: 'feed.categories.dryFodder' },
    { value: 'Silage', key: 'feed.categories.silage' },
    { value: 'Other', key: 'feed.categories.other' },
  ],
  Concentrate: [
    { value: 'Concentrate', key: 'feed.categories.concentrate' },
    { value: 'By-product', key: 'feed.categories.byProduct' },
    { value: 'Mineral Mix', key: 'feed.categories.mineralMix' },
    { value: 'Other', key: 'feed.categories.other' },
  ],
};

const categoryOptions = computed(() => {
  const cats = CATEGORIES_BY_TYPE[form.fd_type || 'Concentrate'] || [];
  return cats.map((c) => ({ label: t(c.key), value: c.value }));
});

function onTypeChanged() {
  // Reset category when type changes (old category may not be valid for new type)
  const validValues = (CATEGORIES_BY_TYPE[form.fd_type || 'Concentrate'] || []).map((c) => c.value);
  if (!validValues.includes(form.category)) {
    form.category = validValues[0] || '';
  }
}

const SEASON_VALUES = [
  { value: 'all_year', key: 'feed.seasons.allYear' },
  { value: 'summer', key: 'feed.seasons.summer' },
  { value: 'winter', key: 'feed.seasons.winter' },
  { value: 'monsoon', key: 'feed.seasons.monsoon' },
];

const seasonOptions = computed(() =>
  SEASON_VALUES.map((s) => ({ label: t(s.key), value: s.value }))
);

async function logPriceHistory(feedId: string, pricePerKg: number): Promise<void> {
  try {
    await db.feedPriceHistory.put({
      id: uuidv4(),
      feed_id: feedId,
      price_per_kg: pricePerKg,
      recorded_at: new Date().toISOString(),
    });
  } catch {
    // Silently fail - price history is non-critical
  }
}

async function onSubmit() {
  if (isEditing.value) {
    const success = await feedsStore.updateCustomFeed(feedId.value!, form);
    if (success) {
      // Log price history if price changed
      if (
        form.price_per_kg != null &&
        form.price_per_kg > 0 &&
        form.price_per_kg !== originalPricePerKg.value
      ) {
        await logPriceHistory(feedId.value!, form.price_per_kg);
      }
      $q.notify({ type: 'positive', message: t('feed.notifications.feedUpdated') });
      router.back();
    }
  } else {
    const feed = await feedsStore.createCustomFeed(form);
    if (feed) {
      // Log initial price as first history entry
      if (form.price_per_kg != null && form.price_per_kg > 0) {
        await logPriceHistory(feed.id, form.price_per_kg);
      }
      $q.notify({ type: 'positive', message: t('feed.notifications.feedAdded') });
      router.back();
    } else if (feedsStore.error) {
      $q.notify({ type: 'negative', message: feedsStore.error, timeout: 5000 });
    }
  }
}

function confirmDelete() {
  $q.dialog({
    title: t('feed.deleteFeed'),
    message: t('feed.confirmDeleteFeedName', { name: form.name }),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const success = await feedsStore.deleteCustomFeed(feedId.value!);
    if (success) {
      $q.notify({ type: 'positive', message: t('feed.notifications.feedDeleted') });
      router.push('/feeds');
    }
  });
}

onMounted(async () => {
  // Clear any stale errors from previous navigation
  feedsStore.error = null;

  if (isEditing.value) {
    const feed = await feedsStore.getFeed(feedId.value!);
    if (feed && feed.is_custom) {
      originalPricePerKg.value = feed.price_per_kg;
      Object.assign(form, {
        name: feed.name,
        fd_type: feed.fd_type || 'Concentrate',
        category: feed.category,
        dm_percentage: feed.dm_percentage,
        cp_percentage: feed.cp_percentage,
        tdn_percentage: feed.tdn_percentage,
        ca_percentage: feed.ca_percentage,
        p_percentage: feed.p_percentage,
        ndf_percentage: feed.ndf_percentage,
        price_per_kg: feed.price_per_kg,
        image_url: feed.image_url,
        season: feed.season,
      });
    } else {
      $q.notify({ type: 'negative', message: t('feed.notifications.feedNotFound') });
      router.back();
    }
  }
});
</script>

