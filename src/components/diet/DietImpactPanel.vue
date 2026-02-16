<template>
  <q-card flat bordered class="q-mb-md diet-impact-card">
    <q-card-section>
      <!-- Header -->
      <div class="row items-center q-mb-md">
        <q-icon name="monitoring" color="primary" size="24px" class="q-mr-sm" />
        <div class="text-subtitle1 text-weight-medium col">{{ $t('dietImpact.title') }}</div>
        <q-chip v-if="daysSinceStart > 0" dense size="sm" outline>
          {{ daysSinceStart }} {{ $t('dietImpact.days') }}
        </q-chip>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center q-pa-md">
        <q-spinner color="primary" size="24px" />
      </div>

      <!-- Empty state -->
      <template v-else-if="!hasData">
        <div class="text-body2 text-grey-7 q-mb-sm">
          {{ $t('dietImpact.noLogs') }}
        </div>
        <div class="text-caption text-grey-6 q-mb-md">
          {{ $t('dietImpact.noLogsCta') }}
        </div>
        <q-btn
          :label="$t('dietImpact.logMilk')"
          color="primary"
          outline
          size="sm"
          icon="add"
          @click="router.push(`/logs/new?cow_id=${cowId}`)"
        />
      </template>

      <!-- Impact data -->
      <template v-else>
        <!-- Stats Row -->
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-4">
            <div class="text-center">
              <div class="text-h6 text-primary">{{ avgDailyYield }}</div>
              <div class="text-caption text-grey-7">{{ $t('dietImpact.litersPerDay') }}</div>
            </div>
          </div>
          <div class="col-4">
            <div class="text-center">
              <div class="text-h6 text-secondary">{{ adherenceRate }}%</div>
              <div class="text-caption text-grey-7">{{ $t('dietImpact.adherence') }}</div>
            </div>
          </div>
          <div class="col-4">
            <div class="text-center">
              <div
                v-if="yieldChange !== null"
                class="text-h6"
                :class="yieldChange > 0 ? 'text-positive' : yieldChange < 0 ? 'text-negative' : 'text-grey-7'"
              >
                {{ yieldChange > 0 ? '+' : '' }}{{ yieldChange }}%
              </div>
              <div v-else class="text-h6 text-grey-5">--</div>
              <div class="text-caption text-grey-7">{{ $t('dietImpact.vsBaseline') }}</div>
            </div>
          </div>
        </div>

        <!-- Baseline Comparison -->
        <div v-if="baselineYield !== null" class="text-body2 q-mb-md baseline-row">
          <span class="text-grey-7">{{ $t('dietImpact.baseline') }}:</span>
          <span class="text-weight-medium q-ml-xs">{{ baselineYield }} {{ $t('dietImpact.litersPerDay') }}</span>
          <q-icon name="arrow_forward" size="16px" class="q-mx-xs" />
          <span class="text-grey-7">{{ $t('dietImpact.now') }}:</span>
          <span class="text-weight-medium q-ml-xs">{{ avgDailyYield }} {{ $t('dietImpact.litersPerDay') }}</span>
          <q-icon
            v-if="yieldTrend"
            :name="trendIcon"
            :color="trendColor"
            size="18px"
            class="q-ml-xs"
          />
        </div>

        <!-- Mini Yield Chart (SVG) -->
        <div v-if="dailyYields.length > 1" class="yield-chart-wrapper">
          <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="yield-chart">
            <rect
              v-for="(bar, i) in chartBars"
              :key="i"
              :x="bar.x"
              :y="bar.y"
              :width="bar.width"
              :height="bar.height"
              :rx="2"
              class="yield-bar"
              :class="{ 'yield-bar--recent': i >= chartBars.length - 3 }"
            />
            <!-- Baseline line -->
            <line
              v-if="baselineYield !== null && baselineYield > 0"
              :x1="0"
              :y1="baselineY"
              :x2="chartWidth"
              :y2="baselineY"
              class="baseline-line"
            />
          </svg>
          <div class="text-caption text-grey-6 text-center q-mt-xs">
            {{ totalLogs }} {{ $t('dietImpact.days') }}
          </div>
        </div>
      </template>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useDietImpact } from 'src/composables/useDietImpact';

const props = defineProps<{
  dietId: string;
  cowId: string;
}>();

const router = useRouter();

const {
  loading,
  hasData,
  totalLogs,
  adherenceRate,
  avgDailyYield,
  baselineYield,
  yieldChange,
  yieldTrend,
  dailyYields,
  daysSinceStart,
} = useDietImpact(
  computed(() => props.dietId),
);

const trendIcon = computed(() => {
  if (yieldTrend.value === 'up') return 'trending_up';
  if (yieldTrend.value === 'down') return 'trending_down';
  return 'trending_flat';
});

const trendColor = computed(() => {
  if (yieldTrend.value === 'up') return 'positive';
  if (yieldTrend.value === 'down') return 'negative';
  return 'grey-6';
});

// Chart dimensions
const chartWidth = 280;
const chartHeight = 48;
const barGap = 2;

const chartBars = computed(() => {
  const yields = dailyYields.value;
  if (yields.length === 0) return [];

  const maxYield = Math.max(...yields.map((y) => y.liters), baselineYield.value ?? 0, 1);
  const barWidth = Math.max(4, (chartWidth - (yields.length - 1) * barGap) / yields.length);

  return yields.map((y, i) => {
    const height = Math.max(2, (y.liters / maxYield) * (chartHeight - 4));
    return {
      x: i * (barWidth + barGap),
      y: chartHeight - height,
      width: barWidth,
      height,
    };
  });
});

const baselineY = computed(() => {
  if (baselineYield.value === null || baselineYield.value <= 0) return 0;
  const yields = dailyYields.value;
  const maxYield = Math.max(...yields.map((y) => y.liters), baselineYield.value, 1);
  const height = (baselineYield.value / maxYield) * (chartHeight - 4);
  return chartHeight - height;
});
</script>

<style scoped>
.diet-impact-card {
  border-inline-start: 4px solid var(--q-primary);
}

.baseline-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
}

.yield-chart-wrapper {
  padding: 4px 0;
}

.yield-chart {
  width: 100%;
  height: 48px;
}

.yield-bar {
  fill: var(--q-primary);
  opacity: 0.4;
}

.yield-bar--recent {
  opacity: 0.8;
}

.baseline-line {
  stroke: currentColor;
  opacity: 0.35;
  stroke-width: 1;
  stroke-dasharray: 4 3;
}
</style>
