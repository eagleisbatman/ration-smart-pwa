<template>
  <q-page padding>
    <!-- Loading -->
    <template v-if="adminStore.loading && reports.length === 0">
      <q-skeleton v-for="i in 5" :key="i" height="64px" class="q-mb-sm" />
    </template>

    <!-- Report List -->
    <q-card v-else-if="reports.length > 0" flat bordered>
      <q-list separator>
        <q-item v-for="(rpt, idx) in reports" :key="idx">
          <q-item-section avatar>
            <q-avatar
              :color="rpt.report_type === 'rec' ? 'primary' : 'secondary'"
              text-color="white"
              size="36px"
            >
              <q-icon :name="rpt.report_type === 'rec' ? 'auto_fix_high' : 'assessment'" size="18px" />
            </q-avatar>
          </q-item-section>
          <q-item-section>
            <q-item-label>
              {{ rpt.report_name || rpt.report_id }}
            </q-item-label>
            <q-item-label caption>
              {{ rpt.user_name || 'Unknown user' }} · {{ formatDate(String(rpt.created_at || '')) }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              v-if="rpt.bucket_url"
              flat
              round
              dense
              icon="download"
              color="primary"
              @click.stop="downloadReport(String(rpt.bucket_url))"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <!-- Empty -->
    <div v-else class="text-center q-pa-lg text-grey-5">
      {{ $t('admin.reports.noReports') }}
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex flex-center q-mt-md">
      <q-pagination v-model="page" :max="totalPages" direction-links boundary-links />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useAdminStore } from 'src/stores/admin';

const adminStore = useAdminStore();
const reports = ref<Record<string, unknown>[]>([]);
const page = ref(1);
const totalPages = ref(1);

async function loadReports() {
  const result = await adminStore.fetchAllReports(page.value);
  reports.value = result.reports;
  totalPages.value = Math.max(1, Math.ceil(result.total / 25));
}

watch(page, () => loadReports());
onMounted(loadReports);

function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function downloadReport(url: string) {
  window.open(url, '_blank');
}
</script>
