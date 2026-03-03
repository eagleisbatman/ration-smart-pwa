<template>
  <q-dialog
    :model-value="modelValue"
    position="bottom"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card style="width: 100%; max-width: 500px; max-height: 80vh">
      <q-card-section class="row items-center q-pb-none">
        <q-icon name="history" size="sm" color="primary" class="q-mr-sm" />
        <div class="text-h6">{{ $t('simulation.history') }}</div>
        <q-space />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-sm" style="overflow-y: auto; max-height: 60vh">
        <!-- Loading -->
        <template v-if="loading">
          <q-skeleton v-for="i in 4" :key="i" height="60px" class="q-mb-sm rounded-borders" />
        </template>

        <!-- Error -->
        <template v-else-if="store.error">
          <div class="text-center q-pa-lg">
            <q-icon name="error_outline" size="48px" color="negative" />
            <div class="text-body1 text-grey-7 q-mt-sm">{{ store.error }}</div>
          </div>
        </template>

        <!-- Empty -->
        <template v-else-if="store.simulationHistory.length === 0">
          <div class="text-center q-pa-lg">
            <q-icon name="history" size="48px" color="grey-4" />
            <div class="text-body1 text-grey-7 q-mt-sm">{{ $t('simulation.historyEmpty') }}</div>
            <div class="text-caption text-grey-5">{{ $t('simulation.historyEmptyDesc') }}</div>
          </div>
        </template>

        <!-- List -->
        <template v-else>
          <q-list separator>
            <q-item
              v-for="item in store.simulationHistory"
              :key="item.report_id"
              v-ripple
              clickable
              :disable="restoring"
              @click="onRestore(item.report_id)"
            >
              <q-item-section avatar>
                <q-avatar
                  :color="item.report_type === 'rec' ? 'primary' : 'secondary'"
                  text-color="white"
                  size="40px"
                >
                  <q-icon :name="item.report_type === 'rec' ? 'auto_fix_high' : 'assessment'" />
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label>
                  {{ item.report_name || item.report_type_display }}
                </q-item-label>
                <q-item-label caption>
                  {{ item.cattle_summary?.breed || '–' }}
                  · {{ item.cattle_summary?.body_weight ?? '–' }}{{ $t('common.units.kg') }}
                  · {{ item.cattle_summary?.milk_production ?? '–' }}{{ $t('common.units.litersPerDay') }}
                </q-item-label>
                <q-item-label caption class="text-grey-5">
                  {{ formatDate(item.created_at) }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-icon name="chevron_right" color="grey-5" />
              </q-item-section>
            </q-item>
          </q-list>
        </template>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useSimulationStore } from 'src/stores/simulation';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'restored'): void;
}>();

const $q = useQuasar();
const store = useSimulationStore();
const loading = ref(false);
const restoring = ref(false);

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      loading.value = true;
      await store.fetchSimulationHistory();
      loading.value = false;
    }
  }
);

async function onRestore(reportId: string) {
  restoring.value = true;
  const ok = await store.restoreSimulation(reportId);
  restoring.value = false;
  if (ok) {
    emit('restored');
  } else if (store.error) {
    $q.notify({ type: 'negative', message: store.error });
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
</script>
