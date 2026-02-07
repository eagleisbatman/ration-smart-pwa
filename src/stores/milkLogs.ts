import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, parseISO } from 'date-fns';
import { api } from 'src/boot/axios';
import { db, MilkLog } from 'src/lib/offline/db';
import { queueCreate, queueUpdate, queueDelete } from 'src/lib/offline/sync-manager';
import { useAuthStore } from './auth';
import { isOnline } from 'src/boot/pwa';

export interface MilkLogInput {
  cow_id: string;
  cow_name?: string;
  log_date: string;
  morning_liters?: number;
  evening_liters?: number;
  fat_percentage?: number;
  snf_percentage?: number;
  temperature?: number;
  notes?: string;
}

export interface MilkLogSummary {
  total_liters: number;
  average_per_day: number;
  logs_count: number;
  by_cow: Record<string, { total: number; count: number; average: number }>;
}

export const useMilkLogsStore = defineStore('milkLogs', () => {
  // State
  const logs = ref<MilkLog[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Computed
  const recentLogs = computed(() =>
    [...logs.value]
      .sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime())
      .slice(0, 20)
  );

  const todayLogs = computed(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return logs.value.filter((log) => log.log_date === today);
  });

  const todayTotal = computed(() =>
    todayLogs.value.reduce((sum, log) => sum + log.total_liters, 0)
  );

  const yesterdayLogs = computed(() => {
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    return logs.value.filter((log) => log.log_date === yesterday);
  });

  const yesterdayTotal = computed(() =>
    yesterdayLogs.value.reduce((sum, log) => sum + log.total_liters, 0)
  );

  const lastWeekSummary = computed((): MilkLogSummary => {
    const now = new Date();
    const lastWeekStart = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
    const lastWeekEnd = endOfWeek(subDays(now, 7), { weekStartsOn: 1 });
    const lastWeekLogs = logs.value.filter((log) => {
      const d = parseISO(log.log_date);
      return d >= lastWeekStart && d <= lastWeekEnd;
    });
    return calculateSummary(lastWeekLogs);
  });

  const thisWeekSummary = computed((): MilkLogSummary => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekLogs = logs.value.filter(
      (log) => parseISO(log.log_date) >= weekStart
    );

    return calculateSummary(weekLogs);
  });

  const thisMonthSummary = computed((): MilkLogSummary => {
    const monthStart = startOfMonth(new Date());
    const monthLogs = logs.value.filter(
      (log) => parseISO(log.log_date) >= monthStart
    );

    return calculateSummary(monthLogs);
  });

  // Helper to calculate summary
  function calculateSummary(logList: MilkLog[]): MilkLogSummary {
    const byCow: Record<string, { total: number; count: number; average: number }> = {};

    let totalLiters = 0;
    const uniqueDates = new Set<string>();

    for (const log of logList) {
      totalLiters += log.total_liters;
      uniqueDates.add(log.log_date);

      if (!byCow[log.cow_id]) {
        byCow[log.cow_id] = { total: 0, count: 0, average: 0 };
      }
      byCow[log.cow_id].total += log.total_liters;
      byCow[log.cow_id].count += 1;
    }

    // Calculate averages
    for (const cowId of Object.keys(byCow)) {
      byCow[cowId].average = byCow[cowId].total / byCow[cowId].count;
    }

    return {
      total_liters: totalLiters,
      average_per_day: uniqueDates.size > 0 ? totalLiters / uniqueDates.size : 0,
      logs_count: logList.length,
      by_cow: byCow,
    };
  }

  // Actions
  async function fetchLogs(params?: {
    cow_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<void> {
    const authStore = useAuthStore();
    if (!authStore.userId) return;

    loading.value = true;
    error.value = null;

    try {
      if (isOnline.value) {
        const response = await api.get('/api/v1/milk-logs', { params });
        const serverLogs = response.data.map((log: MilkLog) => ({
          ...log,
          _synced: true,
          _deleted: false,
        }));

        // Update local database
        await db.milkLogs.bulkPut(serverLogs);
      }

      // Load from local database
      let query = db.milkLogs.where({ user_id: authStore.userId });

      if (params?.cow_id) {
        query = db.milkLogs.where({ user_id: authStore.userId, cow_id: params.cow_id });
      }

      logs.value = await query.filter((log) => !log._deleted).toArray();

      // Apply date filters if provided
      if (params?.start_date || params?.end_date) {
        logs.value = logs.value.filter((log) => {
          const logDate = log.log_date;
          if (params.start_date && logDate < params.start_date) return false;
          if (params.end_date && logDate > params.end_date) return false;
          return true;
        });
      }
    } catch (err) {
      // Fallback to local data
      logs.value = await db.milkLogs
        .where({ user_id: authStore.userId })
        .filter((log) => !log._deleted)
        .toArray();

      if (logs.value.length === 0) {
        error.value = extractErrorMessage(err);
      }
    } finally {
      loading.value = false;
    }
  }

  async function getLog(id: string): Promise<MilkLog | null> {
    // Try local first
    const log = await db.milkLogs.get(id);

    if (!log && isOnline.value) {
      try {
        const response = await api.get(`/api/v1/milk-logs/${id}`);
        const serverLog: MilkLog = { ...response.data, _synced: true, _deleted: false };
        await db.milkLogs.put(serverLog);
        return serverLog;
      } catch {
        return null;
      }
    }

    return log ?? null;
  }

  async function createLog(input: MilkLogInput): Promise<MilkLog | null> {
    const authStore = useAuthStore();
    if (!authStore.userId) return null;

    loading.value = true;
    error.value = null;

    const totalLiters = (input.morning_liters || 0) + (input.evening_liters || 0);

    const newLog: MilkLog = {
      id: uuidv4(),
      user_id: authStore.userId,
      ...input,
      total_liters: totalLiters,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _synced: false,
      _deleted: false,
    };

    try {
      // Save to local database immediately (optimistic)
      await db.milkLogs.put(newLog);
      logs.value.push(newLog);

      if (isOnline.value) {
        // Sync with server
        const response = await api.post('/api/v1/milk-logs', input);
        const serverLog = { ...response.data, _synced: true, _deleted: false };

        // Update with server response
        await db.milkLogs.delete(newLog.id);
        await db.milkLogs.put(serverLog);

        // Update local state
        const index = logs.value.findIndex((l) => l.id === newLog.id);
        if (index !== -1) {
          logs.value[index] = serverLog;
        }

        return serverLog;
      } else {
        // Queue for later sync
        await queueCreate('milk_log', newLog.id, { ...input, total_liters: totalLiters });
        return newLog;
      }
    } catch (err) {
      error.value = extractErrorMessage(err);

      if (!isOnline.value) {
        await queueCreate('milk_log', newLog.id, { ...input, total_liters: totalLiters });
        return newLog;
      }

      // Remove optimistically added log on error
      await db.milkLogs.delete(newLog.id);
      logs.value = logs.value.filter((l) => l.id !== newLog.id);
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function updateLog(id: string, input: Partial<MilkLogInput>): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      const existingLog = await db.milkLogs.get(id);
      if (!existingLog) {
        error.value = 'Log not found';
        return false;
      }

      // Recalculate total if morning/evening changed
      const morning = input.morning_liters ?? existingLog.morning_liters ?? 0;
      const evening = input.evening_liters ?? existingLog.evening_liters ?? 0;
      const totalLiters = morning + evening;

      const updatedData = {
        ...input,
        total_liters: totalLiters,
        updated_at: new Date().toISOString(),
      };

      // Update locally immediately (optimistic)
      await db.milkLogs.update(id, { ...updatedData, _synced: false });

      // Update local state
      const index = logs.value.findIndex((l) => l.id === id);
      if (index !== -1) {
        logs.value[index] = { ...logs.value[index], ...updatedData, _synced: false };
      }

      if (isOnline.value) {
        // Sync with server
        await api.put(`/api/v1/milk-logs/${id}`, { ...input, total_liters: totalLiters });
        await db.milkLogs.update(id, { _synced: true });

        if (index !== -1) {
          logs.value[index]._synced = true;
        }
      } else {
        // Queue for later sync
        await queueUpdate('milk_log', id, updatedData);
      }

      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);

      if (!isOnline.value) {
        await queueUpdate('milk_log', id, input as unknown as Record<string, unknown>);
        return true;
      }

      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteLog(id: string): Promise<boolean> {
    loading.value = true;
    error.value = null;

    try {
      // Mark as deleted locally (optimistic)
      await db.milkLogs.update(id, { _deleted: true });
      logs.value = logs.value.filter((l) => l.id !== id);

      if (isOnline.value) {
        // Delete on server
        await api.delete(`/api/v1/milk-logs/${id}`);
        await db.milkLogs.delete(id);
      } else {
        // Queue for later sync
        await queueDelete('milk_log', id);
      }

      return true;
    } catch (err) {
      error.value = extractErrorMessage(err);

      if (!isOnline.value) {
        await queueDelete('milk_log', id);
        return true;
      }

      // Restore on error
      await db.milkLogs.update(id, { _deleted: false });
      await fetchLogs();
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function getLogsForCow(cowId: string): Promise<MilkLog[]> {
    return db.milkLogs
      .where({ cow_id: cowId })
      .filter((log) => !log._deleted)
      .reverse()
      .sortBy('log_date');
  }

  async function getLogByDate(cowId: string, date: string): Promise<MilkLog | null> {
    return (
      (await db.milkLogs
        .where({ cow_id: cowId, log_date: date })
        .filter((log) => !log._deleted)
        .first()) || null
    );
  }

  return {
    // State
    logs,
    loading,
    error,
    // Computed
    recentLogs,
    todayLogs,
    todayTotal,
    yesterdayLogs,
    yesterdayTotal,
    thisWeekSummary,
    lastWeekSummary,
    thisMonthSummary,
    // Actions
    fetchLogs,
    getLog,
    createLog,
    updateLog,
    deleteLog,
    getLogsForCow,
    getLogByDate,
  };
});

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { detail?: string } } }).response;
    if (response?.data?.detail) {
      return response.data.detail;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'An unexpected error occurred';
}
