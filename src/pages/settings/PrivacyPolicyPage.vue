<template>
  <q-page class="q-pa-md">
    <div class="text-body2 text-grey-7 q-mb-md">
      {{ $t('privacy.lastUpdated', { date: '2026-02-01' }) }}
    </div>

    <!-- Data Collection -->
    <div class="text-subtitle2 text-grey-7 q-mb-sm">{{ $t('privacy.dataCollection') }}</div>
    <q-list bordered class="rounded-borders q-mb-md">
      <q-item>
        <q-item-section>
          <q-item-label caption>{{ $t('privacy.dataCollectionDesc') }}</q-item-label>
          <q-item-label class="q-mt-sm text-body2">
            <ul class="q-pl-md q-my-none">
              <li v-for="item in dataCollectedKeys" :key="item">
                {{ $t(`privacy.dataCollected.${item}`) }}
              </li>
            </ul>
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- How Data is Used -->
    <div class="text-subtitle2 text-grey-7 q-mb-sm">{{ $t('privacy.dataUsage') }}</div>
    <q-list bordered class="rounded-borders q-mb-md">
      <q-item>
        <q-item-section>
          <q-item-label caption>{{ $t('privacy.dataUsageDesc') }}</q-item-label>
          <q-item-label class="q-mt-sm text-body2">
            <ul class="q-pl-md q-my-none">
              <li v-for="item in dataUsageKeys" :key="item">
                {{ $t(`privacy.dataUsageItems.${item}`) }}
              </li>
            </ul>
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Data Storage -->
    <div class="text-subtitle2 text-grey-7 q-mb-sm">{{ $t('privacy.dataStorage') }}</div>
    <q-list bordered class="rounded-borders q-mb-md">
      <q-item>
        <q-item-section>
          <q-item-label caption>{{ $t('privacy.dataStorageDesc') }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Data Sharing -->
    <div class="text-subtitle2 text-grey-7 q-mb-sm">{{ $t('privacy.dataSharing') }}</div>
    <q-list bordered class="rounded-borders q-mb-md">
      <q-item>
        <q-item-section>
          <q-item-label caption>{{ $t('privacy.dataSharingDesc') }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Your Rights -->
    <div class="text-subtitle2 text-grey-7 q-mb-sm">{{ $t('privacy.yourRights') }}</div>
    <q-list bordered class="rounded-borders q-mb-md">
      <q-item>
        <q-item-section>
          <q-item-label caption>{{ $t('privacy.yourRightsDesc') }}</q-item-label>
          <q-item-label class="q-mt-sm text-body2">
            <ul class="q-pl-md q-my-none">
              <li v-for="item in rightsKeys" :key="item">
                {{ $t(`privacy.rightsItems.${item}`) }}
              </li>
            </ul>
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Contact -->
    <div class="text-subtitle2 text-grey-7 q-mb-sm">{{ $t('privacy.contact') }}</div>
    <q-list bordered class="rounded-borders q-mb-md">
      <q-item v-ripple clickable tag="a" href="mailto:privacy@rationsmart.app">
        <q-item-section avatar>
          <q-icon name="email" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('privacy.contactEmail') }}</q-item-label>
          <q-item-label caption>privacy@rationsmart.app</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="open_in_new" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup lang="ts">
const dataCollectedKeys = ['name', 'email', 'phone', 'location', 'cowData', 'milkData'];
const dataUsageKeys = ['dietOptimization', 'reporting', 'farmingInsights'];
const rightsKeys = ['access', 'modify', 'delete'];
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: $radius-loose;
  overflow: hidden;
}
</style>
