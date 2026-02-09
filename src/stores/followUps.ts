import { defineStore } from 'pinia';
import { ref } from 'vue';
import { db, Diet } from 'src/lib/offline/db';
import { differenceInDays, parseISO } from 'date-fns';

export interface FollowUpResponse {
  diet_id: string;
  milk_change: 'increased' | 'same' | 'decreased';
  milk_yield_reported?: number;
  feedback?: string;
  responded_at: string;
}

const FOLLOW_UP_STORAGE_KEY = 'rationSmart_followUpResponses';
const FOLLOW_UP_INTERVAL_DAYS = 7;

export const useFollowUpsStore = defineStore('followUps', () => {
  const pendingFollowUps = ref<Diet[]>([]);
  const loading = ref(false);

  /**
   * Check which followed diets are due for a follow-up (7+ days active).
   * Returns diets that haven't had a recent follow-up response.
   */
  async function checkPendingFollowUps(): Promise<void> {
    loading.value = true;
    try {
      // Get all followed (active) diets from IndexedDB
      const allDiets = await db.diets
        .filter((d) => d.is_active === true && !d._deleted)
        .toArray();

      const now = new Date();
      const responses = getStoredResponses();
      const due: Diet[] = [];

      for (const diet of allDiets) {
        const createdDate = parseISO(diet.created_at);
        const daysActive = differenceInDays(now, createdDate);

        if (daysActive < FOLLOW_UP_INTERVAL_DAYS) continue;

        // Check if there's a recent response (within the last 7 days)
        const lastResponse = responses
          .filter((r) => r.diet_id === diet.id)
          .sort((a, b) => new Date(b.responded_at).getTime() - new Date(a.responded_at).getTime())[0];

        if (lastResponse) {
          const daysSinceResponse = differenceInDays(now, parseISO(lastResponse.responded_at));
          if (daysSinceResponse < FOLLOW_UP_INTERVAL_DAYS) continue;
        }

        due.push(diet);
      }

      pendingFollowUps.value = due;
    } catch (err) {
      console.error('[FollowUps] Failed to check pending follow-ups:', err);
      pendingFollowUps.value = [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Submit a follow-up response for a diet.
   */
  function submitFollowUp(
    dietId: string,
    milkChange: 'increased' | 'same' | 'decreased',
    milkYieldReported?: number,
    feedback?: string
  ): void {
    const response: FollowUpResponse = {
      diet_id: dietId,
      milk_change: milkChange,
      milk_yield_reported: milkYieldReported,
      feedback,
      responded_at: new Date().toISOString(),
    };

    const responses = getStoredResponses();
    responses.push(response);
    localStorage.setItem(FOLLOW_UP_STORAGE_KEY, JSON.stringify(responses));

    // Remove from pending list
    pendingFollowUps.value = pendingFollowUps.value.filter((d) => d.id !== dietId);
  }

  /**
   * Dismiss a follow-up for now (snooze for 7 more days).
   */
  function dismissFollowUp(dietId: string): void {
    // Store a "dismissed" marker so it won't show again for 7 days
    const response: FollowUpResponse = {
      diet_id: dietId,
      milk_change: 'same',
      responded_at: new Date().toISOString(),
    };

    const responses = getStoredResponses();
    responses.push(response);
    localStorage.setItem(FOLLOW_UP_STORAGE_KEY, JSON.stringify(responses));

    pendingFollowUps.value = pendingFollowUps.value.filter((d) => d.id !== dietId);
  }

  /**
   * Get the follow-up for a specific diet (if pending).
   */
  function getPendingForDiet(dietId: string): Diet | undefined {
    return pendingFollowUps.value.find((d) => d.id === dietId);
  }

  /**
   * Get all stored follow-up responses.
   */
  function getResponses(dietId?: string): FollowUpResponse[] {
    const all = getStoredResponses();
    if (dietId) {
      return all.filter((r) => r.diet_id === dietId);
    }
    return all;
  }

  return {
    pendingFollowUps,
    loading,
    checkPendingFollowUps,
    submitFollowUp,
    dismissFollowUp,
    getPendingForDiet,
    getResponses,
  };
});

function getStoredResponses(): FollowUpResponse[] {
  try {
    const raw = localStorage.getItem(FOLLOW_UP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
