<template>
  <q-layout view="lHh Lpr lff" class="auth-layout">
    <q-page-container>
      <q-page class="flex flex-center q-pa-md">
        <div :class="['auth-wrapper', { 'auth-wrapper--wide': isOnboarding }]">
          <!-- Logo floating above the card -->
          <div class="auth-logo-section">
            <q-avatar size="72px" color="primary" text-color="white" class="auth-logo">
              <q-icon :name="cowIcon" size="40px" />
            </q-avatar>
          </div>

          <!-- Card container -->
          <div class="auth-container">
            <!-- Branding text -->
            <div class="text-center q-mb-lg">
              <h1 class="text-h5 text-weight-bold q-mb-none">{{ $t('app.name') }}</h1>
              <p class="text-body2 text-grey-6 q-mb-none">
                {{ $t('app.tagline') }}
              </p>
            </div>

            <!-- Page Content -->
            <router-view v-slot="{ Component }">
              <transition name="slide" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useCowIcon } from 'src/composables/useCowIcon';

const route = useRoute();
const { cowIcon } = useCowIcon();

const isOnboarding = computed(() =>
  route.matched.some((record) => record.meta.isOnboarding)
);
</script>

<style lang="scss" scoped>
.auth-layout {
  background: #18181B;
  min-height: 100vh;
}

.auth-wrapper {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  align-items: center;

  &--wide {
    max-width: 560px;
  }
}

.auth-logo-section {
  position: relative;
  z-index: 1;
  margin-bottom: -36px; // Half of 72px avatar — creates overlap
}

.auth-logo {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 3px solid white;
  // Dark mode border-color is in app.scss
}

.auth-container {
  width: 100%;
  padding: 52px 28px 32px; // Extra top padding for avatar overlap
  background: white;
  border-radius: 20px;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.12),
    0 12px 40px rgba(0, 0, 0, 0.16);

  // Dark mode override is in app.scss (scoped :global() compiles incorrectly)
}

// On small screens, card fills the width with safe padding
@media (max-width: 480px) {
  .auth-container {
    padding: 44px 20px 24px;
    border-radius: $radius-dialog;
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}
</style>
