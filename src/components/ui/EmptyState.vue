<template>
  <div class="empty-state text-center q-pa-xl">
    <q-icon :name="icon" size="80px" :color="iconColor" class="q-mb-md" />

    <div class="text-h6 q-mb-sm">{{ title }}</div>

    <p class="text-body2 text-grey-7 q-mb-lg" style="max-width: 280px; margin: 0 auto">
      {{ description }}
    </p>

    <q-btn
      v-if="actionLabel"
      :label="actionLabel"
      :icon="actionIcon"
      color="primary"
      unelevated
      @click="$emit('action')"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon: string;
    iconColor?: string;
    title: string;
    description: string;
    actionLabel?: string;
    actionIcon?: string;
  }>(),
  {
    iconColor: 'grey-5',
  }
);

defineEmits<{
  action: [];
}>();
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}
</style>
