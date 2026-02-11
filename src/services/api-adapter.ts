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

// Comprehensive country dial codes (ISO 3166-1 alpha-2 → ITU-T E.164 prefix)
export const COUNTRY_DIAL_CODES: Record<string, string> = {
  AF: '+93',  AL: '+355', DZ: '+213', AD: '+376', AO: '+244',
  AG: '+1',   AR: '+54',  AM: '+374', AU: '+61',  AT: '+43',
  AZ: '+994', BS: '+1',   BH: '+973', BD: '+880', BB: '+1',
  BY: '+375', BE: '+32',  BZ: '+501', BJ: '+229', BT: '+975',
  BO: '+591', BA: '+387', BW: '+267', BR: '+55',  BN: '+673',
  BG: '+359', BF: '+226', BI: '+257', KH: '+855', CM: '+237',
  CA: '+1',   CV: '+238', CF: '+236', TD: '+235', CL: '+56',
  CN: '+86',  CO: '+57',  KM: '+269', CD: '+243', CG: '+242',
  CR: '+506', CI: '+225', HR: '+385', CU: '+53',  CY: '+357',
  CZ: '+420', DK: '+45',  DJ: '+253', DM: '+1',   DO: '+1',
  EC: '+593', EG: '+20',  SV: '+503', GQ: '+240', ER: '+291',
  EE: '+372', SZ: '+268', ET: '+251', FJ: '+679', FI: '+358',
  FR: '+33',  GA: '+241', GM: '+220', GE: '+995', DE: '+49',
  GH: '+233', GR: '+30',  GD: '+1',   GT: '+502', GN: '+224',
  GW: '+245', GY: '+592', HT: '+509', HN: '+504', HK: '+852',
  HU: '+36',  IS: '+354', IN: '+91',  ID: '+62',  IR: '+98',
  IQ: '+964', IE: '+353', IL: '+972', IT: '+39',  JM: '+1',
  JP: '+81',  JO: '+962', KZ: '+7',   KE: '+254', KI: '+686',
  KW: '+965', KG: '+996', LA: '+856', LV: '+371', LB: '+961',
  LS: '+266', LR: '+231', LY: '+218', LI: '+423', LT: '+370',
  LU: '+352', MO: '+853', MG: '+261', MW: '+265', MY: '+60',
  MV: '+960', ML: '+223', MT: '+356', MH: '+692', MR: '+222',
  MU: '+230', MX: '+52',  FM: '+691', MD: '+373', MC: '+377',
  MN: '+976', ME: '+382', MA: '+212', MZ: '+258', MM: '+95',
  NA: '+264', NR: '+674', NP: '+977', NL: '+31',  NZ: '+64',
  NI: '+505', NE: '+227', NG: '+234', KP: '+850', MK: '+389',
  NO: '+47',  OM: '+968', PK: '+92',  PW: '+680', PA: '+507',
  PG: '+675', PY: '+595', PE: '+51',  PH: '+63',  PL: '+48',
  PT: '+351', QA: '+974', RO: '+40',  RU: '+7',   RW: '+250',
  SA: '+966', SN: '+221', RS: '+381', SC: '+248', SL: '+232',
  SG: '+65',  SK: '+421', SI: '+386', SB: '+677', SO: '+252',
  ZA: '+27',  KR: '+82',  SS: '+211', ES: '+34',  LK: '+94',
  SD: '+249', SR: '+597', SE: '+46',  CH: '+41',  SY: '+963',
  TW: '+886', TJ: '+992', TZ: '+255', TH: '+66',  TL: '+670',
  TG: '+228', TO: '+676', TT: '+1',   TN: '+216', TR: '+90',
  TM: '+993', TV: '+688', UG: '+256', UA: '+380', AE: '+971',
  GB: '+44',  US: '+1',   UY: '+598', UZ: '+998', VU: '+678',
  VE: '+58',  VN: '+84',  YE: '+967', ZM: '+260', ZW: '+263',
};

