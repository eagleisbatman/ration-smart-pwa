<template>
  <q-card class="skeleton-card" flat bordered>
    <q-card-section>
      <div class="row items-center q-mb-md">
        <q-skeleton type="QAvatar" size="40px" />
        <div class="col q-ml-md">
          <q-skeleton type="text" width="60%" />
          <q-skeleton type="text" width="40%" class="q-mt-xs" />
        </div>
      </div>

      <q-skeleton type="text" />
      <q-skeleton type="text" width="80%" />

      <div v-if="showActions" class="row q-mt-md q-gutter-sm">
        <q-skeleton type="QBtn" width="80px" />
        <q-skeleton type="QBtn" width="80px" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
defineProps<{
  showActions?: boolean;
}>();
</script>

<style lang="scss" scoped>
.skeleton-card {
  border-radius: $radius-loose;
}
</style>
