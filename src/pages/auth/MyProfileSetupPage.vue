<template>
  <div class="profile-setup-page">
    <OnboardingProgress :current-step="4" />

    <div class="text-center q-mb-xl">
      <div class="text-h5 text-weight-medium q-mb-sm">{{ $t('onboarding.createProfile') }}</div>
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
        :label="`${$t('profile.phoneNumber')} ${$t('common.optionalSuffix')}`"
        :hint="$t('profile.phoneHintSetup')"
        type="tel"
        outlined
        :mask="phoneMask"
      >
        <template #prepend>
          <q-icon name="phone" />
        </template>
      </q-input>

      <!-- Location Section -->
      <div class="location-section q-mt-md">
        <div class="text-subtitle2 q-mb-sm">{{ $t('profile.location') }} <span class="text-grey-6 text-weight-regular">{{ $t('common.optionalSuffix') }}</span></div>

        <!-- Location prompt: shown when location not yet fetched and not entering manually -->
        <div v-if="!locationFetched && !showManualEntry" class="location-prompt q-mb-md">
          <div class="text-body2 text-grey-7 q-mb-md">
            {{ $t('profile.locationHelperText') }}
          </div>

          <!-- Share My Location Button -->
          <q-btn
            :label="locationLoading ? $t('profile.gettingLocation') : $t('profile.shareLocation')"
            :loading="locationLoading"
            color="primary"
            outline
            class="full-width q-mb-sm"
            icon="my_location"
            @click="getLocation"
          />

          <!-- Enter Manually link -->
          <div class="text-center q-mt-sm">
            <q-btn
              flat
              dense
              no-caps
              color="grey-7"
              :label="$t('profile.enterManually')"
              icon="edit_location_alt"
              @click="showManualEntry = true"
            />
          </div>
        </div>

        <!-- Manual entry fields -->
        <div v-if="showManualEntry && !locationFetched" class="manual-entry q-mb-md">
          <q-input
            v-model="form.level_6"
            :label="$t('profile.village')"
            outlined
            dense
            class="q-mb-sm"
          />
          <q-input
            v-model="form.level_3"
            :label="$t('profile.district')"
            outlined
            dense
            class="q-mb-sm"
          />
          <q-input
            v-model="form.level_2"
            :label="$t('profile.state')"
            outlined
            dense
            class="q-mb-sm"
          />
          <div class="text-center q-mt-xs">
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              :label="$t('profile.shareLocation')"
              icon="my_location"
              @click="showManualEntry = false"
            />
          </div>
        </div>

        <!-- Location Display -->
        <div v-if="locationFetched" class="location-display q-pa-md bg-grey-2 rounded-borders q-mb-md">
          <div class="row items-center q-mb-sm">
            <q-icon name="check_circle" color="positive" size="sm" class="q-mr-sm" />
            <span class="text-positive text-weight-medium">{{ $t('profile.locationCaptured') }}</span>
            <q-space />
            <q-btn
              flat
              dense
              size="sm"
              icon="refresh"
              :label="$t('profile.refresh')"
              @click="getLocation"
            />
          </div>

          <!-- Show formatted address -->
          <div v-if="formattedAddress" class="text-body2 q-mb-sm">
            <q-icon name="place" size="xs" class="q-mr-xs" />
            {{ formattedAddress }}
          </div>

          <!-- Show admin levels if available -->
          <div v-if="hasAdminLevels" class="admin-levels q-mt-sm">
            <div v-for="(level, index) in adminLevelDisplay" :key="index" class="text-caption text-grey-7">
              {{ level.label }}: {{ level.value }}
            </div>
          </div>

          <!-- Coordinates (small text) -->
          <div class="text-caption text-grey-6 q-mt-sm">
            {{ form.latitude?.toFixed(6) }}, {{ form.longitude?.toFixed(6) }}
          </div>
        </div>

        <!-- Location Error -->
        <q-banner v-if="locationError" dense class="bg-warning text-dark q-mb-md" rounded>
          <template #avatar>
            <q-icon name="warning" />
          </template>
          {{ locationError }}
          <template #action>
            <q-btn flat dense :label="$t('common.retry')" @click="getLocation" />
          </template>
        </q-banner>

      </div>

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
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import { api } from 'src/boot/axios';
import { useI18n } from 'vue-i18n';
import { getOnboardingItem, clearOnboardingData } from 'src/lib/onboarding-storage';
import { COUNTRY_PHONE_MASKS } from 'src/services/api-adapter';
import OnboardingProgress from 'src/components/ui/OnboardingProgress.vue';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();
const { t } = useI18n();

const loading = ref(false);
const locationLoading = ref(false);
const locationFetched = ref(false);
const showManualEntry = ref(false);
const locationError = ref<string | null>(null);
const formattedAddress = ref<string | null>(null);
const error = ref<string | null>(null);

// Phone mask based on the country selected during registration
const onboardingCountry = getOnboardingItem('selected_country') || 'IN';
const phoneMask = COUNTRY_PHONE_MASKS[onboardingCountry] || COUNTRY_PHONE_MASKS['OTHER'];

const form = reactive({
  name: '',
  phone: '',
  latitude: null as number | null,
  longitude: null as number | null,
  level_1: '', // Country
  level_2: '', // State/Region
  level_3: '', // District/Zone
  level_4: '', // Taluka/Woreda
  level_5: '', // Block/Kebele
  level_6: '', // Village/Locality
});

