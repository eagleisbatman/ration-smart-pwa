<template>
  <div class="farmer-dashboard">
    <!-- Welcome Section (hidden when embedded inside ExtensionWorkerDashboard) -->
    <div v-if="!embedded" class="welcome-section q-mb-lg">
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
                <img src="/icons/cow.svg" alt="" style="width: 20px; height: 20px" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('dashboard.onboardingStep1') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar>
              <q-avatar size="36px" color="grey-2">
                <q-icon name="water_drop" size="20px" color="grey-8" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('dashboard.onboardingStep2') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section avatar>
              <q-avatar size="36px" color="grey-2">
                <q-icon name="menu_book" size="20px" color="grey-8" />
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

    <!-- Milk Price Nudge Banner -->
    <q-banner
      v-if="!settingsStore.milkPricePerLiter && cowCount > 0"
      class="q-mb-md bg-amber-1 rounded-borders milk-price-nudge"
      dense
    >
      <template #avatar>
        <q-icon name="paid" color="amber-9" />
      </template>
      <span class="text-amber-10">{{ $t('dashboard.milkPriceNudge') }}</span>
      <template #action>
        <q-btn
          flat
          dense
          no-caps
          color="amber-10"
          :label="$t('dashboard.setMilkPrice')"
          icon-right="chevron_right"
          @click="router.push({ name: 'settings' })"
        />
      </template>
    </q-banner>

    <!-- M20: Notifications Section (hidden when embedded, EW dashboard shows its own) -->
    <div v-if="!embedded && notifications.length > 0" class="q-mb-lg">
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
          :class="{ 'bg-grey-2': !notif.read }"
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
    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-4">
        <div class="stat-inline">
          <div class="text-h5 text-primary">{{ cowCount }}</div>
          <div class="text-caption text-grey-7">{{ $t('dashboard.activeCows') }}</div>
        </div>
      </div>
      <div class="col-4">
        <div class="stat-inline">
          <div class="text-h5 text-secondary">{{ todayMilk.toFixed(1) }}{{ $t('units.l') }}</div>
          <div class="text-caption text-grey-7">{{ $t('dashboard.todaysMilk') }}</div>
          <div v-if="milkTrend" class="trend-indicator q-mt-xs">
            <q-icon
              :name="milkTrend.icon"
              :color="milkTrend.color"
              size="12px"
            />
            <span
              class="text-caption q-ml-xs text-micro"
              :class="`text-${milkTrend.color}`"
            >{{ milkTrend.percentText }}</span>
          </div>
        </div>
      </div>
      <div class="col-4">
        <div class="stat-inline">
          <div class="text-h5 text-accent">{{ cowsOnDietCount }}</div>
          <div class="text-caption text-grey-7">{{ $t('dashboard.cowsOnDiet') }}</div>
        </div>
      </div>
    </div>

    <!-- No Cows Empty State -->
    <div v-if="cowCount === 0 && !cowsStore.loading" class="text-center q-py-lg q-mb-md">
      <q-avatar size="56px" color="orange-1" class="q-mb-sm">
        <img :src="COW_ICON.replace('img:', '')" alt="" width="28" height="28" />
      </q-avatar>
      <div class="text-subtitle2 q-mt-sm">{{ $t('dashboard.noCowsYet') }}</div>
      <div class="text-body2 text-grey-7 q-mt-xs">{{ $t('dashboard.noCowsYetEncouraging') }}</div>
      <q-btn
        :label="$t('dashboard.addCow')"
        color="accent"
        flat
        dense
        no-caps
        class="q-mt-sm"
        icon="add"
        @click="router.push({ name: 'cow-new' })"
      />
    </div>

    <!-- Milk Production -->
    <div class="section-label">{{ $t('chart.milkProductionTrend') }}</div>
    <div class="q-mb-lg">
      <MilkProductionChart ref="chartRef" :height="180" :cow-ids="selfCowIdsList" />
    </div>

    <!-- Quick Actions -->
    <div class="section-label">{{ $t('dashboard.quickActions') }}</div>
    <div class="action-row q-mb-md">
      <button v-if="cowCount > 0" class="action-row__btn" @click="router.push({ name: 'log-new' })">
        <q-icon name="water_drop" />
        {{ $t('logs.logMilk') }}
      </button>
      <button class="action-row__btn" @click="router.push({ name: 'diet-new' })">
        <q-icon name="menu_book" />
        {{ $t('diet.getDiet') }}
      </button>
      <button class="action-row__btn" @click="router.push({ name: 'cow-new' })">
        <q-icon name="add" />
        {{ $t('cow.addCow') }}
      </button>
    </div>

    <!-- Today's Logs (only show when at least one cow is on a diet) -->
    <template v-if="cowsOnDietCount > 0 || todayLogs.length > 0">
      <div class="section-label">{{ $t('dashboard.todaysLogs') }}</div>
      <template v-if="loadingLogs">
        <SkeletonList :count="3" />
      </template>
      <template v-else-if="todayLogs.length === 0">
        <div class="text-center q-py-lg q-mb-md">
          <q-icon name="water_drop" size="36px" color="grey-4" />
          <div class="text-body2 text-grey-7 q-mt-xs">{{ $t('dashboard.noLogsToday') }}</div>
          <q-btn
            :label="$t('dashboard.logNow')"
            color="primary"
            flat
            dense
            no-caps
            class="q-mt-sm"
            icon="water_drop"
            @click="router.push({ name: 'log-new' })"
          />
        </div>
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
            <q-item-label>
              {{ log.cow_name || $t('logs.labels.unknownCow') }}
              <q-badge v-if="getDietNameForLog(log)" color="info" class="q-ml-xs" dense>
                {{ getDietNameForLog(log) }}
              </q-badge>
            </q-item-label>
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
    </template>

    <!-- Recent Diet Plans -->
    <div class="section-label">{{ $t('dashboard.recentDiets') }}</div>
    <template v-if="loadingDiets">
      <SkeletonCard />
    </template>
    <template v-else-if="recentDiets.length === 0">
      <div class="text-center q-py-lg q-mb-md">
        <q-icon name="menu_book" size="36px" color="grey-4" />
        <div class="text-body2 text-grey-7 q-mt-xs">{{ $t('dashboard.noDietsYet') }}</div>
        <q-btn
          :label="$t('dashboard.createDiet')"
          color="secondary"
          flat
          dense
          no-caps
          class="q-mt-sm"
          icon="menu_book"
          @click="router.push({ name: 'diet-new' })"
        />
      </div>
    </template>
    <template v-else>
      <q-list bordered separator class="rounded-borders q-mb-md">
        <q-item
          v-for="diet in recentDiets.slice(0, 3)"
          :key="diet.id"
          v-ripple
          clickable
          @click="router.push({ name: 'diet-detail', params: { id: diet.id } })"
        >
          <q-item-section avatar>
            <q-icon name="menu_book" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ diet.cow_name || $t('diet.generalDiet') }}</q-item-label>
            <q-item-label caption>{{ formatDate(diet.created_at) }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-chip
              :color="diet.status === 'completed' ? 'positive' : 'warning'"
              text-color="white"
              size="sm"
              dense
            >
              {{ $t(`diet.statusLabel.${diet.status}`) }}
            </q-chip>
          </q-item-section>
        </q-item>
      </q-list>
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
import { useSettingsStore } from 'src/stores/settings';

const props = withDefaults(defineProps<{
  /** Hide greeting when embedded inside ExtensionWorkerDashboard */
  embedded?: boolean;
}>(), { embedded: false });
import { useNotificationsStore, AppNotification } from 'src/stores/notifications';
import SkeletonList from 'src/components/ui/SkeletonList.vue';
import SkeletonCard from 'src/components/ui/SkeletonCard.vue';
import MilkProductionChart from 'src/components/dashboard/MilkProductionChart.vue';
import { COW_ICON } from 'src/boot/icons';

const router = useRouter();
const { t } = useI18n();
const authStore = useAuthStore();
const cowsStore = useCowsStore();
const milkLogsStore = useMilkLogsStore();
const dietsStore = useDietsStore();
const notificationsStore = useNotificationsStore();
const settingsStore = useSettingsStore();

const loadingLogs = ref(true);
const showAllNotifications = ref(false);
const loadingDiets = ref(true);
const chartRef = ref<InstanceType<typeof MilkProductionChart> | null>(null);
const dismissedErrors = ref<Set<string>>(new Set());
const onboardingTipsDismissed = ref(localStorage.getItem('onboarding_tips_dismissed') === 'true');

const showOnboardingTips = computed(() => {
  // Don't show onboarding in the Personal tab of the EW dashboard
  if (props.embedded) return false;
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
      message: cowsStore.error,
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
      message: milkLogsStore.error,
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
      message: dietsStore.error,
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

// When embedded in EW dashboard's Personal tab, only show data for
// cows belonging to the self-profile (not all managed farmers' cows).
const selfCowIds = computed((): Set<string> | null => {
  if (!props.embedded) return null; // no filtering
  const selfFarmerId = authStore.selfFarmerProfileId;
  if (!selfFarmerId) return new Set(); // no self-profile → empty set → 0 cows
  return new Set(
    cowsStore.getCowsForFarmer(selfFarmerId)
      .filter((c) => c.is_active)
      .map((c) => c.id)
  );
});

// Array form of selfCowIds for passing as a prop to MilkProductionChart
const selfCowIdsList = computed((): string[] | undefined => {
  if (selfCowIds.value === null) return undefined; // no filtering
  return [...selfCowIds.value];
});

const cowCount = computed(() => {
  if (selfCowIds.value !== null) return selfCowIds.value.size;
  return cowsStore.cowCount;
});

const todayLogs = computed(() => {
  const all = milkLogsStore.todayLogs;
  if (selfCowIds.value !== null) {
    return all.filter((log) => selfCowIds.value!.has(log.cow_id));
  }
  return all;
});

const todayMilk = computed(() =>
  todayLogs.value.reduce((sum, log) => sum + log.total_liters, 0)
);

const yesterdayMilk = computed(() => {
  if (selfCowIds.value !== null) {
    return milkLogsStore.yesterdayLogs
      .filter((log) => selfCowIds.value!.has(log.cow_id))
      .reduce((sum, log) => sum + log.total_liters, 0);
  }
  return milkLogsStore.yesterdayTotal;
});

const recentDiets = computed(() => {
  const all = dietsStore.recentDiets;
  if (selfCowIds.value !== null) {
    return all.filter((d) => d.cow_id && selfCowIds.value!.has(d.cow_id));
  }
  return all;
});

const cowsOnDietCount = computed(() => {
  const allActive = dietsStore.activeDiets;
  if (selfCowIds.value !== null) {
    return [...selfCowIds.value].filter((id) => allActive[id]).length;
  }
  return Object.keys(allActive).length;
});

/** Get diet name for a log entry (via diet_history_id lookup from diets store) */
function getDietNameForLog(log: { diet_history_id?: string }): string | null {
  if (!log.diet_history_id) return null;
  const diet = dietsStore.diets.find((d) => d.id === log.diet_history_id);
  return diet?.name || null;
}

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
  let base: string;
  if (hour < 12) base = t('dashboard.greetingMorning');
  else if (hour < 17) base = t('dashboard.greetingAfternoon');
  else base = t('dashboard.greetingEvening');

  // Append cow/milk summary if data available
  if (cowCount.value > 0 && yesterdayMilk.value > 0) {
    return `${base} ${t('dashboard.greetingSummary', { cows: cowCount.value, liters: yesterdayMilk.value.toFixed(1) })}`;
  }
  return base;
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

.trend-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.rounded-borders {
  border-radius: $radius-loose;
  overflow: hidden;
}

/* M19: Onboarding welcome card */
.onboarding-card {
  border-color: $primary;
  background: rgba(0, 0, 0, 0.02);
}

// Dark mode overrides are in app.scss (scoped :global() compiles incorrectly)
</style>
