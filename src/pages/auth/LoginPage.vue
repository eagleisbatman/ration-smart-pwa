<template>
  <div class="login-page">
    <!-- Language Selector -->
    <div class="language-bar q-mb-md">
      <q-select
        v-model="selectedLanguage"
        :options="languageOptions"
        option-value="value"
        option-label="nativeLabel"
        emit-value
        map-options
        dense
        borderless
        class="language-select"
        behavior="dialog"
        @update:model-value="switchLanguage"
      >
        <template #prepend>
          <q-icon name="translate" size="xs" class="q-mr-xs" />
        </template>
        <template #append>
          <q-icon name="expand_more" size="xs" />
        </template>
        <template v-slot:option="{ itemProps, opt }">
          <q-item v-bind="itemProps" dense>
            <q-item-section>
              <q-item-label>{{ opt.nativeLabel }}</q-item-label>
              <q-item-label caption>{{ opt.label }}</q-item-label>
            </q-item-section>
            <q-item-section side v-if="selectedLanguage === opt.value">
              <q-icon name="check" color="primary" size="xs" />
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>

    <q-form @submit="onSubmit">
      <!-- Section: Credentials -->
      <div class="form-section">
        <div class="text-caption text-grey-7 text-uppercase text-weight-medium q-mb-sm q-px-xs">
          {{ $t('auth.sectionCredentials') }}
        </div>
        <div class="q-gutter-sm">
          <!-- Country Selection -->
          <q-select
            v-model="form.country_code"
            :label="$t('profile.country')"
            outlined
            :options="countryOptions"
            emit-value
            map-options
            dense
            behavior="dialog"
            :loading="authStore.countriesLoading"
            class="q-mb-sm"
          >
            <template #prepend>
              <img :src="flagUrl(form.country_code)" width="20" height="15" class="flag-img" />
            </template>
            <template v-slot:option="{ itemProps, opt }">
              <q-item v-bind="itemProps">
                <q-item-section side class="country-option-flag">
                  <img :src="flagUrl(opt.value)" width="20" height="15" class="flag-img" />
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
            :rules="[(val) => !!val || $t('validation.required')]"
          >
            <template #prepend>
              <img :src="flagUrl(form.country_code)" width="20" height="15" class="q-mr-xs flag-img" />
              <span class="text-body2 text-weight-medium text-grey-8 q-mr-xs">{{ selectedDialCode }}</span>
            </template>
          </q-input>
        </div>
      </div>

      <q-separator class="q-my-md" color="grey-3" />

      <!-- Section: Security -->
      <div class="form-section">
        <div class="text-caption text-grey-7 text-uppercase text-weight-medium q-mb-sm q-px-xs">
          {{ $t('auth.sectionSecurity') }}
        </div>
        <div class="q-gutter-sm">
          <!-- PIN Input -->
          <q-input
            v-model="form.pin"
            :label="$t('auth.pin')"
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

          <!-- Remember Me + Forgot PIN -->
          <div class="row items-center justify-between q-mt-xs">
            <q-checkbox
              v-model="rememberMe"
              :label="$t('auth.rememberMe')"
              dense
              color="primary"
              class="text-body2"
            />
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              :label="$t('auth.forgotPin')"
              @click="router.push('/auth/forgot-pin')"
              class="text-body2"
            />
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <transition
        enter-active-class="animated fadeIn"
        leave-active-class="animated fadeOut"
      >
        <q-banner
          v-if="error"
          dense
          rounded
          class="bg-red-1 text-negative rounded-borders q-my-md"
        >
          <template #avatar>
            <q-icon name="error_outline" color="negative" />
          </template>
          {{ error }}
          <template #action>
            <q-btn
              flat
              dense
              round
              icon="close"
              color="negative"
              size="sm"
              @click="authStore.error = null"
            />
          </template>
        </q-banner>
      </transition>

      <!-- Submit Button -->
      <q-btn
        :label="$t('auth.login')"
        type="submit"
        color="primary"
        class="full-width q-mt-lg submit-btn"
        size="xl"
        unelevated
        no-caps
        :loading="loading"
      />

      <!-- Register Link -->
      <div class="text-center q-mt-md">
        <span class="text-grey-7">{{ $t('auth.noAccount') }}</span>
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          :label="$t('auth.register')"
          @click="router.push('/auth/register')"
        />
      </div>
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/auth';
import { getDialCode, getPhoneMask, FALLBACK_COUNTRIES } from 'src/services/api-adapter';
import { useGeoCountry, SUPPORTED_COUNTRIES } from 'src/composables/useGeoCountry';
import { availableLocales, setLocale } from 'src/boot/i18n';

const flagUrl = (code: string) => `/flags/${(code || 'xx').toLowerCase()}.svg`;

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { detectedCountry } = useGeoCountry();

const showPin = ref(false);
const rememberMe = ref(false);

const form = reactive({
  phone: '',
  pin: '',
  country_code: detectedCountry.value,
});

// Update country when geo-detection resolves (only if user hasn't changed it)
watch(detectedCountry, (code) => {
  if (form.country_code === 'IN' || !form.phone) {
    form.country_code = code;
  }
});

// Language selection
const countryLanguageMap: Record<string, string[]> = {
  IN: ['en', 'hi', 'te', 'kn', 'mr', 'ta', 'bn', 'ml', 'gu', 'pa', 'or', 'as', 'ur'],
  ET: ['en', 'am', 'om'],
  KE: ['en'],
  NP: ['ne', 'en', 'hi'],
  MA: ['fr', 'ar', 'en'],
  VN: ['vi', 'en'],
  BD: ['bn', 'en'],
};

const selectedLanguage = ref(localStorage.getItem('locale') || 'en');

const languageOptions = computed(() => {
  const codes = countryLanguageMap[form.country_code] || ['en'];
  const recommended = codes
    .map(code => availableLocales.find(l => l.value === code))
    .filter(Boolean) as typeof availableLocales;
  if (!codes.includes(selectedLanguage.value)) {
    const current = availableLocales.find(l => l.value === selectedLanguage.value);
    if (current) recommended.unshift(current);
  }
  return recommended;
});

function switchLanguage(code: string) {
  setLocale(code);
}

const countryOptions = computed(() => {
  const source = authStore.countries.length > 0 ? authStore.countries : FALLBACK_COUNTRIES;
  return source
    .filter((c) => SUPPORTED_COUNTRIES.has(c.country_code))
    .map((c) => {
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

const loading = computed(() => authStore.loading);
const error = computed(() => authStore.error);

async function onSubmit() {
  const credentials = {
    pin: form.pin,
    rememberMe: rememberMe.value,
    phone: form.phone,
    country_code: form.country_code,
  };

  const success = await authStore.login(credentials);

  if (success) {
    // Load user profile to check onboarding status
    await authStore.loadUserProfile();

    // Check if user needs to complete onboarding
    if (authStore.needsOnboarding) {
      router.push('/auth/role');
    } else {
      // Redirect to intended page or home
      const redirect = route.query.redirect as string;
      router.push(redirect || '/');
    }
  }
}
</script>

<style lang="scss" scoped>
.language-bar {
  display: flex;
  justify-content: flex-end;
}

.language-select {
  max-width: 200px;
  :deep(.q-field__control) {
    padding: 0 8px;
    min-height: 32px;
  }
  :deep(.q-field__native) {
    font-size: 0.85rem;
    padding: 2px 0;
  }
}

.submit-btn {
  font-size: 1.05rem;
  letter-spacing: 0.025em;
  padding-top: 14px;
  padding-bottom: 14px;
  border-radius: $radius-loose;
}
</style>
