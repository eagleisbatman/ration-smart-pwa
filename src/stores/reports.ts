import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/boot/axios';
import { db, Report, ReportQueueItem } from 'src/lib/offline/db';
import { isOnline } from 'src/boot/pwa';

export const useReportsStore = defineStore('reports', () => {
  // State
  const reports = ref<Report[]>([]);
  const queuedReports = ref<ReportQueueItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pendingReportCount = ref(0);

  // Actions

  /**
   * Fetch pending report count from IndexedDB
   */
  async function fetchPendingReportCount(): Promise<void> {
    const queued = await db.getQueuedReports();
    pendingReportCount.value = queued.length;
    queuedReports.value = queued;
  }

  /**
   * Queue a report for generation.
   * When online, calls the API directly.
   * When offline, saves to the reportQueue in IndexedDB.
   */
  async function queueReportGeneration(
    reportType: string,
    parameters: Record<string, unknown>,
    title: string
  ): Promise<{ queued: boolean; report?: Report }> {
    if (isOnline.value) {
      // Online: call API directly
      try {
        const response = await api.post('/api/v1/reports/generate', {
          report_type: reportType,
          parameters,
        });

        const report = response.data as Report;
        await db.reports.put({
          ...report,
          _cached_at: new Date().toISOString(),
        });

        return { queued: false, report };
      } catch (err) {
        // If API call fails while online, still queue it
        const id = await db.addToReportQueue({
          report_type: reportType,
          parameters,
          title,
          requested_at: new Date().toISOString(),
          status: 'queued',
        });

        await fetchPendingReportCount();
        return { queued: true };
      }
    } else {
      // Offline: queue for later
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

    const queuedItems = await db.getQueuedReports();
    let processed = 0;
    let failed = 0;

    for (const item of queuedItems) {
      try {
        // Mark as processing
        await db.updateReportQueueItem(item.id!, { status: 'processing' });

        // Call API to generate report
        const response = await api.post('/api/v1/reports/generate', {
          report_type: item.report_type,
          parameters: item.parameters,
        });

        const report = response.data as Report;

        // Cache the generated report
        await db.reports.put({
          ...report,
          _cached_at: new Date().toISOString(),
        });

        // Mark queue item as completed
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

  // Listen for online event to process the queue
  function setupOnlineListener(): void {
    window.addEventListener('online', async () => {
      if (pendingReportCount.value > 0) {
        await processReportQueue();
      }
    });
  }

  // Initialize the listener
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
    queueReportGeneration,
    processReportQueue,
  };
});
