<template>
  <q-page class="q-pa-md">
    <q-form @submit="onSubmit" class="q-gutter-md">
      <!-- Avatar -->
      <div class="text-center q-mb-lg">
        <q-avatar size="100px" color="primary" text-color="white">
          <q-icon name="person" size="60px" />
        </q-avatar>
      </div>

      <!-- Name -->
      <q-input
        v-model="form.name"
        label="Name"
        outlined
        :rules="[(val) => !!val || 'Name is required']"
      >
        <template v-slot:prepend>
          <q-icon name="person" />
        </template>
      </q-input>

      <!-- Email (read-only if set) -->
      <q-input
        v-model="form.email"
        label="Email"
        type="email"
        outlined
        :readonly="!!authStore.user?.email"
        :hint="authStore.user?.email ? 'Contact support to change email' : ''"
      >
        <template v-slot:prepend>
          <q-icon name="email" />
        </template>
      </q-input>

      <!-- Phone (read-only if set) -->
      <q-input
        v-model="form.phone"
        label="Phone"
        outlined
        :readonly="!!authStore.user?.phone"
        :hint="authStore.user?.phone ? 'Contact support to change phone' : ''"
      >
        <template v-slot:prepend>
          <q-icon name="phone" />
        </template>
      </q-input>

      <!-- Country -->
      <q-select
        v-model="form.country_code"
        label="Country"
        outlined
        :options="countryOptions"
        emit-value
        map-options
      >
        <template v-slot:prepend>
          <q-icon name="public" />
        </template>
      </q-select>

      <!-- Language -->
      <q-select
        v-model="form.language"
        label="Language"
        outlined
        :options="languageOptions"
        emit-value
        map-options
      >
        <template v-slot:prepend>
          <q-icon name="language" />
        </template>
      </q-select>

      <!-- Save Button -->
      <q-btn
        label="Save Changes"
        type="submit"
        color="primary"
        class="full-width"
        size="lg"
        unelevated
        :loading="loading"
      />

      <!-- Change PIN -->
      <q-separator class="q-my-lg" />

      <div class="text-subtitle1 q-mb-sm">Security</div>

      <q-btn
        label="Change PIN"
        icon="lock"
        color="grey-7"
        flat
        class="full-width"
        @click="showChangePinDialog"
      />
    </q-form>

    <!-- Change PIN Dialog -->
    <q-dialog v-model="changePinDialog" persistent>
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Change PIN</div>
        </q-card-section>

        <q-card-section class="q-gutter-sm">
          <q-input
            v-model="pinForm.currentPin"
            label="Current PIN"
            type="password"
            outlined
            mask="####"
          />
          <q-input
            v-model="pinForm.newPin"
            label="New PIN"
            type="password"
            outlined
            mask="####"
          />
          <q-input
            v-model="pinForm.confirmPin"
            label="Confirm New PIN"
            type="password"
            outlined
            mask="####"
            :error="pinForm.newPin !== pinForm.confirmPin && pinForm.confirmPin.length === 4"
            error-message="PINs don't match"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            flat
            label="Change"
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
import { useAuthStore } from 'src/stores/auth';

const $q = useQuasar();
const authStore = useAuthStore();

const loading = computed(() => authStore.loading);

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

const countryOptions = [
  { label: 'India', value: 'IN' },
  { label: 'Kenya', value: 'KE' },
  { label: 'Ethiopia', value: 'ET' },
  { label: 'Nepal', value: 'NP' },
  { label: 'Bangladesh', value: 'BD' },
];

const languageOptions = [
  { label: 'English', value: 'en' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Swahili', value: 'sw' },
  { label: 'Amharic', value: 'am' },
];

async function onSubmit() {
  const success = await authStore.updateProfile({
    name: form.name,
    country_code: form.country_code,
    language: form.language,
  });

  if (success) {
    $q.notify({
      type: 'positive',
      message: 'Profile updated successfully',
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
      message: 'PIN changed successfully',
    });
  } else {
    $q.notify({
      type: 'negative',
      message: authStore.error || 'Failed to change PIN',
    });
  }
}

onMounted(() => {
  if (authStore.user) {
    form.name = authStore.user.name || '';
    form.email = authStore.user.email || '';
    form.phone = authStore.user.phone || '';
    form.country_code = authStore.user.country_code || 'IN';
    form.language = authStore.user.language || 'en';
  }
});
</script>
