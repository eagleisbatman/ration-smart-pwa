<template>
  <div class="yield-trend-chart" ref="chartContainer">
    <!-- Empty state -->
    <div v-if="!data || data.length < 2" class="text-center q-py-lg">
      <q-icon name="show_chart" size="48px" color="grey-4" />
      <div class="text-body2 text-grey-6 q-mt-sm">{{ $t('chart.noChartData') }}</div>
    </div>

    <template v-else>
      <!-- SVG Chart -->
      <svg
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        preserveAspectRatio="xMidYMid meet"
        class="full-width"
        @click="onChartClick"
      >
        <!-- Grid lines -->
        <line
          v-for="(tick, i) in yieldTicks"
          :key="'grid-' + i"
          :x1="padding.left"
          :y1="tick.y"
          :x2="svgWidth - padding.right"
          :y2="tick.y"
          stroke="#E0E0E0"
          stroke-width="0.5"
        />

        <!-- Y-axis labels (Yield) -->
        <text
          v-for="(tick, i) in yieldTicks"
          :key="'ylabel-' + i"
          :x="padding.left - 6"
          :y="tick.y + 3"
          text-anchor="end"
          fill="#666"
          font-size="10"
        >{{ tick.label }}</text>

        <!-- Y-axis labels (Fat %) - right side -->
        <template v-if="showFat && hasFatData">
          <text
            v-for="(tick, i) in fatTicks"
            :key="'fatlabel-' + i"
            :x="svgWidth - padding.right + 6"
            :y="tick.y + 3"
            text-anchor="start"
            fill="#FF9800"
            font-size="10"
          >{{ tick.label }}</text>
        </template>

        <!-- X-axis labels -->
        <text
          v-for="(label, i) in xAxisLabels"
          :key="'xlabel-' + i"
          :x="label.x"
          :y="svgHeight - padding.bottom + 16"
          text-anchor="middle"
          fill="#666"
          font-size="10"
        >{{ label.text }}</text>

        <!-- Average line (dashed) -->
        <line
          :x1="padding.left"
          :y1="averageY"
          :x2="svgWidth - padding.right"
          :y2="averageY"
          stroke="#4CAF50"
          stroke-width="1"
          stroke-dasharray="6,3"
        />

        <!-- Average label -->
        <text
          :x="padding.left + 4"
          :y="averageY - 4"
          fill="#4CAF50"
          font-size="9"
        >{{ $t('chart.average') }}: {{ averageYield.toFixed(1) }}{{ $t('chart.liters') }}</text>

        <!-- Yield line path -->
        <path
          :d="yieldLinePath"
          fill="none"
          stroke="#1976D2"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Fat line path (optional) -->
        <path
          v-if="showFat && hasFatData"
          :d="fatLinePath"
          fill="none"
          stroke="#FF9800"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-dasharray="4,2"
        />

        <!-- Yield data point circles -->
        <circle
          v-for="(point, i) in yieldPoints"
          :key="'yield-dot-' + i"
          :cx="point.x"
          :cy="point.y"
          r="3"
          fill="#1976D2"
          stroke="white"
          stroke-width="1"
        />

        <!-- Fat data point circles -->
        <template v-if="showFat && hasFatData">
          <circle
            v-for="(point, i) in fatPoints"
            :key="'fat-dot-' + i"
            :cx="point.x"
            :cy="point.y"
            r="2.5"
            fill="#FF9800"
            stroke="white"
            stroke-width="1"
          />
        </template>

        <!-- Highlight selected point -->
        <circle
          v-if="selectedIndex !== null"
          :cx="yieldPoints[selectedIndex].x"
          :cy="yieldPoints[selectedIndex].y"
          r="5"
          fill="#1976D2"
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
        <div class="text-caption text-weight-medium">{{ tooltipData.date }}</div>
        <div class="text-caption">
          {{ $t('chart.milkYield') }}: {{ tooltipData.yield.toFixed(1) }}{{ $t('chart.liters') }}
        </div>
        <div v-if="tooltipData.fat != null" class="text-caption">
          {{ $t('chart.fatPercent') }}: {{ tooltipData.fat.toFixed(1) }}%
        </div>
      </div>

      <!-- Legend -->
      <div class="chart-legend q-mt-sm">
        <div class="legend-item">
          <span class="legend-color legend-color--primary"></span>
          <span class="text-caption">{{ $t('chart.milkYield') }}</span>
        </div>
        <div v-if="showFat && hasFatData" class="legend-item">
          <span class="legend-color legend-dashed legend-dashed--warning"></span>
          <span class="text-caption">{{ $t('chart.fatPercent') }}</span>
        </div>
        <div class="legend-item">
          <span class="legend-color legend-dashed legend-dashed--success"></span>
          <span class="text-caption">{{ $t('chart.average') }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { format, parseISO } from 'date-fns';
import { getDateFnsLocaleSync } from 'src/composables/useDateFormat';

interface ChartDataPoint {
  date: string;
  yield: number;
  fat?: number;
}

const props = withDefaults(
  defineProps<{
    data: ChartDataPoint[];
    height?: number;
    showFat?: boolean;
  }>(),
  {
    height: 200,
    showFat: false,
  }
);

const chartContainer = ref<HTMLElement | null>(null);
const selectedIndex = ref<number | null>(null);

// SVG dimensions
const svgWidth = 400;
const svgHeight = computed(() => props.height);
const padding = computed(() => ({
  left: 40,
  right: props.showFat && hasFatData.value ? 30 : 10,
  top: 10,
  bottom: 30,
}));

const chartWidth = computed(() => svgWidth - padding.value.left - padding.value.right);
const chartHeight = computed(() => svgHeight.value - padding.value.top - padding.value.bottom);

// Check if fat data exists
const hasFatData = computed(() =>
  props.data.some((d) => d.fat != null && d.fat > 0)
);

// Yield scale
const yieldMin = computed(() => {
  const min = Math.min(...props.data.map((d) => d.yield));
  return Math.max(0, Math.floor(min - 1));
});

const yieldMax = computed(() => {
  const max = Math.max(...props.data.map((d) => d.yield));
  return Math.ceil(max + 1);
});

const yieldRange = computed(() => yieldMax.value - yieldMin.value || 1);

// Fat scale
const fatMin = computed(() => {
  const vals = props.data.filter((d) => d.fat != null).map((d) => d.fat!);
  if (vals.length === 0) return 0;
  return Math.max(0, Math.floor(Math.min(...vals) - 0.5));
});

const fatMax = computed(() => {
  const vals = props.data.filter((d) => d.fat != null).map((d) => d.fat!);
  if (vals.length === 0) return 10;
  return Math.ceil(Math.max(...vals) + 0.5);
});

const fatRange = computed(() => fatMax.value - fatMin.value || 1);

// Average yield
const averageYield = computed(() => {
  if (props.data.length === 0) return 0;
  const sum = props.data.reduce((acc, d) => acc + d.yield, 0);
  return sum / props.data.length;
});

const averageY = computed(() =>
  padding.value.top + chartHeight.value - ((averageYield.value - yieldMin.value) / yieldRange.value) * chartHeight.value
);

// Convert data index to X position
function indexToX(index: number): number {
  const count = props.data.length;
  if (count <= 1) return padding.value.left + chartWidth.value / 2;
  return padding.value.left + (index / (count - 1)) * chartWidth.value;
}

// Convert yield value to Y position
function yieldToY(value: number): number {
  return padding.value.top + chartHeight.value - ((value - yieldMin.value) / yieldRange.value) * chartHeight.value;
}

// Convert fat value to Y position
function fatToY(value: number): number {
  return padding.value.top + chartHeight.value - ((value - fatMin.value) / fatRange.value) * chartHeight.value;
}

// Yield tick marks (4-5 ticks)
const yieldTicks = computed(() => {
  const tickCount = 4;
  const ticks = [];
  for (let i = 0; i <= tickCount; i++) {
    const value = yieldMin.value + (yieldRange.value * i) / tickCount;
    ticks.push({
      y: yieldToY(value),
      label: value.toFixed(1),
    });
  }
  return ticks;
});

// Fat tick marks
const fatTicks = computed(() => {
  const tickCount = 4;
  const ticks = [];
  for (let i = 0; i <= tickCount; i++) {
    const value = fatMin.value + (fatRange.value * i) / tickCount;
    ticks.push({
      y: fatToY(value),
      label: value.toFixed(1),
    });
  }
  return ticks;
});

// X-axis labels (max ~6 labels)
const xAxisLabels = computed(() => {
  const count = props.data.length;
  if (count === 0) return [];

  const maxLabels = 6;
  const step = Math.max(1, Math.ceil(count / maxLabels));
  const labels: { x: number; text: string }[] = [];
  const locale = getDateFnsLocaleSync();

  for (let i = 0; i < count; i += step) {
    const dateStr = props.data[i].date;
    try {
      const formatted = format(parseISO(dateStr), 'MMM d', { locale });
      labels.push({
        x: indexToX(i),
        text: formatted,
      });
    } catch {
      labels.push({
        x: indexToX(i),
        text: dateStr,
      });
    }
  }

  // Always include last date if not already included
  const lastIndex = count - 1;
  if (lastIndex % step !== 0 && count > 1) {
    try {
      const formatted = format(parseISO(props.data[lastIndex].date), 'MMM d', { locale: getDateFnsLocaleSync() });
      labels.push({
        x: indexToX(lastIndex),
        text: formatted,
      });
    } catch {
      labels.push({
        x: indexToX(lastIndex),
        text: props.data[lastIndex].date,
      });
    }
  }

  return labels;
});

// Yield points
const yieldPoints = computed(() =>
  props.data.map((d, i) => ({
    x: indexToX(i),
    y: yieldToY(d.yield),
  }))
);

// Fat points (only where fat data exists)
const fatPoints = computed(() =>
  props.data
    .map((d, i) => ({
      x: indexToX(i),
      y: d.fat != null ? fatToY(d.fat) : 0,
      hasFat: d.fat != null,
    }))
    .filter((p) => p.hasFat)
);

// SVG path for yield line
const yieldLinePath = computed(() => {
  if (yieldPoints.value.length === 0) return '';
  const pts = yieldPoints.value;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x} ${pts[i].y}`;
  }
  return d;
});

// SVG path for fat line
const fatLinePath = computed(() => {
  const pts = props.data
    .map((d, i) => ({
      x: indexToX(i),
      y: d.fat != null ? fatToY(d.fat) : null,
    }))
    .filter((p) => p.y !== null) as { x: number; y: number }[];

  if (pts.length === 0) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x} ${pts[i].y}`;
  }
  return d;
});

