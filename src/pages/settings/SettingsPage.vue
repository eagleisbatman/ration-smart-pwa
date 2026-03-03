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
          <q-item-label caption>{{ userPhone }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Preferences Section -->
    <div class="text-subtitle2 text-grey-7 q-mb-sm">{{ $t('settings.preferences') }}</div>
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

      <!-- Theme -->
      <q-item v-ripple clickable @click="showThemeDialog = true">
        <q-item-section avatar>
          <q-icon name="palette" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('settings.theme') }}</q-item-label>
          <q-item-label caption>
            <span class="row items-center no-wrap" style="gap: 6px">
              <span
                v-for="(color, idx) in currentThemeSwatches"
                :key="idx"
                class="theme-swatch-dot"
                :style="{ background: color }"
              />
              {{ $t(currentThemeNameKey) }}
            </span>
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
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

    <!-- About -->
    <div class="text-subtitle2 text-grey-7 q-mb-sm">{{ $t('settings.about') }}</div>
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

      <q-item v-ripple clickable @click="router.push('/settings/feedback')">
        <q-item-section avatar>
          <q-icon name="feedback" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('settings.feedback') }}</q-item-label>
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
    <div class="text-subtitle2 text-grey-7 q-mb-sm">{{ $t('settings.account') }}</div>
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

    <!-- Theme Picker Dialog -->
    <q-dialog v-model="showThemeDialog">
      <q-card style="min-width: 320px; max-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ $t('settings.chooseTheme') }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <div class="row q-gutter-sm justify-start">
            <div
              v-for="tid in themeIds"
              :key="tid"
              class="theme-card"
              :class="{ 'theme-card--active': tid === selectedThemeId }"
              @click="selectTheme(tid)"
            >
              <div class="row justify-center" style="gap: 6px">
                <span
                  v-for="(color, idx) in themes[tid].swatches"
                  :key="idx"
                  class="theme-swatch"
                  :style="{ background: color }"
                />
              </div>
              <div class="text-caption text-center q-mt-xs">
                {{ $t(themes[tid].nameKey) }}
              </div>
              <div class="text-center" style="height: 18px">
                <q-icon
                  v-if="tid === selectedThemeId"
                  name="check_circle"
                  color="primary"
                  size="16px"
                />
              </div>
            </div>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat :label="$t('common.close')" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import { isInstalled, canInstall, installPWA } from 'src/boot/pwa';
import { availableLocales, setLocale, getLocale } from 'src/boot/i18n';
import { useI18n } from 'vue-i18n';
import {
  THEMES,
  THEME_IDS,
  currentThemeId,
  applyTheme,
} from 'src/lib/themes';

const router = useRouter();
const $q = useQuasar();
const authStore = useAuthStore();
const { t } = useI18n();

const darkMode = ref($q.dark.isActive);

// Theme
const showThemeDialog = ref(false);
const themes = THEMES;
const themeIds = THEME_IDS;
const selectedThemeId = currentThemeId;
const currentThemeSwatches = computed(() => THEMES[currentThemeId.value]?.swatches || THEMES.zinc.swatches);
const currentThemeNameKey = computed(() => THEMES[currentThemeId.value]?.nameKey || 'theme.zinc');

function selectTheme(id: string): void {
  applyTheme(id, $q.dark.isActive);
  showThemeDialog.value = false;
}

const profileImage = computed(() => authStore.profileImage);

// Language
const showLanguageDialog = ref(false);
const currentLanguage = ref(getLocale());
const currentLanguageLabel = computed(() => {
  const lang = availableLocales.find((l) => l.value === currentLanguage.value);
  return lang ? lang.nativeLabel : currentLanguage.value;
});

const userName = computed(() => authStore.user?.name || t('profile.defaultUserName'));
const userPhone = computed(() => authStore.user?.phone || '');

async function changeLanguage(locale: string) {
  setLocale(locale);
  currentLanguage.value = locale;

  try {
    await authStore.updateUserSettings({ language_code: locale });
  } catch (error) {
    console.error('Failed to save language preference:', error);
  }

  showLanguageDialog.value = false;
}

async function showInstallPrompt() {
  if (isInstalled.value) {
    $q.notify({ type: 'info', message: t('settings.alreadyInstalled') });
    return;
  }

  if (canInstall.value) {
    await installPWA();
  } else {
    $q.dialog({
      title: t('settings.installApp'),
      message: t('settings.iosInstallInstructions'),
      ok: t('common.ok'),
    });
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
  applyTheme(currentThemeId.value, val);
});
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: $radius-loose;
  overflow: hidden;
}

:deep(.q-item--active),
:deep(.q-item.q-router-link--active) {
  background: transparent;
}

.theme-swatch-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.theme-card {
  width: 90px;
  padding: 12px 8px 8px;
  border-radius: 8px;
  border: 2px solid rgba(128, 128, 128, 0.2);
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover {
    border-color: rgba(128, 128, 128, 0.45);
  }

  &--active {
    border-color: var(--q-primary);
  }
}

.theme-swatch {
  width: 18px;
  height: 18px;
  border-radius: 50%;
}
</style>
