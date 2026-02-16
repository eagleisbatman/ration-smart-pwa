<template>
  <q-page class="q-pa-md">
    <!-- Loading -->
    <template v-if="loading">
      <SkeletonCard />
    </template>

    <!-- Diet Details -->
    <template v-else-if="diet">
      <!-- Status Banner -->
      <q-banner
        v-if="diet.status !== 'completed'"
        :class="`bg-${getStatusColor(diet.status)} text-white q-mb-md`"
        rounded
      >
        <template #avatar>
          <q-icon :name="getStatusIcon(diet.status)" />
        </template>
        <template v-if="diet.status === 'processing'">
          {{ $t('diet.status.processing') }}
        </template>
        <template v-else-if="diet.status === 'failed'">
          {{ $t('diet.status.failed') }}
        </template>
        <template v-else>
          {{ $t('diet.status.waiting') }}
        </template>
        <template v-if="diet.status === 'failed'" #action>
          <q-btn
            flat
            color="white"
            :label="$t('diet.tryAgain')"
            icon="refresh"
            @click="regenerateDiet"
          />
        </template>
      </q-banner>

      <!-- Header -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row items-center">
            <div class="col">
              <div class="text-h6">{{ diet.cow_name || $t('diet.dietPlan') }}</div>
              <div class="text-caption text-grey-7">{{ formatDate(diet.created_at) }}</div>
            </div>
            <q-chip
              :color="diet.is_active ? 'positive' : getStatusColor(diet.status)"
              text-color="white"
            >
              <q-icon v-if="diet.is_active" name="favorite" size="14px" class="q-mr-xs" />
              {{ diet.is_active ? $t('diet.following') : getStatusLabel(diet.status) }}
            </q-chip>
          </div>
        </q-card-section>
      </q-card>

      <!-- Follow-Up Check-In (shown when diet is active and due) -->
      <FollowUpCard
        v-if="diet.is_active && hasPendingFollowUp"
        :diet-id="dietId"
        @responded="hasPendingFollowUp = false"
      />

      <!-- Diet Impact Analysis -->
      <DietImpactPanel
        v-if="['completed', 'following', 'saved'].includes(diet.status) && diet.cow_id"
        :diet-id="dietId"
        :cow-id="diet.cow_id"
      />

      <!-- Results (for completed/following/saved diets) -->
      <template v-if="['completed', 'following', 'saved'].includes(diet.status) && diet.result_data">
        <!-- Summary Stats -->
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-4">
            <q-card flat bordered class="text-center q-pa-sm">
              <div class="text-h6 text-primary">{{ formatCurrency(diet.total_cost ?? 0) }}</div>
              <div class="text-caption text-grey-7">{{ $t('diet.dailyCost') }}</div>
            </q-card>
          </div>
          <div class="col-4">
            <q-card flat bordered class="text-center q-pa-sm">
              <div class="text-h6 text-secondary">{{ diet.dm_intake?.toFixed(1) }}</div>
              <div class="text-caption text-grey-7">{{ $t('diet.dmKg') }}</div>
            </q-card>
          </div>
          <div class="col-4">
            <q-card flat bordered class="text-center q-pa-sm">
              <div class="text-h6 text-accent">{{ resultData.feeds?.length || 0 }}</div>
              <div class="text-caption text-grey-7">{{ $t('diet.feeds') }}</div>
            </q-card>
          </div>
        </div>

        <!-- Feed Breakdown (table format per wireframe) -->
        <div class="text-subtitle1 q-mb-sm">{{ $t('diet.recommendedFeeds') }}</div>
        <q-card flat bordered class="q-mb-md chart-scroll-wrapper">
          <q-markup-table flat bordered dense class="text-left">
            <thead>
              <tr class="bg-grey-2">
                <th>{{ $t('diet.ingredient') }}</th>
                <th class="text-right">{{ $t('diet.quantity') }} ({{ $t('diet.kg') }})</th>
                <th class="text-right">{{ $t('diet.cost') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="feed in resultData.feeds" :key="feed.feed_id">
                <td>{{ feed.feed_name }}</td>
                <td class="text-right">{{ feed.amount_kg?.toFixed(2) }}</td>
                <td class="text-right">{{ formatCurrency(feed.cost ?? 0) }}</td>
              </tr>
              <tr class="bg-grey-1 text-weight-bold">
                <td>{{ $t('chart.total') }}</td>
                <td class="text-right">{{ feedTotalKg.toFixed(2) }}</td>
                <td class="text-right">{{ formatCurrency(diet.total_cost ?? 0) }}</td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card>

        <!-- Nutrient Balance -->
        <div class="text-subtitle1 q-mb-sm">{{ $t('diet.nutrientBalance') }}</div>
        <q-card flat bordered class="q-mb-md">
          <q-card-section>
            <div class="q-mb-md">
              <div class="row justify-between q-mb-xs">
                <span>{{ $t('diet.crudeProteinCP') }}</span>
                <span>{{ resultData.nutrient_balance?.cp_supplied?.toFixed(0) }} / {{ resultData.nutrient_balance?.cp_requirement?.toFixed(0) }}{{ $t('diet.g') }}</span>
              </div>
              <q-linear-progress
                :value="cpProgress"
                :color="cpProgress >= 1 ? 'positive' : 'warning'"
                rounded
              />
            </div>

            <div class="q-mb-md">
              <div class="row justify-between q-mb-xs">
                <span>{{ $t('diet.totalDigestibleNutrients') }}</span>
                <span>{{ resultData.nutrient_balance?.tdn_supplied?.toFixed(0) }} / {{ resultData.nutrient_balance?.tdn_requirement?.toFixed(0) }}{{ $t('diet.g') }}</span>
              </div>
              <q-linear-progress
                :value="tdnProgress"
                :color="tdnProgress >= 1 ? 'positive' : 'warning'"
                rounded
              />
            </div>

            <div>
              <div class="row justify-between q-mb-xs">
                <span>{{ $t('diet.dryMatterDM') }}</span>
                <span>{{ resultData.nutrient_balance?.dm_supplied?.toFixed(2) }} / {{ resultData.nutrient_balance?.dm_requirement?.toFixed(2) }}{{ $t('diet.kg') }}</span>
              </div>
              <q-linear-progress
                :value="dmProgress"
                :color="dmProgress >= 0.95 && dmProgress <= 1.05 ? 'positive' : 'warning'"
                rounded
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- Recommendations -->
        <template v-if="resultData.recommendations?.length">
          <div class="text-subtitle1 q-mb-sm">{{ $t('diet.recommendations') }}</div>
          <q-card flat bordered class="q-mb-md">
            <q-list>
              <q-item v-for="(rec, i) in resultData.recommendations" :key="i">
                <q-item-section avatar>
                  <q-icon name="lightbulb" color="warning" />
                </q-item-section>
                <q-item-section>{{ rec }}</q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </template>

        <!-- Warnings -->
        <template v-if="resultData.warnings?.length">
          <div class="text-subtitle1 q-mb-sm">{{ $t('diet.warnings') }}</div>
          <q-card flat bordered class="bg-negative-light">
            <q-list>
              <q-item v-for="(warn, i) in resultData.warnings" :key="i">
                <q-item-section avatar>
                  <q-icon name="warning" color="negative" />
                </q-item-section>
                <q-item-section class="text-negative">{{ warn }}</q-item-section>
              </q-item>
            </q-list>
          </q-card>
        </template>
      </template>

      <!-- Actions -->
      <div class="row q-col-gutter-sm q-mt-md">
        <div class="col-12 col-sm-6">
          <q-btn
            v-if="['completed', 'following', 'saved'].includes(diet.status)"
            :label="$t('diet.optimizeAgain')"
            icon="refresh"
            color="secondary"
            class="full-width"
            unelevated
            @click="regenerateDiet"
          />
          <q-btn
            v-else
            :label="$t('diet.newDiet')"
            icon="add"
            color="primary"
            class="full-width"
            unelevated
            @click="router.push('/diet/new')"
          />
        </div>
        <div class="col-12 col-sm-6">
          <q-btn
            :label="$t('diet.delete')"
            icon="delete"
            color="negative"
            flat
            class="full-width"
            @click="confirmDelete"
          />
        </div>
      </div>

      <!-- Follow / Stop Following Button -->
      <div v-if="diet.status === 'completed' || diet.status === 'following' || diet.status === 'saved'" class="q-mt-md">
        <q-btn
          v-if="!diet.is_active"
          :label="$t('diet.startFollowing')"
          icon="favorite_border"
          color="positive"
          class="full-width"
          unelevated
          :loading="dietsStore.loading"
          @click="handleFollowDiet"
        />
        <q-btn
          v-else
          :label="$t('diet.stopFollowing')"
          icon="favorite"
          color="negative"
          flat
          class="full-width"
          :loading="dietsStore.loading"
          @click="handleStopFollowing"
        />
      </div>

      <!-- Reminder Button (only for followed diets) -->
      <div v-if="diet.is_active" class="q-mt-sm">
        <q-btn
          flat
          icon="alarm"
          :label="$t('diet.reminder.setReminder')"
          color="primary"
          class="full-width"
          @click="showReminderDialog = true"
        >
          <q-badge v-if="reminderActive" color="positive" floating rounded>
            <q-icon name="check" size="10px" />
          </q-badge>
        </q-btn>
        <div v-if="reminderActive" class="text-caption text-positive text-center q-mt-xs">
          {{ $t('diet.reminder.active') }}
        </div>
      </div>

      <!-- Compare Button -->
      <div v-if="['completed', 'following', 'saved'].includes(diet.status)" class="q-mt-sm">
        <q-btn
          flat
          icon="compare_arrows"
          :label="$t('diet.compare')"
          color="primary"
          class="full-width"
          @click="router.push({ name: 'diet-compare', query: { diet1: dietId } })"
        />
      </div>
    </template>

    <!-- Not Found -->
    <template v-else>
      <EmptyState
        icon="error_outline"
        icon-color="negative"
        :title="$t('diet.dietNotFound')"
        :description="$t('diet.dietNotFoundDesc')"
        :action-label="$t('diet.goBack')"
        @action="router.back()"
      />
    </template>

    <!-- Share FAB - visible for completed/following/saved diets -->
    <q-page-sticky
      v-if="diet && ['completed', 'following', 'saved'].includes(diet.status) && diet.result_data"
      position="bottom-right"
      :offset="[18, 18]"
    >
      <q-btn
        fab
        icon="share"
        color="primary"
        :aria-label="$t('export.share')"
        @click="showShareSheet = true"
      />
    </q-page-sticky>

    <!-- Share Bottom Sheet -->
    <q-dialog v-model="showShareSheet" position="bottom">
      <q-card class="dialog-card">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ $t('export.shareOptions') }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-list padding>
          <q-item clickable v-close-popup @click="handleShare">
            <q-item-section avatar>
              <q-icon name="share" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('export.shareDiet') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-close-popup @click="handleWhatsApp">
            <q-item-section avatar>
              <q-icon name="send" color="green" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('export.whatsApp') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-close-popup @click="handlePrint">
            <q-item-section avatar>
              <q-icon name="print" color="grey-8" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('export.print') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-close-popup @click="handleCopy">
            <q-item-section avatar>
              <q-icon name="content_copy" color="grey-8" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ $t('export.copySummary') }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-dialog>

    <!-- Diet Reminder Dialog -->
    <DietReminderDialog
      v-if="diet"
      v-model="showReminderDialog"
      :diet-id="dietId"
      :diet-title="diet.cow_name || $t('diet.dietPlan')"
      :cow-name="diet.cow_name"
      @saved="onReminderSaved"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { format } from 'date-fns';
