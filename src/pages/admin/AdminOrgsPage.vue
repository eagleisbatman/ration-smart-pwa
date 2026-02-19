<template>
  <q-page padding>
    <!-- Loading -->
    <div v-if="adminStore.loading" class="text-center q-pa-xl">
      <q-spinner color="primary" size="32px" />
    </div>

    <!-- Org list -->
    <template v-else>
      <q-list separator>
        <q-item
          v-for="org in adminStore.orgs"
          :key="org.id"
          clickable
          @click="router.push(`/admin/users?org=${org.id}`)"
        >
          <q-item-section avatar>
            <q-icon name="business" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ org.name }}</q-item-label>
            <q-item-label caption>{{ org.type || '—' }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" />
          </q-item-section>
        </q-item>
      </q-list>

      <div v-if="adminStore.orgs.length === 0" class="text-center text-grey-6 q-pa-xl">
        {{ $t('admin.noData') }}
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStore } from 'src/stores/admin';

const router = useRouter();
const adminStore = useAdminStore();

onMounted(() => {
  adminStore.fetchOrgs();
});
</script>
