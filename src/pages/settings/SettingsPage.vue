<template>
  <q-page class="q-pa-md">
    <!-- Profile Section -->
    <q-list bordered class="rounded-borders q-mb-md">
      <q-item v-ripple clickable @click="router.push('/settings/profile')">
        <q-item-section avatar>
          <q-avatar v-if="profileImage" size="40px">
            <q-img :src="profileImage" :ratio="1" />
          </q-avatar>
          <q-avatar v-else color="primary" text-color="white">
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

    <!-- Preferences Section -->
    <div class="text-subtitle2 text-grey-7 q-mb-sm q-ml-sm">{{ $t('settings.preferences') }}</div>
    <q-list bordered class="rounded-borders q-mb-md">
      <!-- Language -->
      <q-item v-ripple clickable @click="showLanguageDialog = true">
        <q-item-section avatar>
          <q-icon name="translate" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('settings.language') }}</q-item-label>
          <q-item-label caption>{{ currentLanguageLabel }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>

      <q-separator />

      <!-- Role -->
      <q-item v-ripple clickable @click="showRoleDialog = true">
        <q-item-section avatar>
          <q-icon name="badge" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('settings.role') }}</q-item-label>
          <q-item-label caption>{{ $t(`roles.${authStore.userRole}`) }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>

      <q-separator />

      <!-- Organization -->
      <q-item v-ripple clickable @click="showOrgDialog = true">
        <q-item-section avatar>
          <q-icon name="business" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('settings.organization') }}</q-item-label>
          <q-item-label caption>{{ currentOrgName || $t('common.notAffiliated') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>
    </q-list>

    <!-- App Settings -->
    <div class="text-subtitle2 text-grey-7 q-mb-sm q-ml-sm">{{ $t('settings.appSettings') }}</div>
    <q-list bordered class="rounded-borders q-mb-md">
      <q-item>
        <q-item-section avatar>
          <q-icon name="notifications" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('settings.pushNotifications') }}</q-item-label>
          <q-item-label caption>{{ $t('settings.notificationsDesc') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-toggle v-model="notifications" color="primary" />
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item v-ripple clickable @click="showInstallPrompt">
        <q-item-section avatar>
          <q-icon name="install_mobile" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('settings.installApp') }}</q-item-label>
          <q-item-label caption>{{ $t('settings.installDesc') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-chip v-if="isInstalled" color="positive" text-color="white" size="sm">
            {{ $t('settings.installed') }}
          </q-chip>
          <q-icon v-else name="chevron_right" />
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Data & Sync -->
    <div class="text-subtitle2 text-grey-7 q-mb-sm q-ml-sm">{{ $t('settings.dataSync') }}</div>
    <q-list bordered class="rounded-borders q-mb-md">
      <q-item>
        <q-item-section avatar>
          <q-icon :name="syncStatusIcon" :color="syncStatusColor" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('settings.syncStatus') }}</q-item-label>
          <q-item-label caption>{{ syncStatusText }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn
            flat
            round
            icon="sync"
            :loading="isSyncing"
            :disable="!isOnline"
            @click="manualSync"
          />
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item v-ripple clickable @click="showSyncHistory = true">
        <q-item-section avatar>
          <q-icon name="history" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('settings.syncHistory') }}</q-item-label>
          <q-item-label caption>{{ $t('settings.syncHistoryDesc') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item v-ripple clickable @click="confirmClearCache">
        <q-item-section avatar>
          <q-icon name="delete_sweep" color="negative" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('settings.clearData') }}</q-item-label>
          <q-item-label caption>{{ $t('settings.clearDataDesc') }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- About -->
    <div class="text-subtitle2 text-grey-7 q-mb-sm q-ml-sm">{{ $t('settings.about') }}</div>
    <q-list bordered class="rounded-borders q-mb-md">
      <q-item>
        <q-item-section avatar>
          <q-icon name="info" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('settings.version') }}</q-item-label>
          <q-item-label caption>1.0.0</q-item-label>
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item v-ripple clickable @click="router.push('/settings/help')">
        <q-item-section avatar>
          <q-icon name="help" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('settings.helpSupport') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item v-ripple clickable @click="router.push('/settings/privacy')">
        <q-item-section avatar>
          <q-icon name="policy" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('settings.privacyPolicy') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Logout -->
    <q-btn
      :label="$t('settings.logout')"
      icon="logout"
      color="negative"
      flat
      class="full-width q-mt-lg"
      @click="confirmLogout"
    />

    <!-- Language Dialog -->
    <q-dialog v-model="showLanguageDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ $t('settings.selectLanguage') }}</div>
        </q-card-section>
        <q-list>
          <q-item
            v-for="lang in availableLocales"
            :key="lang.value"
            v-ripple
            clickable
            :active="currentLanguage === lang.value"
            @click="changeLanguage(lang.value)"
          >
            <q-item-section>
              <q-item-label>{{ lang.nativeLabel }}</q-item-label>
              <q-item-label caption>{{ lang.label }}</q-item-label>
            </q-item-section>
            <q-item-section v-if="currentLanguage === lang.value" side>
              <q-icon name="check" color="primary" />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-dialog>

    <!-- Role Dialog -->
    <q-dialog v-model="showRoleDialog">
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ $t('settings.selectRole') }}</div>
        </q-card-section>
        <q-list>
          <q-item
            v-for="role in roles"
            :key="role.value"
            v-ripple
            clickable
            :active="selectedRole === role.value"
            @click="changeRole(role.value)"
          >
            <q-item-section avatar>
              <q-icon :name="role.icon" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t(`roles.${role.value}`) }}</q-item-label>
              <q-item-label caption>{{ $t(`roles.${role.value}Desc`) }}</q-item-label>
            </q-item-section>
            <q-item-section v-if="selectedRole === role.value" side>
              <q-icon name="check" color="primary" />
            </q-item-section>
          </q-item>
        </q-list>
        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="$t('common.cancel')" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Sync History Drawer -->
    <SyncHistoryDrawer v-model="showSyncHistory" />

    <!-- Organization Dialog -->
    <q-dialog v-model="showOrgDialog">
      <q-card style="max-height: 80vh">
        <q-card-section>
          <div class="text-h6">{{ $t('settings.selectOrganization') }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input
            v-model="orgSearchQuery"
            :placeholder="$t('common.search')"
            outlined
            dense
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </q-card-section>
        <q-list style="max-height: 300px; overflow-y: auto">
          <!-- Not affiliated -->
          <q-item
            v-ripple
            clickable
            :active="selectedOrgId === null"
            @click="changeOrganization(null)"
          >
            <q-item-section avatar>
              <q-avatar color="grey-3" text-color="grey-7" icon="person" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('common.notAffiliated') }}</q-item-label>
            </q-item-section>
            <q-item-section v-if="selectedOrgId === null" side>
              <q-icon name="check" color="primary" />
            </q-item-section>
          </q-item>

          <q-separator />

          <q-item
            v-for="org in filteredOrganizations"
            :key="org.id"
            v-ripple
            clickable
            :active="selectedOrgId === org.id"
            @click="changeOrganization(org.id)"
          >
            <q-item-section avatar>
              <q-avatar :color="getOrgTypeColor(org.type)" text-color="white">
                {{ org.name.charAt(0).toUpperCase() }}
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ org.name }}</q-item-label>
              <q-item-label caption>{{ formatOrgType(org.type) }}</q-item-label>
            </q-item-section>
            <q-item-section v-if="selectedOrgId === org.id" side>
              <q-icon name="check" color="primary" />
            </q-item-section>
          </q-item>

          <q-item v-if="loadingOrgs" class="text-center">
            <q-item-section>
              <q-spinner-dots color="primary" />
            </q-item-section>
          </q-item>
        </q-list>
        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="$t('common.cancel')" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import { useOfflineSync } from 'src/composables/useOfflineSync';
