<template>
  <q-drawer
    :model-value="modelValue"
    side="right"
    bordered
    overlay
    :width="360"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- Header -->
    <q-toolbar class="bg-primary text-white">
      <q-toolbar-title>{{ $t('syncHistory.title') }}</q-toolbar-title>
      <q-btn
        flat
        round
        dense
        icon="delete_sweep"
        :disable="entries.length === 0"
        @click="confirmClearHistory"
      >
        <q-tooltip>{{ $t('syncHistory.clearHistory') }}</q-tooltip>
      </q-btn>
      <q-btn
        flat
        round
        dense
        icon="close"
        @click="$emit('update:modelValue', false)"
      />
    </q-toolbar>

    <!-- Summary Stats -->
    <div class="row q-pa-sm q-gutter-sm">
      <q-chip
        color="positive"
        text-color="white"
        icon="check_circle"
        size="sm"
      >
        {{ syncedTodayCount }} {{ $t('syncHistory.syncedToday') }}
      </q-chip>
      <q-chip
        color="negative"
        text-color="white"
        icon="error"
        size="sm"
      >
        {{ failedTodayCount }} {{ $t('syncHistory.failedToday') }}
      </q-chip>
    </div>

    <q-separator />

    <!-- Filter: Entity Type -->
    <div class="q-px-sm q-pt-sm">
      <div class="text-caption text-grey-7 q-mb-xs">{{ $t('syncHistory.filterByType') }}</div>
      <div class="row q-gutter-xs">
        <q-chip
          v-for="typeOpt in entityTypeOptions"
          :key="typeOpt.value"
          :color="filterEntityType === typeOpt.value ? 'primary' : 'grey-3'"
          :text-color="filterEntityType === typeOpt.value ? 'white' : 'grey-8'"
          clickable
          size="sm"
          @click="filterEntityType = typeOpt.value"
        >
          {{ typeOpt.label }}
        </q-chip>
      </div>
    </div>

    <!-- Filter: Status -->
    <div class="q-px-sm q-pt-sm q-pb-xs">
      <div class="text-caption text-grey-7 q-mb-xs">{{ $t('syncHistory.filterByStatus') }}</div>
      <div class="row q-gutter-xs">
        <q-chip
          v-for="statusOpt in statusOptions"
          :key="statusOpt.value"
          :color="filterStatus === statusOpt.value ? 'primary' : 'grey-3'"
          :text-color="filterStatus === statusOpt.value ? 'white' : 'grey-8'"
          clickable
          size="sm"
          @click="filterStatus = statusOpt.value"
        >
          {{ statusOpt.label }}
        </q-chip>
      </div>
    </div>

    <q-separator />

    <!-- History List -->
    <q-scroll-area style="height: calc(100vh - 280px)">
      <!-- Empty State -->
      <div
        v-if="filteredEntries.length === 0 && !loading"
        class="column items-center justify-center q-pa-xl text-grey-5"
      >
        <q-icon name="history" size="64px" />
        <div class="text-subtitle1 q-mt-md">{{ $t('syncHistory.noHistory') }}</div>
      </div>

      <q-list v-else separator>
        <q-item
          v-for="entry in filteredEntries"
          :key="entry.id"
        >
          <!-- Status Icon -->
          <q-item-section avatar>
            <q-icon
              :name="getStatusIcon(entry.status)"
              :color="getStatusColor(entry.status)"
              size="sm"
            />
          </q-item-section>

          <q-item-section>
            <q-item-label class="row items-center q-gutter-xs">
              <q-icon
                :name="getEntityIcon(entry.entity_type)"
                size="16px"
                color="grey-7"
              />
              <span>{{ entry.entity_name || entry.entity_id }}</span>
            </q-item-label>
            <q-item-label caption>
              {{ $t(`syncHistory.action.${entry.action}`) }}
              &middot;
              {{ $t(`syncHistory.operation.${entry.operation}`) }}
              &middot;
              {{ formatRelativeTime(entry.timestamp) }}
            </q-item-label>
            <!-- Error message for failed entries -->
            <q-item-label
              v-if="entry.status === 'failed' && entry.error_message"
              caption
              class="text-negative q-mt-xs"
            >
              {{ entry.error_message }}
            </q-item-label>
          </q-item-section>

          <q-item-section side top>
            <q-badge
              :color="getStatusColor(entry.status)"
              :label="$t(`syncHistory.status.${entry.status}`)"
              outline
            />
          </q-item-section>
        </q-item>
      </q-list>

      <!-- Load More -->
      <div
        v-if="hasMore"
        class="row justify-center q-pa-md"
      >
        <q-btn
          flat
          color="primary"
          :label="$t('syncHistory.loadMore')"
          :loading="loading"
          @click="loadMore"
        />
      </div>
    </q-scroll-area>
  </q-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { getSyncHistory, clearSyncHistory } from 'src/lib/offline/sync-manager';
