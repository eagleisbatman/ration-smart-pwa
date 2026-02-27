<template>
  <q-page padding>
    <!-- Search -->
    <q-input
      v-model="searchQuery"
      dense
      outlined
      :placeholder="$t('common.search')"
      class="q-mb-md"
      clearable
    >
      <template #prepend>
        <q-icon name="search" />
      </template>
    </q-input>

    <!-- Loading -->
    <div v-if="adminStore.loading" class="text-center q-pa-xl">
      <q-spinner color="primary" size="32px" />
    </div>

    <!-- Error -->
    <q-banner v-else-if="adminStore.error" class="bg-negative text-white q-mb-md" rounded>
      {{ adminStore.error }}
      <template #action>
        <q-btn flat label="Retry" @click="adminStore.fetchOrgs()" />
      </template>
    </q-banner>

    <!-- Org list -->
    <template v-else>
      <q-list separator>
        <q-item
          v-for="org in filteredOrgs"
          :key="org.id"
          clickable
          @click="router.push(`/admin/users?org=${org.id}`)"
        >
          <q-item-section avatar>
            <q-avatar :color="getOrgTypeColor(org.type)" text-color="white" size="40px">
              <q-icon :name="getOrgTypeIcon(org.type)" size="20px" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ org.name }}</q-item-label>
            <q-item-label caption>{{ orgTypeLabel(org.type) }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>
      </q-list>

      <div v-if="filteredOrgs.length === 0" class="text-center text-grey-6 q-pa-xl">
        {{ searchQuery ? $t('common.noResults') : $t('admin.noData') }}
      </div>
    </template>

    <!-- Create Org FAB -->
    <q-page-sticky v-if="canCreateOrg" position="bottom-right" :offset="[16, 16]">
      <q-btn fab icon="add" color="primary" @click="showCreateDialog = true" />
    </q-page-sticky>

    <!-- Create Org Dialog -->
    <q-dialog v-model="showCreateDialog" persistent>
      <q-card style="min-width: 320px; max-width: 480px; width: 100%">
        <q-card-section>
          <div class="text-h6">{{ $t('admin.createOrg') }}</div>
        </q-card-section>

        <q-card-section class="q-gutter-sm">
          <q-input
            v-model="newOrg.name"
            :label="$t('admin.orgName') + ' *'"
            outlined
            dense
            :rules="[v => !!v || $t('common.required')]"
          />
          <q-select
            v-model="newOrg.type"
            :label="$t('admin.orgType')"
            :options="orgTypeOptions"
            outlined
            dense
            emit-value
            map-options
            clearable
          />
          <q-input
            v-model="newOrg.contact_email"
            :label="$t('admin.email')"
            outlined
            dense
            type="email"
            :rules="[v => !v || /.+@.+\..+/.test(v) || $t('auth.invalidEmail')]"
          />
          <q-input
            v-model="newOrg.contact_phone"
            :label="$t('admin.phone')"
            outlined
            dense
            :rules="[v => !v || v.length <= 20 || $t('common.tooLong')]"
          />
          <q-input
            v-model="newOrg.description"
            :label="$t('admin.orgDescription')"
            outlined
            dense
            type="textarea"
            autogrow
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn :label="$t('common.cancel')" flat @click="resetCreateForm" />
          <q-btn
            :label="$t('common.save')"
            color="primary"
            flat
            :loading="creating"
            :disable="!newOrg.name"
            @click="createOrg"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAdminStore, type CreateOrgPayload } from 'src/stores/admin';
import { useAuthStore } from 'src/stores/auth';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const $q = useQuasar();
const adminStore = useAdminStore();
const authStore = useAuthStore();
const { t } = useI18n();

const searchQuery = ref('');
const showCreateDialog = ref(false);
const creating = ref(false);
const newOrg = ref({
  name: '',
  type: null as string | null,
  contact_email: '',
  contact_phone: '',
  description: '',
});

const canCreateOrg = computed(() => authStore.isAnyAdmin);

const orgTypeOptions = computed(() => [
  { label: t('admin.orgTypeUniversity'), value: 'university' },
  { label: t('admin.orgTypeGovernment'), value: 'government' },
  { label: t('admin.orgTypeNgo'), value: 'ngo' },
  { label: t('admin.orgTypeCooperative'), value: 'cooperative' },
  { label: t('admin.orgTypeResearch'), value: 'research' },
  { label: t('admin.orgTypeOther'), value: 'other' },
]);

const filteredOrgs = computed(() => {
  if (!searchQuery.value) return adminStore.orgs;
  const query = searchQuery.value.toLowerCase();
  return adminStore.orgs.filter(
    (org) =>
      org.name.toLowerCase().includes(query) ||
      (org.type && org.type.toLowerCase().includes(query)),
  );
});

function orgTypeLabel(type: string | null): string {
  if (!type) return '—';
  return orgTypeOptions.value.find((o) => o.value === type)?.label ?? type;
}

function getOrgTypeColor(type: string | null): string {
  const colors: Record<string, string> = {
    university: 'blue-7',
    government: 'green-7',
    ngo: 'orange-7',
    cooperative: 'purple-7',
    research: 'teal-7',
  };
  return (type && colors[type]) || 'grey-7';
}

function getOrgTypeIcon(type: string | null): string {
  const icons: Record<string, string> = {
    university: 'school',
    government: 'account_balance',
    ngo: 'volunteer_activism',
    cooperative: 'groups',
    research: 'biotech',
  };
  return (type && icons[type]) || 'business';
}

function resetCreateForm() {
  showCreateDialog.value = false;
  newOrg.value = { name: '', type: null, contact_email: '', contact_phone: '', description: '' };
}

async function createOrg() {
  creating.value = true;
  try {
    const payload: CreateOrgPayload = { name: newOrg.value.name };
    if (newOrg.value.type) payload.type = newOrg.value.type;
    if (newOrg.value.contact_email) payload.contact_email = newOrg.value.contact_email;
    if (newOrg.value.contact_phone) payload.contact_phone = newOrg.value.contact_phone;
    if (newOrg.value.description) payload.description = newOrg.value.description;
    // Backend enforces country_id for country/org admins; pass it as defense-in-depth
    if (authStore.user?.country_id) payload.country_id = authStore.user.country_id;

    const success = await adminStore.createOrg(payload);
    if (success) {
      $q.notify({ type: 'positive', message: t('admin.orgCreated') });
      resetCreateForm();
      await adminStore.fetchOrgs();
    } else {
      $q.notify({ type: 'negative', message: t('admin.orgCreateFailed') });
    }
  } catch (err) {
    console.error('[admin] createOrg error:', err);
    $q.notify({ type: 'negative', message: t('admin.orgCreateFailed') });
  } finally {
    creating.value = false;
  }
}

onMounted(() => {
  adminStore.fetchOrgs();
});
</script>
