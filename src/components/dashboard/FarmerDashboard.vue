<template>
  <div class="farmer-dashboard">
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

    <!-- Error Banners -->
    <template v-for="err in storeErrors" :key="err.key">
      <q-banner
        class="q-mb-sm bg-negative text-white rounded-borders"
        dense
      >
        <template #avatar>
          <q-icon name="error" color="white" />
        </template>
        {{ err.message }}
        <template #action>
          <q-btn
            flat
            dense
            :label="$t('common.retry')"
            color="white"
            @click="err.retry"
          />
          <q-btn
            flat
            dense
            :label="$t('dashboard.dismiss')"
            color="white"
            @click="err.dismiss"
          />
        </template>
      </q-banner>
    </template>

    <!-- L6: Weather Widget -->
    <WeatherWidget />

    <!-- M19: Onboarding Welcome Card for first-time users -->
    <q-card
      v-if="showOnboardingTips"
      flat
      bordered
      class="q-mb-lg onboarding-card"
    >
      <q-card-section>
        <div class="text-subtitle1 q-mb-sm">{{ $t('dashboard.onboardingWelcome') }}</div>
        <q-list dense>
          <q-item>
            <q-item-section avatar>
              <q-avatar size="36px" color="orange-1">
                <img src="/icons/cow.svg" alt="" width="20" height="20" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('dashboard.onboardingStep1') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar>
              <q-avatar size="36px" color="blue-1">
                <q-icon name="water_drop" size="20px" color="blue-6" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('dashboard.onboardingStep2') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar>
              <q-avatar size="36px" color="green-1">
                <q-icon name="restaurant_menu" size="20px" color="green-7" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('dashboard.onboardingStep3') }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <div class="text-right q-mt-sm">
          <q-btn
            :label="$t('dashboard.onboardingDismiss')"
            color="primary"
            flat
            dense
            no-caps
            @click="dismissOnboardingTips"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- M20: Notifications Section -->
    <div v-if="notifications.length > 0" class="q-mb-lg">
      <div class="row items-center justify-between q-mb-sm">
        <div class="text-subtitle2 text-grey-7">
          {{ $t('notifications.title') }}
          <q-badge v-if="unreadCount > 0" color="negative" :label="unreadCount" class="q-ml-xs" />
        </div>
        <q-btn
          v-if="unreadCount > 0"
          flat
          dense
          size="sm"
          :label="$t('notifications.markAllRead')"
          @click="notificationsStore.markAllAsRead()"
        />
      </div>
      <q-list bordered class="rounded-borders">
        <q-item
          v-for="notif in visibleNotifications"
          :key="notif.id"
          :class="{ 'bg-blue-1': !notif.read }"
          clickable
          @click="handleNotificationClick(notif)"
        >
          <q-item-section avatar>
            <q-icon
              :name="notif.icon"
              :color="notificationColor(notif.type)"
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
      <div v-if="notifications.length > 3" class="text-center q-mt-xs">
        <q-btn
          flat
          dense
          size="sm"
          color="primary"
          :label="showAllNotifications ? $t('dashboard.showMore') : $t('notifications.showAll')"
          @click="showAllNotifications = !showAllNotifications"
        />
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col-6">
        <q-card flat bordered class="stat-card">
          <q-card-section>
            <div class="text-h4 text-primary">{{ cowCount }}</div>
            <div class="text-caption text-grey-7">{{ $t('dashboard.activeCows') }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-6">
        <q-card flat bordered class="stat-card">
          <q-card-section>
            <div class="text-h4 text-secondary">{{ todayMilk.toFixed(1) }}{{ $t('units.l') }}</div>
            <div class="text-caption text-grey-7">{{ $t('dashboard.todaysMilk') }}</div>
            <div v-if="milkTrend" class="trend-indicator q-mt-xs">
              <q-icon
                :name="milkTrend.icon"
                :color="milkTrend.color"
                size="14px"
              />
              <span
                class="text-caption q-ml-xs"
                :class="`text-${milkTrend.color}`"
              >{{ milkTrend.percentText }}</span>
              <span class="text-caption text-grey-6 q-ml-xs">{{ $t('dashboard.trend.vsYesterday') }}</span>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- No Cows Empty State -->
    <q-card v-if="cowCount === 0 && !cowsStore.loading" flat bordered class="q-mb-lg empty-state-card">
      <q-card-section class="text-center q-py-lg empty-state-cow">
        <q-avatar size="64px" color="orange-1" class="q-mb-sm">
          <img :src="COW_ICON.replace('img:', '')" alt="" width="32" height="32" />
        </q-avatar>
        <div class="text-subtitle2 q-mt-sm">{{ $t('dashboard.noCowsYet') }}</div>
        <div class="text-body2 text-grey-7 q-mt-xs">{{ $t('dashboard.noCowsYetEncouraging') }}</div>
        <q-btn
          :label="$t('dashboard.addCow')"
          color="accent"
          unelevated
          rounded
          class="q-mt-md"
          icon="add"
          @click="router.push({ name: 'cow-new' })"
        />
      </q-card-section>
    </q-card>

    <!-- Milk Production Chart -->
    <div class="q-mb-lg">
      <MilkProductionChart ref="chartRef" :height="180" />
    </div>

    <!-- Quick Actions -->
    <div class="text-subtitle1 q-mb-sm">{{ $t('dashboard.quickActions') }}</div>
    <div class="row q-col-gutter-sm q-mb-lg">
      <div class="col-4">
        <q-btn
          color="primary"
          class="full-width action-btn quick-action"
          unelevated
          stack
          @click="router.push({ name: 'log-new' })"
        >
          <q-icon name="water_drop" size="24px" class="q-mb-xs action-icon" />
          <span class="text-caption">{{ $t('logs.logMilk') }}</span>
        </q-btn>
      </div>
      <div class="col-4">
        <q-btn
          color="secondary"
          class="full-width action-btn quick-action"
          unelevated
          stack
          @click="router.push({ name: 'diet-new' })"
        >
          <q-icon name="restaurant" size="24px" class="q-mb-xs action-icon" />
          <span class="text-caption">{{ $t('diet.getDiet') }}</span>
        </q-btn>
      </div>
      <div class="col-4">
        <q-btn
          color="accent"
          class="full-width action-btn quick-action"
          unelevated
          stack
          @click="router.push({ name: 'cow-new' })"
        >
          <q-icon name="add" size="24px" class="q-mb-xs action-icon" />
          <span class="text-caption">{{ $t('cow.addCow') }}</span>
        </q-btn>
      </div>
    </div>

    <!-- Today's Logs -->
    <div class="text-subtitle1 q-mb-sm">{{ $t('dashboard.todaysLogs') }}</div>
    <template v-if="loadingLogs">
      <SkeletonList :count="3" />
    </template>
    <template v-else-if="todayLogs.length === 0">
      <q-card flat bordered class="q-mb-lg empty-state-card">
        <q-card-section class="text-center q-py-lg empty-state-milk">
          <q-avatar size="64px" color="blue-1" class="q-mb-sm">
            <q-icon name="water_drop" size="32px" color="blue-6" />
          </q-avatar>
          <div class="text-subtitle2 q-mt-sm">{{ $t('dashboard.noLogsToday') }}</div>
          <div class="text-body2 text-grey-7 q-mt-xs">{{ $t('dashboard.noLogsTodayEncouraging') }}</div>
          <q-btn
            :label="$t('dashboard.logNow')"
            color="primary"
            unelevated
            rounded
            class="q-mt-md"
            icon="water_drop"
            @click="router.push({ name: 'log-new' })"
          />
        </q-card-section>
      </q-card>
    </template>
    <template v-else>
      <q-list bordered separator class="rounded-borders q-mb-lg">
        <q-item v-for="log in todayLogs" :key="log.id" v-ripple clickable>
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white">
              <q-icon :name="COW_ICON" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ log.cow_name || $t('logs.labels.unknownCow') }}</q-item-label>
            <q-item-label caption>
              <span v-if="log.morning_liters">{{ $t('logs.labels.morningLabel') }}: {{ log.morning_liters }}{{ $t('units.l') }}</span>
              <span v-if="log.evening_liters" class="q-ml-sm">{{ $t('logs.labels.eveningLabel') }}: {{ log.evening_liters }}{{ $t('units.l') }}</span>
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-item-label class="text-h6 text-primary">{{ log.total_liters }}{{ $t('units.l') }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </template>

    <!-- Recent Diet Plans -->
    <div class="text-subtitle1 q-mb-sm">{{ $t('dashboard.recentDiets') }}</div>
    <template v-if="loadingDiets">
      <SkeletonCard />
    </template>
    <template v-else-if="recentDiets.length === 0">
      <q-card flat bordered class="empty-state-card">
        <q-card-section class="text-center q-py-lg empty-state-diet">
          <q-avatar size="64px" color="green-1" class="q-mb-sm">
            <q-icon name="restaurant_menu" size="32px" color="green-7" />
          </q-avatar>
          <div class="text-subtitle2 q-mt-sm">{{ $t('dashboard.noDietsYet') }}</div>
          <div class="text-body2 text-grey-7 q-mt-xs">{{ $t('dashboard.noDietsYetEncouraging') }}</div>
          <q-btn
            :label="$t('dashboard.createDiet')"
            color="secondary"
            unelevated
            rounded
            class="q-mt-md"
            icon="restaurant_menu"
            @click="router.push({ name: 'diet-new' })"
          />
        </q-card-section>
      </q-card>
    </template>
    <template v-else>
      <q-card
        v-for="diet in recentDiets.slice(0, 3)"
        :key="diet.id"
        flat
        bordered
        class="q-mb-sm"
        clickable
        @click="router.push({ name: 'diet-detail', params: { id: diet.id } })"
      >
        <q-card-section>
          <div class="row items-center">
            <div class="col">
              <div class="text-subtitle2">{{ diet.cow_name || $t('diet.generalDiet') }}</div>
              <div class="text-caption text-grey-7">
                {{ formatDate(diet.created_at) }}
              </div>
            </div>
            <div class="col-auto">
              <q-chip
                :color="diet.status === 'completed' ? 'positive' : 'warning'"
                text-color="white"
                size="sm"
              >
                {{ $t(`diet.statusLabel.${diet.status}`) }}
              </q-chip>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { format } from 'date-fns';
import { useAuthStore } from 'src/stores/auth';
import { useCowsStore } from 'src/stores/cows';
import { useMilkLogsStore } from 'src/stores/milkLogs';
import { useDietsStore } from 'src/stores/diets';
import { useNotificationsStore, AppNotification } from 'src/stores/notifications';
import SkeletonList from 'src/components/ui/SkeletonList.vue';
import SkeletonCard from 'src/components/ui/SkeletonCard.vue';
import MilkProductionChart from 'src/components/dashboard/MilkProductionChart.vue';
import WeatherWidget from 'src/components/dashboard/WeatherWidget.vue';
import { COW_ICON } from 'src/boot/icons';

const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();
const cowsStore = useCowsStore();
const milkLogsStore = useMilkLogsStore();
const dietsStore = useDietsStore();
const notificationsStore = useNotificationsStore();

const loadingLogs = ref(true);
const showAllNotifications = ref(false);
const loadingDiets = ref(true);
const chartRef = ref<InstanceType<typeof MilkProductionChart> | null>(null);
const dismissedErrors = ref<Set<string>>(new Set());
const onboardingTipsDismissed = ref(localStorage.getItem('onboarding_tips_dismissed') === 'true');

const showOnboardingTips = computed(() => {
  return cowCount.value === 0 && !cowsStore.loading && !onboardingTipsDismissed.value;
});

function dismissOnboardingTips(): void {
  onboardingTipsDismissed.value = true;
  localStorage.setItem('onboarding_tips_dismissed', 'true');
}

// M20: Notifications
const notifications = computed(() => notificationsStore.notifications);
const unreadCount = computed(() => notificationsStore.unreadCount);
const visibleNotifications = computed(() =>
  showAllNotifications.value
    ? notifications.value
    : notifications.value.slice(0, 3)
);

function notificationColor(type: string): string {
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

const storeErrors = computed(() => {
  const errors: Array<{ key: string; message: string; retry: () => void; dismiss: () => void }> = [];

  if (cowsStore.error && !dismissedErrors.value.has('cows')) {
    errors.push({
      key: 'cows',
      message: `${t('dashboard.errorLoadingCows')}: ${cowsStore.error}`,
      retry: () => {
        dismissedErrors.value.delete('cows');
        cowsStore.fetchCows();
      },
      dismiss: () => {
        cowsStore.error = null;
        dismissedErrors.value.add('cows');
      },
    });
  }

  if (milkLogsStore.error && !dismissedErrors.value.has('milkLogs')) {
    errors.push({
      key: 'milkLogs',
      message: `${t('dashboard.errorLoadingMilkLogs')}: ${milkLogsStore.error}`,
      retry: () => {
        dismissedErrors.value.delete('milkLogs');
        milkLogsStore.fetchLogs();
      },
      dismiss: () => {
        milkLogsStore.error = null;
        dismissedErrors.value.add('milkLogs');
      },
    });
  }

  if (dietsStore.error && !dismissedErrors.value.has('diets')) {
    errors.push({
      key: 'diets',
      message: `${t('dashboard.errorLoadingDiets')}: ${dietsStore.error}`,
      retry: () => {
        dismissedErrors.value.delete('diets');
        dietsStore.fetchDiets();
      },
      dismiss: () => {
        dietsStore.error = null;
        dismissedErrors.value.add('diets');
      },
    });
  }

  return errors;
});

const userName = computed(() => authStore.user?.name || t('roles.farmer'));
const cowCount = computed(() => cowsStore.cowCount);
const todayLogs = computed(() => milkLogsStore.todayLogs);
const todayMilk = computed(() => milkLogsStore.todayTotal);
const yesterdayMilk = computed(() => milkLogsStore.yesterdayTotal);
const recentDiets = computed(() => dietsStore.recentDiets);

const milkTrend = computed(() => {
  const today = todayMilk.value;
  const yesterday = yesterdayMilk.value;

  // Don't show trend if no yesterday data to compare against
  if (yesterday === 0) return null;

  const diff = today - yesterday;
  const pct = Math.round((diff / yesterday) * 100);

  if (pct > 0) {
    return { icon: 'trending_up', color: 'positive', percentText: `+${pct}%` };
  } else if (pct < 0) {
    return { icon: 'trending_down', color: 'negative', percentText: `${pct}%` };
  }
  return { icon: 'trending_flat', color: 'grey', percentText: '0%' };
});

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return t('dashboard.greetingMorning');
  if (hour < 17) return t('dashboard.greetingAfternoon');
  return t('dashboard.greetingEvening');
});

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy');
}

