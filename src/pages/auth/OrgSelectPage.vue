<template>
  <div class="org-select-page">
    <OnboardingProgress :current-step="3" />

    <div class="text-center q-mb-xl">
      <div class="text-h5 text-weight-medium q-mb-sm">{{ $t('onboarding.chooseOrganization') }}</div>
    </div>

    <!-- Search -->
    <q-input
      v-model="searchQuery"
      :placeholder="$t('common.search')"
      outlined
      dense
      class="q-mb-md"
    >
      <template #prepend>
        <q-icon name="search" />
      </template>
      <template v-if="searchQuery" #append>
        <q-icon name="close" class="cursor-pointer" @click="searchQuery = ''" />
      </template>
    </q-input>

    <!-- Loading -->
    <div v-if="loading" class="text-center q-py-xl">
      <q-spinner-dots color="primary" size="40px" />
      <div class="text-grey-6 q-mt-md">{{ $t('common.loading') }}</div>
    </div>

    <!-- Organization List -->
    <q-list v-else separator class="rounded-borders q-mb-md">
      <!-- Not affiliated option -->
      <q-item
        v-ripple
        clickable
        :active="selectedOrgId === null"
        active-class="bg-primary-1"
        @click="selectOrganization(null)"
      >
        <q-item-section avatar>
          <q-avatar color="grey-3" text-color="grey-7" icon="person" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">{{ $t('common.notAffiliated') }}</q-item-label>
          <q-item-label caption>{{ $t('roles.farmerDesc') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon
            :name="selectedOrgId === null ? 'check_circle' : 'radio_button_unchecked'"
            :color="selectedOrgId === null ? 'primary' : 'grey-5'"
            size="24px"
          />
        </q-item-section>
      </q-item>

      <!-- Organizations filtered by country -->
      <q-item
        v-for="org in filteredOrganizations"
        :key="org.id"
        v-ripple
        clickable
        :active="selectedOrgId === org.id"
        active-class="bg-primary-1"
        @click="selectOrganization(org.id)"
      >
        <q-item-section avatar>
          <q-avatar :color="getOrgTypeColor(org.type)" text-color="white" :icon="getOrgTypeIcon(org.type)" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">{{ org.name }}</q-item-label>
          <q-item-label caption>{{ formatOrgType(org.type) }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon
            :name="selectedOrgId === org.id ? 'check_circle' : 'radio_button_unchecked'"
            :color="selectedOrgId === org.id ? 'primary' : 'grey-5'"
            size="24px"
          />
        </q-item-section>
      </q-item>
    </q-list>

    <!-- No results -->
    <div v-if="!loading && filteredOrganizations.length === 0 && searchQuery" class="text-center text-grey-6 q-py-lg">
      {{ $t('common.noResults') }}
    </div>

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
          :label="$t('common.next')"
          color="primary"
          class="full-width"
          size="lg"
          unelevated
          @click="proceed"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from 'src/boot/axios';
import { getOnboardingItem, setOnboardingItem, removeOnboardingItem } from 'src/lib/onboarding-storage';
import OnboardingProgress from 'src/components/ui/OnboardingProgress.vue';

interface Organization {
  id: string;
  name: string;
  type: string;
  country_id: string;
}

const router = useRouter();
const { t } = useI18n();

const loading = ref(false);
const organizations = ref<Organization[]>([]);
// Restore previous selection when navigating back
const selectedOrgId = ref<string | null>(getOnboardingItem('onboarding_org_id'));
const searchQuery = ref('');

// Get country from session or default to India
const countryCode = getOnboardingItem('selected_country') || 'IN';

const filteredOrganizations = computed(() => {
  if (!searchQuery.value) {
    return organizations.value;
  }
  const query = searchQuery.value.toLowerCase();
  return organizations.value.filter(
    (org) =>
      org.name.toLowerCase().includes(query) ||
      org.type.toLowerCase().includes(query)
  );
});

function selectOrganization(orgId: string | null) {
  selectedOrgId.value = orgId;
}

function getOrgTypeColor(type: string): string {
  const colors: Record<string, string> = {
    university: 'blue-7',
    government: 'green-7',
    ngo: 'orange-7',
    cooperative: 'purple-7',
    research: 'teal-7',
  };
  return colors[type] || 'grey-7';
}

function getOrgTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    university: 'school',
    government: 'account_balance',
    ngo: 'volunteer_activism',
    cooperative: 'groups',
    research: 'biotech',
  };
  return icons[type] || 'business';
}

function formatOrgType(type: string): string {
  const key = `settings.orgTypes.${type}`;
  const translated = t(key);
  return translated === key ? type : translated;
}

async function fetchOrganizations() {
  loading.value = true;
  try {
    // Get country ID from country code
    const countriesRes = await api.get('/api/v1/countries');
    const country = countriesRes.data.find((c: { country_code: string }) => c.country_code === countryCode);

    if (country) {
      const orgsRes = await api.get(`/api/v1/organizations?country_id=${country.id}`);
      organizations.value = orgsRes.data;
    }
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    // Continue with empty list - not affiliated is always available
  } finally {
    loading.value = false;
  }
}

function proceed() {
  // Store the selected organization
  if (selectedOrgId.value) {
    setOnboardingItem('onboarding_org_id', selectedOrgId.value);
  } else {
    removeOnboardingItem('onboarding_org_id');
  }
  router.push('/auth/profile-setup');
}

onMounted(() => {
  fetchOrganizations();
});
</script>

<style lang="scss" scoped>
.bg-primary-1 {
  background-color: rgba(46, 125, 50, 0.08);
}
</style>
