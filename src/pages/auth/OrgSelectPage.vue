<template>
  <div class="org-select-page">
    <div class="text-center q-mb-xl">
      <div class="text-h5 text-weight-medium q-mb-sm">{{ $t('onboarding.chooseOrganization') }}</div>
      <div class="text-body2 text-grey-7">{{ $t('onboarding.step3of4') }}</div>
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
          <q-avatar :color="getOrgTypeColor(org.type)" text-color="white">
            {{ org.name.charAt(0).toUpperCase() }}
          </q-avatar>
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
import { api } from 'src/boot/axios';

interface Organization {
  id: string;
  name: string;
  type: string;
  country_id: string;
}

const router = useRouter();

const loading = ref(false);
const organizations = ref<Organization[]>([]);
const selectedOrgId = ref<string | null>(null);
const searchQuery = ref('');

// Get country from session or default to India
const countryCode = sessionStorage.getItem('selected_country') || 'IN';

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

function formatOrgType(type: string): string {
  const labels: Record<string, string> = {
    university: 'University',
    government: 'Government',
    ngo: 'NGO',
    cooperative: 'Cooperative',
    research: 'Research Institute',
  };
  return labels[type] || type;
}

async function fetchOrganizations() {
  loading.value = true;
  try {
    // Get country ID from country code
    const countriesRes = await api.get('/api/v1/countries');
    const country = countriesRes.data.find((c: { code: string }) => c.code === countryCode);

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
    sessionStorage.setItem('onboarding_org_id', selectedOrgId.value);
  } else {
    sessionStorage.removeItem('onboarding_org_id');
  }
  router.push('/auth/profile-setup');
}

onMounted(() => {
  fetchOrganizations();
});
</script>

<style lang="scss" scoped>
.org-select-page {
  padding: 16px;
  max-width: 500px;
  margin: 0 auto;
}

.bg-primary-1 {
  background-color: rgba(46, 125, 50, 0.08);
}
</style>
