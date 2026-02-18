<template>
  <q-page class="q-pa-md">
    <!-- Loading -->
    <template v-if="loading">
      <SkeletonCard />
    </template>

    <!-- Diet Details -->
    <template v-else-if="diet">
      <!-- Status Banner (non-failed statuses) -->
      <q-banner
        v-if="showBanner && !['completed', 'saved', 'following', 'failed'].includes(diet.status)"
        :class="`bg-${getStatusColor(diet.status)} text-white q-mb-md`"
        rounded
      >
        <template #avatar>
          <q-icon :name="getStatusIcon(diet.status)" />
        </template>
        <template v-if="diet.status === 'processing'">
          {{ $t('diet.status.processing') }}
        </template>
        <template v-else>
          {{ $t('diet.status.waiting') }}
        </template>
        <template #action>
          <q-btn flat round dense icon="close" color="white" @click="showBanner = false" />
        </template>
      </q-banner>

      <!-- Detailed Failure Card -->
      <q-card v-if="diet.status === 'failed'" flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row items-center q-mb-sm">
            <q-icon name="error" color="negative" size="28px" class="q-mr-sm" />
            <div class="text-h6 text-negative">{{ $t('diet.failedTitle') }}</div>
          </div>

          <div v-if="dietStatusSummary" class="text-body2 q-mb-md">
            {{ dietStatusSummary }}
          </div>

          <q-list v-if="dietStatusMessages.length > 0" dense class="q-mb-md">
            <q-item v-for="(msg, i) in dietStatusMessages" :key="i" dense>
              <q-item-section avatar>
                <q-icon name="warning_amber" color="warning" size="20px" />
              </q-item-section>
              <q-item-section class="text-body2">{{ msg }}</q-item-section>
            </q-item>
          </q-list>

          <div v-if="dietStatusMessages.length === 0" class="text-body2 text-grey-7 q-mb-md">
            {{ $t('diet.failedGenericAdvice') }}
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="left">
          <q-btn
            flat
            color="primary"
            icon="refresh"
            :label="$t('diet.tryDifferentFeeds')"
            @click="regenerateDiet"
          />
          <q-btn
            flat
            color="primary"
            icon="auto_fix_high"
            :label="$t('diet.tryAutoFeeds')"
            @click="regenerateWithAutoFeeds"
          />
        </q-card-actions>
      </q-card>

      <!-- Header -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row items-center">
            <div class="col">
              <div v-if="editingName" class="row items-center no-wrap">
                <q-input
                  v-model="editNameValue"
                  dense
                  outlined
                  autofocus
                  class="col"
                  @keyup.enter="saveEditedName"
                  @blur="saveEditedName"
                />
                <q-btn flat dense icon="check" size="sm" class="q-ml-xs" @click="saveEditedName" />
                <q-btn flat dense icon="close" size="sm" @click="cancelEditName" />
              </div>
              <div v-else class="text-h6 cursor-pointer" @click="startEditName">
                {{ diet.name || diet.cow_name || $t('diet.dietPlan') }}
                <q-icon name="edit" size="16px" class="q-ml-xs text-grey-5" />
              </div>
              <div v-if="diet.farmer_name" class="text-caption text-grey-6">
                {{ $t('diet.forFarmer', { name: diet.farmer_name }) }}
              </div>
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

      <!-- Diet Impact Analysis (only when actively following this diet) -->
      <DietImpactPanel
        v-if="diet.is_active && diet.cow_id"
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
              <div class="text-h6 text-secondary">{{ diet.dm_intake?.toFixed(1) }} kg</div>
              <div class="text-caption text-grey-7">{{ $t('diet.dryMatterIntake') }}</div>
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
                <th class="text-right">{{ $t('diet.quantity') }} (kg/day)</th>
                <th class="text-right">{{ $t('diet.cost') }} /day</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(feed, idx) in resultData.feeds" :key="idx">
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
                <span>{{ $t('diet.dryMatterIntake') }}</span>
                <span>{{ (resultData.nutrient_balance?.dm_supplied ?? 0).toFixed(2) }} / {{ (resultData.nutrient_balance?.dm_requirement ?? 0).toFixed(2) }} kg/day</span>
              </div>
              <q-linear-progress
                :value="dmProgress"
                :color="dmProgress >= 0.95 && dmProgress <= 1.05 ? 'positive' : 'warning'"
                rounded
              />
            </div>

            <div class="q-mb-md">
              <div class="row justify-between q-mb-xs">
                <span>{{ $t('diet.metabolizableProtein') }}</span>
                <span>{{ ((resultData.nutrient_balance?.mp_supplied || resultData.nutrient_balance?.cp_supplied || 0) * 1000).toFixed(0) }} / {{ ((resultData.nutrient_balance?.mp_requirement || resultData.nutrient_balance?.cp_requirement || 0) * 1000).toFixed(0) }} g/day</span>
              </div>
              <q-linear-progress
                :value="mpProgress"
                :color="mpProgress >= 0.95 ? 'positive' : 'warning'"
                rounded
              />
            </div>

            <div class="q-mb-md">
              <div class="row justify-between q-mb-xs">
                <span>{{ $t('diet.netEnergyLactation') }}</span>
                <span>{{ (resultData.nutrient_balance?.nel_supplied || resultData.nutrient_balance?.tdn_supplied || 0).toFixed(2) }} / {{ (resultData.nutrient_balance?.nel_requirement || resultData.nutrient_balance?.tdn_requirement || 0).toFixed(2) }} Mcal/day</span>
              </div>
              <q-linear-progress
                :value="nelProgress"
                :color="nelProgress >= 0.95 ? 'positive' : 'warning'"
                rounded
              />
            </div>

            <div v-if="resultData.nutrient_balance?.ca_requirement" class="q-mb-md">
              <div class="row justify-between q-mb-xs">
                <span>{{ $t('diet.calcium') }}</span>
                <span>{{ ((resultData.nutrient_balance?.ca_supplied ?? 0) * 1000).toFixed(0) }} / {{ ((resultData.nutrient_balance?.ca_requirement ?? 0) * 1000).toFixed(0) }} g/day</span>
              </div>
              <q-linear-progress
                :value="resultData.nutrient_balance.ca_requirement ? resultData.nutrient_balance.ca_supplied / resultData.nutrient_balance.ca_requirement : 0"
                :color="(resultData.nutrient_balance.ca_supplied / resultData.nutrient_balance.ca_requirement) >= 0.95 ? 'positive' : 'warning'"
                rounded
              />
            </div>

            <div v-if="resultData.nutrient_balance?.p_requirement">
              <div class="row justify-between q-mb-xs">
                <span>{{ $t('diet.phosphorus') }}</span>
                <span>{{ ((resultData.nutrient_balance?.p_supplied ?? 0) * 1000).toFixed(0) }} / {{ ((resultData.nutrient_balance?.p_requirement ?? 0) * 1000).toFixed(0) }} g/day</span>
              </div>
              <q-linear-progress
                :value="resultData.nutrient_balance.p_requirement ? resultData.nutrient_balance.p_supplied / resultData.nutrient_balance.p_requirement : 0"
                :color="(resultData.nutrient_balance.p_supplied / resultData.nutrient_balance.p_requirement) >= 0.95 ? 'positive' : 'warning'"
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

      <!-- Save Diet (only for locally-created, not yet saved diets) -->
      <div v-if="diet.status === 'completed' && !diet._synced" class="q-mt-md">
        <q-btn
          :label="$t('diet.saveDiet')"
          icon="save"
          color="primary"
          class="full-width"
          unelevated
          size="lg"
          :loading="dietsStore.loading"
          @click="handleSaveDiet"
        />
        <div class="text-caption text-grey-7 text-center q-mt-xs">
          {{ $t('diet.saveHint') }}
        </div>
      </div>

      <!-- Actions row -->
      <div class="row q-col-gutter-sm q-mt-md">
        <div class="col-12 col-sm-6">
          <q-btn
            v-if="['completed', 'following', 'saved', 'archived'].includes(diet.status)"
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

      <!-- Follow / Stop Following (only for saved/backend-persisted diets) -->
      <div v-if="diet._synced && ['saved', 'following', 'archived'].includes(diet.status)" class="q-mt-md">
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
import { ref, computed, watch, onMounted } from 'vue';
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
  feed_name: string;
  amount_kg: number;
  cost: number;
  price_per_kg?: number;
}

