<template>
  <div class="language-select-page">
    <OnboardingProgress :current-step="1" />

    <div class="text-center q-mb-xl">
      <div class="text-h5 text-weight-medium q-mb-sm">{{ $t('onboarding.chooseLanguage') }}</div>
    </div>

    <!-- Recommended languages for the user's country -->
    <div v-if="recommendedLanguages.length" class="q-mb-md">
      <div class="text-subtitle2 text-grey-7 q-mb-xs q-px-sm">
        {{ $t('onboarding.recommendedLanguages') }}
      </div>
      <q-list separator class="rounded-borders">
        <q-item
          v-for="lang in recommendedLanguages"
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
    </div>

    <!-- Other languages (expandable) -->
    <div v-if="otherLanguages.length">
      <q-btn
        flat
        dense
        no-caps
        class="text-subtitle2 text-grey-7 q-mb-xs q-px-sm"
        :icon-right="showOtherLanguages ? 'expand_less' : 'expand_more'"
        :label="$t('onboarding.otherLanguages')"
        @click="showOtherLanguages = !showOtherLanguages"
      />
      <q-slide-transition>
        <q-list v-show="showOtherLanguages" separator class="rounded-borders">
          <q-item
            v-for="lang in otherLanguages"
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
      </q-slide-transition>
    </div>

    <!-- Fallback: show all languages in a flat list when no country is set -->
    <q-list v-if="!recommendedLanguages.length" separator class="rounded-borders">
      <q-item
        v-for="lang in allLanguages"
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
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { setLocale, availableLocales } from 'src/boot/i18n';
import { setOnboardingItem, getOnboardingItem } from 'src/lib/onboarding-storage';
import OnboardingProgress from 'src/components/ui/OnboardingProgress.vue';

const router = useRouter();

// Country code to recommended language codes mapping
const countryLanguageMap: Record<string, string[]> = {
  IN: ['en', 'hi', 'te', 'kn', 'mr', 'ta', 'bn', 'ml', 'gu', 'pa', 'or', 'as', 'ur', 'ne'],
  ET: ['en', 'am', 'om'],
  KE: ['en'],
  VN: ['vi', 'en'],
  BD: ['bn', 'en'],
  NP: ['ne', 'en', 'hi'],
  ID: ['id', 'en'],
  PH: ['fil', 'en'],
  TH: ['th', 'en'],
  MA: ['ar', 'fr', 'en'],
};

// Language code to short label mapping (replaces Unicode flag emoji that renders
// as broken boxes on Windows and some Android devices)
const langLabelMap: Record<string, string> = {
  en: 'EN',
  hi: 'HI',
  te: 'TE',
  kn: 'KN',
  mr: 'MR',
  ta: 'TA',
  bn: 'BN',
  ml: 'ML',
  gu: 'GU',
  pa: 'PA',
  or: 'OR',
  as: 'AS',
  ur: 'UR',
  ne: 'NE',
  vi: 'VI',
  am: 'AM',
  om: 'OM',
  id: 'ID',
  fil: 'FIL',
  th: 'TH',
  ar: 'AR',
  fr: 'FR',
};

// Build the full list of languages from availableLocales
const allLanguages = availableLocales.map(locale => ({
  ...locale,
  flag: langLabelMap[locale.value] || locale.value.toUpperCase(),
}));

// Get the user's selected country
const selectedCountry = getOnboardingItem('selected_country');
const countryCodes = selectedCountry ? (countryLanguageMap[selectedCountry] || []) : [];

// Split into recommended and other
const recommendedLanguages = computed(() => {
  if (!countryCodes.length) return [];
  return countryCodes
    .map(code => allLanguages.find(l => l.value === code))
    .filter(Boolean) as typeof allLanguages;
});

const otherLanguages = computed(() => {
  if (!countryCodes.length) return [];
  const recommendedCodes = new Set(countryCodes);
  return allLanguages.filter(l => !recommendedCodes.has(l.value));
});

const selectedLanguage = ref<string>(
  getOnboardingItem('onboarding_language') || localStorage.getItem('locale') || 'en'
);

// Auto-expand "Other Languages" if the current selection is in that section
const isSelectedInOther = countryCodes.length > 0 && !countryCodes.includes(selectedLanguage.value);
const showOtherLanguages = ref(isSelectedInOther);

function selectLanguage(lang: string) {
  selectedLanguage.value = lang;
  setLocale(lang);
}

function proceed() {
  // Store the selected language preference
  setOnboardingItem('onboarding_language', selectedLanguage.value);
  router.push('/auth/role');
}
</script>

<style lang="scss" scoped>
.bg-primary-1 {
  background-color: rgba(46, 125, 50, 0.08);
}
</style>
