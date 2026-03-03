<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card style="min-width: min(320px, 90vw); max-width: 420px; width: 90vw">
      <q-card-section>
        <div class="text-h6">{{ $t('simulation.constraints.title') }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none q-gutter-sm">
        <q-form ref="formRef">
          <q-input
            v-model.number="local.ndf_max"
            :label="$t('simulation.constraints.fiberNdf')"
            type="number"
            outlined
            dense
            :hint="$t('simulation.constraints.hintRange', { min: LIMITS.ndf_max.min, max: LIMITS.ndf_max.max })"
            :rules="[
              (v: number) => v == null || Number.isNaN(v) || v >= LIMITS.ndf_max.min || $t('simulation.validation.constraintMin'),
              (v: number) => v == null || Number.isNaN(v) || v <= LIMITS.ndf_max.max || $t('simulation.validation.constraintMax'),
            ]"
          />

          <q-input
            v-model.number="local.starch_max"
            :label="$t('simulation.constraints.starch')"
            type="number"
            outlined
            dense
            :hint="$t('simulation.constraints.hintRange', { min: LIMITS.starch_max.min, max: LIMITS.starch_max.max })"
            :rules="[
              (v: number) => v == null || Number.isNaN(v) || v >= LIMITS.starch_max.min || $t('simulation.validation.constraintMin'),
              (v: number) => v == null || Number.isNaN(v) || v <= LIMITS.starch_max.max || $t('simulation.validation.constraintMax'),
            ]"
          />

          <q-input
            v-model.number="local.ee_max"
            :label="$t('simulation.constraints.fatEe')"
            type="number"
            outlined
            dense
            :hint="$t('simulation.constraints.hintRange', { min: LIMITS.ee_max.min, max: LIMITS.ee_max.max })"
            :rules="[
              (v: number) => v == null || Number.isNaN(v) || v >= LIMITS.ee_max.min || $t('simulation.validation.constraintMin'),
              (v: number) => v == null || Number.isNaN(v) || v <= LIMITS.ee_max.max || $t('simulation.validation.constraintMax'),
            ]"
          />

          <q-input
            v-model.number="local.ash_max"
            :label="$t('simulation.constraints.ash')"
            type="number"
            outlined
            dense
            :hint="$t('simulation.constraints.hintRange', { min: LIMITS.ash_max.min, max: LIMITS.ash_max.max })"
            :rules="[
              (v: number) => v == null || Number.isNaN(v) || v >= LIMITS.ash_max.min || $t('simulation.validation.constraintMin'),
              (v: number) => v == null || Number.isNaN(v) || v <= LIMITS.ash_max.max || $t('simulation.validation.constraintMax'),
            ]"
          />
        </q-form>
      </q-card-section>

      <q-card-actions align="between">
        <q-btn flat no-caps color="grey-7" :label="$t('simulation.constraints.resetDefaults')" @click="resetDefaults" />
        <div>
          <q-btn flat no-caps v-close-popup :label="$t('common.cancel')" />
          <q-btn flat no-caps color="primary" :label="$t('common.save')" @click="save" />
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { QForm } from 'quasar';
import { useSimulationStore } from 'src/stores/simulation';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const store = useSimulationStore();
const formRef = ref<QForm | null>(null);

/** Single source of truth for constraint limits (used in both hints and rules). */
const LIMITS = {
  ndf_max: { min: 0, max: 100, default: 45 },
  starch_max: { min: 0, max: 30, default: 26 },
  ee_max: { min: 0, max: 7, default: 7 },
  ash_max: { min: 0, max: 15, default: 10 },
} as const;

const local = reactive({
  ndf_max: LIMITS.ndf_max.default as number | undefined,
  starch_max: LIMITS.starch_max.default as number | undefined,
  ee_max: LIMITS.ee_max.default as number | undefined,
  ash_max: LIMITS.ash_max.default as number | undefined,
});

// Sync from store when dialog opens
watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      local.ndf_max = store.customConstraints.ndf_max;
      local.starch_max = store.customConstraints.starch_max;
      local.ee_max = store.customConstraints.ee_max;
      local.ash_max = store.customConstraints.ash_max;
    }
  }
);

function resetDefaults() {
  local.ndf_max = LIMITS.ndf_max.default;
  local.starch_max = LIMITS.starch_max.default;
  local.ee_max = LIMITS.ee_max.default;
  local.ash_max = LIMITS.ash_max.default;
}

/** Coerce NaN (from cleared number inputs) to undefined. */
function finiteOrUndefined(v: number | undefined): number | undefined {
  return v != null && Number.isFinite(v) ? v : undefined;
}

async function save() {
  const valid = await formRef.value?.validate();
  if (!valid) return;
  store.customConstraints = {
    ndf_max: finiteOrUndefined(local.ndf_max),
    starch_max: finiteOrUndefined(local.starch_max),
    ee_max: finiteOrUndefined(local.ee_max),
    ash_max: finiteOrUndefined(local.ash_max),
  };
  emit('update:modelValue', false);
}
</script>
