<template>
  <q-card flat bordered>
    <q-card-section>
      <div class="text-subtitle1 q-mb-sm">{{ $t('feed.priceHistory') }}</div>

      <!-- Empty state -->
      <div v-if="!loading && historyEntries.length === 0" class="text-center q-pa-md">
        <q-icon name="trending_flat" size="48px" color="grey-4" />
        <div class="text-body2 text-grey-6 q-mt-sm">{{ $t('feed.noPriceHistory') }}</div>
      </div>

      <!-- Chart -->
      <template v-if="!loading && historyEntries.length > 1">
        <div class="chart-container q-mb-md">
          <svg
            :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
            class="price-chart"
            preserveAspectRatio="xMidYMid meet"
          >
            <!-- Grid lines -->
            <line
              v-for="(tick, i) in yTicks"
              :key="'grid-' + i"
              :x1="chartPadding.left"
              :y1="tick.y"
              :x2="svgWidth - chartPadding.right"
              :y2="tick.y"
              :stroke="CHART.grid"
              stroke-width="0.5"
              stroke-dasharray="4,4"
            />

            <!-- Y-axis labels -->
            <text
              v-for="(tick, i) in yTicks"
              :key="'ylabel-' + i"
              :x="chartPadding.left - 6"
              :y="tick.y + 4"
              text-anchor="end"
              class="chart-label"
              :fill="CHART.axisTextLight"
              font-size="10"
            >
              {{ tick.label }}
            </text>

            <!-- X-axis labels -->
            <text
              v-for="(label, i) in xLabels"
              :key="'xlabel-' + i"
              :x="label.x"
              :y="svgHeight - 4"
              text-anchor="middle"
              class="chart-label"
              :fill="CHART.axisTextLight"
              font-size="9"
            >
              {{ label.text }}
            </text>

            <!-- Area fill under line -->
            <path
              :d="areaPath"
              fill="url(#priceGradient)"
              opacity="0.3"
            />

            <!-- Gradient definition -->
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="CHART.primary" stop-opacity="0.4" />
                <stop offset="100%" :stop-color="CHART.primary" stop-opacity="0.05" />
              </linearGradient>
            </defs>

            <!-- Line -->
            <path
              :d="linePath"
              fill="none"
              :stroke="CHART.primary"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />

            <!-- Data points -->
            <circle
              v-for="(point, i) in chartPoints"
              :key="'point-' + i"
              :cx="point.x"
              :cy="point.y"
              :r="i === chartPoints.length - 1 ? 5 : 3"
              :fill="i === chartPoints.length - 1 ? CHART.primary : 'white'"
              :stroke="i === chartPoints.length - 1 ? 'white' : CHART.primary"
              :stroke-width="i === chartPoints.length - 1 ? 2 : 1.5"
            />

            <!-- Current price label on last point -->
            <text
              v-if="chartPoints.length > 0"
              :x="chartPoints[chartPoints.length - 1].x"
              :y="chartPoints[chartPoints.length - 1].y - 10"
              text-anchor="middle"
              :fill="CHART.primary"
              font-size="11"
              font-weight="bold"
            >
              {{ formatCurrency(historyEntries[historyEntries.length - 1].price_per_kg) }}
            </text>
          </svg>
        </div>
      </template>

      <!-- Single entry - just show the current price -->
      <template v-if="!loading && historyEntries.length === 1">
        <div class="text-center q-pa-sm">
          <div class="text-h5 text-primary">{{ formatCurrency(historyEntries[0].price_per_kg) }}</div>
          <div class="text-caption text-grey-6">
            {{ formatDate(historyEntries[0].recorded_at) }}
          </div>
        </div>
      </template>

      <!-- Stats -->
      <template v-if="!loading && historyEntries.length > 1">
        <q-separator class="q-mb-sm" />
        <div class="row q-col-gutter-sm text-center">
          <div class="col-3">
            <div class="text-caption text-grey-6">{{ $t('feed.currentPrice') }}</div>
            <div class="text-body2 text-weight-medium text-primary">{{ formatCurrency(stats.current) }}</div>
          </div>
          <div class="col-3">
            <div class="text-caption text-grey-6">{{ $t('feed.minPrice') }}</div>
            <div class="text-body2 text-weight-medium text-positive">{{ formatCurrency(stats.min) }}</div>
          </div>
          <div class="col-3">
            <div class="text-caption text-grey-6">{{ $t('feed.maxPrice') }}</div>
            <div class="text-body2 text-weight-medium text-negative">{{ formatCurrency(stats.max) }}</div>
          </div>
          <div class="col-3">
            <div class="text-caption text-grey-6">{{ $t('feed.avgPrice') }}</div>
            <div class="text-body2 text-weight-medium">{{ formatCurrency(stats.avg) }}</div>
          </div>
        </div>

        <!-- Price change indicator -->
        <div v-if="priceChangePercent !== null" class="text-center q-mt-sm">
          <q-chip
            :color="priceChangePercent > 0 ? 'negative' : priceChangePercent < 0 ? 'positive' : undefined"
            :text-color="priceChangePercent !== 0 ? 'white' : undefined"
            :outline="priceChangePercent === 0"
            size="sm"
            dense
            :icon="priceChangePercent > 0 ? 'trending_up' : priceChangePercent < 0 ? 'trending_down' : 'trending_flat'"
          >
            {{ $t('feed.priceChange') }}: {{ priceChangePercent > 0 ? '+' : '' }}{{ priceChangePercent.toFixed(1) }}%
          </q-chip>
        </div>
      </template>

      <!-- Loading -->
      <div v-if="loading" class="text-center q-pa-md">
        <q-spinner size="32px" color="primary" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { db, FeedPriceHistory } from 'src/lib/offline/db';
