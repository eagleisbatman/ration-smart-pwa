<template>
  <div class="fullscreen flex flex-center">
    <div class="text-center q-pa-xl">
      <div class="text-h1 text-primary error-code">404</div>

      <h1 class="text-h5 q-mb-sm">{{ $t('errors.pageNotFound') }}</h1>

      <p class="text-body1 text-grey-7 q-mb-lg text-constrain text-constrain--md">
        {{ $t('errors.pageNotFoundDescription') }}
      </p>

      <q-btn
        :label="$t('errors.goHome')"
        color="primary"
        unelevated
        size="lg"
        @click="router.push('/')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();
</script>

<style lang="scss" scoped>
.error-code {
  font-size: clamp(72px, 20vw, 120px);
  line-height: 1;
}
</style>