// Phone number masks per country (# = digit).
// Only countries with known fixed formats are listed; everything else
// gets the generous OTHER mask (up to 14 digits).
export const COUNTRY_PHONE_MASKS: Record<string, string> = {
  IN: '##########',      // 10 digits
  KE: '#########',       // 9 digits
  ET: '#########',       // 9 digits
  NP: '##########',      // 10 digits
  BD: '###########',     // 10-11 digits
  VN: '#########',       // 9-10 digits
  US: '##########',      // 10 digits
  CA: '##########',      // 10 digits
  GB: '###########',     // 10-11 digits
  AU: '#########',       // 9 digits
  PH: '##########',      // 10 digits
  ID: '############',    // 10-12 digits
  PK: '##########',      // 10 digits
  NG: '##########',      // 10 digits
  BR: '###########',     // 10-11 digits
  MX: '##########',      // 10 digits
  CN: '###########',     // 11 digits
  JP: '##########',      // 10 digits
  DE: '############',    // 10-12 digits
  FR: '#########',       // 9 digits
  OTHER: '##############', // up to 14 digits – safe fallback
};

/**
 * Look up a dial code by country code (case-insensitive).
 * Returns the dial code string or empty string for unknown codes.
 */
export function getDialCode(countryCode: string): string {
  return COUNTRY_DIAL_CODES[countryCode?.toUpperCase()] || '';
}

/**
 * Look up a phone mask by country code (case-insensitive).
 * Falls back to the generous OTHER mask for unknown countries.
 */
export function getPhoneMask(countryCode: string): string {
  return COUNTRY_PHONE_MASKS[countryCode?.toUpperCase()] || COUNTRY_PHONE_MASKS['OTHER'];
}

// ISO 3166-1 alpha-3 → alpha-2 mapping.
// Backend stores alpha-3 codes; frontend (flags, dial codes, masks) uses alpha-2.
const ALPHA3_TO_ALPHA2: Record<string, string> = {
  AFG:'AF', ALB:'AL', DZA:'DZ', AND:'AD', AGO:'AO', ARG:'AR', ARM:'AM', AUS:'AU', AUT:'AT', AZE:'AZ',
  BHS:'BS', BHR:'BH', BGD:'BD', BRB:'BB', BLR:'BY', BEL:'BE', BLZ:'BZ', BEN:'BJ', BTN:'BT', BOL:'BO',
  BIH:'BA', BWA:'BW', BRA:'BR', BRN:'BN', BGR:'BG', BFA:'BF', BDI:'BI',
  KHM:'KH', CMR:'CM', CAN:'CA', CPV:'CV', CAF:'CF', TCD:'TD', CHL:'CL', CHN:'CN', COL:'CO', COM:'KM',
  COG:'CG', CRI:'CR', HRV:'HR', CUB:'CU', CYP:'CY', CZE:'CZ',
  COD:'CD', DNK:'DK', DJI:'DJ', DMA:'DM', DOM:'DO',
  ECU:'EC', EGY:'EG', SLV:'SV', GNQ:'GQ', ERI:'ER', EST:'EE', SWZ:'SZ', ETH:'ET',
  FJI:'FJ', FIN:'FI', FRA:'FR',
  GAB:'GA', GMB:'GM', GEO:'GE', DEU:'DE', GHA:'GH', GRC:'GR', GRD:'GD', GTM:'GT', GIN:'GN', GNB:'GW', GUY:'GY',
  HTI:'HT', HND:'HN', HUN:'HU',
  ISL:'IS', IND:'IN', IDN:'ID', IRN:'IR', IRQ:'IQ', IRL:'IE', ISR:'IL', ITA:'IT', CIV:'CI',
  JAM:'JM', JPN:'JP', JOR:'JO',
  KAZ:'KZ', KEN:'KE', KIR:'KI', KWT:'KW', KGZ:'KG',
  LAO:'LA', LVA:'LV', LBN:'LB', LSO:'LS', LBR:'LR', LBY:'LY', LIE:'LI', LTU:'LT', LUX:'LU',
  MDG:'MG', MWI:'MW', MYS:'MY', MDV:'MV', MLI:'ML', MLT:'MT', MHL:'MH', MRT:'MR', MUS:'MU', MEX:'MX',
  FSM:'FM', MDA:'MD', MCO:'MC', MNG:'MN', MNE:'ME', MAR:'MA', MOZ:'MZ', MMR:'MM',
  NAM:'NA', NRU:'NR', NPL:'NP', NLD:'NL', NZL:'NZ', NIC:'NI', NER:'NE', NGA:'NG', PRK:'KP', MKD:'MK', NOR:'NO',
  OMN:'OM',
  PAK:'PK', PLW:'PW', PAN:'PA', PNG:'PG', PRY:'PY', PER:'PE', PHL:'PH', POL:'PL', PRT:'PT',
  QAT:'QA',
  ROU:'RO', RUS:'RU', RWA:'RW',
  KNA:'KN', LCA:'LC', VCT:'VC', WSM:'WS', SMR:'SM', STP:'ST', SAU:'SA', SEN:'SN', SRB:'RS', SYC:'SC',
  SLE:'SL', SGP:'SG', SVK:'SK', SVN:'SI', SLB:'SB', SOM:'SO', ZAF:'ZA', KOR:'KR', SSD:'SS', ESP:'ES',
  LKA:'LK', SDN:'SD', SUR:'SR', SWE:'SE', CHE:'CH', SYR:'SY',
  TWN:'TW', TJK:'TJ', TZA:'TZ', THA:'TH', TLS:'TL', TGO:'TG', TON:'TO', TTO:'TT', TUN:'TN', TUR:'TR', TKM:'TM', TUV:'TV',
  UGA:'UG', UKR:'UA', ARE:'AE', GBR:'GB', USA:'US', URY:'UY', UZB:'UZ',
  VUT:'VU', VAT:'VA', VEN:'VE', VNM:'VN',
  YEM:'YE',
  ZMB:'ZM', ZWE:'ZW',
};

