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

      <q-separator />

      <!-- Milk Price -->
      <q-item v-ripple clickable @click="showMilkPriceDialog = true">
        <q-item-section avatar>
          <q-icon name="payments" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('settings.milkPrice') }}</q-item-label>
          <q-item-label caption>
            <template v-if="settingsStore.milkPricePerLiter">
              {{ formatCurrency(settingsStore.milkPricePerLiter) }}/{{ $t('units.l') }}
            </template>
            <template v-else>{{ $t('settings.milkPriceNotSet') }}</template>
          </q-item-label>
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
          <q-item-label caption>
            <template v-if="!pushSupported">{{ $t('settings.pushNotSupported') }}</template>
            <template v-else-if="pushPermission === 'denied'">{{ $t('settings.pushDenied') }}</template>
            <template v-else>{{ $t('settings.notificationsDesc') }}</template>
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-spinner-dots v-if="pushLoading" color="primary" size="24px" />
          <q-toggle
            v-else
            v-model="notifications"
            color="primary"
            :disable="!pushSupported || pushPermission === 'denied'"
          />
        </q-item-section>
      </q-item>

      <q-separator />

      <!-- Dark Mode -->
      <q-item>
        <q-item-section avatar>
          <q-icon name="dark_mode" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('settings.darkMode') }}</q-item-label>
          <q-item-label caption>{{ $t('settings.darkModeDesc') }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-toggle v-model="darkMode" color="primary" />
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
          <q-chip v-if="isInstalled" color="positive" text-color="white" size="sm" dense>
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

    <!-- Account -->
    <div class="text-subtitle2 text-grey-7 q-mb-sm q-ml-sm">{{ $t('settings.account') }}</div>
    <q-list bordered class="rounded-borders q-mb-md">
      <q-item v-ripple clickable @click="confirmLogout">
        <q-item-section avatar>
          <q-icon name="logout" color="negative" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-negative">{{ $t('settings.logout') }}</q-item-label>
          <q-item-label caption>{{ $t('settings.logoutDesc') }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item v-ripple clickable @click="showDeleteAccountDialog = true">
        <q-item-section avatar>
          <q-icon name="person_remove" color="negative" />
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-negative">{{ $t('settings.deleteAccount') }}</q-item-label>
          <q-item-label caption>{{ $t('settings.deleteAccountDesc') }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

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

    <!-- Milk Price Dialog -->
    <q-dialog v-model="showMilkPriceDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">{{ $t('settings.milkPrice') }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input
            v-model.number="milkPriceInput"
            type="number"
            :label="$t('settings.milkPriceLabel')"
            :prefix="getCurrencySymbol()"
            :suffix="'/' + $t('units.l')"
            outlined
            autofocus
            :rules="[(val) => val > 0 || $t('settings.milkPricePositive')]"
            @keyup.enter="saveMilkPrice"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="$t('common.cancel')" />
          <q-btn flat color="primary" :label="$t('common.save')" @click="saveMilkPrice" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Sync History Drawer -->
    <SyncHistoryDrawer v-model="showSyncHistory" />

    <!-- Delete Account Dialog -->
    <q-dialog v-model="showDeleteAccountDialog" persistent>
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6 text-negative">{{ $t('settings.deleteAccount') }}</div>
          <div class="text-body2 q-mt-sm">{{ $t('settings.deleteAccountWarning') }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input
            v-model="deletePin"
            type="password"
            :label="$t('settings.enterPin')"
            outlined
            mask="####"
            maxlength="4"
            :error="!!deletePinError"
            :error-message="deletePinError"
            autofocus
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="$t('common.cancel')" @click="deletePin = ''; deletePinError = ''" />
          <q-btn
            flat
            color="negative"
            :label="$t('settings.deleteAccount')"
            :loading="deletingAccount"
            :disable="deletePin.length !== 4"
            @click="deleteAccount"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Organization Dialog -->
    <q-dialog v-model="showOrgDialog">
      <q-card class="scroll-list--80vh">
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
        <q-list class="scroll-list scroll-list--300">
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
import { api } from 'src/lib/api';
import { useI18n } from 'vue-i18n';
import SyncHistoryDrawer from 'src/components/pwa/SyncHistoryDrawer.vue';
import { useSettingsStore } from 'src/stores/settings';
import { useCurrency } from 'src/composables/useCurrency';
import {
  isPushSupported,
  pushSubscribed,
  pushLoading,
  pushPermission,
  subscribeToPush,
  unsubscribeFromPush,
  initPushState,
} from 'src/services/push-notifications';

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

const settingsStore = useSettingsStore();
const { formatCurrency, getCurrencySymbol } = useCurrency();

const notifications = ref(false);
const showDeleteAccountDialog = ref(false);
const deletePin = ref('');
const deletePinError = ref('');
const deletingAccount = ref(false);
const darkMode = ref($q.dark.isActive);

// Milk price
const showMilkPriceDialog = ref(false);
const milkPriceInput = ref<number | null>(settingsStore.milkPricePerLiter);

function saveMilkPrice(): void {
  if (milkPriceInput.value && milkPriceInput.value > 0) {
    settingsStore.saveMilkPrice(milkPriceInput.value);
    $q.notify({ type: 'positive', message: t('settings.milkPriceSaved') });
  }
  showMilkPriceDialog.value = false;
}
const pushSupported = isPushSupported();
const showSyncHistory = ref(false);
const profileImage = computed(() => authStore.profileImage);

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
      // Backend returns { success, count, organizations: [...] }
      const data = orgsRes.data;
      organizations.value = Array.isArray(data) ? data : (data.organizations || []);
    }
  } catch (error) {
    console.error('Failed to fetch organizations:', error);
    $q.notify({
      type: 'warning',
      message: t('settings.orgFetchError'),
      position: 'bottom',
    });
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
    $q.notify({
      type: 'warning',
      message: t('settings.languageSaveError'),
      position: 'bottom',
    });
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
    // Redirect to home so dashboard reloads with role-appropriate content
    router.replace('/');
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

async function deleteAccount() {
  if (deletePin.value.length !== 4) return;
  deletePinError.value = '';
  deletingAccount.value = true;
  try {
    await api.post('/api/v1/user-delete-account', {
      user_id: authStore.userId,
      pin: deletePin.value,
    });
    showDeleteAccountDialog.value = false;
    await db.clearUserData();
    await authStore.logout();
    router.push('/auth/login');
    $q.notify({ type: 'positive', message: t('settings.accountDeleted') });
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
    deletePinError.value = msg || t('settings.deleteAccountFailed');
  } finally {
    deletingAccount.value = false;
  }
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

// Watch dark mode toggle
watch(darkMode, (val) => {
  $q.dark.set(val);
  localStorage.setItem('darkMode', val ? '1' : '0');
});

// Watch notification toggle to subscribe/unsubscribe
watch(notifications, async (enabled) => {
  if (!authStore.userId) return;
  if (enabled) {
    const ok = await subscribeToPush(authStore.userId);
    if (!ok) {
      // Revert toggle if subscription failed
      notifications.value = false;
      if (pushPermission.value === 'denied') {
        $q.notify({
          type: 'warning',
          message: t('settings.pushDenied'),
          position: 'bottom',
        });
      }
    }
  } else {
    await unsubscribeFromPush();
  }
});

onMounted(async () => {
  // Initialize push notification state
  await initPushState();
  notifications.value = pushSubscribed.value;

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
  border-radius: $radius-loose;
  overflow: hidden;
}

// Prevent q-item active/focus state from persisting on touch
:deep(.q-item--active),
:deep(.q-item.q-router-link--active) {
  background: transparent;
}
</style>
