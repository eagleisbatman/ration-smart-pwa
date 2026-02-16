import { ref } from 'vue';

const SUPPORTED_COUNTRIES = new Set(['IN', 'KE', 'ET', 'BD', 'VN']);
const DEFAULT_COUNTRY = 'IN';

// Cache across component instances so we only call the API once per session
let cachedCountry: string | null = null;
let fetchPromise: Promise<string> | null = null;

async function detectCountry(): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const res = await fetch('http://ip-api.com/json/?fields=countryCode', {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return DEFAULT_COUNTRY;

    const data = (await res.json()) as { countryCode?: string };
    const code = data.countryCode?.toUpperCase() || DEFAULT_COUNTRY;

    // Only use detected country if it's one we support
    return SUPPORTED_COUNTRIES.has(code) ? code : DEFAULT_COUNTRY;
  } catch {
    return DEFAULT_COUNTRY;
  }
}

/**
 * Auto-detect user's country from IP geolocation.
 * Returns a reactive `detectedCountry` ref that starts as DEFAULT_COUNTRY
 * and updates once the API responds. Results are cached per session.
 */
export function useGeoCountry() {
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
