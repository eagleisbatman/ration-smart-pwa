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
      Last synced: {{ formatLastSync }}
    </q-tooltip>
  </q-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatDistanceToNow } from 'date-fns';
import { useOfflineSync } from 'src/composables/useOfflineSync';

const {
  syncStatusText,
  syncStatusIcon,
  syncStatusColor,
  lastSyncTime,
  manualSync,
} = useOfflineSync();

const formatLastSync = computed(() => {
  if (!lastSyncTime.value) return 'Never';
  return formatDistanceToNow(lastSyncTime.value, { addSuffix: true });
});
</script>
