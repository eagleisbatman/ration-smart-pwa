<template>
  <div class="forgot-pin-page">
    <q-form class="q-gutter-md" @submit="onSubmit">
      <!-- Description -->
      <p class="text-body2 text-grey-7 text-center q-mb-md">
        {{ $t('auth.forgotPinPhoneDescription') }}
      </p>

      <!-- Success Message -->
      <q-banner v-if="resetSuccess" dense class="bg-positive text-white q-mb-md" rounded>
        <div class="text-weight-bold q-mb-xs">{{ $t('auth.pinResetSuccess') }}</div>
        <div>{{ $t('auth.pinResetContactAdmin') }}</div>
      </q-banner>

      <!-- Error Message -->
      <q-banner v-if="error" dense class="bg-negative text-white q-mb-md" rounded>
        {{ error }}
      </q-banner>

      <template v-if="!resetSuccess">
        <!-- Country Selection -->
        <q-select
          v-model="form.country_code"
          :label="$t('profile.country')"
          outlined
          :options="countryOptions"
          emit-value
          map-options
          dense
          behavior="menu"
          :loading="authStore.countriesLoading"
          class="q-mb-sm"
        >
          <template #prepend>
            <img :src="flagUrl(form.country_code)" width="20" height="15" class="flag-img" :alt="$t('profile.country')" />
          </template>
          <template v-slot:option="{ itemProps, opt }">
            <q-item v-bind="itemProps">
              <q-item-section side class="country-option-flag">
                <img :src="flagUrl(opt.value)" width="20" height="15" class="flag-img" :alt="opt.label" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ opt.label }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>

        <!-- Phone Input -->
        <q-input
          v-model="form.phone"
          :label="$t('auth.phone')"
          type="tel"
          outlined
          :mask="selectedPhoneMask"
          :rules="[
            (val: string) => !!val || $t('validation.required'),
            (val: string) => val.replace(/\D/g, '').length >= 7 || $t('validation.phoneTooShort'),
          ]"
        >
          <template #prepend>
            <img :src="flagUrl(form.country_code)" width="20" height="15" class="q-mr-xs flag-img" :alt="$t('profile.country')" />
            <span class="text-body2 text-weight-medium text-grey-8 q-mr-xs">{{ selectedDialCode }}</span>
          </template>
        </q-input>

        <!-- Submit Button -->
        <q-btn
          :label="$t('auth.forgotPinPhoneSubmit')"
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
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from 'src/lib/api';
import { useAuthStore } from 'src/stores/auth';
import { formatPhoneE164, getDialCode, getPhoneMask, FALLBACK_COUNTRIES, SUPPORTED_COUNTRY_CODES } from 'src/services/api-adapter';
import { useGeoCountry } from 'src/composables/useGeoCountry';

const flagUrl = (code: string) => `/flags/${(code || 'xx').toLowerCase()}.svg`;

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const { detectedCountry } = useGeoCountry();

// Prefer saved country from a previous login/registration over geo-detection
const savedCountry = localStorage.getItem('last_country_code');

const form = reactive({
  phone: '',
  country_code: savedCountry || detectedCountry.value,
});

// Update country when geo-detection resolves (only if user hasn't changed it and no saved preference)
watch(detectedCountry, (code) => {
  if (!savedCountry && (form.country_code === 'IN' || !form.phone)) {
    form.country_code = code;
  }
});

const countryOptions = computed(() => {
  const seen = new Set<string>();
  const merged: { country_code: string; name: string }[] = [];
  for (const c of authStore.countries) {
    if (SUPPORTED_COUNTRY_CODES.has(c.country_code) && !seen.has(c.country_code)) {
      seen.add(c.country_code);
      merged.push(c);
    }
  }
  for (const c of FALLBACK_COUNTRIES) {
    if (!seen.has(c.country_code)) {
      seen.add(c.country_code);
      merged.push({ ...c });
    }
  }
  return merged.map((c) => {
    const dialCode = getDialCode(c.country_code);
    const name = t(`countries.${c.country_code}`, c.name || c.country_code);
    return {
      label: dialCode ? `${name} (${dialCode})` : name,
      value: c.country_code,
    };
  });
});

const selectedDialCode = computed(() => getDialCode(form.country_code));
const selectedPhoneMask = computed(() => getPhoneMask(form.country_code));

onMounted(() => {
  authStore.fetchCountries();
});

const loading = ref(false);
const error = ref<string | null>(null);
const resetSuccess = ref(false);

async function onSubmit() {
  loading.value = true;
  error.value = null;
  resetSuccess.value = false;

  try {
    const payload = {
      phone_number: formatPhoneE164(form.phone, form.country_code),
    };

    await api.post('/api/v1/auth/forgot-pin-phone', payload);
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
