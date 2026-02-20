import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { format, differenceInDays } from 'date-fns';
import { useCowsStore } from './cows';
import { useMilkLogsStore } from './milkLogs';
import { useDietsStore } from './diets';
import { db } from 'src/lib/offline/db';
import { pendingCount as syncPendingCount } from 'src/lib/offline/sync-manager';
import { getDueReminders, dismissDietReminder } from 'src/lib/diet-reminders';

export interface AppNotification {
  id: string;
  type: 'reminder' | 'alert' | 'info';
  icon: string;
  title: string; // i18n key
  message: string; // i18n key
  params?: Record<string, unknown>; // params for i18n interpolation
  action?: { route: string; label: string }; // optional action button
  read: boolean;
  createdAt: string;
}

const DISMISSED_KEY = 'notifications_dismissed';

function getDismissedIds(): Set<string> {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    if (!stored) return new Set();
    const parsed = JSON.parse(stored) as { date: string; ids: string[] };
    // Only use dismissed IDs from today
    const today = format(new Date(), 'yyyy-MM-dd');
    if (parsed.date === today) {
      return new Set(parsed.ids);
    }
    // Clear stale dismissed IDs from previous days
    localStorage.removeItem(DISMISSED_KEY);
    return new Set();
  } catch {
    return new Set();
  }
}

function saveDismissedIds(ids: Set<string>): void {
  const today = format(new Date(), 'yyyy-MM-dd');
  localStorage.setItem(
    DISMISSED_KEY,
    JSON.stringify({ date: today, ids: Array.from(ids) })
  );
}