/**
 * Convert an alpha-3 country code to alpha-2.
 * If already alpha-2 or unknown, returns the input uppercased.
 */
export function toAlpha2(code: string): string {
  if (!code) return code;
  const upper = code.toUpperCase();
  return ALPHA3_TO_ALPHA2[upper] || upper;
}

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

  // Get dial code for country (case-insensitive)
  const dialCode = getDialCode(countryCode) || '+1';

  // Remove leading zero if present (common in some countries)
  const phoneWithoutLeadingZero = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;

  return `${dialCode}${phoneWithoutLeadingZero}`;
}

// ============================================================================
// FIELD MAPPING HELPERS: Backend ↔ PWA
// ============================================================================

/**
 * Map a backend CowProfileResponse to the PWA Cow interface.
 */
function mapCowFromBackend(cow: Record<string, unknown>): Record<string, unknown> {
  if (!cow) return cow;
  const lactating = cow.lactating as boolean | undefined;
  const daysInMilk = cow.days_in_milk as number | undefined;
  let lactationStage = 'dry';
  if (lactating) {
    if (daysInMilk != null) {
      if (daysInMilk <= 100) lactationStage = 'early';
      else if (daysInMilk <= 200) lactationStage = 'mid';
      else lactationStage = 'late';
    } else {
      lactationStage = 'mid';
    }
  }
  const daysPreg = cow.days_of_pregnancy as number | undefined;
  return {
    id: cow.id,
    user_id: cow.telegram_user_id,
    name: cow.name,
    breed: cow.breed || '',
    weight_kg: cow.body_weight,
    milk_yield_liters: cow.milk_production,
    milk_fat_percentage: cow.milk_fat_percent,
    lactation_stage: lactationStage,
    is_pregnant: (daysPreg ?? 0) > 0,
    pregnancy_month: daysPreg ? Math.round(daysPreg / 30) : undefined,
    is_active: cow.is_active ?? true,
    created_at: cow.created_at,
    updated_at: cow.updated_at,
    // Pass through extra backend fields for round-tripping
    _backend_lactating: cow.lactating,
    _backend_days_in_milk: cow.days_in_milk,
    _backend_parity: cow.parity,
    _backend_target_milk_yield: cow.target_milk_yield,
    _backend_milk_protein_percent: cow.milk_protein_percent,
  };
}

