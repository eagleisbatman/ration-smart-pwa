<template>
  <div class="language-select-page">
    <div class="text-center q-mb-xl">
      <div class="text-h5 text-weight-medium q-mb-sm">{{ $t('onboarding.chooseLanguage') }}</div>
      <div class="text-body2 text-grey-7">{{ $t('onboarding.step1of4') }}</div>
    </div>

    <q-list separator class="rounded-borders">
      <q-item
        v-for="lang in languages"
        :key="lang.value"
        v-ripple
        clickable
        :active="selectedLanguage === lang.value"
        active-class="bg-primary-1"
        @click="selectLanguage(lang.value)"
      >
        <q-item-section avatar>
          <q-avatar color="grey-2" text-color="grey-8" size="48px">
            {{ lang.flag }}
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label class="text-weight-medium">{{ lang.nativeLabel }}</q-item-label>
          <q-item-label caption>{{ lang.label }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon
            :name="selectedLanguage === lang.value ? 'check_circle' : 'radio_button_unchecked'"
            :color="selectedLanguage === lang.value ? 'primary' : 'grey-5'"
            size="24px"
          />
        </q-item-section>
      </q-item>
    </q-list>

    <div class="q-mt-xl">
      <q-btn
        :label="$t('common.next')"
        color="primary"
        class="full-width"
        size="lg"
        unelevated
        :disable="!selectedLanguage"
        @click="proceed"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { setLocale, availableLocales } from 'src/boot/i18n';

const router = useRouter();

const languages = [
  { ...availableLocales[0], flag: '🇬🇧' }, // English
  { ...availableLocales[1], flag: '🇮🇳' }, // Hindi
  { ...availableLocales[2], flag: '🇮🇳' }, // Telugu
  { ...availableLocales[3], flag: '🇮🇳' }, // Kannada
  { ...availableLocales[4], flag: '🇻🇳' }, // Vietnamese
  { ...availableLocales[5], flag: '🇮🇳' }, // Marathi
];

const selectedLanguage = ref<string>(localStorage.getItem('locale') || 'en');

function selectLanguage(lang: string) {
  selectedLanguage.value = lang;
  setLocale(lang);
}

function proceed() {
  // Store the selected language preference
  sessionStorage.setItem('onboarding_language', selectedLanguage.value);
  router.push('/auth/role');
}
</script>

<style lang="scss" scoped>
.language-select-page {
  padding: 16px;
  max-width: 500px;
  margin: 0 auto;
}

.bg-primary-1 {
  background-color: rgba(46, 125, 50, 0.08);
}
</style>
