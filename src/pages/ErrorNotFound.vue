<template>
  <q-page class="flex flex-center">
    <div class="text-center q-pa-xl">
      <div class="text-h1 text-primary" style="font-size: 120px; line-height: 1">404</div>

      <h1 class="text-h5 q-mb-sm">Page Not Found</h1>

      <p class="text-body1 text-grey-7 q-mb-lg" style="max-width: 300px">
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>

      <q-btn
        label="Go Home"
        color="primary"
        unelevated
        size="lg"
        @click="router.push('/')"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>
