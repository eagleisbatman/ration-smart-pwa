<template>
  <q-page class="q-pa-md">
    <q-form class="q-gutter-md" @submit="onSubmit">
      <!-- Farmer Selection -->
      <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ $t('logs.yield.farmer') }}</div>

      <q-select
        v-model="form.farmer_profile_id"
        :options="farmerOptions"
        :label="$t('logs.yield.selectFarmer')"
        outlined
        emit-value
        map-options
        :rules="[(val) => !!val || $t('logs.yield.farmerRequired')]"
        @update:model-value="onFarmerChange"
      >
        <template #prepend>
          <q-icon name="agriculture" />
        </template>
      </q-select>

      <!-- Cow Selection (Optional) -->
      <q-select
        v-model="form.cow_profile_id"
        :options="cowOptions"
        :label="$t('logs.yield.selectCow')"
        outlined
        emit-value
        map-options
        clearable
        :disable="!form.farmer_profile_id"
        :hint="$t('logs.yield.farmLevelHint')"
      >
        <template #prepend>
          <q-icon :name="COW_ICON" />
        </template>
      </q-select>

      <!-- Collection Date -->
      <q-separator class="q-my-md" />
      <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ $t('logs.yield.collectionDetails') }}</div>

      <q-input
        v-model="form.collection_date"
        :label="$t('logs.yield.collectionDate')"
        type="date"
        outlined
        :rules="[(val) => !!val || $t('logs.yield.dateRequired')]"
      >
        <template #prepend>
          <q-icon name="calendar_today" />
        </template>
      </q-input>

      <!-- Yield Data -->
      <q-separator class="q-my-md" />
      <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ $t('logs.yield.yieldData') }}</div>

      <q-input
        v-model.number="form.milk_yield_liters"
        :label="$t('logs.yield.milkYieldLiters')"
        type="number"
        step="0.1"
        outlined
        :rules="[
          (val) => val !== null && val !== '' || $t('logs.yield.yieldRequired'),
          (val) => val >= 0 || $t('logs.yield.cannotBeNegative'),
        ]"
      >
        <template #prepend>
          <q-icon name="water_drop" />
        </template>
        <template #append>
          <span class="text-grey-6">{{ $t('units.l') }}</span>
        </template>
      </q-input>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-sm-6">
          <q-input
            v-model.number="form.fat_percentage"
            :label="$t('logs.yield.fatPercent')"
            type="number"
            step="0.1"
            outlined
            :rules="[
              (val) => val === null || val === '' || val >= 0 || $t('logs.yield.cannotBeNegative'),
              (val) => val === null || val === '' || val <= 15 || $t('logs.yield.maxPercent'),
            ]"
            :hint="$t('common.optional')"
          >
            <template #append>
              <span class="text-grey-6">{{ $t('units.percent') }}</span>
            </template>
          </q-input>
        </div>

        <div class="col-12 col-sm-6">
          <q-input
            v-model.number="form.snf_percentage"
            :label="$t('logs.yield.snfPercent')"
            type="number"
            step="0.1"
            outlined
            :rules="[
              (val) => val === null || val === '' || val >= 0 || $t('logs.yield.cannotBeNegative'),
              (val) => val === null || val === '' || val <= 15 || $t('logs.yield.maxPercent'),
            ]"
            :hint="$t('common.optional')"
          >
            <template #append>
              <span class="text-grey-6">{{ $t('units.percent') }}</span>
            </template>
          </q-input>
        </div>
      </div>

      <!-- Notes -->
      <q-input
        v-model="form.notes"
        :label="$t('logs.yield.notesLabel')"
        type="textarea"
        outlined
        rows="2"
        :hint="$t('logs.yield.notesHint')"
      />

      <!-- Error Message -->
      <q-banner v-if="error" dense class="bg-negative text-white" rounded>
        {{ error }}
      </q-banner>

      <!-- Submit Button -->
      <q-btn
        :label="isEditing ? $t('logs.yield.updateYield') : $t('logs.yield.recordYield')"
        type="submit"
        color="primary"
        class="full-width"
        size="lg"
        unelevated
        :loading="loading"
      />
    </q-form>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useYieldsStore, YieldInput } from 'src/stores/yields';
