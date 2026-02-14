<template>
  <q-layout view="lHh Lpr lff" class="auth-layout">
    <q-page-container>
      <q-page class="flex flex-center q-pa-md">
        <div :class="['auth-container', { 'auth-container--wide': isOnboarding }]">
          <!-- Logo and Branding -->
          <div class="text-center q-mb-lg">
            <q-avatar size="72px" color="primary" text-color="white" class="q-mb-sm auth-logo">
              <q-icon :name="cowIcon" size="40px" />
            </q-avatar>
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
  background: linear-gradient(135deg, $primary 0%, lighten($primary, 8%) 50%, darken($primary, 8%) 100%);
  min-height: 100vh;
}

.auth-container {
  width: 100%;
  max-width: 440px;
  padding: 32px 28px;
  background: white;
  border-radius: 20px;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.12),
    0 12px 40px rgba(0, 0, 0, 0.16);

  &--wide {
    max-width: 560px;
  }
}

.auth-logo {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

// On small screens, card fills the width with safe padding
@media (max-width: 480px) {
  .auth-container {
    padding: 24px 20px;
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
