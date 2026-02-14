<template>
  <div class="diet-cost-chart" ref="chartContainer">
    <!-- Empty state -->
    <div v-if="chartData.length < 2" class="text-center q-py-lg">
      <q-icon name="show_chart" size="48px" color="grey-4" />
      <div class="text-body2 text-grey-6 q-mt-sm">{{ $t('diets.costChart.noData') }}</div>
    </div>

    <template v-else>
      <!-- Cow filter chips -->
      <div v-if="cowNames.length > 1" class="q-mb-sm row q-gutter-xs">
        <q-chip
          :color="selectedCow === null ? 'primary' : 'grey-3'"
          :text-color="selectedCow === null ? 'white' : 'grey-8'"
          clickable
          dense
          size="sm"
          @click="selectedCow = null"
        >
          {{ $t('common.all') }}
        </q-chip>
        <q-chip
          v-for="name in cowNames"
          :key="name"
          :color="selectedCow === name ? 'primary' : 'grey-3'"
          :text-color="selectedCow === name ? 'white' : 'grey-8'"
          clickable
          dense
          size="sm"
          @click="selectedCow = name"
        >
          {{ name }}
        </q-chip>
      </div>

      <!-- SVG Chart -->
      <svg
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        preserveAspectRatio="xMidYMid meet"
        class="full-width"
        @click="onChartClick"
      >
        <!-- Grid lines -->
        <line
          v-for="(tick, i) in yTicks"
          :key="'grid-' + i"
          :x1="padding.left"
          :y1="tick.y"
          :x2="svgWidth - padding.right"
          :y2="tick.y"
          :stroke="CHART.grid"
          stroke-width="0.5"
        />

        <!-- Y-axis labels (Cost) -->
        <text
          v-for="(tick, i) in yTicks"
          :key="'ylabel-' + i"
          :x="padding.left - 6"
          :y="tick.y + 3"
          text-anchor="end"
          :fill="CHART.axisText"
          font-size="10"
        >{{ tick.label }}</text>

        <!-- X-axis labels -->
        <text
          v-for="(label, i) in xAxisLabels"
          :key="'xlabel-' + i"
          :x="label.x"
          :y="svgHeight - padding.bottom + 16"
          text-anchor="middle"
          :fill="CHART.axisText"
          font-size="10"
        >{{ label.text }}</text>

        <!-- Area fill under the line -->
        <path
          :d="areaPath"
          :fill="CHART.primaryFill"
        />

        <!-- Average line (dashed) -->
        <line
          :x1="padding.left"
          :y1="averageY"
          :x2="svgWidth - padding.right"
          :y2="averageY"
          :stroke="CHART.success"
          stroke-width="1"
          stroke-dasharray="6,3"
        />

        <!-- Average label -->
        <text
          :x="svgWidth - padding.right - 4"
          :y="averageY - 4"
          text-anchor="end"
          :fill="CHART.success"
          font-size="9"
        >{{ $t('diets.avgCost') }}: {{ formatCurrency(averageCost) }}</text>

        <!-- Cost line path -->
        <path
          :d="costLinePath"
          fill="none"
          :stroke="CHART.primary"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Data point circles -->
        <circle
          v-for="(point, i) in costPoints"
          :key="'dot-' + i"
          :cx="point.x"
          :cy="point.y"
          r="3.5"
          :fill="CHART.primary"
          stroke="white"
          stroke-width="1.5"
          class="data-dot"
        />

        <!-- Highlight selected point -->
        <circle
          v-if="selectedIndex !== null"
          :cx="costPoints[selectedIndex].x"
          :cy="costPoints[selectedIndex].y"
          r="6"
          :fill="CHART.primary"
          stroke="white"
          stroke-width="2"
        />
      </svg>

      <!-- Tooltip -->
      <div
        v-if="tooltipData"
        class="chart-tooltip"
        :style="tooltipStyle"
      >
        <div class="text-caption text-weight-medium">{{ tooltipData.name }}</div>
        <div class="text-caption">{{ tooltipData.date }}</div>
        <div class="text-caption text-weight-bold">
          {{ $t('diets.dailyCost') }}: {{ tooltipData.cost }}{{ $t('diets.costChart.perDay') }}
        </div>
      </div>

      <!-- Legend -->
      <div class="chart-legend q-mt-sm">
        <div class="legend-item">
          <span class="legend-color legend-color--primary"></span>
          <span class="text-caption">{{ $t('diets.dailyCost') }}</span>
        </div>
        <div class="legend-item">
          <span class="legend-color legend-dashed legend-dashed--success"></span>
          <span class="text-caption">{{ $t('diets.avgCost') }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { format, parseISO } from 'date-fns';
import { getDateFnsLocaleSync } from 'src/composables/useDateFormat';
import { useCurrency } from 'src/composables/useCurrency';
import { CHART } from 'src/lib/chart-colors';
import type { Diet } from 'src/lib/offline/db';

const props = withDefaults(
  defineProps<{
    diets: Diet[];
    height?: number;
  }>(),
  {
    height: 200,
  }
);

const { formatCurrency } = useCurrency();

const selectedCow = ref<string | null>(null);
const selectedIndex = ref<number | null>(null);

// Extract unique cow names for filter chips
const cowNames = computed(() => {
  const names = new Set<string>();
  for (const d of props.diets) {
    if (d.cow_name) {
      names.add(d.cow_name);
    }
  }
  return Array.from(names).sort();
});

// Filtered and sorted chart data (most recent 15, chronological order)
const chartData = computed(() => {
  let filtered = props.diets.filter(
    (d) => d.status === 'completed' && d.total_cost != null && d.total_cost > 0
  );

  if (selectedCow.value !== null) {
    filtered = filtered.filter((d) => d.cow_name === selectedCow.value);
  }

  // Sort by date ascending (oldest first for chart)
  const sorted = [...filtered].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Take last 15
  return sorted.slice(-15);
});

// SVG dimensions
const svgWidth = 400;
const svgHeight = computed(() => props.height);
const padding = computed(() => ({
  left: 48,
  right: 10,
  top: 10,
  bottom: 30,
}));

const chartWidth = computed(() => svgWidth - padding.value.left - padding.value.right);
const chartHeight = computed(() => svgHeight.value - padding.value.top - padding.value.bottom);

// Cost scale
const costMin = computed(() => {
  if (chartData.value.length === 0) return 0;
  const min = Math.min(...chartData.value.map((d) => d.total_cost!));
  return Math.max(0, Math.floor(min * 0.9));
});

const costMax = computed(() => {
  if (chartData.value.length === 0) return 100;
  const max = Math.max(...chartData.value.map((d) => d.total_cost!));
  return Math.ceil(max * 1.1);
});

const costRange = computed(() => costMax.value - costMin.value || 1);

// Average cost
const averageCost = computed(() => {
  if (chartData.value.length === 0) return 0;
  const sum = chartData.value.reduce((acc, d) => acc + (d.total_cost ?? 0), 0);
  return sum / chartData.value.length;
});

const averageY = computed(() =>
  padding.value.top +
    chartHeight.value -
    ((averageCost.value - costMin.value) / costRange.value) * chartHeight.value
);

// Convert data index to X position
function indexToX(index: number): number {
  const count = chartData.value.length;
  if (count <= 1) return padding.value.left + chartWidth.value / 2;
  return padding.value.left + (index / (count - 1)) * chartWidth.value;
}

// Convert cost value to Y position
function costToY(value: number): number {
  return (
    padding.value.top +
    chartHeight.value -
    ((value - costMin.value) / costRange.value) * chartHeight.value
  );
}

// Y-axis tick marks (4-5 ticks)
const yTicks = computed(() => {
  const tickCount = 4;
  const ticks = [];
  for (let i = 0; i <= tickCount; i++) {
    const value = costMin.value + (costRange.value * i) / tickCount;
    ticks.push({
      y: costToY(value),
      label: Math.round(value).toString(),
    });
  }
  return ticks;
});

// X-axis labels (max ~6 labels)
const xAxisLabels = computed(() => {
  const count = chartData.value.length;
  if (count === 0) return [];

  const maxLabels = 6;
  const step = Math.max(1, Math.ceil(count / maxLabels));
  const labels: { x: number; text: string }[] = [];
  const locale = getDateFnsLocaleSync();

  for (let i = 0; i < count; i += step) {
    const dateStr = chartData.value[i].created_at;
    try {
      const formatted = format(parseISO(dateStr), 'MMM d', { locale });
      labels.push({ x: indexToX(i), text: formatted });
    } catch {
      labels.push({ x: indexToX(i), text: dateStr.slice(0, 10) });
    }
  }

  // Always include last date if not already included
  const lastIndex = count - 1;
  if (lastIndex % step !== 0 && count > 1) {
    try {
      const formatted = format(parseISO(chartData.value[lastIndex].created_at), 'MMM d', {
        locale: getDateFnsLocaleSync(),
      });
      labels.push({ x: indexToX(lastIndex), text: formatted });
    } catch {
      labels.push({
        x: indexToX(lastIndex),
        text: chartData.value[lastIndex].created_at.slice(0, 10),
      });
    }
  }

  return labels;
});

// Cost points
const costPoints = computed(() =>
  chartData.value.map((d, i) => ({
    x: indexToX(i),
    y: costToY(d.total_cost!),
  }))
);

// SVG path for cost line
const costLinePath = computed(() => {
  if (costPoints.value.length === 0) return '';
  const pts = costPoints.value;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x} ${pts[i].y}`;
  }
  return d;
});

// SVG path for area fill under line
const areaPath = computed(() => {
  if (costPoints.value.length === 0) return '';
  const pts = costPoints.value;
  const baseY = padding.value.top + chartHeight.value;
  let d = `M ${pts[0].x} ${baseY}`;
  for (let i = 0; i < pts.length; i++) {
    d += ` L ${pts[i].x} ${pts[i].y}`;
  }
  d += ` L ${pts[pts.length - 1].x} ${baseY} Z`;
  return d;
});

// Tooltip
const tooltipData = computed(() => {
  if (selectedIndex.value === null) return null;
  const d = chartData.value[selectedIndex.value];
  const locale = getDateFnsLocaleSync();
  let dateLabel: string;
  try {
    dateLabel = format(parseISO(d.created_at), 'MMM d, yyyy', { locale });
  } catch {
    dateLabel = d.created_at.slice(0, 10);
  }
  return {
    name: d.cow_name || '',
    date: dateLabel,
    cost: formatCurrency(d.total_cost ?? 0),
  };
});

const tooltipStyle = computed(() => {
  if (selectedIndex.value === null) return { display: 'none' };
  const point = costPoints.value[selectedIndex.value];
  const xPercent = (point.x / svgWidth) * 100;
  const yPercent = (point.y / svgHeight.value) * 100;
  const left = Math.max(10, Math.min(90, xPercent));

  return {
    position: 'absolute' as const,
    left: `${left}%`,
    top: `${Math.max(0, yPercent - 10)}%`,
    transform: 'translate(-50%, -100%)',
  };
});

// Handle click on chart to select nearest data point
function onChartClick(event: MouseEvent) {
  const svg = event.currentTarget as SVGSVGElement;
  if (!svg) return;

  const rect = svg.getBoundingClientRect();
  const clickX = ((event.clientX - rect.left) / rect.width) * svgWidth;

  let nearest = 0;
  let nearestDist = Infinity;
  for (let i = 0; i < costPoints.value.length; i++) {
    const dist = Math.abs(costPoints.value[i].x - clickX);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = i;
    }
  }

  if (selectedIndex.value === nearest) {
    selectedIndex.value = null;
  } else {
    selectedIndex.value = nearest;
  }
}
</script>

<style lang="scss" scoped>
.diet-cost-chart {
  position: relative;
}

.data-dot {
  cursor: pointer;
}
</style>
