import { defineStore } from 'pinia';
import { ref } from 'vue';

const PRICE_KEY = 'milk_price_per_liter';
const PRICE_HISTORY_KEY = 'milk_price_history';

export interface MilkPriceHistory {
  price: number;
  date: string;
}

export const useSettingsStore = defineStore('settings', () => {
  const milkPricePerLiter = ref<number | null>(null);
  const priceHistory = ref<MilkPriceHistory[]>([]);

  function loadSettings(): void {
    // Milk price
    const stored = localStorage.getItem(PRICE_KEY);
    if (stored !== null) {
      const parsed = parseFloat(stored);
      milkPricePerLiter.value = isNaN(parsed) ? null : parsed;
    }

    // Price history
    const historyRaw = localStorage.getItem(PRICE_HISTORY_KEY);
    if (historyRaw) {
      try {
        priceHistory.value = JSON.parse(historyRaw) as MilkPriceHistory[];
      } catch {
        priceHistory.value = [];
      }
    }
  }

  function saveMilkPrice(price: number): void {
    if (price <= 0) return;

    milkPricePerLiter.value = price;
    localStorage.setItem(PRICE_KEY, String(price));

    // Update history
    priceHistory.value.push({ price, date: new Date().toISOString() });
    if (priceHistory.value.length > 100) {
      priceHistory.value = priceHistory.value.slice(-100);
    }
    localStorage.setItem(PRICE_HISTORY_KEY, JSON.stringify(priceHistory.value));
  }

  // Auto-load on store creation
  loadSettings();

  return {
    milkPricePerLiter,
    priceHistory,
    loadSettings,
    saveMilkPrice,
  };
});
