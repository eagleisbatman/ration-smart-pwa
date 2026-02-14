<template>
  <q-popup-proxy
    v-if="!isMobile"
    cover
    transition-show="scale"
    transition-hide="scale"
  >
    <q-date
      :model-value="modelValue"
      :mask="mask"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <div class="row items-center justify-end">
        <q-btn v-close-popup flat :label="$t('common.close')" color="primary" />
      </div>
    </q-date>
  </q-popup-proxy>

  <template v-else>
    <q-dialog v-model="dialogOpen">
      <q-date
        :model-value="modelValue"
        :mask="mask"
        @update:model-value="onMobileSelect"
      >
        <div class="row items-center justify-end">
          <q-btn v-close-popup flat :label="$t('common.close')" color="primary" />
        </div>
      </q-date>
    </q-dialog>
  </template>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const isMobile = computed(() => $q.screen.lt.sm);
const dialogOpen = ref(false);

defineProps<{
  modelValue: string;
  mask?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'open'): void;
}>();

function onMobileSelect(value: string) {
  emit('update:modelValue', value);
}

function open() {
  dialogOpen.value = true;
}

defineExpose({ open });
</script>
