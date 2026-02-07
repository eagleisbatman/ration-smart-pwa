<template>
  <q-chip
    :color="syncStatusColor"
    text-color="white"
    :icon="syncStatusIcon"
    size="sm"
    dense
    clickable
    @click="manualSync"
  >
    {{ syncStatusText }}
    <q-tooltip v-if="lastSyncTime">
      {{ $t('sync.lastSynced', { time: formatLastSync }) }}
    </q-tooltip>
  </q-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatDistanceToNow } from 'date-fns';
import { useI18n } from 'vue-i18n';
import { useOfflineSync } from 'src/composables/useOfflineSync';

const { t } = useI18n();
const {
  syncStatusText,
  syncStatusIcon,
  syncStatusColor,
  lastSyncTime,
  manualSync,
} = useOfflineSync();

const formatLastSync = computed(() => {
  if (!lastSyncTime.value) return t('sync.never');
  return formatDistanceToNow(lastSyncTime.value, { addSuffix: true });
});
</script>
