<template>
  <div class="forgot-pin-page">
    <q-form class="q-gutter-md" @submit="onSubmit">
      <!-- Tab Toggle: Email vs Phone -->
      <q-tabs
        v-model="resetMode"
        class="text-primary q-mb-md"
        dense
        no-caps
        inline-label
        active-color="primary"
        indicator-color="primary"
      >
        <q-tab name="email" icon="email" :label="$t('auth.email', 'Email')" />
        <q-tab name="phone" icon="phone" :label="$t('auth.phone', 'Phone')" />
      </q-tabs>

      <!-- Description -->
      <p class="text-body2 text-grey-7 text-center q-mb-md">
        {{ resetMode === 'email'
          ? $t('auth.forgotPinDescription', 'Enter the email associated with your account and we\'ll send you a PIN reset link.')
          : $t('auth.forgotPinPhoneDescription', 'Enter your registered phone number. We\'ll generate a new PIN for you.')
        }}
      </p>

      <!-- Success Message -->
      <q-banner v-if="resetSuccess" dense class="bg-positive text-white q-mb-md" rounded>
        <div class="text-weight-bold q-mb-xs">{{ $t('auth.pinResetSuccess') }}</div>
        <div>{{ $t('auth.forgotPinSuccess', 'A PIN reset link has been sent. Check your email or phone.') }}</div>
      </q-banner>

      <!-- Error Message -->
      <q-banner v-if="error" dense class="bg-negative text-white q-mb-md" rounded>
        {{ error }}
      </q-banner>

      <template v-if="!resetSuccess">
        <!-- Email Input -->
        <q-input
          v-if="resetMode === 'email'"
          v-model="form.email"
          :label="$t('auth.email', 'Email')"
          type="email"
          outlined
          :rules="[
            (val: string) => !!val || $t('validation.required'),
            (val: string) => emailRegex.test(val) || $t('validation.emailInvalid', 'Please enter a valid email'),
          ]"
        >
          <template #prepend>
            <q-icon name="email" />
          </template>
        </q-input>

        <!-- Phone Input -->
        <q-input
          v-if="resetMode === 'phone'"
          v-model="form.phone"
          :label="$t('auth.phone', 'Phone Number')"
          type="tel"
          outlined
          :rules="[
            (val: string) => !!val || $t('validation.required'),
            (val: string) => val.replace(/\D/g, '').length >= 7 || $t('validation.phoneInvalid', 'Please enter a valid phone number'),
          ]"
        >
          <template #prepend>
            <q-icon name="phone" />
          </template>
        </q-input>

        <!-- Submit Button -->
        <q-btn
          :label="resetMode === 'email'
            ? $t('auth.forgotPinSubmit', 'Send Reset Link')
            : $t('auth.forgotPinPhoneSubmit', 'Reset PIN')"
          type="submit"
          color="primary"
          class="full-width"
          size="lg"
          unelevated
          :loading="loading"
        />
      </template>

      <!-- Back to Login Link -->
      <div class="text-center q-mt-md">
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          :label="$t('auth.backToLogin')"
          icon="arrow_back"
          @click="router.push('/auth/login')"
        />
      </div>
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from 'src/lib/api';

const { t } = useI18n();
const router = useRouter();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const resetMode = ref<'email' | 'phone'>('phone');

const form = reactive({
  email: '',
  phone: '',
});

const loading = ref(false);
const error = ref<string | null>(null);
const resetSuccess = ref(false);

async function onSubmit() {
  loading.value = true;
  error.value = null;
  resetSuccess.value = false;

  try {
    const payload: Record<string, string> = {};
    if (resetMode.value === 'email') {
      payload.email_id = form.email;
    } else {
      payload.phone_number = form.phone;
    }
    await api.post('/auth/forgot-pin', payload);
    resetSuccess.value = true;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'response' in err) {
      const response = (err as { response?: { data?: { detail?: string }; status?: number } })
        .response;
      if (response?.status === 404 || response?.status === 422) {
        error.value = t('auth.forgotPinError');
      } else if (response?.data?.detail) {
        error.value = response.data.detail;
      } else {
        error.value = t('errors.generic');
      }
    } else {
      error.value = t('errors.generic');
    }
  } finally {
    loading.value = false;
  }
}
</script>