import { useDietsStore } from 'src/stores/diets';
import { Diet } from 'src/lib/offline/db';
import SkeletonCard from 'src/components/ui/SkeletonCard.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';
import DietReminderDialog from 'src/components/diet/DietReminderDialog.vue';
import FollowUpCard from 'src/components/diet/FollowUpCard.vue';
import DietImpactPanel from 'src/components/diet/DietImpactPanel.vue';
import { useFollowUpsStore } from 'src/stores/followUps';
import { useCurrency } from 'src/composables/useCurrency';
import { useExport, DietExportData } from 'src/composables/useExport';
import { hasActiveReminder } from 'src/lib/diet-reminders';

const { t } = useI18n();
const { formatCurrency } = useCurrency();
const { formatDietText, shareContent, shareViaWhatsApp, copyToClipboard, printDiet } = useExport();

// Type for diet result data
interface DietResultFeed {
  feed_id: string;
  feed_name: string;
  amount_kg: number;
  cost: number;
  dm_contribution: number;
  cp_contribution: number;
}

interface NutrientBalance {
  cp_supplied: number;
  cp_requirement: number;
  tdn_supplied: number;
  tdn_requirement: number;
  dm_supplied: number;
  dm_requirement: number;
}

interface DietResultData {
  feeds?: DietResultFeed[];
  nutrient_balance?: NutrientBalance;
  recommendations?: string[];
  warnings?: string[];
}

