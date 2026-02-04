<template>
  <q-layout view="lHh Lpr lff" class="auth-layout">
    <q-page-container>
      <q-page class="flex flex-center">
        <div class="auth-container">
          <!-- Logo and Branding -->
          <div class="text-center q-mb-xl">
            <q-avatar size="80px" color="primary" text-color="white" class="q-mb-md">
              <q-icon name="agriculture" size="48px" />
            </q-avatar>
            <h1 class="text-h4 text-weight-bold q-mb-xs">RationSmart</h1>
            <p class="text-body2 text-grey-7">
              Optimize your cattle's nutrition
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
// Auth layout is simple - no complex logic needed
</script>

<style lang="scss" scoped>
.auth-layout {
  background: linear-gradient(135deg, $primary 0%, darken($primary, 15%) 100%);
  min-height: 100vh;
}

.auth-container {
  width: 100%;
  max-width: 400px;
  padding: 24px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  margin: 16px;
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