interface NutrientBalance {
  mp_supplied: number;
  mp_requirement: number;
  nel_supplied: number;
  nel_requirement: number;
  dm_supplied: number;
  dm_requirement: number;
  ca_supplied: number;
  ca_requirement: number;
  p_supplied: number;
  p_requirement: number;
  // Legacy keys (may still exist in older cached data)
  cp_supplied?: number;
  cp_requirement?: number;
  tdn_supplied?: number;
  tdn_requirement?: number;
}

interface DietResultData {
  feeds?: DietResultFeed[];
  nutrient_balance?: NutrientBalance;
  recommendations?: string[];
  warnings?: string[];
  diet_status?: {
    is_valid?: boolean;
    status_classification?: string;
    summary?: string;
    formatted_messages?: string[];
  };
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
const showBanner = ref(true);

const resultData = computed<DietResultData>(() => (diet.value?.result_data as DietResultData) || {});

const feedTotalKg = computed(() =>
  (resultData.value.feeds || []).reduce((sum, f) => sum + (f.amount_kg || 0), 0)
);

const mpProgress = computed(() => {
  const nb = resultData.value.nutrient_balance;
  if (!nb) return 0;
  const req = nb.mp_requirement || nb.cp_requirement || 0;
  const sup = nb.mp_supplied || nb.cp_supplied || 0;
  return req ? sup / req : 0;
});

const nelProgress = computed(() => {
  const nb = resultData.value.nutrient_balance;
  if (!nb) return 0;
  const req = nb.nel_requirement || nb.tdn_requirement || 0;
  const sup = nb.nel_supplied || nb.tdn_supplied || 0;
  return req ? sup / req : 0;
});

const dmProgress = computed(() => {
  const nb = resultData.value.nutrient_balance;
  if (!nb) return 0;
  return nb.dm_requirement ? nb.dm_supplied / nb.dm_requirement : 0;
});

// --- Failure detail computeds ---
const dietStatusSummary = computed(() =>
  resultData.value.diet_status?.summary || ''
);

const dietStatusMessages = computed<string[]>(() =>
  resultData.value.diet_status?.formatted_messages || []
);

function regenerateWithAutoFeeds() {
  const cowId = diet.value?.cow_id;
  const query: Record<string, string> = { autoFeeds: 'true' };
  if (cowId) query.cow_id = cowId;
  router.push({ path: '/diet/new', query });
}

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

// --- Name Editing ---
const editingName = ref(false);
const editNameValue = ref('');

function startEditName() {
  editNameValue.value = diet.value?.name || diet.value?.cow_name || '';
  editingName.value = true;
}

function cancelEditName() {
  editingName.value = false;
}

async function saveEditedName() {
  if (!editingName.value) return;
  editingName.value = false;
  const newName = editNameValue.value.trim();
  if (!newName || !diet.value) return;
  if (newName === diet.value.name) return;

  const success = await dietsStore.updateDietName(dietId.value, newName);
  if (success) {
    diet.value = { ...diet.value, name: newName };
    $q.notify({ type: 'positive', message: t('diet.nameUpdated') });
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
  const nb = rd.nutrient_balance;
  const goalLabels: Record<string, string> = {
    minimize_cost: t('diet.goals.minimizeCost'),
    maximize_milk: t('diet.goals.maximizeMilk'),
    balanced: t('diet.goals.balanced'),
  };

  // Build nutrient rows for export
  const nutrients: Array<{ label: string; supplied: string; requirement: string; unit: string }> = [];
  if (nb) {
    if (nb.dm_supplied || nb.dm_requirement) {
      nutrients.push({ label: 'Dry Matter Intake', supplied: (nb.dm_supplied ?? 0).toFixed(2), requirement: (nb.dm_requirement ?? 0).toFixed(2), unit: 'kg/day' });
    }
    const mpSup = nb.mp_supplied || nb.cp_supplied || 0;
    const mpReq = nb.mp_requirement || nb.cp_requirement || 0;
    if (mpSup || mpReq) {
      nutrients.push({ label: 'Metabolizable Protein', supplied: (mpSup * 1000).toFixed(0), requirement: (mpReq * 1000).toFixed(0), unit: 'g/day' });
    }
    const nelSup = nb.nel_supplied || nb.tdn_supplied || 0;
    const nelReq = nb.nel_requirement || nb.tdn_requirement || 0;
    if (nelSup || nelReq) {
      nutrients.push({ label: 'Net Energy Lactation', supplied: nelSup.toFixed(2), requirement: nelReq.toFixed(2), unit: 'Mcal/day' });
    }
    if (nb.ca_supplied || nb.ca_requirement) {
      nutrients.push({ label: 'Calcium', supplied: ((nb.ca_supplied ?? 0) * 1000).toFixed(0), requirement: ((nb.ca_requirement ?? 0) * 1000).toFixed(0), unit: 'g/day' });
    }
    if (nb.p_supplied || nb.p_requirement) {
      nutrients.push({ label: 'Phosphorus', supplied: ((nb.p_supplied ?? 0) * 1000).toFixed(0), requirement: ((nb.p_requirement ?? 0) * 1000).toFixed(0), unit: 'g/day' });
    }
  }

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
    nutrients,
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

async function handleSaveDiet() {
  const newId = await dietsStore.saveDiet(dietId.value);
  if (newId) {
    $q.notify({ type: 'positive', message: t('diet.dietSaved') });
    if (newId !== dietId.value) {
      // Navigate to new backend ID — watcher will reload diet
      router.replace(`/diet/${newId}`);
    } else {
      // Same ID — reload explicitly since watcher won't fire
      diet.value = await dietsStore.getDiet(newId);
    }
  } else if (dietsStore.error) {
    $q.notify({ type: 'negative', message: dietsStore.error });
  }
}

async function handleFollowDiet() {
  const success = await dietsStore.followDiet(dietId.value);
  if (success) {
    diet.value = await dietsStore.getDiet(dietId.value);
    $q.notify({ type: 'positive', message: t('diet.followSuccess') });
  } else if (dietsStore.error) {
    $q.notify({ type: 'negative', message: dietsStore.error });
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
    } else if (dietsStore.error) {
      $q.notify({ type: 'negative', message: dietsStore.error });
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
    // If diet is being followed, stop following first
    if (diet.value?.is_active) {
      await dietsStore.stopFollowingDiet(dietId.value);
    }
    const success = await dietsStore.deleteDiet(dietId.value);
    if (success) {
      $q.notify({ type: 'positive', message: t('diet.dietDeleted') });
      router.push('/diet');
    }
  });
}

async function loadDiet(id: string) {
  loading.value = true;
  diet.value = await dietsStore.getDiet(id);
  loading.value = false;
  refreshReminderStatus();
  await followUpsStore.checkPendingFollowUps();
  hasPendingFollowUp.value = !!followUpsStore.getPendingForDiet(id);
}

// Reload diet when route param changes (e.g. after save assigns new backend ID)
watch(dietId, (newId) => {
  void loadDiet(newId);
});

onMounted(() => {
  void loadDiet(dietId.value);
});
</script>

<style lang="scss" scoped>
.bg-negative-light {
  background-color: rgba($negative, 0.1);
}
</style>
