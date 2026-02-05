<template>
  <q-layout view="lHh Lpr lff">
    <!-- Offline Indicator -->
    <OfflineIndicator />

    <!-- Update Prompt -->
    <UpdatePrompt />

    <!-- Header -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          v-if="showBackButton"
          flat
          dense
          round
          icon="arrow_back"
          @click="goBack"
        />
        <q-btn
          v-else-if="!hideDrawerToggle"
          flat
          dense
          round
          icon="menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <q-toolbar-title>
          {{ pageTitle || 'RationSmart' }}
        </q-toolbar-title>

        <SyncStatusChip v-if="isAuthenticated" />

        <q-btn v-if="showMenu" flat round dense icon="more_vert">
          <q-menu>
            <q-list style="min-width: 150px">
              <slot name="menu-items" />
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- Left Drawer -->
    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="bg-white"
      :width="280"
    >
      <q-scroll-area class="fit">
        <!-- User Info -->
        <div class="drawer-header bg-primary text-white q-pa-md">
          <q-avatar size="56px" color="white" text-color="primary">
            <q-icon name="person" size="32px" />
          </q-avatar>
          <div class="q-mt-sm text-subtitle1">{{ userName }}</div>
          <div class="text-caption text-white-7">{{ userEmail }}</div>
        </div>

        <!-- Navigation -->
        <q-list padding>
          <q-item
            v-for="item in navItems"
            :key="item.to"
            v-ripple
            :to="item.to"
            clickable
            :active="isActive(item.to)"
            active-class="text-primary bg-grey-2"
          >
            <q-item-section avatar>
              <q-icon :name="item.icon" />
            </q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
            <q-item-section v-if="item.badge" side>
              <q-badge :label="item.badge" color="primary" />
            </q-item-section>
          </q-item>

          <q-separator class="q-my-md" />

          <q-item v-ripple clickable @click="logout">
            <q-item-section avatar>
              <q-icon name="logout" />
            </q-item-section>
            <q-item-section>Logout</q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <!-- Page Container -->
    <q-page-container>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </q-page-container>

    <!-- Bottom Navigation (Mobile) -->
    <q-footer v-if="showBottomNav" class="bg-white" bordered>
      <q-tabs
        v-model="activeTab"
        class="text-grey-7"
        active-color="primary"
        indicator-color="transparent"
        dense
      >
        <q-route-tab
          v-for="tab in bottomNavItems"
          :key="tab.to"
          :to="tab.to"
          :icon="tab.icon"
          :label="tab.label"
        />
      </q-tabs>
    </q-footer>

    <!-- Add to Home Screen -->
    <AddToHomeScreen ref="a2hsRef" />

    <!-- FAB for quick actions -->
    <q-page-sticky v-if="showFab" position="bottom-right" :offset="[18, 90]">
      <q-fab
        icon="add"
        direction="up"
        color="primary"
        padding="md"
      >
        <q-fab-action
          color="secondary"
          icon="pets"
          label="Add Cow"
          @click="router.push('/cows/new')"
        />
        <q-fab-action
          color="accent"
          icon="water_drop"
          label="Log Milk"
          @click="router.push('/logs/new')"
        />
        <q-fab-action
          color="info"
          icon="restaurant"
          label="Get Diet"
          @click="router.push('/diet/new')"
        />
      </q-fab>
    </q-page-sticky>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import { useOfflineSync } from 'src/composables/useOfflineSync';
import OfflineIndicator from 'src/components/pwa/OfflineIndicator.vue';
import UpdatePrompt from 'src/components/pwa/UpdatePrompt.vue';
import AddToHomeScreen from 'src/components/pwa/AddToHomeScreen.vue';
import SyncStatusChip from 'src/components/ui/SyncStatusChip.vue';

const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { pendingCount } = useOfflineSync();

const leftDrawerOpen = ref(false);
const activeTab = ref('/');
const a2hsRef = ref<InstanceType<typeof AddToHomeScreen> | null>(null);

// User info
const isAuthenticated = computed(() => authStore.isAuthenticated);
const userName = computed(() => authStore.user?.name || 'User');
const userEmail = computed(() => authStore.user?.email || authStore.user?.phone || '');

// Page title from route meta
const pageTitle = computed(() => (route.meta?.title as string) || '');

// Navigation configuration
const showBackButton = computed(() => !!route.meta?.showBack);
const hideDrawerToggle = computed(() => !!route.meta?.hideDrawer);
const showMenu = computed(() => !!route.meta?.showMenu);
const showBottomNav = computed(() => $q.screen.lt.md && !route.meta?.hideBottomNav);
const showFab = computed(() => !route.meta?.hideFab && isAuthenticated.value);

const navItems = computed(() => [
  { to: '/', icon: 'home', label: 'Home' },
  { to: '/farmers', icon: 'people', label: 'Farmers' },
  { to: '/cows', icon: 'pets', label: 'My Cows' },
  { to: '/diet', icon: 'restaurant', label: 'Diet Plans' },
  { to: '/feeds', icon: 'grass', label: 'Feeds' },
  { to: '/logs', icon: 'water_drop', label: 'Milk Logs', badge: pendingCount.value > 0 ? pendingCount.value : undefined },
  { to: '/yields', icon: 'analytics', label: 'Yield History' },
  { to: '/reports', icon: 'assessment', label: 'Reports' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
]);

const bottomNavItems = [
  { to: '/', icon: 'home', label: 'Home' },
  { to: '/farmers', icon: 'people', label: 'Farmers' },
  { to: '/cows', icon: 'pets', label: 'Cows' },
  { to: '/diet', icon: 'restaurant', label: 'Diet' },
  { to: '/settings', icon: 'settings', label: 'More' },
];

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/');
}

function goBack() {
  router.back();
}

async function logout() {
  await authStore.logout();
  router.push('/auth/login');
}

// Sync active tab with route
watch(
  () => route.path,
  (path) => {
    const matchingTab = bottomNavItems.find(
      (item) => path === item.to || path.startsWith(item.to + '/')
    );
    if (matchingTab) {
      activeTab.value = matchingTab.to;
    }
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.drawer-header {
  padding-top: calc(16px + env(safe-area-inset-top));
}

.text-white-7 {
  color: rgba(255, 255, 255, 0.7);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.q-footer {
  padding-bottom: env(safe-area-inset-bottom);
}
</style>
