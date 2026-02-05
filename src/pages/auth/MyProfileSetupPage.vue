<template>
  <div class="profile-setup-page">
    <div class="text-center q-mb-xl">
      <div class="text-h5 text-weight-medium q-mb-sm">{{ $t('onboarding.createProfile') }}</div>
      <div class="text-body2 text-grey-7">{{ $t('onboarding.step4of4') }}</div>
    </div>

    <q-form class="q-gutter-md" @submit="onSubmit">
      <!-- Full Name -->
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

      <!-- Phone -->
      <q-input
        v-model="form.phone"
        :label="$t('profile.phone')"
        type="tel"
        outlined
        mask="##########"
      >
        <template #prepend>
          <q-icon name="phone" />
        </template>
      </q-input>

      <!-- Village -->
      <q-input
        v-model="form.village"
        :label="$t('profile.village')"
        outlined
      >
        <template #prepend>
          <q-icon name="location_on" />
        </template>
      </q-input>

      <!-- District -->
      <q-input
        v-model="form.district"
        :label="$t('profile.district')"
        outlined
      >
        <template #prepend>
          <q-icon name="map" />
        </template>
      </q-input>

      <!-- State -->
      <q-input
        v-model="form.state"
        :label="$t('profile.state')"
        outlined
      >
        <template #prepend>
          <q-icon name="flag" />
        </template>
      </q-input>

      <!-- Error Message -->
      <q-banner v-if="error" dense class="bg-negative text-white q-mb-md" rounded>
        {{ error }}
      </q-banner>

      <div class="row q-mt-xl q-col-gutter-sm">
        <div class="col-4">
          <q-btn
            :label="$t('common.back')"
            flat
            color="grey-7"
            class="full-width"
            size="lg"
            @click="router.back()"
          />
        </div>
        <div class="col-8">
          <q-btn
            :label="$t('common.done')"
            type="submit"
            color="primary"
            class="full-width"
            size="lg"
            unelevated
            :loading="loading"
          />
        </div>
      </div>
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import { api } from 'src/boot/axios';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();
const { t } = useI18n();

const loading = ref(false);
const error = ref<string | null>(null);

const form = reactive({
  name: '',
  phone: '',
  village: '',
  district: '',
  state: '',
});

// Gather all onboarding data from session
function getOnboardingData() {
  return {
    language: sessionStorage.getItem('onboarding_language') || 'en',
    role: sessionStorage.getItem('onboarding_role') || 'farmer',
    organizationId: sessionStorage.getItem('onboarding_org_id') || null,
    countryCode: sessionStorage.getItem('selected_country') || 'IN',
  };
}

async function onSubmit() {
  loading.value = true;
  error.value = null;

  try {
    const onboardingData = getOnboardingData();
    const userId = authStore.userId;

    if (!userId) {
      error.value = 'User session not found. Please login again.';
      return;
    }

    // 1. Update user settings (role, language, organization)
    await api.put(`/api/v1/users/${userId}/settings`, {
      user_role: onboardingData.role,
      language_code: onboardingData.language,
      organization_id: onboardingData.organizationId,
    });

    // 2. Create self-profile (farmer profile for the user)
    await api.post(`/api/v1/users/${userId}/self-profile`, {
      name: form.name,
      phone: form.phone || null,
      village: form.village || null,
      district: form.district || null,
      state: form.state || null,
    });

    // 3. Reload user profile to get updated data
    await authStore.loadUserProfile();

    // 4. Clear onboarding session data
    sessionStorage.removeItem('onboarding_language');
    sessionStorage.removeItem('onboarding_role');
    sessionStorage.removeItem('onboarding_org_id');
    sessionStorage.removeItem('selected_country');

    // Show success message
    $q.notify({
      type: 'positive',
      message: t('onboarding.profileCreated'),
      position: 'bottom',
    });

    // Navigate to home
    router.replace('/');
  } catch (err) {
    console.error('Failed to complete profile setup:', err);
    error.value = 'Failed to create profile. Please try again.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  // Pre-fill name if available from registration
  if (authStore.user?.name) {
    form.name = authStore.user.name;
  }
});
</script>

<style lang="scss" scoped>
.profile-setup-page {
  padding: 16px;
  max-width: 500px;
  margin: 0 auto;
}
</style>
