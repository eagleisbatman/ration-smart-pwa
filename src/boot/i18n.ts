/**
 * i18n Boot File
 * Configures vue-i18n for multilingual support
 *
 * Supported locales (22 languages):
 * - en (English) - Base language
 * - hi (Hindi), te (Telugu), kn (Kannada), mr (Marathi) - India
 * - ta (Tamil), gu (Gujarati), ml (Malayalam), pa (Punjabi) - India
 * - bn (Bengali), ur (Urdu), or (Odia), as (Assamese) - India
 * - ne (Nepali) - Nepal
 * - vi (Vietnamese) - Vietnam
 * - am (Amharic), om (Oromo) - Ethiopia
 * - id (Indonesian) - Indonesia
 * - fil (Filipino) - Philippines
 * - th (Thai) - Thailand
 * - ar (Arabic), fr (French) - Morocco
 */

import { boot } from 'quasar/wrappers';
import { createI18n } from 'vue-i18n';
import messages from 'src/i18n';

// Type augmentation for vue-i18n
export type MessageSchema = typeof messages.en;

// Type for supported locales
export type SupportedLocale =
  | 'en'
  | 'hi'
  | 'te'
  | 'kn'
  | 'vi'
  | 'mr'
  | 'ta'
  | 'gu'
  | 'ml'
  | 'pa'
  | 'bn'
  | 'ur'
  | 'or'
  | 'as'
  | 'ne'
  | 'am'
  | 'om'
  | 'id'
  | 'fil'
  | 'th'
  | 'ar'
  | 'fr';

// Create i18n instance
export const i18n = createI18n<[MessageSchema], SupportedLocale>({
  locale: localStorage.getItem('locale') || 'en',
  fallbackLocale: 'en',
  messages,
  legacy: false,
  globalInjection: true,
  missingWarn: process.env.NODE_ENV === 'development',
  fallbackWarn: process.env.NODE_ENV === 'development',
});

export default boot(({ app }) => {
  app.use(i18n);
});

/**
 * Helper to change locale and persist
 */
export function setLocale(locale: string): void {
  if (i18n.global.availableLocales.includes(locale as SupportedLocale)) {
    (i18n.global.locale as unknown as { value: string }).value = locale;
    localStorage.setItem('locale', locale);
    // Update HTML lang attribute for accessibility
    document.documentElement.setAttribute('lang', locale);
  }
}

/**
 * Get current locale
 * Note: With legacy: false, i18n.global.locale is a Ref<string>
 */
export function getLocale(): string {
  // In composition API mode (legacy: false), locale is a Ref
  // Access the value property directly
  return (i18n.global.locale as unknown as { value: string }).value;
}

/**
 * Available locales with display names
 * Organized by region for better UX
 */
export const availableLocales = [
  // Global
  { value: 'en', label: 'English', nativeLabel: 'English', region: 'global' },

  // India - Major Languages (sorted by speakers)
  { value: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', region: 'india' },
  { value: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', region: 'india' },
  { value: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', region: 'india' },
  { value: 'mr', label: 'Marathi', nativeLabel: 'मराठी', region: 'india' },
  { value: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', region: 'india' },
  { value: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી', region: 'india' },
  { value: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', region: 'india' },
  { value: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം', region: 'india' },
  { value: 'or', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ', region: 'india' },
  { value: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ', region: 'india' },
  { value: 'as', label: 'Assamese', nativeLabel: 'অসমীয়া', region: 'india' },
  { value: 'ur', label: 'Urdu', nativeLabel: 'اردو', region: 'india' },

  // Nepal
  { value: 'ne', label: 'Nepali', nativeLabel: 'नेपाली', region: 'nepal' },

  // Vietnam
  { value: 'vi', label: 'Vietnamese', nativeLabel: 'Tiếng Việt', region: 'vietnam' },

  // Ethiopia
  { value: 'am', label: 'Amharic', nativeLabel: 'አማርኛ', region: 'ethiopia' },
  { value: 'om', label: 'Oromo', nativeLabel: 'Afaan Oromoo', region: 'ethiopia' },

  // Indonesia
  { value: 'id', label: 'Indonesian', nativeLabel: 'Bahasa Indonesia', region: 'indonesia' },

  // Philippines
  { value: 'fil', label: 'Filipino', nativeLabel: 'Filipino', region: 'philippines' },

  // Thailand
  { value: 'th', label: 'Thai', nativeLabel: 'ภาษาไทย', region: 'thailand' },

  // Morocco
  { value: 'ar', label: 'Arabic', nativeLabel: 'العربية', region: 'morocco' },
  { value: 'fr', label: 'French', nativeLabel: 'Français', region: 'morocco' },
];

/**
 * Get locales filtered by region
 */
export function getLocalesByRegion(region: string) {
  return availableLocales.filter((locale) => locale.region === region);
}

/**
 * Get all unique regions
 */
export function getAvailableRegions(): string[] {
  return [...new Set(availableLocales.map((locale) => locale.region))];
}
