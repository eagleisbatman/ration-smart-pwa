<template>
  <q-page class="q-pa-md">
    <q-form class="q-gutter-md" @submit="onSubmit">
      <!-- Photo Section -->
      <PhotoUploadSection v-model="form.image_url" />

      <!-- Farmer Selection (only in create mode) -->
      <q-select
        v-if="!isEditing"
        v-model="selectedFarmerId"
        :label="$t('cow.selectFarmer')"
        outlined
        :options="farmerOptions"
        emit-value
        map-options
        :loading="farmersLoading"
        :rules="[(val: string) => !!val || $t('cow.validation.farmerRequired')]"
      >
        <template #prepend>
          <q-icon name="person" />
        </template>
      </q-select>

      <!-- Basic Info Section -->
      <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ $t('cow.basicInfo') }}</div>

      <q-input
        v-model="form.name"
        :label="$t('cow.nameRequired')"
        outlined
        :rules="[(val: string) => !!val || $t('cow.validation.nameRequired')]"
      />

      <q-input
        v-model="form.tag_number"
        :label="$t('cow.tagNumber')"
        outlined
        :hint="$t('common.optional')"
      />

      <q-select
        v-model="form.coat_color"
        :label="$t('cow.coatColor')"
        outlined
        :options="coatColorOptions"
        emit-value
        map-options
        use-input
        new-value-mode="add-unique"
        :hint="$t('common.optional')"
        clearable
      />

      <q-select
        v-model="form.breed"
        :label="$t('cow.breedRequired')"
        outlined
        :options="breedOptions"
        emit-value
        map-options
        :loading="cowsStore.breedsLoading"
        :rules="[(val: string) => !!val || $t('cow.validation.breedRequired')]"
      />

      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
          <q-input
            v-model.number="form.weight_kg"
            :label="$t('cow.weight')"
            type="number"
            outlined
            :rules="[
              (val: number) => val > 0 || $t('cow.validation.weightPositive'),
              (val: number) => val <= 1500 || $t('cow.validation.weightTooHigh'),
            ]"
          />
        </div>
        <div class="col-12 col-sm-6">
          <q-input
            v-model.number="form.age_months"
            :label="$t('cow.ageMonths')"
            type="number"
            outlined
            :hint="$t('common.optional')"
          />
        </div>
      </div>

      <!-- Milk Production Section -->
      <q-separator class="q-my-md" />
      <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ $t('cow.milkProductionSection') }}</div>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
          <q-input
            v-model.number="form.milk_yield_liters"
            :label="$t('cow.averageDailyYield')"
            type="number"
            step="0.1"
            outlined
            :rules="[(val: number) => val >= 0 || $t('cow.validation.yieldNonNegative')]"
          />
        </div>
        <div class="col-12 col-sm-6">
          <q-input
            v-model.number="form.milk_fat_percentage"
            :label="$t('cow.milkFatRequired')"
            type="number"
            step="0.1"
            outlined
            :rules="[
              (val: number) => val >= 0 || $t('cow.validation.fatNonNegative'),
              (val: number) => val <= 10 || $t('cow.validation.fatTooHigh'),
            ]"
          />
        </div>
      </div>

      <q-select
        v-model="form.lactation_stage"
        :label="$t('cow.lactationStageRequired')"
        outlined
        :options="lactationOptions"
        emit-value
        map-options
        :rules="[(val: string) => !!val || $t('cow.validation.lactationRequired')]"
      />

      <!-- Health & Status Section -->
      <q-separator class="q-my-md" />
      <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ $t('cow.healthStatus') }}</div>

      <q-select
        v-model.number="form.body_condition_score"
        :label="$t('cow.bodyConditionScore')"
        outlined
        :options="bcsOptions"
        emit-value
        map-options
        :hint="$t('cow.bcsHint')"
      />

      <q-select
        v-model="form.activity_level"
        :label="$t('cow.activityLevel')"
        outlined
        :options="activityOptions"
        emit-value
        map-options
      />

      <q-toggle v-model="form.is_pregnant" :label="$t('cow.pregnant')" />

      <q-input
        v-if="form.is_pregnant"
        v-model.number="form.pregnancy_month"
        :label="$t('cow.pregnancyMonth')"
        type="number"
        outlined
        :rules="[
          (val: number) => !val || val >= 1 || $t('cow.validation.pregnancyMonthMin'),
          (val: number) => !val || val <= 9 || $t('cow.validation.pregnancyMonthMax'),
        ]"
      />

      <!-- Notes -->
      <q-separator class="q-my-md" />
      <q-input
        v-model="form.notes"
        :label="$t('cow.notes')"
        type="textarea"
        outlined
        rows="3"
        :hint="$t('cow.notesHint')"
      />

      <!-- Error Message -->
      <q-banner v-if="error" dense class="bg-negative text-white" rounded>
        {{ error }}
      </q-banner>

      <!-- Submit Button -->
      <q-btn
        :label="isEditing ? $t('cow.updateCow') : $t('cow.addCow')"
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
        :label="$t('cow.deleteCow')"
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
import { useCowsStore, CowInput } from 'src/stores/cows';
import { useAuthStore } from 'src/stores/auth';
import { useFarmersStore } from 'src/stores/farmers';
import { useHapticFeedback } from 'src/composables/useHapticFeedback';
import PhotoUploadSection from 'src/components/shared/PhotoUploadSection.vue';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const { t } = useI18n();
const cowsStore = useCowsStore();
const authStore = useAuthStore();
const farmersStore = useFarmersStore();
const { success, error: hapticError, warning, medium } = useHapticFeedback();

