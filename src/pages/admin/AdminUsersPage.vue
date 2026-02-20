<template>
  <q-page padding>
    <!-- Search -->
    <q-input
      v-model="search"
      dense
      outlined
      :placeholder="$t('common.search')"
      class="q-mb-md"
      clearable
      @update:model-value="debouncedFetch"
    >
      <template #prepend>
        <q-icon name="search" />
      </template>
    </q-input>

    <!-- Loading -->
    <div v-if="adminStore.loading" class="text-center q-pa-xl">
      <q-spinner color="primary" size="32px" />
    </div>

    <!-- User list -->
    <template v-else>
      <q-list separator>
        <q-item v-for="u in adminStore.users" :key="u.id" class="q-py-sm">
          <q-item-section>
            <q-item-label>{{ u.name }}</q-item-label>
            <q-item-label caption>
              <q-icon v-if="!u.email && u.phone_number" name="phone" size="12px" class="q-mr-xs" />
              {{ u.email || u.phone_number || '—' }}
              <span v-if="u.user_role" class="q-ml-sm">· {{ formatRole(u.user_role) }}</span>
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-select
              :model-value="u.admin_level"
              :options="availableLevels"
              dense
              outlined
              emit-value
              map-options
              style="min-width: 140px"
              @update:model-value="(val: string) => onLevelChange(u, val)"
            />
          </q-item-section>
        </q-item>
      </q-list>

      <div v-if="adminStore.users.length === 0" class="text-center text-grey-6 q-pa-xl">
        {{ $t('admin.noData') }}
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useAdminStore, type AdminUser } from 'src/stores/admin';
import { useAuthStore } from 'src/stores/auth';
import { useI18n } from 'vue-i18n';

const $q = useQuasar();
const adminStore = useAdminStore();
const authStore = useAuthStore();
const { t } = useI18n();

const search = ref('');
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const availableLevels = computed(() => {
  const levels = [
    { label: t('admin.user'), value: 'user' },
  ];
  // Only show levels below the caller's own rank
  if (authStore.isSuperAdmin) {
    levels.push(
      { label: t('admin.orgAdmin'), value: 'org_admin' },
      { label: t('admin.countryAdmin'), value: 'country_admin' },
      { label: t('admin.superAdmin'), value: 'super_admin', disable: true },
    );
  } else if (authStore.isCountryAdmin) {
    levels.push(
      { label: t('admin.orgAdmin'), value: 'org_admin' },
    );
  }
  return levels;
});

function formatRole(role: string | null): string {
  if (!role) return '';
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function debouncedFetch() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchUsers(), 400);
}

async function fetchUsers() {
  if (authStore.isOrgAdmin && authStore.user?.organization_id) {
    await adminStore.fetchOrgUsers(authStore.user.organization_id);
  } else {
    await adminStore.fetchAllUsers(1, 50, search.value || undefined);
  }
}

async function onLevelChange(user: AdminUser, newLevel: string) {
  if (newLevel === user.admin_level) return; // No change

  $q.dialog({
    title: t('admin.setAdminLevel'),
    message: t('admin.confirmLevelChange', { name: user.name, level: newLevel }),
    ok: { label: t('common.confirm'), color: 'primary', flat: true },
    cancel: { label: t('common.cancel'), flat: true },
  }).onOk(async () => {
    const success = await adminStore.setAdminLevel(user.id, newLevel);
    if (success) {
      // Update local state only after API success
      user.admin_level = newLevel;
      $q.notify({ type: 'positive', message: t('admin.levelUpdated') });
    } else {
      $q.notify({ type: 'negative', message: t('admin.levelUpdateFailed') });
    }
  });
  // onCancel: no action needed — :model-value is read-only, store unchanged
}

onMounted(fetchUsers);
</script>
