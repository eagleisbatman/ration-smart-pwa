<template>
  <q-page class="q-pa-md">
    <q-form class="q-gutter-md" @submit="onSubmit">
      <!-- Basic Info Section -->
      <div class="text-subtitle1 text-weight-medium q-mb-sm">Basic Information</div>

      <q-input
        v-model="form.name"
        label="Farmer Name *"
        outlined
        :rules="[(val) => !!val || 'Name is required']"
      />

      <q-input
        v-model="form.phone"
        label="Phone Number"
        outlined
        type="tel"
        hint="Optional - for contact"
      />

      <!-- Location Section -->
      <q-separator class="q-my-md" />
      <div class="text-subtitle1 text-weight-medium q-mb-sm">Location</div>

      <q-input
        v-model="form.village"
        label="Village"
        outlined
        hint="Optional"
      />

      <q-input
        v-model="form.district"
        label="District"
        outlined
        hint="Optional"
      />

      <q-input
        v-model="form.state"
        label="State / Province"
        outlined
        hint="Optional"
      />

      <!-- Farm Details Section -->
      <q-separator class="q-my-md" />
      <div class="text-subtitle1 text-weight-medium q-mb-sm">Farm Details</div>

      <q-input
        v-model.number="form.total_cattle"
        label="Total Cattle"
        type="number"
        outlined
        :rules="[(val) => val >= 0 || 'Cannot be negative']"
      />

      <q-input
        v-model.number="form.land_acres"
        label="Land (acres)"
        type="number"
        step="0.1"
        outlined
        hint="Optional"
      />

      <q-select
        v-model="form.farming_type"
        label="Farming Type"
        outlined
        :options="farmingTypeOptions"
        emit-value
        map-options
        clearable
        hint="Primary farming activity"
      />

      <!-- Error Message -->
      <q-banner v-if="error" dense class="bg-negative text-white" rounded>
        {{ error }}
      </q-banner>

      <!-- Submit Button -->
      <q-btn
        :label="isEditing ? 'Update Farmer' : 'Add Farmer'"
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
        label="Archive Farmer"
        color="negative"
        flat
        class="full-width q-mt-sm"
        @click="confirmArchive"
      />
    </q-form>

    <!-- Archive Confirmation Dialog -->
    <q-dialog v-model="showArchiveDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="archive" color="warning" text-color="white" />
          <span class="q-ml-sm">Archive this farmer profile?</span>
        </q-card-section>
        <q-card-section>
          The farmer profile will be archived and hidden from the list. Associated data will be preserved.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancel" />
          <q-btn
            flat
            label="Archive"
            color="negative"
            :loading="loading"
            @click="onArchive"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useFarmersStore, FarmerInput } from 'src/stores/farmers';
import { useOrganizationsStore } from 'src/stores/organizations';
import { useQuasar } from 'quasar';

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const farmersStore = useFarmersStore();
const organizationsStore = useOrganizationsStore();

const farmerId = computed(() => route.params.id as string | undefined);
const isEditing = computed(() => !!farmerId.value && farmerId.value !== 'new');

const showArchiveDialog = ref(false);

const form = reactive<FarmerInput>({
  organization_id: undefined,
  name: '',
  phone: undefined,
  village: undefined,
  district: undefined,
  state: undefined,
  country_id: undefined,
  total_cattle: 0,
  land_acres: undefined,
  farming_type: undefined,
});

const farmingTypeOptions = [
  { label: 'Dairy Farming', value: 'dairy' },
  { label: 'Mixed Farming', value: 'mixed' },
  { label: 'Crop Farming', value: 'crop' },
];

const loading = computed(() => farmersStore.loading);
const error = computed(() => farmersStore.error);

async function loadFarmer() {
  if (!isEditing.value || !farmerId.value) return;

  const farmer = await farmersStore.fetchFarmer(farmerId.value);
  if (farmer) {
    form.organization_id = farmer.organization_id;
    form.name = farmer.name;
    form.phone = farmer.phone;
    form.village = farmer.village;
    form.district = farmer.district;
    form.state = farmer.state;
    form.country_id = farmer.country_id;
    form.total_cattle = farmer.total_cattle;
    form.land_acres = farmer.land_acres;
    form.farming_type = farmer.farming_type;
  }
}

async function onSubmit() {
  farmersStore.clearError();

  // Set organization_id from current organization if available
  if (!form.organization_id && organizationsStore.currentOrganization) {
    form.organization_id = organizationsStore.currentOrganization.id;
  }

  if (isEditing.value && farmerId.value) {
    const success = await farmersStore.updateFarmer(farmerId.value, form);
    if (success) {
      $q.notify({
        type: 'positive',
        message: 'Farmer profile updated',
        position: 'bottom',
      });
      router.back();
    }
  } else {
    const farmer = await farmersStore.createFarmer(form);
    if (farmer) {
      $q.notify({
        type: 'positive',
        message: 'Farmer profile created',
        position: 'bottom',
      });
      router.replace(`/farmers/${farmer.id}`);
    }
  }
}

function confirmArchive() {
  showArchiveDialog.value = true;
}

async function onArchive() {
  if (!farmerId.value) return;

  const success = await farmersStore.archiveFarmer(farmerId.value);
  showArchiveDialog.value = false;

  if (success) {
    $q.notify({
      type: 'info',
      message: 'Farmer profile archived',
      position: 'bottom',
    });
    router.replace('/farmers');
  }
}

onMounted(() => {
  loadFarmer();
  // Load current organization for default assignment
  organizationsStore.fetchCurrentOrganization();
});
</script>
