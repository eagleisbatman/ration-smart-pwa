/**
 * Date Formatting Composable
 * Provides locale-aware date formatting using date-fns
 *
 * Supports all app locales with lazy loading of date-fns locale modules
 */

import { computed } from 'vue';
import {
  format,
  formatDistance,
  formatRelative as dateFnsFormatRelative,
  parseISO,
  isValid,
} from 'date-fns';
import type { Locale } from 'date-fns';
import { getLocale } from 'src/boot/i18n';

// Cache for loaded locales to avoid re-importing
const localeCache = new Map<string, Locale>();

/**
 * Load a date-fns locale dynamically
 * date-fns v3 uses named exports, not default exports
 */
async function loadDateFnsLocale(localeCode: string): Promise<Locale | null> {
  try {
    switch (localeCode) {
      // Available in date-fns
      case 'en':
        return (await import('date-fns/locale/en-US')).enUS;
      case 'hi':
        return (await import('date-fns/locale/hi')).hi;
      case 'te':
        return (await import('date-fns/locale/te')).te;
      case 'kn':
        return (await import('date-fns/locale/kn')).kn;
      case 'ta':
        return (await import('date-fns/locale/ta')).ta;
      case 'gu':
        return (await import('date-fns/locale/gu')).gu;
      case 'bn':
        return (await import('date-fns/locale/bn')).bn;
      case 'vi':
        return (await import('date-fns/locale/vi')).vi;
      case 'id':
        return (await import('date-fns/locale/id')).id;
      case 'th':
        return (await import('date-fns/locale/th')).th;
      case 'ar':
        return (await import('date-fns/locale/ar')).ar;
      case 'fr':
        return (await import('date-fns/locale/fr')).fr;

      // Not available in date-fns - use closest alternatives
      case 'mr': // Marathi - use Hindi as closest alternative
        return (await import('date-fns/locale/hi')).hi;
      case 'ml': // Malayalam - not available, fallback to English
        return (await import('date-fns/locale/en-US')).enUS;
      case 'pa': // Punjabi - not available, fallback to English
        return (await import('date-fns/locale/en-US')).enUS;
      case 'ur': // Urdu - not available, use Arabic as closest alternative
        return (await import('date-fns/locale/ar')).ar;
      case 'or': // Odia - not available, fallback to English
        return (await import('date-fns/locale/en-US')).enUS;
      case 'as': // Assamese - not available, use Bengali as closest alternative
        return (await import('date-fns/locale/bn')).bn;
      case 'ne': // Nepali - not available, use Hindi as closest alternative
        return (await import('date-fns/locale/hi')).hi;
      case 'am': // Amharic - not available, fallback to English
        return (await import('date-fns/locale/en-US')).enUS;
      case 'om': // Oromo - not available, fallback to English
        return (await import('date-fns/locale/en-US')).enUS;
      case 'fil': // Filipino - not available, fallback to English
        return (await import('date-fns/locale/en-US')).enUS;

      default:
        return null;
    }
  } catch (error) {
    console.warn(`Failed to load date-fns locale for "${localeCode}":`, error);
    return null;
  }
}

// Default locale (English) loaded synchronously for immediate use
let defaultLocale: Locale | null = null;

/**
 * Load the default English locale
 */
async function ensureDefaultLocale(): Promise<Locale> {
  if (!defaultLocale) {
    const module = await import('date-fns/locale/en-US');
    defaultLocale = module.enUS;
    localeCache.set('en', defaultLocale);
  }
  return defaultLocale;
}

/**
 * Get date-fns locale for the current app locale
 * Returns cached locale if available, otherwise loads and caches it
 */
async function getDateFnsLocale(): Promise<Locale> {
  const appLocale = getLocale();

  // Check cache first
  if (localeCache.has(appLocale)) {
    return localeCache.get(appLocale)!;
  }

  // Try to load the locale
  const locale = await loadDateFnsLocale(appLocale);
  if (locale) {
    localeCache.set(appLocale, locale);
    return locale;
  }

  // Fallback to English
  return ensureDefaultLocale();
}

/**
 * Get locale synchronously from cache (returns English if not cached)
 */
function getDateFnsLocaleSync(): Locale | undefined {
  const appLocale = getLocale();
  return localeCache.get(appLocale) || localeCache.get('en');
}

/**
 * Parse a date input into a Date object.
 * Backend stores timestamps as naive UTC (no timezone suffix).
 * If the string looks like an ISO datetime without timezone info, append 'Z'
 * so it's correctly interpreted as UTC rather than local time.
 */
function parseDate(date: Date | string | number): Date {
  if (date instanceof Date) {
    return date;
  }
  if (typeof date === 'number') {
    return new Date(date);
  }
  // If the string looks like an ISO datetime without timezone info (no Z, +, or -)
  // and contains a 'T' (datetime, not just date), treat it as UTC
  let dateStr = date;
  if (
    dateStr.includes('T') &&
    !dateStr.endsWith('Z') &&
    !/[+-]\d{2}:\d{2}$/.test(dateStr)
  ) {
    dateStr = dateStr + 'Z';
  }
  // Try ISO string parsing first
  const parsed = parseISO(dateStr);
  if (isValid(parsed)) {
    return parsed;
  }
  // Fallback to Date constructor
  return new Date(date);
}

/**
 * Date formatting composable
 *
 * @example
 * ```vue
 * const { formatDate, formatRelative, formatDateRange } = useDateFormat();
 *
 * // Format a date
 * formatDate('2024-01-15'); // "Jan 15, 2024" (in user's locale)
 * formatDate('2024-01-15', 'PPPP'); // "Monday, January 15th, 2024"
 *
 * // Relative time
 * formatRelative('2024-01-13'); // "2 days ago" (localized)
 *
 * // Date range
 * formatDateRange('2024-01-01', '2024-01-15'); // "Jan 1 - Jan 15, 2024"
 * ```
 */
