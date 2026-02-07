<template>
  <q-page class="q-pa-md">
    <!-- Offline Queue Banner -->
    <q-banner
      v-if="!online && reportsStore.pendingReportCount > 0"
      class="bg-warning text-white q-mb-md rounded-borders"
      dense
    >
      <template #avatar>
        <q-icon name="schedule" color="white" />
      </template>
      {{ $t('reports.queuedCount', { count: reportsStore.pendingReportCount }) }}.
      {{ $t('reports.willGenerateOnline') }}
    </q-banner>

    <!-- Processing Queue Banner -->
    <q-banner
      v-if="processingQueue"
      class="bg-info text-white q-mb-md rounded-borders"
      dense
    >
      <template #avatar>
        <q-icon name="sync" color="white" class="spin-icon" />
      </template>
      {{ $t('reports.processingQueue') }}
    </q-banner>

    <!-- Report Types -->
    <div class="text-subtitle1 q-mb-sm">{{ $t('reports.generateReport') }}</div>
    <div class="row q-col-gutter-sm q-mb-lg">
      <div v-for="type in reportTypes" :key="type.value" class="col-6">
        <q-card
          flat
          bordered
          class="report-type-card"
          clickable
          @click="generateReport(type.value)"
        >
          <q-card-section class="text-center">
            <q-icon :name="type.icon" size="32px" :color="type.color" />
            <div class="text-body2 q-mt-sm">{{ type.label }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Report Templates -->
    <div class="q-mb-lg">
      <ReportTemplateList
        ref="templateListRef"
        @use="onUseTemplate"
      />
    </div>

    <!-- Queued Reports Section -->
    <template v-if="reportsStore.queuedReports.length > 0">
      <div class="text-subtitle1 q-mb-sm">{{ $t('reports.queuedReports') }}</div>
      <q-list bordered separator class="rounded-borders q-mb-lg">
        <q-item
          v-for="item in reportsStore.queuedReports"
          :key="item.id"
        >
          <q-item-section avatar>
            <q-icon :name="getReportIcon(item.report_type)" color="grey-6" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ item.title }}</q-item-label>
            <q-item-label caption>{{ formatDate(item.requested_at, 'PPp') }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-chip
              color="orange"
              text-color="white"
              size="sm"
              icon="schedule"
            >
              {{ $t('reports.queuedForGeneration') }}
            </q-chip>
          </q-item-section>
        </q-item>
      </q-list>
    </template>

    <!-- Recent Reports -->
    <div class="text-subtitle1 q-mb-sm">{{ $t('reports.recentReports') }}</div>
    <template v-if="loading">
      <SkeletonList :count="3" />
    </template>
    <template v-else-if="reports.length === 0 && reportsStore.queuedReports.length === 0">
      <q-card flat bordered class="text-center q-pa-lg">
        <q-icon name="assessment" size="48px" color="grey-4" />
        <div class="text-body2 text-grey-7 q-mt-sm">{{ $t('reports.noReportsYet') }}</div>
      </q-card>
    </template>
    <template v-else>
      <q-list bordered separator class="rounded-borders">
        <q-item
          v-for="report in reports"
          :key="report.id"
          v-ripple
          clickable
          @click="viewReport(report)"
        >
          <q-item-section avatar>
            <q-icon :name="getReportIcon(report.report_type)" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ report.title }}</q-item-label>
            <q-item-label caption>{{ formatDate(report.created_at, 'PPp') }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-chip
              :color="report.status === 'completed' ? 'positive' : 'warning'"
              text-color="white"
              size="sm"
            >
              {{ report.status }}
            </q-chip>
          </q-item-section>
        </q-item>
      </q-list>
    </template>

    <!-- Generate Report Dialog -->
    <q-dialog v-model="showGenerateDialog" persistent>
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">{{ $t('reports.generate') }} {{ selectedReportType?.label }}</div>
        </q-card-section>

        <q-card-section>
          <q-select
            v-if="selectedReportType?.needsCow"
            v-model="reportParams.cow_id"
            :label="$t('reports.selectCow')"
            outlined
            :options="cowOptions"
            emit-value
            map-options
          />

          <div class="row q-col-gutter-sm q-mt-sm">
            <div class="col-6">
              <q-input
                v-model="reportParams.start_date"
                :label="$t('reports.startDate')"
                outlined
                readonly
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover>
                      <q-date v-model="reportParams.start_date" mask="YYYY-MM-DD" />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-6">
              <q-input
                v-model="reportParams.end_date"
                :label="$t('reports.endDate')"
                outlined
                readonly
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover>
                      <q-date v-model="reportParams.end_date" mask="YYYY-MM-DD" />
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            icon="bookmark_add"
            :label="$t('reports.templates.saveTemplate')"
            color="secondary"
            @click="openSaveTemplate"
          />
          <q-space />
          <q-btn v-close-popup flat :label="$t('common.cancel')" />
          <q-btn
            flat
            :label="$t('reports.generate')"
            color="primary"
            :loading="generating"
            @click="submitReport"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Save Template Dialog -->
    <ReportTemplateDialog
      v-model="showSaveTemplateDialog"
      :report-type="selectedReportType?.value ?? ''"
      :parameters="currentParameters"
      @saved="onTemplateSaved"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { format, subDays } from 'date-fns';
import { api } from 'src/boot/axios';
import { useCowsStore } from 'src/stores/cows';
import { useReportsStore } from 'src/stores/reports';
import { useDateFormat } from 'src/composables/useDateFormat';
import { db, Report, ReportTemplate } from 'src/lib/offline/db';
import { isOnline } from 'src/boot/pwa';
import SkeletonList from 'src/components/ui/SkeletonList.vue';
import ReportTemplateDialog from 'src/components/reports/ReportTemplateDialog.vue';
import ReportTemplateList from 'src/components/reports/ReportTemplateList.vue';
import { COW_ICON } from 'src/boot/icons';

const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();
const cowsStore = useCowsStore();
const reportsStore = useReportsStore();
const { formatDate } = useDateFormat();

const online = computed(() => isOnline.value);
const reports = ref<Report[]>([]);
const loading = ref(true);
const showGenerateDialog = ref(false);
const generating = ref(false);
const processingQueue = ref(false);
const selectedReportType = ref<{ value: string; label: string; icon: string; color: string; needsCow: boolean } | null>(null);
const showSaveTemplateDialog = ref(false);
const templateListRef = ref<InstanceType<typeof ReportTemplateList> | null>(null);

const reportParams = reactive({
  cow_id: null as string | null,
  start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  end_date: format(new Date(), 'yyyy-MM-dd'),
});

const reportTypes = computed(() => [
  { value: 'milk_production', label: t('reports.reportTypes.milkProduction'), icon: 'water_drop', color: 'primary', needsCow: false },
  { value: 'feed_consumption', label: t('reports.reportTypes.feedConsumption'), icon: 'grass', color: 'secondary', needsCow: false },
  { value: 'cow_performance', label: t('reports.reportTypes.cowPerformance'), icon: COW_ICON, color: 'accent', needsCow: true },
  { value: 'cost_analysis', label: t('reports.reportTypes.costAnalysis'), icon: 'savings', color: 'positive', needsCow: false },
]);

const cowOptions = computed(() => [
  { label: t('reports.allCows'), value: null },
  ...cowsStore.activeCows.map((cow) => ({
    label: cow.name,
    value: cow.id,
  })),
]);

function getReportIcon(type: string): string {
  const found = reportTypes.value.find((rt) => rt.value === type);
  return found?.icon || 'assessment';
}

const currentParameters = computed(() => ({
  cow_id: reportParams.cow_id,
  start_date: reportParams.start_date,
  end_date: reportParams.end_date,
}));

function generateReport(type: string) {
  selectedReportType.value = reportTypes.value.find((rt) => rt.value === type) || null;
  showGenerateDialog.value = true;
}

function openSaveTemplate() {
  if (!selectedReportType.value) return;
  showSaveTemplateDialog.value = true;
}

function onTemplateSaved() {
  templateListRef.value?.loadTemplates();
}

function onUseTemplate(template: ReportTemplate) {
  // Find and set the report type
  selectedReportType.value = reportTypes.value.find((rt) => rt.value === template.report_type) || null;

  // Apply template parameters
  if (template.parameters.cow_id !== undefined) {
    reportParams.cow_id = template.parameters.cow_id as string | null;
  }
  if (template.parameters.start_date) {
    reportParams.start_date = template.parameters.start_date as string;
  }
  if (template.parameters.end_date) {
    reportParams.end_date = template.parameters.end_date as string;
  }

  // Open the generate dialog with pre-filled params
  showGenerateDialog.value = true;

  $q.notify({
    type: 'info',
    message: t('reports.templates.useTemplate'),
    icon: 'bookmark',
  });
}

async function submitReport() {
  if (!selectedReportType.value) return;

  generating.value = true;

  try {
    const parameters = {
      cow_id: reportParams.cow_id,
      start_date: reportParams.start_date,
      end_date: reportParams.end_date,
    };

    const title = selectedReportType.value.label;
    const result = await reportsStore.queueReportGeneration(
      selectedReportType.value.value,
      parameters,
      title
    );

    showGenerateDialog.value = false;

    if (result.queued) {
      // Report was queued for offline generation
      $q.notify({
        type: 'info',
        message: t('reports.reportQueued'),
        icon: 'schedule',
      });
    } else if (result.report) {
      // Report was generated immediately (online)
      reports.value.unshift(result.report);
      $q.notify({
        type: 'positive',
        message: t('reports.generatedSuccess'),
      });
      router.push(`/reports/${result.report.id}`);
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: t('reports.generatedFailed'),
    });
  } finally {
    generating.value = false;
  }
}

