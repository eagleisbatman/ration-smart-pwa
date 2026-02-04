<template>
  <q-page class="q-pa-md">
    <!-- Profile Section -->
    <q-list bordered class="rounded-borders q-mb-md">
      <q-item clickable v-ripple @click="router.push('/settings/profile')">
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white">
            <q-icon name="person" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ userName }}</q-item-label>
          <q-item-label caption>{{ userEmail }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>
    </q-list>

    <!-- App Settings -->
    <div class="text-subtitle2 text-grey-7 q-mb-sm q-ml-sm">App Settings</div>
    <q-list bordered class="rounded-borders q-mb-md">
      <q-item>
        <q-item-section avatar>
          <q-icon name="notifications" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Push Notifications</q-item-label>
          <q-item-label caption>Receive reminders and updates</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-toggle v-model="notifications" color="primary" />
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item clickable v-ripple @click="showInstallPrompt">
        <q-item-section avatar>
          <q-icon name="install_mobile" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Install App</q-item-label>
          <q-item-label caption>Add to home screen for quick access</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-chip v-if="isInstalled" color="positive" text-color="white" size="sm">
            Installed
          </q-chip>
          <q-icon v-else name="chevron_right" />
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Data & Sync -->
    <div class="text-subtitle2 text-grey-7 q-mb-sm q-ml-sm">Data & Sync</div>
    <q-list bordered class="rounded-borders q-mb-md">
      <q-item>
        <q-item-section avatar>
          <q-icon :name="syncStatusIcon" :color="syncStatusColor" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Sync Status</q-item-label>
          <q-item-label caption>{{ syncStatusText }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn
            flat
            round
            icon="sync"
            :loading="isSyncing"
            @click="manualSync"
            :disable="!isOnline"
          />
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item clickable v-ripple @click="confirmClearCache">
        <q-item-section avatar>
          <q-icon name="delete_sweep" color="negative" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Clear Local Data</q-item-label>
          <q-item-label caption>Remove cached data (will re-sync)</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- About -->
    <div class="text-subtitle2 text-grey-7 q-mb-sm q-ml-sm">About</div>
    <q-list bordered class="rounded-borders q-mb-md">
      <q-item>
        <q-item-section avatar>
          <q-icon name="info" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Version</q-item-label>
          <q-item-label caption>1.0.0</q-item-label>
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item clickable v-ripple>
        <q-item-section avatar>
          <q-icon name="help" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Help & Support</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="open_in_new" />
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item clickable v-ripple>
        <q-item-section avatar>
          <q-icon name="policy" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Privacy Policy</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="open_in_new" />
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Logout -->
    <q-btn
      label="Logout"
      icon="logout"
      color="negative"
      flat
      class="full-width q-mt-lg"
      @click="confirmLogout"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import { useOfflineSync } from 'src/composables/useOfflineSync';
import { isInstalled, canInstall, installPWA } from 'src/boot/pwa';
import { db } from 'src/lib/offline/db';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();
const {
  isOnline,
  isSyncing,
  syncStatusText,
  syncStatusIcon,
  syncStatusColor,
  manualSync,
} = useOfflineSync();

const notifications = ref(false);

const userName = computed(() => authStore.user?.name || 'User');
const userEmail = computed(() => authStore.user?.email || authStore.user?.phone || '');

async function showInstallPrompt() {
  if (isInstalled.value) {
    $q.notify({
      type: 'info',
      message: 'App is already installed',
    });
    return;
  }

  if (canInstall.value) {
    await installPWA();
  } else {
    // Show manual instructions for iOS
    $q.dialog({
      title: 'Install RationSmart',
      message: 'To install on iOS:\n1. Tap the Share button\n2. Tap "Add to Home Screen"\n3. Tap "Add"',
      ok: 'Got it',
    });
  }
}

function confirmClearCache() {
  $q.dialog({
    title: 'Clear Local Data',
    message: 'This will remove all cached data. Your data will be re-downloaded from the server when online. Continue?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    await db.clearUserData();
    $q.notify({
      type: 'positive',
      message: 'Local data cleared',
    });
  });
}

function confirmLogout() {
  $q.dialog({
    title: 'Logout',
    message: 'Are you sure you want to logout?',
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    await authStore.logout();
    router.push('/auth/login');
  });
}
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: 12px;
  overflow: hidden;
}
</style>
