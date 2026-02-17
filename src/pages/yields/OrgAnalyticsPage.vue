<template>
  <q-page class="q-pa-md">
    <PullToRefresh @refresh="onRefresh">
      <!-- No Organization -->
      <template v-if="!orgId">
        <EmptyState
          icon="business"
          :title="$t('analytics.noOrg.title')"
          :description="$t('analytics.noOrg.description')"
          :action-label="$t('analytics.noOrg.action')"
          @action="router.push('/settings')"
        />
      </template>

      <template v-else>
        <!-- Loading -->
        <template v-if="loading && !analytics">
          <SkeletonCard />
          <SkeletonCard class="q-mt-md" />
        </template>

        <!-- Error -->
        <q-banner v-if="error" dense class="bg-negative text-white q-mb-md" rounded>
          {{ error }}
          <template #action>
            <q-btn flat label="Retry" @click="loadAnalytics" />
          </template>
        </q-banner>

        <!-- Summary Cards -->
        <div v-if="analytics" class="row q-col-gutter-sm q-mb-md">
          <div class="col-6">
            <q-card flat bordered class="text-center q-pa-sm">
              <div class="text-h5 text-primary">{{ analytics.total_farmers }}</div>
              <div class="text-caption text-grey-7">{{ $t('analytics.totalFarmers') }}</div>
            </q-card>
          </div>
          <div class="col-6">
            <q-card flat bordered class="text-center q-pa-sm">
              <div class="text-h5 text-secondary">{{ analytics.total_records }}</div>
              <div class="text-caption text-grey-7">{{ $t('analytics.totalRecords') }}</div>
            </q-card>
          </div>
          <div class="col-6">
            <q-card flat bordered class="text-center q-pa-sm">
              <div class="text-h5 text-accent">{{ formatAvg(analytics.avg_milk_yield) }}L</div>
              <div class="text-caption text-grey-7">{{ $t('analytics.avgDailyYield') }}</div>
            </q-card>
          </div>
          <div class="col-6">
            <q-card flat bordered class="text-center q-pa-sm">
              <div class="text-h5 text-info">{{ formatAvg(analytics.avg_fat_percentage) }}%</div>
              <div class="text-caption text-grey-7">{{ $t('analytics.avgFat') }}</div>
            </q-card>
          </div>
        </div>

        <!-- Yield Trend Chart -->
        <q-card v-if="trendData.length > 0" flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ $t('analytics.yieldTrend') }}</div>
            <svg
              :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
              :width="chartWidth"
              :height="chartHeight"
              class="trend-chart"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="org-trend-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--q-primary)" stop-opacity="0.3" />
                  <stop offset="100%" stop-color="var(--q-primary)" stop-opacity="0.02" />
                </linearGradient>
              </defs>
              <path :d="areaPath" fill="url(#org-trend-gradient)" />
              <polyline
                :points="trendPoints"
                fill="none"
                stroke="var(--q-primary)"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle
                v-for="(point, idx) in trendDataPoints"
                :key="idx"
                :cx="point.x"
                :cy="point.y"
                :r="3"
                fill="var(--q-primary)"
              />
            </svg>
            <div class="row justify-between text-caption text-grey-5 q-mt-xs">
              <span v-for="(label, idx) in trendLabels" :key="idx">{{ label }}</span>
            </div>
          </q-card-section>
        </q-card>

        <!-- Top Farmers by Yield -->
        <q-card v-if="topFarmers.length > 0" flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ $t('analytics.topFarmers') }}</div>
            <div
              v-for="(farmer, idx) in topFarmers"
              :key="farmer.id"
              class="row items-center q-mb-sm"
            >
              <q-avatar size="28px" color="primary" text-color="white" class="q-mr-sm">
                {{ idx + 1 }}
              </q-avatar>
              <div class="col">
                <div class="text-body2">{{ farmer.name }}</div>
                <q-linear-progress
                  :value="farmer.total / (topFarmers[0]?.total || 1)"
                  color="primary"
                  size="6px"
                  rounded
                  class="q-mt-xs"
                />
              </div>
              <div class="text-body2 text-weight-bold text-primary q-ml-sm">
                {{ farmer.total.toFixed(1) }}L
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Yield by District -->
        <q-card v-if="districtData.length > 0" flat bordered class="q-mb-md">
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium q-mb-sm">{{ $t('analytics.yieldByDistrict') }}</div>
            <q-markup-table flat bordered dense separator="horizontal">
              <thead>
                <tr>
                  <th class="text-left">{{ $t('analytics.district') }}</th>
                  <th class="text-right">{{ $t('analytics.farmers') }}</th>
                  <th class="text-right">{{ $t('analytics.avgYield') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in districtData" :key="d.district">
                  <td>{{ d.district }}</td>
                  <td class="text-right">{{ d.farmerCount }}</td>
                  <td class="text-right text-weight-bold">{{ d.avgYield.toFixed(1) }}L</td>
                </tr>
              </tbody>
            </q-markup-table>
          </q-card-section>
        </q-card>

        <!-- Empty state when analytics loaded but nothing meaningful -->
        <EmptyState
          v-if="analytics && analytics.total_records === 0"
          icon="analytics"
          :title="$t('analytics.empty.title')"
          :description="$t('analytics.empty.description')"
          :action-label="$t('analytics.empty.action')"
          @action="router.push({ name: 'log-new' })"
        />
      </template>
    </PullToRefresh>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { format, subMonths, parseISO } from 'date-fns';
import { useYieldsStore } from 'src/stores/yields';
import { useFarmersStore } from 'src/stores/farmers';
import { useAuthStore } from 'src/stores/auth';
import PullToRefresh from 'src/components/ui/PullToRefresh.vue';
import SkeletonCard from 'src/components/ui/SkeletonCard.vue';
import EmptyState from 'src/components/ui/EmptyState.vue';

const router = useRouter();
const yieldsStore = useYieldsStore();
const farmersStore = useFarmersStore();
const authStore = useAuthStore();

const orgId = computed(() => authStore.user?.organization_id || null);
const analytics = computed(() => yieldsStore.analytics);
const loading = computed(() => yieldsStore.loading);
const error = computed(() => yieldsStore.error);

const chartWidth = 280;
const chartHeight = 100;
const paddingX = 8;
const paddingY = 8;

function formatAvg(val: number | null | undefined): string {
  if (val == null) return '0.0';
  return val.toFixed(1);
}

/** Top 5 farmers by total yield from local yield records */
const topFarmers = computed(() => {
  const farmerMap = new Map<string, { id: string; name: string; total: number }>();

  for (const yld of yieldsStore.yieldRecords) {
    if (yld._deleted || !yld.milk_yield_liters) continue;
    const existing = farmerMap.get(yld.farmer_profile_id);
    if (existing) {
      existing.total += yld.milk_yield_liters;
    } else {
      const farmer = farmersStore.activeFarmers.find((f) => f.id === yld.farmer_profile_id);
      farmerMap.set(yld.farmer_profile_id, {
        id: yld.farmer_profile_id,
        name: farmer?.name || 'Unknown',
        total: yld.milk_yield_liters,
      });
    }
  }

  return [...farmerMap.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
});

/** Yield by district from farmer profiles */
const districtData = computed(() => {
  const districtMap = new Map<string, { farmerIds: Set<string>; totalYield: number; count: number }>();

  for (const yld of yieldsStore.yieldRecords) {
    if (yld._deleted || !yld.milk_yield_liters) continue;
    const farmer = farmersStore.activeFarmers.find((f) => f.id === yld.farmer_profile_id);
    const district = farmer?.district || 'Unknown';

    const existing = districtMap.get(district);
    if (existing) {
      existing.farmerIds.add(yld.farmer_profile_id);
      existing.totalYield += yld.milk_yield_liters;
      existing.count += 1;
    } else {
      districtMap.set(district, {
        farmerIds: new Set([yld.farmer_profile_id]),
        totalYield: yld.milk_yield_liters,
        count: 1,
      });
    }
  }

  return [...districtMap.entries()]
    .map(([district, data]) => ({
      district,
      farmerCount: data.farmerIds.size,
      avgYield: data.count > 0 ? data.totalYield / data.count : 0,
    }))
    .sort((a, b) => b.avgYield - a.avgYield);
});

/** Monthly yield trend (last 6 months) from local records */
interface MonthlyTotal {
  month: string;
  label: string;
  total: number;
}

const trendData = computed((): MonthlyTotal[] => {
  const months: MonthlyTotal[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStr = format(monthDate, 'yyyy-MM');
    months.push({
      month: monthStr,
      label: format(monthDate, 'MMM'),
      total: 0,
    });
  }

  for (const yld of yieldsStore.yieldRecords) {
    if (yld._deleted || !yld.milk_yield_liters) continue;
    const monthStr = yld.collection_date.substring(0, 7);
    const entry = months.find((m) => m.month === monthStr);
    if (entry) {
      entry.total += yld.milk_yield_liters;
    }
  }

  return months;
});

const trendDataPoints = computed(() => {
  const data = trendData.value;
  if (data.length === 0) return [];

  const values = data.map((d) => d.total);
  const maxVal = Math.max(...values, 0.1);
  const cw = chartWidth - paddingX * 2;
  const ch = chartHeight - paddingY * 2;

  return data.map((d, idx) => {
    const x = paddingX + (idx / Math.max(data.length - 1, 1)) * cw;
    const y = paddingY + ch - (d.total / maxVal) * ch;
    return { x, y };
  });
});

const trendPoints = computed(() =>
  trendDataPoints.value.map((p) => `${p.x},${p.y}`).join(' ')
);

const areaPath = computed(() => {
  const points = trendDataPoints.value;
  if (points.length === 0) return '';

  const bottom = chartHeight - paddingY;
  let d = `M ${points[0].x},${bottom}`;
  for (const p of points) {
    d += ` L ${p.x},${p.y}`;
  }
  d += ` L ${points[points.length - 1].x},${bottom} Z`;
  return d;
});

const trendLabels = computed(() => trendData.value.map((d) => d.label));

async function loadAnalytics() {
  if (!orgId.value) return;

  // Fetch org analytics from backend
  await yieldsStore.fetchOrganizationAnalytics(orgId.value);

  // Also load yield records and farmers for local charts
  await Promise.all([
    yieldsStore.fetchYieldHistory(),
    farmersStore.fetchFarmers(),
  ]);
}

async function onRefresh(done: () => void) {
  await loadAnalytics();
  done();
}

onMounted(() => {
  loadAnalytics();
});
</script>

<style lang="scss" scoped>
.trend-chart {
  width: 100%;
  height: auto;
  display: block;
}
</style>
