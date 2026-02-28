import type { Feed } from 'src/lib/offline/db';

/**
 * Locale codes where the local/vernacular feed name should be preferred.
 * For these locales, `feed.name` (which is `local_name || fd_name` from the
 * API adapter) is shown first; for English or any other locale,
 * `feed.fd_name` (the English scientific/standard name) is preferred.
 */
const LOCAL_LOCALES = new Set([
  'hi', 'bn', 'sw', 'mr', 'te', 'ta', 'kn', 'gu', 'pa', 'or',
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
