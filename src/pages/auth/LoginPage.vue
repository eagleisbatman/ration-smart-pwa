<template>
  <div class="login-page">
    <q-form @submit="onSubmit" class="q-gutter-md">
      <!-- Login Method Toggle -->
      <q-btn-toggle
        v-model="loginMethod"
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
        class="q-mb-md"
      />

      <!-- Email Input -->
      <q-input
        v-if="loginMethod === 'email'"
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

      <!-- PIN Input -->
      <q-input
        v-model="form.pin"
        label="PIN"
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

      <!-- Error Message -->
      <q-banner v-if="error" dense class="bg-negative text-white q-mb-md" rounded>
        {{ error }}
      </q-banner>

      <!-- Submit Button -->
      <q-btn
        label="Login"
        type="submit"
        color="primary"
        class="full-width"
        size="lg"
        unelevated
        :loading="loading"
      />

      <!-- Register Link -->
      <div class="text-center q-mt-md">
        <span class="text-grey-7">Don't have an account?</span>
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          label="Register"
          @click="router.push('/auth/register')"
        />
      </div>
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loginMethod = ref<'email' | 'phone'>('email');
const showPin = ref(false);

const form = reactive({
  email: '',
  phone: '',
  pin: '',
});

const loading = computed(() => authStore.loading);
const error = computed(() => authStore.error);

async function onSubmit() {
  const credentials = {
    pin: form.pin,
    ...(loginMethod.value === 'email' ? { email: form.email } : { phone: form.phone }),
  };

  const success = await authStore.login(credentials);

  if (success) {
    // Redirect to intended page or home
    const redirect = route.query.redirect as string;
    router.push(redirect || '/');
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  padding: 0 8px;
}
</style>
