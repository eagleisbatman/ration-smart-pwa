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
        <div class="text-caption text-grey-6 q-mt-xs">{{ $t('farmer.tapToAddPhoto') }}</div>
      </div>

      <!-- Photo Options Dialog -->
      <q-dialog v-model="showPhotoOptions" position="bottom">
        <q-card style="width: 100%; max-width: 400px">
          <q-list>
            <q-item clickable v-close-popup @click="takePhoto">
              <q-item-section avatar><q-icon name="photo_camera" /></q-item-section>
              <q-item-section>{{ $t('farmer.takePhoto') }}</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="chooseFromGallery">
              <q-item-section avatar><q-icon name="photo_library" /></q-item-section>
              <q-item-section>{{ $t('farmer.chooseFromGallery') }}</q-item-section>
            </q-item>
            <q-item v-if="form.image_url" clickable v-close-popup @click="removePhoto">
              <q-item-section avatar><q-icon name="delete" color="negative" /></q-item-section>
              <q-item-section class="text-negative">{{ $t('farmer.removePhoto') }}</q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </q-dialog>

      <!-- Basic Info Section -->
      <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ $t('farmer.basicInfo') }}</div>

      <q-input
        v-model="form.name"
        :label="$t('farmer.farmerNameRequired')"
        outlined
        :rules="[(val) => !!val || $t('farmer.validation.nameRequired')]"
      />

      <q-input
        v-model="form.phone"
        :label="$t('farmer.phoneNumber')"
        outlined
        type="tel"
        :hint="$t('farmer.phoneHint')"
      >
        <template #prepend>
          <span class="text-body2 text-grey-8">{{ dialCodePrefix }}</span>
        </template>
      </q-input>

      <!-- Location Section -->
      <q-separator class="q-my-md" />
      <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ $t('farmer.location') }}</div>

      <q-input
        v-model="form.village"
        :label="$t('profile.village')"
        outlined
        :hint="$t('common.optional')"
      />

      <q-input
        v-model="form.district"
        :label="$t('profile.district')"
        outlined
        :hint="$t('common.optional')"
      />

      <q-input
        v-model="form.state"
        :label="$t('farmer.stateProvince')"
        outlined
        :hint="$t('common.optional')"
      />

      <!-- Farm Details Section -->
      <q-separator class="q-my-md" />
      <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ $t('farmer.farmDetails') }}</div>

      <q-input
        v-model.number="form.total_cattle"
        :label="$t('farmer.totalCattle')"
        type="number"
        outlined
        :rules="[(val) => val >= 0 || $t('farmer.validation.cannotBeNegative')]"
      />

      <q-input
        v-model.number="form.land_acres"
        :label="$t('farmer.landAcres')"
        type="number"
        step="0.1"
        outlined
        :hint="$t('common.optional')"
      />

      <q-select
        v-model="form.farming_type"
        :label="$t('farmer.farmingType')"
        outlined
        :options="farmingTypeOptions"
        emit-value
        map-options
        clearable
        :hint="$t('farmer.farmingTypeHint')"
      />

      <!-- Error Message -->
      <q-banner v-if="error" dense class="bg-negative text-white" rounded>
        {{ error }}
      </q-banner>

      <!-- Submit Button -->
      <q-btn
        :label="isEditing ? $t('farmer.updateFarmer') : $t('farmer.addFarmer')"
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
        :label="$t('farmer.archiveFarmer')"
        color="negative"
        flat
        class="full-width q-mt-sm"
        @click="confirmArchive"
      />
    </q-form>

    <!-- Archive Confirmation Dialog -->
    <q-dialog v-model="showArchiveDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="archive" color="warning" text-color="white" />
          <span class="q-ml-sm">{{ $t('farmer.archiveConfirmTitle') }}</span>
        </q-card-section>
        <q-card-section>
          {{ $t('farmer.archiveConfirmMessage') }}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="$t('common.cancel')" />
          <q-btn
            flat
            :label="$t('common.confirm')"
            color="negative"
            :loading="loading"
            @click="onArchive"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useFarmersStore, FarmerInput } from 'src/stores/farmers';