const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const dietsStore = useDietsStore();
const followUpsStore = useFollowUpsStore();

const dietId = computed(() => route.params.id as string);
const hasPendingFollowUp = ref(false);
const diet = ref<Diet | null>(null);
const loading = ref(true);

const resultData = computed<DietResultData>(() => (diet.value?.result_data as DietResultData) || {});

const feedTotalKg = computed(() =>
  (resultData.value.feeds || []).reduce((sum, f) => sum + (f.amount_kg || 0), 0)
);

const cpProgress = computed(() => {
  const nb = resultData.value.nutrient_balance;
  if (!nb) return 0;
  return nb.cp_requirement ? nb.cp_supplied / nb.cp_requirement : 0;
});

const tdnProgress = computed(() => {
  const nb = resultData.value.nutrient_balance;
  if (!nb) return 0;
  return nb.tdn_requirement ? nb.tdn_supplied / nb.tdn_requirement : 0;
});

const dmProgress = computed(() => {
  const nb = resultData.value.nutrient_balance;
  if (!nb) return 0;
  return nb.dm_requirement ? nb.dm_supplied / nb.dm_requirement : 0;
});

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMMM d, yyyy h:mm a');
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    completed: t('diet.statusLabel.completed'),
    processing: t('diet.statusLabel.processing'),
    failed: t('diet.statusLabel.failed'),
    following: t('diet.following'),
    archived: t('diet.stopped'),
    saved: t('diet.statusLabel.completed'),
  };
  return labels[status] || t('diet.statusLabel.pending');
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
    case 'saved':
      return 'positive';
    case 'following':
      return 'positive';
    case 'archived':
      return 'grey-6';
    case 'processing':
      return 'info';
    case 'failed':
      return 'negative';
    default:
      return 'warning';
  }
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'completed':
    case 'saved':
      return 'check_circle';
    case 'following':
      return 'favorite';
    case 'archived':
      return 'archive';
    case 'processing':
      return 'hourglass_empty';
    case 'failed':
      return 'error';
    default:
      return 'schedule';
  }
}

