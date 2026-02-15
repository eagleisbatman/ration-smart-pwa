<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

// Fix Quasar dialog backdrop accessibility warning:
// Quasar sets tabindex="-1" on aria-hidden="true" backdrops, which
// violates WCAG and triggers console warnings.
let observer: MutationObserver | null = null;

onMounted(() => {
  observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node instanceof HTMLElement && node.classList.contains('q-dialog__backdrop')) {
          node.removeAttribute('tabindex');
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
});

onUnmounted(() => {
  observer?.disconnect();
});
</script>
