import { ref } from 'vue';
import { SUPPORTED_COUNTRY_CODES } from 'src/services/api-adapter';

const DEFAULT_COUNTRY = 'IN';
const STORAGE_KEY = 'geo_detected_country';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache across component instances (one API call per session)
let cachedCountry: string | null = null;
let fetchPromise: Promise<string> | null = null;

/** Read persisted geo result if still valid. */
function readStoredCountry(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { code, ts } = JSON.parse(raw) as { code: string; ts: number };
    if (Date.now() - ts > CACHE_TTL) return null;
    return SUPPORTED_COUNTRY_CODES.has(code) ? code : null;
  } catch {
    return null;
  }
}

/** Persist detected country so we don't hit the API again for 24h. */
function storeCountry(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, ts: Date.now() }));
  } catch {
    // Storage full or blocked — silent
  }
}

/** Try a single geo-IP provider. Returns alpha-2 country code or null. */
async function tryProvider(
  url: string,
  extractCode: (data: Record<string, unknown>) => string | undefined,
  timeoutMs = 3000,
): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    const code = extractCode(data)?.toUpperCase();
    return code && SUPPORTED_COUNTRY_CODES.has(code) ? code : null;
  } catch {
    return null;
  }
}

async function detectCountry(): Promise<string> {
  // 1. Check localStorage cache first (survives across sessions)
  const stored = readStoredCountry();
  if (stored) return stored;

  // 1b. Check last-used country from login/registration (user preference over geo)
  try {
    const lastUsed = localStorage.getItem('last_country_code')?.toUpperCase();
    if (lastUsed && SUPPORTED_COUNTRY_CODES.has(lastUsed)) return lastUsed;
  } catch { /* storage blocked */ }

  // 2. Try primary provider: ipwho.is (free, HTTPS, no key, generous limits)
  const primary = await tryProvider(
    'https://ipwho.is/',
    (d) => d.country_code as string | undefined,
  );
  if (primary) {
    storeCountry(primary);
    return primary;
  }

  // 3. Fallback: api.country.is (free, HTTPS, minimal response)
  const fallback = await tryProvider(
    'https://api.country.is/',
    (d) => d.country as string | undefined,
  );
  if (fallback) {
    storeCountry(fallback);
    return fallback;
  }

  // 4. Last resort: ipapi.co (often rate-limited on free tier)
  const lastResort = await tryProvider(
    'https://ipapi.co/json/',
    (d) => d.country_code as string | undefined,
  );
  if (lastResort) {
    storeCountry(lastResort);
    return lastResort;
  }

  return DEFAULT_COUNTRY;
}

/**
 * Auto-detect user's country from IP geolocation.
 * Returns a reactive `detectedCountry` ref that starts as the best available
 * value (cached > default) and updates once the API responds.
 * Results are cached in localStorage for 24 hours.
 */
export function useGeoCountry() {
  // Start with the best immediately-available value
  if (!cachedCountry) {
    cachedCountry = readStoredCountry();
  }
  const detectedCountry = ref(cachedCountry || DEFAULT_COUNTRY);

  if (cachedCountry) {
    return { detectedCountry };
  }

  if (!fetchPromise) {
    fetchPromise = detectCountry();
  }

  fetchPromise.then((code) => {
    cachedCountry = code;
    detectedCountry.value = code;
  });

  return { detectedCountry };
}
