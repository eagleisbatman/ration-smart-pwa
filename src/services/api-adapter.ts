/**
 * API Adapter Layer
 *
 * Maps PWA frontend API paths to backend's actual endpoints.
 * Also handles request/response transformations for schema differences.
 */

import type { AxiosRequestConfig, AxiosResponse } from 'axios';

// ============================================================================
// PHONE NUMBER & COUNTRY UTILITIES
// ============================================================================

// Country dial codes for E.164 phone format conversion
export const COUNTRY_DIAL_CODES: Record<string, string> = {
  IN: '+91', // India
  KE: '+254', // Kenya
  ET: '+251', // Ethiopia
  NP: '+977', // Nepal
  BD: '+880', // Bangladesh
  VN: '+84', // Vietnam
  OTHER: '+1', // Default fallback
};

// Phone number masks per country (# = digit)
export const COUNTRY_PHONE_MASKS: Record<string, string> = {
  IN: '##########',     // 10 digits
  KE: '#########',      // 9 digits
  ET: '#########',      // 9 digits
  NP: '##########',     // 10 digits
  BD: '###########',    // 11 digits
  VN: '#########',      // 9-10 digits
  OTHER: '##############', // up to 14 digits
};

// Fallback country list when API is unreachable
export const FALLBACK_COUNTRIES = [
  { country_code: 'IN', name: 'India' },
  { country_code: 'KE', name: 'Kenya' },
  { country_code: 'ET', name: 'Ethiopia' },
  { country_code: 'NP', name: 'Nepal' },
  { country_code: 'BD', name: 'Bangladesh' },
  { country_code: 'VN', name: 'Vietnam' },
] as const;

// Cache for country code to UUID mapping
let countryCache: Record<string, string> | null = null;

/**
 * Fetch countries from backend and cache them
 */
export async function fetchAndCacheCountries(): Promise<Record<string, string>> {
  if (countryCache) {
    return countryCache;
  }

  try {
    // Import api dynamically to avoid circular dependency
    const { api } = await import('src/boot/axios');
    const response = await api.get('/api/v1/countries');
    const countries = response.data as Array<{ id: string; country_code: string }>;

    countryCache = {};
    for (const country of countries) {
      countryCache[country.country_code] = country.id;
    }
    return countryCache;
  } catch (error) {
    console.error('[API Adapter] Failed to fetch countries:', error);
    return {};
  }
}

/**
 * Get country UUID from country code (synchronous - uses cache)
 */
export function getCountryId(countryCode: string): string | undefined {
  return countryCache?.[countryCode];
}

/**
 * Set country cache directly (for when countries are fetched elsewhere)
 */
export function setCountryCache(countries: Array<{ id: string; country_code: string }>): void {
  countryCache = {};
  for (const country of countries) {
    countryCache[country.country_code] = country.id;
  }
}

/**
 * Convert phone number to E.164 format
 * @param phone - Raw phone number (e.g., "9876543210")
 * @param countryCode - Country code (e.g., "IN")
 * @returns E.164 formatted phone (e.g., "+919876543210")
 */
export function formatPhoneE164(phone: string, countryCode: string): string {
  // Remove any existing formatting (spaces, dashes, parentheses, etc.)
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // If already in E.164 format, return as-is
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Get dial code for country
  const dialCode = COUNTRY_DIAL_CODES[countryCode] || COUNTRY_DIAL_CODES['OTHER'];

  // Remove leading zero if present (common in some countries)
  const phoneWithoutLeadingZero = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;

  return `${dialCode}${phoneWithoutLeadingZero}`;
}

// ============================================================================
// ENDPOINT MAPPING
// ============================================================================

interface EndpointMapping {
  method?: string; // Optional: only match if method matches
  path: string;
  transform?: {
    request?: (data: unknown) => unknown;
    response?: (data: unknown) => unknown;
    params?: (params: Record<string, unknown>) => Record<string, unknown>;
  };
}

/**
 * Map of PWA endpoints to backend endpoints
 * Key: PWA path pattern (supports :param placeholders)
 * Value: Backend path and optional transformers
 */
