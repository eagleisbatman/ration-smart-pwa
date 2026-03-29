<template>
  <q-page padding>
    <!-- Welcome header -->
    <div class="q-mb-lg">
      <div class="text-overline text-grey-7">{{ $t('admin.welcomeLabel', 'WELCOME') }}</div>
      <div class="text-h5 text-weight-bold">{{ authStore.user?.name || '' }}</div>
    </div>

    <!-- Error state -->
    <q-banner v-if="loadError" inline-actions class="bg-negative text-white q-mb-md" rounded>
      {{ $t('errors.loadFailed') }}
      <template #action>
        <q-btn flat :label="$t('common.retry')" @click="retryLoad" />
      </template>
    </q-banner>

    <!-- Admin cards grid (matches mobile app layout) -->
    <div class="row q-col-gutter-md q-mb-lg">
      <!-- User Management -->
      <div class="col-6">
        <q-card flat bordered class="cursor-pointer admin-card" v-ripple @click="router.push('/admin/users')">
          <q-card-section class="q-pa-lg">
            <q-avatar size="40px" color="primary" text-color="white" class="q-mb-lg">
              <q-icon name="group" size="20px" />
            </q-avatar>
            <div class="text-body1 text-weight-medium">{{ $t('admin.manageUsers') }}</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Feed Management -->
      <div class="col-6">
        <q-card flat bordered class="cursor-pointer admin-card" v-ripple @click="router.push('/admin/feeds')">
          <q-card-section class="q-pa-lg">
            <q-avatar size="40px" color="green-7" text-color="white" class="q-mb-lg">
              <q-icon name="restaurant" size="20px" />
            </q-avatar>
            <div class="text-body1 text-weight-medium">{{ $t('admin.feeds.title') }}</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Feedback Management -->
      <div class="col-6">
        <q-card flat bordered class="cursor-pointer admin-card" v-ripple @click="router.push('/admin/feedback')">
          <q-card-section class="q-pa-lg">
            <q-avatar size="40px" color="amber-8" text-color="white" class="q-mb-lg">
              <q-icon name="chat" size="20px" />
            </q-avatar>
            <div class="text-body1 text-weight-medium">{{ $t('admin.feedback.title') }}</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Bulk Upload & Export Feed -->
      <div class="col-6">
        <q-card flat bordered class="cursor-pointer admin-card" v-ripple @click="router.push('/admin/feeds')">
          <q-card-section class="q-pa-lg">
            <q-avatar size="40px" color="teal-7" text-color="white" class="q-mb-lg">
              <q-icon name="cloud_upload" size="20px" />
            </q-avatar>
            <div class="text-body1 text-weight-medium">{{ $t('admin.bulkUploadExport', 'Bulk Upload & Export Feed') }}</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Feed Reports -->
      <div class="col-6">
        <q-card flat bordered class="cursor-pointer admin-card" v-ripple @click="router.push('/admin/reports')">
          <q-card-section class="q-pa-lg">
            <q-avatar size="40px" color="blue-7" text-color="white" class="q-mb-lg">
              <q-icon name="description" size="20px" />
            </q-avatar>
            <div class="text-body1 text-weight-medium">{{ $t('admin.reports.title') }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { useAdminStore } from 'src/stores/admin';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const authStore = useAuthStore();
const adminStore = useAdminStore();
const { t } = useI18n();

const loadError = ref(false);

async function retryLoad() {
  loadError.value = false;
  try {
    await adminStore.fetchAllUsers(1, 1);
  } catch {
    loadError.value = true;
  }
}

onMounted(retryLoad);
</script>

<style lang="scss" scoped>
.admin-card {
  border-radius: 16px;
  min-height: 140px;
}
</style>
