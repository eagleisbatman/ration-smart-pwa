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
            <q-item-label caption class="text-capitalize">{{ org.type || '—' }}</q-item-label>
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
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStore } from 'src/stores/admin';

const router = useRouter();
const adminStore = useAdminStore();
const searchQuery = ref('');

const filteredOrgs = computed(() => {
  if (!searchQuery.value) return adminStore.orgs;
  const query = searchQuery.value.toLowerCase();
  return adminStore.orgs.filter(
    (org) =>
      org.name.toLowerCase().includes(query) ||
      (org.type && org.type.toLowerCase().includes(query)),
  );
});

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

onMounted(() => {
  adminStore.fetchOrgs();
});
</script>
