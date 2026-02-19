<template>
  <q-page padding>
    <div class="text-h6 q-mb-md">{{ $t('admin.dashboard') }}</div>

    <!-- Admin level badge -->
    <q-chip dense outline class="q-mb-lg">
      <q-icon name="verified_user" size="16px" class="q-mr-xs" />
      {{ adminLevelLabel }}
    </q-chip>

    <!-- Quick action cards -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm-4">
        <q-card flat bordered class="cursor-pointer" @click="router.push('/admin/users')">
          <q-card-section>
            <div class="row items-center no-wrap">
              <q-icon name="group" size="32px" color="primary" class="q-mr-md" />
              <div>
                <div class="text-subtitle1 text-weight-medium">{{ $t('admin.manageUsers') }}</div>
                <div class="text-caption text-grey-7">{{ $t('admin.setAdminLevel') }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div v-if="authStore.isCountryAdmin || authStore.isSuperAdmin" class="col-12 col-sm-4">
        <q-card flat bordered class="cursor-pointer" @click="router.push('/admin/orgs')">
          <q-card-section>
            <div class="row items-center no-wrap">
              <q-icon name="business" size="32px" color="primary" class="q-mr-md" />
              <div>
                <div class="text-subtitle1 text-weight-medium">{{ $t('admin.manageOrgs') }}</div>
                <div class="text-caption text-grey-7">{{ $t('admin.orgManagement') }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-4">
        <q-card flat bordered class="cursor-pointer" @click="router.push('/analytics')">
          <q-card-section>
            <div class="row items-center no-wrap">
              <q-icon name="insights" size="32px" color="primary" class="q-mr-md" />
              <div>
                <div class="text-subtitle1 text-weight-medium">{{ $t('admin.viewAnalytics') }}</div>
                <div class="text-caption text-grey-7">{{ $t('admin.analytics') }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const adminLevelLabel = computed(() => {
  switch (authStore.adminLevel) {
    case 'super_admin': return t('admin.superAdmin');
    case 'country_admin': return t('admin.countryAdmin');
    case 'org_admin': return t('admin.orgAdmin');
    default: return t('admin.user');
  }
});
</script>
