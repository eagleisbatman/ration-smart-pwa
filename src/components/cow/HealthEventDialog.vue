<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card style="width: 100%; max-width: 450px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          {{ editEvent ? $t('health.editEvent') : $t('health.addEvent') }}
        </div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="onSave" class="q-gutter-md">
          <!-- Event Type -->
          <q-select
            v-model="form.event_type"
            :options="eventTypeOptions"
            :label="$t('health.eventType') + ' *'"
            emit-value
            map-options
            filled
            :rules="[val => !!val || $t('validation.required')]"
          />

          <!-- Title -->
          <q-input
            v-model="form.title"
            :label="$t('health.eventTitle') + ' *'"
            filled
            :rules="[val => !!val || $t('validation.required')]"
          />

          <!-- Event Date -->
          <q-input
            v-model="form.event_date"
            :label="$t('health.eventDate') + ' *'"
            type="date"
            filled
            :rules="[val => !!val || $t('validation.required')]"
          />

          <!-- Description -->
          <q-input
            v-model="form.description"
            :label="$t('health.description') + ' ' + $t('common.optionalSuffix')"
            filled
            autogrow
            type="textarea"
          />

          <!-- Next Due Date -->
          <q-input
            v-model="form.next_due_date"
            :label="$t('health.nextDueDate') + ' ' + $t('common.optionalSuffix')"
            type="date"
            filled
          />

          <!-- Veterinarian -->
          <q-input
            v-model="form.veterinarian"
            :label="$t('health.veterinarian') + ' ' + $t('common.optionalSuffix')"
            filled
          />

          <!-- Cost -->
          <q-input
            v-model.number="form.cost"
            :label="$t('health.cost') + ' ' + $t('common.optionalSuffix')"
            type="number"
            filled
            :prefix="currencySymbol"
            :rules="[val => val === null || val === undefined || val === '' || val >= 0 || $t('validation.positive')]"
          />
        </q-form>
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat :label="$t('common.cancel')" v-close-popup />
        <q-btn
          unelevated
          color="primary"
          :label="$t('common.save')"
          :disable="!isValid"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { db, HealthEvent } from 'src/lib/offline/db';
import { useCurrency } from 'src/composables/useCurrency';

const props = defineProps<{
  modelValue: boolean;
  cowId: string;
  editEvent?: HealthEvent | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const { t } = useI18n();
const $q = useQuasar();
const { getCurrencySymbol } = useCurrency();

const currencySymbol = computed(() => getCurrencySymbol());

const eventTypeOptions = computed(() => [
  { label: t('health.types.vaccination'), value: 'vaccination' },
  { label: t('health.types.treatment'), value: 'treatment' },
  { label: t('health.types.illness'), value: 'illness' },
  { label: t('health.types.deworming'), value: 'deworming' },
  { label: t('health.types.checkup'), value: 'checkup' },
  { label: t('health.types.other'), value: 'other' },
]);

const form = ref({
  event_type: '',
  title: '',
  event_date: format(new Date(), 'yyyy-MM-dd'),
  description: '',
  next_due_date: '',
  veterinarian: '',
  cost: null as number | null,
});

const isValid = computed(() => {
  return !!form.value.event_type && !!form.value.title && !!form.value.event_date;
});

// Watch for editEvent to populate form
watch(
  () => props.editEvent,
  (event) => {
    if (event) {
      form.value = {
        event_type: event.event_type,
        title: event.title,
        event_date: event.event_date,
        description: event.description || '',
        next_due_date: event.next_due_date || '',
        veterinarian: event.veterinarian || '',
        cost: event.cost ?? null,
      };
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

// Reset form when dialog opens without edit event
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen && !props.editEvent) {
      resetForm();
    }
  }
);

function resetForm() {
  form.value = {
    event_type: '',
    title: '',
    event_date: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    next_due_date: '',
    veterinarian: '',
    cost: null,
  };
}

async function onSave() {
  if (!isValid.value) return;

  const now = new Date().toISOString();

  try {
    if (props.editEvent?.id) {
      // Update existing event
      await db.healthEvents.update(props.editEvent.id, {
        event_type: form.value.event_type,
        title: form.value.title,
        event_date: form.value.event_date,
        description: form.value.description || undefined,
        next_due_date: form.value.next_due_date || undefined,
        veterinarian: form.value.veterinarian || undefined,
        cost: form.value.cost ?? undefined,
        updated_at: now,
        _synced: false,
      });

      $q.notify({
        type: 'positive',
        message: t('health.eventUpdated'),
        icon: 'check_circle',
      });
    } else {
      // Create new event
      const healthEvent: HealthEvent = {
        id: uuidv4(),
        cow_id: props.cowId,
        event_type: form.value.event_type,
        title: form.value.title,
        event_date: form.value.event_date,
        description: form.value.description || undefined,
        next_due_date: form.value.next_due_date || undefined,
        veterinarian: form.value.veterinarian || undefined,
        cost: form.value.cost ?? undefined,
        created_at: now,
        updated_at: now,
        _synced: false,
        _deleted: false,
      };

      await db.healthEvents.put(healthEvent);

      $q.notify({
        type: 'positive',
        message: t('health.eventSaved'),
        icon: 'check_circle',
      });
    }

    emit('saved');
    emit('update:modelValue', false);
  } catch (err) {
    console.error('[HealthEventDialog] Failed to save event:', err);
    $q.notify({
      type: 'negative',
      message: t('errors.generic'),
    });
  }
}
</script>
