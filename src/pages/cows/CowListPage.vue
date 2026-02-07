<template>
  <q-page class="q-pa-md">
    <PullToRefresh @refresh="onRefresh">
      <!-- Search Bar & Selection Toggle -->
      <div class="row items-center q-mb-md q-gutter-x-sm">
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
    <q-page-sticky v-if="!selectionMode" position="bottom-right" :offset="[18, 18]">
      <q-btn fab icon="add" color="primary" @click="router.push('/cows/new')" />
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useCowsStore } from 'src/stores/cows';
import { useHapticFeedback } from 'src/composables/useHapticFeedback';
import PullToRefresh from 'src/components/ui/PullToRefresh.vue';
import SkeletonList from 'src/components/ui/SkeletonList.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';
import { COW_ICON } from 'src/boot/icons';

const router = useRouter();
const $q = useQuasar();
const { t } = useI18n();
const cowsStore = useCowsStore();
const { success, error: hapticError, warning } = useHapticFeedback();

const searchQuery = ref('');
const selectionMode = ref(false);
const selectedIds = ref<string[]>([]);

const loading = computed(() => cowsStore.loading);
const cows = computed(() => cowsStore.activeCows);

const filteredCows = computed(() => {
  if (!searchQuery.value) return cows.value;

  const query = searchQuery.value.toLowerCase();
  return cows.value.filter(
    (cow) =>
      cow.name.toLowerCase().includes(query) ||
      cow.breed.toLowerCase().includes(query) ||
      (cow.tag_number && cow.tag_number.toLowerCase().includes(query)) ||
      (cow.coat_color && cow.coat_color.toLowerCase().includes(query))
  );
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
});
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: 12px;
  overflow: hidden;
}

.bulk-action-bar {
  background: $dark;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  min-height: 48px;
}
</style>
