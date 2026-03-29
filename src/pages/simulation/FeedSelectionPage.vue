<template>
  <q-page class="q-pa-md">
    <!-- Top buttons row: Custom Diet Limits + Custom Feed -->
    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col-6">
        <q-btn
          outline
          no-caps
          color="primary"
          :label="$t('simulation.feedSelect.customLimits')"
          class="full-width top-btn"
          @click="showConstraints = true"
        />
      </div>
      <div class="col-6">
        <q-btn
          unelevated
          no-caps
          color="primary"
          :label="$t('simulation.feedSelect.customFeed')"
          class="full-width top-btn"
          @click="showCustomFeed = true"
        />
      </div>
    </div>

    <!-- Diet Mode Radio Toggle -->
    <div class="row items-center q-mb-md mode-toggle" role="radiogroup" :aria-label="$t('simulation.dietMode', 'Diet mode')">
      <q-radio
        v-model="dietMode"
        val="recommendation"
        :label="$t('simulation.feedSelect.dietRecommendation')"
        color="primary"
        class="col-6"
      />
      <q-radio
        v-model="dietMode"
        val="evaluation"
        :label="$t('simulation.feedSelect.dietEvaluation')"
        color="primary"
        class="col-6"
      />
    </div>

    <!-- Feed Cards -->
    <div v-for="(slot, idx) in feedSlots" :key="idx" class="feed-card q-mb-md">
      <div class="row items-center q-mb-sm">
        <div class="col text-subtitle2 text-weight-bold">FEED {{ idx + 1 }}</div>
        <q-btn v-if="!slot.isEditing" flat round dense icon="edit" size="sm" color="primary" @click="slot.isEditing = true" />
        <q-btn v-if="idx > 0" flat round dense icon="delete" size="sm" color="negative" @click="removeSlot(idx)" />
      </div>

      <!-- Feed Type -->
      <div class="row q-col-gutter-sm q-mb-sm">
        <div class="col-6">
          <q-select
            v-model="slot.feedType"
            :label="$t('simulation.feedSelect.feedTypeLabel') + ' *'"
            :options="feedTypeOptions"
            emit-value
            map-options
            outlined
            dense
            behavior="menu"
            @update:model-value="onFeedTypeChange(slot)"
          />
        </div>
        <div class="col-6">
          <q-select
            v-model="slot.feedCategory"
            :label="$t('simulation.feedSelect.feedCategoryLabel') + ' *'"
            :options="getCategoryOptions(slot.feedType)"
            emit-value
            map-options
            outlined
            dense
            behavior="menu"
            :disable="!slot.feedType"
            @update:model-value="onCategoryChange(slot)"
          />
        </div>
      </div>

      <!-- Feed + Price -->
      <div class="row q-col-gutter-sm q-mb-sm">
        <div class="col-6">
          <q-select
            v-model="slot.feedId"
            :label="$t('simulation.feedSelect.feedLabel') + ' *'"
            :options="getFeedOptions(slot.feedType, slot.feedCategory)"
            emit-value
            map-options
            outlined
            dense
            behavior="menu"
            :disable="!slot.feedCategory"
            @update:model-value="onFeedChange(slot)"
          />
        </div>
        <div class="col-6">
          <q-input
            v-model.number="slot.pricePerKg"
            :label="priceLabel + ' *'"
            type="number"
            outlined
            dense
            step="0.1"
          />
        </div>
      </div>

      <!-- Quantity + Cost (Evaluation mode only) -->
      <div v-if="dietMode === 'evaluation'" class="row q-col-gutter-sm">
        <div class="col-6">
          <q-input
            v-model.number="slot.quantity"
            :label="$t('simulation.feedSelect.quantityKg') + ' *'"
            type="number"
            outlined
            dense
            step="0.1"
          />
        </div>
        <div class="col-6">
          <q-input
            :model-value="slotCost(slot)"
            :label="$t('simulation.feedSelect.costLabel') + ' *'"
            type="number"
            outlined
            dense
            readonly
            class="readonly-cost"
          />
        </div>
      </div>
    </div>

    <!-- Add More Feed Button -->
    <div class="add-feed-btn q-mb-md" @click="addSlot">
      <q-icon name="add_circle_outline" size="sm" color="primary" class="q-mr-sm" />
      <span class="text-primary text-weight-medium">{{ $t('simulation.feedSelect.addMoreFeed') }}</span>
    </div>

    <!-- Forage Warning -->
    <q-banner v-if="noForageWarning" inline-actions class="bg-orange-1 text-orange-9 q-mb-md rounded-borders" rounded>
      <template #avatar>
        <q-icon name="eco" color="warning" />
      </template>
      {{ $t('simulation.feedSelect.noForageWarning') }}
    </q-banner>

    <!-- Action Button -->
    <div class="action-bar">
      <q-btn
        :label="dietMode === 'recommendation'
          ? $t('simulation.feedSelect.generateRecommendation')
          : $t('simulation.feedSelect.getEvaluation')"
        color="primary"
        class="full-width action-btn"
        unelevated
        no-caps
        icon-right="arrow_forward"
        :loading="simStore.recommending || simStore.evaluating"
        :disable="!isFormValid"
        @click="dietMode === 'recommendation' ? runRecommendation() : runEvaluation()"
      />
    </div>

    <!-- Loading Overlay -->
    <q-dialog v-model="showGenerating" persistent>
      <q-card class="text-center q-pa-lg" style="min-width: 280px" aria-live="polite">
        <q-spinner-gears size="48px" color="primary" />
        <div class="text-body1 q-mt-md">{{ $t('simulation.generating') }}</div>
        <div class="text-caption text-grey-6 q-mt-xs">{{ $t('simulation.generatingDesc') }}</div>
        <q-btn flat no-caps color="grey-7" :label="$t('common.cancel')" class="q-mt-md" @click="showGenerating = false" />
      </q-card>
    </q-dialog>

    <!-- Custom Constraints Dialog -->
    <CustomConstraintsDialog v-model="showConstraints" />

    <!-- Custom Feed Bottom Sheet -->
    <q-dialog v-model="showCustomFeed" position="bottom" maximized>
      <q-card class="custom-feed-sheet">
        <div class="sheet-handle" />
        <q-card-section>
          <div class="text-h6">{{ $t('simulation.feedSelect.addCustomFeed') }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <!-- FEED DETAILS -->
          <div class="row items-center q-mb-sm cursor-pointer" @click="cfDetailsOpen = !cfDetailsOpen">
            <div class="col text-subtitle2 text-weight-bold text-uppercase">{{ $t('simulation.feedSelect.feedDetails') }}</div>
            <q-icon :name="cfDetailsOpen ? 'remove' : 'add'" size="sm" />
          </div>
          <template v-if="cfDetailsOpen">
            <q-select
              v-model="customFeedForm.fd_type"
              :label="$t('simulation.feedSelect.feedTypeLabel') + ' *'"
              :options="feedTypeOptions"
              emit-value
              map-options
              outlined
              dense
              class="q-mb-sm"
              behavior="menu"
              @update:model-value="customFeedForm.fd_category = null"
            />
            <q-select
              v-model="customFeedForm.fd_category"
              :label="$t('simulation.feedSelect.feedCategoryLabel') + ' *'"
              :options="getCategoryOptions(customFeedForm.fd_type)"
              emit-value
              map-options
              outlined
              dense
              class="q-mb-sm"
              behavior="menu"
              :disable="!customFeedForm.fd_type"
            />
            <q-input
              v-model="customFeedForm.name"
              :label="$t('simulation.feedSelect.feedName')"
              outlined
              dense
              class="q-mb-sm"
              :prefix="'RAG - '"
            />
          </template>

          <!-- NUTRITIONAL INFORMATION -->
          <div class="row items-center q-mb-sm q-mt-md cursor-pointer" @click="cfNutrientOpen = !cfNutrientOpen">
            <div class="col text-subtitle2 text-weight-bold text-uppercase">{{ $t('simulation.feedSelect.nutritionalInfo') }}</div>
            <q-icon :name="cfNutrientOpen ? 'remove' : 'add'" size="sm" />
          </div>
          <template v-if="cfNutrientOpen">
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input v-model.number="customFeedForm.dm" label="Dry Matter" type="number" outlined dense class="q-mb-sm" />
              </div>
              <div class="col-6">
                <q-input v-model.number="customFeedForm.ash" label="Ash" type="number" outlined dense class="q-mb-sm" />
              </div>
              <div class="col-6">
                <q-input v-model.number="customFeedForm.protein" label="Protein" type="number" outlined dense class="q-mb-sm" />
              </div>
              <div v-if="customFeedForm.fd_type === 'Concentrate'" class="col-6">
                <q-input v-model.number="customFeedForm.npn" label="NPN" type="number" outlined dense class="q-mb-sm" />
              </div>
              <div class="col-6">
                <q-input v-model.number="customFeedForm.ee" label="Ether Extract" type="number" outlined dense class="q-mb-sm" />
              </div>
              <div class="col-6">
                <q-input v-model.number="customFeedForm.starch" label="Starch" type="number" outlined dense class="q-mb-sm" />
              </div>
              <div class="col-6">
                <q-input v-model.number="customFeedForm.ndf" label="NDF" type="number" outlined dense class="q-mb-sm" />
              </div>
              <div class="col-6">
                <q-input v-model.number="customFeedForm.adf" label="ADF" type="number" outlined dense class="q-mb-sm" />
              </div>
              <div class="col-6">
                <q-input v-model.number="customFeedForm.lignin" label="Lignin" type="number" outlined dense class="q-mb-sm" />
              </div>
              <div class="col-6">
                <q-input v-model.number="customFeedForm.ndin" label="NDIN" type="number" outlined dense class="q-mb-sm" />
              </div>
              <div class="col-6">
                <q-input v-model.number="customFeedForm.adin" label="ADIN" type="number" outlined dense class="q-mb-sm" />
              </div>
              <div class="col-6">
                <q-input v-model.number="customFeedForm.calcium" label="Calcium" type="number" outlined dense class="q-mb-sm" />
              </div>
              <div class="col-6">
                <q-input v-model.number="customFeedForm.phosphorus" label="Phosphorus" type="number" outlined dense class="q-mb-sm" />
              </div>
            </div>
          </template>
        </q-card-section>

        <q-card-actions class="q-px-md q-pb-md">
          <q-btn
            :label="$t('common.submit')"
            color="primary"
            class="full-width action-btn"
            unelevated
            no-caps
            :loading="customFeedSubmitting"
            :disable="!customFeedForm.fd_type || !customFeedForm.fd_category || !customFeedForm.name"
            @click="submitCustomFeed"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { useSimulationStore } from 'src/stores/simulation';
import { useFeedsStore } from 'src/stores/feeds';
import { useCurrency } from 'src/composables/useCurrency';
import { getFeedDisplayName, translateCategory } from 'src/composables/useFeedDisplayName';
import CustomConstraintsDialog from 'src/components/simulation/CustomConstraintsDialog.vue';

const { t, locale } = useI18n();
const router = useRouter();
const $q = useQuasar();
const simStore = useSimulationStore();
const feedsStore = useFeedsStore();
const { getCurrencyCode } = useCurrency();

const dietMode = ref<'recommendation' | 'evaluation'>('recommendation');
const showConstraints = ref(false);
const showCustomFeed = ref(false);
const showGenerating = ref(false);

// Custom feed form
const cfDetailsOpen = ref(true);
const cfNutrientOpen = ref(true);
const customFeedSubmitting = ref(false);
const customFeedForm = reactive({
  fd_type: null as string | null,
  fd_category: null as string | null,
  name: '',
  dm: 0, ash: 0, protein: 0, npn: 0, ee: 0, starch: 0,
  ndf: 0, adf: 0, lignin: 0, ndin: 0, adin: 0, calcium: 0, phosphorus: 0,
});

// Feed slot interface
interface FeedSlot {
  feedType: string | null;
  feedCategory: string | null;
  feedId: string | null;
  feedName: string;
  pricePerKg: number | null;
  quantity: number | null;
  isEditing: boolean;
}

function createEmptySlot(): FeedSlot {
  return {
    feedType: null,
    feedCategory: null,
    feedId: null,
    feedName: '',
    pricePerKg: null,
    quantity: null,
    isEditing: true,
  };
}

// Initialize slots from store's selected feeds or start with one empty slot
const feedSlots = ref<FeedSlot[]>([]);

function initSlotsFromStore() {
  if (simStore.selectedFeeds.length > 0) {
    feedSlots.value = simStore.selectedFeeds.map((sf) => ({
      feedType: sf.fd_type || null,
      feedCategory: sf.fd_category || null,
      feedId: sf.feed_id,
      feedName: sf.feed_name,
      pricePerKg: sf.price_per_kg || null,
      quantity: sf.quantity_as_fed || null,
      isEditing: false,
    }));
  } else {
    feedSlots.value = [createEmptySlot()];
  }
}

// Price label based on country currency
const priceLabel = computed(() => {
  const code = getCurrencyCode();
  return `Price ${code}/KG`;
});

// Feed Type options
const feedTypeOptions = [
  { label: 'Forage', value: 'Forage' },
  { label: 'Concentrate', value: 'Concentrate' },
];

// Category options filtered by feed type
function getCategoryOptions(feedType: string | null) {
  if (!feedType) return [];
  const feeds = feedsStore.allFeeds.filter((f) => f.fd_type === feedType);
  const cats = [...new Set(feeds.map((f) => f.category))].filter(Boolean).sort();
  return cats.map((c) => ({
    label: translateCategory(c, t),
    value: c,
  }));
}

// Feed options filtered by type + category
function getFeedOptions(feedType: string | null, feedCategory: string | null) {
  if (!feedType || !feedCategory) return [];
  return feedsStore.allFeeds
    .filter((f) => f.fd_type === feedType && f.category === feedCategory)
    .map((f) => ({
      label: getFeedDisplayName(f, locale.value),
      value: f.id,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// Cascade resets
function onFeedTypeChange(slot: FeedSlot) {
  slot.feedCategory = null;
  slot.feedId = null;
  slot.feedName = '';
}

function onCategoryChange(slot: FeedSlot) {
  slot.feedId = null;
  slot.feedName = '';
}

function onFeedChange(slot: FeedSlot) {
  if (!slot.feedId) return;
  const feed = feedsStore.allFeeds.find((f) => f.id === slot.feedId);
  if (feed) {
    slot.feedName = getFeedDisplayName(feed, locale.value);
    if (!slot.pricePerKg && feed.price_per_kg) {
      slot.pricePerKg = feed.price_per_kg;
    }
  }
}

function slotCost(slot: FeedSlot): number | null {
  if (slot.pricePerKg && slot.quantity) {
    return Math.round(slot.pricePerKg * slot.quantity * 100) / 100;
  }
  return null;
}

function addSlot() {
  feedSlots.value.push(createEmptySlot());
}

function removeSlot(idx: number) {
  feedSlots.value.splice(idx, 1);
}

// Sync slots to store before submission
function syncSlotsToStore() {
  simStore.selectedFeeds = feedSlots.value
    .filter((s) => s.feedId && s.pricePerKg)
    .map((s) => ({
      feed_id: s.feedId!,
      feed_name: s.feedName,
      fd_type: s.feedType || undefined,
      fd_category: s.feedCategory || undefined,
      price_per_kg: s.pricePerKg!,
      quantity_as_fed: s.quantity || undefined,
    }));
}

// Validation
const completedSlots = computed(() =>
  feedSlots.value.filter((s) => s.feedId && s.pricePerKg && s.pricePerKg > 0)
);

const noForageWarning = computed(() => {
  if (completedSlots.value.length === 0) return false;
  return completedSlots.value.every((s) => s.feedType !== 'Forage');
});

const isFormValid = computed(() => {
  if (completedSlots.value.length === 0) return false;
  if (dietMode.value === 'evaluation') {
    return completedSlots.value.every((s) => s.quantity && s.quantity > 0);
  }
  return true;
});

async function runRecommendation() {
  syncSlotsToStore();
  if (simStore.selectedFeeds.length === 0) {
    $q.notify({ type: 'warning', message: t('simulation.feedSelect.priceRequired') });
    return;
  }
  showGenerating.value = true;
  try {
    const ok = await simStore.generateRecommendation();
    if (ok) {
      router.push('/recommendation-report');
    } else if (simStore.error) {
      $q.notify({ type: 'negative', message: simStore.error });
    }
  } catch {
    $q.notify({ type: 'negative', message: t('errors.generic') });
  } finally {
    showGenerating.value = false;
  }
}

async function runEvaluation() {
  syncSlotsToStore();
  const missingQty = simStore.selectedFeeds.some(
    (f) => !f.quantity_as_fed || f.quantity_as_fed <= 0
  );
  if (missingQty) {
    $q.notify({ type: 'warning', message: t('simulation.feedSelect.quantityRequired') });
    return;
  }
  showGenerating.value = true;
  try {
    const ok = await simStore.generateEvaluation();
    if (ok) {
      router.push('/evaluation-report');
    } else if (simStore.error) {
      $q.notify({ type: 'negative', message: simStore.error });
    }
  } catch {
    $q.notify({ type: 'negative', message: t('errors.generic') });
  } finally {
    showGenerating.value = false;
  }
}

async function submitCustomFeed() {
  if (!customFeedForm.fd_type || !customFeedForm.fd_category || !customFeedForm.name) return;
  customFeedSubmitting.value = true;
  try {
    await feedsStore.createCustomFeed({
      name: `RAG - ${customFeedForm.name}`,
      fd_type: customFeedForm.fd_type,
      category: customFeedForm.fd_category,
      dm_percentage: customFeedForm.dm,
      cp_percentage: customFeedForm.protein,
      tdn_percentage: 0,
      ca_percentage: customFeedForm.calcium,
      p_percentage: customFeedForm.phosphorus,
      ndf_percentage: customFeedForm.ndf,
      fd_ash: customFeedForm.ash,
      fd_ee: customFeedForm.ee,
      fd_st: customFeedForm.starch,
      fd_adf: customFeedForm.adf,
      fd_lg: customFeedForm.lignin,
      fd_ndin: customFeedForm.ndin,
      fd_adin: customFeedForm.adin,
      fd_npn_cp: customFeedForm.npn,
    });
    $q.notify({ type: 'positive', message: t('simulation.feedSelect.customFeedCreated') });
    showCustomFeed.value = false;
    // Reset form
    Object.assign(customFeedForm, {
      fd_type: null, fd_category: null, name: '',
      dm: 0, ash: 0, protein: 0, npn: 0, ee: 0, starch: 0,
      ndf: 0, adf: 0, lignin: 0, ndin: 0, adin: 0, calcium: 0, phosphorus: 0,
    });
  } catch {
    $q.notify({ type: 'negative', message: t('errors.generic') });
  } finally {
    customFeedSubmitting.value = false;
  }
}

onMounted(() => {
  if (feedsStore.allFeeds.length === 0) {
    void feedsStore.fetchAllFeeds();
  }
  initSlotsFromStore();
});
</script>

<style lang="scss" scoped>
.top-btn {
  border-radius: $radius-loose;
  padding-top: 10px;
  padding-bottom: 10px;
}

.mode-toggle {
  background: rgba(0, 0, 0, 0.03);
  border-radius: $radius-loose;
  padding: 4px 8px;

  .body--dark & {
    background: rgba(255, 255, 255, 0.05);
  }
}

.feed-card {
  background: var(--q-card, #fff);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: $radius-loose;
  padding: 16px;

  .body--dark & {
    background: var(--q-dark-page, #1e1e1e);
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.add-feed-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--q-primary);
  border-radius: $radius-loose;
  padding: 14px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 128, 0, 0.04);
  }
}

.readonly-cost {
  :deep(.q-field__native) {
    background: rgba(0, 0, 0, 0.04);
  }
}

.action-bar {
  position: sticky;
  bottom: 0;
  background: var(--q-background, #fff);
  padding: 12px 0;
  margin-left: -16px;
  margin-right: -16px;
  padding-left: 16px;
  padding-right: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  z-index: 1;

  .body--dark & {
    background: var(--q-dark-page, #121212);
    border-top-color: rgba(255, 255, 255, 0.1);
  }
}

.action-btn {
  border-radius: $radius-loose;
  font-size: 1rem;
  padding-top: 14px;
  padding-bottom: 14px;
}

.custom-feed-sheet {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  max-height: 90vh;
  overflow-y: auto;
}

.sheet-handle {
  width: 40px;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
  margin: 8px auto;
}

.rounded-borders {
  border-radius: $radius-loose;
}
</style>
