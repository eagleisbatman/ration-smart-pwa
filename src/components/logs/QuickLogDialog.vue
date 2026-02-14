<template>
  <q-dialog v-model="dialogVisible" maximized transition-show="slide-up" transition-hide="slide-down">
    <q-card class="quick-log-card">
      <!-- Header -->
      <q-toolbar class="bg-primary text-white">
        <q-btn flat round dense icon="close" @click="dialogVisible = false" />
        <q-toolbar-title>{{ $t('logs.quickLog.title') }}</q-toolbar-title>
        <q-btn
          flat
          round
          dense
          icon="save"
          :loading="savingAll"
          :disable="savingAll || nothingToSave"
          @click="saveAll"
        >
          <q-tooltip>{{ $t('logs.quickLog.saveAll') }}</q-tooltip>
        </q-btn>
      </q-toolbar>

      <q-card-section class="q-pa-sm">
        <!-- Date Selector -->
        <div class="row items-center q-mb-sm q-px-sm">
          <q-icon name="calendar_today" class="q-mr-sm text-grey-7" size="sm" />
          <q-input
            v-model="logDate"
            :label="$t('logs.quickLog.date')"
            outlined
            dense
            readonly
            class="col"
            style="max-width: 200px"
          >
            <template #append>
              <q-icon name="edit" class="cursor-pointer" size="xs" @click="datePickerRef?.open()">
                <DatePickerPopup
                  ref="datePickerRef"
                  v-model="logDate"
                  mask="YYYY-MM-DD"
                />
              </q-icon>
            </template>
          </q-input>
        </div>
      </q-card-section>

      <!-- Content -->
      <q-card-section class="q-pa-none scroll-fill">
        <!-- No cows message -->
        <div v-if="activeCows.length === 0" class="text-center q-pa-xl text-grey-6">
          <q-icon name="water_drop" size="64px" class="q-mb-md" />
          <div class="text-body1">{{ $t('logs.quickLog.noCows') }}</div>
        </div>

        <!-- Cow rows -->
        <q-list v-else separator>
          <q-item
            v-for="cow in activeCows"
            :key="cow.id"
            :class="{ 'bg-green-1': savedRows[cow.id] }"
            class="q-py-sm"
          >
            <q-item-section>
              <div class="row items-center q-col-gutter-xs">
                <!-- Cow name -->
                <div class="col-12 q-mb-xs">
                  <div class="row items-center">
                    <q-avatar
                      :color="savedRows[cow.id] ? 'green' : 'primary'"
                      text-color="white"
                      size="28px"
                      class="q-mr-sm"
                    >
                      <q-icon
                        :name="savedRows[cow.id] ? 'check' : COW_ICON"
                        size="16px"
                      />
                    </q-avatar>
                    <span class="text-subtitle2 text-weight-medium">{{ cow.name }}</span>
                    <q-badge
                      v-if="cow.tag_number"
                      :label="cow.tag_number"
                      color="grey-4"
                      text-color="grey-8"
                      class="q-ml-sm"
                    />
                    <q-space />
                    <span
                      v-if="getRowTotal(cow.id) > 0"
                      class="text-subtitle2 text-primary text-weight-bold"
                    >
                      {{ getRowTotal(cow.id).toFixed(1) }}L
                    </span>
                  </div>
                </div>

                <!-- Morning / Evening inputs + Save button -->
                <div class="col">
                  <q-input
                    v-model.number="entries[cow.id].morning"
                    :label="$t('logs.quickLog.morning')"
                    type="number"
                    step="0.1"
                    min="0"
                    inputmode="decimal"
                    outlined
                    dense
                    :disable="savedRows[cow.id]"
                    :bg-color="savedRows[cow.id] ? 'green-1' : undefined"
                  >
                    <template #prepend>
                      <q-icon name="wb_sunny" color="warning" size="xs" />
                    </template>
                  </q-input>
                </div>
                <div class="col">
                  <q-input
                    v-model.number="entries[cow.id].evening"
                    :label="$t('logs.quickLog.evening')"
                    type="number"
                    step="0.1"
                    min="0"
                    inputmode="decimal"
                    outlined
                    dense
                    :disable="savedRows[cow.id]"
                    :bg-color="savedRows[cow.id] ? 'green-1' : undefined"
                  >
                    <template #prepend>
                      <q-icon name="nightlight" color="primary" size="xs" />
                    </template>
                  </q-input>
                </div>
                <div class="col-auto">
                  <q-btn
                    :icon="savedRows[cow.id] ? 'check_circle' : 'check'"
                    :color="savedRows[cow.id] ? 'green' : 'primary'"
                    :flat="!savedRows[cow.id]"
                    round
                    dense
                    :disable="savedRows[cow.id] || savingRows[cow.id] || getRowTotal(cow.id) === 0"
                    :loading="savingRows[cow.id]"
                    @click="saveRow(cow)"
                  >
                    <q-tooltip v-if="!savedRows[cow.id]">{{ $t('logs.quickLog.saveRow') }}</q-tooltip>
                    <q-tooltip v-else>{{ $t('logs.quickLog.saved') }}</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <!-- Footer with Save All -->
      <q-separator />
      <q-card-actions class="q-pa-md" align="center">
        <q-btn
          :label="$t('logs.quickLog.saveAll')"
          color="primary"
          unelevated
          class="full-width"
          size="lg"
          icon="save"
          :loading="savingAll"
          :disable="savingAll || nothingToSave"
          @click="saveAll"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { format } from 'date-fns';
