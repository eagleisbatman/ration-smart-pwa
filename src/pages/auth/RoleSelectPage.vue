<template>
  <div class="role-select-page">
    <OnboardingProgress :current-step="2" />

    <div class="text-center q-mb-xl">
      <div class="text-h5 text-weight-medium q-mb-sm">{{ $t('onboarding.chooseRole') }}</div>
    </div>

    <div class="row q-col-gutter-md">
      <div
        v-for="role in roles"
        :key="role.value"
        class="col-12 col-sm-6"
      >
        <q-card
          flat
          bordered
          :class="['role-card cursor-pointer', { 'role-card--selected': selectedRole === role.value }]"
          @click="selectRole(role.value)"
        >
          <q-card-section class="text-center q-pa-lg">
            <q-icon
              :name="role.icon"
              size="48px"
              :color="selectedRole === role.value ? 'primary' : 'grey-6'"
              class="q-mb-sm role-icon"
            />
            <div class="text-subtitle1 text-weight-medium">{{ $t(`roles.${role.value}`) }}</div>
            <div class="text-caption text-grey-7 q-mt-xs">{{ $t(`roles.${role.value}Desc`) }}</div>
          </q-card-section>
          <q-icon
            v-if="selectedRole === role.value"
            name="check_circle"
            color="primary"
            size="24px"
            class="role-check"
          />
        </q-card>
      </div>
    </div>

    <div v-if="showValidation && !selectedRole" class="text-negative text-caption q-mt-md">
      {{ $t('onboarding.selectRoleRequired') }}
    </div>

    <div class="row q-mt-xl q-col-gutter-sm">
      <div class="col-4">
        <q-btn
          :label="$t('common.back')"
          flat
          color="grey-7"
          class="full-width"
          size="lg"
          @click="router.back()"
        />
      </div>
      <div class="col-8">
        <q-btn
          :label="$t('common.next')"
          color="primary"
          class="full-width"
          size="lg"
          unelevated
          :disable="!selectedRole"
          @click="proceed"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { getOnboardingItem, setOnboardingItem } from 'src/lib/onboarding-storage';
import OnboardingProgress from 'src/components/ui/OnboardingProgress.vue';

const router = useRouter();

const roles = [
  { value: 'farmer', icon: 'agriculture' },
  { value: 'extension_worker', icon: 'groups' },
  { value: 'nutritionist', icon: 'science' },
  { value: 'researcher', icon: 'biotech' },
  { value: 'feed_supplier', icon: 'storefront' },
  { value: 'other', icon: 'more_horiz' },
];

// Restore previous selection when navigating back
const selectedRole = ref<string | null>(getOnboardingItem('onboarding_role'));
const showValidation = ref(false);

function selectRole(role: string) {
  selectedRole.value = role;
  showValidation.value = false;
}

function proceed() {
  if (!selectedRole.value) {
    showValidation.value = true;
    return;
  }
  // Store the selected role
  setOnboardingItem('onboarding_role', selectedRole.value);
  router.push('/auth/organization');
}
</script>

<style lang="scss" scoped>
.role-select-page {
  /* Layout container handles max-width and centering */
}

.role-card {
  position: relative;
  transition: all 0.2s ease;
  border-radius: 12px;
  min-height: 140px;

  &:hover {
    border-color: var(--q-primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &--selected {
    border-color: var(--q-primary);
    border-width: 2px;
    background-color: rgba(46, 125, 50, 0.04);
    transform: scale(1.02);
    box-shadow: 0 4px 16px rgba(46, 125, 50, 0.15);
  }
}

.role-icon {
  transition: transform 0.2s ease;

  .role-card--selected & {
    transform: scale(1.1);
  }
}

.role-check {
  position: absolute;
  top: 8px;
  right: 8px;
}
</style>
