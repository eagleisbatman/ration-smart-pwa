<template>
  <div class="onboarding-progress q-mb-lg">
    <div class="progress-steps">
      <template v-for="step in totalSteps" :key="step">
        <!-- Connector line (before steps 2, 3, 4) -->
        <div
          v-if="step > 1"
          class="progress-connector"
          :class="{ 'progress-connector--completed': step <= currentStep }"
        />
        <!-- Step circle -->
        <div
          class="progress-circle"
          :class="{
            'progress-circle--completed': step < currentStep,
            'progress-circle--active': step === currentStep,
            'progress-circle--upcoming': step > currentStep,
          }"
        >
          <q-icon v-if="step < currentStep" name="check" size="14px" />
          <span v-else>{{ step }}</span>
        </div>
      </template>
    </div>
    <div class="text-body2 text-grey-7 text-center q-mt-sm">
      {{ $t(`onboarding.step${currentStep}of${totalSteps}`) }}
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  currentStep: number;
  totalSteps?: number;
}>(), {
  totalSteps: 4,
});
</script>

<style lang="scss" scoped>
.onboarding-progress {
  padding: 0 16px;
}

.progress-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.progress-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
  transition: all 0.3s ease;

  &--completed {
    background-color: var(--q-primary);
    color: #fff;
  }

  &--active {
    background-color: var(--q-primary);
    color: #fff;
    box-shadow: 0 0 0 4px rgba(46, 125, 50, 0.18);
  }

  &--upcoming {
    background-color: #e0e0e0;
    color: #9e9e9e;
  }
}

.progress-connector {
  width: 40px;
  height: 3px;
  background-color: #e0e0e0;
  flex-shrink: 0;
  transition: background-color 0.3s ease;
  border-radius: 2px;

  &--completed {
    background-color: var(--q-primary);
  }
}
</style>
