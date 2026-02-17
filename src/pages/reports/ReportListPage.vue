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
          v-ripple
          flat
          bordered
          class="report-type-card cursor-pointer"
          clickable
          @click="generateReport(type.value)"
        >
          <q-card-section class="text-center">
            <q-avatar size="40px" color="primary" text-color="white">
              <q-icon :name="type.icon" size="20px" />
            </q-avatar>
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
              color="warning"
              text-color="white"
              size="sm"
              dense
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
    <template v-else-if="reports.length === 0">
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
              dense
            >
              {{ report.status }}
            </q-chip>
          </q-item-section>
        </q-item>
      </q-list>
    </template>

    <!-- Generate Report Dialog -->
    <q-dialog v-model="showGenerateDialog" persistent>
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ $t('reports.generate') }} {{ selectedReportType?.label }}</div>
        </q-card-section>

        <q-card-section>
          <!-- Report Name -->
          <q-input
            v-model="reportName"
            :label="$t('reports.reportName')"
            outlined
            :placeholder="selectedReportType?.label"
            class="q-mb-sm"
          />

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
            <div class="col-12 col-sm-6">
              <q-input
                v-model="reportParams.start_date"
                :label="$t('reports.startDate')"
                outlined
                readonly
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer" @click="startDateRef?.open()">
                    <DatePickerPopup
                      ref="startDateRef"
                      v-model="reportParams.start_date"
                      mask="YYYY-MM-DD"
                    />
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model="reportParams.end_date"
                :label="$t('reports.endDate')"
                outlined
                readonly
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer" @click="endDateRef?.open()">
                    <DatePickerPopup
                      ref="endDateRef"
                      v-model="reportParams.end_date"
                      mask="YYYY-MM-DD"
                    />
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
import { useCowsStore } from 'src/stores/cows';
import { useReportsStore } from 'src/stores/reports';
import { useDateFormat } from 'src/composables/useDateFormat';
import { Report, ReportTemplate } from 'src/lib/offline/db';
import { isOnline } from 'src/boot/pwa';
import SkeletonList from 'src/components/ui/SkeletonList.vue';
import ReportTemplateDialog from 'src/components/reports/ReportTemplateDialog.vue';
import ReportTemplateList from 'src/components/reports/ReportTemplateList.vue';
import DatePickerPopup from 'src/components/ui/DatePickerPopup.vue';
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
const reportName = ref('');
const selectedReportType = ref<{ value: string; label: string; icon: string; needsCow: boolean } | null>(null);
const showSaveTemplateDialog = ref(false);
const templateListRef = ref<InstanceType<typeof ReportTemplateList> | null>(null);
const startDateRef = ref<InstanceType<typeof DatePickerPopup> | null>(null);
const endDateRef = ref<InstanceType<typeof DatePickerPopup> | null>(null);

const reportParams = reactive({
  cow_id: null as string | null,
  start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  end_date: format(new Date(), 'yyyy-MM-dd'),
});

const reportTypes = computed(() => [
  { value: 'milk_production', label: t('reports.reportTypes.milkProduction'), icon: 'water_drop', needsCow: false },
  { value: 'feed_consumption', label: t('reports.reportTypes.feedConsumption'), icon: 'grass', needsCow: false },
  { value: 'cow_performance', label: t('reports.reportTypes.cowPerformance'), icon: COW_ICON, needsCow: true },
  { value: 'cost_analysis', label: t('reports.reportTypes.costAnalysis'), icon: 'savings', needsCow: false },
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
  reportName.value = selectedReportType.value?.label || '';
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
  selectedReportType.value = reportTypes.value.find((rt) => rt.value === template.report_type) || null;

  if (template.parameters.cow_id !== undefined) {
    reportParams.cow_id = template.parameters.cow_id as string | null;
  }
  if (template.parameters.start_date) {
    reportParams.start_date = template.parameters.start_date as string;
  }
  if (template.parameters.end_date) {
    reportParams.end_date = template.parameters.end_date as string;
  }

  reportName.value = selectedReportType.value?.label || '';
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

    const title = reportName.value.trim() || selectedReportType.value.label;
    const result = await reportsStore.queueReportGeneration(
      selectedReportType.value.value,
      parameters,
      title,
    );

    showGenerateDialog.value = false;

    if (result.queued) {
      $q.notify({
        type: 'info',
        message: t('reports.reportQueued'),
        icon: 'schedule',
      });
    } else if (result.report) {
      reports.value.unshift(result.report);
      $q.notify({
        type: 'positive',
        message: t('reports.generatedSuccess'),
      });
      router.push(`/reports/${result.report.id}`);
    }
  } catch {
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
      reports.value = await reportsStore.fetchReports();
    }
  }
}

const stopOnlineWatcher = watch(online, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    handleOnline();
  }
});

onMounted(async () => {
  await cowsStore.fetchCows();
  await reportsStore.fetchPendingReportCount();

  loading.value = true;
  reports.value = await reportsStore.fetchReports();
  loading.value = false;
});

onUnmounted(() => {
  stopOnlineWatcher();
});
</script>

<style lang="scss" scoped>
.report-type-card {
  border-radius: $radius-loose;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.98);
  }
}

.rounded-borders {
  border-radius: $radius-loose;
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
