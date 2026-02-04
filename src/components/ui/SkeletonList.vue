<template>
  <div class="skeleton-list">
    <q-item v-for="i in count" :key="i" class="q-py-md">
      <q-item-section avatar v-if="showAvatar">
        <q-skeleton type="QAvatar" size="48px" />
      </q-item-section>

      <q-item-section>
        <q-item-label>
          <q-skeleton type="text" width="70%" />
        </q-item-label>
        <q-item-label caption v-if="showCaption">
          <q-skeleton type="text" width="50%" />
        </q-item-label>
      </q-item-section>

      <q-item-section side v-if="showSide">
        <q-skeleton type="text" width="40px" />
      </q-item-section>
    </q-item>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number;
    showAvatar?: boolean;
    showCaption?: boolean;
    showSide?: boolean;
  }>(),
  {
    count: 5,
    showAvatar: true,
    showCaption: true,
    showSide: false,
  }
);
</script>
