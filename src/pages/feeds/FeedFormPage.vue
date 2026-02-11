<template>
  <q-page class="q-pa-md">
    <q-form class="q-gutter-md" @submit="onSubmit">
      <!-- Photo Section -->
      <div class="text-center q-mb-lg">
        <div class="photo-container q-mx-auto" @click="showPhotoOptions = true">
          <q-img
            v-if="form.image_url"
            :src="form.image_url"
            :ratio="1"
            class="rounded-borders"
            style="width: 120px; height: 120px; border-radius: 50%"
          />
          <q-avatar v-else size="120px" color="grey-3">
            <q-icon name="photo_camera" size="40px" color="grey-5" />
          </q-avatar>
          <q-btn
            v-if="form.image_url"
            round
            flat
            dense
            size="sm"
            icon="close"
            class="photo-remove-btn"
            @click.stop="removePhoto"
          />
        </div>
        <div class="text-caption text-grey-6 q-mt-xs">{{ $t('feed.tapToAddPhoto') }}</div>
      </div>

      <!-- Photo Options Dialog -->
      <q-dialog v-model="showPhotoOptions" position="bottom">
        <q-card style="width: 100%; max-width: 400px">
          <q-list>
            <q-item clickable v-close-popup @click="takePhoto">
              <q-item-section avatar><q-icon name="photo_camera" /></q-item-section>
              <q-item-section>{{ $t('feed.takePhoto') }}</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="chooseFromGallery">
              <q-item-section avatar><q-icon name="photo_library" /></q-item-section>
              <q-item-section>{{ $t('feed.chooseFromGallery') }}</q-item-section>
            </q-item>
            <q-item v-if="form.image_url" clickable v-close-popup @click="removePhoto">
              <q-item-section avatar><q-icon name="delete" color="negative" /></q-item-section>
              <q-item-section class="text-negative">{{ $t('feed.removePhoto') }}</q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </q-dialog>

      <!-- Basic Info -->
      <q-input
        v-model="form.name"
        :label="$t('feed.feedNameRequired')"
        outlined
        :rules="[(val) => !!val || t('feed.validation.nameRequired')]"
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

      <div class="row q-col-gutter-sm">
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

      <div class="row q-col-gutter-sm">
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

      <div class="row q-col-gutter-sm">
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
import { useImageUpload } from 'src/composables/useImageUpload';
import { db } from 'src/lib/offline/db';

const router = useRouter();
const { t } = useI18n();
const { getCurrencySymbol } = useCurrency();
const route = useRoute();
const $q = useQuasar();
const feedsStore = useFeedsStore();
const { captureFromCamera, selectFromGallery, clearImage } = useImageUpload();

const showPhotoOptions = ref(false);
const originalPricePerKg = ref<number | undefined>(undefined);

const feedId = computed(() => route.params.id as string | undefined);
const isEditing = computed(() => !!feedId.value);

const form = reactive<FeedInput>({
  name: '',
  category: 'Concentrate',
  dm_percentage: 90,
  cp_percentage: 10,
  tdn_percentage: 70,
  ca_percentage: undefined,
  p_percentage: undefined,
  ndf_percentage: undefined,
  price_per_kg: undefined,
  image_url: undefined,
});

const loading = computed(() => feedsStore.loading);
const error = computed(() => feedsStore.error);

const CATEGORY_VALUES = [
  { value: 'Concentrate', key: 'feed.categories.concentrate' },
  { value: 'Roughage', key: 'feed.categories.roughage' },
  { value: 'Green Fodder', key: 'feed.categories.greenFodder' },
  { value: 'Dry Fodder', key: 'feed.categories.dryFodder' },
  { value: 'Silage', key: 'feed.categories.silage' },
  { value: 'By-product', key: 'feed.categories.byProduct' },
  { value: 'Mineral Mix', key: 'feed.categories.mineralMix' },
  { value: 'Other', key: 'feed.categories.other' },
];

const categoryOptions = computed(() =>
  CATEGORY_VALUES.map((c) => ({ label: t(c.key), value: c.value }))
);

async function takePhoto() {
  const result = await captureFromCamera();
  if (result) {
    form.image_url = result;
  }
}

async function chooseFromGallery() {
  const result = await selectFromGallery();
  if (result) {
    form.image_url = result;
  }
}

function removePhoto() {
  form.image_url = undefined;
  clearImage();
}

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
  if (isEditing.value) {
    const feed = await feedsStore.getFeed(feedId.value!);
    if (feed && feed.is_custom) {
      originalPricePerKg.value = feed.price_per_kg;
      Object.assign(form, {
        name: feed.name,
        category: feed.category,
        dm_percentage: feed.dm_percentage,
        cp_percentage: feed.cp_percentage,
        tdn_percentage: feed.tdn_percentage,
        ca_percentage: feed.ca_percentage,
        p_percentage: feed.p_percentage,
        ndf_percentage: feed.ndf_percentage,
        price_per_kg: feed.price_per_kg,
        image_url: feed.image_url,
      });
    } else {
      $q.notify({ type: 'negative', message: t('feed.notifications.feedNotFound') });
      router.back();
    }
  }
});
</script>

<style lang="scss" scoped>
.photo-container {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.photo-remove-btn {
  position: absolute;
  top: -4px;
  right: -4px;
  background: rgba(255, 255, 255, 0.9);
  z-index: 1;
}
</style>