import { useFarmersStore } from 'src/stores/farmers';
import { useAuthStore } from 'src/stores/auth';
import { useQuasar } from 'quasar';
import { COW_ICON } from 'src/boot/icons';
import { useHapticFeedback } from 'src/composables/useHapticFeedback';

const { t } = useI18n();

interface CowOption {
  label: string;
  value: string;
}

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const yieldsStore = useYieldsStore();
const farmersStore = useFarmersStore();
const authStore = useAuthStore();
const { success, error: hapticError, medium } = useHapticFeedback();

const yieldId = computed(() => route.params.id as string | undefined);
const isEditing = computed(() => !!yieldId.value);

const cows = ref<CowOption[]>([]);

const form = reactive<YieldInput>({
  farmer_profile_id: '',
  cow_profile_id: undefined,
  collection_date: new Date().toISOString().split('T')[0],
  milk_yield_liters: undefined,
  fat_percentage: undefined,
  snf_percentage: undefined,
  notes: undefined,
});

const loading = computed(() => yieldsStore.loading);
const error = computed(() => yieldsStore.error);

const farmerOptions = computed(() =>
  farmersStore.activeFarmers.map((f) => ({
    label: f.id === authStore.selfFarmerProfileId ? `${f.name} (${t('common.you')})` : f.name,
    value: f.id,
  }))
);

const cowOptions = computed(() => cows.value);

async function onFarmerChange(farmerId: string) {
  if (!farmerId) {
    cows.value = [];
    form.cow_profile_id = undefined;
    return;
  }

  // Fetch farmer's cows
  const farmerCows = await farmersStore.getFarmerCows(farmerId);
  cows.value = (farmerCows as Array<{ id: string; name: string }>).map((c) => ({
    label: c.name,
    value: c.id,
  }));
}

async function onSubmit() {
  medium(); // Haptic feedback on form submit
  yieldsStore.clearError();

  if (isEditing.value) {
    const ok = await yieldsStore.updateYield(yieldId.value!, form);
    if (ok) {
      success();
      $q.notify({
        type: 'positive',
        message: t('logs.yield.yieldUpdatedSuccess'),
        position: 'bottom',
      });
      router.back();
    } else {
      hapticError();
    }
  } else {
    const record = await yieldsStore.recordYield(form);
    if (record) {
      success();
      $q.notify({
        type: 'positive',
        message: t('logs.yield.yieldRecordedSuccess'),
        position: 'bottom',
      });
      router.back();
    } else {
      hapticError();
    }
  }
}

onMounted(async () => {
  // Clear any stale errors from previous navigation
  yieldsStore.error = null;

  // Load farmers
  await farmersStore.fetchFarmers();

  if (isEditing.value) {
    const record = await yieldsStore.getYield(yieldId.value!);
    if (record) {
      Object.assign(form, {
        farmer_profile_id: record.farmer_profile_id,
        cow_profile_id: record.cow_profile_id,
        collection_date: record.collection_date,
        milk_yield_liters: record.milk_yield_liters,
        fat_percentage: record.fat_percentage,
        snf_percentage: record.snf_percentage,
        notes: record.notes,
      });
      // Load cows for the selected farmer
      await onFarmerChange(record.farmer_profile_id);
    } else {
      $q.notify({ type: 'negative', message: t('logs.yield.yieldNotFound') });
      router.back();
    }
  } else {
    // Check for pre-selected farmer from query params
    if (route.query.farmer) {
      form.farmer_profile_id = route.query.farmer as string;
      await onFarmerChange(form.farmer_profile_id);
    }

    // Check for pre-selected cow from query params
    if (route.query.cow) {
      form.cow_profile_id = route.query.cow as string;
    }
  }
});
</script>
