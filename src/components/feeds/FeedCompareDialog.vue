<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card>
      <q-card-section class="row items-center">
        <div class="text-h6">{{ $t('feed.compareFeeds') }}</div>
        <q-space />
        <q-btn flat round dense icon="close" @click="$emit('update:modelValue', false)" />
      </q-card-section>

      <q-card-section v-if="feedA && feedB" class="q-pt-none">
        <!-- Feed Names Header -->
        <div class="row q-mb-md text-center">
          <div class="col-4 text-caption text-grey-7"></div>
          <div class="col-4">
            <q-avatar color="primary" text-color="white" size="36px" class="q-mb-xs">
              <q-icon name="grass" />
            </q-avatar>
            <div class="text-subtitle2 ellipsis">{{ feedA.name }}</div>
            <div class="text-caption text-grey-6">{{ feedA.category }}</div>
          </div>
          <div class="col-4">
            <q-avatar color="secondary" text-color="white" size="36px" class="q-mb-xs">
              <q-icon name="grass" />
            </q-avatar>
            <div class="text-subtitle2 ellipsis">{{ feedB.name }}</div>
            <div class="text-caption text-grey-6">{{ feedB.category }}</div>
          </div>
        </div>

        <!-- Comparison Rows -->
        <q-list dense separator>
          <q-item v-for="metric in metrics" :key="metric.key">
            <q-item-section class="col-4">
              <q-item-label class="text-caption text-grey-7">{{ metric.label }}</q-item-label>
            </q-item-section>
            <q-item-section class="col-4 text-center">
              <q-item-label
                :class="{
                  'text-weight-bold text-positive': metric.betterA
                }"
              >
                {{ metric.valueA }}
                <q-badge v-if="metric.betterA" color="positive" class="q-ml-xs" dense>
                  {{ $t('feed.better') }}
                </q-badge>
              </q-item-label>
            </q-item-section>
            <q-item-section class="col-4 text-center">
              <q-item-label
                :class="{
                  'text-weight-bold text-positive': metric.betterB
                }"
              >
                {{ metric.valueB }}
                <q-badge v-if="metric.betterB" color="positive" class="q-ml-xs" dense>
                  {{ $t('feed.better') }}
                </q-badge>
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-section v-else class="text-center text-grey-6 q-py-xl">
        {{ $t('feed.selectToCompare') }}
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Feed } from 'src/lib/offline/db';
import { useCurrency } from 'src/composables/useCurrency';

const { t } = useI18n();
const { formatCurrency } = useCurrency();

const props = defineProps<{
  modelValue: boolean;
  feedA: Feed | null;
  feedB: Feed | null;
}>();

defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

interface MetricRow {
  key: string;
  label: string;
  valueA: string;
  valueB: string;
  betterA: boolean;
  betterB: boolean;
}

const metrics = computed<MetricRow[]>(() => {
  const a = props.feedA;
  const b = props.feedB;
  if (!a || !b) return [];

  function higherIsBetter(label: string, valA: number | undefined, valB: number | undefined, suffix = '%'): MetricRow {
    const nA = valA ?? 0;
    const nB = valB ?? 0;
    return {
      key: label,
      label,
      valueA: nA.toFixed(1) + suffix,
      valueB: nB.toFixed(1) + suffix,
      betterA: nA > nB && nA !== nB,
      betterB: nB > nA && nA !== nB,
    };
  }

  function lowerIsBetter(label: string, valA: number | undefined, valB: number | undefined): MetricRow {
    const nA = valA ?? 0;
    const nB = valB ?? 0;
    const hasA = valA != null && valA > 0;
    const hasB = valB != null && valB > 0;
    return {
      key: label,
      label,
      valueA: hasA ? formatCurrency(nA) + t('units.perKg') : '-',
      valueB: hasB ? formatCurrency(nB) + t('units.perKg') : '-',
      betterA: hasA && hasB && nA < nB,
      betterB: hasA && hasB && nB < nA,
    };
  }

  return [
    higherIsBetter(t('feed.labels.dmPercentShort'), a.dm_percentage, b.dm_percentage),
    higherIsBetter(t('feed.labels.cpPercentShort'), a.cp_percentage, b.cp_percentage),
    higherIsBetter(t('feed.labels.tdnPercentShort'), a.tdn_percentage, b.tdn_percentage),
    lowerIsBetter(t('feed.pricePerKg'), a.price_per_kg, b.price_per_kg),
  ];
});
</script>
