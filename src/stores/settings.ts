import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from 'src/lib/api';
import { useAuthStore } from './auth';

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

  /** Load milk price from backend user profile (called after login) */
  function loadFromUserProfile(backendPrice: number | null | undefined): void {
    if (backendPrice != null && backendPrice > 0) {
      // Backend has a value — use it (overrides local)
      milkPricePerLiter.value = backendPrice;
      localStorage.setItem(PRICE_KEY, String(backendPrice));
    }
    // If backend has no value but local does, keep local (will sync on next save)
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

    // Sync to backend (fire and forget)
    syncToBackend(price);
  }

  async function syncToBackend(price: number): Promise<void> {
    const authStore = useAuthStore();
    if (!authStore.userId) return;

    try {
      await api.put(`/api/v1/users/${authStore.userId}/settings`, null, {
        params: { milk_price_per_liter: price },
      });
    } catch {
      // Silently fail — localStorage is the source of truth, backend is best-effort
      console.warn('[settings] Failed to sync milk price to backend');
    }
  }

  // Auto-load on store creation
  loadSettings();

  return {
    milkPricePerLiter,
    priceHistory,
    loadSettings,
    loadFromUserProfile,
    saveMilkPrice,
  };
});