const cowId = computed(() => route.params.id as string | undefined);
const farmerProfileId = computed(() => route.query.farmer_id as string | undefined);
const isEditing = computed(() => !!cowId.value);

// Farmer selection
const selectedFarmerId = ref<string>('');
const farmersLoading = computed(() => farmersStore.loading);

const farmerOptions = computed(() => {
  const options: Array<{ label: string; value: string }> = [];

  // Add "My Cow" option if user has a self profile
  if (authStore.selfFarmerProfileId) {
    options.push({
      label: `${authStore.user?.name || t('farmer.me')} (${t('farmer.you')})`,
      value: authStore.selfFarmerProfileId,
    });
  }

  // Add managed farmers
  for (const farmer of farmersStore.managedFarmers) {
    if (farmer.id === authStore.selfFarmerProfileId) continue; // skip self, already added
    options.push({ label: farmer.name, value: farmer.id });
  }

  return options;
});

const form = reactive<CowInput>({
  name: '',
  tag_number: '',
  coat_color: '',
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
  image_url: undefined,
  notes: '',
});

const loading = computed(() => cowsStore.loading);
const error = computed(() => cowsStore.error);

const fallbackBreedOptions = [
  { label: t('cow.breeds.holsteinFriesian'), value: 'Holstein Friesian' },
  { label: t('cow.breeds.jersey'), value: 'Jersey' },
  { label: t('cow.breeds.sahiwal'), value: 'Sahiwal' },
  { label: t('cow.breeds.gir'), value: 'Gir' },
  { label: t('cow.breeds.redSindhi'), value: 'Red Sindhi' },
  { label: t('cow.breeds.crossbreed'), value: 'Crossbreed' },
  { label: t('cow.breeds.other'), value: 'Other' },
];

const breedOptions = computed(() => {
  if (cowsStore.breeds.length > 0) {
    return cowsStore.breeds.map((b) => ({ label: b.name, value: b.name }));
  }
  return fallbackBreedOptions;
});

const lactationOptions = computed(() => [
  { label: t('cow.lactationEarly'), value: 'early' },
  { label: t('cow.lactationMid'), value: 'mid' },
  { label: t('cow.lactationLate'), value: 'late' },
  { label: t('cow.dry'), value: 'dry' },
]);

