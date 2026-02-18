import { computed } from 'vue';
import { useFeedsStore } from 'src/stores/feeds';
import type { Feed } from 'src/lib/offline/db';

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

function selectFromCategory(feeds: Feed[], quota: number): Feed[] {
  // Partition: priority feeds first, then non-priority
  const priority: Feed[] = [];
  const rest: Feed[] = [];

  for (const f of feeds) {
    if (isPriorityFeed(f)) priority.push(f);
    else rest.push(f);
  }

  // Within each group: prefer feeds with price > 0, then sort by CP% descending
  const sortFn = (a: Feed, b: Feed) => {
    const aHasPrice = (a.price_per_kg ?? 0) > 0 ? 1 : 0;
    const bHasPrice = (b.price_per_kg ?? 0) > 0 ? 1 : 0;
    if (aHasPrice !== bHasPrice) return bHasPrice - aHasPrice;
    return (b.cp_percentage ?? 0) - (a.cp_percentage ?? 0);
  };

  priority.sort(sortFn);
  rest.sort(sortFn);

  const combined = [...priority, ...rest];
  return combined.slice(0, quota);
}

export function useAutoFeedSelection() {
  const feedsStore = useFeedsStore();

  const autoSelectedFeeds = computed<Feed[]>(() => {
    const allFeeds = feedsStore.allFeeds;
    if (allFeeds.length === 0) return [];

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
      selected.push(...selectFromCategory(feeds, quota));
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
