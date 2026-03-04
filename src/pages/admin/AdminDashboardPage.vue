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

    <!-- Simulation Stats Section (super admin only) -->
    <template v-if="authStore.adminLevel === 'super_admin' && simStats">
      <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ $t('admin.simStats.title') }}</div>
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-6 col-sm-3">
          <q-card flat bordered class="text-center q-pa-sm">
            <div class="text-h5 text-weight-bold text-primary">{{ simStats.total_simulations }}</div>
            <div class="text-caption text-grey-6">{{ $t('admin.simStats.total') }}</div>
          </q-card>
        </div>
        <div class="col-6 col-sm-3">
          <q-card flat bordered class="text-center q-pa-sm">
            <div class="text-h5 text-weight-bold text-positive">{{ simStats.success_rate }}%</div>
            <div class="text-caption text-grey-6">{{ $t('admin.simStats.successRate') }}</div>
          </q-card>
        </div>
        <div class="col-6 col-sm-3">
          <q-card flat bordered class="text-center q-pa-sm">
            <div class="text-h5 text-weight-bold">{{ simStats.by_type?.rec ?? 0 }}</div>
            <div class="text-caption text-grey-6">{{ $t('admin.simStats.recommendations') }}</div>
          </q-card>
        </div>
        <div class="col-6 col-sm-3">
          <q-card flat bordered class="text-center q-pa-sm">
            <div class="text-h5 text-weight-bold">{{ simStats.by_type?.eval ?? 0 }}</div>
            <div class="text-caption text-grey-6">{{ $t('admin.simStats.evaluations') }}</div>
          </q-card>
        </div>
      </div>

      <!-- Country breakdown (collapsible) -->
      <q-expansion-item
        v-if="simStats.by_country && simStats.by_country.length > 0"
        :label="$t('admin.simStats.countryBreakdown')"
        icon="public"
        dense
        class="q-mb-lg"
        header-class="text-subtitle2"
      >
        <q-markup-table flat bordered dense class="q-mt-xs">
          <thead>
            <tr>
              <th class="text-left">{{ $t('admin.countryName') }}</th>
              <th class="text-right">{{ $t('admin.simStats.total') }}</th>
              <th class="text-right">{{ $t('admin.simStats.recommendations') }}</th>
              <th class="text-right">{{ $t('admin.simStats.evaluations') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in simStats.by_country" :key="c.country_code">
              <td>{{ c.country_name }}</td>
              <td class="text-right">{{ c.total }}</td>
              <td class="text-right">{{ c.recommendations }}</td>
              <td class="text-right">{{ c.evaluations }}</td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-expansion-item>
    </template>

    <!-- Quick action cards (grid of 5) -->
    <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ $t('admin.quickActions') }}</div>
    <div class="row q-col-gutter-md q-mb-lg">
      <!-- User Management -->
      <div class="col-6 col-sm-4">
        <q-card flat bordered class="cursor-pointer full-height" v-ripple @click="router.push('/admin/users')">
          <q-card-section class="text-center q-pa-md">
            <q-icon name="group" size="32px" color="primary" />
            <div class="text-body2 text-weight-medium q-mt-sm">{{ $t('admin.manageUsers') }}</div>
            <div v-if="userCount > 0" class="text-caption text-grey-6">{{ userCount }} {{ $t('admin.users') }}</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Feed Management -->
      <div class="col-6 col-sm-4">
        <q-card flat bordered class="cursor-pointer full-height" v-ripple @click="router.push('/admin/feeds')">
          <q-card-section class="text-center q-pa-md">
            <q-icon name="grass" size="32px" color="green-7" />
            <div class="text-body2 text-weight-medium q-mt-sm">{{ $t('admin.feeds.title') }}</div>
            <div class="text-caption text-grey-6">{{ $t('admin.feeds.subtitle') }}</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Feedback -->
      <div class="col-6 col-sm-4">
        <q-card flat bordered class="cursor-pointer full-height" v-ripple @click="router.push('/admin/feedback')">
          <q-card-section class="text-center q-pa-md">
            <q-icon name="feedback" size="32px" color="amber-8" />
            <div class="text-body2 text-weight-medium q-mt-sm">{{ $t('admin.feedback.title') }}</div>
            <div class="text-caption text-grey-6">{{ $t('admin.feedback.subtitle') }}</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Reports -->
      <div class="col-6 col-sm-4">
        <q-card flat bordered class="cursor-pointer full-height" v-ripple @click="router.push('/admin/reports')">
          <q-card-section class="text-center q-pa-md">
            <q-icon name="description" size="32px" color="blue-7" />
            <div class="text-body2 text-weight-medium q-mt-sm">{{ $t('admin.reports.title') }}</div>
            <div class="text-caption text-grey-6">{{ $t('admin.reports.subtitle') }}</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Simulation Stats (link for non-super admins, or quick ref) -->
      <div class="col-6 col-sm-4">
        <q-card flat bordered class="full-height" :class="authStore.adminLevel === 'super_admin' ? '' : 'bg-grey-2'">
          <q-card-section class="text-center q-pa-md">
            <q-icon name="analytics" size="32px" color="deep-purple-6" />
            <div class="text-body2 text-weight-medium q-mt-sm">{{ $t('admin.simStats.title') }}</div>
            <div v-if="simStats" class="text-caption text-grey-6">
              {{ simStats.total_simulations }} {{ $t('admin.simStats.total').toLowerCase() }}
            </div>
            <div v-else class="text-caption text-grey-6">{{ $t('admin.simStats.superOnly') }}</div>
          </q-card-section>
        </q-card>
      </div>
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

interface SimulationStats {
  total_simulations: number;
  success_rate: number;
  by_type?: { rec?: number; eval?: number };
  by_country?: Array<{
    country_code: string;
    country_name: string;
    total: number;
    recommendations: number;
    evaluations: number;
  }>;
}

const userCount = ref(0);
const loadError = ref(false);
const simStats = ref<SimulationStats | null>(null);

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
  try {
    const [usersResult, statsResult] = await Promise.all([
      adminStore.fetchAllUsers(1, 1),
      authStore.adminLevel === 'super_admin' ? adminStore.fetchSimulationStats() : null,
    ]);
    userCount.value = usersResult.total;
    simStats.value = statsResult as SimulationStats | null;
  } catch {
    loadError.value = true;
  }
}

onMounted(retryLoad);
</script>

<style lang="scss" scoped>
.full-height {
  height: 100%;
}
</style>