export const useNotificationsStore = defineStore('notifications', () => {
  // State
  const notifications = ref<AppNotification[]>([]);
  const dismissedIds = ref<Set<string>>(getDismissedIds());

  // Getters
  const unreadCount = computed(() =>
    notifications.value.filter((n) => !n.read).length
  );

  // Actions
  function markAsRead(id: string): void {
    const notif = notifications.value.find((n) => n.id === id);
    if (notif) {
      notif.read = true;
    }
  }

  function markAllAsRead(): void {
    notifications.value.forEach((n) => {
      n.read = true;
    });
  }

  function dismissNotification(id: string): void {
    notifications.value = notifications.value.filter((n) => n.id !== id);
    dismissedIds.value.add(id);
    saveDismissedIds(dismissedIds.value);

    // If this is a diet reminder notification, also dismiss the underlying reminder
    if (id.startsWith('diet_reminder_')) {
      const reminderId = id.replace('diet_reminder_', '');
      dismissDietReminder(reminderId);
    }
  }

  async function generateNotifications(): Promise<void> {
    const cowsStore = useCowsStore();
    const milkLogsStore = useMilkLogsStore();
    const dietsStore = useDietsStore();

    const today = format(new Date(), 'yyyy-MM-dd');
    const newNotifications: AppNotification[] = [];
    const dismissed = getDismissedIds();
    dismissedIds.value = dismissed;

    // 1. Missing milk log today (only for cows with an active/followed diet)
    try {
      const activeCows = cowsStore.activeCows;
      const activeDiets = dietsStore.activeDiets;
      const todayLogs = milkLogsStore.todayLogs;
      const loggedCowIds = new Set(todayLogs.map((log) => log.cow_id));
      const cowsMissingLog = activeCows.filter(
        (cow) => activeDiets[cow.id] && !loggedCowIds.has(cow.id)
      );

      if (cowsMissingLog.length > 0) {
        const notifId = `milk_log_missing_${today}`;
        if (!dismissed.has(notifId)) {
          newNotifications.push({
            id: notifId,
            type: 'reminder',
            icon: 'water_drop',
            title: 'notifications.milkLogReminder',
            message: 'notifications.milkLogMissing',
            params: { count: cowsMissingLog.length },
            action: { route: 'log-new', label: 'notifications.logMilk' },
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('[Notifications] Failed to check milk logs:', err);
    }

    // 2. Stale diet plan (older than 30 days)
    try {
      const activeCows = cowsStore.activeCows;
      for (const cow of activeCows) {
        const cowDiets = dietsStore.diets.filter(
          (d) => d.cow_id === cow.id && d.status === 'completed'
        );
        if (cowDiets.length > 0) {
          // Get the most recent diet
          const latestDiet = cowDiets.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )[0];
          const daysOld = differenceInDays(
            new Date(),
            new Date(latestDiet.created_at)
          );
          if (daysOld > 30) {
            const notifId = `stale_diet_${cow.id}_${today}`;
            if (!dismissed.has(notifId)) {
              newNotifications.push({
                id: notifId,
                type: 'alert',
                icon: 'menu_book',
                title: 'notifications.staleDiet',
                message: 'notifications.staleDietMessage',
                params: { cowName: cow.name, days: daysOld },
                action: {
                  route: 'diet-new',
                  label: 'notifications.viewDiet',
                },
                read: false,
                createdAt: new Date().toISOString(),
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Notifications] Failed to check stale diets:', err);
    }

    // 3. Sync pending
    try {
      const pending = syncPendingCount.value;
      if (pending > 0) {
        const notifId = `sync_pending_${today}`;
        if (!dismissed.has(notifId)) {
          newNotifications.push({
            id: notifId,
            type: 'info',
            icon: 'sync',
            title: 'notifications.syncPending',
            message: 'notifications.syncPendingMessage',
            params: { count: pending },
            action: { route: 'settings', label: 'notifications.syncNow' },
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('[Notifications] Failed to check sync status:', err);
    }

    // 4. Diet reminders (from localStorage)
    try {
      const dueReminders = getDueReminders();
      for (const reminder of dueReminders) {
        const notifId = `diet_reminder_${reminder.id}`;
        if (!dismissed.has(notifId)) {
          const displayTitle = reminder.cowName
            ? `${reminder.dietTitle} — ${reminder.cowName}`
            : reminder.dietTitle;

          newNotifications.push({
            id: notifId,
            type: 'reminder',
            icon: 'alarm',
            title: 'notifications.dietReminder',
            message: 'notifications.dietReminderMessage',
            params: { title: displayTitle, cow: reminder.cowName || '' },
            action: {
              route: `diet-detail`,
              label: 'notifications.viewDiet',
            },
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('[Notifications] Failed to check diet reminders:', err);
    }

    // 5. Low milk yield warning (>20% decrease vs previous log)
    // Batch-load all milk logs once to avoid N+1 IndexedDB queries
    try {
      const activeCows = cowsStore.activeCows;
      const allLogs = await db.milkLogs.filter((log) => !log._deleted).sortBy('log_date');
      // Group logs by cow_id
      const logsByCow = new Map<string, typeof allLogs>();
      for (const log of allLogs) {
        const existing = logsByCow.get(log.cow_id);
        if (existing) {
          existing.push(log);
        } else {
          logsByCow.set(log.cow_id, [log]);
        }
      }

      for (const cow of activeCows) {
        const cowLogs = logsByCow.get(cow.id);
        if (!cowLogs || cowLogs.length < 2) continue;

        // Logs are sorted ascending by log_date; take last two
        const previous = cowLogs[cowLogs.length - 2];
        const latest = cowLogs[cowLogs.length - 1];

        if (previous.total_liters > 0 && latest.total_liters > 0) {
          const decrease =
            ((previous.total_liters - latest.total_liters) /
              previous.total_liters) *
            100;

          if (decrease > 20) {
            const notifId = `low_yield_${cow.id}_${latest.log_date}`;
            if (!dismissed.has(notifId)) {
              newNotifications.push({
                id: notifId,
                type: 'alert',
                icon: 'trending_down',
                title: 'notifications.lowYield',
                message: 'notifications.lowYieldMessage',
                params: {
                  cowName: cow.name,
                  percent: Math.round(decrease),
                },
                action: {
                  route: `cow-detail`,
                  label: 'notifications.viewCow',
                },
                read: false,
                createdAt: new Date().toISOString(),
              });
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Notifications] Failed to check milk yield:', err);
    }

    notifications.value = newNotifications;
  }

  return {
    // State
    notifications,
    // Getters
    unreadCount,
    // Actions
    markAsRead,
    markAllAsRead,
    dismissNotification,
    generateNotifications,
  };
});