import type { SyncHistoryEntry, SyncQueueItem } from 'src/lib/offline/db';

const props = defineProps<{
  modelValue: boolean;
}>();

defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const $q = useQuasar();
const { t } = useI18n();

const entries = ref<SyncHistoryEntry[]>([]);
const loading = ref(false);
const currentLimit = ref(50);
const hasMore = ref(true);
const filterEntityType = ref<string>('all');
const filterStatus = ref<string>('all');

const entityTypeOptions = computed(() => [
  { value: 'all', label: t('syncHistory.all') },
  { value: 'cow', label: t('sync.conflict.entityTypes.cow') },
  { value: 'feed', label: t('sync.conflict.entityTypes.feed') },
  { value: 'diet', label: t('sync.conflict.entityTypes.diet') },
  { value: 'milk_log', label: t('sync.conflict.entityTypes.milk_log') },
  { value: 'farmer', label: t('sync.conflict.entityTypes.farmer') },
  { value: 'yield', label: t('sync.conflict.entityTypes.yield') },
]);

const statusOptions = computed(() => [
  { value: 'all', label: t('syncHistory.all') },
  { value: 'success', label: t('syncHistory.status.success') },
  { value: 'failed', label: t('syncHistory.status.failed') },
  { value: 'conflict', label: t('syncHistory.status.conflict') },
]);

const filteredEntries = computed(() => {
  return entries.value.filter((entry) => {
    if (filterEntityType.value !== 'all' && entry.entity_type !== filterEntityType.value) {
      return false;
    }
    if (filterStatus.value !== 'all' && entry.status !== filterStatus.value) {
      return false;
    }
    return true;
  });
});

const syncedTodayCount = computed(() => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();
  return entries.value.filter(
    (e) => e.status === 'success' && e.timestamp >= todayISO
  ).length;
});

const failedTodayCount = computed(() => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();
  return entries.value.filter(
    (e) => e.status === 'failed' && e.timestamp >= todayISO
  ).length;
});

function getStatusIcon(status: SyncHistoryEntry['status']): string {
  switch (status) {
    case 'success':
      return 'check_circle';
    case 'failed':
      return 'error';
    case 'conflict':
      return 'warning';
    default:
      return 'help';
  }
}

function getStatusColor(status: SyncHistoryEntry['status']): string {
  switch (status) {
    case 'success':
      return 'positive';
    case 'failed':
      return 'negative';
    case 'conflict':
      return 'amber';
    default:
      return 'grey';
  }
}

function getEntityIcon(entityType: SyncQueueItem['entity_type']): string {
  switch (entityType) {
    case 'cow':
      return 'pets';
    case 'feed':
      return 'grass';
    case 'diet':
      return 'restaurant_menu';
    case 'milk_log':
      return 'water_drop';
    case 'farmer':
      return 'agriculture';
    case 'yield':
      return 'trending_up';
    default:
      return 'sync';
  }
}

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return t('syncHistory.time.justNow');
  if (diffMin < 60) return t('syncHistory.time.minutesAgo', { n: diffMin });
  if (diffHr < 24) return t('syncHistory.time.hoursAgo', { n: diffHr });
  if (diffDay === 1) return t('syncHistory.time.yesterday');
  if (diffDay < 30) return t('syncHistory.time.daysAgo', { n: diffDay });
  return new Date(timestamp).toLocaleDateString();
}

async function loadEntries() {
  loading.value = true;
  try {
    const result = await getSyncHistory(currentLimit.value, 0);
    entries.value = result;
    hasMore.value = result.length === currentLimit.value;
  } catch (e) {
    console.error('Failed to load sync history:', e);
  } finally {
    loading.value = false;
  }
}

async function loadMore() {
  currentLimit.value += 50;
  await loadEntries();
}

function confirmClearHistory() {
  $q.dialog({
    title: t('syncHistory.clearHistory'),
    message: t('syncHistory.clearHistoryConfirm'),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    await clearSyncHistory();
    entries.value = [];
    hasMore.value = false;
    $q.notify({
      type: 'positive',
      message: t('syncHistory.cleared'),
      timeout: 2000,
    });
  });
}

// Load entries when drawer opens
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      currentLimit.value = 50;
      filterEntityType.value = 'all';
      filterStatus.value = 'all';
      loadEntries();
    }
  }
);

onMounted(() => {
  if (props.modelValue) {
    loadEntries();
  }
});
</script>
