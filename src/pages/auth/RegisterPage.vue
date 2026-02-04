<template>
  <div class="register-page">
    <q-form @submit="onSubmit" class="q-gutter-md">
      <!-- Name -->
      <q-input
        v-model="form.name"
        label="Your Name"
        outlined
        :rules="[(val) => !!val || 'Name is required']"
      >
        <template v-slot:prepend>
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
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
        ]"
      />

      <!-- Email Input -->
      <q-input
        v-if="registerMethod === 'email'"
        v-model="form.email"
        label="Email Address"
        type="email"
        outlined
        :rules="[
          (val) => !!val || 'Email is required',
          (val) => /.+@.+\..+/.test(val) || 'Enter a valid email',
        ]"
      >
        <template v-slot:prepend>
          <q-icon name="email" />
        </template>
      </q-input>

      <!-- Phone Input -->
      <q-input
        v-else
        v-model="form.phone"
        label="Phone Number"
        type="tel"
        outlined
        mask="##########"
        :rules="[(val) => !!val || 'Phone number is required']"
      >
        <template v-slot:prepend>
          <q-icon name="phone" />
        </template>
      </q-input>

      <!-- Country Selection -->
      <q-select
        v-model="form.country_code"
        label="Country"
        outlined
        :options="countryOptions"
        emit-value
        map-options
        :rules="[(val) => !!val || 'Please select a country']"
      >
        <template v-slot:prepend>
          <q-icon name="public" />
        </template>
      </q-select>

      <!-- PIN Input -->
      <q-input
        v-model="form.pin"
        label="Create PIN (4 digits)"
        :type="showPin ? 'text' : 'password'"
        outlined
        mask="####"
        :rules="[
          (val) => !!val || 'PIN is required',
          (val) => val.length === 4 || 'PIN must be 4 digits',
        ]"
      >
        <template v-slot:prepend>
          <q-icon name="lock" />
        </template>
        <template v-slot:append>
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
        label="Confirm PIN"
        :type="showPin ? 'text' : 'password'"
        outlined
        mask="####"
        :rules="[
          (val) => !!val || 'Please confirm your PIN',
          (val) => val === form.pin || 'PINs do not match',
        ]"
      >
        <template v-slot:prepend>
          <q-icon name="lock" />
        </template>
      </q-input>

      <!-- Error Message -->
      <q-banner v-if="error" dense class="bg-negative text-white q-mb-md" rounded>
        {{ error }}
      </q-banner>

      <!-- Submit Button -->
      <q-btn
        label="Create Account"
        type="submit"
        color="primary"
        class="full-width"
        size="lg"
        unelevated
        :loading="loading"
      />

      <!-- Login Link -->
      <div class="text-center q-mt-md">
        <span class="text-grey-7">Already have an account?</span>
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          label="Login"
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
    router.push('/');
  }
}
</script>

<style lang="scss" scoped>
.register-page {
  padding: 0 8px;
}
</style>
