<template>
  <q-page class="q-pa-md">
    <q-form class="q-gutter-md" @submit="onSubmit">
      <!-- Cow Selection -->
      <q-select
        v-model="form.cow_id"
        :label="$t('logs.form.selectCow') + ' *'"
        outlined
        :options="cowOptions"
        emit-value
        map-options
        :rules="[(val) => !!val || $t('logs.form.selectCowRequired')]"
        @update:model-value="onCowSelected"
      >
        <template #prepend>
          <q-icon :name="COW_ICON" />
        </template>
      </q-select>

      <!-- Date -->
      <q-input
        v-model="form.log_date"
        :label="$t('logs.date') + ' *'"
        outlined
        readonly
        :rules="[(val) => !!val || $t('logs.form.dateRequired')]"
      >
        <template #prepend>
          <q-icon name="calendar_today" />
        </template>
        <template #append>
          <q-icon name="edit" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date v-model="form.log_date" mask="YYYY-MM-DD">
                <div class="row items-center justify-end">
                  <q-btn v-close-popup :label="$t('common.close')" color="primary" flat />
                </div>
              </q-date>
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>

      <!-- Milk Production -->
      <q-card flat bordered class="q-pa-md">
        <div class="text-subtitle2 q-mb-md">{{ $t('logs.form.milkProduction') }}</div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input
              v-model.number="form.morning_liters"
              :label="$t('logs.labels.morningFull')"
              type="number"
              step="0.1"
              outlined
              :rules="[(val) => val >= 0 || $t('logs.form.cannotBeNegative')]"
            >
              <template #prepend>
                <q-icon name="wb_sunny" color="warning" />
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-model.number="form.evening_liters"
              :label="$t('logs.labels.eveningFull')"
              type="number"
              step="0.1"
              outlined
              :rules="[(val) => val >= 0 || $t('logs.form.cannotBeNegative')]"
            >
              <template #prepend>
                <q-icon name="nightlight" color="primary" />
              </template>
            </q-input>
          </div>
        </div>

        <!-- Total Display -->
        <div class="text-center q-mt-md">
          <div class="text-caption text-grey-7">{{ $t('logs.labels.total') }}</div>
          <div class="text-h4 text-primary">{{ totalLiters.toFixed(1) }} {{ $t('units.l') }}</div>
        </div>
      </q-card>

      <!-- Diet Adherence (only when cow has active diet) -->
      <q-card v-if="activeDiet" flat bordered class="q-pa-md diet-adherence-card">
        <div class="text-subtitle2 q-mb-sm">{{ $t('diet.fedToday') }}</div>
        <div class="text-caption text-grey-7 q-mb-md">
          {{ activeDiet.cow_name || $t('diet.dietPlan') }} · {{ formatCurrency(activeDiet.total_cost ?? 0) }}{{ $t('diet.perDay') }}
        </div>
        <q-btn-toggle
          v-model="form.fed_diet"
          spread
          no-caps
          unelevated
          toggle-color="primary"
          :options="[
            { label: $t('diet.fedYes'), value: true },
            { label: $t('diet.fedNo'), value: false },
          ]"
        />
      </q-card>

      <!-- Optional Quality Metrics -->
      <q-card flat bordered class="q-pa-md">
        <div class="text-subtitle2 q-mb-md">{{ $t('logs.form.qualityMetrics') }}</div>

        <q-input
          v-model.number="form.fat_percentage"
          :label="$t('logs.form.fatPercentage')"
          type="number"
          step="0.1"
          outlined
          :hint="$t('logs.form.fatHint')"
          class="q-mb-md"
        >
          <template #prepend>
            <q-icon name="opacity" />
          </template>
        </q-input>

        <q-input
          v-model.number="form.snf_percentage"
          :label="$t('logs.form.snfPercentage')"
          type="number"
          step="0.1"
          outlined
          :hint="$t('logs.form.snfHint')"
          class="q-mb-md"
        >
          <template #prepend>
            <q-icon name="science" />
          </template>
        </q-input>

        <q-input
          v-model.number="form.temperature"
          :label="$t('logs.form.temperature')"
          type="number"
          step="0.1"
          outlined
          :hint="$t('logs.form.temperatureHint')"
        >
          <template #prepend>
            <q-icon name="thermostat" />
          </template>
        </q-input>
      </q-card>

      <!-- Notes -->
      <q-input
        v-model="form.notes"
        :label="$t('logs.form.notesOptional')"
        type="textarea"
        outlined
        rows="2"
        :hint="$t('logs.form.notesHint')"
      />

      <!-- Error Message -->
      <q-banner v-if="error" dense class="bg-negative text-white" rounded>
        {{ error }}
      </q-banner>

      <!-- Submit Button -->
      <q-btn
        :label="isEditing ? $t('logs.form.submit.update') : $t('logs.form.submit.save')"
        type="submit"
        color="primary"
        class="full-width"
        size="lg"
        unelevated
        :loading="loading"
      />

      <!-- Delete Button (Edit mode only) -->
      <q-btn
        v-if="isEditing"
        :label="$t('logs.form.deleteLog')"
        color="negative"
        flat
        class="full-width q-mt-sm"
        @click="confirmDelete"
      />
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { format } from 'date-fns';
import { useMilkLogsStore, MilkLogInput } from 'src/stores/milkLogs';
import { useCowsStore } from 'src/stores/cows';
import { useDietsStore } from 'src/stores/diets';
import { Diet } from 'src/lib/offline/db';
import { useCurrency } from 'src/composables/useCurrency';
import { COW_ICON } from 'src/boot/icons';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const { formatCurrency } = useCurrency();
const milkLogsStore = useMilkLogsStore();
const cowsStore = useCowsStore();
const dietsStore = useDietsStore();

