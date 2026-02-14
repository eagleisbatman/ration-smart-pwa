<template>
  <div class="text-center q-mb-lg">
    <div class="photo-container q-mx-auto" @click="showOptions = true">
      <q-img
        v-if="modelValue"
        :src="modelValue"
        :ratio="1"
        class="rounded-borders photo-avatar"
      />
      <q-avatar v-else size="120px" color="grey-2" class="photo-placeholder">
        <q-icon name="photo_camera" size="40px" color="grey-6" />
      </q-avatar>
      <q-btn
        v-if="modelValue"
        round
        flat
        dense
        size="sm"
        icon="close"
        class="photo-remove-btn"
        @click.stop="onRemove"
      />
    </div>
    <div class="text-caption text-grey-6 q-mt-xs">{{ $t('common.tapToAddPhoto') }}</div>
  </div>

  <!-- Photo Options Dialog -->
  <q-dialog v-model="showOptions" position="bottom">
    <q-card class="dialog-card">
      <q-list>
        <q-item clickable v-close-popup @click="onTakePhoto">
          <q-item-section avatar><q-icon name="photo_camera" /></q-item-section>
          <q-item-section>{{ $t('common.takePhoto') }}</q-item-section>
        </q-item>
        <q-item clickable v-close-popup @click="onChooseFromGallery">
          <q-item-section avatar><q-icon name="photo_library" /></q-item-section>
          <q-item-section>{{ $t('common.chooseFromGallery') }}</q-item-section>
        </q-item>
        <q-item v-if="modelValue" clickable v-close-popup @click="onRemove">
          <q-item-section avatar><q-icon name="delete" color="negative" /></q-item-section>
          <q-item-section class="text-negative">{{ $t('common.removePhoto') }}</q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useImageUpload } from 'src/composables/useImageUpload';

defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string | undefined];
}>();

const showOptions = ref(false);
const { captureFromCamera, selectFromGallery, clearImage } = useImageUpload();

async function onTakePhoto() {
  const result = await captureFromCamera();
  if (result) {
    emit('update:modelValue', result);
  }
}

async function onChooseFromGallery() {
  const result = await selectFromGallery();
  if (result) {
    emit('update:modelValue', result);
  }
}

function onRemove() {
  emit('update:modelValue', undefined);
  clearImage();
}
</script>

<style lang="scss" scoped>
.photo-container {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.photo-placeholder {
  border: 2px dashed rgba(0, 0, 0, 0.15);
}

.photo-remove-btn {
  position: absolute;
  top: -4px;
  right: -4px;
  background: rgba(255, 255, 255, 0.9);
  z-index: 1;
}
</style>
