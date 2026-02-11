<template>
  <q-card flat bordered class="report-preview">
    <q-card-section>
      <div class="text-subtitle1 q-mb-md">
        <q-icon name="summarize" class="q-mr-sm" />
        {{ $t('reports.summary') }}
      </div>

      <!-- Milk Production Report -->
      <template v-if="reportType === 'milk_production'">
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-6">
            <div class="stat-inline">
              <div class="text-h6 text-primary">{{ summaryData.totalLiters || '—' }}</div>
              <div class="text-caption">{{ $t('reports.preview.totalMilk') }}</div>
            </div>
          </div>
          <div class="col-6">
            <div class="stat-inline">
              <div class="text-h6 text-positive">{{ summaryData.avgDaily || '—' }}</div>
              <div class="text-caption">{{ $t('reports.preview.avgDaily') }}</div>
            </div>
          </div>
          <div class="col-6">
            <div class="stat-inline">
              <div class="text-h6 text-warning">{{ summaryData.avgFat || '—' }}%</div>
              <div class="text-caption">{{ $t('reports.preview.avgFat') }}</div>
            </div>
          </div>
          <div class="col-6">
            <div class="stat-inline">
              <div class="text-h6 text-purple">{{ summaryData.cowCount || '—' }}</div>
              <div class="text-caption">{{ $t('reports.preview.cowCount') }}</div>
            </div>
          </div>
        </div>
      </template>

      <!-- Diet Report -->
      <template v-else-if="reportType === 'diet_analysis'">
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-6">
            <div class="stat-inline">
              <div class="text-h6 text-primary">{{ summaryData.dietCount || '—' }}</div>
              <div class="text-caption">{{ $t('reports.preview.dietsGenerated') }}</div>
            </div>
          </div>
          <div class="col-6">
            <div class="stat-inline">
              <div class="text-h6 text-positive">{{ summaryData.avgCost || '—' }}</div>
              <div class="text-caption">{{ $t('reports.preview.avgDailyCost') }}</div>
            </div>
          </div>
        </div>
      </template>

      <!-- Farmer Summary Report -->
      <template v-else-if="reportType === 'farmer_summary'">
        <div class="row q-col-gutter-sm q-mb-md">
          <div class="col-4">
            <div class="stat-inline">
              <div class="text-h6 text-teal">{{ summaryData.farmerCount || '—' }}</div>
              <div class="text-caption">{{ $t('reports.preview.farmers') }}</div>
            </div>
          </div>
          <div class="col-4">
            <div class="stat-inline">
              <div class="text-h6 text-primary">{{ summaryData.totalCows || '—' }}</div>
              <div class="text-caption">{{ $t('reports.preview.totalCows') }}</div>
            </div>
          </div>
          <div class="col-4">
            <div class="stat-inline">
              <div class="text-h6 text-positive">{{ summaryData.totalMilk || '—' }}</div>
              <div class="text-caption">{{ $t('reports.preview.totalMilk') }}</div>
            </div>
          </div>
        </div>
      </template>

      <!-- Generic Fallback -->
      <template v-else>
        <div class="text-center q-pa-md text-grey-6">
          <q-icon name="article" size="48px" class="q-mb-sm" />
          <div>{{ $t('reports.preview.noPreview') }}</div>
        </div>
      </template>

      <!-- Date Range -->
      <div v-if="parameters.start_date" class="text-caption text-grey-6 q-mt-sm">
        <q-icon name="date_range" size="14px" class="q-mr-xs" />
        {{ parameters.start_date }} — {{ parameters.end_date }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  reportType: string;
  parameters: Record<string, unknown>;
  reportData?: Record<string, unknown>;
}>();

const summaryData = computed(() => {
  const data = props.reportData || {};
  const params = props.parameters || {};

  switch (props.reportType) {
    case 'milk_production':
      return {
        totalLiters: data.total_liters ? `${Number(data.total_liters).toFixed(0)}L` : params.total_liters,
        avgDaily: data.avg_daily ? `${Number(data.avg_daily).toFixed(1)}L` : params.avg_daily,
        avgFat: data.avg_fat_percentage ?? params.avg_fat_percentage ?? '—',
        cowCount: data.cow_count ?? params.cow_count,
      };
    case 'diet_analysis':
      return {
        dietCount: data.diet_count ?? params.diet_count,
        avgCost: data.avg_daily_cost ?? params.avg_daily_cost,
      };
    case 'farmer_summary':
      return {
        farmerCount: data.farmer_count ?? params.farmer_count,
        totalCows: data.total_cows ?? params.total_cows,
        totalMilk: data.total_milk ? `${Number(data.total_milk).toFixed(0)}L` : params.total_milk,
      };
    default:
      return {};
  }
});
</script>

<style lang="scss" scoped>
.report-preview {
  border-radius: 12px;
}
</style>
