import { computed, type Ref } from 'vue';
import { useFeedsStore } from 'src/stores/feeds';
import type { Feed } from 'src/lib/offline/db';

type Goal = 'minimize_cost' | 'maximize_milk' | 'balanced';

/**
 * Quotas by fd_type (the backend's primary feed grouping).
 * "Forage" = grasses, legumes, straws, fodders
 * "Concentrate" = grains, oilseed meals, minerals, by-products
 */
const TYPE_QUOTAS: Record<string, number> = {
  Forage: 6,
  Concentrate: 7,
};
const DEFAULT_TYPE_QUOTA = 1;

/** Max feeds to pick from any single fd_category within a type */
const MAX_PER_SUBCATEGORY = 2;

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
 * Goal-aware sort: ranks feeds within a subcategory.
 * - minimize_cost: cheapest first, tie-break by nutrition
 * - maximize_milk: highest nutrition first (CP + TDN)
 * - balanced: best nutrition-per-rupee ratio
 */
function buildSortFn(goal: Goal): (a: Feed, b: Feed) => number {
  switch (goal) {
    case 'minimize_cost':
      return (a, b) => {
        const aPrice = a.price_per_kg ?? Infinity;
        const bPrice = b.price_per_kg ?? Infinity;
        if (aPrice !== bPrice) return aPrice - bPrice;
        return ((b.cp_percentage ?? 0) + (b.tdn_percentage ?? 0)) -
               ((a.cp_percentage ?? 0) + (a.tdn_percentage ?? 0));
      };

    case 'maximize_milk':
      return (a, b) => {
        const aNutrition = (a.cp_percentage ?? 0) + (a.tdn_percentage ?? 0);
        const bNutrition = (b.cp_percentage ?? 0) + (b.tdn_percentage ?? 0);
        if (bNutrition !== aNutrition) return bNutrition - aNutrition;
        const aHasPrice = (a.price_per_kg ?? 0) > 0 ? 1 : 0;
        const bHasPrice = (b.price_per_kg ?? 0) > 0 ? 1 : 0;
        return bHasPrice - aHasPrice;
      };

    case 'balanced':
    default:
      return (a, b) => {
        const aPrice = a.price_per_kg && a.price_per_kg > 0 ? a.price_per_kg : 10;
        const bPrice = b.price_per_kg && b.price_per_kg > 0 ? b.price_per_kg : 10;
        const aValue = ((a.cp_percentage ?? 0) + (a.tdn_percentage ?? 0)) / aPrice;
        const bValue = ((b.cp_percentage ?? 0) + (b.tdn_percentage ?? 0)) / bPrice;
        return bValue - aValue;
      };
  }
}

/**
 * Select feeds from a single fd_type group, ensuring subcategory diversity.
 *
 * 1. Subgroup feeds by fd_category
 * 2. From each subcategory, take up to MAX_PER_SUBCATEGORY (priority feeds first, then goal-sorted)
 * 3. Combine and trim to the type quota
 */
function selectFromType(feeds: Feed[], quota: number, goal: Goal): Feed[] {
  // Subgroup by fd_category
  const subcategories: Record<string, Feed[]> = {};
  for (const f of feeds) {
    const cat = f.category || 'Other';
    if (!subcategories[cat]) subcategories[cat] = [];
    subcategories[cat].push(f);
  }

  const sortFn = buildSortFn(goal);
  const picked: Feed[] = [];

  // Round-robin: pick 1 from each subcategory, then repeat up to MAX_PER_SUBCATEGORY
  const catEntries = Object.entries(subcategories);

  // Sort each subcategory internally: priority first, then by goal
  for (const [, catFeeds] of catEntries) {
    const priority: Feed[] = [];
    const rest: Feed[] = [];
    for (const f of catFeeds) {
      if (isPriorityFeed(f)) priority.push(f);
      else rest.push(f);
    }
    priority.sort(sortFn);
    rest.sort(sortFn);
    catFeeds.length = 0;
    catFeeds.push(...priority, ...rest);
  }

  // Sort subcategories so the ones with priority feeds come first
  catEntries.sort((a, b) => {
    const aHasPriority = a[1].some((f) => isPriorityFeed(f)) ? 0 : 1;
    const bHasPriority = b[1].some((f) => isPriorityFeed(f)) ? 0 : 1;
    return aHasPriority - bHasPriority;
  });

  for (let round = 0; round < MAX_PER_SUBCATEGORY && picked.length < quota; round++) {
    for (const [, catFeeds] of catEntries) {
      if (picked.length >= quota) break;
      if (round < catFeeds.length) {
        picked.push(catFeeds[round]);
      }
    }
  }

  return picked.slice(0, quota);
}

export function useAutoFeedSelection(goal: Ref<Goal>) {
  const feedsStore = useFeedsStore();

  const autoSelectedFeeds = computed<Feed[]>(() => {
    const allFeeds = feedsStore.allFeeds;
    if (allFeeds.length === 0) return [];

    const currentGoal = goal.value;

    // Group by fd_type (primary grouping: "Forage" vs "Concentrate")
    const grouped: Record<string, Feed[]> = {};
    for (const feed of allFeeds) {
      const type = feed.fd_type || 'Other';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(feed);
    }

    const selected: Feed[] = [];

    for (const [type, feeds] of Object.entries(grouped)) {
      const quota = TYPE_QUOTAS[type] ?? DEFAULT_TYPE_QUOTA;
      selected.push(...selectFromType(feeds, quota, currentGoal));
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
