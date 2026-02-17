<template>
  <q-page class="q-pa-md">
    <template v-if="loading">
      <SkeletonCard />
    </template>

    <template v-else-if="report">
      <!-- Header -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="text-h6">{{ report.title }}</div>
          <div class="text-caption text-grey-7">{{ formatDate(report.created_at, 'PPPp') }}</div>
        </q-card-section>
      </q-card>

      <!-- Download & Share Buttons -->
      <div class="row q-gutter-sm q-mb-md">
        <q-btn
          v-if="report.file_url"
          :label="$t('reports.downloadPdf')"
          icon="download"
          color="primary"
          class="col"
          unelevated
          @click="downloadReport"
        />
        <q-btn
          :label="$t('reports.shareReport')"
          icon="share"
          color="secondary"
          class="col"
          unelevated
          @click="showShareSheet = true"
        />
      </div>

      <!-- Share Bottom Sheet -->
      <q-dialog v-model="showShareSheet" position="bottom">
        <q-card class="dialog-card">
          <q-card-section>
            <div class="text-h6">{{ $t('reports.shareReport') }}</div>
          </q-card-section>
          <q-list>
            <q-item v-close-popup clickable @click="shareReportViaWhatsApp">
              <q-item-section avatar>
                <q-icon name="chat" color="green" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ $t('reports.shareViaWhatsApp') }}</q-item-label>
              </q-item-section>
            </q-item>
            <q-item v-close-popup clickable @click="shareReportViaOther">
              <q-item-section avatar>
                <q-icon name="share" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ $t('reports.shareViaOther') }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </q-dialog>

      <!-- Report HTML Preview -->
      <q-card v-if="htmlContent" flat bordered class="q-mb-md">
        <q-card-section>
          <div class="report-html-preview" v-html="htmlContent" />
        </q-card-section>
      </q-card>

      <!-- Report Summary Preview (fallback when no HTML) -->
      <ReportPreview
        v-if="!htmlContent"
        :report-type="report.report_type"
        :parameters="params"
        :report-data="(report as Record<string, unknown>)"
        class="q-mb-md"
      />

      <!-- Parameters -->
      <div class="text-subtitle1 q-mt-md q-mb-sm">{{ $t('reports.parameters') }}</div>
      <q-card flat bordered>
        <q-list separator>
          <q-item>
            <q-item-section>
              <q-item-label caption>{{ $t('reports.reportType') }}</q-item-label>
              <q-item-label class="text-capitalize">{{ report.report_type.replace('_', ' ') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-if="params.start_date">
            <q-item-section>
              <q-item-label caption>{{ $t('reports.dateRange') }}</q-item-label>
              <q-item-label>{{ params.start_date }} to {{ params.end_date }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-if="params.cow_id">
            <q-item-section>
              <q-item-label caption>{{ $t('reports.cow') }}</q-item-label>
              <q-item-label>{{ params.cow_id }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </template>

    <template v-else>
      <EmptyState
        icon="error_outline"
        icon-color="negative"
        :title="$t('reports.notFound')"
        :description="$t('reports.notFoundDescription')"
        :action-label="$t('reports.goBack')"
        @action="router.back()"
      />
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from 'src/lib/api';
import { useDateFormat } from 'src/composables/useDateFormat';
import { useExport } from 'src/composables/useExport';
import { useAuthStore } from 'src/stores/auth';
import { db, Report } from 'src/lib/offline/db';
import SkeletonCard from 'src/components/ui/SkeletonCard.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';
import ReportPreview from 'src/components/reports/ReportPreview.vue';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const { formatDate } = useDateFormat();
const { shareContent, shareViaWhatsApp } = useExport();
const authStore = useAuthStore();

const reportId = computed(() => route.params.id as string);
const report = ref<Report | null>(null);
const htmlContent = ref<string | null>(null);
const loading = ref(true);
const showShareSheet = ref(false);

const params = computed(() => (report.value?.parameters as Record<string, string>) || {});

function downloadReport() {
  if (!report.value?.file_url) return;
  // Open the download URL (backend HTML report) in a new tab
  const baseUrl = api.defaults.baseURL || '';
  const downloadUrl = `${baseUrl}${report.value.file_url}`;
  window.open(downloadUrl, '_blank', 'noopener');
}

function buildReportSummaryText(): string {
  if (!report.value) return '';
  const r = report.value;
  const p = params.value;
  let text = `${t('reports.shareReport')}\n`;
  text += `${t('reports.reportType')}: ${r.report_type.replace('_', ' ')}\n`;
  text += `${r.title}\n`;
  if (p.start_date && p.end_date) {
    text += `${t('reports.dateRange')}: ${p.start_date} to ${p.end_date}\n`;
  }
  if (p.cow_id) {
    text += `${t('reports.cow')}: ${p.cow_id}\n`;
  }
  text += `\n${t('export.generatedBy')}`;
  return text;
}

function shareReportViaWhatsApp() {
  const text = buildReportSummaryText();
  shareViaWhatsApp(text);
}

async function shareReportViaOther() {
  const text = buildReportSummaryText();
  await shareContent(t('reports.shareReport'), text);
}

onMounted(async () => {
  loading.value = true;

  // Try to get report metadata from API
  try {
    const response = await api.get(`/api/v1/reports/${reportId.value}`);
    const data = response.data;

    // Map backend FarmerReportSummary → PWA Report
    report.value = {
      id: data.id,
      user_id: authStore.userId || '',
      report_type: data.report_type,
      title: data.farmer_name || data.report_type,
      parameters: {},
      file_url: data.download_url,
      status: 'completed',
      created_at: data.generated_at,
      _cached_at: new Date().toISOString(),
    };

    await db.reports.put(report.value);

    // Fetch HTML content
    if (data.download_url) {
      try {
        const htmlResp = await api.get(`/api/v1/reports/${reportId.value}/download`);
        if (typeof htmlResp.data === 'string') {
          htmlContent.value = htmlResp.data;
        }
      } catch {
        // HTML not available — fall back to preview
      }
    }
  } catch {
    // Fallback to cache
    report.value = await db.reports.get(reportId.value) || null;
  }

  loading.value = false;
});
</script>

<style lang="scss" scoped>
.report-html-preview {
  max-height: 600px;
  overflow-y: auto;

  :deep(body) {
    font-size: 12pt;
    padding: 0;
    margin: 0;
  }

  :deep(table) {
    width: 100%;
    font-size: 0.85rem;
  }
}
</style>
