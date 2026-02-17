<template>
  <div class="register-page">
    <!-- Language Selector (always visible at top) -->
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
        @update:model-value="switchLanguage"
      >
        <template #prepend>
          <q-icon name="translate" size="xs" class="q-mr-xs" />
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
      <!-- Section 1: Account -->
      <div class="form-section">
        <div class="text-caption text-grey-7 text-uppercase text-weight-medium q-mb-sm q-px-xs">
          {{ $t('auth.sectionAccount') }}
        </div>
        <div class="q-gutter-sm">
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

          <!-- Country Selection -->
          <q-select
            v-model="form.country_code"
            :label="$t('profile.country')"
            outlined
            :options="countryOptions"
            emit-value
            map-options
            :loading="authStore.countriesLoading"
            :disable="authStore.countriesLoading"
            :rules="[(val) => !!val || $t('validation.required')]"
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

          <!-- Phone Input with dial code -->
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

      <!-- Section 2: Security -->
      <div class="form-section">
        <div class="text-caption text-grey-7 text-uppercase text-weight-medium q-mb-sm q-px-xs">
          {{ $t('auth.sectionSecurity') }}
        </div>
        <div class="q-gutter-sm">
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

          <!-- PIN Strength Indicator -->
          <div v-if="form.pin.length >= 4" class="pin-strength-indicator q-mt-xs q-mb-sm">
            <q-linear-progress
              :value="pinStrength.value"
              :color="pinStrength.color"
              size="6px"
              rounded
              class="q-mb-xs"
            />
            <div class="text-caption" :class="`text-${pinStrength.color}`">
              {{ pinStrength.label }}
            </div>
          </div>

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
        :label="$t('auth.createAccount')"
        type="submit"
        color="primary"
        class="full-width q-mt-lg submit-btn"
        size="xl"
        unelevated
        no-caps
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
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/auth';
import { setOnboardingItem } from 'src/lib/onboarding-storage';
import { getDialCode, getPhoneMask, FALLBACK_COUNTRIES, SUPPORTED_COUNTRY_CODES, COUNTRY_LANGUAGE_MAP } from 'src/services/api-adapter';
import { useGeoCountry } from 'src/composables/useGeoCountry';
import { availableLocales, setLocale } from 'src/boot/i18n';

const flagUrl = (code: string) => `/flags/${(code || 'xx').toLowerCase()}.svg`;

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const { detectedCountry } = useGeoCountry();

const showPin = ref(false);

// Prefer saved country from a previous login/registration over geo-detection
const savedCountry = localStorage.getItem('last_country_code');

const form = reactive({
  name: '',
  phone: '',
  country_code: savedCountry || detectedCountry.value,
  pin: '',
  confirmPin: '',
});

// Update country when geo-detection resolves, but only if no saved preference
watch(detectedCountry, (code) => {
  if (!savedCountry && (form.country_code === 'IN' || !form.phone)) {
    form.country_code = code;
  }
});

// Language selection
const selectedLanguage = ref(localStorage.getItem('locale') || 'en');

const languageOptions = computed(() => {
  const codes = COUNTRY_LANGUAGE_MAP[form.country_code] || ['en'];
  const recommended = codes
    .map(code => availableLocales.find(l => l.value === code))
    .filter(Boolean) as typeof availableLocales;
  // If current locale isn't in recommended, add it so user can see it
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
    .filter((c) => SUPPORTED_COUNTRY_CODES.has(c.country_code))
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

// PIN strength evaluation
const pinStrength = computed(() => {
  const pin = form.pin;
  if (pin.length < 4) {
    return { value: 0, color: 'grey', label: '' };
  }

  // Common weak PINs
  const commonPins = [
    '1234', '4321', '0000', '1111', '2222', '3333', '4444',
    '5555', '6666', '7777', '8888', '9999', '1212', '1010',
    '2580', '0852', '1357', '2468', '9876', '6789', '0123',
    '3210', '7890', '0987',
  ];

  if (commonPins.includes(pin)) {
    return { value: 0.33, color: 'red', label: t('validation.pinStrengthWeak') };
  }

  // Check if all digits are the same (e.g., 1111)
  if (/^(\d)\1{3}$/.test(pin)) {
    return { value: 0.33, color: 'red', label: t('validation.pinStrengthWeak') };
  }

  // Check ascending or descending sequence (e.g., 1234, 4321)
  const digits = pin.split('').map(Number);
  const isAscending = digits.every((d, i) => i === 0 || d === digits[i - 1] + 1);
  const isDescending = digits.every((d, i) => i === 0 || d === digits[i - 1] - 1);
  if (isAscending || isDescending) {
    return { value: 0.33, color: 'red', label: t('validation.pinStrengthWeak') };
  }

  // Check for partial patterns: two pairs (e.g., 1122) or mirrored (e.g., 1221)
  const hasTwoPairs = pin[0] === pin[1] && pin[2] === pin[3];
  const isMirrored = pin[0] === pin[3] && pin[1] === pin[2];
  const hasThreeRepeated = /(\d)\1{2}/.test(pin);
  if (hasTwoPairs || isMirrored || hasThreeRepeated) {
    return { value: 0.66, color: 'orange', label: t('validation.pinStrengthModerate') };
  }

  // Check for only 2 unique digits (e.g., 1213)
  const uniqueDigits = new Set(digits).size;
  if (uniqueDigits <= 2) {
    return { value: 0.66, color: 'orange', label: t('validation.pinStrengthModerate') };
  }

  // Strong: no obvious pattern
  return { value: 1, color: 'green', label: t('validation.pinStrengthStrong') };
});

async function onSubmit() {
  const data = {
    name: form.name,
    pin: form.pin,
    country_code: form.country_code,
    phone: form.phone,
  };

  const success = await authStore.register(data);

  if (success) {
    // Store country and language for onboarding flow
    setOnboardingItem('selected_country', form.country_code);
    setOnboardingItem('onboarding_language', selectedLanguage.value);
    // Skip language step — already selected during registration
    router.push('/auth/role');
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

.pin-strength-indicator {
  margin-top: -8px;
  padding: 0 12px;
}

.submit-btn {
  font-size: 1.05rem;
  letter-spacing: 0.025em;
  padding-top: 14px;
  padding-bottom: 14px;
  border-radius: $radius-loose;
}
</style>