/**
 * Map PWA CowInput fields to backend CowProfileCreate fields.
 */
function mapCowToBackend(input: Record<string, unknown>): Record<string, unknown> {
  if (!input) return input;
  const lactationStage = (input.lactation_stage as string) || 'mid';
  const isPregnant = input.is_pregnant as boolean | undefined;
  const pregnancyMonth = input.pregnancy_month as number | undefined;
  return {
    name: input.name,
    breed: input.breed,
    body_weight: input.weight_kg ?? input.body_weight,
    lactating: lactationStage !== 'dry',
    milk_production: input.milk_yield_liters ?? input.milk_production ?? 0,
    milk_fat_percent: input.milk_fat_percentage ?? input.milk_fat_percent ?? 4.0,
    milk_protein_percent: input._backend_milk_protein_percent ?? 3.3,
    days_in_milk: input._backend_days_in_milk ?? (lactationStage === 'early' ? 50 : lactationStage === 'mid' ? 150 : lactationStage === 'late' ? 250 : 0),
    parity: input._backend_parity ?? undefined,
    target_milk_yield: input._backend_target_milk_yield ?? undefined,
    days_of_pregnancy: isPregnant ? (pregnancyMonth ?? 0) * 30 : 0,
    is_active: input.is_active,
  };
}

/**
 * Map a backend BotDietHistoryResponse to the PWA Diet interface.
 */
function mapDietFromBackend(diet: Record<string, unknown>): Record<string, unknown> {
  if (!diet) return diet;
  const dietSummary = diet.diet_summary as Record<string, unknown> | undefined;
  return {
    id: diet.id,
    user_id: diet.telegram_user_id,
    cow_id: diet.cow_profile_id,
    cow_name: dietSummary?.cow_name,
    optimization_goal: (dietSummary?.optimization_goal as string) || 'balanced',
    status: diet.status,
    is_active: diet.is_active,
    input_data: dietSummary || {},
    result_data: diet.full_result,
    total_cost: diet.total_cost_per_day,
    created_at: diet.created_at,
    updated_at: diet.created_at, // backend doesn't have updated_at
  };
}

/**
 * Map PWA Diet fields to backend BotDietHistoryCreate/Update fields.
 */
function mapDietToBackend(input: Record<string, unknown>): Record<string, unknown> {
  if (!input) return input;
  return {
    cow_profile_id: input.cow_id ?? input.cow_profile_id,
    name: input.name,
    status: input.status,
    is_active: input.is_active,
    diet_summary: input.input_data ?? input.diet_summary,
    full_result: input.result_data ?? input.full_result,
    total_cost_per_day: input.total_cost ?? input.total_cost_per_day,
    currency: input.currency,
    simulation_id: input.simulation_id,
  };
}

/**
 * Map a backend BotDailyLogResponse to the PWA MilkLog interface.
 */
function mapMilkLogFromBackend(log: Record<string, unknown>): Record<string, unknown> {
  if (!log) return log;
  const morning = log.milk_yield_morning as number | null | undefined;
  const evening = log.milk_yield_evening as number | null | undefined;
  const total = log.milk_yield_total as number | null | undefined;
  return {
    id: log.id,
    user_id: log.telegram_user_id,
    cow_id: log.cow_profile_id,
    log_date: log.log_date,
    morning_liters: morning,
    evening_liters: evening,
    total_liters: total ?? (morning ?? 0) + (evening ?? 0),
    fed_diet: log.fed_diet,
    diet_history_id: log.diet_history_id,
    notes: log.notes,
    status: log.status,
    created_at: log.created_at,
    updated_at: log.created_at,
  };
}

