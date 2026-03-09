/**
 * Feed Name Translation System
 *
 * Provides local-language feed names for non-English locales.
 * Uses a static translation map for common feed names.
 * Falls back to English (fd_name) when no translation exists.
 *
 * To add translations for a new locale:
 * 1. Add entries to FEED_NAME_TRANSLATIONS[locale]
 * 2. Keys are lowercase English feed names (without season suffixes)
 * 3. Values are the translated name
 */

/**
 * Static translations for common feed names.
 * Key = lowercase base name (season stripped), Value = translated name.
 */
const FEED_NAME_TRANSLATIONS: Record<string, Record<string, string>> = {
  hi: {
    'alfalfa': 'रिजका',
    'calcium carbonate': 'कैल्शियम कार्बोनेट',
    'calcium chloride': 'कैल्शियम क्लोराइड',
    'cassava waste': 'कसावा अपशिष्ट',
    'chickpea': 'चना',
    'commercial concentrate': 'व्यावसायिक सांद्र',
    'copra meal': 'खोपरा खली',
    'corn meal': 'मक्का दलिया',
    'corn silage': 'मक्का साइलेज',
    'corn stem': 'मक्का डंठल',
    'corn plant': 'मक्का पौधा',
    'cotton meal': 'कपास खली',
    'cottonseed meal': 'बिनौला खली',
    'cottonseed meal (undecorticated)': 'बिनौला खली (अनछिलका)',
    'ddgs': 'डीडीजीएस',
    'elephant grass': 'हाथी घास',
    'feed pellets': 'फीड पेलेट्स',
    'groundnut meal': 'मूंगफली खली',
    'guinea grass': 'गिनी घास',
    'leucaena': 'सुबाबुल',
    'limestone': 'चूना पत्थर',
    'lucerne': 'रिजका',
    'mineral premix': 'खनिज प्रीमिक्स',
    'mineral mixture': 'खनिज मिश्रण',
    'mung bean haulm': 'मूंग भूसा',
    'napier grass': 'नेपियर घास',
    'natural grass': 'प्राकृतिक घास',
    'oat hay': 'जई का सूखा चारा',
    'oats straw': 'जई का भूसा',
    'okara': 'ओकारा',
    'para grass': 'पारा घास',
    'pumpkin skin': 'कद्दू का छिलका',
    'rapeseed cake': 'सरसों की खली',
    'rapeseed meal': 'सरसों खली',
    'rice bran': 'चावल की भूसी',
    'rice bran (de-oiled)': 'चावल की भूसी (तेल निकाली)',
    'rice polish': 'चावल पॉलिश',
    'rice straw': 'धान का पुआल',
    'sorghum straw': 'ज्वार का भूसा',
    'soybean meal': 'सोयाबीन खली',
    'star grass': 'स्टार घास',
    'sugarcane tops': 'गन्ने की पत्तियां',
    'sunflower meal': 'सूरजमुखी खली',
    'sunflower meal (undecorticated)': 'सूरजमुखी खली (अनछिलका)',
    'tamarind seed powder': 'इमली बीज पाउडर',
    'urea': 'यूरिया',
    'wheat bran': 'गेहूं का चोकर',
    'whole corn plant': 'पूरा मक्का पौधा',
    'whole corn silage': 'पूरा मक्का साइलेज',
    'whole cotton seed': 'पूरा कपास बीज',
    'white coconut meal': 'सफेद नारियल खली',
    'brewer\'s grain dry': 'सूखा ब्रूअर अनाज',
    'wet beer residue': 'गीला बीयर अवशेष',
    'spent grain': 'खर्च किया अनाज',
    'commercial - cattle adult feed': 'व्यावसायिक - वयस्क गोपशु चारा',
    'commercial - cattle heifer feed': 'व्यावसायिक - बछिया चारा',
    'anjan grass': 'अंजन घास',
    'mombasa guinea': 'मोम्बासा गिनी',
    'mombasa grass': 'मोम्बासा घास',
    'mulato grass': 'मुलाटो घास',
    'mulato ii/hybrid brachiaria': 'मुलाटो II/हाइब्रिड ब्रेकियेरिया',
    'pakchong grass': 'पाकचोंग घास',
    'ruzi grass': 'रूज़ी घास',
    'japanese sweet potato root': 'जापानी शकरकंद जड़',
  },
  te: {
    'rice straw': 'వరి గడ్డి',
    'rice bran': 'తవుడు',
    'wheat bran': 'గోధుమ తవుడు',
    'groundnut meal': 'వేరుశెనగ పిండి',
    'soybean meal': 'సోయాబీన్ పిండి',
    'cotton meal': 'పత్తి పిండి',
    'mineral mixture': 'ఖనిజ మిశ్రమం',
    'napier grass': 'నేపియర్ గడ్డి',
    'guinea grass': 'గినీ గడ్డి',
    'corn meal': 'మొక్కజొన్న పిండి',
    'urea': 'యూరియా',
    'chickpea': 'శెనగలు',
    'natural grass': 'సహజ గడ్డి',
  },
  bn: {
    'rice straw': 'ধানের খড়',
    'rice bran': 'চালের কুঁড়া',
    'wheat bran': 'গমের ভুসি',
    'groundnut meal': 'চিনাবাদাম খৈল',
    'soybean meal': 'সয়াবিন খৈল',
    'mineral mixture': 'খনিজ মিশ্রণ',
    'napier grass': 'নেপিয়ার ঘাস',
    'corn meal': 'ভুট্টার গুঁড়া',
    'urea': 'ইউরিয়া',
    'natural grass': 'প্রাকৃতিক ঘাস',
  },
  mr: {
    'rice straw': 'भाताचा पेंढा',
    'rice bran': 'तांदळाचा कोंडा',
    'wheat bran': 'गव्हाचा कोंडा',
    'groundnut meal': 'भुईमूग पेंड',
    'soybean meal': 'सोयाबीन पेंड',
    'cotton meal': 'कापूस पेंड',
    'mineral mixture': 'खनिज मिश्रण',
    'napier grass': 'नेपिअर गवत',
    'corn meal': 'मक्याचे पीठ',
    'urea': 'युरिया',
    'natural grass': 'नैसर्गिक गवत',
  },
  vi: {
    'alfalfa': 'Cỏ linh lăng',
    'cassava waste': 'Bã sắn',
    'corn meal': 'Bột ngô',
    'corn silage': 'Ngô ủ chua',
    'corn stem': 'Thân ngô',
    'corn plant': 'Cây ngô',
    'rice straw': 'Rơm rạ',
    'rice bran': 'Cám gạo',
    'soybean meal': 'Bã đậu nành',
    'napier grass': 'Cỏ voi',
    'guinea grass': 'Cỏ guinea',
    'elephant grass': 'Cỏ voi',
    'urea': 'Urê',
    'mineral mixture': 'Hỗn hợp khoáng',
    'natural grass': 'Cỏ tự nhiên',
    'copra meal': 'Bã dừa',
    'pumpkin skin': 'Vỏ bí',
    'okara': 'Bã đậu phụ',
    'commercial concentrate': 'Thức ăn hỗn hợp',
    'sugarcane tops': 'Ngọn mía',
  },
  fil: {
    'rice straw': 'Dayami ng palay',
    'rice bran': 'Darak',
    'corn meal': 'Giniling na mais',
    'copra meal': 'Copra meal',
    'napier grass': 'Napier grass',
    'guinea grass': 'Guinea grass',
    'urea': 'Urea',
    'mineral mixture': 'Mineral mixture',
    'natural grass': 'Likas na damo',
  },
};

