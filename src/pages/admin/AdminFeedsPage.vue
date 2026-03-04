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
          <q-select v-model="feedForm.fd_type" :options="['Forage', 'Concentrate']" label="Type" outlined dense behavior="menu" />
          <q-input v-model="feedForm.category" label="Category" outlined dense />
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
  </q-page>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
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
const editingFeed = ref<Record<string, unknown> | null>(null);
const saving = ref(false);
const exporting = ref(false);
const uploading = ref(false);
const uploadFile = ref<File | null>(null);

const feedForm = ref({
  name: '',
  fd_type: 'Concentrate',
  category: '',
  price_per_kg: 0,
});

const totalPages = ref(1);

async function loadFeeds() {
  const result = await adminStore.fetchFeeds(page.value, search.value || undefined);
  feeds.value = result.feeds;
  totalCount.value = result.total;
  totalPages.value = Math.max(1, Math.ceil(result.total / 25));
}

watch([page, search], () => loadFeeds());
onMounted(loadFeeds);

function editFeed(feed: Record<string, unknown>) {
  editingFeed.value = feed;
  feedForm.value = {
    name: String(feed.fd_name || feed.name || ''),
    fd_type: String(feed.fd_type || 'Concentrate'),
    category: String(feed.fd_category || feed.category || ''),
    price_per_kg: Number(feed.price_per_kg || 0),
  };
  showAddDialog.value = true;
}

function closeDialog() {
  showAddDialog.value = false;
  editingFeed.value = null;
  feedForm.value = { name: '', fd_type: 'Concentrate', category: '', price_per_kg: 0 };
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
    }
  });
}

async function doExport() {
  exporting.value = true;
  const url = await adminStore.exportFeeds(authStore.user?.country_id as string);
  exporting.value = false;
  if (url) {
    window.open(url, '_blank');
  } else {
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
</script>
