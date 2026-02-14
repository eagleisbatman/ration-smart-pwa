<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card class="dialog-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ $t('diet.reminder.title') }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <div class="text-body2 text-grey-7 q-mb-md" v-if="cowName">
          {{ cowName }} &mdash; {{ dietTitle }}
        </div>
        <div class="text-body2 text-grey-7 q-mb-md" v-else>
          {{ dietTitle }}
        </div>

        <!-- Reminder timing options -->
        <q-option-group
          v-model="selectedOption"
          :options="timingOptions"
          color="primary"
          class="q-mb-md"
        />

        <!-- Custom date picker (shown only when custom is selected) -->
        <q-input
          v-if="selectedOption === 'custom'"
          v-model="customDate"
          :label="$t('diet.reminder.customDate')"
          type="date"
          outlined
          :min="minDate"
          class="q-mb-md"
        />

        <!-- Optional note -->
        <q-input
          v-model="note"
          :label="$t('diet.reminder.note')"
          outlined
          autogrow
          maxlength="200"
        />
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat :label="$t('common.cancel')" v-close-popup />
        <q-btn
          unelevated
          color="primary"
          :label="$t('common.save')"
          :disable="selectedOption === 'custom' && !customDate"
          @click="saveReminder"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { format, addDays } from 'date-fns';
import { addDietReminder } from 'src/lib/diet-reminders';

const props = defineProps<{
  modelValue: boolean;
  dietId: string;
  dietTitle: string;
  cowName?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const { t } = useI18n();
const $q = useQuasar();

const selectedOption = ref<string>('7');
const customDate = ref('');
const note = ref('');

const minDate = computed(() => format(addDays(new Date(), 1), 'yyyy-MM-dd'));

const timingOptions = computed(() => [
  { label: t('diet.reminder.in7Days'), value: '7' },
  { label: t('diet.reminder.in14Days'), value: '14' },
  { label: t('diet.reminder.in30Days'), value: '30' },
  { label: t('diet.reminder.customDate'), value: 'custom' },
]);

function saveReminder(): void {
  let reminderDate: string;

  if (selectedOption.value === 'custom') {
    if (!customDate.value) return;
    reminderDate = customDate.value;
  } else {
    const days = parseInt(selectedOption.value, 10);
    reminderDate = format(addDays(new Date(), days), 'yyyy-MM-dd');
  }

  addDietReminder({
    dietId: props.dietId,
    dietTitle: props.dietTitle,
    cowName: props.cowName,
    reminderDate,
    note: note.value || undefined,
  });

  $q.notify({
    type: 'positive',
    message: t('diet.reminder.saved'),
    icon: 'alarm_on',
  });

  // Reset form
  selectedOption.value = '7';
  customDate.value = '';
  note.value = '';

  emit('saved');
  emit('update:modelValue', false);
}
</script>