import { useCurrency } from 'src/composables/useCurrency';
import { useChartColors } from 'src/lib/chart-colors';

const chartColors = useChartColors();
const CHART = chartColors;

const props = defineProps<{
  feedId: string;
}>();

const { formatCurrency } = useCurrency();

const loading = ref(true);
const historyEntries = ref<FeedPriceHistory[]>([]);

// SVG dimensions
const svgWidth = 320;
const svgHeight = 180;
const chartPadding = { top: 20, right: 16, bottom: 24, left: 48 };

const chartWidth = svgWidth - chartPadding.left - chartPadding.right;
const chartHeight = svgHeight - chartPadding.top - chartPadding.bottom;

// Stats
const stats = computed(() => {
  const entries = historyEntries.value;
  if (entries.length === 0) return { current: 0, min: 0, max: 0, avg: 0 };

  const prices = entries.map((e) => e.price_per_kg);
  const current = prices[prices.length - 1];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

  return { current, min, max, avg };
});

// Price change between first and last entry
const priceChangePercent = computed(() => {
  const entries = historyEntries.value;
  if (entries.length < 2) return null;

  const first = entries[0].price_per_kg;
  const last = entries[entries.length - 1].price_per_kg;
  if (first === 0) return null;

  return ((last - first) / first) * 100;
});

// Chart calculations
const yRange = computed(() => {
  const entries = historyEntries.value;
  if (entries.length < 2) return { min: 0, max: 100 };

  const prices = entries.map((e) => e.price_per_kg);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const padding = (max - min) * 0.15 || max * 0.1 || 10;

  return {
    min: Math.max(0, min - padding),
    max: max + padding,
  };
});

const chartPoints = computed(() => {
  const entries = historyEntries.value;
  if (entries.length < 2) return [];

  const { min: yMin, max: yMax } = yRange.value;
  const yScale = yMax - yMin;

  return entries.map((entry, i) => ({
    x: chartPadding.left + (i / (entries.length - 1)) * chartWidth,
    y: chartPadding.top + (1 - (entry.price_per_kg - yMin) / yScale) * chartHeight,
  }));
});

const linePath = computed(() => {
  const points = chartPoints.value;
  if (points.length < 2) return '';

  return points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');
});

const areaPath = computed(() => {
  const points = chartPoints.value;
  if (points.length < 2) return '';

  const bottomY = chartPadding.top + chartHeight;
  const lineSegments = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  return `${lineSegments} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
});

const yTicks = computed(() => {
  const { min: yMin, max: yMax } = yRange.value;
  const tickCount = 4;
  const ticks = [];

  for (let i = 0; i < tickCount; i++) {
    const value = yMin + (i / (tickCount - 1)) * (yMax - yMin);
    const y = chartPadding.top + (1 - i / (tickCount - 1)) * chartHeight;
    ticks.push({
      y,
      label: value.toFixed(0),
    });
  }

  return ticks;
});

const xLabels = computed(() => {
  const entries = historyEntries.value;
  if (entries.length < 2) return [];

  // Show at most 5 labels
  const maxLabels = Math.min(5, entries.length);
  const step = Math.max(1, Math.floor((entries.length - 1) / (maxLabels - 1)));
  const labels = [];

  for (let i = 0; i < entries.length; i += step) {
    labels.push({
      x: chartPadding.left + (i / (entries.length - 1)) * chartWidth,
      text: formatShortDate(entries[i].recorded_at),
    });
  }

  // Always include the last entry
  const lastIdx = entries.length - 1;
  const lastLabel = {
    x: chartPadding.left + chartWidth,
    text: formatShortDate(entries[lastIdx].recorded_at),
  };
  if (labels.length === 0 || labels[labels.length - 1].text !== lastLabel.text) {
    labels.push(lastLabel);
  }

  return labels;
});

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.toLocaleString('default', { month: 'short' });
  return `${date.getDate()} ${month}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('default', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

onMounted(async () => {
  loading.value = true;
  try {
    historyEntries.value = await db.feedPriceHistory
      .where('feed_id')
      .equals(props.feedId)
      .sortBy('recorded_at');
  } catch {
    historyEntries.value = [];
  } finally {
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.chart-container {
  width: 100%;
  overflow: hidden;
}

.price-chart {
  width: 100%;
  height: auto;
  max-height: 200px;
}

.chart-label {
  font-family: inherit;
}
</style>