const ENDPOINT_MAP: Record<string, EndpointMapping> = {
  // ============================================================================
  // AUTH ENDPOINTS
  // ============================================================================
  '/api/v1/users/register': {
    path: '/auth/register', // Will be overridden to /auth/register-phone if phone registration
    transform: {
      request: (data: unknown) => {
        const reqData = data as {
          email?: string;
          phone?: string;
          pin: string;
          country_code?: string;
          name?: string;
          language?: string;
        };

        const countryCode = reqData.country_code || 'IN';
        const countryId = getCountryId(countryCode);

        // Log warning if country lookup failed
        if (!countryId) {
          console.warn(`[API Adapter] Country UUID not found for code: ${countryCode}. Make sure to call fetchAndCacheCountries() first.`);
        }

        // Phone registration
        if (reqData.phone && !reqData.email) {
          return {
            name: reqData.name,
            phone_number: formatPhoneE164(reqData.phone, countryCode),
            pin: reqData.pin,
            country_id: countryId,
            language_code: reqData.language,
          };
        }

        // Email registration
        return {
          name: reqData.name,
          email_id: reqData.email,
          pin: reqData.pin,
          country_id: countryId,
          language_code: reqData.language,
        };
      },
    },
  },
  // Phone-specific registration endpoint
  '/api/v1/users/register-phone': {
    path: '/auth/register-phone',
    transform: {
      request: (data: unknown) => {
        const reqData = data as {
          phone: string;
          pin: string;
          country_code?: string;
          name?: string;
          language?: string;
        };

        const countryCode = reqData.country_code || 'IN';
        const countryId = getCountryId(countryCode);

        return {
          name: reqData.name,
          phone_number: formatPhoneE164(reqData.phone, countryCode),
          pin: reqData.pin,
          country_id: countryId,
          language_code: reqData.language,
        };
      },
    },
  },
  '/api/v1/users/login': {
    path: '/auth/login',
    transform: {
      request: (data: unknown) => {
        const reqData = data as {
          email?: string;
          phone?: string;
          pin: string;
          country_code?: string;
        };

        // Phone login
        if (reqData.phone && !reqData.email) {
          const countryCode = reqData.country_code || 'IN';
          return {
            phone_number: formatPhoneE164(reqData.phone, countryCode),
            pin: reqData.pin,
          };
        }

        // Email login
        return {
          email_id: reqData.email,
          pin: reqData.pin,
        };
      },
    },
  },
  // Phone-specific login endpoint
  '/api/v1/users/login-phone': {
    path: '/auth/login-phone',
    transform: {
      request: (data: unknown) => {
        const reqData = data as {
          phone: string;
          pin: string;
          country_code?: string;
        };

        const countryCode = reqData.country_code || 'IN';
        return {
          phone_number: formatPhoneE164(reqData.phone, countryCode),
          pin: reqData.pin,
        };
      },
    },
  },
  '/api/v1/users/verify-pin': {
    path: '/auth/verify-pin',
  },
  '/api/v1/users/change-pin': {
    path: '/auth/change-pin',
  },
  '/api/v1/users/:id': {
    path: '/auth/get-user-info',
    transform: {
      // Backend uses query param, not path param
      params: (params) => ({ ...params }),
    },
  },
  '/api/v1/users/:id/settings': {
    path: '/auth/users/:id/settings',
  },

  // ============================================================================
  // COW PROFILE ENDPOINTS
  // ============================================================================
  '/api/v1/cows': {
    path: '/cow-profiles/',
    transform: {
      // GET: List cows for user (needs telegram_user_id or app_user_id query)
      // POST: Create cow
      request: (data) => {
        // Ensure we're sending the right format
        return data;
      },
      response: (data: unknown) => {
        // Transform backend response to expected PWA format
        const response = data as { cow_profiles?: unknown[]; success?: boolean; count?: number };
        if (response.cow_profiles) {
          return {
            ...response,
            cows: response.cow_profiles,
          };
        }
        return data;
      },
    },
  },
  '/api/v1/cows/:id': {
    path: '/cow-profiles/detail/:id',
    transform: {
      response: (data: unknown) => {
        return data;
      },
    },
  },

  // ============================================================================
  // FEED ENDPOINTS
  // ============================================================================
  '/api/v1/feeds/master': {
    path: '/feeds/',
    transform: {
      response: (data: unknown) => {
        // Backend returns feeds list, PWA expects { feeds: [], success: true }
        const response = data as { feeds?: unknown[]; master_feeds?: unknown[] };
        if (Array.isArray(data)) {
          return { feeds: data, success: true };
        }
        if (response.master_feeds) {
          return { feeds: response.master_feeds, success: true };
        }
        return data;
      },
    },
  },
  '/api/v1/feeds/custom': {
    path: '/custom-feeds/',
  },
  '/api/v1/feeds/custom/:id': {
    path: '/custom-feeds/:id',
  },
  '/api/v1/feeds/:id': {
    path: '/feeds/:id',
  },

  // ============================================================================
  // DIET ENDPOINTS
  // ============================================================================
  '/api/v1/diet/optimize': {
    path: '/diet-recommendation-working/',
    transform: {
      request: (data) => {
        // Transform PWA diet request to backend format if needed
        return data;
      },
      response: (data) => {
        // Transform backend response to PWA expected format
        return data;
      },
    },
  },
  '/api/v1/diet/history': {
    path: '/bot-diet-history/',
    transform: {
      response: (data: unknown) => {
        const response = data as { diet_histories?: unknown[] };
        if (response.diet_histories) {
          return { diets: response.diet_histories, success: true };
        }
        return data;
      },
    },
  },
  '/api/v1/diet/:id': {
    path: '/bot-diet-history/:id',
  },
  '/api/v1/diet/history/:id': {
    path: '/bot-diet-history/:id',
  },
  '/api/v1/diet/:id/evaluate': {
    path: '/bot-diet-history/:id/evaluate',
  },

  // ============================================================================
  // MILK LOG ENDPOINTS (using bot daily logs)
  // ============================================================================
  '/api/v1/milk-logs': {
    path: '/bot-daily-logs/',
    transform: {
      response: (data: unknown) => {
        const response = data as { logs?: unknown[] };
        if (response.logs) {
          return { milkLogs: response.logs, success: true };
        }
        return data;
      },
    },
  },
  '/api/v1/milk-logs/:id': {
    path: '/bot-daily-logs/:id',
  },

  // ============================================================================
  // COUNTRIES ENDPOINT (for onboarding)
  // ============================================================================
  '/api/v1/auth/forgot-pin': {
    path: '/auth/forgot-pin',
  },
  '/api/v1/countries': {
    path: '/auth/countries',
    transform: {
      response: (data: unknown) => {
        // Transform backend country_code to code for frontend compatibility
        if (Array.isArray(data)) {
          return data.map((country: { country_code?: string; [key: string]: unknown }) => ({
            ...country,
            code: country.country_code, // Add 'code' alias for 'country_code'
          }));
        }
        return data;
      },
    },
  },

  // ============================================================================
  // NEW ORGANIZATION ENDPOINTS
  // ============================================================================
  '/api/v1/organizations': {
    path: '/organizations/',
  },
  '/api/v1/organizations/:id': {
    path: '/organizations/:id',
  },
  '/api/v1/organizations/:id/users': {
    path: '/organizations/:id/users',
  },
  '/api/v1/organizations/:id/farmers': {
    path: '/organizations/:id/farmers',
  },

  // ============================================================================
  // NEW FARMER PROFILE ENDPOINTS
  // ============================================================================
  '/api/v1/farmer-profiles': {
    path: '/farmer-profiles/',
  },
  '/api/v1/farmer-profiles/:id': {
    path: '/farmer-profiles/:id',
  },
  '/api/v1/farmer-profiles/:id/cows': {
    path: '/farmer-profiles/:id/cows',
  },
  '/api/v1/farmer-profiles/:id/summary': {
    path: '/farmer-profiles/:id/summary',
  },

  // ============================================================================
  // NEW YIELD DATA ENDPOINTS
  // ============================================================================
  '/api/v1/yield-data': {
    path: '/yield-data/',
  },
  '/api/v1/yield-data/farmer/:id': {
    path: '/yield-data/farmer/:id',
  },
  '/api/v1/yield-data/cow/:id': {
    path: '/yield-data/cow/:id',
  },
  '/api/v1/yield-data/analytics/organization/:id': {
    path: '/yield-data/analytics/organization/:id',
  },
  '/api/v1/yield-data/:id': {
    path: '/yield-data/:id',
  },
};

