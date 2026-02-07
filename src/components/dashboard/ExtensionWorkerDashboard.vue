<template>
  <div class="extension-worker-dashboard">
    <!-- View Toggle (Personal vs Managed) -->
    <div v-if="hasPersonalFarm" class="view-toggle q-mb-md">
      <q-btn-toggle
        v-model="viewMode"
        spread
        no-caps
        rounded
        unelevated
        toggle-color="primary"
        color="white"
        text-color="primary"
        :options="[
          { label: $t('dashboard.managedFarmers'), value: 'managed', icon: 'groups' },
          { label: $t('dashboard.myFarm'), value: 'personal', icon: 'home' },
        ]"
      />
    </div>

    <!-- Welcome Section -->
    <div class="welcome-section q-mb-lg">
      <div class="row items-center no-wrap q-mb-xs">
        <img
          src="/icons/cow.svg"
          alt="RationSmart"
          class="brand-logo q-mr-sm"
          width="32"
          height="32"
        />
        <div class="text-h5">{{ $t('dashboard.welcome', { name: userName }) }}</div>
      </div>
      <div class="text-body2 text-grey-7">{{ greeting }}</div>
    </div>

    <!-- L6: Weather Widget -->
    <WeatherWidget />

    <!-- M20: Notifications Section -->
    <div v-if="ewNotifications.length > 0" class="q-mb-lg">
      <div class="row items-center justify-between q-mb-sm">
        <div class="text-subtitle2 text-grey-7">
          {{ $t('notifications.title') }}
          <q-badge v-if="ewUnreadCount > 0" color="negative" :label="ewUnreadCount" class="q-ml-xs" />
        </div>
        <q-btn
          v-if="ewUnreadCount > 0"
          flat
          dense
          size="sm"
          :label="$t('notifications.markAllRead')"
          @click="notificationsStore.markAllAsRead()"
        />
      </div>
      <q-list bordered class="rounded-borders">
        <q-item
          v-for="notif in ewVisibleNotifications"
          :key="notif.id"
          :class="{ 'bg-blue-1': !notif.read }"
          clickable
          @click="handleNotificationClick(notif)"
        >
          <q-item-section avatar>
            <q-icon
              :name="notif.icon"
              :color="ewNotificationColor(notif.type)"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ $t(notif.title, notif.params || {}) }}</q-item-label>
            <q-item-label caption>{{ $t(notif.message, notif.params || {}) }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              flat
              round
              dense
              size="sm"
              icon="close"
              @click.stop="notificationsStore.dismissNotification(notif.id)"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- Managed Farmers View -->
    <template v-if="viewMode === 'managed'">
      <!-- Quick Stats -->
      <div class="row q-col-gutter-md q-mb-lg">
        <div class="col-4">
          <q-card flat bordered class="stat-card">
            <q-card-section class="q-pa-sm">
              <div class="text-h5 text-primary">{{ farmerCount }}</div>
              <div class="text-caption text-grey-7">{{ $t('dashboard.farmersManaged') }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-4">
          <q-card flat bordered class="stat-card">
            <q-card-section class="q-pa-sm">
              <div class="text-h5 text-secondary">{{ totalCows }}</div>
              <div class="text-caption text-grey-7">{{ $t('dashboard.totalCows') }}</div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-4">
          <q-card flat bordered class="stat-card">
            <q-card-section class="q-pa-sm">
              <div class="text-h5 text-accent">{{ totalMilk.toFixed(1) }}{{ $t('units.l') }}</div>
              <div class="text-caption text-grey-7">{{ $t('dashboard.todaysMilk') }}</div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="text-subtitle1 q-mb-sm">{{ $t('dashboard.quickActions') }}</div>
      <div class="row q-col-gutter-sm q-mb-lg">
        <div class="col-6">
          <q-btn
            color="primary"
            class="full-width action-btn quick-action"
            unelevated
            stack
            @click="router.push('/farmers')"
          >
            <q-icon name="groups" size="24px" class="q-mb-xs action-icon" />
            <span class="text-caption">{{ $t('dashboard.viewFarmers') }}</span>
          </q-btn>
        </div>
        <div class="col-6">
          <q-btn
            color="secondary"
            class="full-width action-btn quick-action"
            unelevated
            stack
            @click="router.push('/farmers/new')"
          >
            <q-icon name="person_add" size="24px" class="q-mb-xs action-icon" />
            <span class="text-caption">{{ $t('dashboard.addFarmer') }}</span>
          </q-btn>
        </div>
      </div>

      <!-- Farmers List -->
      <div class="row items-center q-mb-sm">
        <div class="text-subtitle1">{{ $t('farmer.managedFarmers') }}</div>
        <q-space />
        <q-btn
          flat
          dense
          color="primary"
          :label="$t('dashboard.viewAll')"
          @click="router.push('/farmers')"
        />
      </div>

      <template v-if="loading">
        <SkeletonList :count="3" />
      </template>
      <template v-else-if="farmers.length === 0">
        <q-card flat bordered>
          <q-card-section class="text-center q-py-lg">
            <q-icon name="groups" size="48px" color="grey-4" />
            <div class="text-body2 text-grey-7 q-mt-sm">{{ $t('farmer.noFarmers') }}</div>
            <q-btn
              :label="$t('farmer.addFarmer')"
              color="primary"
              flat
              class="q-mt-sm"
              @click="router.push('/farmers/new')"
            />
          </q-card-section>
        </q-card>
      </template>
      <template v-else>
        <q-list bordered separator class="rounded-borders">
          <q-item
            v-for="farmer in farmers.slice(0, visibleFarmerCount)"
            :key="farmer.id"
            v-ripple
            clickable
            @click="selectFarmer(farmer)"
          >
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white">
                <q-icon name="person" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ farmer.name }}</q-item-label>
              <q-item-label caption>
                {{ farmer.village || farmer.district || $t('profile.location') }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-chip size="sm" color="grey-3">
                {{ farmer.total_cattle || 0 }} {{ $t('dashboard.cows') }}
              </q-chip>
            </q-item-section>
            <q-item-section side>
              <q-icon name="chevron_right" color="grey-6" />
            </q-item-section>
          </q-item>
        </q-list>
        <div v-if="farmers.length > visibleFarmerCount" class="text-center q-mt-sm">
          <q-btn
            flat
            dense
            color="primary"
            :label="$t('dashboard.showMore')"
            icon="expand_more"
            @click="visibleFarmerCount += FARMERS_PAGE_SIZE"
          />
        </div>
      </template>

      <!-- Aggregate Milk Production Chart -->
      <div class="q-mt-lg q-mb-lg">
        <MilkProductionChart ref="chartRef" :height="180" />
      </div>

      <!-- Recent Activity Across All Farmers -->
      <div class="text-subtitle1 q-mb-sm">{{ $t('dashboard.recentActivity') }}</div>
      <q-card flat bordered>
        <template v-if="activitiesLoading">
          <q-card-section class="text-center q-py-md">
            <q-spinner-dots size="32px" color="primary" />
          </q-card-section>
        </template>
        <template v-else-if="recentActivities.length === 0">
          <q-card-section class="text-center q-py-md text-grey-6">
            <q-icon name="timeline" size="32px" />
            <div class="text-caption q-mt-xs">{{ $t('dashboard.noRecentActivity') }}</div>
            <div class="text-caption text-grey-5">{{ $t('dashboard.noRecentActivityHint') }}</div>
          </q-card-section>
        </template>
        <template v-else>
          <q-list separator>
            <q-item v-for="activity in recentActivities" :key="activity.id" dense>
              <q-item-section avatar>
                <q-avatar
                  :color="activity.color"
                  text-color="white"
                  size="32px"
                >
                  <q-icon v-if="activity.type !== 'cow'" :name="activity.icon" size="16px" />
                  <q-img v-else :src="activity.icon" width="16px" height="16px" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-body2">{{ activity.description }}</q-item-label>
                <q-item-label caption>{{ activity.relativeTime }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </template>
      </q-card>
    </template>

    <!-- Personal Farm View (when toggled) -->
    <template v-else>
      <slot name="personal-dashboard">
        <!-- This slot allows HomePage to render the regular farmer dashboard -->
      </slot>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/auth';
import { useFarmersStore, FarmerSummary } from 'src/stores/farmers';
import { useNotificationsStore, AppNotification } from 'src/stores/notifications';
import SkeletonList from 'src/components/ui/SkeletonList.vue';
import MilkProductionChart from 'src/components/dashboard/MilkProductionChart.vue';
import WeatherWidget from 'src/components/dashboard/WeatherWidget.vue';
import { useDateFormat } from 'src/composables/useDateFormat';
import { COW_ICON } from 'src/composables/useCowIcon';
import { db } from 'src/lib/offline/db';
import type { FarmerProfile, Cow, MilkLog } from 'src/lib/offline/db';

const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();
const farmersStore = useFarmersStore();
const notificationsStore = useNotificationsStore();
const { formatRelative } = useDateFormat();

// View toggle state
const viewMode = ref<'managed' | 'personal'>('managed');
const FARMERS_PAGE_SIZE = 5;
const visibleFarmerCount = ref(FARMERS_PAGE_SIZE);
const chartRef = ref<InstanceType<typeof MilkProductionChart> | null>(null);

// M20: Notifications
const ewNotifications = computed(() => notificationsStore.notifications);
const ewUnreadCount = computed(() => notificationsStore.unreadCount);
const ewVisibleNotifications = computed(() =>
  ewNotifications.value.slice(0, 3)
);

function ewNotificationColor(type: string): string {
  switch (type) {
    case 'reminder':
      return 'primary';
    case 'alert':
      return 'negative';
    case 'info':
      return 'info';
    default:
      return 'grey';
  }
}

function handleNotificationClick(notif: AppNotification): void {
  notificationsStore.markAsRead(notif.id);
  if (notif.action?.route) {
    router.push({ name: notif.action.route });
  }
}

// Computed properties
const userName = computed(() => authStore.user?.name || t('roles.extension_worker'));
const hasPersonalFarm = computed(() => !!authStore.selfFarmerProfileId);
const loading = computed(() => farmersStore.loading);
const farmers = computed(() => farmersStore.activeFarmers);
const farmerCount = computed(() => farmersStore.activeFarmerCount);

// Calculate total cows across all managed farmers
const totalCows = computed(() => {
  return farmers.value.reduce((sum, farmer) => sum + (farmer.total_cattle || 0), 0);
});

// Store farmer summaries for milk aggregation
const farmerSummaries = ref<Map<string, FarmerSummary>>(new Map());

// Calculate total milk from all farmers' cows using summaries
const totalMilk = computed(() => {
  let total = 0;
  for (const summary of farmerSummaries.value.values()) {
    total += summary.statistics?.total_daily_milk_production || 0;
  }
  return total;
});

// Fetch summaries for all farmers to get milk production data
async function fetchFarmerSummaries() {
  const summaryPromises = farmers.value.map(async (farmer) => {
    try {
      const summary = await farmersStore.getFarmerSummary(farmer.id);
      if (summary) {
        farmerSummaries.value.set(farmer.id, summary);
      }
    } catch (err) {
      console.warn(`Failed to fetch summary for farmer ${farmer.id}:`, err);
    }
  });
  await Promise.all(summaryPromises);
}

// Watch for changes in farmers list and refresh summaries
watch(
  () => farmers.value,
  async (newFarmers) => {
    if (newFarmers.length > 0) {
      await fetchFarmerSummaries();
    }
  },
  { immediate: false }
);

// --- Recent Activity Feed ---
interface Activity {
  id: string;
  type: 'milk_log' | 'diet' | 'cow';
  icon: string;
  color: string;
  description: string;
  relativeTime: string;
  timestamp: number;
}

const activitiesLoading = ref(false);
const recentActivities = ref<Activity[]>([]);

async function loadRecentActivities() {
  if (!authStore.userId) return;
  activitiesLoading.value = true;

  try {
    // Build a farmer name lookup from the loaded farmers list
    const farmerNameMap = new Map<string, string>();
    for (const farmer of farmers.value) {
      farmerNameMap.set(farmer.id, farmer.name);
    }

    // Load cows for the current user from IndexedDB to map cow_id -> farmer + cow name
    const allCows = await db.cows
      .where('user_id')
      .equals(authStore.userId)
      .filter((c: Cow) => !c._deleted)
      .toArray();

    const cowMap = new Map<string, { name: string; farmerName: string }>();
    for (const cow of allCows) {
      const farmerName = cow.farmer_profile_id
        ? farmerNameMap.get(cow.farmer_profile_id) || t('roles.farmer')
        : t('roles.farmer');
      cowMap.set(cow.id, { name: cow.name, farmerName });
    }

    const activities: Activity[] = [];

    // 1. Milk logs - get recent from IndexedDB
    const recentMilkLogs = await db.milkLogs
      .where('user_id')
      .equals(authStore.userId)
      .filter((log: MilkLog) => !log._deleted)
      .reverse()
      .sortBy('created_at');

    for (const log of recentMilkLogs.slice(0, 15)) {
      const cowInfo = cowMap.get(log.cow_id);
      const farmerName = cowInfo?.farmerName || t('roles.farmer');
      const cowName = log.cow_name || cowInfo?.name || t('cow.cow');

      activities.push({
        id: `milk_${log.id}`,
        type: 'milk_log',
        icon: 'water_drop',
        color: 'blue-6',
        description: t('dashboard.activityMilkLog', {
          farmer: farmerName,
          liters: log.total_liters.toFixed(1),
          cow: cowName,
        }),
        relativeTime: formatRelative(log.created_at),
        timestamp: new Date(log.created_at).getTime(),
      });
    }

    // 2. Diet plans - get recent from IndexedDB
    const recentDiets = await db.diets
      .where('user_id')
      .equals(authStore.userId)
      .reverse()
      .sortBy('created_at');

    for (const diet of recentDiets.slice(0, 15)) {
      const cowInfo = diet.cow_id ? cowMap.get(diet.cow_id) : null;
      const farmerName = cowInfo?.farmerName || t('roles.farmer');
      const cowName = diet.cow_name || cowInfo?.name || t('cow.cow');

      activities.push({
        id: `diet_${diet.id}`,
        type: 'diet',
        icon: 'restaurant_menu',
        color: 'green-6',
        description: t('dashboard.activityDietCreated', {
          farmer: farmerName,
          cow: cowName,
        }),
        relativeTime: formatRelative(diet.created_at),
        timestamp: new Date(diet.created_at).getTime(),
      });
    }

    // 3. Cow registrations - use created_at from cows
    const cowsByCreated = [...allCows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    for (const cow of cowsByCreated.slice(0, 15)) {
      const farmerName = cow.farmer_profile_id
        ? farmerNameMap.get(cow.farmer_profile_id) || t('roles.farmer')
        : t('roles.farmer');

      activities.push({
        id: `cow_${cow.id}`,
        type: 'cow',
        icon: COW_ICON,
        color: 'orange-6',
        description: t('dashboard.activityCowRegistered', {
          farmer: farmerName,
          cow: cow.name,
        }),
        relativeTime: formatRelative(cow.created_at),
        timestamp: new Date(cow.created_at).getTime(),
      });
    }

    // Sort all activities by timestamp descending, take top 10
    activities.sort((a, b) => b.timestamp - a.timestamp);
    recentActivities.value = activities.slice(0, 10);
  } catch (err) {
    console.warn('Failed to load recent activities:', err);
    recentActivities.value = [];
  } finally {
    activitiesLoading.value = false;
  }
}

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return t('dashboard.greetingMorning');
  if (hour < 17) return t('dashboard.greetingAfternoon');
  return t('dashboard.greetingEvening');
});

// Actions
function selectFarmer(farmer: FarmerProfile) {
  farmersStore.selectFarmer(farmer);
  router.push(`/farmers/${farmer.id}`);
}

// Load data on mount
onMounted(async () => {
  await farmersStore.fetchFarmers();
  // Fetch summaries for milk production data after farmers are loaded
  if (farmers.value.length > 0) {
    await fetchFarmerSummaries();
  }
  // Load recent activity feed
  await loadRecentActivities();
  // M20: Generate notifications after data is loaded
  await notificationsStore.generateNotifications();
});

// Expose viewMode for parent component and refresh function
async function refresh() {
  await farmersStore.fetchFarmers();
  if (farmers.value.length > 0) {
    await fetchFarmerSummaries();
  }
  chartRef.value?.refresh();
  await loadRecentActivities();
  // M20: Regenerate notifications on refresh
  await notificationsStore.generateNotifications();
}

defineExpose({ viewMode, refresh });
</script>

<style lang="scss" scoped>
.extension-worker-dashboard {
  padding-top: env(safe-area-inset-top);
}

/* M15: Brand logo */
.brand-logo {
  flex-shrink: 0;
  border-radius: 6px;
}

.view-toggle {
  .q-btn-toggle {
    border: 1px solid $primary;
    border-radius: 8px;
    overflow: hidden;
  }
}

.stat-card {
  border-radius: 12px;
  text-align: center;
}

.action-btn {
  height: 72px;
  border-radius: 12px;
}

/* L5: Quick action button animations */
.quick-action {
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: scale(0.96);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }

  .action-icon {
    transition: transform 0.2s ease;
  }

  &:hover .action-icon {
    transform: scale(1.18);
  }
}

/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .quick-action {
    transition: none;

    &:hover {
      transform: none;
      box-shadow: none;
    }

    &:active {
      transform: none;
      box-shadow: none;
    }

    .action-icon {
      transition: none;
    }

    &:hover .action-icon {
      transform: none;
    }
  }
}

.rounded-borders {
  border-radius: 12px;
  overflow: hidden;
}
</style>
