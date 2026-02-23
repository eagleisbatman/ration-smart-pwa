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

    <!-- Generate Diet Report CTA -->
    <q-card
      v-ripple
      flat
      bordered
      class="report-cta-card cursor-pointer q-mb-lg"
      @click="openGenerateDialog"
    >
      <q-card-section class="row items-center q-gutter-md">
        <q-avatar size="48px" color="primary" text-color="white">
          <q-icon name="menu_book" size="24px" />
        </q-avatar>
        <div class="col">
          <div class="text-subtitle1">{{ $t('reports.generateDietReport') }}</div>
          <div class="text-caption text-grey-7">{{ $t('reports.generateDietReportDesc') }}</div>
        </div>
        <q-icon name="chevron_right" color="grey-5" size="sm" />
      </q-card-section>
    </q-card>

    <!-- Queued Reports Section -->
    <template v-if="reportsStore.queuedReports.length > 0">
      <div class="text-subtitle1 q-mb-sm">{{ $t('reports.queuedReports') }}</div>
      <q-list bordered separator class="rounded-borders q-mb-lg">
        <q-item
          v-for="item in reportsStore.queuedReports"
          :key="item.id"
        >
          <q-item-section avatar>
            <q-icon name="menu_book" color="grey-6" />
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
      <q-card flat bordered class="text-center q-pa-xl">
        <q-icon name="summarize" size="52px" color="grey-4" />
        <div class="text-subtitle1 q-mt-md">{{ $t('reports.noReportsYet') }}</div>
        <div class="text-body2 text-grey-6 q-mt-xs q-mb-lg">{{ $t('reports.noReportsDesc') }}</div>
        <q-btn
          unelevated
          color="primary"
          :label="$t('reports.generateDietReport')"
          icon="add"
          @click="openGenerateDialog"
        />
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
            <q-icon name="menu_book" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ report.title }}</q-item-label>
            <q-item-label caption>{{ formatDate(report.created_at, 'PPp') }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-icon name="chevron_right" color="grey-5" />
          </q-item-section>
        </q-item>
      </q-list>
    </template>

    <!-- Generate Report Dialog -->
    <q-dialog v-model="showGenerateDialog" persistent>
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">{{ $t('reports.generateDietReport') }}</div>
        </q-card-section>

        <q-card-section>
          <!-- Cow Selection (required) -->
          <q-select
            v-model="selectedCowId"
            :label="$t('reports.selectCow')"
            outlined
            :options="cowOptions"
            emit-value
            map-options
            :rules="[val => !!val || $t('reports.cowRequired')]"
            class="q-mb-sm"
          />

          <!-- Diet info -->
          <q-banner
            v-if="selectedCowId && !cowHasDiet"
            class="bg-orange-1 text-orange-9 q-mb-sm rounded-borders"
            dense
          >
            <template #avatar>
              <q-icon name="warning" color="orange" />
            </template>
            {{ $t('reports.noDietAvailable') }}
          </q-banner>

          <q-banner
            v-if="selectedCowId && cowHasDiet && activeDietLabel"
            class="bg-green-1 text-green-9 q-mb-sm rounded-borders"
            dense
          >
            <template #avatar>
              <q-icon name="check_circle" color="green" />
            </template>
            {{ activeDietLabel }}
          </q-banner>

          <!-- Report Name -->
          <q-input
            v-model="reportName"
            :label="$t('reports.reportName')"
            outlined
            :placeholder="defaultReportName"
            class="q-mb-sm"
          />

          <!-- Date Range (for yield history) -->
          <div class="text-caption text-grey-7 q-mb-xs">{{ $t('reports.yieldHistoryRange') }}</div>
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-input
                v-model="reportParams.start_date"
                :label="$t('reports.startDate')"
                outlined
                dense
                readonly
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer" size="xs" @click="startDateRef?.open()">
                    <DatePickerPopup
                      ref="startDateRef"
                      v-model="reportParams.start_date"
                      mask="YYYY-MM-DD"
                    />
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-6">
              <q-input
                v-model="reportParams.end_date"
                :label="$t('reports.endDate')"
                outlined
                dense
                readonly
              >
                <template #append>
                  <q-icon name="event" class="cursor-pointer" size="xs" @click="endDateRef?.open()">
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
          <q-btn v-close-popup flat :label="$t('common.cancel')" />
          <q-btn
            flat
            :label="$t('reports.generate')"
            color="primary"
            :loading="generating"
            :disable="!selectedCowId || !cowHasDiet"
            @click="submitReport"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { format, subDays } from 'date-fns';
import { useCowsStore } from 'src/stores/cows';
import { useDietsStore } from 'src/stores/diets';
import { useReportsStore } from 'src/stores/reports';
import { useDateFormat } from 'src/composables/useDateFormat';
import { Report } from 'src/lib/offline/db';
import { isOnline } from 'src/boot/pwa';
import { extractUserFriendlyError } from 'src/lib/error-messages';
import SkeletonList from 'src/components/ui/SkeletonList.vue';
import DatePickerPopup from 'src/components/ui/DatePickerPopup.vue';

const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();
const cowsStore = useCowsStore();
const dietsStore = useDietsStore();
const reportsStore = useReportsStore();
const { formatDate } = useDateFormat();

const online = computed(() => isOnline.value);
const reports = ref<Report[]>([]);
const loading = ref(true);
const showGenerateDialog = ref(false);
const generating = ref(false);
const processingQueue = ref(false);
const reportName = ref('');
const selectedCowId = ref<string | null>(null);
const startDateRef = ref<InstanceType<typeof DatePickerPopup> | null>(null);
const endDateRef = ref<InstanceType<typeof DatePickerPopup> | null>(null);

const reportParams = reactive({
  start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  end_date: format(new Date(), 'yyyy-MM-dd'),
});

const cowOptions = computed(() =>
  cowsStore.activeCows.map((cow) => ({
    label: cow.name,
    value: cow.id,
  })),
);

/** Check if the selected cow has at least one saved/completed diet */
const cowHasDiet = computed(() => {
  if (!selectedCowId.value) return false;
  return dietsStore.diets.some(
    (d) => d.cow_id === selectedCowId.value && (d.status === 'completed' || d.is_active),
  );
});

/** Label for the active diet of the selected cow */
const activeDietLabel = computed(() => {
  if (!selectedCowId.value) return '';
  const diet = dietsStore.activeDiets[selectedCowId.value];
  if (diet) {
    return t('reports.usingActiveDiet', { date: formatDate(diet.created_at, 'PPp') });
  }
  // Fall back to most recent completed diet
  const recent = dietsStore.diets
    .filter((d) => d.cow_id === selectedCowId.value && d.status === 'completed')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  if (recent) {
    return t('reports.usingLatestDiet', { date: formatDate(recent.created_at, 'PPp') });
  }
  return '';
});

const defaultReportName = computed(() => {
  if (!selectedCowId.value) return t('reports.dietReport');
  const cow = cowsStore.activeCows.find((c) => c.id === selectedCowId.value);
  return cow ? `${cow.name} - ${t('reports.dietReport')}` : t('reports.dietReport');
});

function openGenerateDialog() {
  selectedCowId.value = null;
  reportName.value = '';
  showGenerateDialog.value = true;
}

async function submitReport() {
  if (!selectedCowId.value || !cowHasDiet.value) return;

  generating.value = true;

  try {
    const parameters = {
      cow_id: selectedCowId.value,
      start_date: reportParams.start_date,
      end_date: reportParams.end_date,
    };

    const title = reportName.value.trim() || defaultReportName.value;
    const result = await reportsStore.queueReportGeneration(
      'diet_summary',
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
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: extractUserFriendlyError(err),
    });
  } finally {
    generating.value = false;
  }
}

function viewReport(report: Report) {
  router.push(`/reports/${report.id}`);
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
  await dietsStore.fetchDiets();
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
.report-cta-card {
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
