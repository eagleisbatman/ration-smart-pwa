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
        behavior="menu"
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
      <!-- Section: Credentials -->
      <div class="form-section">
        <div class="text-caption text-grey-7 text-uppercase text-weight-medium q-mb-sm q-px-xs">
          {{ $t('auth.sectionCredentials') }}
        </div>
        <div class="q-gutter-sm">
          <!-- Email Input -->
          <q-input
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
                :aria-label="showPin ? $t('auth.hidePin', 'Hide PIN') : $t('auth.showPin', 'Show PIN')"
                role="button"
                tabindex="0"
                @click="showPin = !showPin"
                @keydown.enter="showPin = !showPin"
                @keydown.space.prevent="showPin = !showPin"
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
import { ref, reactive, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { availableLocales, setLocale } from 'src/boot/i18n';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const showPin = ref(false);
const rememberMe = ref(false);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const form = reactive({
  email: '',
  pin: '',
});

// Language selection
const selectedLanguage = ref(localStorage.getItem('locale') || 'en');

const languageOptions = computed(() => availableLocales);

function switchLanguage(code: string) {
  setLocale(code);
}

const loading = computed(() => authStore.loading);
const error = computed(() => authStore.error);

async function onSubmit() {
  const success = await authStore.login({
    email: form.email,
    pin: form.pin,
    rememberMe: rememberMe.value,
  });

  if (success) {
    await authStore.loadUserProfile();

    // Redirect to intended page or home (validate to prevent open redirect)
    const redirect = route.query.redirect as string;
    const safeRedirect =
      redirect &&
      redirect.startsWith('/') &&
      !redirect.startsWith('//') &&
      !redirect.startsWith('/\\')
        ? redirect
        : '/';
    router.push(safeRedirect);
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
