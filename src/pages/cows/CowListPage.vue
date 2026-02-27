<template>
  <q-page class="q-pa-md">
    <PullToRefresh @refresh="onRefresh">
      <!-- Search Bar & Selection Toggle -->
      <div class="row items-center q-mb-sm q-gutter-x-sm">
        <q-input
          v-model="searchQuery"
          outlined
          dense
          :placeholder="$t('cow.searchCows')"
          class="col"
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
          <template v-if="searchQuery" #append>
            <q-icon name="close" class="cursor-pointer" @click="searchQuery = ''" />
          </template>
        </q-input>

        <q-btn
          v-if="cows.length > 0"
          :icon="selectionMode ? 'close' : 'checklist'"
          :label="selectionMode ? $t('cow.cancelSelection') : $t('cow.select')"
          :color="selectionMode ? 'negative' : 'primary'"
          :outline="!selectionMode"
          dense
          no-caps
          @click="toggleSelectionMode"
        />
      </div>

      <!-- Filter Chips -->
      <div v-if="cows.length > 0" class="row q-gutter-x-sm q-mb-md">
        <q-chip
          v-for="f in filterOptions"
          :key="f.value"
          :outline="filterStatus !== f.value"
          :color="filterStatus === f.value ? 'primary' : undefined"
          :text-color="filterStatus === f.value ? 'white' : undefined"
          clickable
          dense
          @click="filterStatus = f.value"
        >
          {{ f.label }}
        </q-chip>
      </div>

      <!-- Select All / Deselect All -->
      <div v-if="selectionMode && filteredCows.length > 0" class="row items-center q-mb-sm q-px-xs">
        <q-checkbox
          :model-value="allSelected"
          :indeterminate="someSelected && !allSelected"
          :label="allSelected ? $t('cow.deselectAll') : $t('cow.selectAll')"
          dense
          @update:model-value="toggleSelectAll"
        />
        <q-space />
        <span v-if="selectedIds.length > 0" class="text-caption text-grey-7">
          {{ $t('cow.selectedCount', { count: selectedIds.length }) }}
        </span>
      </div>

      <!-- Loading State -->
      <template v-if="loading && cows.length === 0">
        <SkeletonList :count="5" />
      </template>

      <!-- Empty State -->
      <template v-else-if="cows.length === 0">
        <EmptyState
          :icon="COW_ICON"
          :title="$t('cow.noCowsYet')"
          :description="$t('cow.noCowsDescription')"
          :action-label="$t('cow.addCow')"
          action-icon="add"
          @action="router.push('/cows/new')"
        />
      </template>

      <!-- Cow List -->
      <template v-else>
        <q-list separator class="rounded-borders" bordered>
          <q-item
            v-for="cow in filteredCows"
            :key="cow.id"
            v-ripple
            clickable
            @click="onCowClick(cow.id)"
          >
            <!-- Selection checkbox -->
            <q-item-section v-if="selectionMode" side>
              <q-checkbox
                :model-value="selectedIds.includes(cow.id)"
                dense
                @update:model-value="toggleCowSelection(cow.id)"
                @click.stop
              />
            </q-item-section>

            <q-item-section avatar>
              <q-avatar v-if="cow.image_url" size="48px">
                <q-img :src="cow.image_url" :ratio="1" />
              </q-avatar>
              <q-avatar v-else :color="cow.is_active ? 'primary' : 'grey'" text-color="white">
                <q-icon :name="COW_ICON" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label>
                {{ cow.name }}
                <span v-if="cow.tag_number" class="text-caption text-grey-7"> #{{ cow.tag_number }}</span>
              </q-item-label>
              <q-item-label caption>
                {{ cow.breed }}<template v-if="cow.coat_color"> &middot; {{ cow.coat_color }}</template> &middot; {{ cow.weight_kg }}{{ $t('cow.weightKg') }} &middot; {{ cow.milk_yield_liters }}{{ $t('cow.milkYield') }}
              </q-item-label>
              <div class="q-mt-xs">
                <q-chip
                  v-if="cow.lactation_stage !== 'dry'"
                  dense
                  size="sm"
                  color="positive"
                  text-color="white"
                >
                  {{ $t('cow.lactating') }}
                </q-chip>
                <q-chip
                  v-else
                  dense
                  size="sm"
                  color="grey-5"
                  text-color="white"
                >
                  {{ $t('cow.dry') }}
                </q-chip>
                <q-chip
                  v-if="cow.is_pregnant"
                  dense
                  size="sm"
                  color="purple"
                  text-color="white"
                  class="q-ml-xs"
                >
                  {{ $t('cow.pregnant') }}<template v-if="cow.pregnancy_month"> ({{ cow.pregnancy_month }} mo)</template>
                </q-chip>
                <q-chip
                  v-if="dietsStore.activeDiets[cow.id]"
                  dense
                  size="sm"
                  color="info"
                  text-color="white"
                  icon="menu_book"
                  class="q-ml-xs"
                >
                  {{ $t('diet.onDiet') }}
                </q-chip>
              </div>
            </q-item-section>

            <q-item-section v-if="!selectionMode" side>
              <div class="row items-center">
                <q-chip
                  v-if="!cow._synced"
                  size="sm"
                  color="warning"
                  text-color="white"
                  icon="sync"
                  dense
                >
                  {{ $t('cow.pending') }}
                </q-chip>
                <q-icon name="chevron_right" color="grey" />
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <!-- No Search Results -->
        <div v-if="filteredCows.length === 0" class="text-center q-pa-xl">
          <q-icon name="search_off" size="48px" color="grey-4" />
          <div class="text-body2 text-grey-7 q-mt-sm">
            {{ $t('cow.noSearchResults', { query: searchQuery }) }}
          </div>
        </div>
      </template>
    </PullToRefresh>

    <!-- Bulk Action Bar (shown when items are selected) -->
    <q-page-sticky v-if="selectedIds.length > 0" position="bottom" :offset="[0, 18]" expand>
      <div class="bulk-action-bar row items-center justify-between q-pa-sm q-mx-md">
        <span class="text-body2 text-white q-ml-sm">
          {{ $t('cow.selectedCount', { count: selectedIds.length }) }}
        </span>
        <div class="row q-gutter-x-sm">
          <q-btn
            :label="$t('cow.bulkArchive')"
            icon="archive"
            color="white"
            text-color="warning"
            dense
            no-caps
            unelevated
            @click="confirmBulkArchive"
          />
          <q-btn
            :label="$t('cow.bulkDelete')"
            icon="delete"
            color="white"
            text-color="negative"
            dense
            no-caps
            unelevated
            @click="confirmBulkDelete"
          />
        </div>
      </div>
    </q-page-sticky>

    <!-- FAB for adding new cow (hidden during selection) -->
    <q-page-sticky v-if="!selectionMode" :position="rtl ? 'bottom-left' : 'bottom-right'" :offset="[16, 72]">
      <q-btn fab icon="add" color="primary" @click="router.push('/cows/new')" />
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { isRTL } from 'src/boot/i18n';
import { useCowsStore } from 'src/stores/cows';
import { useDietsStore } from 'src/stores/diets';
import { useHapticFeedback } from 'src/composables/useHapticFeedback';
import PullToRefresh from 'src/components/ui/PullToRefresh.vue';
import SkeletonList from 'src/components/ui/SkeletonList.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';
import { COW_ICON } from 'src/boot/icons';

