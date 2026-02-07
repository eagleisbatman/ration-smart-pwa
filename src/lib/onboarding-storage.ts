/**
 * Onboarding storage helpers.
 *
 * Uses localStorage (instead of sessionStorage) so that onboarding progress
 * survives browser restarts. Each value is stored with a timestamp; reads
 * that are older than MAX_AGE_MS are treated as stale and discarded.
 */

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

const ONBOARDING_KEYS = [
  'onboarding_language',
  'onboarding_role',
  'onboarding_org_id',
  'selected_country',
] as const;

export type OnboardingKey = (typeof ONBOARDING_KEYS)[number];

interface StoredEntry {
  value: string;
  timestamp: number;
}

/**
 * Persist an onboarding value in localStorage with the current timestamp.
 */
export function setOnboardingItem(key: OnboardingKey, value: string): void {
  const entry: StoredEntry = { value, timestamp: Date.now() };
  localStorage.setItem(key, JSON.stringify(entry));
}

/**
 * Read an onboarding value from localStorage.
 * Returns `null` when the key is missing or the entry is older than 24 hours.
 */
export function getOnboardingItem(key: OnboardingKey): string | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const entry: StoredEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > MAX_AGE_MS) {
      // Stale -- remove it so it does not linger
      localStorage.removeItem(key);
      return null;
    }
    return entry.value;
  } catch {
    // Legacy plain-string value or corrupt JSON -- discard it
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Remove a single onboarding key from localStorage.
 */
export function removeOnboardingItem(key: OnboardingKey): void {
  localStorage.removeItem(key);
}

/**
 * Clear all onboarding keys from localStorage.
 * Call this on successful onboarding completion.
 */
export function clearOnboardingData(): void {
  for (const key of ONBOARDING_KEYS) {
    localStorage.removeItem(key);
  }
}
