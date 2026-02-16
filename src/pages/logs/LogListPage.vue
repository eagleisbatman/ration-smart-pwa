<template>
  <q-page class="q-pa-md">
    <PullToRefresh @refresh="onRefresh">
      <!-- Milk Trend Sparkline -->
      <MilkTrendSparkline v-if="logs.length > 0" :logs="logs" class="q-mb-md" />

      <!-- Detailed Milk Trends Panel (period toggle + per-cow breakdown) -->
      <MilkTrendsPanel
        v-if="logs.length > 0"
        @cow-click="(id: string) => router.push(`/cows/${id}`)"
      />

      <!-- Milk Price & Revenue Card -->
      <MilkPriceCard
        v-if="logs.length > 0"
        ref="milkPriceCardRef"
        :today-liters="todayTotal"
        :week-liters="weekTotal"
        class="q-mb-md"
      />

      <!-- Summary Stats -->
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-4">
          <div class="stat-inline">
            <div class="text-h6 text-primary">{{ todayTotal.toFixed(1) }}L</div>
            <div class="text-caption text-grey-7">{{ $t('logs.summary.today') }}</div>
          </div>
        </div>
        <div class="col-4">
          <div class="stat-inline">
            <div class="text-h6 text-secondary">{{ yesterdayTotal.toFixed(1) }}L</div>
            <div class="text-caption text-grey-7">{{ $t('logs.summary.yesterday') }}</div>
          </div>
        </div>
        <div class="col-4">
          <div class="stat-inline">
            <div class="text-h6 text-accent">{{ weekAvg.toFixed(1) }}L</div>
            <div class="text-caption text-grey-7">{{ $t('logs.summary.weekAvg') }}</div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col">
          <q-select
            v-model="selectedCow"
            :label="$t('logs.filter.byCow')"
            outlined
            dense
            :options="cowOptions"
            emit-value
            map-options
            clearable
          />
        </div>
        <div class="col-auto">
          <q-btn
            icon="calendar_today"
            flat
            round
            @click="showDatePicker = true"
          >
            <q-tooltip>{{ $t('logs.filter.selectDateRange') }}</q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Loading State -->
      <template v-if="loading && logs.length === 0">
        <SkeletonList :count="5" />
      </template>

      <!-- Empty State -->
      <template v-else-if="logs.length === 0">
        <EmptyState
          icon="water_drop"
          :title="$t('logs.empty.title')"
          :description="$t('logs.empty.description')"
          :action-label="$t('logs.empty.action')"
          action-icon="add"
          @action="router.push('/logs/new')"
        />
      </template>

      <!-- Logs List -->
      <template v-else>
        <!-- Grouped by Date -->
        <div v-for="(group, date) in groupedLogs" :key="date" class="q-mb-md">
          <div class="text-subtitle2 text-grey-7 q-mb-xs">{{ formatDateHeader(date) }}</div>
          <q-list bordered separator class="rounded-borders">
            <q-item
              v-for="log in group"
              :key="log.id"
              v-ripple
              clickable
              @click="editLog(log.id)"
            >
              <q-item-section avatar>
                <q-avatar color="primary" text-color="white">
                  <q-icon :name="COW_ICON" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  <div class="row items-center justify-between">
                    <span>{{ log.cow_name || $t('logs.labels.unknownCow') }}</span>
                    <q-chip
                      v-if="log.fed_diet === true"
                      dense
                      size="sm"
                      color="positive"
                      text-color="white"
                    >
                      {{ $t('logs.labels.fedDietBadge') }}
                    </q-chip>
                    <q-chip
                      v-else
                      dense
                      size="sm"
                      outline
                      color="grey"
                    >
                      {{ $t('logs.labels.noDietBadge') }}
                    </q-chip>
                  </div>
                </q-item-label>
                <q-item-label caption>
                  <span v-if="log.morning_liters">{{ $t('logs.labels.morning') }}: {{ log.morning_liters }}L</span>
                  <span v-if="log.evening_liters" class="q-ml-sm">{{ $t('logs.labels.evening') }}: {{ log.evening_liters }}L</span>
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <div class="column items-end">
                  <div class="row items-center">
                    <q-chip
                      v-if="!log._synced"
                      size="sm"
                      color="warning"
                      text-color="white"
                      icon="sync"
                      dense
                      class="q-mr-sm"
                    >
                      {{ $t('logs.labels.pending') }}
                    </q-chip>
                    <q-item-label class="text-h6 text-primary">{{ log.total_liters }}L</q-item-label>
                  </div>
                  <q-item-label
                    v-if="currentMilkPrice !== null"
                    caption
                    class="text-primary text-weight-medium"
                  >
                    {{ formatCurrency(log.total_liters * currentMilkPrice) }}
                  </q-item-label>
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </div>
      </template>
    </PullToRefresh>

    <!-- Date Range Picker Dialog -->
    <q-dialog v-model="showDatePicker">
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ $t('logs.dialog.selectDateRange') }}</div>
        </q-card-section>
        <q-card-section>
          <q-date
            v-model="dateRange"
            range
            mask="YYYY-MM-DD"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="$t('common.cancel')" />
          <q-btn v-close-popup flat :label="$t('logs.dialog.apply')" color="primary" @click="applyDateFilter" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Quick Log Dialog -->
    <QuickLogDialog v-model="showQuickLog" @saved="onQuickLogSaved" />

    <!-- FAB Speed Dial -->
    <q-page-sticky :position="rtl ? 'bottom-left' : 'bottom-right'" :offset="[16, 72]">
      <q-fab icon="add" direction="up" color="primary" :vertical-actions-align="rtl ? 'left' : 'right'">
        <q-fab-action
          color="secondary"
          icon="flash_on"
          :label="$t('logs.quickLog.button')"
          :label-position="rtl ? 'right' : 'left'"
          external-label
          @click="showQuickLog = true"
        />
        <q-fab-action
          color="primary"
          icon="edit_note"
          :label="$t('logs.empty.action')"
          :label-position="rtl ? 'right' : 'left'"
          external-label
          @click="router.push('/logs/new')"
        />
      </q-fab>
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { useMilkLogsStore } from 'src/stores/milkLogs';
import { useCowsStore } from 'src/stores/cows';
import PullToRefresh from 'src/components/ui/PullToRefresh.vue';
import { COW_ICON } from 'src/boot/icons';
import SkeletonList from 'src/components/ui/SkeletonList.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';
import QuickLogDialog from 'src/components/logs/QuickLogDialog.vue';
import MilkTrendSparkline from 'src/components/logs/MilkTrendSparkline.vue';
import MilkTrendsPanel from 'src/components/logs/MilkTrendsPanel.vue';
import MilkPriceCard from 'src/components/logs/MilkPriceCard.vue';
import { useCurrency } from 'src/composables/useCurrency';
import { isRTL } from 'src/boot/i18n';