import { useOrganizationsStore } from 'src/stores/organizations';
import { useQuasar } from 'quasar';
import { useHapticFeedback } from 'src/composables/useHapticFeedback';
import { useImageUpload } from 'src/composables/useImageUpload';
import { useAuthStore } from 'src/stores/auth';
import { getDialCode } from 'src/services/api-adapter';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const $q = useQuasar();
const farmersStore = useFarmersStore();
const organizationsStore = useOrganizationsStore();
const { success, error: hapticError, warning, medium } = useHapticFeedback();
const { captureFromCamera, selectFromGallery, clearImage } = useImageUpload();
const authStore = useAuthStore();

// Dial code prefix based on user's country
const dialCodePrefix = computed(() => {
  const cc = authStore.user?.country_code || 'IN';
  return getDialCode(cc) || '+91';
});

const farmerId = computed(() => route.params.id as string | undefined);
const isEditing = computed(() => !!farmerId.value && farmerId.value !== 'new');

const showArchiveDialog = ref(false);
const showPhotoOptions = ref(false);

const form = reactive<FarmerInput>({
  organization_id: undefined,
  name: '',
  phone: undefined,
  village: undefined,
  district: undefined,
  state: undefined,
  country_id: undefined,
  total_cattle: 0,
  land_acres: undefined,
  farming_type: undefined,
  image_url: undefined,
});

const farmingTypeOptions = computed(() => [
  { label: t('farmer.farmingTypes.dairy'), value: 'dairy' },
  { label: t('farmer.farmingTypes.mixed'), value: 'mixed' },
  { label: t('farmer.farmingTypes.crop'), value: 'crop' },
  { label: t('farmer.farmingTypes.beef'), value: 'beef' },
  { label: t('farmer.farmingTypes.other'), value: 'other' },
]);

const loading = computed(() => farmersStore.loading);
const error = computed(() => farmersStore.error);

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

async function loadFarmer() {
  if (!isEditing.value || !farmerId.value) return;

  const farmer = await farmersStore.fetchFarmer(farmerId.value);
  if (farmer) {
    form.organization_id = farmer.organization_id;
    form.name = farmer.name;
    form.phone = farmer.phone;
    form.village = farmer.village;
    form.district = farmer.district;
    form.state = farmer.state;
    form.country_id = farmer.country_id;
    form.total_cattle = farmer.total_cattle;
    form.land_acres = farmer.land_acres;
    form.farming_type = farmer.farming_type;
    form.image_url = farmer.image_url;
  }
}

async function onSubmit() {
  medium(); // Haptic feedback on form submit
  farmersStore.clearError();

  // Set organization_id from current organization if available
  if (!form.organization_id && organizationsStore.currentOrganization) {
    form.organization_id = organizationsStore.currentOrganization.id;
  }

  if (isEditing.value && farmerId.value) {
    const updateSuccess = await farmersStore.updateFarmer(farmerId.value, form);
    if (updateSuccess) {
      success(); // Haptic feedback on successful operation
      $q.notify({
        type: 'positive',
        message: t('farmer.farmerUpdated'),
        position: 'bottom',
      });
      router.back();
    } else {
      hapticError(); // Haptic feedback on error
    }
  } else {
    const farmer = await farmersStore.createFarmer(form);
    if (farmer) {
      success(); // Haptic feedback on successful operation
      $q.notify({
        type: 'positive',
        message: t('farmer.farmerAdded'),
        position: 'bottom',
      });
      router.replace(`/farmers/${farmer.id}`);
    } else {
      hapticError(); // Haptic feedback on error
    }
  }
}

function confirmArchive() {
  warning(); // Haptic feedback on warning action
  showArchiveDialog.value = true;
}

async function onArchive() {
  if (!farmerId.value) return;

  const archiveSuccess = await farmersStore.archiveFarmer(farmerId.value);
  showArchiveDialog.value = false;

  if (archiveSuccess) {
    success(); // Haptic feedback on successful operation
    $q.notify({
      type: 'info',
      message: t('farmer.farmerArchived'),
      position: 'bottom',
    });
    router.replace('/farmers');
  } else {
    hapticError(); // Haptic feedback on error
  }
}

onMounted(() => {
  loadFarmer();
  // Load current organization for default assignment
  organizationsStore.fetchCurrentOrganization();
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
