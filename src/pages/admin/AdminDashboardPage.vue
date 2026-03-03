<template>
  <q-page padding>
    <!-- Welcome header with role badge -->
    <div class="row items-center justify-between q-mb-lg">
      <div>
        <div class="text-h6 text-weight-medium">
          {{ $t('dashboard.welcome', { name: authStore.user?.name || '' }) }}
        </div>
        <div class="text-caption text-grey-6">{{ $t('admin.managingSystem') }}</div>
      </div>
      <q-chip dense outline>
        <q-icon name="verified_user" size="16px" class="q-mr-xs" />
        {{ adminLevelLabel }}
      </q-chip>
    </div>

    <!-- Error state -->
    <q-banner v-if="loadError" inline-actions class="bg-negative text-white q-mb-md" rounded>
      {{ $t('errors.loadFailed') }}
      <template #action>
        <q-btn flat :label="$t('common.retry')" @click="retryLoad" />
      </template>
    </q-banner>

    <!-- Quick action cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="cursor-pointer" @click="router.push('/admin/users')">
          <q-card-section>
            <div class="row items-center no-wrap">
              <q-icon name="group" size="32px" color="primary" class="q-mr-md" />
              <div>
                <div class="text-subtitle1 text-weight-medium">{{ $t('admin.manageUsers') }}</div>
                <div class="text-caption text-grey-7">
                  <template v-if="loading">
                    <q-spinner size="12px" class="q-mr-xs" />
                  </template>
                  <template v-else-if="userCount > 0">{{ userCount }} {{ $t('admin.users') }}</template>
                  <template v-else>{{ $t('admin.setAdminLevel') }}</template>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Orgs and Analytics cards removed — routes not available in app-lite -->
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { useAdminStore } from 'src/stores/admin';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const authStore = useAuthStore();
const adminStore = useAdminStore();
const { t } = useI18n();

const userCount = ref(0);
const loadError = ref(false);
const loading = ref(true);

const adminLevelLabel = computed(() => {
  switch (authStore.adminLevel) {
    case 'super_admin': return t('admin.superAdmin');
    case 'country_admin': return t('admin.countryAdmin');
    case 'org_admin': return t('admin.orgAdmin');
    default: return t('admin.user');
  }
});

async function retryLoad() {
  loadError.value = false;
  loading.value = true;
  try {
    const usersResult = await adminStore.fetchAllUsers(1, 1);
    userCount.value = usersResult.total;
  } catch {
    loadError.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(retryLoad);
</script>
