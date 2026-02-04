<template>
  <q-page class="q-pa-md">
    <q-form @submit="onSubmit" class="q-gutter-md">
      <!-- Farmer Selection -->
      <div class="text-subtitle1 text-weight-medium q-mb-sm">Farmer</div>

      <q-select
        v-model="form.farmer_profile_id"
        :options="farmerOptions"
        label="Select Farmer *"
        outlined
        emit-value
        map-options
        :rules="[(val) => !!val || 'Farmer is required']"
        @update:model-value="onFarmerChange"
      >
        <template v-slot:prepend>
          <q-icon name="person" />
        </template>
      </q-select>

      <!-- Cow Selection (Optional) -->
      <q-select
        v-model="form.cow_profile_id"
        :options="cowOptions"
        label="Select Cow (Optional)"
        outlined
        emit-value
        map-options
        clearable
        :disable="!form.farmer_profile_id"
        hint="Leave empty for farm-level yield"
      >
        <template v-slot:prepend>
          <q-icon name="pets" />
        </template>
      </q-select>

      <!-- Collection Date -->
      <q-separator class="q-my-md" />
      <div class="text-subtitle1 text-weight-medium q-mb-sm">Collection Details</div>

      <q-input
        v-model="form.collection_date"
        label="Collection Date *"
        type="date"
        outlined
        :rules="[(val) => !!val || 'Date is required']"
      >
        <template v-slot:prepend>
          <q-icon name="calendar_today" />
        </template>
      </q-input>

      <!-- Yield Data -->
      <q-separator class="q-my-md" />
      <div class="text-subtitle1 text-weight-medium q-mb-sm">Yield Data</div>

      <q-input
        v-model.number="form.milk_yield_liters"
        label="Milk Yield (Liters) *"
        type="number"
        step="0.1"
        outlined
        :rules="[
          (val) => val !== null && val !== '' || 'Yield is required',
          (val) => val >= 0 || 'Cannot be negative',
        ]"
      >
        <template v-slot:prepend>
          <q-icon name="water_drop" />
        </template>
        <template v-slot:append>
          <span class="text-grey-6">L</span>
        </template>
      </q-input>

      <div class="row q-gutter-md">
        <q-input
          v-model.number="form.fat_percentage"
          label="Fat %"
          type="number"
          step="0.1"
          outlined
          class="col"
          :rules="[
            (val) => val === null || val === '' || val >= 0 || 'Cannot be negative',
            (val) => val === null || val === '' || val <= 15 || 'Max 15%',
          ]"
          hint="Optional"
        >
          <template v-slot:append>
            <span class="text-grey-6">%</span>
          </template>
        </q-input>

        <q-input
          v-model.number="form.snf_percentage"
          label="SNF %"
          type="number"
          step="0.1"
          outlined
          class="col"
          :rules="[
            (val) => val === null || val === '' || val >= 0 || 'Cannot be negative',
            (val) => val === null || val === '' || val <= 15 || 'Max 15%',
          ]"
          hint="Optional"
        >
          <template v-slot:append>
            <span class="text-grey-6">%</span>
          </template>
        </q-input>
      </div>

      <!-- Notes -->
      <q-input
        v-model="form.notes"
        label="Notes"
        type="textarea"
        outlined
        rows="2"
        hint="Optional - any observations"
      />

      <!-- Error Message -->
      <q-banner v-if="error" dense class="bg-negative text-white" rounded>
        {{ error }}
      </q-banner>

      <!-- Submit Button -->
      <q-btn
        label="Record Yield"
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
import { useYieldsStore, YieldInput } from 'src/stores/yields';
import { useFarmersStore } from 'src/stores/farmers';
import { useQuasar } from 'quasar';

interface CowOption {
  label: string;
  value: string;
}

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const yieldsStore = useYieldsStore();
const farmersStore = useFarmersStore();

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
    label: f.name,
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
  yieldsStore.clearError();

  const record = await yieldsStore.recordYield(form);
  if (record) {
    $q.notify({
      type: 'positive',
      message: 'Yield recorded successfully',
      position: 'bottom',
    });
    router.back();
  }
}

onMounted(async () => {
  // Load farmers
  await farmersStore.fetchFarmers();

  // Check for pre-selected farmer from query params
  if (route.query.farmer) {
    form.farmer_profile_id = route.query.farmer as string;
    await onFarmerChange(form.farmer_profile_id);
  }

  // Check for pre-selected cow from query params
  if (route.query.cow) {
    form.cow_profile_id = route.query.cow as string;
  }
});
</script>
