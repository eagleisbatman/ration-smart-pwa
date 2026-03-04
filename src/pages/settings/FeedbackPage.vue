<template>
  <q-page class="q-pa-md">
    <q-form @submit="onSubmit" greedy>
      <q-select
        v-model="form.feedback_type"
        :label="$t('feedback.type')"
        :options="feedbackTypes"
        emit-value
        map-options
        outlined
        dense
        behavior="menu"
        class="q-mb-md"
        :rules="[(v: string) => !!v || $t('validation.required')]"
      />

      <div class="text-body2 q-mb-xs">{{ $t('feedback.rating') }}</div>
      <q-rating
        v-model="form.overall_rating"
        size="2em"
        color="primary"
        icon="star_border"
        icon-selected="star"
        class="q-mb-md"
      />

      <q-input
        v-model="form.text_feedback"
        :label="$t('feedback.message')"
        type="textarea"
        outlined
        :rules="[(v: string) => v.length <= 1000 || $t('feedback.tooLong')]"
        class="q-mb-md"
      />

      <q-btn
        :label="$t('feedback.submit')"
        type="submit"
        color="primary"
        class="full-width submit-btn"
        size="lg"
        unelevated
        no-caps
        :loading="submitting"
      />
    </q-form>

    <!-- Success -->
    <q-dialog v-model="showSuccess">
      <q-card class="text-center q-pa-lg">
        <q-icon name="check_circle" size="48px" color="positive" />
        <div class="text-body1 q-mt-md">{{ $t('feedback.thankYou') }}</div>
        <q-btn flat color="primary" :label="$t('common.ok')" class="q-mt-md" v-close-popup @click="router.back()" />
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { api } from 'src/lib/api';
import { useQuasar } from 'quasar';

const { t } = useI18n();
const router = useRouter();
const $q = useQuasar();

const submitting = ref(false);
const showSuccess = ref(false);

const form = reactive({
  feedback_type: 'General',
  overall_rating: 0,
  text_feedback: '',
});

const feedbackTypes = computed(() => [
  { label: t('feedback.typeGeneral'), value: 'General' },
  { label: t('feedback.typeDefect'), value: 'Defect' },
  { label: t('feedback.typeFeature'), value: 'Feature Request' },
]);

async function onSubmit() {
  submitting.value = true;
  try {
    await api.post('/user-feedback/submit', {
      feedback_type: form.feedback_type,
      overall_rating: form.overall_rating > 0 ? form.overall_rating : null,
      text_feedback: form.text_feedback || null,
    });
    showSuccess.value = true;
  } catch {
    $q.notify({ type: 'negative', message: t('feedback.error') });
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
.submit-btn {
  border-radius: $radius-loose;
  font-size: 1.05rem;
  padding-top: 14px;
  padding-bottom: 14px;
}
</style>
