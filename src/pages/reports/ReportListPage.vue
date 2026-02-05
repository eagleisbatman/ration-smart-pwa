<template>
  <q-page class="q-pa-md">
    <!-- Report Types -->
    <div class="text-subtitle1 q-mb-sm">Generate Report</div>
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

    <!-- Recent Reports -->
    <div class="text-subtitle1 q-mb-sm">Recent Reports</div>
    <template v-if="loading">
      <SkeletonList :count="3" />
    </template>
    <template v-else-if="reports.length === 0">
      <q-card flat bordered class="text-center q-pa-lg">
        <q-icon name="assessment" size="48px" color="grey-4" />
        <div class="text-body2 text-grey-7 q-mt-sm">No reports generated yet</div>
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
            <q-item-label caption>{{ formatDate(report.created_at) }}</q-item-label>
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
          <div class="text-h6">Generate {{ selectedReportType?.label }}</div>
        </q-card-section>

        <q-card-section>
          <q-select
            v-if="selectedReportType?.needsCow"
            v-model="reportParams.cow_id"
            label="Select Cow"
            outlined
            :options="cowOptions"
            emit-value
            map-options
          />

          <div class="row q-col-gutter-sm q-mt-sm">
            <div class="col-6">
              <q-input
                v-model="reportParams.start_date"
                label="Start Date"
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
                label="End Date"
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
          <q-btn v-close-popup flat label="Cancel" />
          <q-btn
            flat
            label="Generate"
            color="primary"
            :loading="generating"
            @click="submitReport"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { format, subDays } from 'date-fns';
import { api } from 'src/boot/axios';
import { useCowsStore } from 'src/stores/cows';
import { db, Report } from 'src/lib/offline/db';
import SkeletonList from 'src/components/ui/SkeletonList.vue';

const router = useRouter();
const $q = useQuasar();
const cowsStore = useCowsStore();

const reports = ref<Report[]>([]);
const loading = ref(true);
const showGenerateDialog = ref(false);
const generating = ref(false);
const selectedReportType = ref<typeof reportTypes[number] | null>(null);

const reportParams = reactive({
  cow_id: null as string | null,
  start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  end_date: format(new Date(), 'yyyy-MM-dd'),
});

const reportTypes = [
  { value: 'milk_production', label: 'Milk Production', icon: 'water_drop', color: 'primary', needsCow: false },
  { value: 'feed_consumption', label: 'Feed Consumption', icon: 'grass', color: 'secondary', needsCow: false },
  { value: 'cow_performance', label: 'Cow Performance', icon: 'pets', color: 'accent', needsCow: true },
  { value: 'cost_analysis', label: 'Cost Analysis', icon: 'savings', color: 'positive', needsCow: false },
];

const cowOptions = computed(() => [
  { label: 'All Cows', value: null },
  ...cowsStore.activeCows.map((cow) => ({
    label: cow.name,
    value: cow.id,
  })),
]);

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
}

function getReportIcon(type: string): string {
  const found = reportTypes.find((t) => t.value === type);
  return found?.icon || 'assessment';
}

function generateReport(type: string) {
  selectedReportType.value = reportTypes.find((t) => t.value === type) || null;
  showGenerateDialog.value = true;
}

async function submitReport() {
  if (!selectedReportType.value) return;

  generating.value = true;

  try {
    const response = await api.post('/api/v1/reports/generate', {
      report_type: selectedReportType.value.value,
      parameters: {
        cow_id: reportParams.cow_id,
        start_date: reportParams.start_date,
        end_date: reportParams.end_date,
      },
    });

    const report = response.data;
    await db.reports.put({
      ...report,
      _cached_at: new Date().toISOString(),
    });

    reports.value.unshift(report);
    showGenerateDialog.value = false;

    $q.notify({
      type: 'positive',
      message: 'Report generated successfully',
    });

    router.push(`/reports/${report.id}`);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Failed to generate report',
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
      message: 'Report is still being generated',
    });
  }
}

onMounted(async () => {
  await cowsStore.fetchCows();

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
</style>
