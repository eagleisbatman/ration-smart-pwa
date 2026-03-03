<template>
  <q-card v-if="hasData" flat bordered class="q-mb-md rounded-borders">
    <q-card-section>
      <div class="text-subtitle2 q-mb-sm">{{ $t('simulation.methane.title') }}</div>
      <div class="q-gutter-sm">
        <div v-for="metric in metrics" :key="metric.label">
          <div class="row items-center justify-between q-mb-xs">
            <span class="text-body2">{{ metric.label }}</span>
            <span class="text-body2 text-weight-medium">{{ metric.value }} {{ metric.unit }}</span>
          </div>
          <q-linear-progress
            :value="metric.progress"
            :color="metric.color"
            rounded
            size="8px"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

/* eslint-disable @typescript-eslint/no-explicit-any */
const props = defineProps<{
  data: Record<string, any> | null | undefined;
}>();

const { t } = useI18n();

const hasData = computed(() => {
  if (!props.data) return false;
  return props.data.methane_production != null || props.data.production != null;
});

/** Coerce to a finite number, defaulting to 0. */
function toNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

const metrics = computed(() => {
  const d = props.data;
  if (!d) return [];

  const production = toNum(d.methane_production ?? d.production);
  const yieldVal = toNum(d.methane_yield ?? d.yield);
  const intensity = toNum(d.methane_intensity ?? d.intensity);
  const conversion = toNum(d.energy_conversion_rate ?? d.conversion_rate);

  return [
    {
      label: t('simulation.methane.production'),
      value: production.toFixed(1),
      unit: t('simulation.methane.gPerDay'),
      progress: Math.min(production / 600, 1),
      color: 'green',
    },
    {
      label: t('simulation.methane.yield'),
      value: yieldVal.toFixed(1),
      unit: t('simulation.methane.gPerKgDmi'),
      progress: Math.min(yieldVal / 30, 1),
      color: 'teal',
    },
    {
      label: t('simulation.methane.intensity'),
      value: intensity.toFixed(1),
      unit: t('simulation.methane.gPerKgMilk'),
      progress: Math.min(intensity / 40, 1),
      color: 'orange',
    },
    {
      label: t('simulation.methane.conversionRate'),
      value: conversion.toFixed(1),
      unit: t('simulation.methane.percent'),
      progress: Math.min(conversion / 10, 1),
      color: 'deep-purple',
    },
  ];
});
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: $radius-loose;
  overflow: hidden;
}
</style>