// --- Reminder ---
const showReminderDialog = ref(false);
const reminderActive = ref(false);

function refreshReminderStatus(): void {
  reminderActive.value = hasActiveReminder(dietId.value);
}

function onReminderSaved(): void {
  refreshReminderStatus();
}

// --- Share / Export ---
const showShareSheet = ref(false);

function buildExportData(): DietExportData {
  const d = diet.value!;
  const rd = resultData.value;
  const goalLabels: Record<string, string> = {
    minimize_cost: t('diet.goals.minimizeCost'),
    maximize_milk: t('diet.goals.maximizeMilk'),
    balanced: t('diet.goals.balanced'),
  };
  return {
    cowName: d.cow_name || t('diet.dietPlan'),
    date: formatDate(d.created_at),
    goal: goalLabels[d.optimization_goal] || d.optimization_goal,
    feeds: (rd.feeds || []).map((f) => ({
      name: f.feed_name,
      amount: Number(f.amount_kg?.toFixed(2) ?? 0),
      cost: formatCurrency(f.cost ?? 0),
    })),
    totalCost: formatCurrency(d.total_cost ?? 0),
    dmIntake: Number(d.dm_intake?.toFixed(1) ?? 0),
    status: d.status,
  };
}

function handleShare() {
  const exportData = buildExportData();
  const text = formatDietText(exportData);
  shareContent(t('export.shareDiet'), text);
}

function handleWhatsApp() {
  const exportData = buildExportData();
  const text = formatDietText(exportData);
  shareViaWhatsApp(text);
}

function handlePrint() {
  const exportData = buildExportData();
  printDiet(exportData);
}

async function handleCopy() {
  const exportData = buildExportData();
  const text = formatDietText(exportData);
  const success = await copyToClipboard(text);
  if (success) {
    $q.notify({ type: 'positive', message: t('export.copied') });
  }
}

async function handleFollowDiet() {
  const success = await dietsStore.followDiet(dietId.value);
  if (success) {
    diet.value = await dietsStore.getDiet(dietId.value);
    $q.notify({ type: 'positive', message: t('diet.followSuccess') });
  }
}

async function handleStopFollowing() {
  $q.dialog({
    title: t('diet.stopFollowing'),
    message: t('diet.stopFollowingConfirm'),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const success = await dietsStore.stopFollowingDiet(dietId.value);
    if (success) {
      diet.value = await dietsStore.getDiet(dietId.value);
      $q.notify({ type: 'info', message: t('diet.stopped') });
    }
  });
}

function regenerateDiet() {
  router.push({ path: '/diet/new', query: { regenerateFrom: dietId.value } });
}

function confirmDelete() {
  $q.dialog({
    title: t('diet.deleteDietPlan'),
    message: t('diet.deleteConfirm'),
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    const success = await dietsStore.deleteDiet(dietId.value);
    if (success) {
      $q.notify({ type: 'positive', message: t('diet.dietDeleted') });
      router.push('/diet');
    }
  });
}

onMounted(async () => {
  loading.value = true;
  diet.value = await dietsStore.getDiet(dietId.value);
  loading.value = false;
  refreshReminderStatus();

  // Check for pending follow-ups
  await followUpsStore.checkPendingFollowUps();
  hasPendingFollowUp.value = !!followUpsStore.getPendingForDiet(dietId.value);
});
</script>

<style lang="scss" scoped>
.bg-negative-light {
  background-color: rgba($negative, 0.1);
}
</style>
