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
  // Tamil
  ta: {
    'rice straw': 'வைக்கோல்',
    'rice bran': 'தவிடு',
    'wheat bran': 'கோதுமை தவிடு',
    'groundnut meal': 'நிலக்கடலை புண்ணாக்கு',
    'soybean meal': 'சோயாபீன் புண்ணாக்கு',
    'cotton meal': 'பருத்தி புண்ணாக்கு',
    'cottonseed meal': 'பருத்தி விதை புண்ணாக்கு',
    'mineral mixture': 'கனிம கலவை',
    'napier grass': 'நேப்பியர் புல்',
    'guinea grass': 'கினி புல்',
    'corn meal': 'சோள மாவு',
    'corn silage': 'சோள சைலேஜ்',
    'urea': 'யூரியா',
    'natural grass': 'இயற்கை புல்',
    'sugarcane tops': 'கரும்பு நுனி',
    'sorghum straw': 'சோளத்தட்டை',
    'copra meal': 'கொப்பரை புண்ணாக்கு',
    'rapeseed meal': 'கடுகு புண்ணாக்கு',
    'sunflower meal': 'சூரியகாந்தி புண்ணாக்கு',
    'chickpea': 'கொண்டைக்கடலை',
    'limestone': 'சுண்ணாம்புக்கல்',
  },
  // Gujarati
  gu: {
    'rice straw': 'ડાંગરનું પરાળ',
    'rice bran': 'ચોખાની ભૂસી',
    'wheat bran': 'ઘઉંનો ભૂસો',
    'groundnut meal': 'મગફળીનો ખોળ',
    'soybean meal': 'સોયાબીન ખોળ',
    'cotton meal': 'કપાસિયા ખોળ',
    'cottonseed meal': 'કપાસિયા ખોળ',
    'mineral mixture': 'ખનિજ મિશ્રણ',
    'napier grass': 'નેપિયર ઘાસ',
    'guinea grass': 'ગિની ઘાસ',
    'corn meal': 'મકાઈનો લોટ',
    'corn silage': 'મકાઈ સાઈલેજ',
    'urea': 'યુરિયા',
    'natural grass': 'કુદરતી ઘાસ',
    'sugarcane tops': 'શેરડીના ટોચા',
    'sorghum straw': 'જુવારનો ભૂસો',
    'rapeseed meal': 'રાઈનો ખોળ',
    'chickpea': 'ચણા',
    'limestone': 'ચૂનાનો પત્થર',
  },
  // Kannada
  kn: {
    'rice straw': 'ಭತ್ತದ ಹುಲ್ಲು',
    'rice bran': 'ಅಕ್ಕಿ ತವುಡು',
    'wheat bran': 'ಗೋಧಿ ತವುಡು',
    'groundnut meal': 'ಕಡಲೆಕಾಯಿ ಹಿಂಡಿ',
    'soybean meal': 'ಸೋಯಾಬೀನ್ ಹಿಂಡಿ',
    'cotton meal': 'ಹತ್ತಿ ಹಿಂಡಿ',
    'mineral mixture': 'ಖನಿಜ ಮಿಶ್ರಣ',
    'napier grass': 'ನೇಪಿಯರ್ ಹುಲ್ಲು',
    'guinea grass': 'ಗಿನಿ ಹುಲ್ಲು',
    'corn meal': 'ಮೆಕ್ಕೆಜೋಳ ಹಿಟ್ಟು',
    'urea': 'ಯೂರಿಯಾ',
    'natural grass': 'ನೈಸರ್ಗಿಕ ಹುಲ್ಲು',
    'sugarcane tops': 'ಕಬ್ಬಿನ ತುದಿ',
    'sorghum straw': 'ಜೋಳದ ಹುಲ್ಲು',
    'chickpea': 'ಕಡಲೆ',
    'copra meal': 'ಕೊಬ್ಬರಿ ಹಿಂಡಿ',
  },
  // Malayalam
  ml: {
    'rice straw': 'വൈക്കോൽ',
    'rice bran': 'അരിത്തവിട്',
    'wheat bran': 'ഗോതമ്പ് തവിട്',
    'groundnut meal': 'കടല പിണ്ണാക്ക്',
    'soybean meal': 'സോയാബീൻ പിണ്ണാക്ക്',
    'cotton meal': 'പരുത്തി പിണ്ണാക്ക്',
    'mineral mixture': 'ധാതു മിശ്രിതം',
    'napier grass': 'നേപ്പിയർ പുല്ല്',
    'guinea grass': 'ഗിനി പുല്ല്',
    'corn meal': 'ചോളപ്പൊടി',
    'urea': 'യൂറിയ',
    'natural grass': 'പ്രകൃതി പുല്ല്',
    'copra meal': 'കൊപ്ര പിണ്ണാക്ക്',
    'sugarcane tops': 'കരിമ്പിൻ തല',
    'chickpea': 'കടല',
  },
  // Odia
  or: {
    'rice straw': 'ଧାନ ନଡ଼ା',
    'rice bran': 'ଚାଉଳ ଖୁଦ',
    'wheat bran': 'ଗହମ ଭୁସି',
    'groundnut meal': 'ବାଦାମ ଖଳି',
    'soybean meal': 'ସୋୟାବିନ ଖଳି',
    'mineral mixture': 'ଖଣିଜ ମିଶ୍ରଣ',
    'napier grass': 'ନେପିଅର ଘାସ',
    'corn meal': 'ମକା ଗୁଣ୍ଡ',
    'urea': 'ୟୁରିଆ',
    'natural grass': 'ପ୍ରାକୃତିକ ଘାସ',
    'chickpea': 'ଚଣା',
  },
  // Punjabi
  pa: {
    'rice straw': 'ਪਰਾਲੀ',
    'rice bran': 'ਚੌਲਾਂ ਦੀ ਭੁੱਕੀ',
    'wheat bran': 'ਕਣਕ ਦਾ ਛਾਣ',
    'groundnut meal': 'ਮੂੰਗਫਲੀ ਦੀ ਖਲ਼',
    'soybean meal': 'ਸੋਇਆਬੀਨ ਖਲ਼',
    'cotton meal': 'ਕਪਾਹ ਖਲ਼',
    'cottonseed meal': 'ਬਿਨੌਲੇ ਦੀ ਖਲ਼',
    'mineral mixture': 'ਖਣਿਜ ਮਿਸ਼ਰਣ',
    'napier grass': 'ਨੇਪੀਅਰ ਘਾਹ',
    'guinea grass': 'ਗਿਨੀ ਘਾਹ',
    'corn meal': 'ਮੱਕੀ ਦਾ ਆਟਾ',
    'corn silage': 'ਮੱਕੀ ਸਾਈਲੇਜ',
    'urea': 'ਯੂਰੀਆ',
    'natural grass': 'ਕੁਦਰਤੀ ਘਾਹ',
    'sugarcane tops': 'ਗੰਨੇ ਦੀਆਂ ਪੱਤੀਆਂ',
    'sorghum straw': 'ਜੁਆਰ ਦੀ ਤੂੜੀ',
    'rapeseed meal': 'ਸਰ੍ਹੋਂ ਦੀ ਖਲ਼',
    'oat hay': 'ਜਵੀ ਦਾ ਸੁੱਕਾ ਚਾਰਾ',
    'chickpea': 'ਛੋਲੇ',
    'limestone': 'ਚੂਨਾ ਪੱਥਰ',
  },
  // Assamese
  as: {
    'rice straw': 'ধানৰ নৰা',
    'rice bran': 'চাউলৰ তুঁহ',
    'wheat bran': 'ঘেঁহুৰ ভুচি',
    'groundnut meal': 'বাদাম খলিহৈ',
    'soybean meal': 'ছয়াবিন খলিহৈ',
    'mineral mixture': 'খনিজ মিশ্ৰণ',
    'napier grass': 'নেপিয়াৰ ঘাঁহ',
    'corn meal': 'মকাইৰ গুড়ি',
    'urea': 'ইউৰিয়া',
    'natural grass': 'প্ৰাকৃতিক ঘাঁহ',
  },
  // Urdu
  ur: {
    'rice straw': 'چاول کا بھوسا',
    'rice bran': 'چاول کا چھلکا',
    'wheat bran': 'گندم کا چوکر',
    'groundnut meal': 'مونگ پھلی کی کھل',
    'soybean meal': 'سویابین کھل',
    'cotton meal': 'کپاس کھل',
    'cottonseed meal': 'بنولے کی کھل',
    'mineral mixture': 'معدنی مرکب',
    'napier grass': 'نیپیئر گھاس',
    'guinea grass': 'گنی گھاس',
    'corn meal': 'مکئی کا آٹا',
    'corn silage': 'مکئی سائلیج',
    'urea': 'یوریا',
    'natural grass': 'قدرتی گھاس',
    'sugarcane tops': 'گنے کی پتیاں',
    'sorghum straw': 'جوار کا بھوسا',
    'rapeseed meal': 'سرسوں کی کھل',
    'chickpea': 'چنا',
    'limestone': 'چونے کا پتھر',
  },
  // Nepali
  ne: {
    'rice straw': 'धानको पराल',
    'rice bran': 'चामलको भुस',
    'wheat bran': 'गहुँको भुस',
    'groundnut meal': 'बदाम खल',
    'soybean meal': 'सोयाबिन खल',
    'cotton meal': 'कपास खल',
    'mineral mixture': 'खनिज मिश्रण',
    'napier grass': 'नेपियर घाँस',
    'guinea grass': 'गिनी घाँस',
    'corn meal': 'मकै पिठो',
    'corn silage': 'मकै साइलेज',
    'urea': 'युरिया',
    'natural grass': 'प्राकृतिक घाँस',
    'sugarcane tops': 'उखुको पात',
    'chickpea': 'चना',
    'limestone': 'चुनढुङ्गा',
  },
  // Amharic (Ethiopia)
  am: {
    'rice straw': 'የሩዝ ገለባ',
    'rice bran': 'የሩዝ ፉርሻ',
    'wheat bran': 'የስንዴ ፉርሻ',
    'corn meal': 'የበቆሎ ዱቄት',
    'corn silage': 'የበቆሎ ሳይሌጅ',
    'soybean meal': 'የአኩሪ አተር ዱቄት',
    'groundnut meal': 'የለውዝ ዱቄት',
    'mineral mixture': 'ማዕድን ድብልቅ',
    'napier grass': 'ናፒየር ሳር',
    'natural grass': 'ተፈጥሮ ሳር',
    'urea': 'ዩሪያ',
    'sorghum straw': 'የማሽላ ገለባ',
    'sugarcane tops': 'የሸንኮራ አገዳ ቅጠል',
    'chickpea': 'ሽምብራ',
    'limestone': 'የኖራ ድንጋይ',
  },
  // Oromo (Ethiopia)
  om: {
    'rice straw': 'cilaattii ruuzii',
    'wheat bran': 'furii qamadii',
    'corn meal': 'daakuu boqqolloo',
    'soybean meal': 'daakuu soyabiinii',
    'mineral mixture': 'makala albuudaa',
    'napier grass': 'marga naappiyarii',
    'natural grass': 'marga uumamaa',
    'urea': 'yuuriyaa',
    'sorghum straw': 'cilaattii mishingaa',
    'chickpea': 'shumbura',
  },
  // Indonesian
  id: {
    'rice straw': 'Jerami padi',
    'rice bran': 'Dedak padi',
    'wheat bran': 'Dedak gandum',
    'corn meal': 'Tepung jagung',
    'corn silage': 'Silase jagung',
    'soybean meal': 'Bungkil kedelai',
    'groundnut meal': 'Bungkil kacang',
    'copra meal': 'Bungkil kelapa',
    'mineral mixture': 'Campuran mineral',
    'napier grass': 'Rumput gajah',
    'guinea grass': 'Rumput guinea',
    'elephant grass': 'Rumput gajah',
    'natural grass': 'Rumput alami',
    'urea': 'Urea',
    'sugarcane tops': 'Pucuk tebu',
    'cassava waste': 'Ampas singkong',
    'commercial concentrate': 'Konsentrat komersial',
  },
  // Arabic
  ar: {
    'rice straw': 'قش الأرز',
    'rice bran': 'نخالة الأرز',
    'wheat bran': 'نخالة القمح',
    'corn meal': 'دقيق الذرة',
    'corn silage': 'سيلاج الذرة',
    'soybean meal': 'كسب فول الصويا',
    'groundnut meal': 'كسب الفول السوداني',
    'cottonseed meal': 'كسب بذرة القطن',
    'mineral mixture': 'خليط المعادن',
    'napier grass': 'حشيشة النابير',
    'natural grass': 'العشب الطبيعي',
    'urea': 'يوريا',
    'sugarcane tops': 'قمم قصب السكر',
    'sorghum straw': 'قش الذرة الرفيعة',
    'alfalfa': 'البرسيم الحجازي',
    'chickpea': 'الحمص',
    'limestone': 'الحجر الجيري',
  },
  // Thai
  th: {
    'rice straw': 'ฟางข้าว',
    'rice bran': 'รำข้าว',
    'wheat bran': 'รำข้าวสาลี',
    'corn meal': 'ข้าวโพดบด',
    'corn silage': 'ข้าวโพดหมัก',
    'soybean meal': 'กากถั่วเหลือง',
    'groundnut meal': 'กากถั่วลิสง',
    'copra meal': 'กากมะพร้าว',
    'mineral mixture': 'แร่ธาตุผสม',
    'napier grass': 'หญ้าเนเปียร์',
    'guinea grass': 'หญ้ากินี',
    'natural grass': 'หญ้าธรรมชาติ',
    'urea': 'ยูเรีย',
    'cassava waste': 'กากมันสำปะหลัง',
    'sugarcane tops': 'ยอดอ้อย',
    'leucaena': 'กระถิน',
  },
  // French (for francophone Africa)
  fr: {
    'rice straw': 'Paille de riz',
    'rice bran': 'Son de riz',
    'wheat bran': 'Son de blé',
    'corn meal': 'Farine de maïs',
    'corn silage': 'Ensilage de maïs',
    'soybean meal': 'Tourteau de soja',
    'groundnut meal': 'Tourteau d\'arachide',
    'cottonseed meal': 'Tourteau de coton',
    'copra meal': 'Tourteau de coprah',
    'mineral mixture': 'Mélange minéral',
    'napier grass': 'Herbe à éléphant',
    'guinea grass': 'Herbe de Guinée',
    'elephant grass': 'Herbe à éléphant',
    'natural grass': 'Herbe naturelle',
    'urea': 'Urée',
    'sugarcane tops': 'Têtes de canne à sucre',
    'cassava waste': 'Déchets de manioc',
    'alfalfa': 'Luzerne',
    'sorghum straw': 'Paille de sorgho',
    'limestone': 'Calcaire',
    'chickpea': 'Pois chiche',
    'commercial concentrate': 'Concentré commercial',
  },
};