import { isInstalled, canInstall, installPWA } from 'src/boot/pwa';
import { db } from 'src/lib/offline/db';
import { availableLocales, setLocale, getLocale } from 'src/boot/i18n';
import { api } from 'src/boot/axios';
import { useI18n } from 'vue-i18n';
import SyncHistoryDrawer from 'src/components/pwa/SyncHistoryDrawer.vue';

interface Organization {
  id: string;
  name: string;
  type: string;
  country_id: string;
}

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();
const { t } = useI18n();
const {
  isOnline,
  isSyncing,
  syncStatusText,
  syncStatusIcon,
  syncStatusColor,
  manualSync,
} = useOfflineSync();

const notifications = ref(false);
const showSyncHistory = ref(false);
const profileImage = ref<string | null>(localStorage.getItem('profile_image'));

// Language
const showLanguageDialog = ref(false);
const currentLanguage = ref(getLocale());
const currentLanguageLabel = computed(() => {
  const lang = availableLocales.find((l) => l.value === currentLanguage.value);
  return lang ? lang.nativeLabel : currentLanguage.value;
});

// Role
const showRoleDialog = ref(false);
const selectedRole = ref(authStore.userRole);
const roles = [
  { value: 'farmer', icon: 'agriculture' },
  { value: 'extension_worker', icon: 'groups' },
  { value: 'nutritionist', icon: 'science' },
  { value: 'researcher', icon: 'biotech' },
  { value: 'feed_supplier', icon: 'storefront' },
  { value: 'other', icon: 'more_horiz' },
];