// Expose a refresh function for parent
async function refresh(): Promise<void> {
  await Promise.all([
    cowsStore.fetchCows(),
    milkLogsStore.fetchLogs(),
    dietsStore.fetchDiets(),
  ]);
  // Refresh the chart after data is loaded
  chartRef.value?.refresh();
  // M20: Regenerate notifications on refresh
  await notificationsStore.generateNotifications();
}

onMounted(async () => {
  await cowsStore.fetchCows();

  loadingLogs.value = true;
  await milkLogsStore.fetchLogs();
  loadingLogs.value = false;

  loadingDiets.value = true;
  await dietsStore.fetchDiets();
  loadingDiets.value = false;

  // M20: Generate notifications after all data is loaded
  await notificationsStore.generateNotifications();
});

defineExpose({ refresh });
</script>

<style lang="scss" scoped>
.farmer-dashboard {
  padding-top: env(safe-area-inset-top);
}

/* M15: Brand logo */
.brand-logo {
  flex-shrink: 0;
  border-radius: 6px;
}

.stat-card {
  border-radius: 12px;
  text-align: center;
}

.trend-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.action-btn {
  height: 80px;
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

/* M18: Improved empty states */
.empty-state-card {
  border-radius: 12px;
  border-style: dashed;
  border-color: rgba(0, 0, 0, 0.08);
}

.empty-state-cow {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.04) 0%, rgba(255, 183, 77, 0.08) 100%);
}

.empty-state-milk {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.04) 0%, rgba(100, 181, 246, 0.08) 100%);
}

.empty-state-diet {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.04) 0%, rgba(129, 199, 132, 0.08) 100%);
}

/* M19: Onboarding welcome card */
.onboarding-card {
  border-radius: 12px;
  border-color: $primary;
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.04) 0%, rgba(100, 181, 246, 0.08) 100%);
}
</style>
