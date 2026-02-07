<template>
  <div class="forgot-pin-page">
    <q-form class="q-gutter-md" @submit="onSubmit">
      <!-- Description -->
      <p class="text-body2 text-grey-7 text-center q-mb-md">
        {{ $t('auth.forgotPinDescription') }}
      </p>

      <!-- Success Message -->
      <q-banner v-if="success" dense class="bg-positive text-white q-mb-md" rounded>
        {{ $t('auth.forgotPinSuccess') }}
      </q-banner>

      <!-- Error Message -->
      <q-banner v-if="error" dense class="bg-negative text-white q-mb-md" rounded>
        {{ error }}
      </q-banner>

      <template v-if="!success">
        <!-- Email Input -->
        <q-input
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

        <!-- Submit Button -->
        <q-btn
          :label="$t('auth.forgotPinSubmit')"
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
import { api } from 'src/boot/axios';

const { t } = useI18n();
const router = useRouter();

const form = reactive({
  email: '',
});

const loading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

async function onSubmit() {
  loading.value = true;
  error.value = null;
  success.value = false;

  try {
    await api.post('/api/v1/auth/forgot-pin', {
      email: form.email,
    });
    success.value = true;
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

<style lang="scss" scoped>
/* Styling handled by AuthLayout container */
</style>