// Organization
const showOrgDialog = ref(false);
const organizations = ref<Organization[]>([]);
const loadingOrgs = ref(false);
const selectedOrgId = ref<string | null>(null);
const orgSearchQuery = ref('');
const currentOrgName = ref<string | null>(null);

const filteredOrganizations = computed(() => {
  if (!orgSearchQuery.value) return organizations.value;
  const query = orgSearchQuery.value.toLowerCase();
  return organizations.value.filter(
    (org) =>
      org.name.toLowerCase().includes(query) ||
      org.type.toLowerCase().includes(query)
  );
});

const userName = computed(() => authStore.user?.name || t('profile.defaultUserName'));
const userEmail = computed(() => authStore.user?.email || authStore.user?.phone || '');

// Fetch organizations when dialog opens
watch(showOrgDialog, async (isOpen) => {
  if (isOpen && organizations.value.length === 0) {
    await fetchOrganizations();
  }
});

async function fetchOrganizations() {
  loadingOrgs.value = true;
  try {
    const countryCode = authStore.user?.country_code || 'IN';
    // Get country ID from country code
    const countriesRes = await api.get('/api/v1/countries');
    const country = countriesRes.data.find((c: { code: string }) => c.code === countryCode);

    if (country) {
      const orgsRes = await api.get(`/api/v1/organizations?country_id=${country.id}`);
      organizations.value = orgsRes.data;
    }
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
  } finally {
    loadingOrgs.value = false;
  }
}

function getOrgTypeColor(type: string): string {
  const colors: Record<string, string> = {
    university: 'blue-7',
    government: 'green-7',
    ngo: 'orange-7',
    cooperative: 'purple-7',
    research: 'teal-7',
  };
  return colors[type] || 'grey-7';
}

function formatOrgType(type: string): string {
  const key = `settings.orgTypes.${type}`;
  const translated = t(key);
  // If key not found, t() returns the key itself, so fallback to type
  return translated === key ? type : translated;
}

async function changeLanguage(locale: string) {
  setLocale(locale);
  currentLanguage.value = locale;

  // Save to backend
  try {
    await authStore.updateUserSettings({ language_code: locale });
  } catch (error) {
    console.error('Failed to save language preference:', error);
  }

  showLanguageDialog.value = false;
}

async function changeRole(role: string) {
  selectedRole.value = role;

  // Save to backend
  const success = await authStore.updateUserSettings({ user_role: role });
  if (success) {
    $q.notify({
      type: 'positive',
      message: t('settings.roleUpdated'),
      position: 'bottom',
    });
  }

  showRoleDialog.value = false;
}

async function changeOrganization(orgId: string | null) {
  selectedOrgId.value = orgId;

  // Save to backend
  const success = await authStore.updateUserSettings({ organization_id: orgId });
  if (success) {
    // Update current org name display
    if (orgId) {
      const org = organizations.value.find((o) => o.id === orgId);
      currentOrgName.value = org?.name || null;
    } else {
      currentOrgName.value = null;
    }

    $q.notify({
      type: 'positive',
      message: t('settings.organizationUpdated'),
      position: 'bottom',
    });
  }

  showOrgDialog.value = false;
}

async function showInstallPrompt() {
  if (isInstalled.value) {
    $q.notify({
      type: 'info',
      message: t('settings.alreadyInstalled'),
    });
    return;
  }

  if (canInstall.value) {
    await installPWA();
  } else {
    // Show manual instructions for iOS
    $q.dialog({
      title: t('settings.installApp'),
      message: t('settings.iosInstallInstructions'),
      ok: t('common.ok'),
    });
  }
}

function confirmClearCache() {
  $q.dialog({
    title: t('settings.clearData'),
    message: t('settings.clearDataConfirm'),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    await db.clearUserData();
    $q.notify({
      type: 'positive',
      message: t('settings.dataCleared'),
    });
  });
}

function confirmLogout() {
  $q.dialog({
    title: t('settings.logout'),
    message: t('settings.logoutConfirm'),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    await authStore.logout();
    router.push('/auth/login');
  });
}

onMounted(async () => {
  // Load current organization if user has one
  if (authStore.user?.organization_id) {
    selectedOrgId.value = authStore.user.organization_id;
    // Fetch organization name
    try {
      const response = await api.get(`/api/v1/organizations/${authStore.user.organization_id}`);
      currentOrgName.value = response.data.name;
    } catch {
      // Ignore - org may not exist
    }
  }
});
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: 12px;
  overflow: hidden;
}
</style>
