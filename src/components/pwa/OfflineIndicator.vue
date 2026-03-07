<template>
  <transition name="slide-down">
    <div v-if="!isOnline" class="offline-indicator" role="alert">
      <q-icon name="cloud_off" class="q-mr-sm" />
      <span>{{ $t('offline.youAreOffline') }}</span>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useNetworkStatus } from 'src/composables/useNetworkStatus';

const { isOnline } = useNetworkStatus();
</script>

<style lang="scss" scoped>
.offline-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: $grey-8;
  color: white;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2001;
  font-size: 14px;
  padding-top: calc(8px + env(safe-area-inset-top));
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
}
</style>
