<template>
  <div class="login-page">
    <q-form @submit="onSubmit">
      <!-- Section: Credentials -->
      <div class="form-section">
        <div class="text-caption text-grey-7 text-uppercase text-weight-medium q-mb-sm q-px-xs">
          {{ $t('auth.sectionCredentials') }}
        </div>
        <div class="q-gutter-sm">
          <!-- Login Method Toggle -->
          <q-btn-toggle
            v-model="loginMethod"
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
            class="login-method-toggle"
          />

          <!-- Email Input -->
          <q-input
            v-if="loginMethod === 'email'"
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

          <!-- Phone Input with Country Code -->
          <template v-else>
            <!-- Country Selection for Phone -->
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
          </template>
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
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/auth';
import { getDialCode, getPhoneMask, FALLBACK_COUNTRIES } from 'src/services/api-adapter';

const flagUrl = (code: string) => `/flags/${(code || 'xx').toLowerCase()}.svg`;

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const loginMethod = ref<'email' | 'phone'>('email');
const showPin = ref(false);
const rememberMe = ref(false);

const form = reactive({
  email: '',
  phone: '',
  pin: '',
  country_code: 'IN',
});

const countryOptions = computed(() => {
  const source = authStore.countries.length > 0 ? authStore.countries : FALLBACK_COUNTRIES;
  return source.map((c) => {
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

  // Pre-fill email from query param (e.g., after registration)
  const emailParam = route.query.email as string;
  if (emailParam) {
    form.email = emailParam;
    loginMethod.value = 'email';
  }
});

const loading = computed(() => authStore.loading);
const error = computed(() => authStore.error);

async function onSubmit() {
  const credentials = {
    pin: form.pin,
    rememberMe: rememberMe.value,
    ...(loginMethod.value === 'email'
      ? { email: form.email }
      : { phone: form.phone, country_code: form.country_code }),
  };

  const success = await authStore.login(credentials);

  if (success) {
    // Load user profile to check onboarding status
    await authStore.loadUserProfile();

    // Check if user needs to complete onboarding
    if (authStore.needsOnboarding) {
      router.push('/auth/language');
    } else {
      // Redirect to intended page or home
      const redirect = route.query.redirect as string;
      router.push(redirect || '/');
    }
  }
}
</script>

<style lang="scss" scoped>
.login-method-toggle :deep(.q-btn) {
  border: 1.5px solid $grey-4;
  transition: all 0.2s ease;
}

.login-method-toggle :deep(.q-btn.bg-primary) {
  border-color: var(--q-primary);
}

.submit-btn {
  font-size: 1.05rem;
  letter-spacing: 0.025em;
  padding-top: 14px;
  padding-bottom: 14px;
  border-radius: 12px;
}
</style>
