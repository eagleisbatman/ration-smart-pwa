<template>
  <q-card v-if="hasData" flat bordered class="milk-trend-sparkline">
    <q-card-section class="q-py-sm q-px-md">
      <div class="row items-center q-mb-xs">
        <div class="text-caption text-grey-7">{{ $t('logs.trend.past7Days') }}</div>
        <q-space />
        <div class="text-caption text-weight-medium">
          {{ totalLiters.toFixed(1) }}{{ $t('units.l') }}
        </div>
      </div>

      <svg
        :viewBox="`0 0 ${svgWidth} ${svgHeight}`"
        :width="svgWidth"
        :height="svgHeight"
        class="sparkline-svg"
        preserveAspectRatio="none"
      >
        <!-- Gradient fill under the line -->
        <defs>
          <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="var(--q-primary)" stop-opacity="0.3" />
            <stop offset="100%" stop-color="var(--q-primary)" stop-opacity="0.02" />
          </linearGradient>
        </defs>

        <!-- Filled area under the line -->
        <path
          :d="areaPath"
          :fill="`url(#${gradientId})`"
        />

        <!-- Sparkline -->
        <polyline
          :points="polylinePoints"
          fill="none"
          stroke="var(--q-primary)"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />

        <!-- Data point dots -->
        <circle
          v-for="(point, idx) in dataPoints"
          :key="idx"
          :cx="point.x"
          :cy="point.y"
          :r="idx === dataPoints.length - 1 ? 3.5 : 2"
          fill="var(--q-primary)"
          :opacity="idx === dataPoints.length - 1 ? 1 : 0.6"
        />
      </svg>

      <!-- Day labels -->
      <div class="row justify-between text-caption text-grey-5 sparkline-labels">
        <span v-for="(day, idx) in dayLabels" :key="idx">{{ day }}</span>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { format, subDays, parseISO } from 'date-fns';
import type { MilkLog } from 'src/lib/offline/db';

const props = defineProps<{
  logs: MilkLog[];
}>();

useI18n(); // Used for template translations via $t

// Unique gradient ID to avoid SVG conflicts when multiple instances exist
const gradientId = 'sparkline-gradient-' + Math.random().toString(36).substring(2, 9);

const svgWidth = 280;
const svgHeight = 60;
const paddingX = 8;
const paddingY = 6;

interface DailyTotal {
  date: string;
  total: number;
}

/** Aggregate logs into daily totals for the past 7 days */
const dailyTotals = computed((): DailyTotal[] => {
  const now = new Date();
  const days: DailyTotal[] = [];

  // Build a map of date -> total
  const dateMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const dateStr = format(subDays(now, i), 'yyyy-MM-dd');
    dateMap.set(dateStr, 0);
  }

  for (const log of props.logs) {
    if (log._deleted) continue;
    const existing = dateMap.get(log.log_date);
    if (existing !== undefined) {
      dateMap.set(log.log_date, existing + (log.total_liters || 0));
    }
  }

  for (const [date, total] of dateMap) {
    days.push({ date, total });
  }

  return days;
});

/** Whether there is any meaningful data to display */
const hasData = computed(() => {
  return dailyTotals.value.some((d) => d.total > 0);
});

/** Total liters over the past 7 days */
const totalLiters = computed(() => {
  return dailyTotals.value.reduce((sum, d) => sum + d.total, 0);
});

/** Compute SVG data points, scaling values to fit the chart area */
const dataPoints = computed(() => {
  const totals = dailyTotals.value;
  const values = totals.map((d) => d.total);
  const maxVal = Math.max(...values, 0.1); // Avoid division by zero
  const minVal = 0;

  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  return totals.map((d, idx) => {
    const x = paddingX + (idx / Math.max(totals.length - 1, 1)) * chartWidth;
    const normalised = maxVal > minVal ? (d.total - minVal) / (maxVal - minVal) : 0;
    const y = paddingY + chartHeight - normalised * chartHeight;
    return { x, y };
  });
});

/** SVG polyline points string */
const polylinePoints = computed(() => {
  return dataPoints.value.map((p) => `${p.x},${p.y}`).join(' ');
});

/** SVG area path for the gradient fill */
const areaPath = computed(() => {
  const points = dataPoints.value;
  if (points.length === 0) return '';

  const bottom = svgHeight - paddingY;
  let d = `M ${points[0].x},${bottom}`;
  for (const p of points) {
    d += ` L ${p.x},${p.y}`;
  }
  d += ` L ${points[points.length - 1].x},${bottom} Z`;
  return d;
});

/** Short day labels for x-axis */
const dayLabels = computed(() => {
  return dailyTotals.value.map((d) => {
    return format(parseISO(d.date), 'EEE').charAt(0);
  });
});
</script>

<style lang="scss" scoped>
.milk-trend-sparkline {
  border-radius: 12px;
}

.sparkline-svg {
  width: 100%;
  height: auto;
  display: block;
}
</style>
