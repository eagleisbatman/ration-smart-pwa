<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="emit('update:modelValue', $event)">
    <q-card>
      <!-- Header -->
      <q-card-section class="row items-center q-pb-sm">
        <div class="text-h6">
          {{ type === 'email' ? $t('profile.changeEmail') : $t('profile.changePhone') }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense @click="onClose" />
      </q-card-section>

      <q-separator />

      <!-- Step 1: Enter new value -->
      <template v-if="step === 1">
        <q-card-section>
          <!-- Current value reference -->
          <div class="text-caption text-grey-7 q-mb-md">
            {{ $t('profile.currentValue', { value: currentValue }) }}
          </div>

          <!-- Warning banner -->
          <q-banner class="bg-warning-1 text-warning q-mb-md" rounded dense>
            <template #avatar>
              <q-icon name="warning" color="warning" />
            </template>
            {{ $t('profile.changeWarning', { type: typeLabel }) }}
          </q-banner>

          <!-- New value input -->
          <q-input
            v-model="newValue"
            :label="type === 'email' ? $t('profile.newEmail') : $t('profile.newPhone')"
            :type="type === 'email' ? 'email' : 'tel'"
            outlined
            autofocus
            :rules="validationRules"
            :hint="type === 'email' ? $t('profile.enterNewEmail') : $t('profile.enterNewPhone')"
            :error="!!error"
            :error-message="error || undefined"
          >
            <template #prepend>
              <q-icon :name="type === 'email' ? 'email' : 'phone'" />
            </template>
          </q-input>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat :label="$t('common.cancel')" @click="onClose" />
          <q-btn
            :label="$t('profile.sendCode')"
            color="primary"
            unelevated
            :loading="loading"
            :disable="!isNewValueValid"
            @click="requestChange"
          />
        </q-card-actions>
      </template>

      <!-- Step 2: Verify OTP code -->
      <template v-if="step === 2">
        <q-card-section>
          <div class="text-body2 text-grey-7 q-mb-md">
            {{ $t('profile.verificationSent', { value: newValue }) }}
          </div>

          <!-- OTP input -->
          <q-input
            v-model="otpCode"
            :label="$t('profile.enterCode')"
            outlined
            autofocus
            mask="######"
            :rules="[(val: string) => (val && val.length >= 4) || $t('profile.invalidCode')]"
            :error="!!error"
            :error-message="error || undefined"
          >
            <template #prepend>
              <q-icon name="pin" />
            </template>
          </q-input>

          <!-- Resend button with cooldown -->
          <div class="q-mt-sm text-center">
            <q-btn
              v-if="cooldownSeconds > 0"
              flat
              dense
              disable
              size="sm"
              :label="$t('profile.resendIn', { seconds: cooldownSeconds })"
            />
            <q-btn
              v-else
              flat
              dense
              size="sm"
              color="primary"
              :label="$t('profile.resendCode')"
              :loading="loading"
              @click="requestChange"
            />
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat :label="$t('common.back')" @click="step = 1" />
          <q-btn
            :label="$t('profile.verify')"
            color="primary"
            unelevated
            :loading="loading"
            :disable="otpCode.length < 4"
            @click="verifyChange"
          />
        </q-card-actions>
      </template>

      <!-- Step 3: Success -->
      <template v-if="step === 3">
        <q-card-section class="text-center q-py-lg">
          <q-icon name="check_circle" color="positive" size="64px" class="q-mb-md" />
          <div class="text-h6 q-mb-sm">{{ $t('common.success') }}</div>
          <div class="text-body2 text-grey-7">
            {{ $t('profile.changeSuccess', { type: typeLabel }) }}
          </div>
        </q-card-section>

        <q-card-actions align="center" class="q-pb-md">
          <q-btn
            :label="$t('common.done')"
            color="primary"
            unelevated
            @click="onDone"
          />
        </q-card-actions>
      </template>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from 'src/stores/auth';

const props = defineProps<{
  modelValue: boolean;
  type: 'email' | 'phone';
  currentValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'changed'): void;
}>();

const { t } = useI18n();
const authStore = useAuthStore();

const step = ref(1);
const newValue = ref('');
const otpCode = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const cooldownSeconds = ref(0);

let cooldownTimer: ReturnType<typeof setInterval> | null = null;

const typeLabel = computed(() =>
  props.type === 'email' ? t('profile.email').toLowerCase() : t('profile.phone').toLowerCase()
);

const isNewValueValid = computed(() => {
  if (!newValue.value) return false;
  if (newValue.value === props.currentValue) return false;
  if (props.type === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newValue.value);
  }
  // Phone: at least 7 digits
  return /^\+?[\d\s()-]{7,}$/.test(newValue.value);
});

const validationRules = computed(() => {
  if (props.type === 'email') {
    return [
      (val: string) => !!val || t('auth.emailRequired'),
      (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || t('auth.invalidEmail'),
    ];
  }
  return [
    (val: string) => !!val || t('validation.required'),
    (val: string) => /^\+?[\d\s()-]{7,}$/.test(val) || t('validation.phone'),
  ];
});

function startCooldown() {
  cooldownSeconds.value = 60;
  if (cooldownTimer) clearInterval(cooldownTimer);
  cooldownTimer = setInterval(() => {
    cooldownSeconds.value -= 1;
    if (cooldownSeconds.value <= 0) {
      if (cooldownTimer) clearInterval(cooldownTimer);
      cooldownTimer = null;
    }
  }, 1000);
}

async function requestChange() {
  loading.value = true;
  error.value = null;

  const success = await authStore.requestContactChange(props.type, newValue.value);

  loading.value = false;

  if (success) {
    step.value = 2;
    otpCode.value = '';
    startCooldown();
  } else {
    error.value = authStore.error;
  }
}

async function verifyChange() {
  loading.value = true;
  error.value = null;

  const success = await authStore.verifyContactChange(props.type, newValue.value, otpCode.value);

  loading.value = false;

  if (success) {
    step.value = 3;
  } else {
    error.value = authStore.error;
  }
}

function onClose() {
  emit('update:modelValue', false);
  resetState();
}

function onDone() {
  emit('changed');
  emit('update:modelValue', false);
  resetState();
}

function resetState() {
  step.value = 1;
  newValue.value = '';
  otpCode.value = '';
  error.value = null;
  cooldownSeconds.value = 0;
  if (cooldownTimer) {
    clearInterval(cooldownTimer);
    cooldownTimer = null;
  }
}

// Reset state when dialog opens
watch(() => props.modelValue, (val) => {
  if (val) {
    resetState();
  }
});

onUnmounted(() => {
  if (cooldownTimer) {
    clearInterval(cooldownTimer);
  }
});
</script>
