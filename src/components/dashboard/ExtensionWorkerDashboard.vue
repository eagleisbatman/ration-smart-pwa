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
          { label: $t('dashboard.myFarmers'), value: 'managed', icon: 'groups' },
          { label: $t('dashboard.personal'), value: 'personal', icon: 'home' },
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
      <!-- Stat Cards -->
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-6">
          <q-card flat class="stat-card stat-card--primary">
            <q-card-section class="q-pa-md">
              <div class="stat-card__label">{{ $t('dashboard.farmersManaged') }}</div>
              <div class="stat-card__value">{{ farmerCount }}</div>
              <div class="stat-card__footer">
                <q-icon name="groups" size="14px" class="q-mr-xs" />
                {{ $t('dashboard.activeProfiles') }}
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6">
          <q-card flat class="stat-card stat-card--secondary">
            <q-card-section class="q-pa-md">
              <div class="stat-card__label">{{ $t('dashboard.totalCows') }}</div>
              <div class="stat-card__value">{{ totalCowCount }}</div>
              <div class="stat-card__footer">
                <q-icon name="pets" size="14px" class="q-mr-xs" />
                {{ $t('dashboard.acrossAllFarmers') }}
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="section-label">{{ $t('dashboard.quickActions') }}</div>
      <div class="action-row q-mb-lg">
        <button class="action-row__btn" @click="router.push('/farmers/new')">
          <q-icon name="person_add" />
          {{ $t('farmer.addFarmer') }}
        </button>
        <button class="action-row__btn" @click="router.push('/yields/new')">
          <q-icon name="add_chart" />
          {{ $t('dashboard.recordYield') }}
        </button>
        <button class="action-row__btn" @click="router.push({ name: 'farmer-import' })">
          <q-icon name="upload_file" />
          {{ $t('dashboard.importCSV') }}
        </button>
      </div>

      <!-- Farmers List -->
      <div class="row items-center q-mb-sm">
        <div class="text-subtitle1 text-weight-medium">{{ $t('farmer.managedFarmers') }}</div>
        <q-space />
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          :label="$t('dashboard.viewAll')"
          icon-right="chevron_right"
          @click="router.push('/farmers')"
        />
      </div>

      <template v-if="loading">
        <SkeletonList :count="3" />
      </template>
      <template v-else-if="farmers.length === 0">
        <q-card flat bordered class="empty-state-card">
          <q-card-section class="text-center q-py-xl">
            <div class="empty-state-icon q-mb-md">
              <q-icon name="groups" size="40px" color="grey-5" />
            </div>
            <div class="text-body1 text-weight-medium q-mb-xs">{{ $t('farmer.noFarmers') }}</div>
            <div class="text-body2 text-grey-6 q-mb-md">{{ $t('farmer.noFarmersDescription') }}</div>
            <q-btn
              :label="$t('farmer.addFarmer')"
              color="primary"
              unelevated
              no-caps
              icon="person_add"
              @click="router.push('/farmers/new')"
            />
          </q-card-section>
        </q-card>
      </template>
      <template v-else>
        <q-card flat bordered class="farmer-list-card">
          <q-list separator>
            <q-item
              v-for="farmer in farmers.slice(0, visibleFarmerCount)"
              :key="farmer.id"
              v-ripple
              clickable
              @click="selectFarmer(farmer)"
            >
              <q-item-section avatar>
                <q-avatar
                  :color="farmer.is_self_profile ? 'teal-2' : 'primary'"
                  :text-color="farmer.is_self_profile ? 'teal-9' : 'white'"
                  size="40px"
                >
                  <q-icon :name="farmer.is_self_profile ? 'person' : 'agriculture'" size="20px" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="row items-center">
                  <span class="text-weight-medium">{{ farmer.name }}</span>
                  <q-badge
                    v-if="farmer.is_self_profile"
                    color="teal-2"
                    text-color="teal-9"
                    class="q-ml-sm"
                    :label="$t('farmer.you')"
                  />
                </q-item-label>
                <q-item-label caption class="text-grey-6">
                  <q-icon name="location_on" size="12px" class="q-mr-xs" />{{ farmer.village || farmer.district || $t('profile.location') }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge outline color="grey-7" class="farmer-cattle-badge">
                  {{ farmer.total_cattle || 0 }} {{ $t('dashboard.cows') }}
                </q-badge>
              </q-item-section>
              <q-item-section side>
                <q-icon name="chevron_right" color="grey-5" size="20px" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
        <div v-if="farmers.length > visibleFarmerCount" class="text-center q-mt-sm">
          <q-btn
            flat
            dense
            no-caps
            color="primary"
            :label="$t('dashboard.showMore')"
            icon="expand_more"
            @click="visibleFarmerCount += FARMERS_PAGE_SIZE"
          />
        </div>
      </template>

      <!-- Milk Production -->
      <div class="section-label q-mt-lg">{{ $t('chart.milkProductionTrend') }}</div>
      <div class="q-mb-lg">
        <MilkProductionChart ref="chartRef" :height="180" />
      </div>

      <!-- Recent Activity -->
      <div class="section-label">{{ $t('dashboard.recentActivity') }}</div>
      <template v-if="activitiesLoading">
        <div class="text-center q-py-md">
          <q-spinner-dots size="32px" color="primary" />
        </div>
      </template>
      <template v-else-if="recentActivities.length === 0">
        <q-card flat bordered class="empty-state-card">
          <q-card-section class="text-center q-py-lg">
            <q-icon name="timeline" size="32px" color="grey-5" />
            <div class="text-caption text-grey-6 q-mt-xs">{{ $t('dashboard.noRecentActivity') }}</div>
          </q-card-section>
        </q-card>
      </template>
      <template v-else>
        <q-card flat bordered class="activity-list-card">
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
        </q-card>
      </template>
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
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/auth';
import { useFarmersStore } from 'src/stores/farmers';
import { useNotificationsStore, AppNotification } from 'src/stores/notifications';
import SkeletonList from 'src/components/ui/SkeletonList.vue';
import MilkProductionChart from 'src/components/dashboard/MilkProductionChart.vue';
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
const farmers = computed(() => farmersStore.managedFarmers);
const farmerCount = computed(() => farmersStore.activeFarmerCount);

// Total cattle across all managed farmers
const totalCowCount = computed(() =>
  farmers.value.reduce((sum, f) => sum + (f.total_cattle || 0), 0)
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
  // Load recent activity feed
  await loadRecentActivities();
  // M20: Generate notifications after data is loaded
  await notificationsStore.generateNotifications();
});

