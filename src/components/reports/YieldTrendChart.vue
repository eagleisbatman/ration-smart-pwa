<template>
  <div class="yield-trend-chart">
    <!-- Empty state -->
    <div v-if="!data || data.length < 2" class="text-center q-py-lg">
      <q-icon name="show_chart" size="48px" color="grey-4" />
      <div class="text-body2 text-grey-6 q-mt-sm">{{ $t('chart.noChartData') }}</div>
    </div>

    <div v-else :style="{ height: height + 'px', position: 'relative' }">
      <Line :data="chartJsData" :options="chartJsOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { format, parseISO } from 'date-fns';
import { getDateFnsLocaleSync } from 'src/composables/useDateFormat';
import { useChartColors } from 'src/lib/chart-colors';
import type { ChartData, ChartOptions } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

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

const colors = useChartColors();

const hasFatData = computed(() =>
  props.data.some((d) => d.fat != null && d.fat > 0)
);

const averageYield = computed(() => {
  if (props.data.length === 0) return 0;
  return props.data.reduce((acc, d) => acc + d.yield, 0) / props.data.length;
});

const labels = computed(() =>
  props.data.map((d) => {
    try {
      return format(parseISO(d.date), 'MMM d', { locale: getDateFnsLocaleSync() });
    } catch {
      return d.date;
    }
  })
);

const chartJsData = computed((): ChartData<'line'> => {
  const c = colors.value;
  const datasets: ChartData<'line'>['datasets'] = [
    {
      label: 'Milk Yield (L)',
      data: props.data.map((d) => d.yield),
      borderColor: c.primary,
      backgroundColor: c.primaryFill,
      pointBackgroundColor: c.primary,
      pointBorderColor: '#fff',
      pointRadius: 3,
      pointHoverRadius: 6,
      borderWidth: 2,
      tension: 0.3,
      fill: true,
    },
    // Average line (annotation-like via dataset)
    {
      label: 'Average',
      data: props.data.map(() => averageYield.value),
      borderColor: c.success,
      borderDash: [6, 3],
      borderWidth: 1,
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: false,
    },
  ];

  if (props.showFat && hasFatData.value) {
    datasets.push({
      label: 'Fat %',
      data: props.data.map((d) => d.fat ?? null) as (number | null)[],
      borderColor: c.warning,
      backgroundColor: 'transparent',
      pointBackgroundColor: c.warning,
      pointBorderColor: '#fff',
      pointRadius: 2.5,
      pointHoverRadius: 5,
      borderWidth: 1.5,
      borderDash: [4, 2],
      tension: 0.3,
      fill: false,
      yAxisID: 'yFat',
      spanGaps: true,
    });
  }

  return { labels: labels.value, datasets };
});

const chartJsOptions = computed((): ChartOptions<'line'> => {
  const c = colors.value;
  const showFatAxis = props.showFat && hasFatData.value;

  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      tooltip: {
        backgroundColor: c.tooltipBg,
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 8,
        cornerRadius: 6,
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex;
            if (idx == null) return '';
            const d = props.data[idx];
            try {
              return format(parseISO(d.date), 'MMM d, yyyy', { locale: getDateFnsLocaleSync() });
            } catch {
              return d.date;
            }
          },
          label: (ctx) => {
            if (ctx.dataset.label === 'Average') return '';
            const val = ctx.parsed.y;
            if (val == null) return '';
            if (ctx.dataset.label === 'Fat %') return `Fat: ${val.toFixed(1)}%`;
            return `Yield: ${val.toFixed(1)}L`;
          },
        },
      },
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          color: c.axisText,
          usePointStyle: true,
          pointStyle: 'line',
          padding: 12,
          font: { size: 11 },
          filter: (item) => item.text !== 'Average' || true,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: c.axisText,
          font: { size: 10 },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7,
        },
        grid: { display: false },
      },
      y: {
        position: 'left',
        ticks: {
          color: c.axisText,
          font: { size: 10 },
        },
        grid: {
          color: c.gridLight,
        },
        title: {
          display: false,
        },
      },
      ...(showFatAxis
        ? {
            yFat: {
              position: 'right' as const,
              ticks: {
                color: c.warning,
                font: { size: 10 },
              },
              grid: { display: false },
            },
          }
        : {}),
    },
  };
});
</script>

<style lang="scss" scoped>
.yield-trend-chart {
  position: relative;
}
</style>