const bcsOptions = computed(() => [
  { label: t('cow.bcs1'), value: 1 },
  { label: t('cow.bcs2'), value: 2 },
  { label: t('cow.bcs3'), value: 3 },
  { label: t('cow.bcs4'), value: 4 },
  { label: t('cow.bcs5'), value: 5 },
]);

const activityOptions = computed(() => [
  { label: t('cow.activityLow'), value: 'low' },
  { label: t('cow.activityNormal'), value: 'normal' },
  { label: t('cow.activityHigh'), value: 'high' },
]);

const coatColorOptions = computed(() => [
  { label: t('cow.coatColors.black'), value: 'Black' },
  { label: t('cow.coatColors.brown'), value: 'Brown' },
  { label: t('cow.coatColors.white'), value: 'White' },
  { label: t('cow.coatColors.spotted'), value: 'Spotted' },
  { label: t('cow.coatColors.red'), value: 'Red' },
  { label: t('cow.coatColors.grey'), value: 'Grey' },
  { label: t('cow.coatColors.mixed'), value: 'Mixed' },
]);

async function onSubmit() {
  medium(); // Haptic feedback on form submit
  if (isEditing.value) {
    const updateSuccess = await cowsStore.updateCow(cowId.value!, form);
    if (updateSuccess) {
      success(); // Haptic feedback on successful operation
      $q.notify({ type: 'positive', message: t('cow.cowUpdated') });
      router.back();
    } else {
      hapticError(); // Haptic feedback on error
    }
  } else {
    const cowInput = { ...form, farmer_profile_id: selectedFarmerId.value || farmerProfileId.value };
    const cow = await cowsStore.createCow(cowInput);
    if (cow) {
      success(); // Haptic feedback on successful operation
      $q.notify({ type: 'positive', message: t('cow.cowAdded') });
      router.back();
    } else {
      hapticError(); // Haptic feedback on error
    }
  }
}

function confirmDelete() {
  warning(); // Haptic feedback on warning action
  $q.dialog({
    title: t('cow.deleteCow'),
    message: t('cow.confirmDeleteWithName', { name: form.name }),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const deleteSuccess = await cowsStore.deleteCow(cowId.value!);
    if (deleteSuccess) {
      success(); // Haptic feedback on successful operation
      $q.notify({ type: 'positive', message: t('cow.cowDeleted') });
      router.push('/cows');
    } else {
      hapticError(); // Haptic feedback on error
    }
  });
}

onMounted(async () => {
  // Clear any stale errors from previous navigation
  cowsStore.error = null;

  // Load farmers for the selector
  await farmersStore.fetchFarmers();

  // Pre-select farmer from URL query param, or default to self
  if (farmerProfileId.value) {
    selectedFarmerId.value = farmerProfileId.value;
  } else if (authStore.selfFarmerProfileId) {
    selectedFarmerId.value = authStore.selfFarmerProfileId;
  } else if (farmerOptions.value.length === 1) {
    selectedFarmerId.value = farmerOptions.value[0].value;
  }

  // Fetch breeds based on user's country
  await authStore.fetchCountries();
  const userCountryCode = authStore.userCountry;
  const country = authStore.countries.find(
    (c) => c.country_code === userCountryCode
  );
  if (country) {
    cowsStore.fetchBreeds(country.id);
  }

  if (isEditing.value) {
    const cow = await cowsStore.getCow(cowId.value!);
    if (cow) {
      Object.assign(form, {
        name: cow.name,
        tag_number: cow.tag_number || '',
        coat_color: cow.coat_color || '',
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
        image_url: cow.image_url,
        notes: cow.notes,
      });
    } else {
      $q.notify({ type: 'negative', message: t('cow.cowNotFound') });
      router.back();
    }
  }
});
</script>

