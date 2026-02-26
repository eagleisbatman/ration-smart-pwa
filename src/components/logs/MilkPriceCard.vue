<template>
  <q-card flat bordered class="milk-price-card">
    <q-card-section class="q-py-sm q-px-md">
      <div class="row items-center no-wrap">
        <!-- Price Display / Edit -->
        <div class="col">
          <div class="row items-center q-gutter-x-sm">
            <q-icon name="payments" size="sm" color="primary" />
            <div v-if="!editing" class="row items-center q-gutter-x-xs">
              <span class="text-caption text-grey-7">{{ $t('logs.price.milkPrice') }}:</span>
              <span v-if="milkPrice !== null" class="text-body2 text-weight-medium">
                {{ formatCurrency(milkPrice) }}/{{ $t('units.l') }}
              </span>
              <span v-else class="text-caption text-grey-5 text-italic">
                {{ $t('logs.price.notSet') }}
              </span>
            </div>
            <div v-else class="row items-center q-gutter-x-xs col">
              <q-input
                ref="priceInputRef"
                v-model.number="editPriceValue"
                type="number"
                :label="$t('logs.price.milkPrice')"
                :suffix="'/' + $t('units.l')"
                :prefix="getCurrencySymbol()"
                dense
                outlined
                input-class="text-right"
                class="milk-price-input"
                @keyup.enter="savePrice"
                @keyup.escape="cancelEdit"
              />
              <q-btn
                icon="check"
                flat
                round
                dense
                size="sm"
                color="positive"
                @click="savePrice"
              />
              <q-btn
                icon="close"
                flat
                round
                dense
                size="sm"
                color="grey"
                @click="cancelEdit"
              />
            </div>
          </div>
        </div>

        <!-- Edit Button -->
        <div v-if="!editing" class="col-auto">
          <q-btn
            :icon="milkPrice !== null ? 'edit' : 'add'"
            flat
            round
            dense
            size="sm"
            color="grey-7"
            @click="startEdit"
          >
            <q-tooltip>
              {{ milkPrice !== null ? $t('logs.price.editPrice') : $t('logs.price.setPrice') }}
            </q-tooltip>
          </q-btn>
        </div>
      </div>

      <!-- Revenue Summary -->
      <div v-if="milkPrice !== null" class="row q-mt-xs q-gutter-x-md">
        <div class="text-caption">
          <span class="text-grey-6">{{ $t('logs.summary.today') }}:</span>
          <span class="text-primary text-weight-medium q-ml-xs">
            {{ formatCurrency(todayRevenue) }}
          </span>
        </div>
        <div class="text-caption">
          <span class="text-grey-6">{{ $t('logs.price.weeklyRevenue') }}:</span>
          <span class="text-primary text-weight-medium q-ml-xs">
            {{ formatCurrency(weeklyRevenue) }}
          </span>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useQuasar, QInput } from 'quasar';
import { useI18n } from 'vue-i18n';
import { useCurrency } from 'src/composables/useCurrency';
import { useSettingsStore } from 'src/stores/settings';

const props = defineProps<{
  todayLiters: number;
  weekLiters: number;
}>();

const $q = useQuasar();
const { t } = useI18n();
const { formatCurrency, getCurrencySymbol } = useCurrency();
const settingsStore = useSettingsStore();

const milkPrice = computed(() => settingsStore.milkPricePerLiter);
const editing = ref(false);
const editPriceValue = ref<number | null>(null);
const priceInputRef = ref<InstanceType<typeof QInput> | null>(null);

const todayRevenue = computed(() => {
  if (milkPrice.value === null) return 0;
  return props.todayLiters * milkPrice.value;
});

const weeklyRevenue = computed(() => {
  if (milkPrice.value === null) return 0;
  return props.weekLiters * milkPrice.value;
});

function startEdit(): void {
  editPriceValue.value = milkPrice.value;
  editing.value = true;
  nextTick(() => {
    priceInputRef.value?.focus();
  });
}

function cancelEdit(): void {
  editing.value = false;
  editPriceValue.value = null;
}

function savePrice(): void {
  if (editPriceValue.value === null || editPriceValue.value <= 0) {
    return;
  }

  settingsStore.saveMilkPrice(editPriceValue.value);

  editing.value = false;
  editPriceValue.value = null;

  $q.notify({
    message: t('logs.price.priceUpdated'),
    color: 'positive',
    icon: 'check_circle',
    timeout: 1500,
  });
}

// Expose milkPrice so parent can use it for per-log revenue
defineExpose({ milkPrice });
</script>

<style lang="scss" scoped>
.milk-price-card {
  border-radius: $radius-loose;
  background: $grey-1;

  // Dark mode override is in app.scss (scoped :global() compiles incorrectly)
}

.milk-price-input {
  min-width: 120px;
  max-width: 180px;
}
</style>
