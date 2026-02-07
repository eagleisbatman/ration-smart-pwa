<template>
  <div class="register-page">
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

          <!-- Registration Method Toggle -->
          <q-btn-toggle
            v-model="registerMethod"
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
            class="register-method-toggle"
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
        </div>
      </div>

      <q-separator class="q-my-md" color="grey-3" />

      <!-- Section 2: Location -->
      <div class="form-section">
        <div class="text-caption text-grey-7 text-uppercase text-weight-medium q-mb-sm q-px-xs">
          {{ $t('auth.sectionLocation') }}
        </div>
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
      </div>

      <q-separator class="q-my-md" color="grey-3" />

      <!-- Section 3: Security -->
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
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/auth';
import { setOnboardingItem } from 'src/lib/onboarding-storage';

const { t } = useI18n();
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

/** Convert a 2-letter ISO country code to its flag emoji (regional indicator symbols). */
function countryCodeToFlag(code: string): string {
  return [...code.toUpperCase()]
    .map((ch) => String.fromCodePoint(0x1f1e6 + ch.charCodeAt(0) - 65))
    .join('');
}

const countryOptions = computed(() =>
  authStore.countries.map((c) => ({
    label: t(`countries.${c.country_code}`, c.name || c.country_code),
    value: c.country_code,
    flag: countryCodeToFlag(c.country_code),
  }))
);

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
    ...(registerMethod.value === 'email' ? { email: form.email } : { phone: form.phone }),
  };

  const success = await authStore.register(data);

  if (success) {
    // Store country for onboarding flow
    setOnboardingItem('selected_country', form.country_code);
    // Start onboarding flow
    router.push('/auth/language');
  }
}
</script>

<style lang="scss" scoped>
.register-method-toggle :deep(.q-btn) {
  border: 1.5px solid $grey-4;
  transition: all 0.2s ease;
}

.register-method-toggle :deep(.q-btn.bg-primary) {
  border-color: var(--q-primary);
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
  border-radius: 12px;
}
</style>
