<template>
  <q-page class="q-pa-md">
    <q-form @submit="onSubmit" class="q-gutter-md">
      <!-- Basic Info -->
      <q-input
        v-model="form.name"
        label="Feed Name *"
        outlined
        :rules="[(val) => !!val || 'Name is required']"
      />

      <q-select
        v-model="form.category"
        label="Category *"
        outlined
        :options="categoryOptions"
        :rules="[(val) => !!val || 'Category is required']"
        use-input
        new-value-mode="add-unique"
      />

      <!-- Nutritional Values -->
      <q-separator />
      <div class="text-subtitle1">Nutritional Values</div>

      <div class="row q-col-gutter-sm">
        <div class="col-6">
          <q-input
            v-model.number="form.dm_percentage"
            label="Dry Matter % *"
            type="number"
            step="0.1"
            outlined
            :rules="[
              (val) => val > 0 || 'Required',
              (val) => val <= 100 || 'Max 100%',
            ]"
          />
        </div>
        <div class="col-6">
          <q-input
            v-model.number="form.cp_percentage"
            label="Crude Protein % *"
            type="number"
            step="0.1"
            outlined
            :rules="[
              (val) => val >= 0 || 'Cannot be negative',
              (val) => val <= 100 || 'Max 100%',
            ]"
          />
        </div>
      </div>

      <div class="row q-col-gutter-sm">
        <div class="col-6">
          <q-input
            v-model.number="form.tdn_percentage"
            label="TDN % *"
            type="number"
            step="0.1"
            outlined
            :rules="[
              (val) => val >= 0 || 'Cannot be negative',
              (val) => val <= 100 || 'Max 100%',
            ]"
          />
        </div>
        <div class="col-6">
          <q-input
            v-model.number="form.ndf_percentage"
            label="NDF %"
            type="number"
            step="0.1"
            outlined
            hint="Optional"
          />
        </div>
      </div>

      <div class="row q-col-gutter-sm">
        <div class="col-6">
          <q-input
            v-model.number="form.ca_percentage"
            label="Calcium %"
            type="number"
            step="0.01"
            outlined
            hint="Optional"
          />
        </div>
        <div class="col-6">
          <q-input
            v-model.number="form.p_percentage"
            label="Phosphorus %"
            type="number"
            step="0.01"
            outlined
            hint="Optional"
          />
        </div>
      </div>

      <!-- Price -->
      <q-separator />
      <q-input
        v-model.number="form.price_per_kg"
        label="Price per kg"
        type="number"
        step="0.5"
        outlined
        prefix="₹"
        hint="Optional - helps with cost optimization"
      />

      <!-- Error -->
      <q-banner v-if="error" dense class="bg-negative text-white" rounded>
        {{ error }}
      </q-banner>

      <!-- Submit -->
      <q-btn
        :label="isEditing ? 'Update Feed' : 'Add Feed'"
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
        label="Delete Feed"
        color="negative"
        flat
        class="full-width q-mt-sm"
        @click="confirmDelete"
      />
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useFeedsStore, FeedInput } from 'src/stores/feeds';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const feedsStore = useFeedsStore();

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
});

const loading = computed(() => feedsStore.loading);
const error = computed(() => feedsStore.error);

const categoryOptions = [
  'Concentrate',
  'Roughage',
  'Green Fodder',
  'Dry Fodder',
  'Silage',
  'By-product',
  'Mineral Mix',
  'Other',
];

async function onSubmit() {
  if (isEditing.value) {
    const success = await feedsStore.updateCustomFeed(feedId.value!, form);
    if (success) {
      $q.notify({ type: 'positive', message: 'Feed updated' });
      router.back();
    }
  } else {
    const feed = await feedsStore.createCustomFeed(form);
    if (feed) {
      $q.notify({ type: 'positive', message: 'Feed added' });
      router.back();
    }
  }
}

function confirmDelete() {
  $q.dialog({
    title: 'Delete Feed',
    message: `Are you sure you want to delete ${form.name}?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const success = await feedsStore.deleteCustomFeed(feedId.value!);
    if (success) {
      $q.notify({ type: 'positive', message: 'Feed deleted' });
      router.push('/feeds');
    }
  });
}

onMounted(async () => {
  if (isEditing.value) {
    const feed = await feedsStore.getFeed(feedId.value!);
    if (feed && feed.is_custom) {
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
      });
    } else {
      $q.notify({ type: 'negative', message: 'Feed not found or cannot be edited' });
      router.back();
    }
  }
});
</script>
