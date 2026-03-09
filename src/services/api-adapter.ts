/**
 * API Adapter — Utility Layer
 *
 * Country code conversions, language maps, and cache helpers.
 * EC2 backend endpoints are called directly from stores (no endpoint mapping needed).
 */

// ============================================================================
// COUNTRY CODE CONVERSION
// ============================================================================

// ISO 3166-1 alpha-3 → alpha-2 mapping.
// Backend stores alpha-3 codes; frontend (flags, UI) uses alpha-2.
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

// ============================================================================
// SUPPORTED COUNTRIES — single source of truth
// ============================================================================

export const FALLBACK_COUNTRIES = [
  { country_code: 'IN', name: 'India' },
  { country_code: 'KE', name: 'Kenya' },
  { country_code: 'ET', name: 'Ethiopia' },
  { country_code: 'NP', name: 'Nepal' },
  { country_code: 'MA', name: 'Morocco' },
  { country_code: 'BD', name: 'Bangladesh' },
  { country_code: 'VN', name: 'Vietnam' },
  { country_code: 'ID', name: 'Indonesia' },
  { country_code: 'PK', name: 'Pakistan' },
  { country_code: 'PH', name: 'Philippines' },
  { country_code: 'TH', name: 'Thailand' },
] as const;

/** Set of supported alpha-2 country codes (derived from FALLBACK_COUNTRIES). */
export const SUPPORTED_COUNTRY_CODES = new Set(
  FALLBACK_COUNTRIES.map((c) => c.country_code),
);

/**
 * Country → recommended language codes, ordered by priority.
 * Used by language selectors on auth pages.
 */
export const COUNTRY_LANGUAGE_MAP: Record<string, string[]> = {
  IN: ['en', 'hi', 'te', 'kn', 'mr', 'ta', 'bn', 'ml', 'gu', 'pa', 'or', 'as', 'ur', 'ne'],
  ET: ['en', 'am', 'om'],
  KE: ['en'],
  NP: ['ne', 'en', 'hi'],
  MA: ['ar', 'fr', 'en'],
  BD: ['bn', 'en'],
  VN: ['vi', 'en'],
  ID: ['id', 'en'],
  PK: ['ur', 'en'],
  PH: ['fil', 'en'],
  TH: ['th', 'en'],
};

// ============================================================================
// COUNTRY CACHE — for country_code → UUID resolution
// ============================================================================

let countryCache: Record<string, string> | null = null;
let countryCacheTime: number | null = null;

/**
 * Clear the country cache (call on logout)
 */
export function clearCountryCache(): void {
  countryCache = null;
  countryCacheTime = null;
}

/**
 * Set country cache directly from auth store's fetched countries
 */
export function setCountryCache(countries: Array<{ id: string; country_code: string }>): void {
  countryCache = {};
  countryCacheTime = Date.now();
  for (const country of countries) {
    countryCache[country.country_code] = country.id;
  }
}

// ============================================================================
// API REFERENCE — lazy reference to axios instance (breaks circular import)
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _apiRef: { get: (url: string) => Promise<{ data: unknown }> } | null = null;

/**
 * Set the Axios API instance (called once from the axios boot file).
 */
export function setApiRef(api: { get: (url: string) => Promise<{ data: unknown }> }): void {
  _apiRef = api;
}