// ============================================================================
// ADAPTER FUNCTIONS
// ============================================================================

/**
 * Extract path parameters from a URL pattern
 */
function extractPathParams(pattern: string, url: string): Record<string, string> | null {
  const patternParts = pattern.split('/');
  const urlParts = url.split('?')[0].split('/'); // Remove query string first

  if (patternParts.length !== urlParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = urlParts[i];
    } else if (patternParts[i] !== urlParts[i]) {
      return null;
    }
  }

  return params;
}

/**
 * Replace path parameters in a URL pattern
 */
function replacePathParams(pattern: string, params: Record<string, string>): string {
  let result = pattern;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, value);
  }
  return result;
}

/**
 * Find matching endpoint mapping for a given URL
 */
function findMapping(url: string): { mapping: EndpointMapping; params: Record<string, string> } | null {
  const urlWithoutQuery = url.split('?')[0];

  // First try exact match
  if (ENDPOINT_MAP[urlWithoutQuery]) {
    return { mapping: ENDPOINT_MAP[urlWithoutQuery], params: {} };
  }

  // Try pattern matching
  for (const [pattern, mapping] of Object.entries(ENDPOINT_MAP)) {
    const params = extractPathParams(pattern, urlWithoutQuery);
    if (params) {
      return { mapping, params };
    }
  }

  return null;
}

