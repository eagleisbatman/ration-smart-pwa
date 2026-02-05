<template>
  <q-pull-to-refresh :color="color" @refresh="onRefresh">
    <slot />
  </q-pull-to-refresh>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    color?: string;
  }>(),
  {
    color: 'primary',
  }
);

const emit = defineEmits<{
  refresh: [done: () => void];
}>();

function onRefresh(done: () => void) {
  emit('refresh', done);
}
</script>
