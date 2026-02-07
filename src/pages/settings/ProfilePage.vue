<template>
  <q-page class="q-pa-md">
    <q-form class="q-gutter-md" @submit="onSubmit">
      <!-- Avatar -->
      <div class="text-center q-mb-lg">
        <div class="photo-container q-mx-auto" @click="showPhotoOptions = true" style="position: relative; display: inline-block; cursor: pointer;">
          <q-avatar v-if="profileImage" size="100px">
            <q-img :src="profileImage" :ratio="1" />
          </q-avatar>
          <q-avatar v-else size="100px" color="primary" text-color="white">
            <q-icon name="photo_camera" size="40px" />
          </q-avatar>
          <q-btn
            v-if="profileImage"
            round
            flat
            dense
            size="sm"
            icon="close"
            class="photo-remove-btn"
            style="position: absolute; top: -4px; right: -4px; background: rgba(0,0,0,0.5); color: white;"
            @click.stop="removePhoto"
          />
        </div>
        <div class="text-caption text-grey-6 q-mt-xs">{{ $t('profile.tapToAddPhoto') }}</div>
      </div>

      <!-- Photo Options Dialog -->
      <q-dialog v-model="showPhotoOptions" position="bottom">
        <q-card>
          <q-list>
            <q-item v-close-popup clickable @click="takePhoto">
              <q-item-section avatar><q-icon name="photo_camera" /></q-item-section>
              <q-item-section>{{ $t('profile.takePhoto') }}</q-item-section>
            </q-item>
            <q-item v-close-popup clickable @click="chooseFromGallery">
              <q-item-section avatar><q-icon name="photo_library" /></q-item-section>
              <q-item-section>{{ $t('profile.chooseFromGallery') }}</q-item-section>
            </q-item>
            <q-item v-if="profileImage" v-close-popup clickable @click="removePhoto">
              <q-item-section avatar><q-icon name="delete" color="negative" /></q-item-section>
              <q-item-section class="text-negative">{{ $t('profile.removePhoto') }}</q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </q-dialog>

      <!-- Name -->
      <q-input
        v-model="form.name"
        :label="$t('profile.name')"
        outlined
        :rules="[(val) => !!val || $t('profile.nameRequired')]"
      >
        <template #prepend>
          <q-icon name="person" />
        </template>
      </q-input>

      <!-- Email (read-only if set, with Change button) -->
      <q-input
        v-model="form.email"
        :label="$t('profile.email')"
        type="email"
        outlined
        :readonly="!!authStore.user?.email"
      >
        <template #prepend>
          <q-icon name="email" />
        </template>
        <template v-if="authStore.user?.email" #append>
          <q-btn flat dense size="sm" :label="$t('profile.change')" color="primary" @click="openChangeDialog('email')" />
        </template>
      </q-input>

      <!-- Phone (read-only if set, with Change button) -->
      <q-input
        v-model="form.phone"
        :label="$t('profile.phone')"
        outlined
        :readonly="!!authStore.user?.phone"
      >
        <template #prepend>
          <q-icon name="phone" />
        </template>
        <template v-if="authStore.user?.phone" #append>
          <q-btn flat dense size="sm" :label="$t('profile.change')" color="primary" @click="openChangeDialog('phone')" />
        </template>
      </q-input>

      <!-- Country -->
      <q-select
        v-model="form.country_code"
        :label="$t('profile.country')"
        outlined
        :options="countryOptions"
        emit-value
        map-options
        :loading="authStore.countriesLoading"
      >
        <template #prepend>
          <q-icon name="public" />
        </template>
      </q-select>

      <!-- Language -->
      <q-select
        v-model="form.language"
        :label="$t('profile.language')"
        outlined
        :options="languageOptions"
        emit-value
        map-options
      >
        <template #prepend>
          <q-icon name="language" />
        </template>
      </q-select>

      <!-- Save Button -->
      <q-btn
        :label="$t('profile.saveChanges')"
        type="submit"
        color="primary"
        class="full-width"
        size="lg"
        unelevated
        :loading="loading"
      />

      <!-- Change PIN -->
      <q-separator class="q-my-lg" />

      <div class="text-subtitle1 q-mb-sm">{{ $t('profile.security') }}</div>

      <q-btn
        :label="$t('profile.changePin')"
        icon="lock"
        color="grey-7"
        flat
        class="full-width"
        @click="showChangePinDialog"
      />
    </q-form>

    <!-- Change Contact Dialog (Email/Phone) -->
    <ChangeContactDialog
      v-model="showChangeDialog"
      :type="changeDialogType"
      :current-value="changeDialogType === 'email' ? form.email : form.phone"
      @changed="onContactChanged"
    />

    <!-- Change PIN Dialog -->
    <q-dialog v-model="changePinDialog" persistent>
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">{{ $t('profile.changePin') }}</div>
        </q-card-section>

        <q-card-section class="q-gutter-sm">
          <q-input
            v-model="pinForm.currentPin"
            :label="$t('profile.currentPin')"
            type="password"
            outlined
            mask="####"
          />
          <q-input
            v-model="pinForm.newPin"
            :label="$t('profile.newPin')"
            type="password"
            outlined
            mask="####"
          />
          <q-input
            v-model="pinForm.confirmPin"
            :label="$t('profile.confirmNewPin')"
            type="password"
            outlined
            mask="####"
            :error="pinForm.newPin !== pinForm.confirmPin && pinForm.confirmPin.length === 4"
            :error-message="$t('profile.pinsDontMatch')"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="$t('common.cancel')" />
          <q-btn
            flat
            :label="$t('profile.changePin')"
            color="primary"
            :disable="!canChangePin"
            :loading="changingPin"
            @click="changePin"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/auth';
