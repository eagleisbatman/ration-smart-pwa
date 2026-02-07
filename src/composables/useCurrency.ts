import { computed } from 'vue';
import { useAuthStore } from 'src/stores/auth';

/**
 * Country code to currency configuration mapping
 * Supports all countries where the app operates
 */
interface CurrencyConfig {
  code: string; // ISO 4217 currency code
  symbol: string; // Currency symbol
  locale: string; // BCP 47 locale tag for formatting
}

const COUNTRY_CURRENCY_MAP: Record<string, CurrencyConfig> = {
  IN: { code: 'INR', symbol: '₹', locale: 'en-IN' },
  KE: { code: 'KES', symbol: 'KSh', locale: 'en-KE' },
  ET: { code: 'ETB', symbol: 'Br', locale: 'am-ET' },
  NP: { code: 'NPR', symbol: '₨', locale: 'ne-NP' },
  BD: { code: 'BDT', symbol: '৳', locale: 'bn-BD' },
  VN: { code: 'VND', symbol: '₫', locale: 'vi-VN' },
};

// Default to Indian Rupee if country not found
const DEFAULT_CURRENCY: CurrencyConfig = COUNTRY_CURRENCY_MAP.IN;

/**
 * Composable for currency formatting based on user's country
 *
 * @example
 * ```vue
 * const { formatCurrency, getCurrencySymbol } = useCurrency();
 *
 * // Format a number with currency symbol and locale formatting
 * formatCurrency(1234.56) // "₹1,234.56" for India, "KSh 1,234.56" for Kenya
 *
 * // Get just the currency symbol
 * getCurrencySymbol() // "₹" for India, "KSh" for Kenya
 *
 * // Get the ISO currency code
 * getCurrencyCode() // "INR" for India, "KES" for Kenya
 * ```
 */
export function useCurrency() {
  const authStore = useAuthStore();

  /**
   * Get currency configuration for the current user's country
   */
  const currencyConfig = computed<CurrencyConfig>(() => {
    const countryCode = authStore.user?.country_code || 'IN';
    return COUNTRY_CURRENCY_MAP[countryCode] || DEFAULT_CURRENCY;
  });

  /**
   * Get the ISO 4217 currency code (e.g., "INR", "KES", "ETB")
   */
  function getCurrencyCode(): string {
    return currencyConfig.value.code;
  }

  /**
   * Get the currency symbol (e.g., "₹", "KSh", "Br")
   */
  function getCurrencySymbol(): string {
    return currencyConfig.value.symbol;
  }

  /**
   * Format a number as currency with proper locale formatting
   *
   * @param amount - The numeric amount to format
   * @param options - Optional Intl.NumberFormat options to override defaults
   * @returns Formatted currency string (e.g., "₹1,234.56")
   */
  function formatCurrency(
    amount: number,
    options?: Partial<Intl.NumberFormatOptions>
  ): string {
    const config = currencyConfig.value;

    try {
      const formatter = new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: config.code,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        ...options,
      });

      return formatter.format(amount);
    } catch {
      // Fallback if Intl.NumberFormat fails (e.g., unsupported locale)
      return `${config.symbol}${amount.toFixed(2)}`;
    }
  }

  /**
   * Format a number as currency without decimal places
   * Useful for displaying whole currency amounts
   *
   * @param amount - The numeric amount to format
   * @returns Formatted currency string without decimals (e.g., "₹1,234")
   */
  function formatCurrencyWhole(amount: number): string {
    return formatCurrency(amount, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  /**
   * Format a currency amount per unit (e.g., "₹50/kg")
   *
   * @param amount - The numeric amount to format
   * @param unit - The unit suffix (e.g., "kg", "day", "liter")
   * @returns Formatted currency per unit string (e.g., "₹50/kg")
   */
  function formatCurrencyPerUnit(amount: number, unit: string): string {
    return `${formatCurrency(amount)}/${unit}`;
  }

  return {
    currencyConfig,
    getCurrencyCode,
    getCurrencySymbol,
    formatCurrency,
    formatCurrencyWhole,
    formatCurrencyPerUnit,
  };
}
