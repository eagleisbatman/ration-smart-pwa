<template>
  <q-page class="q-pa-md">
    <!-- FAQ Section -->
    <div class="text-subtitle2 text-grey-7 q-mb-sm">{{ $t('help.faqTitle') }}</div>
    <q-list bordered class="rounded-borders q-mb-md">
      <q-expansion-item
        v-for="(faqKey, index) in faqKeys"
        :key="faqKey"
        :label="$t(`help.faq.${faqKey}.question`)"
        header-class="text-body1"
        expand-icon-class="text-primary"
      >
        <q-card>
          <q-card-section class="text-body2 text-grey-8">
            {{ $t(`help.faq.${faqKey}.answer`) }}
          </q-card-section>
        </q-card>
        <q-separator v-if="index < faqKeys.length - 1" />
      </q-expansion-item>
    </q-list>

    <!-- Contact Support -->
    <div class="text-subtitle2 text-grey-7 q-mb-sm">{{ $t('help.contactTitle') }}</div>
    <q-list bordered class="rounded-borders q-mb-md">
      <q-item>
        <q-item-section>
          <q-item-label caption>{{ $t('help.contactDescription') }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item v-ripple clickable tag="a" href="mailto:support@rationsmart.app">
        <q-item-section avatar>
          <q-icon name="email" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('help.emailSupport') }}</q-item-label>
          <q-item-label caption>support@rationsmart.app</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="open_in_new" />
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Report a Bug -->
    <div class="text-subtitle2 text-grey-7 q-mb-sm">{{ $t('help.reportBugTitle') }}</div>
    <q-list bordered class="rounded-borders q-mb-md">
      <q-item>
        <q-item-section>
          <q-item-label caption>{{ $t('help.reportBugDescription') }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item v-ripple clickable tag="a" href="mailto:bugs@rationsmart.app?subject=Bug Report">
        <q-item-section avatar>
          <q-icon name="bug_report" color="negative" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('help.reportBug') }}</q-item-label>
          <q-item-label caption>bugs@rationsmart.app</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="open_in_new" />
        </q-item-section>
      </q-item>
    </q-list>

    <!-- App Information -->
    <div class="text-subtitle2 text-grey-7 q-mb-sm">{{ $t('help.appInfoTitle') }}</div>
    <q-list bordered class="rounded-borders q-mb-md">
      <q-item>
        <q-item-section avatar>
          <q-icon name="info" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('help.version') }}</q-item-label>
          <q-item-label caption>{{ appVersion }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-separator />

      <q-item>
        <q-item-section avatar>
          <q-icon name="favorite" color="red" />
        </q-item-section>
        <q-item-section>
          <q-item-label caption>{{ $t('help.buildWith') }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup lang="ts">
const faqKeys = [
  'addCow',
  'logMilk',
  'dietOptimizer',
  'offlineUse',
  'changeLanguage',
  'dataSync',
];

const appVersion = '1.0.0';
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: $radius-loose;
  overflow: hidden;
}
</style>
