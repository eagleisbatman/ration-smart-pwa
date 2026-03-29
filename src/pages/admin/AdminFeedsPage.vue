<template>
  <q-page padding>
    <!-- Search + Add -->
    <div class="row items-center q-mb-md q-col-gutter-sm">
      <div class="col">
        <q-input
          v-model="search"
          :placeholder="$t('common.search')"
          outlined
          dense
          clearable
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>
      <div class="col-auto">
        <q-btn color="primary" icon="add" :label="$t('common.add')" no-caps unelevated @click="showAddDialog = true" />
      </div>
    </div>

    <!-- Bulk Actions -->
    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-auto">
        <q-btn outline color="primary" icon="upload" :label="$t('admin.feeds.bulkUpload')" no-caps @click="showBulkUpload = true" />
      </div>
      <div class="col-auto">
        <q-btn outline color="primary" icon="download" :label="$t('admin.feeds.export')" no-caps :loading="exporting" @click="doExport" />
      </div>
      <div class="col-auto">
        <q-btn outline color="secondary" icon="category" :label="$t('admin.feeds.manageTypes', 'Manage Types')" no-caps @click="showTypesDialog = true" />
      </div>
    </div>

    <!-- Loading -->
    <template v-if="adminStore.loading && feeds.length === 0">
      <q-skeleton v-for="i in 6" :key="i" height="56px" class="q-mb-xs" />
    </template>

    <!-- Feed List -->
    <q-card v-else-if="feeds.length > 0" flat bordered>
      <q-list separator>
        <q-item v-for="feed in feeds" :key="String(feed.id || feed.feed_id)">
          <q-item-section>
            <q-item-label>{{ feed.fd_name || feed.name }}</q-item-label>
            <q-item-label caption>
              {{ feed.fd_type || '' }} · {{ feed.fd_category || feed.category || '' }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <div class="row q-gutter-xs">
              <q-btn flat round dense icon="edit" size="sm" @click="editFeed(feed)" />
              <q-btn flat round dense icon="delete" color="negative" size="sm" @click="confirmDelete(feed)" />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>

    <!-- Empty -->
    <div v-else class="text-center q-pa-lg text-grey-5">
      {{ $t('admin.feeds.noFeeds') }}
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex flex-center q-mt-md">
      <q-pagination v-model="page" :max="totalPages" direction-links boundary-links />
    </div>

    <!-- Add/Edit Dialog -->
    <q-dialog v-model="showAddDialog" persistent>
      <q-card style="min-width: 340px">
        <q-card-section>
          <div class="text-h6">{{ editingFeed ? $t('common.edit') : $t('common.add') }} Feed</div>
        </q-card-section>
        <q-card-section class="q-gutter-sm">
          <q-input v-model="feedForm.name" label="Feed Name" outlined dense />
          <q-select
            v-model="feedForm.fd_type"
            :options="typeOptions"
            :label="$t('admin.feeds.type', 'Type')"
            outlined
            dense
            emit-value
            map-options
            behavior="menu"
          />
          <q-select
            v-model="feedForm.category"
            :options="filteredCategoryOptions"
            :label="$t('admin.feeds.category', 'Category')"
            outlined
            dense
            emit-value
            map-options
            behavior="menu"
          />
          <q-input v-model.number="feedForm.price_per_kg" label="Price/kg" type="number" outlined dense />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" @click="closeDialog" />
          <q-btn color="primary" :label="$t('common.save')" unelevated no-caps :loading="saving" @click="saveFeed" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Bulk Upload Dialog -->
    <q-dialog v-model="showBulkUpload">
      <q-card style="min-width: 340px">
        <q-card-section>
          <div class="text-h6">{{ $t('admin.feeds.bulkUpload') }}</div>
        </q-card-section>
        <q-card-section>
          <q-file v-model="uploadFile" label="Excel file" outlined dense accept=".xlsx,.xls,.csv" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" @click="showBulkUpload = false" />
          <q-btn color="primary" label="Upload" unelevated no-caps :loading="uploading" :disable="!uploadFile" @click="doBulkUpload" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Manage Feed Types & Categories Dialog -->
    <q-dialog v-model="showTypesDialog" persistent>
      <q-card style="min-width: 400px; max-width: 550px">
        <q-card-section>
          <div class="text-h6">{{ $t('admin.feeds.manageTypes', 'Manage Feed Types & Categories') }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <!-- Feed Types -->
          <div class="text-subtitle2 q-mb-xs">{{ $t('admin.feeds.feedTypes', 'Feed Types') }}</div>
          <q-list dense separator bordered class="rounded-borders q-mb-md">
            <q-item v-for="ft in adminStore.feedTypes" :key="ft.id">
              <q-item-section>{{ ft.type_name }}</q-item-section>
              <q-item-section side>
                <q-btn flat round dense icon="delete" color="negative" size="xs" @click="doDeleteType(ft)" />
              </q-item-section>
            </q-item>
            <q-item v-if="adminStore.feedTypes.length === 0">
              <q-item-section class="text-grey-5 text-caption">{{ $t('common.noData', 'No data') }}</q-item-section>
            </q-item>
          </q-list>
          <div class="row q-gutter-xs q-mb-lg">
            <q-input v-model="newTypeName" :placeholder="$t('admin.feeds.newTypeName', 'New type name')" outlined dense class="col" />
            <q-btn color="primary" icon="add" dense unelevated :disable="!newTypeName.trim()" :loading="addingType" @click="doAddType" />
          </div>

          <!-- Feed Categories -->
          <div class="text-subtitle2 q-mb-xs">{{ $t('admin.feeds.feedCategories', 'Feed Categories') }}</div>
          <q-list dense separator bordered class="rounded-borders q-mb-md">
            <q-item v-for="fc in adminStore.feedCategories" :key="fc.id">
              <q-item-section>
                <q-item-label>{{ fc.category_name }}</q-item-label>
                <q-item-label caption>{{ getTypeName(fc.feed_type_id) }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn flat round dense icon="delete" color="negative" size="xs" @click="doDeleteCategory(fc)" />
              </q-item-section>
            </q-item>
            <q-item v-if="adminStore.feedCategories.length === 0">
              <q-item-section class="text-grey-5 text-caption">{{ $t('common.noData', 'No data') }}</q-item-section>
            </q-item>
          </q-list>
          <div class="row q-gutter-xs">
            <q-select
              v-model="newCatTypeId"
              :options="typeOptions"
              :label="$t('admin.feeds.type', 'Type')"
              outlined
              dense
              emit-value
              map-options
              class="col-5"
              behavior="menu"
            />
            <q-input v-model="newCatName" :placeholder="$t('admin.feeds.newCategoryName', 'New category name')" outlined dense class="col" />
            <q-btn color="primary" icon="add" dense unelevated :disable="!newCatName.trim() || !newCatTypeId" :loading="addingCategory" @click="doAddCategory" />
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('common.close', 'Close')" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useAdminStore } from 'src/stores/admin';
import { useAuthStore } from 'src/stores/auth';

const $q = useQuasar();
const { t } = useI18n();
const adminStore = useAdminStore();
const authStore = useAuthStore();

const feeds = ref<Record<string, unknown>[]>([]);
const totalCount = ref(0);
const page = ref(1);
const search = ref('');
const showAddDialog = ref(false);
const showBulkUpload = ref(false);
const showTypesDialog = ref(false);
const editingFeed = ref<Record<string, unknown> | null>(null);
const saving = ref(false);
const exporting = ref(false);
const uploading = ref(false);
const uploadFile = ref<File | null>(null);

// New type/category management
const newTypeName = ref('');
const addingType = ref(false);
const newCatName = ref('');
const newCatTypeId = ref('');
const addingCategory = ref(false);

const feedForm = ref({
  name: '',
  fd_type: '',
  category: '',
  price_per_kg: 0,
});

const totalPages = ref(1);

// Dynamic options from backend
const typeOptions = computed(() =>
  adminStore.feedTypes.map((ft) => ({ label: ft.type_name, value: ft.type_name }))
);

const filteredCategoryOptions = computed(() => {
  const selectedType = feedForm.value.fd_type;
  if (!selectedType) return adminStore.feedCategories.map((fc) => ({ label: fc.category_name, value: fc.category_name }));
  // Find the type id for the selected type name
  const typeObj = adminStore.feedTypes.find((ft) => ft.type_name === selectedType);
  if (!typeObj) return [];
  return adminStore.feedCategories
    .filter((fc) => fc.feed_type_id === typeObj.id)
    .map((fc) => ({ label: fc.category_name, value: fc.category_name }));
});

function getTypeName(typeId: string): string {
  const ft = adminStore.feedTypes.find((t) => t.id === typeId);
  return ft?.type_name || typeId;
}

async function loadFeeds() {
  const result = await adminStore.fetchFeeds(page.value, search.value || undefined);
  feeds.value = result.feeds;
  totalCount.value = result.total;
  totalPages.value = Math.max(1, Math.ceil(result.total / 25));
}

async function loadTypesAndCategories() {
  await Promise.all([adminStore.listFeedTypes(), adminStore.listFeedCategories()]);
}

watch([page, search], () => loadFeeds());
onMounted(async () => {
  await Promise.all([loadFeeds(), loadTypesAndCategories()]);
});

// Reset category when type changes in form
watch(() => feedForm.value.fd_type, () => {
  feedForm.value.category = '';
});

function editFeed(feed: Record<string, unknown>) {
  editingFeed.value = feed;
  feedForm.value = {
    name: String(feed.fd_name || feed.name || ''),
    fd_type: String(feed.fd_type || ''),
    category: String(feed.fd_category || feed.category || ''),
    price_per_kg: Number(feed.price_per_kg || 0),
  };
  showAddDialog.value = true;
}

function closeDialog() {
  showAddDialog.value = false;
  editingFeed.value = null;
  feedForm.value = { name: '', fd_type: '', category: '', price_per_kg: 0 };
}

async function saveFeed() {
  saving.value = true;
  const payload = {
    fd_name: feedForm.value.name,
    fd_type: feedForm.value.fd_type,
    fd_category: feedForm.value.category,
    price_per_kg: feedForm.value.price_per_kg,
    country_id: authStore.user?.country_id,
  };

  let ok: boolean;
  if (editingFeed.value) {
    ok = await adminStore.updateFeed(String(editingFeed.value.id || editingFeed.value.feed_id), payload);
  } else {
    ok = await adminStore.addFeed(payload);
  }
  saving.value = false;

  if (ok) {
    $q.notify({ type: 'positive', message: t('common.success') });
    closeDialog();
    await loadFeeds();
  } else {
    $q.notify({ type: 'negative', message: adminStore.error || t('common.error') });
  }
}

function confirmDelete(feed: Record<string, unknown>) {
  $q.dialog({
    title: t('common.confirm'),
    message: `Delete "${feed.fd_name || feed.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const ok = await adminStore.deleteFeed(String(feed.id || feed.feed_id));
    if (ok) {
      $q.notify({ type: 'positive', message: 'Feed deleted' });
      await loadFeeds();
    } else {
      $q.notify({ type: 'negative', message: adminStore.error || t('common.error') });
    }
  });
}

async function doExport() {
  exporting.value = true;
  const url = await adminStore.exportFeeds(authStore.user?.country_id as string);
  exporting.value = false;
  if (!url) {
    $q.notify({ type: 'negative', message: adminStore.error || 'Export failed' });
  }
}

async function doBulkUpload() {
  if (!uploadFile.value) return;
  uploading.value = true;
  const result = await adminStore.bulkUploadFeeds(uploadFile.value, authStore.user?.country_id as string || '');
  uploading.value = false;
  showBulkUpload.value = false;
  uploadFile.value = null;
  $q.notify({ type: result.success ? 'positive' : 'negative', message: result.message });
  if (result.success) await loadFeeds();
}

// ---- Type Management ----
async function doAddType() {
  if (!newTypeName.value.trim()) return;
  addingType.value = true;
  const ok = await adminStore.addFeedType(newTypeName.value.trim());
  addingType.value = false;
  if (ok) {
    newTypeName.value = '';
    $q.notify({ type: 'positive', message: t('common.success') });
    await adminStore.listFeedTypes();
  } else {
    $q.notify({ type: 'negative', message: adminStore.error || t('common.error') });
  }
}

async function doDeleteType(ft: { id: string; type_name: string }) {
  $q.dialog({
    title: t('common.confirm'),
    message: `Delete type "${ft.type_name}"? This will also remove associated categories.`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const ok = await adminStore.deleteFeedType(ft.id);
    if (ok) {
      $q.notify({ type: 'positive', message: 'Feed type deleted' });
      await loadTypesAndCategories();
    } else {
      $q.notify({ type: 'negative', message: adminStore.error || t('common.error') });
    }
  });
}

// ---- Category Management ----
async function doAddCategory() {
  if (!newCatName.value.trim() || !newCatTypeId.value) return;
  addingCategory.value = true;
  const ok = await adminStore.addFeedCategory(newCatName.value.trim(), newCatTypeId.value);
  addingCategory.value = false;
  if (ok) {
    newCatName.value = '';
    $q.notify({ type: 'positive', message: t('common.success') });
    await adminStore.listFeedCategories();
  } else {
    $q.notify({ type: 'negative', message: adminStore.error || t('common.error') });
  }
}

async function doDeleteCategory(fc: { id: string; category_name: string }) {
  $q.dialog({
    title: t('common.confirm'),
    message: `Delete category "${fc.category_name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const ok = await adminStore.deleteFeedCategory(fc.id);
    if (ok) {
      $q.notify({ type: 'positive', message: 'Feed category deleted' });
      await adminStore.listFeedCategories();
    } else {
      $q.notify({ type: 'negative', message: adminStore.error || t('common.error') });
    }
  });
}
</script>
