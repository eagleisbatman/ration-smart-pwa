<template>
  <div class="country-select-page">
    <div class="text-h6 text-center q-mb-lg">Select Your Country</div>

    <q-list separator>
      <q-item
        v-for="country in countries"
        :key="country.code"
        v-ripple
        clickable
        @click="selectCountry(country.code)"
      >
        <q-item-section avatar>
          <span class="text-h5">{{ country.flag }}</span>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ country.name }}</q-item-label>
          <q-item-label caption>{{ country.languages }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const countries = [
  { code: 'IN', name: 'India', flag: '🇮🇳', languages: 'English, Hindi' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', languages: 'English, Swahili' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', languages: 'Amharic, English' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', languages: 'Nepali, English' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', languages: 'Bengali, English' },
];

function selectCountry(code: string) {
  // Store selected country and proceed to registration
  sessionStorage.setItem('selected_country', code);
  router.push('/auth/register');
}
</script>

<style lang="scss" scoped>
.country-select-page {
  padding: 0 8px;
}
</style>
