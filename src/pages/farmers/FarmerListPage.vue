<template>
  <q-page class="q-pa-md">
    <PullToRefresh @refresh="onRefresh">
      <!-- Search Bar & Actions -->
      <div class="row items-center q-mb-md q-col-gutter-sm">
        <div class="col">
          <q-input
            v-model="searchQuery"
            outlined
            dense
            :placeholder="$t('farmer.searchFarmers')"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
            <template v-if="searchQuery" #append>
              <q-icon name="close" class="cursor-pointer" @click="searchQuery = ''" />
            </template>
          </q-input>
        </div>
        <div class="col-auto row items-center q-gutter-xs">
          <q-badge color="primary" :label="`${farmerCount} ${t('farmer.farmers')}`" class="q-pa-sm" />
          <q-btn
            flat
            dense
            no-caps
            color="primary"
            icon="upload_file"
            :label="$t('farmers.import.importBtn')"
            size="sm"
            @click="router.push({ name: 'farmer-import' })"
          />
        </div>
      </div>

      <!-- Filter Chips -->
      <div class="row q-gutter-sm q-mb-md">
        <q-chip
          v-for="chip in filterChips"
          :key="chip.value"
          :outline="filterType !== chip.value"
          :color="filterType === chip.value ? 'primary' : undefined"
          clickable
          @click="filterType = chip.value"
        >
          {{ chip.label }}
        </q-chip>
      </div>

      <!-- Loading State -->
      <template v-if="loading && farmers.length === 0">
        <SkeletonList :count="5" />
      </template>

      <!-- Empty State -->
      <template v-else-if="farmers.length === 0">
        <EmptyState
          icon="people"
          :title="$t('farmer.noFarmersYet')"
          :description="$t('farmer.noFarmersDescription')"
          :action-label="$t('farmer.addFarmer')"
          action-icon="person_add"
          @action="router.push('/farmers/new')"
        />
      </template>

      <!-- Farmer List -->
      <template v-else>
        <q-list separator class="rounded-borders" bordered>
          <q-item
            v-for="farmer in filteredFarmers"
            :key="farmer.id"
            v-ripple
            clickable
            @click="router.push(`/farmers/${farmer.id}`)"
          >
            <q-item-section avatar>
              <q-avatar v-if="farmer.image_url" size="40px">
                <q-img :src="farmer.image_url" :ratio="1" />
              </q-avatar>
              <q-avatar
                v-else
                :color="farmer.is_self_profile ? 'teal-2' : farmer.is_active ? 'primary' : 'grey-4'"
                :text-color="farmer.is_self_profile ? 'teal-9' : 'white'"
                size="40px"
              >
                <q-icon name="person" size="20px" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label>
                <div class="row items-center no-wrap">
                  <span class="text-weight-medium">{{ farmer.name }}</span>
                  <q-badge
                    v-if="farmer.is_self_profile"
                    color="teal-2"
                    text-color="teal-9"
                    class="q-ml-sm"
                    :label="$t('farmer.you')"
                  />
                  <q-space />
                  <q-badge
                    v-if="farmer.farming_type"
                    outline
                    :color="farmingTypeColor(farmer.farming_type)"
                  >
                    {{ $t(`farmer.farmingTypes.${farmer.farming_type}`) }}
                  </q-badge>
                </div>
              </q-item-label>
              <q-item-label v-if="farmer.phone" caption class="text-grey-6">
                <q-icon name="phone" size="12px" class="q-mr-xs" />{{ farmer.phone }}
              </q-item-label>
              <q-item-label caption>
                <q-icon name="location_on" size="12px" class="q-mr-xs" />
                <span v-if="farmer.village">{{ farmer.village }}</span>
                <span v-if="farmer.village && farmer.district">, </span>
                <span v-if="farmer.district">{{ farmer.district }}</span>
              </q-item-label>
              <div v-if="farmer.total_cattle > 0 || !farmer._synced" class="q-mt-xs row items-center q-gutter-xs">
                <q-badge v-if="farmer.total_cattle > 0" outline color="grey-7" class="q-pa-xs">
                  {{ farmer.total_cattle }} {{ $t('farmer.cattle') }}
                </q-badge>
                <q-badge
                  v-if="!farmer._synced"
                  color="warning"
                  text-color="white"
                  class="q-pa-xs"
                >
                  <q-icon name="sync" size="10px" class="q-mr-xs" />{{ $t('farmer.pending') }}
                </q-badge>
              </div>
            </q-item-section>

            <q-item-section side>
              <q-icon name="chevron_right" color="grey-5" size="20px" />
            </q-item-section>
          </q-item>
        </q-list>

        <!-- No Search Results -->
        <div v-if="filteredFarmers.length === 0" class="text-center q-pa-xl">
          <q-icon name="search_off" size="48px" color="grey-4" />
          <div class="text-body2 text-grey-7 q-mt-sm">
            {{ $t('farmer.noSearchResults', { query: searchQuery }) }}
          </div>
        </div>
      </template>
    </PullToRefresh>

    <!-- FAB for adding new farmer -->
    <q-page-sticky position="bottom-right" :offset="[16, 72]">
      <q-btn fab icon="person_add" color="primary" @click="router.push('/farmers/new')" />
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useFarmersStore } from 'src/stores/farmers';
import { useCowsStore } from 'src/stores/cows';
import PullToRefresh from 'src/components/ui/PullToRefresh.vue';
import SkeletonList from 'src/components/ui/SkeletonList.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';

const router = useRouter();
const { t } = useI18n();
const farmersStore = useFarmersStore();
const cowsStore = useCowsStore();

const searchQuery = ref('');
const filterType = ref<'all' | 'dairy' | 'mixed' | 'beef' | 'other'>('all');

const loading = computed(() => farmersStore.loading);
const farmers = computed(() => farmersStore.activeFarmers);
const farmerCount = computed(() => farmersStore.activeFarmerCount);

const filterChips = computed(() => [
  { label: `${t('farmer.filter.all')} (${farmerCount.value})`, value: 'all' as const },
  { label: t('farmer.filter.dairy'), value: 'dairy' as const },
  { label: t('farmer.filter.mixed'), value: 'mixed' as const },
  { label: t('farmer.filter.beef'), value: 'beef' as const },
  { label: t('farmer.filter.other'), value: 'other' as const },
]);

const filteredFarmers = computed(() => {
  let result = farmers.value;

  // Filter by farming type
  if (filterType.value !== 'all') {
    result = result.filter((f) => f.farming_type === filterType.value);
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (farmer) =>
        farmer.name.toLowerCase().includes(query) ||
        farmer.village?.toLowerCase().includes(query) ||
        farmer.district?.toLowerCase().includes(query) ||
        farmer.phone?.includes(query)
    );
  }

  // Sort self-profile to top
  result = [...result].sort((a, b) => {
    if (a.is_self_profile) return -1;
    if (b.is_self_profile) return 1;
    return 0;
  });

  return result;
});

function farmingTypeColor(type: string): string {
  switch (type) {
    case 'dairy': return 'dark';
    case 'mixed': return 'warning';
    case 'beef': return 'grey-6';
    default: return 'grey';
  }
}

async function onRefresh(done: () => void) {
  await farmersStore.fetchFarmers();
  await cowsStore.fetchCows();
  farmersStore.syncCattleCounts();
  done();
}

onMounted(async () => {
  await farmersStore.fetchFarmers();
  await cowsStore.fetchCows();
  farmersStore.syncCattleCounts();
});
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: $radius-loose;
  overflow: hidden;
}
</style>