export function useDateFormat() {
  // Reactive current locale
  const currentLocale = computed(() => getLocale());

  // Preload locale on composable init
  getDateFnsLocale();

  /**
   * Format a date with the user's locale
   *
   * @param date - Date to format (Date object, ISO string, or timestamp)
   * @param formatStr - date-fns format string (default: 'PP')
   * @returns Formatted date string
   *
   * Common format tokens:
   * - 'MMM d, yyyy' -> "Jan 15, 2024"
   * - 'PPPP' -> "Monday, January 15th, 2024" (localized long date)
   * - 'PP' -> "Jan 15, 2024" (localized medium date)
   * - 'P' -> "01/15/2024" (localized short date)
   * - 'p' -> "12:00 AM" (localized time)
   * - 'PPp' -> "Jan 15, 2024, 12:00 AM" (localized date and time)
   */
  function formatDate(
    date: Date | string | number,
    formatStr: string = 'PP'
  ): string {
    try {
      const dateObj = parseDate(date);
      if (!isValid(dateObj)) {
        console.warn('Invalid date provided to formatDate:', date);
        return String(date);
      }

      const locale = getDateFnsLocaleSync();
      return format(dateObj, formatStr, { locale });
    } catch (error) {
      console.error('Error formatting date:', error);
      return String(date);
    }
  }

  /**
   * Format a date as relative time (e.g., "2 days ago", "in 3 hours")
   *
   * @param date - Date to format
   * @param baseDate - Reference date (default: now)
   * @returns Localized relative time string
   */
  function formatRelative(
    date: Date | string | number,
    baseDate: Date | string | number = new Date()
  ): string {
    try {
      const dateObj = parseDate(date);
      const baseDateObj = parseDate(baseDate);

      if (!isValid(dateObj) || !isValid(baseDateObj)) {
        console.warn('Invalid date provided to formatRelative:', date);
        return String(date);
      }

      const locale = getDateFnsLocaleSync();
      return formatDistance(dateObj, baseDateObj, {
        addSuffix: true,
        locale,
      });
    } catch (error) {
      console.error('Error formatting relative date:', error);
      return String(date);
    }
  }

  /**
   * Format a date range (e.g., "Jan 1 - Jan 15, 2024")
   *
   * @param start - Start date
   * @param end - End date
   * @returns Formatted date range string
   */
  function formatDateRange(
    start: Date | string | number,
    end: Date | string | number
  ): string {
    try {
      const startDate = parseDate(start);
      const endDate = parseDate(end);

      if (!isValid(startDate) || !isValid(endDate)) {
        console.warn('Invalid date provided to formatDateRange:', start, end);
        return `${String(start)} - ${String(end)}`;
      }

      const locale = getDateFnsLocaleSync();
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      const startMonth = startDate.getMonth();
      const endMonth = endDate.getMonth();

      // Same year
      if (startYear === endYear) {
        // Same month
        if (startMonth === endMonth) {
          return `${format(startDate, 'MMM d', { locale })} - ${format(endDate, 'd, yyyy', { locale })}`;
        }
        // Different months, same year
        return `${format(startDate, 'MMM d', { locale })} - ${format(endDate, 'MMM d, yyyy', { locale })}`;
      }

      // Different years
      return `${format(startDate, 'MMM d, yyyy', { locale })} - ${format(endDate, 'MMM d, yyyy', { locale })}`;
    } catch (error) {
      console.error('Error formatting date range:', error);
      return `${String(start)} - ${String(end)}`;
    }
  }

  /**
   * Format a date relative to today with natural language
   * Uses date-fns formatRelative for "today", "yesterday", "last Monday", etc.
   *
   * @param date - Date to format
   * @param baseDate - Reference date (default: now)
   * @returns Localized relative date string
   */
  function formatRelativeDate(
    date: Date | string | number,
    baseDate: Date | string | number = new Date()
  ): string {
    try {
      const dateObj = parseDate(date);
      const baseDateObj = parseDate(baseDate);

      if (!isValid(dateObj) || !isValid(baseDateObj)) {
        return String(date);
      }

      const locale = getDateFnsLocaleSync();
      return dateFnsFormatRelative(dateObj, baseDateObj, { locale });
    } catch (error) {
      console.error('Error formatting relative date:', error);
      return String(date);
    }
  }

  /**
   * Async version of formatDate that ensures locale is loaded
   * Use this when you need guaranteed locale loading on first render
   */
  async function formatDateAsync(
    date: Date | string | number,
    formatStr: string = 'PP'
  ): Promise<string> {
    try {
      const dateObj = parseDate(date);
      if (!isValid(dateObj)) {
        return String(date);
      }

      const locale = await getDateFnsLocale();
      return format(dateObj, formatStr, { locale });
    } catch (error) {
      console.error('Error formatting date:', error);
      return String(date);
    }
  }

  /**
   * Preload the current locale
   * Call this early to ensure locale is cached before rendering
   */
  async function preloadLocale(): Promise<void> {
    await getDateFnsLocale();
  }

  return {
    currentLocale,
    formatDate,
    formatRelative,
    formatDateRange,
    formatRelativeDate,
    formatDateAsync,
    preloadLocale,
  };
}

// Export standalone functions for use outside Vue components
export { parseDate, getDateFnsLocale, getDateFnsLocaleSync };
