<template>
  <q-page class="q-pa-md">
    <!-- Loading State -->
    <template v-if="loading">
      <SkeletonCard />
    </template>

    <!-- Cow Details -->
    <template v-else-if="cow">
      <!-- Hero Photo -->
      <q-card v-if="cow.image_url" flat bordered class="q-mb-md cow-hero-card">
        <q-img
          :src="cow.image_url"
          :ratio="16/9"
          class="cow-hero-image"
        />
        <q-card-section>
          <div class="text-h5">{{ cow.name }}</div>
          <div class="text-body2 text-grey-7">
            {{ cow.breed }}
            <template v-if="cow.tag_number"> · #{{ cow.tag_number }}</template>
          </div>
          <q-chip
            v-if="cow.coat_color"
            size="sm"
            color="grey-3"
            text-color="grey-8"
            icon="palette"
            class="q-mt-xs"
          >
            {{ cow.coat_color }}
          </q-chip>
          <q-chip
            v-if="!cow._synced"
            size="sm"
            color="warning"
            text-color="white"
            icon="sync"
            class="q-mt-xs"
          >
            {{ $t('cow.pendingSync') }}
          </q-chip>
        </q-card-section>
      </q-card>

      <!-- Header Card (no photo) -->
      <q-card v-else flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row items-center">
            <q-avatar size="64px" color="primary" text-color="white">
              <q-icon :name="COW_ICON" size="36px" />
            </q-avatar>
            <div class="q-ml-md">
              <div class="text-h5">{{ cow.name }}</div>
              <div class="text-body2 text-grey-7">
                {{ cow.breed }}
                <template v-if="cow.tag_number"> · #{{ cow.tag_number }}</template>
              </div>
              <q-chip
                v-if="cow.coat_color"
                size="sm"
                color="grey-3"
                text-color="grey-8"
                icon="palette"
                class="q-mt-xs"
              >
                {{ cow.coat_color }}
              </q-chip>
              <q-chip
                v-if="!cow._synced"
                size="sm"
                color="warning"
                text-color="white"
                icon="sync"
                class="q-mt-xs"
              >
                {{ $t('cow.pendingSync') }}
              </q-chip>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Quick Stats -->
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-4 col-xs-4">
          <div class="stat-inline">
            <div class="text-subtitle1 text-weight-bold text-primary">{{ cow.weight_kg }}</div>
            <div class="text-caption text-grey-7">{{ $t('cow.weightKg') }}</div>
          </div>
        </div>
        <div class="col-4 col-xs-4">
          <div class="stat-inline">
            <div class="text-subtitle1 text-weight-bold text-secondary">{{ cow.milk_yield_liters }}</div>
            <div class="text-caption text-grey-7">{{ $t('cow.milkYield') }}</div>
            <div v-if="yieldTrend" class="trend-indicator q-mt-xs">
              <q-icon
                :name="yieldTrend.icon"
                :color="yieldTrend.color"
                size="12px"
              />
              <span
                class="text-caption q-ml-xs text-micro--xs"
                :class="`text-${yieldTrend.color}`"
              >{{ yieldTrend.percentText }}</span>
            </div>
          </div>
        </div>
        <div class="col-4 col-xs-4">
          <div class="stat-inline">
            <div class="text-subtitle1 text-weight-bold text-accent">{{ cow.milk_fat_percentage }}{{ $t('units.percent') }}</div>
            <div class="text-caption text-grey-7">{{ $t('cow.fat') }}</div>
          </div>
        </div>
      </div>

      <!-- Active Diet Card -->
      <q-card
        v-if="activeDiet"
        flat
        bordered
        class="q-mb-md active-diet-card"
        clickable
        @click="router.push(`/diet/${activeDiet.id}`)"
      >
        <q-card-section class="row items-center no-wrap">
          <q-avatar color="positive" text-color="white" size="40px">
            <q-icon name="favorite" />
          </q-avatar>
          <div class="q-ml-md col">
            <div class="text-subtitle2">{{ $t('diet.currentDiet') }}</div>
            <div class="text-caption text-grey-7">
              {{ activeDiet.optimization_goal }} · {{ formatCurrency(activeDiet.total_cost ?? 0) }}{{ $t('diet.perDay') }}
            </div>
            <div v-if="dietImpact.hasData.value" class="q-mt-xs">
              <q-badge
                :color="dietImpact.adherenceRate.value >= 70 ? 'positive' : 'grey-6'"
                class="q-mr-xs"
              >
                {{ $t('dietImpact.adherenceBadge', { rate: dietImpact.adherenceRate.value }) }}
              </q-badge>
              <q-badge
                v-if="dietImpact.yieldChange.value !== null"
                :color="dietImpact.yieldChange.value > 0 ? 'positive' : dietImpact.yieldChange.value < 0 ? 'negative' : 'grey-6'"
              >
                {{ $t('dietImpact.yieldBadge', { change: (dietImpact.yieldChange.value > 0 ? '+' : '') + dietImpact.yieldChange.value.toFixed(1) }) }}
              </q-badge>
            </div>
          </div>
          <q-icon name="chevron_right" color="grey-6" />
        </q-card-section>
      </q-card>

      <!-- Details List -->
      <q-card flat bordered class="q-mb-md">
        <q-list separator>
          <q-item v-if="cow.tag_number">
            <q-item-section>
              <q-item-label caption>{{ $t('cow.tagNumber') }}</q-item-label>
              <q-item-label>{{ cow.tag_number }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="cow.coat_color">
            <q-item-section>
              <q-item-label caption>{{ $t('cow.coatColor') }}</q-item-label>
              <q-item-label>{{ cow.coat_color }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>{{ $t('cow.lactationStage') }}</q-item-label>
              <q-item-label>{{ formatLactationStage(cow.lactation_stage) }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="cow.age_months">
            <q-item-section>
              <q-item-label caption>{{ $t('cow.age') }}</q-item-label>
              <q-item-label>{{ formatAge(cow.age_months) }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="cow.body_condition_score">
            <q-item-section>
              <q-item-label caption>{{ $t('cow.bodyConditionScore') }}</q-item-label>
              <q-item-label>{{ $t('cow.bcsValue', { score: cow.body_condition_score }) }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>{{ $t('cow.activityLevel') }}</q-item-label>
              <q-item-label>{{ formatActivityLevel(cow.activity_level) }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item>
            <q-item-section>
              <q-item-label caption>{{ $t('cow.pregnancyStatus') }}</q-item-label>
              <q-item-label>
                {{ cow.is_pregnant ? `${$t('cow.pregnant')} (${$t('cow.pregnancyMonth')} ${cow.pregnancy_month || $t('common.notAvailable')})` : $t('cow.notPregnant') }}
              </q-item-label>
            </q-item-section>
          </q-item>

          <q-item v-if="cow.notes">
            <q-item-section>
              <q-item-label caption>{{ $t('cow.notes') }}</q-item-label>
              <q-item-label>{{ cow.notes }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>

      <!-- Milk Production Trend -->
      <div class="text-subtitle1 q-mt-md q-mb-sm">{{ $t('cow.milkTrend') }}</div>
      <MilkProductionChart :cow-id="cow.id" :height="200" />

      <!-- Quick Actions -->
      <div class="row q-col-gutter-sm q-mb-md">
        <div class="col-12 col-sm-6">
          <q-btn
            :label="$t('cow.logMilk')"
            icon="water_drop"
            color="primary"
            class="full-width"
            unelevated
            @click="router.push({ path: '/logs/new', query: { cow_id: cow.id } })"
          />
        </div>
        <div class="col-12 col-sm-6">
          <q-btn
            :label="$t('cow.getDiet')"
            icon="menu_book"
            color="secondary"
            class="full-width"
            unelevated
            @click="router.push({ path: '/diet/new', query: { cow_id: cow.id } })"
          />
        </div>
      </div>

      <!-- Health History -->
      <div class="q-mt-md q-mb-md">
        <HealthEventTimeline ref="healthTimeline" :cow-id="cow.id" />
      </div>

      <!-- Recent Milk Logs -->
      <div class="text-subtitle1 q-mb-sm">{{ $t('cow.recentMilkLogs') }}</div>
      <template v-if="recentLogs.length === 0">
        <q-card flat bordered class="text-center q-pa-md">
          <div class="text-body2 text-grey-7">{{ $t('cow.noLogsYet') }}</div>
        </q-card>
      </template>
      <template v-else>
        <q-list bordered separator class="rounded-borders">
          <q-item v-for="log in recentLogs" :key="log.id">
            <q-item-section>
              <q-item-label>{{ formatDate(log.log_date) }}</q-item-label>
              <q-item-label caption>
                {{ $t('cow.morning') }}: {{ log.morning_liters || 0 }}{{ $t('units.l') }} · {{ $t('cow.evening') }}: {{ log.evening_liters || 0 }}{{ $t('units.l') }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-item-label class="text-h6 text-primary">{{ log.total_liters }}{{ $t('units.l') }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </template>

      <!-- Edit FAB -->
      <q-page-sticky position="bottom-right" :offset="[16, 72]">
        <q-btn
          fab
          icon="edit"
          color="primary"
          @click="router.push(`/cows/${cow.id}/edit`)"
        />
      </q-page-sticky>
    </template>

    <!-- Not Found -->
    <template v-else>
      <EmptyState
        icon="error_outline"
        icon-color="negative"
        :title="$t('cow.cowNotFound')"
        :description="$t('cow.cowNotFoundDescription')"
        :action-label="$t('cow.goBack')"
        @action="router.back()"
      />
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const { t } = useI18n();
import { format, subDays, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { useCowsStore } from 'src/stores/cows';
import { useMilkLogsStore } from 'src/stores/milkLogs';
import { useDietsStore } from 'src/stores/diets';
import { Cow, Diet } from 'src/lib/offline/db';
import { useCurrency } from 'src/composables/useCurrency';
import { useDietImpact } from 'src/composables/useDietImpact';
import SkeletonCard from 'src/components/ui/SkeletonCard.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';
import MilkProductionChart from 'src/components/dashboard/MilkProductionChart.vue';
import HealthEventTimeline from 'src/components/cow/HealthEventTimeline.vue';
import { COW_ICON } from 'src/boot/icons';

const route = useRoute();
const { formatCurrency } = useCurrency();
const cowsStore = useCowsStore();
const milkLogsStore = useMilkLogsStore();
const dietsStore = useDietsStore();

const cowId = computed(() => route.params.id as string);
const cow = ref<Cow | null>(null);
const recentLogs = ref<typeof milkLogsStore.logs>([]);
const activeDiet = ref<Diet | null>(null);
const dietImpact = useDietImpact(
  computed(() => activeDiet.value?.id),
);
const loading = ref(true);
const healthTimeline = ref<InstanceType<typeof HealthEventTimeline> | null>(null);

const yieldTrend = computed(() => {
  if (recentLogs.value.length === 0) return null;

  const now = new Date();
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const lastWeekStart = startOfWeek(subDays(now, 7), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subDays(now, 7), { weekStartsOn: 1 });

  const thisWeekLogs = recentLogs.value.filter((log) => {
    const d = parseISO(log.log_date);
    return d >= thisWeekStart;
  });
  const lastWeekLogs = recentLogs.value.filter((log) => {
    const d = parseISO(log.log_date);
    return d >= lastWeekStart && d <= lastWeekEnd;
  });

  if (lastWeekLogs.length === 0) return null;

  const thisWeekAvg =
    thisWeekLogs.length > 0
      ? thisWeekLogs.reduce((s, l) => s + l.total_liters, 0) / thisWeekLogs.length
      : 0;
  const lastWeekAvg =
    lastWeekLogs.reduce((s, l) => s + l.total_liters, 0) / lastWeekLogs.length;

  if (lastWeekAvg === 0) return null;

  const diff = thisWeekAvg - lastWeekAvg;
  const pct = Math.round((diff / lastWeekAvg) * 100);

  if (pct > 0) {
    return { icon: 'trending_up', color: 'positive', percentText: `+${pct}%` };
  } else if (pct < 0) {
    return { icon: 'trending_down', color: 'negative', percentText: `${pct}%` };
  }
  return { icon: 'trending_flat', color: 'grey', percentText: '0%' };
});

function formatLactationStage(stage: string): string {
  const stages: Record<string, string> = {
    early: t('cow.lactationEarly'),
    mid: t('cow.lactationMid'),
    late: t('cow.lactationLate'),
    dry: t('cow.dry'),
  };
  return stages[stage] || stage;
}

function formatActivityLevel(level: string): string {
  const levels: Record<string, string> = {
    low: t('cow.activityLow'),
    normal: t('cow.activityNormal'),
    high: t('cow.activityHigh'),
  };
  return levels[level] || level;
}

function formatAge(months: number): string {
  if (months < 12) return t('cow.ageFormatMonthPlural', { count: months });
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const yearStr = years > 1
    ? t('cow.ageFormatYearsPlural', { count: years })
    : t('cow.ageFormatYears', { count: years });
  if (remainingMonths === 0) return yearStr;
  const monthStr = remainingMonths > 1
    ? t('cow.ageFormatMonthPlural', { count: remainingMonths })
    : t('cow.ageFormatMonth', { count: remainingMonths });
  return t('cow.ageFormatYearsAndMonths', { years: yearStr, months: monthStr });
}

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), 'MMM d, yyyy');
}

onMounted(async () => {
  loading.value = true;
  cow.value = await cowsStore.getCow(cowId.value);

  if (cow.value) {
    recentLogs.value = await milkLogsStore.getLogsForCow(cowId.value);
    activeDiet.value = await dietsStore.getActiveDietForCow(cowId.value);
  }

  loading.value = false;
});
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: $radius-loose;
  overflow: hidden;
}

.cow-hero-card {
  border-radius: $radius-loose;
  overflow: hidden;
}

.cow-hero-image {
  max-height: 220px;
}

.trend-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.active-diet-card {
  border-radius: $radius-loose;
  border-left: 4px solid var(--q-positive);
}
</style>
