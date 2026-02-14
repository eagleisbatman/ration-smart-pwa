<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card>
      <q-card-section class="row items-center q-pb-sm">
        <q-icon name="warning" color="warning" size="md" class="q-mr-sm" />
        <div class="text-h6">{{ $t('sync.conflict.title') }}</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="showDialog = false" />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <p class="text-body2 text-grey-7">
          {{ $t('sync.conflict.description') }}
        </p>
      </q-card-section>

      <!-- Bulk resolve actions -->
      <q-card-section v-if="conflicts.length > 1" class="q-pt-none">
        <div class="row q-gutter-sm">
          <q-btn
            :label="$t('sync.conflict.resolveAllLocal')"
            color="primary"
            outline
            no-caps
            size="sm"
            @click="onResolveAll('local')"
            :loading="resolvingAll"
          />
          <q-btn
            :label="$t('sync.conflict.resolveAllServer')"
            color="secondary"
            outline
            no-caps
            size="sm"
            @click="onResolveAll('server')"
            :loading="resolvingAll"
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-pa-none scroll-list scroll-list--50vh">
        <q-list separator>
          <q-item v-for="conflict in conflicts" :key="conflict.id" class="q-pa-md">
            <q-item-section>
              <!-- Entity header -->
              <q-item-label class="row items-center q-mb-sm">
                <q-icon
                  :name="entityIcon(conflict.entity_type)"
                  color="primary"
                  size="sm"
                  class="q-mr-xs"
                />
                <span class="text-weight-medium">
                  {{ $t('sync.conflict.entityTypes.' + conflict.entity_type) }}
                </span>
                <span class="q-ml-xs text-grey-6 text-caption">
                  {{ entityDisplayName(conflict) }}
                </span>
              </q-item-label>

              <!-- Modified fields comparison -->
              <div class="q-mb-sm">
                <q-item-label caption class="q-mb-xs">
                  {{ $t('sync.conflict.modifiedField') }}
                </q-item-label>
                <div
                  v-for="field in getChangedFields(conflict)"
                  :key="field.key"
                  class="conflict-field q-mb-xs"
                >
                  <div class="text-caption text-weight-medium q-mb-xs">{{ field.key }}</div>
                  <div class="row q-gutter-sm">
                    <div class="col conflict-value conflict-local">
                      <div class="text-caption text-grey-6">{{ $t('sync.conflict.localVersion') }}</div>
                      <div class="text-body2">{{ formatValue(field.local) }}</div>
                    </div>
                    <div class="col conflict-value conflict-server">
                      <div class="text-caption text-grey-6">{{ $t('sync.conflict.serverVersion') }}</div>
                      <div class="text-body2">{{ formatValue(field.server) }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Per-conflict actions -->
              <div class="row q-gutter-sm">
                <q-btn
                  :label="$t('sync.conflict.keepLocal')"
                  color="primary"
                  flat
                  no-caps
                  dense
                  size="sm"
                  @click="onResolve(conflict.id!, 'local')"
                  :loading="resolvingId === conflict.id"
                />
                <q-btn
                  :label="$t('sync.conflict.useServer')"
                  color="secondary"
                  flat
                  no-caps
                  dense
                  size="sm"
                  @click="onResolve(conflict.id!, 'server')"
                  :loading="resolvingId === conflict.id"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { db, SyncConflict } from 'src/lib/offline/db';
import { useOfflineSync } from 'src/composables/useOfflineSync';

const { hasConflicts, resolveConflict, resolveAllConflicts } = useOfflineSync();

const showDialog = ref(false);
const conflicts = ref<SyncConflict[]>([]);
const resolvingId = ref<number | null>(null);
const resolvingAll = ref(false);

const ENTITY_ICONS: Record<string, string> = {
  cow: 'pets',
  feed: 'grass',
  diet: 'restaurant_menu',
  milk_log: 'water_drop',
  farmer: 'agriculture',
  yield: 'trending_up',
};

function entityIcon(entityType: string): string {
  return ENTITY_ICONS[entityType] || 'description';
}

function entityDisplayName(conflict: SyncConflict): string {
  const name =
    (conflict.local_data.name as string) ||
    (conflict.server_data.name as string) ||
    conflict.entity_id;
  return name;
}

interface ChangedField {
  key: string;
  local: unknown;
  server: unknown;
}

function getChangedFields(conflict: SyncConflict): ChangedField[] {
  const fields: ChangedField[] = [];
  const skipKeys = new Set([
    'id', '_synced', '_deleted', 'created_at', 'updated_at',
  ]);

  const allKeys = new Set([
    ...Object.keys(conflict.local_data),
    ...Object.keys(conflict.server_data),
  ]);

  for (const key of allKeys) {
    if (skipKeys.has(key)) continue;

    const localVal = conflict.local_data[key];
    const serverVal = conflict.server_data[key];

    if (JSON.stringify(localVal) !== JSON.stringify(serverVal)) {
      fields.push({ key, local: localVal, server: serverVal });
    }
  }

  return fields;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

async function loadConflicts() {
  conflicts.value = await db.getSyncConflicts();
}

async function onResolve(conflictId: number, choice: 'local' | 'server') {
  resolvingId.value = conflictId;
  try {
    await resolveConflict(conflictId, choice);
    await loadConflicts();
    if (conflicts.value.length === 0) {
      showDialog.value = false;
    }
  } finally {
    resolvingId.value = null;
  }
}

async function onResolveAll(choice: 'local' | 'server') {
  resolvingAll.value = true;
  try {
    await resolveAllConflicts(choice);
    await loadConflicts();
    showDialog.value = false;
  } finally {
    resolvingAll.value = false;
  }
}

watch(
  () => hasConflicts.value,
  async (val) => {
    if (val) {
      await loadConflicts();
      showDialog.value = true;
    }
  }
);

onMounted(async () => {
  if (hasConflicts.value) {
    await loadConflicts();
    showDialog.value = true;
  }
});
</script>

<style lang="scss" scoped>
.conflict-field {
  background: $grey-1;
  border-radius: 4px;
  padding: 8px;
}

.conflict-value {
  padding: 4px 8px;
  border-radius: 4px;
}

.conflict-local {
  background: rgba($primary, 0.05);
  border-left: 3px solid $primary;
}

.conflict-server {
  background: rgba($secondary, 0.05);
  border-left: 3px solid $secondary;
}
</style>
