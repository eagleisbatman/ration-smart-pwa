<template>
  <q-card flat bordered class="q-mb-md rounded-borders">
    <q-card-section>
      <div class="text-subtitle2 q-mb-sm">{{ $t('simulation.animalSummary.title') }}</div>
      <div class="row q-col-gutter-sm">
        <div class="col-6" v-for="item in items" :key="item.label">
          <div class="text-caption text-grey-6">{{ item.label }}</div>
          <div class="text-body2 text-weight-medium">{{ item.value }}</div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { CattleInfoForm } from 'src/stores/simulation';

const props = defineProps<{
  cattleInfo: CattleInfoForm;
}>();

const { t } = useI18n();

function translateTopography(value: string): string {
  if (!value) return '–';
  const key = `simulation.topographyOptions.${value.toLowerCase()}`;
  const result = t(key);
  return result !== key ? result : value;
}

const items = computed(() => {
  const c = props.cattleInfo;
  const list = [
    { label: t('simulation.fields.breed'), value: c.breed || '–' },
    { label: t('simulation.fields.bodyWeight'), value: `${c.body_weight} ${t('common.units.kg')}` },
    { label: t('simulation.fields.bcScore'), value: c.bc_score },
    { label: t('simulation.fields.lactating'), value: c.lactating ? t('common.yes') : t('common.no') },
    { label: t('simulation.fields.milkProduction'), value: c.lactating ? `${c.milk_production} ${t('common.units.litersPerDay')}` : '–' },
    { label: t('simulation.fields.daysInMilk'), value: c.lactating ? c.days_in_milk : '–' },
  ];
  if (c.lactating) {
    list.push(
      { label: t('simulation.fields.fatMilk'), value: `${c.fat_milk}%` },
      { label: t('simulation.fields.tpMilk'), value: `${c.tp_milk}%` },
    );
  }
  list.push(
    { label: t('simulation.fields.parity'), value: c.parity },
    { label: t('simulation.fields.daysOfPregnancy'), value: c.days_of_pregnancy > 0 ? c.days_of_pregnancy : '–' },
    { label: t('simulation.fields.temperature'), value: `${c.temperature}°C` },
    { label: t('simulation.fields.topography'), value: translateTopography(c.topography) },
  );
  return list;
});
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: $radius-loose;
  overflow: hidden;
}
</style>