/**
 * Map PWA MilkLogInput fields to backend BotDailyLogCreate fields.
 */
function mapMilkLogToBackend(input: Record<string, unknown>): Record<string, unknown> {
  if (!input) return input;
  const morning = input.morning_liters as number | undefined;
  const evening = input.evening_liters as number | undefined;
  return {
    cow_profile_id: input.cow_id ?? input.cow_profile_id,
    diet_history_id: input.diet_history_id,
    log_date: input.log_date,
    fed_diet: input.fed_diet,
    milk_yield_morning: morning,
    milk_yield_evening: evening,
    milk_yield_total: input.total_liters ?? (morning ?? 0) + (evening ?? 0),
    notes: input.notes,
    status: input.status ?? 'completed',
  };
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
  // NOTE: verify-pin does not exist on the backend; login returns a token directly.
  // Removed dead mapping: '/api/v1/users/verify-pin' → '/auth/verify-pin'
  '/api/v1/users/change-pin': {
    path: '/auth/change-pin',
  },
  '/api/v1/users/:id': {
    // Backend: GET/PUT /auth/user/id/{user_id}
    path: '/auth/user/id/:id',
  },
  '/api/v1/users/:id/settings': {
    path: '/auth/users/:id/settings',
  },
  '/api/v1/users/:id/self-profile': {
    // Backend: POST/GET/PUT /auth/users/{user_id}/self-profile
    path: '/auth/users/:id/self-profile',
  },

  // ============================================================================
  // COW PROFILE ENDPOINTS
  // ============================================================================
  // List cows — store passes userId in URL
  '/api/v1/cows/user/:userId': {
    path: '/cow-profiles/user/:userId',
    transform: {
      response: (data: unknown) => {
        // Backend returns { success, count, cow_profiles: [...] }
        // PWA stores expect a plain array with PWA field names
        const resp = data as { cow_profiles?: Record<string, unknown>[] };
        const profiles = resp.cow_profiles || (Array.isArray(data) ? data as Record<string, unknown>[] : []);
        return profiles.map(mapCowFromBackend);
      },
    },
  },
  // Create cow — no userId needed (backend resolves from auth context)
  '/api/v1/cows': {
    method: 'POST',
    path: '/cow-profiles/',
    transform: {
      request: (data: unknown) => mapCowToBackend(data as Record<string, unknown>),
      response: (data: unknown) => mapCowFromBackend(data as Record<string, unknown>),
    },
  },
  '/api/v1/cows/:id': {
    path: '/cow-profiles/detail/:id',
    transform: {
      request: (data: unknown) => {
        if (data && typeof data === 'object') return mapCowToBackend(data as Record<string, unknown>);
        return data;
      },
      response: (data: unknown) => mapCowFromBackend(data as Record<string, unknown>),
    },
  },
  // Update cow by full UUID — PUT /cow-profiles/{id}
  '/api/v1/cows/update/:id': {
    path: '/cow-profiles/:id',
    transform: {
      request: (data: unknown) => {
        if (data && typeof data === 'object') return mapCowToBackend(data as Record<string, unknown>);
        return data;
      },
      response: (data: unknown) => mapCowFromBackend(data as Record<string, unknown>),
    },
  },
  // Delete cow
  '/api/v1/cows/delete/:id': {
    path: '/cow-profiles/:id',
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
  // NOTE: custom-feeds endpoints do not exist on the backend yet.
  // Removed dead mappings: '/api/v1/feeds/custom' and '/api/v1/feeds/custom/:id'
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
  // Diet list — store passes userId in URL
  '/api/v1/diet/history/user/:userId': {
    path: '/bot-diet-history/user/:userId',
    transform: {
      response: (data: unknown) => {
        // Backend returns { success, count, diets: [...] }
        const resp = data as { diets?: Record<string, unknown>[] };
        const diets = resp.diets || (Array.isArray(data) ? data as Record<string, unknown>[] : []);
        return diets.map(mapDietFromBackend);
      },
    },
  },
  '/api/v1/diet/history': {
    path: '/bot-diet-history/',
    transform: {
      request: (data: unknown) => {
        if (data && typeof data === 'object') return mapDietToBackend(data as Record<string, unknown>);
        return data;
      },
      response: (data: unknown) => {
        // Could be a list response or single item
        const resp = data as { diets?: Record<string, unknown>[] };
        if (resp.diets) return resp.diets.map(mapDietFromBackend);
        return data;
      },
    },
  },
  '/api/v1/diet/:id': {
    path: '/bot-diet-history/:id',
    transform: {
      request: (data: unknown) => {
        if (data && typeof data === 'object') return mapDietToBackend(data as Record<string, unknown>);
        return data;
      },
      response: (data: unknown) => mapDietFromBackend(data as Record<string, unknown>),
    },
  },
  '/api/v1/diet/history/:id': {
    path: '/bot-diet-history/:id',
    transform: {
      response: (data: unknown) => mapDietFromBackend(data as Record<string, unknown>),
    },
  },
  '/api/v1/diet/:id/archive': {
    path: '/bot-diet-history/:id/archive',
  },
  '/api/v1/diet/active/:cowId': {
    path: '/bot-diet-history/active/:cowId',
    transform: {
      response: (data: unknown) => mapDietFromBackend(data as Record<string, unknown>),
    },
  },

  // ============================================================================
  // HEALTH EVENT ENDPOINTS
  // ============================================================================
  '/api/v1/health-events': {
    path: '/health-events/',
  },
  '/api/v1/health-events/cow/:cowId': {
    path: '/health-events/cow/:cowId',
    transform: {
      response: (data: unknown) => {
        const response = data as { events?: unknown[] };
        if (response.events) {
          return response.events;
        }
        return data;
      },
    },
  },
  '/api/v1/health-events/:id': {
    path: '/health-events/:id',
  },

  // ============================================================================
  // MILK LOG ENDPOINTS (using bot daily logs)
  // ============================================================================
  // List milk logs — store passes userId in URL
  '/api/v1/milk-logs/user/:userId': {
    path: '/bot-daily-logs/user/:userId',
    transform: {
      response: (data: unknown) => {
        // Backend returns { success, count, logs: [...] }
        const resp = data as { logs?: Record<string, unknown>[] };
        const logs = resp.logs || (Array.isArray(data) ? data as Record<string, unknown>[] : []);
        return logs.map(mapMilkLogFromBackend);
      },
    },
  },
  // Create milk log
  '/api/v1/milk-logs': {
    path: '/bot-daily-logs/',
    transform: {
      request: (data: unknown) => {
        if (data && typeof data === 'object') return mapMilkLogToBackend(data as Record<string, unknown>);
        return data;
      },
      response: (data: unknown) => mapMilkLogFromBackend(data as Record<string, unknown>),
    },
  },
  '/api/v1/milk-logs/:id': {
    path: '/bot-daily-logs/:id',
    transform: {
      request: (data: unknown) => {
        if (data && typeof data === 'object') return mapMilkLogToBackend(data as Record<string, unknown>);
        return data;
      },
      response: (data: unknown) => mapMilkLogFromBackend(data as Record<string, unknown>),
    },
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
        // Backend returns alpha-3 country codes (IND, KEN, BGD …).
        // Frontend flags, dial codes, and phone masks all use alpha-2 (IN, KE, BD …).
        // Convert here so every downstream consumer gets alpha-2.
        if (Array.isArray(data)) {
          return data.map((country: { country_code?: string; [key: string]: unknown }) => {
            const alpha2 = toAlpha2(country.country_code || '');
            return {
              ...country,
              country_code: alpha2,
              code: alpha2,
            };
          });
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
