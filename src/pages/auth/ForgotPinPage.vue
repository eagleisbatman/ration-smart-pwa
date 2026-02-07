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
        <!-- Method Toggle -->
        <q-btn-toggle
          v-model="method"
          spread
          no-caps
          rounded
          unelevated
          toggle-color="primary"
          toggle-text-color="white"
          color="white"
          text-color="grey-8"
          :options="[
            { label: $t('auth.email'), value: 'email', icon: 'email' },
            { label: $t('auth.phone'), value: 'phone', icon: 'phone' },
          ]"
          class="method-toggle"
        />

        <!-- Email Input -->
        <q-input
          v-if="method === 'email'"
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

        <!-- Phone Input with Country -->
        <template v-else>
          <q-select
            v-model="form.country_code"
            :label="$t('profile.country')"
            outlined
            :options="countryOptions"
            emit-value
            map-options
            dense
            :loading="authStore.countriesLoading"
            class="q-mb-sm"
          >
            <template #prepend>
              <q-icon name="public" />
            </template>
            <template #option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar class="min-w-0" style="min-width: 0; padding-right: 8px">
                  <span class="text-h6">{{ scope.opt.flag }}</span>
                </q-item-section>
                <q-item-section>{{ scope.opt.label }}</q-item-section>
              </q-item>
            </template>
            <template #selected-item="scope">
              <span>{{ scope.opt.flag }} {{ scope.opt.label }}</span>
            </template>
          </q-select>

          <q-input
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
        </template>

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
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';
import { useAuthStore } from 'src/stores/auth';
import { formatPhoneE164 } from 'src/services/api-adapter';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

const method = ref<'email' | 'phone'>('email');

const form = reactive({
  email: '',
  phone: '',
  country_code: 'IN',
});

/** Convert a 2-letter ISO country code to its flag emoji. */
function countryCodeToFlag(code: string): string {
  return [...code.toUpperCase()]
    .map((ch) => String.fromCodePoint(0x1f1e6 + ch.charCodeAt(0) - 65))
    .join('');
}

const FALLBACK_COUNTRIES = [
  { country_code: 'IN', name: 'India' },
  { country_code: 'KE', name: 'Kenya' },
  { country_code: 'ET', name: 'Ethiopia' },
  { country_code: 'NP', name: 'Nepal' },
  { country_code: 'BD', name: 'Bangladesh' },
  { country_code: 'VN', name: 'Vietnam' },
];

const countryOptions = computed(() => {
  const source = authStore.countries.length > 0 ? authStore.countries : FALLBACK_COUNTRIES;
  return source.map((c) => ({
    label: t(`countries.${c.country_code}`, c.name || c.country_code),
    value: c.country_code,
    flag: countryCodeToFlag(c.country_code),
  }));
});

onMounted(() => {
  authStore.fetchCountries();
});

const loading = ref(false);
const error = ref<string | null>(null);
const success = ref(false);

async function onSubmit() {
  loading.value = true;
  error.value = null;
  success.value = false;

  try {
    const payload = method.value === 'email'
      ? { email: form.email }
      : { phone_number: formatPhoneE164(form.phone, form.country_code) };

    await api.post('/api/v1/auth/forgot-pin', payload);
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
.method-toggle :deep(.q-btn) {
  border: 1.5px solid $grey-4;
  transition: all 0.2s ease;
}

.method-toggle :deep(.q-btn.bg-primary) {
  border-color: var(--q-primary);
}
</style>
