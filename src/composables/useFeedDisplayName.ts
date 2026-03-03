import type { Feed } from 'src/lib/offline/db';

/**
 * Locale codes where the local/vernacular feed name should be preferred.
 * For these locales, `feed.name` (which is `local_name || fd_name` from the
 * API adapter) is shown first; for English or any other locale,
 * `feed.fd_name` (the English scientific/standard name) is preferred.
 */
const LOCAL_LOCALES = new Set([
  'hi', 'bn', 'sw', 'mr', 'te', 'ta', 'kn', 'gu', 'pa', 'or', 'ml', 'as',
  'ar', 'ur', // RTL locales also use local names
]);

/**
 * Returns the most appropriate display name for a feed given the user's locale.
 */
export function getFeedDisplayName(feed: Feed, locale: string): string {
  if (LOCAL_LOCALES.has(locale)) {
    return feed.name || feed.fd_name || '';
  }
  return feed.fd_name || feed.name || '';
}

/**
 * Returns the secondary/alternate name (the one NOT shown as display name),
 * or empty string if they're the same or unavailable.
 */
export function getFeedSecondaryName(feed: Feed, locale: string): string {
  const primary = getFeedDisplayName(feed, locale);
  const other = LOCAL_LOCALES.has(locale)
    ? (feed.fd_name || '')
    : (feed.local_name || feed.name || '');
  return other && other !== primary ? other : '';
}

/**
 * Centralized map from DB `fd_category` values to i18n keys.
 * Covers all 33 distinct categories in the master_feeds table.
 * Aliases (e.g. "Mineral" → same key as "Minerals") are included.
 */
export const CATEGORY_I18N_MAP: Record<string, string> = {
  // Original 8
  Concentrate: 'feed.categories.concentrate',
  Roughage: 'feed.categories.roughage',
  'Green Fodder': 'feed.categories.greenFodder',
  'Dry Fodder': 'feed.categories.dryFodder',
  Silage: 'feed.categories.silage',
  'By-product': 'feed.categories.byProduct',
  'Mineral Mix': 'feed.categories.mineralMix',
  Other: 'feed.categories.other',
  // Additional categories from DB
  Additive: 'feed.categories.additive',
  'Animal Protein': 'feed.categories.animalProtein',
  Aquatic: 'feed.categories.aquatic',
  'By-Product/Other': 'feed.categories.byProduct',
  'Cereal Hay': 'feed.categories.cerealHay',
  'Cereal Stover': 'feed.categories.cerealStover',
  'Cereal Straw': 'feed.categories.cerealStraw',
  'Energy Source': 'feed.categories.energySource',
  Forage: 'feed.categories.forage',
  Grain: 'feed.categories.grain',
  'Grain Crop Forage': 'feed.categories.grainCropForage',
  'Grain Substitute/By-product': 'feed.categories.grainSubstitute',
  Grass: 'feed.categories.grass',
  'Grass Hay': 'feed.categories.grassHay',
  'Grass/Legume Forage': 'feed.categories.grassLegumeForage',
  Legume: 'feed.categories.legume',
  'Legume Hay': 'feed.categories.legumeHay',
  'Legume Straw': 'feed.categories.legumeStraw',
  Mineral: 'feed.categories.minerals',
  Minerals: 'feed.categories.minerals',
  'Mixed Forage': 'feed.categories.mixedForage',
  'Non-Protein Nitrogen': 'feed.categories.nonProteinNitrogen',
  'Oilseed Meal': 'feed.categories.oilseedMeal',
  'Oilseed Straw': 'feed.categories.oilseedStraw',
  'Plant Protein': 'feed.categories.plantProtein',
  'Protein Supplement': 'feed.categories.proteinSupplement',
  Shrub: 'feed.categories.shrub',
  Stover: 'feed.categories.stover',
  Straw: 'feed.categories.straw',
  Succulent: 'feed.categories.succulent',
  'Tree Leaf': 'feed.categories.treeLeaves',
  'Tree Leaves': 'feed.categories.treeLeaves',
};

/**
 * Translate a feed category using the i18n system.
 * Falls back to the raw category string if no translation key exists.
 */
export function translateCategory(category: string, t: (key: string) => string): string {
  const key = CATEGORY_I18N_MAP[category];
  return key ? t(key) : category;
}
