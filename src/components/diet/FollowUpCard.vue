<template>
  <q-card flat bordered class="q-mb-md follow-up-card">
    <q-card-section>
      <div class="row items-center q-mb-sm">
        <q-icon name="feedback" color="warning" size="24px" class="q-mr-sm" />
        <div class="text-subtitle1 text-weight-medium">{{ $t('followUp.title') }}</div>
      </div>
      <div class="text-body2 text-grey-7 q-mb-md">
        {{ $t('followUp.question') }}
      </div>

      <!-- Milk Change Selection -->
      <q-btn-toggle
        v-model="milkChange"
        spread
        no-caps
        unelevated
        toggle-color="primary"
        class="q-mb-md"
        :options="[
          { label: $t('followUp.increased'), value: 'increased', icon: 'trending_up' },
          { label: $t('followUp.same'), value: 'same', icon: 'trending_flat' },
          { label: $t('followUp.decreased'), value: 'decreased', icon: 'trending_down' },
        ]"
      />

      <!-- Milk Yield Input (optional) -->
      <q-input
        v-if="milkChange"
        v-model.number="milkYield"
        :label="$t('followUp.currentYield')"
        type="number"
        step="0.1"
        outlined
        dense
        class="q-mb-sm"
        :hint="$t('followUp.yieldHint')"
      >
        <template #append>
          <span class="text-caption text-grey-6">{{ $t('units.l') }}/{{ $t('followUp.day') }}</span>
        </template>
      </q-input>

      <!-- Feedback (optional) -->
      <q-input
        v-if="milkChange"
        v-model="feedback"
        :label="$t('followUp.feedback')"
        type="textarea"
        outlined
        dense
        rows="2"
        class="q-mb-sm"
      />

      <!-- Actions -->
      <div class="row q-gutter-sm q-mt-sm">
        <q-btn
          v-if="milkChange"
          :label="$t('followUp.submit')"
          color="primary"
          unelevated
          class="col"
          @click="onSubmit"
        />
        <q-btn
          :label="$t('followUp.later')"
          flat
          color="grey-7"
          :class="milkChange ? '' : 'col'"
          @click="onDismiss"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useFollowUpsStore } from 'src/stores/followUps';

const props = defineProps<{
  dietId: string;
}>();

const emit = defineEmits<{
  responded: [];
}>();

const { t } = useI18n();
const $q = useQuasar();
const followUpsStore = useFollowUpsStore();

const milkChange = ref<'increased' | 'same' | 'decreased' | null>(null);
const milkYield = ref<number | undefined>(undefined);
const feedback = ref('');

function onSubmit() {
  if (!milkChange.value) return;

  followUpsStore.submitFollowUp(
    props.dietId,
    milkChange.value,
    milkYield.value,
    feedback.value || undefined
  );

  $q.notify({
    type: 'positive',
    message: t('followUp.thankYou'),
    icon: 'check_circle',
  });

  emit('responded');
}

function onDismiss() {
  followUpsStore.dismissFollowUp(props.dietId);
  emit('responded');
}
</script>

<style scoped>
.follow-up-card {
  border-inline-start: 4px solid var(--q-warning);
}
</style>
