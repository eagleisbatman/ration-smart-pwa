import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/lib/api';
import { db, Report, ReportQueueItem } from 'src/lib/offline/db';
import { isOnline } from 'src/boot/pwa';
import { useAuthStore } from 'src/stores/auth';

/**
 * Build the backend-compatible payload from PWA parameters.
 * Backend expects: { farmer_profile_id, cow_profile_id?, date_from?, date_to?, include_yield_history? }
 * PWA stores: { cow_id, start_date, end_date }
 */
function buildBackendPayload(
  farmerProfileId: string,
  parameters: Record<string, unknown>,
): Record<string, unknown> {
  return {
    farmer_profile_id: farmerProfileId,
    cow_profile_id: parameters.cow_id || undefined,
    date_from: parameters.start_date || undefined,
    date_to: parameters.end_date || undefined,
    include_yield_history: true,
  };
}

/**
 * Transform backend FarmerReportSummary → PWA Report interface.
 */
function mapBackendReport(
  data: Record<string, unknown>,
  title: string,
  userId: string,
  parameters: Record<string, unknown>,
): Report {
  return {
    id: data.id as string,
    user_id: userId,
    report_type: data.report_type as string,
    title,
    parameters,
    file_url: data.download_url as string | undefined,
    status: 'completed',
    created_at: data.generated_at as string,
    _cached_at: new Date().toISOString(),
  };
}

export const useReportsStore = defineStore('reports', () => {
  // State
  const reports = ref<Report[]>([]);
  const queuedReports = ref<ReportQueueItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pendingReportCount = ref(0);

  // Actions

  async function fetchPendingReportCount(): Promise<void> {
    const queued = await db.getQueuedReports();
    pendingReportCount.value = queued.length;
    queuedReports.value = queued;
  }

  /**
   * Fetch recent reports from backend for the current user.
   */
  async function fetchReports(): Promise<Report[]> {
    const authStore = useAuthStore();
    if (!authStore.userId) return [];

    try {
      const response = await api.get(`/api/v1/reports/user/${authStore.userId}`);
      const backendReports = response.data as Record<string, unknown>[];

      const mapped = backendReports.map((r) =>
        mapBackendReport(r, r.farmer_name as string || (r.report_type as string), authStore.userId!, {}),
      );

      // Cache locally
      for (const report of mapped) {
        await db.reports.put(report);
      }

      reports.value = mapped;
      return mapped;
    } catch {
      // Fallback to cache
      const cached = await db.reports.orderBy('created_at').reverse().toArray();
      reports.value = cached;
      return cached;
    }
  }

  /**
   * Queue a report for generation.
   * When online, calls the API directly with correct backend payload.
   * When offline, saves to the reportQueue in IndexedDB.
   */
  async function queueReportGeneration(
    reportType: string,
    parameters: Record<string, unknown>,
    title: string,
  ): Promise<{ queued: boolean; report?: Report }> {
    const authStore = useAuthStore();
    const userId = authStore.userId;
    // Use target farmer's profile if provided (EW generating for managed farmer),
    // otherwise fall back to the logged-in user's own profile.
    const farmerProfileId =
      (parameters.farmer_profile_id as string | undefined) ||
      authStore.selfFarmerProfileId;

    if (!userId || !farmerProfileId) {
      // Can't generate without auth context — queue for later
      await db.addToReportQueue({
        report_type: reportType,
        parameters,
        title,
        requested_at: new Date().toISOString(),
        status: 'queued',
      });
      await fetchPendingReportCount();
      return { queued: true };
    }

    if (isOnline.value) {
      // Let errors propagate so the UI can show the actual backend message
      const payload = buildBackendPayload(farmerProfileId, parameters);
      const response = await api.post(
        `/api/v1/reports/generate?user_id=${encodeURIComponent(userId)}`,
        payload,
      );

      const report = mapBackendReport(response.data, title, userId, parameters);
      await db.reports.put(report);

      return { queued: false, report };
    } else {
      await db.addToReportQueue({
        report_type: reportType,
        parameters,
        title,
        requested_at: new Date().toISOString(),
        status: 'queued',
      });
      await fetchPendingReportCount();
      return { queued: true };
    }
  }

  /**
   * Process all queued report generation requests.
   * Called when the app comes back online.
   */
  async function processReportQueue(): Promise<{ processed: number; failed: number }> {
    if (!isOnline.value) {
      return { processed: 0, failed: 0 };
    }

    const authStore = useAuthStore();
    const userId = authStore.userId;

    if (!userId) {
      return { processed: 0, failed: 0 };
    }

    const queuedItems = await db.getQueuedReports();
    let processed = 0;
    let failed = 0;

    for (const item of queuedItems) {
      try {
        await db.updateReportQueueItem(item.id!, { status: 'processing' });

        // Use target farmer's profile from queued parameters, or fallback to own
        const farmerProfileId =
          (item.parameters.farmer_profile_id as string | undefined) ||
          authStore.selfFarmerProfileId;

        if (!farmerProfileId) {
          failed++;
          await db.updateReportQueueItem(item.id!, { status: 'failed' });
          continue;
        }

        const payload = buildBackendPayload(farmerProfileId, item.parameters);
        const response = await api.post(
          `/api/v1/reports/generate?user_id=${encodeURIComponent(userId)}`,
          payload,
        );

        const report = mapBackendReport(response.data, item.title, userId, item.parameters);
        await db.reports.put(report);

        await db.updateReportQueueItem(item.id!, {
          status: 'completed',
          result_report_id: report.id,
        });

        processed++;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate report';
        await db.updateReportQueueItem(item.id!, {
          status: 'failed',
          error_message: errorMessage,
        });
        failed++;
      }
    }

    await fetchPendingReportCount();
    return { processed, failed };
  }

  let onlineListenerRegistered = false;
  function setupOnlineListener(): void {
    if (onlineListenerRegistered) return;
    onlineListenerRegistered = true;
    window.addEventListener('online', async () => {
      if (pendingReportCount.value > 0) {
        await processReportQueue();
      }
    });
  }

  setupOnlineListener();

  return {
    // State
    reports,
    queuedReports,
    loading,
    error,
    pendingReportCount,
    // Actions
    fetchPendingReportCount,
    fetchReports,
    queueReportGeneration,
    processReportQueue,
  };
});
