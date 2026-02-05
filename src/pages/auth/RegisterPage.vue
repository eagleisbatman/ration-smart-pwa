<template>
  <div class="register-page">
    <q-form class="q-gutter-md" @submit="onSubmit">
      <!-- Name -->
      <q-input
        v-model="form.name"
        :label="$t('profile.fullName')"
        outlined
        :rules="[(val) => !!val || $t('validation.required')]"
      >
        <template #prepend>
          <q-icon name="person" />
        </template>
      </q-input>

      <!-- Registration Method Toggle -->
      <q-btn-toggle
        v-model="registerMethod"
        spread
        no-caps
        rounded
        unelevated
        toggle-color="primary"
        color="grey-3"
        text-color="grey-8"
        :options="[
          { label: $t('auth.email'), value: 'email' },
          { label: $t('auth.phone'), value: 'phone' },
        ]"
      />

      <!-- Email Input -->
      <q-input
        v-if="registerMethod === 'email'"
        v-model="form.email"
        :label="$t('auth.email')"
        type="email"
        outlined
        :rules="[
          (val) => !!val || $t('validation.required'),
          (val) => /.+@.+\..+/.test(val) || $t('validation.invalidEmail'),
        ]"
      >
        <template #prepend>
          <q-icon name="email" />
        </template>
      </q-input>

      <!-- Phone Input -->
      <q-input
        v-else
        v-model="form.phone"
        :label="$t('auth.phone')"
        type="tel"
        outlined
        mask="##########"
        :rules="[(val) => !!val || $t('validation.required')]"
      >
        <template #prepend>
          <q-icon name="phone" />
        </template>
      </q-input>

      <!-- Country Selection -->
      <q-select
        v-model="form.country_code"
        :label="$t('profile.country')"
        outlined
        :options="countryOptions"
        emit-value
        map-options
        :rules="[(val) => !!val || $t('validation.required')]"
      >
        <template #prepend>
          <q-icon name="public" />
        </template>
      </q-select>

      <!-- PIN Input -->
      <q-input
        v-model="form.pin"
        :label="$t('auth.createPin')"
        :type="showPin ? 'text' : 'password'"
        outlined
        mask="####"
        :rules="[
          (val) => !!val || $t('validation.required'),
          (val) => val.length === 4 || $t('validation.pinLength'),
        ]"
      >
        <template #prepend>
          <q-icon name="lock" />
        </template>
        <template #append>
          <q-icon
            :name="showPin ? 'visibility_off' : 'visibility'"
            class="cursor-pointer"
            @click="showPin = !showPin"
          />
        </template>
      </q-input>

      <!-- Confirm PIN -->
      <q-input
        v-model="form.confirmPin"
        :label="$t('auth.confirmPin')"
        :type="showPin ? 'text' : 'password'"
        outlined
        mask="####"
        :rules="[
          (val) => !!val || $t('validation.required'),
          (val) => val === form.pin || $t('validation.pinMismatch'),
        ]"
      >
        <template #prepend>
          <q-icon name="lock" />
        </template>
      </q-input>

      <!-- Error Message -->
      <q-banner v-if="error" dense class="bg-negative text-white q-mb-md" rounded>
        {{ error }}
      </q-banner>

      <!-- Submit Button -->
      <q-btn
        :label="$t('auth.createAccount')"
        type="submit"
        color="primary"
        class="full-width"
        size="lg"
        unelevated
        :loading="loading"
      />

      <!-- Login Link -->
      <div class="text-center q-mt-md">
        <span class="text-grey-7">{{ $t('auth.haveAccount') }}</span>
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          :label="$t('auth.login')"
          @click="router.push('/auth/login')"
        />
      </div>
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
const router = useRouter();
const authStore = useAuthStore();

const registerMethod = ref<'email' | 'phone'>('email');
const showPin = ref(false);

const form = reactive({
  name: '',
  email: '',
  phone: '',
  country_code: 'IN',
  pin: '',
  confirmPin: '',
});

const countryOptions = [
  { label: 'India', value: 'IN' },
  { label: 'Kenya', value: 'KE' },
  { label: 'Ethiopia', value: 'ET' },
  { label: 'Nepal', value: 'NP' },
  { label: 'Bangladesh', value: 'BD' },
  { label: 'Vietnam', value: 'VN' },
  { label: 'Other', value: 'OTHER' },
];

const loading = computed(() => authStore.loading);
const error = computed(() => authStore.error);

async function onSubmit() {
  const data = {
    name: form.name,
    pin: form.pin,
    country_code: form.country_code,
    ...(registerMethod.value === 'email' ? { email: form.email } : { phone: form.phone }),
  };

  const success = await authStore.register(data);

  if (success) {
    // Store country for onboarding flow
    sessionStorage.setItem('selected_country', form.country_code);
    // Start onboarding flow
    router.push('/auth/language');
  }
}
</script>

<style lang="scss" scoped>
.register-page {
  padding: 0 8px;
}
</style>
