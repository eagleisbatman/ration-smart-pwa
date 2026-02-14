<template>
  <q-page class="q-pa-md">
    <PullToRefresh @refresh="refreshAll">
      <!-- Extension Worker Dashboard -->
      <ExtensionWorkerDashboard
        v-if="showExtensionWorkerDashboard"
        ref="extensionDashboardRef"
      >
        <template #personal-dashboard>
          <FarmerDashboard ref="farmerDashboardRef" embedded />
        </template>
      </ExtensionWorkerDashboard>

      <!-- Regular Farmer Dashboard -->
      <FarmerDashboard v-else ref="farmerDashboardRef" />
    </PullToRefresh>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import { useFarmersStore } from 'src/stores/farmers';
import PullToRefresh from 'src/components/ui/PullToRefresh.vue';
import ExtensionWorkerDashboard from 'src/components/dashboard/ExtensionWorkerDashboard.vue';
import FarmerDashboard from 'src/components/dashboard/FarmerDashboard.vue';

const authStore = useAuthStore();
const farmersStore = useFarmersStore();

const extensionDashboardRef = ref<InstanceType<typeof ExtensionWorkerDashboard> | null>(null);
const farmerDashboardRef = ref<InstanceType<typeof FarmerDashboard> | null>(null);

// Determine which dashboard to show
// Show extension worker dashboard if:
// 1. User has extension worker role, OR
// 2. User is managing farmers (has created farmer profiles)
const showExtensionWorkerDashboard = computed(() => {
  return authStore.isExtensionWorker || farmersStore.isManagingFarmers;
});

async function refreshAll(done: () => void) {
  // Refresh data based on current dashboard
  if (showExtensionWorkerDashboard.value) {
    await farmersStore.fetchFarmers();
    // Also refresh farmer dashboard if in personal view
    if (extensionDashboardRef.value?.viewMode === 'personal' && farmerDashboardRef.value) {
      await farmerDashboardRef.value.refresh();
    }
  } else if (farmerDashboardRef.value) {
    await farmerDashboardRef.value.refresh();
  }
  done();
}

onMounted(async () => {
  // Initialize auth store
  await authStore.initialize();

  // Load farmers data to determine if user is managing farmers
  await farmersStore.loadFromCache();
  await farmersStore.fetchFarmers();
});
</script>

<style lang="scss" scoped>
// Page styles handled by child components
</style>
