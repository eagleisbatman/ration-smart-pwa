<template>
  <q-page class="q-pa-md">
    <q-form class="q-gutter-md" @submit="onSubmit">
      <!-- Avatar -->
      <div class="flex justify-center q-mb-md">
        <q-avatar v-if="profileImage" size="80px">
          <q-img :src="profileImage" :ratio="1" alt="Profile photo" />
        </q-avatar>
        <q-avatar v-else size="80px" color="primary" text-color="white">
          <q-icon name="person" size="40px" />
        </q-avatar>
      </div>

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

      <!-- Email (read-only) -->
      <q-input
        v-model="form.email"
        :label="$t('profile.email')"
        type="email"
        outlined
        readonly
      >
        <template #prepend>
          <q-icon name="email" />
        </template>
      </q-input>

      <!-- Country -->
      <q-select
        v-model="form.country_code"
        :label="$t('profile.country')"
        outlined
        behavior="menu"
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
        behavior="menu"
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
        flat
        class="full-width change-pin-btn"
        @click="showChangePinDialog"
      />

      <!-- Delete Account -->
      <q-separator class="q-my-lg" />

      <div class="text-subtitle1 q-mb-sm text-negative">{{ $t('profile.dangerZone', 'Danger Zone') }}</div>

      <q-btn
        :label="$t('settings.deleteAccount')"
        icon="delete_forever"
        flat
        color="negative"
        class="full-width"
        @click="showDeleteDialog"
      />
    </q-form>

    <!-- Delete Account Dialog -->
    <q-dialog v-model="deleteDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6 text-negative">{{ $t('settings.deleteAccount') }}</div>
          <div class="text-body2 q-mt-sm">{{ $t('settings.deleteAccountWarning') }}</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="deletePin"
            :label="$t('settings.enterPin')"
            type="password"
            outlined
            mask="####"
            :rules="[(val: string) => val.length === 4 || $t('validation.pinLength')]"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="$t('common.cancel')" />
          <q-btn
            flat
            :label="$t('common.confirm')"
            color="negative"
            :disable="deletePin.length !== 4"
            :loading="deleting"
            @click="confirmDeleteAccount"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

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
            :rules="[
              (val: string) => !!val || $t('validation.required'),
              (val: string) => val.length === 4 || $t('validation.pinLength'),
            ]"
          />
          <q-input
            v-model="pinForm.newPin"
            :label="$t('profile.newPin')"
            type="password"
            outlined
            mask="####"
            :rules="[
              (val: string) => !!val || $t('validation.required'),
              (val: string) => val.length === 4 || $t('validation.pinLength'),
            ]"
          />
          <q-input
            v-model="pinForm.confirmPin"
            :label="$t('profile.confirmNewPin')"
            type="password"
            outlined
            mask="####"
            :rules="[
              (val: string) => !!val || $t('validation.required'),
              (val: string) => val.length === 4 || $t('validation.pinLength'),
              (val: string) => val === pinForm.newPin || $t('profile.pinsDontMatch'),
            ]"
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
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { toAlpha2 } from 'src/services/api-adapter';
import { availableLocales } from 'src/boot/i18n';

const $q = useQuasar();
const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

const loading = computed(() => authStore.loading);
const profileImage = ref<string | null>(null);

const form = reactive({
  name: '',
  email: '',
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

// Delete account state
const deleteDialog = ref(false);
const deletePin = ref('');
const deleting = ref(false);

function showDeleteDialog() {
  deletePin.value = '';
  deleteDialog.value = true;
}

async function confirmDeleteAccount() {
  deleting.value = true;
  const success = await authStore.deleteAccount(deletePin.value);
  deleting.value = false;

  if (success) {
    $q.notify({
      type: 'positive',
      message: t('settings.accountDeleted'),
    });
    router.replace('/auth/login');
  } else {
    $q.notify({
      type: 'negative',
      message: authStore.error || t('settings.deleteAccountFailed'),
    });
  }
}

const countryOptions = computed(() =>
  authStore.countries.map((c) => ({
    label: c.name || t(`countries.${c.country_code}`, c.country_code),
    value: toAlpha2(c.country_code),
  }))
);

const languageOptions = computed(() =>
  availableLocales.map((l) => ({
    label: l.nativeLabel,
    value: l.value,
  }))
);

async function onSubmit() {
  // EC2 only accepts {name, country_id} — language is local-only
  const success = await authStore.updateProfile({
    name: form.name,
    country_code: form.country_code,
  });

  if (success) {
    // Save language locally (EC2 doesn't store it)
    localStorage.setItem('preferred_language', form.language);
    authStore.preferredLanguage = form.language;

    populateForm();
    $q.notify({
      type: 'positive',
      message: t('profile.profileUpdated'),
    });
  } else {
    $q.notify({
      type: 'negative',
      message: authStore.error || t('profile.profileUpdateFailed', 'Failed to save profile'),
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
    form.email = authStore.user.email || authStore.userEmail || '';
    form.country_code = authStore.user.country_code || 'IN';
  }
  // Language is local-only (EC2 doesn't store it)
  form.language = localStorage.getItem('preferred_language') || 'en';
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

<style lang="scss" scoped>
.change-pin-btn {
  color: #616161 !important;

  .body--dark & {
    color: rgba(255, 255, 255, 0.6) !important;
  }
}
</style>
