<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Offline Indicator -->
    <OfflineIndicator />

    <!-- Update Prompt -->
    <UpdatePrompt />

    <!-- Header -->
    <q-header bordered class="main-header bg-primary text-white">
      <q-toolbar>
        <q-btn
          v-if="showBackButton"
          flat
          dense
          round
          icon="arrow_back"
          color="white"
          @click="goBack"
        />
        <q-btn
          v-else
          flat
          dense
          round
          icon="menu"
          color="white"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />

        <q-toolbar-title>
          {{ pageTitle || 'RationSmart' }}
        </q-toolbar-title>
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
          <div class="text-caption text-grey-6">{{ userPhone }}</div>
          <q-chip v-if="authStore.isAnyAdmin" dense outline size="sm" class="q-mt-xs q-ml-none">
            <q-icon name="verified_user" size="12px" class="q-mr-xs" />
            {{ adminLevelLabel }}
          </q-chip>
        </div>

        <!-- Navigation -->
        <q-list padding>
          <q-item v-ripple clickable @click="openSimulationHistory">
            <q-item-section avatar>
              <q-icon name="history" />
            </q-item-section>
            <q-item-section>{{ $t('simulation.history') }}</q-item-section>
          </q-item>

          <q-item v-ripple clickable to="/settings/profile" active-class="text-primary bg-grey-2">
            <q-item-section avatar>
              <q-icon name="person" />
            </q-item-section>
            <q-item-section>{{ $t('settings.profile') }}</q-item-section>
          </q-item>

          <q-item v-ripple clickable to="/feeds" active-class="text-primary bg-grey-2">
            <q-item-section avatar>
              <q-icon name="grass" />
            </q-item-section>
            <q-item-section>{{ $t('nav.feeds') }}</q-item-section>
          </q-item>

          <q-item v-ripple clickable to="/settings/help" active-class="text-primary bg-grey-2">
            <q-item-section avatar>
              <q-icon name="help_outline" />
            </q-item-section>
            <q-item-section>{{ $t('settings.helpSupport') }}</q-item-section>
          </q-item>

          <q-item v-ripple clickable to="/settings/feedback" active-class="text-primary bg-grey-2">
            <q-item-section avatar>
              <q-icon name="feedback" />
            </q-item-section>
            <q-item-section>{{ $t('settings.feedback') }}</q-item-section>
          </q-item>

          <q-item v-ripple clickable to="/settings/privacy" active-class="text-primary bg-grey-2">
            <q-item-section avatar>
              <q-icon name="gavel" />
            </q-item-section>
            <q-item-section>{{ $t('settings.privacyPolicy') }}</q-item-section>
          </q-item>

          <template v-if="authStore.isAnyAdmin">
            <q-item v-ripple clickable to="/admin" active-class="text-primary bg-grey-2">
              <q-item-section avatar>
                <q-icon name="admin_panel_settings" />
              </q-item-section>
              <q-item-section>{{ $t('nav.admin') }}</q-item-section>
            </q-item>
          </template>

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

    <!-- Add to Home Screen -->
    <AddToHomeScreen ref="a2hsRef" />
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, provide } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/auth';
import { useHapticFeedback } from 'src/composables/useHapticFeedback';
import OfflineIndicator from 'src/components/pwa/OfflineIndicator.vue';
import UpdatePrompt from 'src/components/pwa/UpdatePrompt.vue';
import AddToHomeScreen from 'src/components/pwa/AddToHomeScreen.vue';
import { backOverride } from 'src/lib/back-override';
import { openHistoryKey } from 'src/lib/injection-keys';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const authStore = useAuthStore();
const { light, medium } = useHapticFeedback();

const leftDrawerOpen = ref(false);
const a2hsRef = ref<InstanceType<typeof AddToHomeScreen> | null>(null);

// Provide a reactive counter for simulation history dialog trigger
const openHistoryCounter = ref(0);
provide(openHistoryKey, openHistoryCounter);

// Admin level label for drawer badge
const adminLevelLabel = computed(() => {
  switch (authStore.adminLevel) {
    case 'super_admin': return t('admin.superAdmin');
    case 'country_admin': return t('admin.countryAdmin');
    case 'org_admin': return t('admin.orgAdmin');
    default: return '';
  }
});

// User info
const userName = computed(() => authStore.user?.name || 'User');
const userPhone = computed(() => authStore.user?.phone || '');

// Page title from route meta (supports i18n titleKey or plain title)
const pageTitle = computed(() => {
  const titleKey = route.meta?.titleKey as string | undefined;
  if (titleKey) return t(titleKey);
  return (route.meta?.title as string) || '';
});

// Navigation configuration
const showBackButton = computed(() => !!route.meta?.showBack);

function goBack() {
  light();
  if (backOverride.value && backOverride.value()) return;
  router.back();
}

function openSimulationHistory() {
  leftDrawerOpen.value = false;
  openHistoryCounter.value++;
}

async function logout() {
  medium();
  await authStore.logout();
  router.push('/auth/login');
}
</script>

<style lang="scss" scoped>
.main-header {
  border-color: rgba(0, 0, 0, 0.15) !important;
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
</style>
