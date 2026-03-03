<template>
  <q-card flat bordered class="q-mb-md rounded-borders">
    <q-card-section class="row items-center">
      <q-avatar :color="statusColor" text-color="white" size="40px">
        <q-icon :name="statusIcon" />
      </q-avatar>
      <div class="q-ml-md">
        <div class="text-subtitle2">{{ $t('simulation.recommendation.dietStatus') }}</div>
        <div class="text-body1 text-weight-medium" :class="`text-${statusColor}`">
          {{ statusLabel }}
        </div>
        <div v-if="message" class="text-caption text-grey-6">{{ message }}</div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  status: string; // PERFECT | GOOD | MARGINAL | INFEASIBLE
  message?: string;
}>();

const statusColor = computed(() => {
  switch (props.status?.toUpperCase()) {
    case 'PERFECT': return 'positive';
    case 'GOOD': return 'positive';
    case 'MARGINAL': return 'warning';
    case 'INFEASIBLE': return 'negative';
    default: return 'grey';
  }
});

const statusIcon = computed(() => {
  switch (props.status?.toUpperCase()) {
    case 'PERFECT': return 'check_circle';
    case 'GOOD': return 'thumb_up';
    case 'MARGINAL': return 'warning';
    case 'INFEASIBLE': return 'error';
    default: return 'help';
  }
});

const STATUS_I18N_MAP: Record<string, string> = {
  PERFECT: 'simulation.status.perfect',
  GOOD: 'simulation.status.good',
  MARGINAL: 'simulation.status.marginal',
  INFEASIBLE: 'simulation.status.infeasible',
};

const statusLabel = computed(() => {
  const key = STATUS_I18N_MAP[props.status?.toUpperCase()];
  return key ? t(key) : (props.status || t('common.unknown'));
});
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: $radius-loose;
  overflow: hidden;
}
</style>