// Season suffix translations
const SEASON_TRANSLATIONS: Record<string, Record<string, string>> = {
  hi: { 'dry season': 'सूखा मौसम', 'wet season': 'गीला मौसम' },
  te: { 'dry season': 'ఎండా కాలం', 'wet season': 'వర్షాకాలం' },
  bn: { 'dry season': 'শুষ্ক মৌসুম', 'wet season': 'বর্ষা মৌসুম' },
  mr: { 'dry season': 'कोरडा हंगाम', 'wet season': 'पावसाळा' },
  vi: { 'dry season': 'Mùa khô', 'wet season': 'Mùa mưa' },
  ta: { 'dry season': 'வறண்ட காலம்', 'wet season': 'மழைக்காலம்' },
  gu: { 'dry season': 'ઉનાળો', 'wet season': 'ચોમાસું' },
  kn: { 'dry season': 'ಬೇಸಿಗೆ', 'wet season': 'ಮಳೆಗಾಲ' },
  ml: { 'dry season': 'വരണ്ട കാലം', 'wet season': 'മഴക്കാലം' },
  pa: { 'dry season': 'ਖੁਸ਼ਕ ਮੌਸਮ', 'wet season': 'ਬਰਸਾਤੀ ਮੌਸਮ' },
  ur: { 'dry season': 'خشک موسم', 'wet season': 'بارش کا موسم' },
  ne: { 'dry season': 'सुख्खा मौसम', 'wet season': 'वर्षा मौसम' },
  am: { 'dry season': 'ደረቅ ወቅት', 'wet season': 'ክረምት' },
  id: { 'dry season': 'Musim kemarau', 'wet season': 'Musim hujan' },
  ar: { 'dry season': 'موسم الجفاف', 'wet season': 'موسم الأمطار' },
  th: { 'dry season': 'ฤดูแล้ง', 'wet season': 'ฤดูฝน' },
  fr: { 'dry season': 'Saison sèche', 'wet season': 'Saison des pluies' },
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
