<template>
  <q-card flat bordered class="q-mb-md rounded-borders">
    <q-card-section>
      <div class="text-subtitle2 q-mb-sm">{{ $t('simulation.recommendation.feedBreakdown') }}</div>
      <q-markup-table flat dense wrap-cells separator="horizontal" class="cost-table">
        <thead>
          <tr>
            <th class="text-left">{{ $t('simulation.recommendation.feedName') }}</th>
            <th class="text-right">{{ $t('simulation.recommendation.quantity') }}</th>
            <th class="text-right">{{ $t('simulation.feedSelect.pricePerKg') }}</th>
            <th class="text-right">{{ $t('simulation.recommendation.cost') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(feed, idx) in feeds" :key="idx">
            <td>{{ feed.feed_name || feed.name || '–' }}</td>
            <td class="text-right">{{ formatNum(feed.quantity_as_fed ?? feed.quantity ?? 0) }}</td>
            <td class="text-right">{{ formatCurrency(feed.price_per_kg ?? 0) }}</td>
            <td class="text-right">{{ formatCurrency(feedCost(feed)) }}</td>
          </tr>
        </tbody>
        <tfoot v-if="totalCost != null">
          <tr>
            <td colspan="3" class="text-right text-weight-bold">{{ $t('simulation.recommendation.totalCost') }}</td>
            <td class="text-right text-weight-bold">{{ formatCurrency(totalCost) }}</td>
          </tr>
        </tfoot>
      </q-markup-table>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCurrency } from 'src/composables/useCurrency';

/* eslint-disable @typescript-eslint/no-explicit-any */
const props = defineProps<{
  feeds: Array<Record<string, any>>;
}>();

const { formatCurrency } = useCurrency();

/** Coerce to a finite number, defaulting to 0. */
function toNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

const totalCost = computed(() => {
  if (props.feeds.length === 0) return null;
  return props.feeds.reduce((sum, f) => {
    const cost = f.cost != null
      ? toNum(f.cost)
      : toNum(f.quantity_as_fed ?? f.quantity) * toNum(f.price_per_kg);
    return sum + cost;
  }, 0);
});

function formatNum(n: number): string {
  return toNum(n).toFixed(2);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function feedCost(feed: Record<string, any>): number {
  return feed.cost != null
    ? toNum(feed.cost)
    : toNum(feed.quantity_as_fed ?? feed.quantity) * toNum(feed.price_per_kg);
}
</script>

<style lang="scss" scoped>
.rounded-borders {
  border-radius: $radius-loose;
  overflow: hidden;
}

.cost-table {
  @media screen and (max-width: 400px) {
    font-size: 0.85rem;

    th, td {
      padding: 4px 6px;
    }
  }
}
</style>
