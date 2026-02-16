<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card class="update-card">
      <q-card-section class="text-center">
        <q-icon name="system_update" size="56px" color="primary" class="q-mb-md" />
        <div class="text-h6 q-mb-sm">{{ $t('pwa.updateAvailable') }}</div>
        <p class="text-body2 text-grey-7">
          {{ $t('pwa.updatePrompt') }}
        </p>
      </q-card-section>

      <q-card-actions align="center" class="q-pb-md">
        <q-btn :label="$t('pwa.later')" flat color="grey" @click="postpone" />
        <q-btn
          :label="$t('pwa.updateNow')"
          color="primary"
          unelevated
          :loading="updating"
          @click="update"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Subtle banner when update is available but dialog dismissed -->
  <transition name="slide-down">
    <div v-if="showBanner" class="update-banner" @click="showDialog = true">
      <q-icon name="update" class="q-mr-sm" />
      <span>{{ $t('pwa.updateBanner') }}</span>
      <q-btn
        icon="refresh"
        flat
        round
        dense
        size="sm"
        class="q-ml-auto"
        @click.stop="update"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { updateAvailable, applyUpdate } from 'src/boot/pwa';

const POSTPONE_KEY = 'update_postponed_at';
const POSTPONE_TTL = 30 * 60 * 1000; // Re-show after 30 minutes

const showDialog = ref(false);
const showBanner = ref(false);
const updating = ref(false);

function isPostponed(): boolean {
  const ts = localStorage.getItem(POSTPONE_KEY);
  if (!ts) return false;
  return Date.now() - Number(ts) < POSTPONE_TTL;
}

// Watch for update availability
watch(
  () => updateAvailable.value,
  (available) => {
    if (available && !isPostponed()) {
      showDialog.value = true;
    } else if (available) {
      showBanner.value = true;
    }
  },
  { immediate: true }
);

onMounted(() => {
  // If update was previously postponed but TTL expired, show dialog
  if (updateAvailable.value && !isPostponed() && !showDialog.value) {
    showDialog.value = true;
  }
});

function update() {
  updating.value = true;
  localStorage.removeItem(POSTPONE_KEY);
  applyUpdate();
  // The page will reload automatically when controller changes
}

function postpone() {
  localStorage.setItem(POSTPONE_KEY, String(Date.now()));
  showDialog.value = false;
  showBanner.value = true;
}
</script>

<style lang="scss" scoped>
.update-card {
  max-width: 320px;
  border-radius: $radius-dialog;
}

.update-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: $primary;
  color: white;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  z-index: 2000;
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
