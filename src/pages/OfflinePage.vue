<template>
  <div class="fullscreen flex flex-center">
    <div class="text-center q-pa-xl">
      <q-icon name="cloud_off" size="100px" color="grey-5" class="q-mb-lg" />

      <h1 class="text-h4 q-mb-sm">{{ $t('offline.youAreOffline') }}</h1>

      <!-- No cached data available -->
      <template v-if="hasCachedData === false">
        <p class="text-body1 text-grey-7 q-mb-md text-constrain text-constrain--lg">
          {{ $t('offline.noCachedData') }}
        </p>
        <p class="text-body2 text-grey-6 q-mb-lg text-constrain text-constrain--lg">
          {{ $t('offline.connectToLoad') }}
        </p>
      </template>

      <!-- Has cached data, just needs network for this page -->
      <template v-else-if="hasCachedData === true">
        <p class="text-body1 text-grey-7 q-mb-lg text-constrain text-constrain--md">
          {{ $t('offline.requiresConnection') }}
        </p>
      </template>

      <!-- Still checking cache status -->
      <template v-else>
        <p class="text-body1 text-grey-7 q-mb-lg text-constrain text-constrain--md">
          {{ $t('offline.requiresConnection') }}
        </p>
      </template>

      <q-btn
        :label="$t('offline.tryAgain')"
        color="primary"
        unelevated
        size="lg"
        @click="reload"
      />

      <div v-if="hasCachedData" class="q-mt-xl">
        <p class="text-caption text-grey-6">
          {{ $t('offline.featuresAvailable') }}
        </p>
        <q-btn
          flat
          color="primary"
          :label="$t('offline.goToHome')"
          @click="router.push('/')"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { db } from 'src/lib/offline/db';

const router = useRouter();

// null = still checking, true = has data, false = no data
const hasCachedData = ref<boolean | null>(null);

onMounted(async () => {
  try {
    const cowCount = await db.cows.count();
    const feedCount = await db.feeds.count();
    const userCount = await db.users.count();
    hasCachedData.value = cowCount > 0 || feedCount > 0 || userCount > 0;
  } catch {
    // If IndexedDB itself fails, treat as no cached data
    hasCachedData.value = false;
  }
});

function reload() {
  window.location.reload();
}
</script>
