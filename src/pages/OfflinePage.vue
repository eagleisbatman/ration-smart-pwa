<template>
  <q-page class="flex flex-center">
    <div class="text-center q-pa-xl">
      <q-icon name="cloud_off" size="100px" color="grey-5" class="q-mb-lg" />

      <h1 class="text-h4 q-mb-sm">You're Offline</h1>

      <p class="text-body1 text-grey-7 q-mb-lg" style="max-width: 300px">
        This page requires an internet connection. Please check your connection and try again.
      </p>

      <q-btn
        label="Try Again"
        color="primary"
        unelevated
        size="lg"
        @click="reload"
      />

      <div class="q-mt-xl">
        <p class="text-caption text-grey-6">
          Some features like viewing your cows and milk logs are still available offline.
        </p>
        <q-btn
          flat
          color="primary"
          label="Go to Home"
          @click="router.push('/')"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function reload() {
  window.location.reload();
}
</script>
