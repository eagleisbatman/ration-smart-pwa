<template>
  <q-page class="q-pa-md">
    <q-stepper
      v-model="step"
      ref="stepperRef"
      color="primary"
      animated
      flat
      bordered
      class="rounded-borders"
    >
      <!-- Step 1: File Upload -->
      <q-step
        :name="1"
        :title="$t('farmers.import.uploadFile')"
        icon="upload_file"
        :done="step > 1"
      >
        <div class="q-gutter-md">
          <!-- Drag & Drop Zone -->
          <div
            class="upload-zone column items-center justify-center q-pa-xl"
            :class="{ 'upload-zone--active': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onFileDrop"
          >
            <q-icon name="cloud_upload" size="64px" color="grey-5" />
            <div class="text-body1 text-grey-7 q-mt-md">
              {{ $t('farmers.import.dragDrop') }}
            </div>
            <div class="text-caption text-grey-5 q-mt-xs">
              {{ $t('farmers.import.orBrowse') }}
            </div>
            <q-file
              v-model="selectedFile"
              outlined
              dense
              accept=".csv"
              class="q-mt-md"
              style="max-width: 300px"
              @update:model-value="onFileSelected"
            >
              <template #prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>
          </div>

          <!-- File Info -->
          <q-banner v-if="selectedFile" class="bg-positive text-white rounded-borders">
            <template #avatar>
              <q-icon name="description" />
            </template>
            {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
          </q-banner>

          <!-- Error -->
          <q-banner v-if="parseError" class="bg-negative text-white rounded-borders">
            <template #avatar>
              <q-icon name="error" />
            </template>
            {{ parseError }}
          </q-banner>

          <!-- Download Template -->
          <div class="text-center q-mt-md">
            <q-btn
              flat
              color="primary"
              icon="download"
              :label="$t('farmers.import.downloadTemplate')"
              @click="onDownloadTemplate"
            />
          </div>
        </div>

        <q-stepper-navigation>
          <q-btn
            color="primary"
            :label="$t('common.next')"
            :disable="!parsedData || parsedData.rows.length === 0"
            @click="step = 2"
          />
        </q-stepper-navigation>
      </q-step>

      <!-- Step 2: Preview & Mapping -->
      <q-step
        :name="2"
        :title="$t('farmers.import.preview')"
        icon="table_chart"
        :done="step > 2"
      >
        <div class="q-gutter-md">
          <!-- Column Mapping -->
          <div class="text-subtitle1 text-weight-medium">
            {{ $t('farmers.import.mapColumns') }}
          </div>

          <q-markup-table flat bordered separator="cell" class="rounded-borders">
            <thead>
              <tr>
                <th class="text-left">{{ $t('farmers.import.csvColumn') }}</th>
                <th class="text-left">{{ $t('farmers.import.farmerField') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="header in parsedData?.headers" :key="header">
                <td>{{ header }}</td>
                <td>
                  <q-select
                    v-model="columnMapping[header]"
                    :options="farmerFieldOptions"
                    dense
                    outlined
                    emit-value
                    map-options
                    @update:model-value="validateAllRows"
                  />
                </td>
              </tr>
            </tbody>
          </q-markup-table>

          <!-- Validation Summary -->
          <div class="row q-gutter-sm">
            <q-chip color="positive" text-color="white" icon="check_circle">
              {{ $t('farmers.import.validRows', { count: validRowCount }) }}
            </q-chip>
            <q-chip
              v-if="invalidRowCount > 0"
              color="negative"
              text-color="white"
              icon="error"
            >
              {{ $t('farmers.import.invalidRows', { count: invalidRowCount }) }}
            </q-chip>
          </div>

          <!-- Preview Table -->
          <q-table
            flat
            bordered
            :rows="previewRows"
            :columns="previewColumns"
            row-key="__rowIndex"
            :rows-per-page-options="[10, 25, 50]"
            class="rounded-borders"
          >
            <template #body-cell="props">
              <q-td :props="props">
                <span :class="cellClass(props.row, props.col.name)">
                  {{ props.value }}
                </span>
                <q-tooltip
                  v-if="getCellError(props.row, props.col.name)"
                  class="bg-negative"
                >
                  {{ getCellError(props.row, props.col.name) }}
                </q-tooltip>
              </q-td>
            </template>
          </q-table>
        </div>

        <q-stepper-navigation>
          <q-btn
            color="primary"
            :label="$t('common.next')"
            :disable="validRowCount === 0"
            @click="step = 3"
          />
          <q-btn
            flat
            color="primary"
            :label="$t('common.back')"
            class="q-ml-sm"
            @click="step = 1"
          />
        </q-stepper-navigation>
      </q-step>

      <!-- Step 3: Import -->
      <q-step
        :name="3"
        :title="$t('farmers.import.import', { count: '' })"
        icon="file_download"
      >
        <div class="q-gutter-md">
          <!-- Not yet importing -->
          <template v-if="importState === 'idle'">
            <div class="text-center q-pa-lg">
              <q-icon name="group_add" size="64px" color="primary" />
              <div class="text-h6 q-mt-md">
                {{ $t('farmers.import.import', { count: validRowCount }) }}
              </div>
              <div class="text-body2 text-grey-7 q-mt-sm">
                {{ $t('farmers.import.validRows', { count: validRowCount }) }}
                <span v-if="invalidRowCount > 0">
                  &middot; {{ $t('farmers.import.skipped', { count: invalidRowCount }) }}
                </span>
              </div>
            </div>
          </template>

          <!-- Importing in progress -->
          <template v-if="importState === 'importing'">
            <div class="text-center q-pa-lg">
              <q-spinner-gears size="48px" color="primary" />
              <div class="text-body1 q-mt-md">{{ $t('farmers.import.importing') }}</div>
              <q-linear-progress
                :value="importProgress"
                size="12px"
                color="primary"
                class="q-mt-md"
                rounded
              />
              <div class="text-caption text-grey-7 q-mt-sm">
                {{ importedCount }} / {{ validRowCount }}
              </div>
            </div>
          </template>

          <!-- Import Complete -->
          <template v-if="importState === 'complete'">
            <div class="text-center q-pa-lg">
              <q-icon name="check_circle" size="64px" color="positive" />
              <div class="text-h6 q-mt-md">{{ $t('farmers.import.complete') }}</div>
              <div class="q-mt-md q-gutter-sm">
                <q-chip color="positive" text-color="white" icon="check">
                  {{ $t('farmers.import.imported', { count: importedCount }) }}
                </q-chip>
                <q-chip
                  v-if="skippedCount > 0"
                  color="warning"
                  text-color="white"
                  icon="skip_next"
                >
                  {{ $t('farmers.import.skipped', { count: skippedCount }) }}
                </q-chip>
                <q-chip
                  v-if="errorCount > 0"
                  color="negative"
                  text-color="white"
                  icon="error"
                >
                  {{ $t('farmers.import.errors', { count: errorCount }) }}
                </q-chip>
              </div>
            </div>
          </template>
        </div>

        <q-stepper-navigation>
          <template v-if="importState === 'idle'">
            <q-btn
              color="primary"
              icon="file_download"
              :label="$t('farmers.import.import', { count: validRowCount })"
              :disable="validRowCount === 0"
              @click="startImport"
            />
            <q-btn
              flat
              color="primary"
              :label="$t('common.back')"
              class="q-ml-sm"
              @click="step = 2"
            />
          </template>
          <template v-if="importState === 'complete'">
            <q-btn
              color="primary"
              :label="$t('common.done')"
              @click="router.push({ name: 'farmers' })"
            />
          </template>
        </q-stepper-navigation>
      </q-step>
    </q-stepper>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useFarmersStore, FarmerInput } from 'src/stores/farmers';
import {
  parseCSV,
  readFileAsText,
  autoDetectMapping,
  generateTemplate,
  downloadAsFile,
  isNonEmpty,
  isValidPhone,
  ParsedCSV,
} from 'src/lib/csv-parser';

const router = useRouter();
const { t } = useI18n();
const farmersStore = useFarmersStore();

// Stepper
const step = ref(1);
const stepperRef = ref();

// Step 1: File Upload
const selectedFile = ref<File | null>(null);
const isDragging = ref(false);
const parseError = ref('');
const parsedData = ref<ParsedCSV | null>(null);

// Step 2: Mapping
const columnMapping = ref<Record<string, string>>({});
const rowErrors = ref<Map<number, Record<string, string>>>(new Map());

// Step 3: Import
const importState = ref<'idle' | 'importing' | 'complete'>('idle');
const importedCount = ref(0);
const skippedCount = ref(0);
const errorCount = ref(0);

// Farmer field options for the mapping select
const farmerFieldOptions = computed(() => [
  { label: '-- ' + t('common.skip') + ' --', value: '' },
  { label: t('farmer.farmerName'), value: 'name' },
  { label: t('farmer.phoneNumber'), value: 'phone' },
  { label: t('profile.village'), value: 'village' },
  { label: t('profile.district'), value: 'district' },
  { label: t('profile.state'), value: 'state' },
]);

// Computed
const validRowCount = computed(() => {
  if (!parsedData.value) return 0;
  return parsedData.value.rows.length - invalidRowCount.value;
});

const invalidRowCount = computed(() => {
  return rowErrors.value.size;
});

const importProgress = computed(() => {
  if (validRowCount.value === 0) return 0;
  return importedCount.value / validRowCount.value;
});

// Preview table columns derived from mapping
const previewColumns = computed(() => {
  const cols: { name: string; label: string; field: string; align: 'left' }[] = [];
  if (!parsedData.value) return cols;

  for (const header of parsedData.value.headers) {
    const mappedField = columnMapping.value[header];
    const fieldLabel = mappedField
      ? farmerFieldOptions.value.find((o) => o.value === mappedField)?.label || header
      : header;

    cols.push({
      name: header,
      label: `${header}${mappedField ? ' -> ' + fieldLabel : ''}`,
      field: header,
      align: 'left' as const,
    });
  }

  return cols;
});

// Preview rows with __rowIndex for keying and error tracking
const previewRows = computed(() => {
  if (!parsedData.value) return [];
  return parsedData.value.rows.map((row, i) => ({
    ...row,
    __rowIndex: i,
  }));
});

// File handling
async function onFileSelected(file: File | null) {
  if (!file) {
    parsedData.value = null;
    parseError.value = '';
    return;
  }
  await processFile(file);
}

function onFileDrop(event: DragEvent) {
  isDragging.value = false;
  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) return;

  const file = files[0];
  if (!file.name.endsWith('.csv')) {
    parseError.value = t('farmers.import.noFile');
    return;
  }

  selectedFile.value = file;
  processFile(file);
}

async function processFile(file: File) {
  parseError.value = '';
  try {
    const text = await readFileAsText(file);
    const result = parseCSV(text);

    if (result.headers.length === 0 || result.rows.length === 0) {
      parseError.value = t('farmers.import.noFile');
      parsedData.value = null;
      return;
    }

    parsedData.value = result;

    // Auto-detect column mapping
    columnMapping.value = autoDetectMapping(result.headers);

    // Validate
    validateAllRows();
  } catch {
    parseError.value = t('errors.generic');
    parsedData.value = null;
  }
}

function onDownloadTemplate() {
  const csv = generateTemplate();
  downloadAsFile(csv, 'farmer_import_template.csv');
}

// Validation
function validateAllRows() {
  if (!parsedData.value) return;

  const errors = new Map<number, Record<string, string>>();

  // Check if 'name' is mapped
  const nameHeader = Object.entries(columnMapping.value).find(
    ([, field]) => field === 'name'
  )?.[0];

  const phoneHeader = Object.entries(columnMapping.value).find(
    ([, field]) => field === 'phone'
  )?.[0];

  for (let i = 0; i < parsedData.value.rows.length; i++) {
    const row = parsedData.value.rows[i];
    const rowError: Record<string, string> = {};

    // Name is required
    if (nameHeader) {
      if (!isNonEmpty(row[nameHeader])) {
        rowError[nameHeader] = t('farmers.import.requiredField');
      }
    } else {
      // No name column mapped - all rows are invalid
      // We mark the first header as having the error for display
      if (parsedData.value.headers.length > 0) {
        rowError[parsedData.value.headers[0]] = t('farmers.import.requiredField') + ' (name)';
      }
    }

    // Phone validation (if mapped)
    if (phoneHeader && row[phoneHeader] && !isValidPhone(row[phoneHeader])) {
      rowError[phoneHeader] = t('validation.phone');
    }

    if (Object.keys(rowError).length > 0) {
      errors.set(i, rowError);
    }
  }

  rowErrors.value = errors;
}

function getCellError(row: Record<string, unknown>, colName: string): string | null {
  const rowIndex = row.__rowIndex as number;
  const errors = rowErrors.value.get(rowIndex);
  return errors?.[colName] || null;
}

function cellClass(row: Record<string, unknown>, colName: string): string {
  return getCellError(row, colName) ? 'text-negative text-weight-bold' : '';
}

// Import
async function startImport() {
  if (!parsedData.value) return;

  importState.value = 'importing';
  importedCount.value = 0;
  skippedCount.value = 0;
  errorCount.value = 0;

  // Build reverse mapping: farmer field -> CSV header
  const fieldToHeader: Record<string, string> = {};
  for (const [header, field] of Object.entries(columnMapping.value)) {
    if (field) {
      fieldToHeader[field] = header;
    }
  }

  for (let i = 0; i < parsedData.value.rows.length; i++) {
    // Skip invalid rows
    if (rowErrors.value.has(i)) {
      skippedCount.value++;
      continue;
    }

    const row = parsedData.value.rows[i];

    const input: FarmerInput = {
      name: fieldToHeader.name ? row[fieldToHeader.name]?.trim() || '' : '',
      phone: fieldToHeader.phone ? row[fieldToHeader.phone]?.trim() : undefined,
      village: fieldToHeader.village ? row[fieldToHeader.village]?.trim() : undefined,
      district: fieldToHeader.district ? row[fieldToHeader.district]?.trim() : undefined,
      state: fieldToHeader.state ? row[fieldToHeader.state]?.trim() : undefined,
    };

    try {
      await farmersStore.createFarmer(input);
      importedCount.value++;
    } catch {
      errorCount.value++;
    }

    // Small delay to allow UI to update progress
    if (i % 5 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  importState.value = 'complete';
}

// Helpers
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: 12px;
  overflow: hidden;
}

.upload-zone {
  border: 2px dashed $grey-4;
  border-radius: 12px;
  background: $grey-1;
  transition: all 0.2s ease;
  min-height: 200px;
  cursor: pointer;

  &--active {
    border-color: $primary;
    background: rgba($primary, 0.05);
  }
}
</style>
