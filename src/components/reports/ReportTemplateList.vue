<template>
  <div>
    <div class="text-subtitle1 q-mb-sm">{{ $t('reports.templates.title') }}</div>

    <template v-if="templates.length === 0">
      <q-card flat bordered class="text-center q-pa-lg">
        <q-icon name="bookmark_border" size="48px" color="grey-4" />
        <div class="text-body2 text-grey-7 q-mt-sm">{{ $t('reports.templates.noTemplates') }}</div>
        <div class="text-caption text-grey-5">{{ $t('reports.templates.noTemplatesHint') }}</div>
      </q-card>
    </template>

    <template v-else>
      <q-list bordered separator class="rounded-borders">
        <q-item v-for="template in templates" :key="template.id">
          <q-item-section>
            <q-item-label>{{ template.name }}</q-item-label>
            <q-item-label caption>
              <q-badge
                :color="getReportTypeColor(template.report_type)"
                text-color="white"
                class="q-mr-xs"
              >
                {{ getReportTypeLabel(template.report_type) }}
              </q-badge>
              <span v-if="template.created_at">{{ formatDate(template.created_at, 'PP') }}</span>
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <div class="row items-center q-gutter-xs">
              <q-btn
                flat
                dense
                color="primary"
                :label="$t('reports.templates.useTemplate')"
                size="sm"
                @click="onUse(template)"
              />
              <q-btn
                flat
                dense
                round
                color="negative"
                icon="delete"
                size="sm"
                @click="confirmDelete(template)"
              />
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </template>

    <!-- Confirm Delete Dialog -->
    <q-dialog v-model="showDeleteDialog">
      <q-card style="min-width: 280px;">
        <q-card-section>
          <div class="text-h6">{{ $t('reports.templates.deleteTemplate') }}</div>
        </q-card-section>
        <q-card-section>
          {{ $t('reports.templates.deleteConfirm') }}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" v-close-popup />
          <q-btn
            flat
            :label="$t('common.delete')"
            color="negative"
            @click="onDelete"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { db, ReportTemplate } from 'src/lib/offline/db';
import { useDateFormat } from 'src/composables/useDateFormat';

const emit = defineEmits<{
  use: [template: ReportTemplate];
}>();

const { t } = useI18n();
const $q = useQuasar();
const { formatDate } = useDateFormat();

const templates = ref<ReportTemplate[]>([]);
const showDeleteDialog = ref(false);
const templateToDelete = ref<ReportTemplate | null>(null);

const reportTypeColors: Record<string, string> = {
  milk_production: 'primary',
  feed_consumption: 'secondary',
  cow_performance: 'accent',
  cost_analysis: 'positive',
};

function getReportTypeColor(type: string): string {
  return reportTypeColors[type] || 'grey';
}

function getReportTypeLabel(type: string): string {
  const key = `reports.reportTypes.${type.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase())}`;
  return t(key);
}

function onUse(template: ReportTemplate) {
  emit('use', template);
}

function confirmDelete(template: ReportTemplate) {
  templateToDelete.value = template;
  showDeleteDialog.value = true;
}

async function onDelete() {
  if (!templateToDelete.value?.id) return;

  try {
    await db.reportTemplates.delete(templateToDelete.value.id);
    templates.value = templates.value.filter((tpl) => tpl.id !== templateToDelete.value?.id);

    $q.notify({
      type: 'positive',
      message: t('reports.templates.deleted'),
      icon: 'check_circle',
    });
  } catch (err) {
    console.error('[ReportTemplateList] Failed to delete template:', err);
    $q.notify({
      type: 'negative',
      message: t('errors.generic'),
    });
  } finally {
    showDeleteDialog.value = false;
    templateToDelete.value = null;
  }
}

async function loadTemplates() {
  try {
    templates.value = await db.reportTemplates.orderBy('created_at').reverse().toArray();
  } catch (err) {
    console.error('[ReportTemplateList] Failed to load templates:', err);
    templates.value = [];
  }
}

onMounted(() => {
  loadTemplates();
});

defineExpose({ loadTemplates });
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: 12px;
  overflow: hidden;
}
</style>