// Expose viewMode for parent component and refresh function
async function refresh() {
  await farmersStore.fetchFarmers();
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
    border-radius: $radius-default;
    overflow: hidden;
  }
}

/* shadcn-inspired stat cards */
.stat-card {
  border-radius: $radius-loose;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  &--primary {
    background: linear-gradient(to top, #fff, rgba($primary, 0.04));
  }

  &--secondary {
    background: linear-gradient(to top, #fff, rgba($secondary, 0.04));
  }
}

.stat-card__label {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.55);
  margin-bottom: 4px;
}

.stat-card__value {
  font-size: 1.75rem;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.stat-card--primary .stat-card__value {
  color: $primary;
}

.stat-card--secondary .stat-card__value {
  color: $secondary;
}

.stat-card__footer {
  font-size: 0.7rem;
  color: rgba(0, 0, 0, 0.45);
  margin-top: 8px;
  display: flex;
  align-items: center;
}

// Dark mode overrides for stat cards
:global(.body--dark) {
  .stat-card {
    border-color: rgba(255, 255, 255, 0.1);

    &--primary {
      background: linear-gradient(to top, var(--q-dark-page, #121212), rgba($primary, 0.15));
    }

    &--secondary {
      background: linear-gradient(to top, var(--q-dark-page, #121212), rgba($secondary, 0.15));
    }
  }

  .stat-card__label {
    color: rgba(255, 255, 255, 0.6);
  }

  .stat-card__footer {
    color: rgba(255, 255, 255, 0.45);
  }
}

/* Farmer & activity list cards */
.farmer-list-card,
.activity-list-card,
.empty-state-card {
  border-radius: $radius-loose;
  overflow: hidden;
}

.farmer-cattle-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 6px;
}

.empty-state-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-dialog;
  background: rgba(0, 0, 0, 0.04);
}
</style>