// Tooltip
const tooltipData = computed(() => {
  if (selectedIndex.value === null) return null;
  const d = props.data[selectedIndex.value];
  const locale = getDateFnsLocaleSync();
  let dateLabel: string;
  try {
    dateLabel = format(parseISO(d.date), 'MMM d, yyyy', { locale });
  } catch {
    dateLabel = d.date;
  }
  return {
    date: dateLabel,
    yield: d.yield,
    fat: d.fat ?? null,
  };
});

const tooltipStyle = computed(() => {
  if (selectedIndex.value === null) return { display: 'none' };
  const point = yieldPoints.value[selectedIndex.value];
  // Convert SVG coordinates to percentage-based positioning
  const xPercent = (point.x / svgWidth) * 100;
  const yPercent = (point.y / svgHeight.value) * 100;

  // Position tooltip above the point, clamping horizontally
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
  // Map click position to SVG coordinate space
  const clickX = ((event.clientX - rect.left) / rect.width) * svgWidth;

  // Find nearest data point
  let nearest = 0;
  let nearestDist = Infinity;
  for (let i = 0; i < yieldPoints.value.length; i++) {
    const dist = Math.abs(yieldPoints.value[i].x - clickX);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = i;
    }
  }

  // Toggle if clicking same point
  if (selectedIndex.value === nearest) {
    selectedIndex.value = null;
  } else {
    selectedIndex.value = nearest;
  }
}
</script>

<style lang="scss" scoped>
.yield-trend-chart {
  position: relative;
}
</style>
