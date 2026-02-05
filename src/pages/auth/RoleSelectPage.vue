<template>
  <div class="role-select-page">
    <div class="text-center q-mb-xl">
      <div class="text-h5 text-weight-medium q-mb-sm">{{ $t('onboarding.chooseRole') }}</div>
      <div class="text-body2 text-grey-7">{{ $t('onboarding.step2of4') }}</div>
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
          <q-card-section class="text-center">
            <q-icon
              :name="role.icon"
              size="48px"
              :color="selectedRole === role.value ? 'primary' : 'grey-6'"
              class="q-mb-sm"
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

const router = useRouter();

const roles = [
  { value: 'farmer', icon: 'agriculture' },
  { value: 'student', icon: 'school' },
  { value: 'nutritionist', icon: 'science' },
  { value: 'extensionWorker', icon: 'groups' },
  { value: 'researcher', icon: 'biotech' },
];

const selectedRole = ref<string>('farmer');

function selectRole(role: string) {
  selectedRole.value = role;
}

function proceed() {
  // Store the selected role
  sessionStorage.setItem('onboarding_role', selectedRole.value);
  router.push('/auth/organization');
}
</script>

<style lang="scss" scoped>
.role-select-page {
  padding: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.role-card {
  position: relative;
  transition: all 0.2s ease;
  border-radius: 12px;

  &:hover {
    border-color: var(--q-primary);
  }

  &--selected {
    border-color: var(--q-primary);
    border-width: 2px;
    background-color: rgba(46, 125, 50, 0.04);
  }
}

.role-check {
  position: absolute;
  top: 8px;
  right: 8px;
}
</style>
