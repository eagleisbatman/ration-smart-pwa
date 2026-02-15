<template>
  <q-page class="q-pa-md">
    <q-form class="q-gutter-md" @submit="onSubmit">
      <!-- Avatar -->
      <PhotoUploadSection
        :model-value="profileImage ?? undefined"
        @update:model-value="onProfileImageChange"
      />

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
      <q-card>
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
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/auth';
import { availableLocales } from 'src/boot/i18n';
import ChangeContactDialog from 'src/components/settings/ChangeContactDialog.vue';
import PhotoUploadSection from 'src/components/shared/PhotoUploadSection.vue';

const $q = useQuasar();
const { t } = useI18n();
const authStore = useAuthStore();

const loading = computed(() => authStore.loading);
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

function onProfileImageChange(value: string | undefined) {
  profileImage.value = value ?? null;
  authStore.setProfileImage(value ?? null);
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
    profile_image_url: profileImage.value,
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

// Populate form when user data becomes available (may arrive after mount via API)
function populateForm() {
  if (authStore.user) {
    form.name = authStore.user.name || '';
    form.email = authStore.user.email || '';
    form.phone = authStore.user.phone || '';
    form.country_code = authStore.user.country_code || 'IN';
    form.language = authStore.user.language || 'en';
  }
}

watch(() => authStore.user, (newUser) => {
  if (newUser) populateForm();
});

onMounted(async () => {
  populateForm();
  profileImage.value = authStore.profileImage;
  await authStore.fetchCountries();
});
</script>
