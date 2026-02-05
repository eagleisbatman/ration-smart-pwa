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
          <div class="text-caption text-grey-7">{{ formatDate(report.created_at) }}</div>
        </q-card-section>
      </q-card>

      <!-- Download Button -->
      <q-btn
        v-if="report.file_url"
        label="Download PDF"
        icon="download"
        color="primary"
        class="full-width q-mb-md"
        unelevated
        @click="downloadReport"
      />

      <!-- Report Preview (if available) -->
      <q-card v-if="report.file_url" flat bordered>
        <q-card-section>
          <div class="text-center q-pa-xl">
            <q-icon name="picture_as_pdf" size="64px" color="negative" />
            <div class="text-body1 q-mt-md">PDF Report Ready</div>
            <div class="text-caption text-grey-7">
              Click "Download PDF" to view the full report
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Parameters -->
      <div class="text-subtitle1 q-mt-md q-mb-sm">Report Parameters</div>
      <q-card flat bordered>
        <q-list separator>
          <q-item>
            <q-item-section>
              <q-item-label caption>Report Type</q-item-label>
              <q-item-label class="text-capitalize">{{ report.report_type.replace('_', ' ') }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-if="params.start_date">
            <q-item-section>
              <q-item-label caption>Date Range</q-item-label>
              <q-item-label>{{ params.start_date }} to {{ params.end_date }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-if="params.cow_id">
            <q-item-section>
              <q-item-label caption>Cow</q-item-label>
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
        title="Report Not Found"
        description="The report you're looking for doesn't exist."
        action-label="Go Back"
        @action="router.back()"
      />
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const router = useRouter();
import { format } from 'date-fns';
import { api } from 'src/boot/axios';
import { db, Report } from 'src/lib/offline/db';
import SkeletonCard from 'src/components/ui/SkeletonCard.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';

const route = useRoute();

const reportId = computed(() => route.params.id as string);
const report = ref<Report | null>(null);
const loading = ref(true);

const params = computed(() => (report.value?.parameters as Record<string, string>) || {});

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMMM d, yyyy h:mm a');
}

function downloadReport() {
  if (report.value?.file_url) {
    window.open(report.value.file_url, '_blank');
  }
}

onMounted(async () => {
  loading.value = true;

  // Try to get from API first
  try {
    const response = await api.get(`/api/v1/reports/${reportId.value}`);
    report.value = response.data;
    await db.reports.put({
      ...response.data,
      _cached_at: new Date().toISOString(),
    });
  } catch {
    // Fallback to cache
    report.value = await db.reports.get(reportId.value) || null;
  }

  loading.value = false;
});
</script>