const { t, locale } = useI18n();
const rtl = computed(() => isRTL(locale.value));
const router = useRouter();
const milkLogsStore = useMilkLogsStore();
const cowsStore = useCowsStore();
const { formatCurrency } = useCurrency();

const milkPriceCardRef = ref<InstanceType<typeof MilkPriceCard> | null>(null);

const currentMilkPrice = computed<number | null>(() => {
  return milkPriceCardRef.value?.milkPrice ?? null;
});

const selectedCow = ref<string | null>(null);
const showDatePicker = ref(false);
const showQuickLog = ref(false);
const dateRange = ref<{ from: string; to: string } | null>(null);

const loading = computed(() => milkLogsStore.loading);
const logs = computed(() => milkLogsStore.logs);
const todayTotal = computed(() => milkLogsStore.todayTotal);
const yesterdayTotal = computed(() => milkLogsStore.yesterdayTotal);
const weekTotal = computed(() => milkLogsStore.thisWeekSummary.total_liters);
const weekAvg = computed(() => milkLogsStore.thisWeekSummary.average_per_day);

const cowOptions = computed(() => [
  { label: t('logs.filter.allCows'), value: null },
  ...cowsStore.activeCows.map((cow) => ({
    label: cow.name,
    value: cow.id,
  })),
]);

const groupedLogs = computed(() => {
  const groups: Record<string, typeof logs.value> = {};

  for (const log of logs.value) {
    const date = log.log_date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
  }

  // Sort by date descending
  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
  const sortedGroups: Record<string, typeof logs.value> = {};
  for (const key of sortedKeys) {
    sortedGroups[key] = groups[key];
  }

  return sortedGroups;
});

function formatDateHeader(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return t('logs.dateHeader.today');
  if (isYesterday(date)) return t('logs.dateHeader.yesterday');
  return format(date, 'EEEE, MMMM d');
}

function editLog(id: string) {
  router.push(`/logs/${id}/edit`);
}

async function onRefresh(done: () => void) {
  await milkLogsStore.fetchLogs({ cow_id: selectedCow.value || undefined });
  done();
}

function applyDateFilter() {
  if (dateRange.value) {
    milkLogsStore.fetchLogs({
      cow_id: selectedCow.value || undefined,
      start_date: dateRange.value.from,
      end_date: dateRange.value.to,
    });
  }
}

async function onQuickLogSaved() {
  await milkLogsStore.fetchLogs({ cow_id: selectedCow.value || undefined });
}

// Watch for cow filter changes
watch(selectedCow, () => {
  milkLogsStore.fetchLogs({ cow_id: selectedCow.value || undefined });
});

onMounted(async () => {
  await cowsStore.fetchCows();
  await milkLogsStore.fetchLogs();
});
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: $radius-loose;
  overflow: hidden;
}
</style>
