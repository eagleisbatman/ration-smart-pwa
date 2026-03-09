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

    <!-- Error -->
    <q-banner v-else-if="adminStore.error" class="bg-negative text-white q-mb-md" rounded>
      {{ adminStore.error }}
      <template #action>
        <q-btn flat :label="$t('common.retry')" @click="fetchUsers" />
      </template>
    </q-banner>

    <!-- User list -->
    <template v-else>
      <q-list separator>
        <q-item v-for="u in adminStore.users" :key="u.id" class="q-py-sm">
          <q-item-section>
            <q-item-label>{{ u.name || u.email || '—' }}</q-item-label>
            <q-item-label v-if="u.name && u.email" caption>
              {{ u.email }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-toggle
              :model-value="u.is_active"
              :label="u.is_active ? $t('admin.active') : $t('admin.inactive')"
              color="primary"
              dense
              @update:model-value="(val: boolean) => onToggleStatus(u, val)"
            />
          </q-item-section>
        </q-item>
      </q-list>

      <div v-if="adminStore.users.length === 0" class="text-center text-grey-6 q-pa-xl">
        {{ $t('admin.noData') }}
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="row justify-center q-mt-md">
        <q-pagination
          v-model="page"
          :max="totalPages"
          direction-links
          boundary-links
          :max-pages="5"
          @update:model-value="fetchUsers"
        />
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useAdminStore, type AdminUser } from 'src/stores/admin';
import { useI18n } from 'vue-i18n';

const $q = useQuasar();
const adminStore = useAdminStore();
const { t } = useI18n();

const search = ref('');
const page = ref(1);
const totalUsers = ref(0);
const pageSize = 25;
const totalPages = computed(() => Math.max(1, Math.ceil(totalUsers.value / pageSize)));
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function debouncedFetch() {
  if (debounceTimer) clearTimeout(debounceTimer);
  page.value = 1;
  debounceTimer = setTimeout(() => fetchUsers(), 400);
}

async function fetchUsers() {
  const result = await adminStore.fetchAllUsers(page.value, pageSize, search.value || undefined);
  totalUsers.value = result.total;
}

async function onToggleStatus(user: AdminUser, enable: boolean) {
  const action = enable ? t('admin.enable') : t('admin.disable');
  $q.dialog({
    title: t('common.confirm'),
    message: t('admin.confirmToggleStatus', { name: user.name || user.email || user.id, action }),
    ok: { label: t('common.confirm'), color: 'primary', flat: true },
    cancel: { label: t('common.cancel'), flat: true },
  }).onOk(async () => {
    const success = await adminStore.toggleUserStatus(user.id, enable);
    if (success) {
      $q.notify({ type: 'positive', message: t('admin.statusUpdated') });
    } else {
      $q.notify({ type: 'negative', message: t('admin.statusUpdateFailed') });
    }
  });
}

onMounted(fetchUsers);

onUnmounted(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
});
</script>