import { availableLocales } from 'src/boot/i18n';
import { useImageUpload } from 'src/composables/useImageUpload';
import ChangeContactDialog from 'src/components/settings/ChangeContactDialog.vue';

const $q = useQuasar();
const { t } = useI18n();
const authStore = useAuthStore();

const { captureFromCamera, selectFromGallery, clearImage } = useImageUpload();

const loading = computed(() => authStore.loading);
const showPhotoOptions = ref(false);
const profileImage = ref<string | null>(null);

// Change contact dialog state
const showChangeDialog = ref(false);
const changeDialogType = ref<'email' | 'phone'>('email');

function openChangeDialog(type: 'email' | 'phone') {
  changeDialogType.value = type;
  showChangeDialog.value = true;
}

function onContactChanged() {
  // Refresh form values from updated auth store
  if (authStore.user) {
    form.email = authStore.user.email || '';
    form.phone = authStore.user.phone || '';
  }
  $q.notify({
    type: 'positive',
    message: t('profile.contactChanged', {
      type: changeDialogType.value === 'email'
        ? t('profile.email')
        : t('profile.phone'),
    }),
  });
}

async function takePhoto() {
  const result = await captureFromCamera();
  if (result) {
    profileImage.value = result;
    localStorage.setItem('profile_image', result);
  }
}

async function chooseFromGallery() {
  const result = await selectFromGallery();
  if (result) {
    profileImage.value = result;
    localStorage.setItem('profile_image', result);
  }
}

function removePhoto() {
  profileImage.value = null;
  clearImage();
  localStorage.removeItem('profile_image');
}

const form = reactive({
  name: '',
  email: '',
  phone: '',
  country_code: 'IN',
  language: 'en',
});

const changePinDialog = ref(false);
const changingPin = ref(false);
const pinForm = reactive({
  currentPin: '',
  newPin: '',
  confirmPin: '',
});

const canChangePin = computed(() =>
  pinForm.currentPin.length === 4 &&
  pinForm.newPin.length === 4 &&
  pinForm.confirmPin.length === 4 &&
  pinForm.newPin === pinForm.confirmPin
);

const countryOptions = computed(() =>
  authStore.countries.map((c) => ({
    label: c.name || t(`countries.${c.country_code}`, c.country_code),
    value: c.country_code,
  }))
);

const languageOptions = computed(() =>
  availableLocales.map((l) => ({
    label: l.nativeLabel,
    value: l.value,
  }))
);

async function onSubmit() {
  const success = await authStore.updateProfile({
    name: form.name,
    country_code: form.country_code,
    language: form.language,
  });

  if (success) {
    $q.notify({
      type: 'positive',
      message: t('profile.profileUpdated'),
    });
  }
}

function showChangePinDialog() {
  pinForm.currentPin = '';
  pinForm.newPin = '';
  pinForm.confirmPin = '';
  changePinDialog.value = true;
}

async function changePin() {
  changingPin.value = true;

  const success = await authStore.changePin(pinForm.currentPin, pinForm.newPin);

  changingPin.value = false;

  if (success) {
    changePinDialog.value = false;
    $q.notify({
      type: 'positive',
      message: t('profile.pinChangedSuccess'),
    });
  } else {
    $q.notify({
      type: 'negative',
      message: authStore.error || t('profile.pinChangeFailed'),
    });
  }
}

onMounted(async () => {
  if (authStore.user) {
    form.name = authStore.user.name || '';
    form.email = authStore.user.email || '';
    form.phone = authStore.user.phone || '';
    form.country_code = authStore.user.country_code || 'IN';
    form.language = authStore.user.language || 'en';
  }
  // Load saved profile image
  const savedImage = localStorage.getItem('profile_image');
  if (savedImage) {
    profileImage.value = savedImage;
  }
  await authStore.fetchCountries();
});
</script>