function viewReport(report: Report) {
  if (report.status === 'completed') {
    router.push(`/reports/${report.id}`);
  } else {
    $q.notify({
      type: 'info',
      message: t('reports.stillGenerating'),
    });
  }
}

// Handle coming back online: process queued reports
async function handleOnline() {
  if (reportsStore.pendingReportCount > 0) {
    processingQueue.value = true;
    $q.notify({
      type: 'info',
      message: t('reports.processingQueue'),
      icon: 'sync',
    });

    const result = await reportsStore.processReportQueue();
    processingQueue.value = false;

    if (result.processed > 0) {
      $q.notify({
        type: 'positive',
        message: t('reports.queueProcessed'),
      });
      // Refresh reports list
      try {
        const response = await api.get('/api/v1/reports');
        reports.value = response.data;
      } catch {
        reports.value = await db.reports.orderBy('created_at').reverse().toArray();
      }
    }
  }
}

// Watch for online status changes
const stopOnlineWatcher = watch(online, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    handleOnline();
  }
});

onMounted(async () => {
  await cowsStore.fetchCows();
  await reportsStore.fetchPendingReportCount();

  loading.value = true;
  try {
    const response = await api.get('/api/v1/reports');
    reports.value = response.data;
  } catch {
    // Load from cache
    reports.value = await db.reports.orderBy('created_at').reverse().toArray();
  }
  loading.value = false;
});

onUnmounted(() => {
  stopOnlineWatcher();
});
</script>

<style lang="scss" scoped>
.report-type-card {
  border-radius: 12px;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.98);
  }
}

.rounded-borders {
  border-radius: 12px;
  overflow: hidden;
}

.spin-icon {
  animation: spin 1.5s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