import { useMilkLogsStore, MilkLogInput } from 'src/stores/milkLogs';
import { useCowsStore } from 'src/stores/cows';
import { COW_ICON } from 'src/boot/icons';
import DatePickerPopup from 'src/components/ui/DatePickerPopup.vue';
import type { Cow } from 'src/lib/offline/db';

interface QuickLogEntry {
  morning: number | null;
  evening: number | null;
}

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}>();

const { t } = useI18n();
const $q = useQuasar();
const milkLogsStore = useMilkLogsStore();
const cowsStore = useCowsStore();

const datePickerRef = ref<InstanceType<typeof DatePickerPopup> | null>(null);
const logDate = ref(format(new Date(), 'yyyy-MM-dd'));
const entries = reactive<Record<string, QuickLogEntry>>({});
const savedRows = reactive<Record<string, boolean>>({});
const savingRows = reactive<Record<string, boolean>>({});
const savingAll = ref(false);

const activeCows = computed(() => cowsStore.activeCows);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const nothingToSave = computed(() => {
  return activeCows.value.every(
    (cow) => savedRows[cow.id] || getRowTotal(cow.id) === 0
  );
});

// Initialize entries when dialog opens or cows change
watch(
  [() => props.modelValue, activeCows],
  ([isOpen]) => {
    if (isOpen) {
      initEntries();
    }
  },
  { immediate: true }
);

function initEntries() {
  for (const cow of activeCows.value) {
    if (!entries[cow.id]) {
      entries[cow.id] = { morning: null, evening: null };
    }
    savedRows[cow.id] = false;
    savingRows[cow.id] = false;
  }
}

function getRowTotal(cowId: string): number {
  const entry = entries[cowId];
  if (!entry) return 0;
  return (entry.morning || 0) + (entry.evening || 0);
}

async function saveRow(cow: Cow) {
  const entry = entries[cow.id];
  if (!entry || getRowTotal(cow.id) === 0) return;

  savingRows[cow.id] = true;

  try {
    // Check for existing log on the same date
    const existingLog = await milkLogsStore.getLogByDate(cow.id, logDate.value);

    const input: MilkLogInput = {
      cow_id: cow.id,
      cow_name: cow.name,
      log_date: logDate.value,
      morning_liters: entry.morning || 0,
      evening_liters: entry.evening || 0,
    };

    let success: boolean;

    if (existingLog) {
      // Update existing log
      success = await milkLogsStore.updateLog(existingLog.id, input);
      if (success) {
        $q.notify({
          type: 'info',
          message: t('logs.quickLog.duplicateFound', { cowName: cow.name }),
          timeout: 2000,
        });
      }
    } else {
      // Create new log
      const log = await milkLogsStore.createLog(input);
      success = !!log;
    }

    if (success) {
      savedRows[cow.id] = true;
    }
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: t('errors.generic'),
    });
  } finally {
    savingRows[cow.id] = false;
  }
}

async function saveAll() {
  const cowsToSave = activeCows.value.filter(
    (cow) => !savedRows[cow.id] && getRowTotal(cow.id) > 0
  );

  if (cowsToSave.length === 0) {
    $q.notify({
      type: 'warning',
      message: t('logs.quickLog.noEntries'),
    });
    return;
  }

  savingAll.value = true;
  let savedCount = 0;

  for (const cow of cowsToSave) {
    await saveRow(cow);
    if (savedRows[cow.id]) {
      savedCount++;
    }
  }

  savingAll.value = false;

  if (savedCount > 0) {
    $q.notify({
      type: 'positive',
      message: t('logs.quickLog.allSaved'),
    });
    emit('saved');
  }
}
</script>

<style lang="scss" scoped>
.quick-log-card {
  display: flex;
  flex-direction: column;
  max-height: 100vh;
}
</style>
