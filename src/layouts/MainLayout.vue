<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Offline Indicator -->
    <OfflineIndicator />

    <!-- Update Prompt -->
    <UpdatePrompt />

    <!-- Header -->
    <q-header bordered class="main-header">
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
            <q-list class="user-menu-list">
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
      :width="280"
      :breakpoint="599"
    >
      <q-scroll-area class="fit">
        <!-- User Info -->
        <div class="drawer-header q-pa-md">
          <q-avatar v-if="authStore.profileImage" size="56px">
            <q-img :src="authStore.profileImage" :ratio="1" />
          </q-avatar>
          <q-avatar v-else size="56px" color="grey-3" text-color="grey-8">
            <q-icon name="person" size="32px" />
          </q-avatar>
          <div class="q-mt-sm text-subtitle1">{{ userName }}</div>
          <div class="text-caption text-grey-6">{{ userEmail }}</div>
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
            <q-item-section>{{ $t('nav.logout') }}</q-item-section>
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
    <q-footer v-if="showBottomNav" bordered>
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
          :exact="tab.to === '/'"
        >
          <q-badge v-if="tab.badge" floating rounded color="warning" :label="tab.badge" />
        </q-route-tab>
      </q-tabs>
    </q-footer>

    <!-- Add to Home Screen -->
    <AddToHomeScreen ref="a2hsRef" />

    <!-- Sync Conflict Dialog (global) -->
    <SyncConflictDialog v-if="isAuthenticated" />

    <!-- FAB for quick actions -->
    <q-page-sticky v-if="showFab" :position="rtl ? 'bottom-left' : 'bottom-right'" :offset="[16, 72]">
      <q-fab
        icon="add"
        direction="up"
        color="primary"
        padding="sm"
        :vertical-actions-align="rtl ? 'left' : 'right'"
        @click="medium()"
      >
        <q-fab-action
          color="primary"
          :icon="COW_ICON"
          :label="$t('nav.addCow')"
          :label-position="rtl ? 'right' : 'left'"
          external-label
          padding="xs"
          @click="onFabAction('/cows/new')"
        />
        <q-fab-action
          color="primary"
          icon="water_drop"
          :label="$t('nav.logMilk')"
          :label-position="rtl ? 'right' : 'left'"
          external-label
          padding="xs"
          @click="onFabAction('/logs/new')"
        />
        <q-fab-action
          color="primary"
          icon="menu_book"
          :label="$t('nav.getDiet')"
          :label-position="rtl ? 'right' : 'left'"
          external-label
          padding="xs"
          @click="onFabAction('/diet/new')"
        />
      </q-fab>
    </q-page-sticky>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/auth';
import { useOfflineSync } from 'src/composables/useOfflineSync';
import { useHapticFeedback } from 'src/composables/useHapticFeedback';
import OfflineIndicator from 'src/components/pwa/OfflineIndicator.vue';
import UpdatePrompt from 'src/components/pwa/UpdatePrompt.vue';
import AddToHomeScreen from 'src/components/pwa/AddToHomeScreen.vue';
import SyncStatusChip from 'src/components/ui/SyncStatusChip.vue';
import SyncConflictDialog from 'src/components/pwa/SyncConflictDialog.vue';
import { COW_ICON } from 'src/boot/icons';
import { isRTL } from 'src/boot/i18n';
import { backOverride } from 'src/lib/back-override';

const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const { t, locale } = useI18n();
const rtl = computed(() => isRTL(locale.value));
const authStore = useAuthStore();
const { pendingCount } = useOfflineSync();
const { light, medium } = useHapticFeedback();

const leftDrawerOpen = ref(false);
const activeTab = ref('/');
const a2hsRef = ref<InstanceType<typeof AddToHomeScreen> | null>(null);

// User info
const isAuthenticated = computed(() => authStore.isAuthenticated);
const userName = computed(() => authStore.user?.name || 'User');
const userEmail = computed(() => authStore.user?.email || authStore.user?.phone || '');

// Page title from route meta (supports i18n titleKey or plain title)
const pageTitle = computed(() => {
  const titleKey = route.meta?.titleKey as string | undefined;
  if (titleKey) return t(titleKey);
  return (route.meta?.title as string) || '';
});

// Navigation configuration
const showBackButton = computed(() => !!route.meta?.showBack);
const hideDrawerToggle = computed(() => !!route.meta?.hideDrawer);
const showMenu = computed(() => !!route.meta?.showMenu);
const showBottomNav = computed(() => $q.screen.xs && !route.meta?.hideBottomNav);
const showFab = computed(() => !route.meta?.hideFab && isAuthenticated.value);

const navItems = computed(() => {
  const items = [
    { to: '/', icon: 'home', label: t('nav.home') },
    // Only show Farmers nav for EWs / users managing farmers (not pure farmer role)
    ...(!authStore.isFarmerRole ? [{ to: '/farmers', icon: 'people', label: t('nav.farmers') }] : []),
    { to: '/cows', icon: COW_ICON, label: t('nav.myCows') },
    { to: '/diet', icon: 'menu_book', label: t('nav.diet') },
    { to: '/feeds', icon: 'grass', label: t('nav.feeds') },
    { to: '/logs', icon: 'water_drop', label: t('nav.milkLogs'), badge: pendingCount.value > 0 ? pendingCount.value : undefined },
    { to: '/yields', icon: 'analytics', label: t('nav.milkSummary') },
    { to: '/reports', icon: 'summarize', label: t('nav.reports') },
  ];
  // Admin section: analytics + admin panel for org_admin, country_admin, super_admin
  if (authStore.isAnyAdmin) {
    items.push({ to: '/analytics', icon: 'insights', label: t('nav.analytics') });
    items.push({ to: '/admin', icon: 'admin_panel_settings', label: t('nav.admin') });
  }
  items.push({ to: '/settings', icon: 'settings', label: t('nav.settings') });
  return items;
});

const bottomNavItems = computed(() => [
  { to: '/', icon: 'home', label: t('nav.home') },
  { to: '/cows', icon: COW_ICON, label: t('nav.cows') },
  { to: '/logs', icon: 'water_drop', label: t('nav.milkLogs'), badge: pendingCount.value > 0 ? pendingCount.value : undefined },
  { to: '/diet', icon: 'menu_book', label: t('nav.diet') },
]);

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/');
}

function goBack() {
  light(); // Haptic feedback on back navigation
  // Let pages with in-page drill-down (e.g. analytics) handle back first
  if (backOverride.value && backOverride.value()) return;
  router.back();
}

function onFabAction(path: string) {
  medium(); // Haptic feedback on FAB action
  router.push(path);
}

async function logout() {
  medium(); // Haptic feedback on logout action
  await authStore.logout();
  router.push('/auth/login');
}

// Sync active tab with route
watch(
  () => route.path,
  (path) => {
    const matchingTab = bottomNavItems.value.find(
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
.main-header {
  background: white;
  color: #18181b;
}

.drawer-header {
  padding-top: calc(16px + env(safe-area-inset-top));
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
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
  background: white;
  padding-bottom: env(safe-area-inset-bottom);
}

.user-menu-list {
  min-width: 150px;
}
</style>