// Computed: check if we have admin levels
const hasAdminLevels = computed(() => {
  return form.level_2 || form.level_3 || form.level_6;
});

// Computed: display admin levels with labels
const adminLevelDisplay = computed(() => {
  const levels = [];
  if (form.level_2) levels.push({ label: t('profile.state'), value: form.level_2 });
  if (form.level_3) levels.push({ label: t('profile.district'), value: form.level_3 });
  if (form.level_4) levels.push({ label: t('profile.subdistrict'), value: form.level_4 });
  if (form.level_5) levels.push({ label: t('profile.block'), value: form.level_5 });
  if (form.level_6) levels.push({ label: t('profile.village'), value: form.level_6 });
  return levels;
});

// Gather all onboarding data from session
function getOnboardingData() {
  return {
    language: getOnboardingItem('onboarding_language') || 'en',
    role: getOnboardingItem('onboarding_role') || 'farmer',
    organizationId: getOnboardingItem('onboarding_org_id') || null,
    countryCode: getOnboardingItem('selected_country') || 'IN',
  };
}

// Get user's current location
async function getLocation() {
  locationLoading.value = true;
  locationError.value = null;

  try {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      locationError.value = t('profile.geolocationNotSupported');
      return;
    }

    // Get current position
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      });
    });

    form.latitude = position.coords.latitude;
    form.longitude = position.coords.longitude;

    // Reverse geocode to get address
    await reverseGeocode(position.coords.latitude, position.coords.longitude);

    locationFetched.value = true;
  } catch (err) {
    console.error('Geolocation error:', err);
    if (err instanceof GeolocationPositionError) {
      switch (err.code) {
        case err.PERMISSION_DENIED:
          locationError.value = t('profile.locationPermissionDenied');
          break;
        case err.POSITION_UNAVAILABLE:
          locationError.value = t('profile.locationUnavailable');
          break;
        case err.TIMEOUT:
          locationError.value = t('profile.locationTimeout');
          break;
        default:
          locationError.value = t('profile.locationError');
      }
    } else {
      locationError.value = t('profile.locationError');
    }
  } finally {
    locationLoading.value = false;
  }
}

// Reverse geocode coordinates to address using OpenStreetMap Nominatim
async function reverseGeocode(lat: number, lon: number) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=en`,
      {
        headers: {
          'User-Agent': 'RationSmart/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();

    if (data && data.address) {
      const addr = data.address;

      // Map OSM address components to our level system
      // level_1 = Country
      form.level_1 = addr.country || '';

      // level_2 = State/Region (India: state, Ethiopia: region, Vietnam: province)
      form.level_2 = addr.state || addr.region || addr.province || '';

      // level_3 = District/Zone (India: district, Ethiopia: zone)
      form.level_3 = addr.county || addr.state_district || addr.district || '';

      // level_4 = Taluka/Woreda/Subdistrict
      form.level_4 = addr.municipality || addr.city_district || '';

      // level_5 = Block/Kebele
      form.level_5 = addr.suburb || addr.neighbourhood || '';

      // level_6 = Village/Locality
      form.level_6 = addr.village || addr.hamlet || addr.town || addr.city || '';

      // Build formatted address
      const parts = [form.level_6, form.level_3, form.level_2, form.level_1].filter(Boolean);
      formattedAddress.value = parts.join(', ');
    }
  } catch (err) {
    console.error('Reverse geocoding error:', err);
    // Don't show error - location was captured, just couldn't get address
    formattedAddress.value = null;
  }
}

async function onSubmit() {
  loading.value = true;
  error.value = null;

  try {
    const onboardingData = getOnboardingData();
    const userId = authStore.userId;

    if (!userId) {
      error.value = t('onboarding.userSessionNotFound');
      return;
    }

    // 1. Update user settings (role, language, organization)
    // Backend expects settings as query parameters, not request body
    const settingsParams = new URLSearchParams();
    if (onboardingData.role) settingsParams.append('user_role', onboardingData.role);
    if (onboardingData.language) settingsParams.append('language_code', onboardingData.language);
    if (onboardingData.organizationId) settingsParams.append('organization_id', onboardingData.organizationId);
    const settingsQuery = settingsParams.toString();
    await api.put(`/api/v1/users/${userId}/settings${settingsQuery ? '?' + settingsQuery : ''}`);

    // 2. Create self-profile with new location fields
    await api.post(`/api/v1/users/${userId}/self-profile`, {
      name: form.name,
      phone: form.phone || null,
      latitude: form.latitude,
      longitude: form.longitude,
      level_1: form.level_1 || null,
      level_2: form.level_2 || null,
      level_3: form.level_3 || null,
      level_4: form.level_4 || null,
      level_5: form.level_5 || null,
      level_6: form.level_6 || null,
      // Also send legacy fields for backward compatibility
      village: form.level_6 || null,
      district: form.level_3 || null,
      state: form.level_2 || null,
    });

    // 3. Reload user profile to get updated data
    await authStore.loadUserProfile();

    // 4. Clear onboarding data from localStorage
    clearOnboardingData();

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
    error.value = t('onboarding.profileCreationFailed');
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
  /* Layout container handles max-width and centering */
}

.location-section {
  border: 1px solid $grey-4;
  border-radius: 8px;
  padding: 16px;
}

.location-display {
  border: 1px solid $positive;
}

.admin-levels {
  border-left: 2px solid $grey-4;
  padding-left: 8px;
}
</style>