const router = useRouter();
const $q = useQuasar();
const { t, locale } = useI18n();
const cowsStore = useCowsStore();
const dietsStore = useDietsStore();
const { success, error: hapticError, warning } = useHapticFeedback();

const rtl = computed(() => isRTL(locale.value as string));

const searchQuery = ref('');
const filterStatus = ref<'all' | 'lactating' | 'dry'>('all');
const selectionMode = ref(false);
const selectedIds = ref<string[]>([]);

const loading = computed(() => cowsStore.loading);
const cows = computed(() => cowsStore.activeCows);

const filterOptions = computed(() => [
  { label: t('cow.filterAll'), value: 'all' as const },
  { label: t('cow.lactating'), value: 'lactating' as const },
  { label: t('cow.dry'), value: 'dry' as const },
]);

const filteredCows = computed(() => {
  let result = cows.value;

  // Apply status filter
  if (filterStatus.value === 'lactating') {
    result = result.filter((cow) => cow.lactation_stage !== 'dry');
  } else if (filterStatus.value === 'dry') {
    result = result.filter((cow) => cow.lactation_stage === 'dry');
  }

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (cow) =>
        cow.name.toLowerCase().includes(query) ||
        cow.breed.toLowerCase().includes(query) ||
        (cow.tag_number && cow.tag_number.toLowerCase().includes(query)) ||
        (cow.coat_color && cow.coat_color.toLowerCase().includes(query))
    );
  }

  return result;
});

const allSelected = computed(
  () => filteredCows.value.length > 0 && filteredCows.value.every((cow) => selectedIds.value.includes(cow.id))
);

const someSelected = computed(
  () => filteredCows.value.some((cow) => selectedIds.value.includes(cow.id))
);

function toggleSelectionMode() {
  selectionMode.value = !selectionMode.value;
  if (!selectionMode.value) {
    selectedIds.value = [];
  }
}

function toggleCowSelection(id: string) {
  const index = selectedIds.value.indexOf(id);
  if (index === -1) {
    selectedIds.value.push(id);
  } else {
    selectedIds.value.splice(index, 1);
  }
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = filteredCows.value.map((cow) => cow.id);
  }
}

function onCowClick(id: string) {
  if (selectionMode.value) {
    toggleCowSelection(id);
  } else {
    router.push(`/cows/${id}`);
  }
}

function confirmBulkDelete() {
  warning();
  const count = selectedIds.value.length;
  $q.dialog({
    title: t('cow.bulkDelete'),
    message: t('cow.bulkDeleteConfirm', { count }, count),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const deletedCount = await cowsStore.bulkDeleteCows([...selectedIds.value]);
    if (deletedCount > 0) {
      success();
      $q.notify({
        type: 'positive',
        message: t('cow.bulkDeleteSuccess', { count: deletedCount }, deletedCount),
      });
      selectedIds.value = [];
      selectionMode.value = false;
    } else {
      hapticError();
    }
  });
}

function confirmBulkArchive() {
  warning();
  const count = selectedIds.value.length;
  $q.dialog({
    title: t('cow.bulkArchive'),
    message: t('cow.bulkArchiveConfirm', { count }, count),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const archivedCount = await cowsStore.bulkArchiveCows([...selectedIds.value]);
    if (archivedCount > 0) {
      success();
      $q.notify({
        type: 'positive',
        message: t('cow.bulkArchiveSuccess', { count: archivedCount }, archivedCount),
      });
      selectedIds.value = [];
      selectionMode.value = false;
    } else {
      hapticError();
    }
  });
}

async function onRefresh(done: () => void) {
  await cowsStore.fetchCows();
  done();
}

onMounted(() => {
  cowsStore.fetchCows();
  dietsStore.fetchDiets();
});
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: $radius-loose;
  overflow: hidden;
}

.bulk-action-bar {
  background: $dark;
  border-radius: $radius-loose;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  min-height: 48px;
}
</style>
