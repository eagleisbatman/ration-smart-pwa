<template>
  <q-dialog v-model="showPrompt" persistent>
    <q-card class="a2hs-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Install RationSmart</div>
        <q-space />
        <q-btn v-close-popup icon="close" flat round dense @click="dismiss" />
      </q-card-section>

      <q-card-section class="text-center q-pt-md">
        <q-avatar size="72px" class="q-mb-md">
          <img src="/icons/icon-192x192.png" alt="RationSmart" />
        </q-avatar>

        <p class="text-body1 q-mb-md">
          Install RationSmart on your device for quick access and offline use.
        </p>

        <!-- iOS Instructions -->
        <div v-if="isIOS" class="ios-instructions">
          <p class="text-body2 text-grey-7 q-mb-sm">To install on iOS:</p>
          <ol class="text-left text-body2">
            <li>
              Tap the Share button
              <q-icon name="ios_share" size="18px" class="q-ml-xs" />
            </li>
            <li>Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add" to confirm</li>
          </ol>
        </div>
      </q-card-section>

      <q-card-actions align="center" class="q-pb-md">
        <template v-if="!isIOS">
          <q-btn
            v-close-popup
            label="Not Now"
            flat
            color="grey"
            @click="dismiss"
          />
          <q-btn
            label="Install"
            color="primary"
            unelevated
            :loading="installing"
            @click="install"
          />
        </template>
        <template v-else>
          <q-btn v-close-popup label="Got it" color="primary" unelevated @click="dismiss" />
        </template>
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Mini banner for later prompting -->
  <transition name="slide-up">
    <div
      v-if="showBanner && !showPrompt"
      class="a2hs-banner"
      @click="showPrompt = true"
    >
      <q-icon name="download" class="q-mr-sm" />
      <span>Install app for better experience</span>
      <q-btn
        icon="close"
        flat
        round
        dense
        size="sm"
        class="q-ml-auto"
        @click.stop="dismissBanner"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { canInstall, isInstalled, installPWA } from 'src/boot/pwa';
import { db } from 'src/lib/offline/db';

const showPrompt = ref(false);
const showBanner = ref(false);
const installing = ref(false);

const isIOS = computed(() => {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream;
});

const shouldShow = computed(() => {
  return (canInstall.value || isIOS.value) && !isInstalled.value;
});

onMounted(async () => {
  // Check if user previously dismissed
  const dismissed = await db.getSetting('a2hs_dismissed', false);
  const dismissedAt = await db.getSetting<string | null>('a2hs_dismissed_at', null);

  // Show again after 7 days
  const showAgain = dismissedAt
    ? Date.now() - new Date(dismissedAt).getTime() > 7 * 24 * 60 * 60 * 1000
    : true;

  if (shouldShow.value && (!dismissed || showAgain)) {
    // Delay showing prompt for better UX
    setTimeout(() => {
      showBanner.value = true;
    }, 30000); // Show after 30 seconds of usage

    // Show full prompt after more engagement
    setTimeout(() => {
      if (shouldShow.value && showBanner.value) {
        showPrompt.value = true;
        showBanner.value = false;
      }
    }, 120000); // Show after 2 minutes
  }
});

async function install() {
  installing.value = true;
  const success = await installPWA();
  installing.value = false;

  if (success) {
    showPrompt.value = false;
    showBanner.value = false;
  }
}

async function dismiss() {
  await db.setSetting('a2hs_dismissed', true);
  await db.setSetting('a2hs_dismissed_at', new Date().toISOString());
  showPrompt.value = false;
  showBanner.value = false;
}

function dismissBanner() {
  showBanner.value = false;
}

// Expose for parent component to trigger
defineExpose({
  show: () => {
    if (shouldShow.value) {
      showPrompt.value = true;
    }
  },
});
</script>

<style lang="scss" scoped>
.a2hs-card {
  max-width: 340px;
  border-radius: 16px;
}

.ios-instructions {
  background: $grey-2;
  border-radius: 12px;
  padding: 16px;

  ol {
    margin: 0;
    padding-left: 20px;

    li {
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.a2hs-banner {
  position: fixed;
  bottom: 80px;
  left: 16px;
  right: 16px;
  background: $primary;
  color: white;
  padding: 12px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
