<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card class="dialog-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ $t('reports.templates.saveTemplate') }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-input
          v-model="templateName"
          :label="$t('reports.templates.templateName')"
          :placeholder="$t('reports.templates.namePlaceholder')"
          filled
          autofocus
          :rules="[val => !!val && val.trim().length > 0 || $t('validation.required')]"
        />
      </q-card-section>

      <q-card-actions align="right" class="q-px-md q-pb-md">
        <q-btn flat :label="$t('common.cancel')" v-close-popup />
        <q-btn
          unelevated
          color="primary"
          :label="$t('common.save')"
          :disable="!templateName.trim()"
          :loading="saving"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { v4 as uuidv4 } from 'uuid';
import { db, ReportTemplate } from 'src/lib/offline/db';

const props = defineProps<{
  modelValue: boolean;
  reportType: string;
  parameters: Record<string, unknown>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const { t } = useI18n();
const $q = useQuasar();

const templateName = ref('');
const saving = ref(false);

async function onSave() {
  if (!templateName.value.trim()) return;

  saving.value = true;

  try {
    const now = new Date().toISOString();
    const template: ReportTemplate = {
      id: uuidv4(),
      name: templateName.value.trim(),
      report_type: props.reportType,
      parameters: { ...props.parameters },
      created_at: now,
      updated_at: now,
    };

    await db.reportTemplates.put(template);

    $q.notify({
      type: 'positive',
      message: t('reports.templates.saved'),
      icon: 'check_circle',
    });

    templateName.value = '';
    emit('saved');
    emit('update:modelValue', false);
  } catch (err) {
    console.error('[ReportTemplateDialog] Failed to save template:', err);
    $q.notify({
      type: 'negative',
      message: t('errors.generic'),
    });
  } finally {
    saving.value = false;
  }
}
</script>
