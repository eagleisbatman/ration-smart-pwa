import { computed, type Ref } from 'vue';
import { useFeedsStore } from 'src/stores/feeds';
import type { Feed } from 'src/lib/offline/db';

type Goal = 'minimize_cost' | 'maximize_milk' | 'balanced';

/** Category quotas for auto-selection — how many feeds to pick per category */
const CATEGORY_QUOTAS: Record<string, number> = {
  'Green Fodder': 3,
  'Dry Roughage': 2,
  'Concentrate': 3,
  'Oil Cake': 2,
  'Mineral Supplement': 2,
};
const DEFAULT_QUOTA = 1;

/** Common feed names that get priority boost (case-insensitive partial match) */
const PRIORITY_FEEDS = [
  'hybrid napier',
  'maize',
  'rice straw',
  'wheat bran',
  'mustard cake',
  'common salt',
  'mineral premix',
  'sorghum',
  'lucerne',
  'ground nut cake',
  'cotton seed cake',
  'bajra',
  'berseem',
  'oat fodder',
];

function isPriorityFeed(feed: Feed): boolean {
  const name = feed.name.toLowerCase();
  const fdName = feed.fd_name?.toLowerCase() ?? '';
  return PRIORITY_FEEDS.some((p) => name.includes(p) || fdName.includes(p));
}

/**
 * Build a goal-aware sort function for feed ranking within a category.
 *
 * - minimize_cost: cheapest feeds first (low price_per_kg), then by nutrition
 * - maximize_milk: most nutritious feeds first (high CP + TDN), then by price
 * - balanced: score = nutrition / price (best value per rupee)
 *
 * Priority feeds always come first within each strategy.
 */
function buildSortFn(goal: Goal): (a: Feed, b: Feed) => number {
  switch (goal) {
    case 'minimize_cost':
      return (a, b) => {
        // Feeds with price data first
        const aPrice = a.price_per_kg ?? Infinity;
        const bPrice = b.price_per_kg ?? Infinity;
        if (aPrice !== bPrice) return aPrice - bPrice; // cheapest first
        // Tie-break: higher nutrition
        return ((b.cp_percentage ?? 0) + (b.tdn_percentage ?? 0)) -
               ((a.cp_percentage ?? 0) + (a.tdn_percentage ?? 0));
      };

    case 'maximize_milk':
      return (a, b) => {
        // Highest nutrition first (CP + TDN as a combined score)
        const aNutrition = (a.cp_percentage ?? 0) + (a.tdn_percentage ?? 0);
        const bNutrition = (b.cp_percentage ?? 0) + (b.tdn_percentage ?? 0);
        if (bNutrition !== aNutrition) return bNutrition - aNutrition;
        // Tie-break: prefer feeds with price data
        const aHasPrice = (a.price_per_kg ?? 0) > 0 ? 1 : 0;
        const bHasPrice = (b.price_per_kg ?? 0) > 0 ? 1 : 0;
        return bHasPrice - aHasPrice;
      };

    case 'balanced':
    default:
      return (a, b) => {
        // Best value: nutrition per unit cost
        const aPrice = a.price_per_kg && a.price_per_kg > 0 ? a.price_per_kg : 10; // fallback
        const bPrice = b.price_per_kg && b.price_per_kg > 0 ? b.price_per_kg : 10;
        const aValue = ((a.cp_percentage ?? 0) + (a.tdn_percentage ?? 0)) / aPrice;
        const bValue = ((b.cp_percentage ?? 0) + (b.tdn_percentage ?? 0)) / bPrice;
        return bValue - aValue; // highest value first
      };
  }
}

function selectFromCategory(feeds: Feed[], quota: number, goal: Goal): Feed[] {
  const priority: Feed[] = [];
  const rest: Feed[] = [];

  for (const f of feeds) {
    if (isPriorityFeed(f)) priority.push(f);
    else rest.push(f);
  }

  const sortFn = buildSortFn(goal);
  priority.sort(sortFn);
  rest.sort(sortFn);

  const combined = [...priority, ...rest];
  return combined.slice(0, quota);
}

export function useAutoFeedSelection(goal: Ref<Goal>) {
  const feedsStore = useFeedsStore();

  const autoSelectedFeeds = computed<Feed[]>(() => {
    const allFeeds = feedsStore.allFeeds;
    if (allFeeds.length === 0) return [];

    const currentGoal = goal.value;

    // Group by category
    const grouped: Record<string, Feed[]> = {};
    for (const feed of allFeeds) {
      const cat = feed.category || 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(feed);
    }

    const selected: Feed[] = [];

    for (const [category, feeds] of Object.entries(grouped)) {
      const quota = CATEGORY_QUOTAS[category] ?? DEFAULT_QUOTA;
      selected.push(...selectFromCategory(feeds, quota, currentGoal));
    }

    return selected;
  });

  const autoSelectedFeedIds = computed<string[]>(() =>
    autoSelectedFeeds.value.map((f) => f.id)
  );

  return {
    autoSelectedFeeds,
    autoSelectedFeedIds,
  };
}