/**
 * Adapt a request URL to the backend endpoint
 */
export function adaptEndpoint(url: string | undefined): string {
  if (!url) return '';

  const match = findMapping(url);
  if (!match) {
    // No mapping found, return original URL
    // Remove /api/v1 prefix if present (fallback behavior)
    if (url.startsWith('/api/v1/')) {
      console.warn(`[API Adapter] No mapping found for ${url}, using stripped path`);
      return url.replace('/api/v1/', '/');
    }
    return url;
  }

  // Replace path params in the backend path
  let adaptedPath = replacePathParams(match.mapping.path, match.params);

  // Preserve query string
  const queryIndex = url.indexOf('?');
  if (queryIndex !== -1) {
    adaptedPath += url.slice(queryIndex);
  }

  return adaptedPath;
}

/**
 * Transform request data based on endpoint mapping
 */
export function transformRequest(url: string | undefined, data: unknown): unknown {
  if (!url || !data) return data;

  const match = findMapping(url);
  if (!match?.mapping.transform?.request) {
    return data;
  }

  return match.mapping.transform.request(data);
}

/**
 * Transform response data based on endpoint mapping
 */
export function transformResponse(url: string | undefined, data: unknown): unknown {
  if (!url || !data) return data;

  const match = findMapping(url);
  if (!match?.mapping.transform?.response) {
    return data;
  }

  return match.mapping.transform.response(data);
}

/**
 * Transform query params based on endpoint mapping
 */
export function transformParams(
  url: string | undefined,
  params: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!url || !params) return params;

  const match = findMapping(url);
  if (!match?.mapping.transform?.params) {
    return params;
  }

  return match.mapping.transform.params(params);
}

// ============================================================================
// REQUEST/RESPONSE INTERCEPTOR HANDLERS
// ============================================================================

/**
 * Request interceptor handler for axios
 */
export function handleRequestInterceptor(config: AxiosRequestConfig): AxiosRequestConfig {
  const originalUrl = config.url;

  // Store original URL for response transformation
  if (originalUrl) {
    (config as AxiosRequestConfig & { _originalUrl?: string })._originalUrl = originalUrl;
  }

  // Adapt endpoint
  config.url = adaptEndpoint(originalUrl);

  // Transform request data
  if (config.data) {
    config.data = transformRequest(originalUrl, config.data);
  }

  // Transform params
  if (config.params) {
    config.params = transformParams(originalUrl, config.params);
  }

  // Log adapter activity in development
  if (process.env.NODE_ENV === 'development' && originalUrl !== config.url) {
    console.log(`[API Adapter] ${originalUrl} -> ${config.url}`);
  }

  return config;
}

/**
 * Response interceptor handler for axios
 */
export function handleResponseInterceptor(response: AxiosResponse): AxiosResponse {
  const originalUrl = (response.config as AxiosRequestConfig & { _originalUrl?: string })._originalUrl;

  // Transform response data
  if (response.data && originalUrl) {
    response.data = transformResponse(originalUrl, response.data);
  }

  return response;
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

export const apiAdapter = {
  adaptEndpoint,
  transformRequest,
  transformResponse,
  transformParams,
  handleRequestInterceptor,
  handleResponseInterceptor,
  // Phone & Country utilities
  formatPhoneE164,
  fetchAndCacheCountries,
  getCountryId,
  setCountryCache,
};

export default apiAdapter;