// Season suffix translations
const SEASON_TRANSLATIONS: Record<string, Record<string, string>> = {
  hi: { 'dry season': 'सूखा मौसम', 'wet season': 'गीला मौसम' },
  te: { 'dry season': 'ఎండా కాలం', 'wet season': 'వర్షాకాలం' },
  bn: { 'dry season': 'শুষ্ক মৌসুম', 'wet season': 'বর্ষা মৌসুম' },
  mr: { 'dry season': 'कोरडा हंगाम', 'wet season': 'पावसाळा' },
  vi: { 'dry season': 'Mùa khô', 'wet season': 'Mùa mưa' },
};

/**
 * Strip season suffix from a feed name for translation lookup.
 * E.g. "Guinea grass, Wet Season" → "guinea grass"
 */
function getBaseName(fdName: string): string {
  return fdName
    .replace(/,?\s*(dry|wet)\s*season$/i, '')
    .replace(/,?\s*(early|late|mature)\s*(vegetative|stage)?,?\s*/i, '')
    .replace(/,?\s*milk\s*stage,?\s*/i, '')
    .trim()
    .toLowerCase();
}

/**
 * Extract season suffix if present.
 * Returns the season part lowercase, or empty string.
 */
function getSeasonSuffix(fdName: string): string {
  const match = fdName.match(/(dry|wet)\s*season/i);
  return match ? match[0].toLowerCase() : '';
}

/**
 * Translate a feed name to the given locale.
 * Returns the translated name or null if no translation exists.
 */
export function translateFeedName(fdName: string, locale: string): string | null {
  const localeMap = FEED_NAME_TRANSLATIONS[locale];
  if (!localeMap) return null;

  const lower = fdName.toLowerCase();

  // Try exact match first
  if (localeMap[lower]) return localeMap[lower];

  // Try base name + translated season
  const baseName = getBaseName(fdName);
  const baseTranslation = localeMap[baseName];
  if (!baseTranslation) return null;

  const season = getSeasonSuffix(fdName);
  if (season) {
    const seasonMap = SEASON_TRANSLATIONS[locale];
    const translatedSeason = seasonMap?.[season];
    if (translatedSeason) {
      return `${baseTranslation}, ${translatedSeason}`;
    }
    // Fallback: use translated base + English season
    return `${baseTranslation}, ${fdName.match(/(Dry|Wet)\s*[Ss]eason/)?.[0] || season}`;
  }

  return baseTranslation;
}

/**
 * Apply translations to an array of feeds, setting local_name for the given locale.
 * Mutates the feeds in place for efficiency (called after DB fetch).
 */
export function applyFeedTranslations(
  feeds: Array<{ fd_name?: string; local_name?: string; name: string }>,
  locale: string,
): void {
  if (locale === 'en') return; // English feeds don't need translation

  for (const feed of feeds) {
    const englishName = feed.fd_name || feed.name;
    if (!englishName) continue;

    const translated = translateFeedName(englishName, locale);
    if (translated) {
      feed.local_name = translated;
      // Set name to local_name so it appears as primary in non-English locales
      // (getFeedDisplayName already handles this via LOCAL_LOCALES check)
    }
  }
}
