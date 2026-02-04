<template>
  <q-page class="q-pa-md">
    <q-form @submit="onSubmit" class="q-gutter-md">
      <!-- Basic Info Section -->
      <div class="text-subtitle1 text-weight-medium q-mb-sm">Basic Information</div>

      <q-input
        v-model="form.name"
        label="Cow Name *"
        outlined
        :rules="[(val) => !!val || 'Name is required']"
      />

      <q-select
        v-model="form.breed"
        label="Breed *"
        outlined
        :options="breedOptions"
        emit-value
        map-options
        :rules="[(val) => !!val || 'Breed is required']"
      />

      <q-input
        v-model.number="form.weight_kg"
        label="Weight (kg) *"
        type="number"
        outlined
        :rules="[
          (val) => val > 0 || 'Weight must be greater than 0',
          (val) => val <= 1500 || 'Weight seems too high',
        ]"
      />

      <q-input
        v-model.number="form.age_months"
        label="Age (months)"
        type="number"
        outlined
        hint="Optional"
      />

      <!-- Milk Production Section -->
      <q-separator class="q-my-md" />
      <div class="text-subtitle1 text-weight-medium q-mb-sm">Milk Production</div>

      <q-input
        v-model.number="form.milk_yield_liters"
        label="Average Daily Yield (liters) *"
        type="number"
        step="0.1"
        outlined
        :rules="[(val) => val >= 0 || 'Yield cannot be negative']"
      />

      <q-input
        v-model.number="form.milk_fat_percentage"
        label="Milk Fat % *"
        type="number"
        step="0.1"
        outlined
        :rules="[
          (val) => val >= 0 || 'Fat % cannot be negative',
          (val) => val <= 10 || 'Fat % seems too high',
        ]"
      />

      <q-select
        v-model="form.lactation_stage"
        label="Lactation Stage *"
        outlined
        :options="lactationOptions"
        emit-value
        map-options
        :rules="[(val) => !!val || 'Lactation stage is required']"
      />

      <!-- Health & Status Section -->
      <q-separator class="q-my-md" />
      <div class="text-subtitle1 text-weight-medium q-mb-sm">Health & Status</div>

      <q-select
        v-model.number="form.body_condition_score"
        label="Body Condition Score"
        outlined
        :options="bcsOptions"
        emit-value
        map-options
        hint="1 (very thin) to 5 (very fat)"
      />

      <q-select
        v-model="form.activity_level"
        label="Activity Level"
        outlined
        :options="activityOptions"
        emit-value
        map-options
      />

      <q-toggle v-model="form.is_pregnant" label="Pregnant" />

      <q-input
        v-if="form.is_pregnant"
        v-model.number="form.pregnancy_month"
        label="Pregnancy Month"
        type="number"
        outlined
        :rules="[
          (val) => !val || val >= 1 || 'Must be at least 1',
          (val) => !val || val <= 9 || 'Max 9 months',
        ]"
      />

      <!-- Notes -->
      <q-separator class="q-my-md" />
      <q-input
        v-model="form.notes"
        label="Notes"
        type="textarea"
        outlined
        rows="3"
        hint="Any additional information"
      />

      <!-- Error Message -->
      <q-banner v-if="error" dense class="bg-negative text-white" rounded>
        {{ error }}
      </q-banner>

      <!-- Submit Button -->
      <q-btn
        :label="isEditing ? 'Update Cow' : 'Add Cow'"
        type="submit"
        color="primary"
        class="full-width"
        size="lg"
        unelevated
        :loading="loading"
      />

      <!-- Delete Button (Edit mode only) -->
      <q-btn
        v-if="isEditing"
        label="Delete Cow"
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
import { useCowsStore, CowInput } from 'src/stores/cows';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const cowsStore = useCowsStore();

const cowId = computed(() => route.params.id as string | undefined);
const isEditing = computed(() => !!cowId.value);

const form = reactive<CowInput>({
  name: '',
  breed: '',
  weight_kg: 400,
  milk_yield_liters: 10,
  milk_fat_percentage: 4.0,
  lactation_stage: 'mid',
  age_months: undefined,
  body_condition_score: 3,
  is_pregnant: false,
  pregnancy_month: undefined,
  activity_level: 'normal',
  notes: '',
});

const loading = computed(() => cowsStore.loading);
const error = computed(() => cowsStore.error);

const breedOptions = [
  { label: 'Holstein Friesian', value: 'Holstein Friesian' },
  { label: 'Jersey', value: 'Jersey' },
  { label: 'Sahiwal', value: 'Sahiwal' },
  { label: 'Gir', value: 'Gir' },
  { label: 'Red Sindhi', value: 'Red Sindhi' },
  { label: 'Crossbreed', value: 'Crossbreed' },
  { label: 'Other', value: 'Other' },
];

const lactationOptions = [
  { label: 'Early (0-100 days)', value: 'early' },
  { label: 'Mid (100-200 days)', value: 'mid' },
  { label: 'Late (200+ days)', value: 'late' },
  { label: 'Dry', value: 'dry' },
];

const bcsOptions = [
  { label: '1 - Very Thin', value: 1 },
  { label: '2 - Thin', value: 2 },
  { label: '3 - Normal', value: 3 },
  { label: '4 - Fat', value: 4 },
  { label: '5 - Very Fat', value: 5 },
];

const activityOptions = [
  { label: 'Low (stall-fed)', value: 'low' },
  { label: 'Normal', value: 'normal' },
  { label: 'High (grazing)', value: 'high' },
];

async function onSubmit() {
  if (isEditing.value) {
    const success = await cowsStore.updateCow(cowId.value!, form);
    if (success) {
      $q.notify({ type: 'positive', message: 'Cow updated successfully' });
      router.back();
    }
  } else {
    const cow = await cowsStore.createCow(form);
    if (cow) {
      $q.notify({ type: 'positive', message: 'Cow added successfully' });
      router.back();
    }
  }
}

function confirmDelete() {
  $q.dialog({
    title: 'Delete Cow',
    message: `Are you sure you want to delete ${form.name}? This action cannot be undone.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const success = await cowsStore.deleteCow(cowId.value!);
    if (success) {
      $q.notify({ type: 'positive', message: 'Cow deleted' });
      router.push('/cows');
    }
  });
}

onMounted(async () => {
  if (isEditing.value) {
    const cow = await cowsStore.getCow(cowId.value!);
    if (cow) {
      Object.assign(form, {
        name: cow.name,
        breed: cow.breed,
        weight_kg: cow.weight_kg,
        milk_yield_liters: cow.milk_yield_liters,
        milk_fat_percentage: cow.milk_fat_percentage,
        lactation_stage: cow.lactation_stage,
        age_months: cow.age_months,
        body_condition_score: cow.body_condition_score,
        is_pregnant: cow.is_pregnant,
        pregnancy_month: cow.pregnancy_month,
        activity_level: cow.activity_level,
        notes: cow.notes,
      });
    } else {
      $q.notify({ type: 'negative', message: 'Cow not found' });
      router.back();
    }
  }
});
</script>