const logId = computed(() => route.params.id as string | undefined);
const isEditing = computed(() => !!logId.value);

// Pre-fill cow_id from query params
const queryCowId = route.query.cow_id as string | undefined;

const activeDiet = ref<Diet | null>(null);

const form = reactive<MilkLogInput>({
  cow_id: queryCowId || '',
  cow_name: '',
  log_date: format(new Date(), 'yyyy-MM-dd'),
  morning_liters: 0,
  evening_liters: 0,
  fat_percentage: undefined,
  snf_percentage: undefined,
  temperature: undefined,
  notes: '',
  fed_diet: undefined,
  diet_history_id: undefined,
});

const loading = computed(() => milkLogsStore.loading);
const error = computed(() => milkLogsStore.error);

const totalLiters = computed(() => (form.morning_liters || 0) + (form.evening_liters || 0));

const cowOptions = computed(() =>
  cowsStore.activeCows.map((cow) => ({
    label: cow.name,
    value: cow.id,
  }))
);

async function onCowSelected(cowId: string) {
  const cow = cowsStore.activeCows.find((c) => c.id === cowId);
  if (cow) {
    form.cow_name = cow.name;
  }

  // Fetch active diet for this cow to show adherence toggle
  activeDiet.value = await dietsStore.getActiveDietForCow(cowId);
  if (activeDiet.value) {
    form.diet_history_id = activeDiet.value.id;
    // Default to undefined (user must choose)
    form.fed_diet = undefined;
  } else {
    form.diet_history_id = undefined;
    form.fed_diet = undefined;
  }
}

async function onSubmit() {
  if (totalLiters.value === 0) {
    $q.notify({
      type: 'warning',
      message: t('logs.form.atLeastOneReading'),
    });
    return;
  }

  if (isEditing.value) {
    const success = await milkLogsStore.updateLog(logId.value!, form);
    if (success) {
      $q.notify({ type: 'positive', message: t('logs.messages.logUpdated') });
      router.back();
    }
  } else {
    // Check for duplicate log (same cow + date)
    const existingLog = await milkLogsStore.getLogByDate(form.cow_id, form.log_date);
    if (existingLog) {
      $q.dialog({
        title: t('logs.form.duplicateTitle'),
        message: t('logs.form.duplicateMessage', {
          cowName: form.cow_name || form.cow_id,
          date: form.log_date,
        }),
        cancel: { label: t('common.cancel'), flat: true },
        ok: { label: t('logs.form.updateExisting'), color: 'primary' },
        persistent: true,
      }).onOk(async () => {
        const success = await milkLogsStore.updateLog(existingLog.id, form);
        if (success) {
          $q.notify({ type: 'positive', message: t('logs.messages.logUpdated') });
          router.back();
        }
      });
      return;
    }

    const log = await milkLogsStore.createLog(form);
    if (log) {
      $q.notify({ type: 'positive', message: t('logs.messages.logCreated') });
      router.back();
    }
  }
}

function confirmDelete() {
  $q.dialog({
    title: t('logs.form.deleteConfirmTitle'),
    message: t('logs.form.deleteConfirmMessage'),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const success = await milkLogsStore.deleteLog(logId.value!);
    if (success) {
      $q.notify({ type: 'positive', message: t('logs.messages.logDeleted') });
      router.push('/logs');
    }
  });
}

onMounted(async () => {
  await cowsStore.fetchCows();

  // Pre-fill cow name and fetch active diet if cow_id from query
  if (queryCowId) {
    await onCowSelected(queryCowId);
  }

  if (isEditing.value) {
    const log = await milkLogsStore.getLog(logId.value!);
    if (log) {
      Object.assign(form, {
        cow_id: log.cow_id,
        cow_name: log.cow_name,
        log_date: log.log_date,
        morning_liters: log.morning_liters || 0,
        evening_liters: log.evening_liters || 0,
        fat_percentage: log.fat_percentage,
        snf_percentage: log.snf_percentage,
        temperature: log.temperature,
        notes: log.notes,
      });
    } else {
      $q.notify({ type: 'negative', message: t('logs.form.logNotFound') });
      router.back();
    }
  }
});
</script>
