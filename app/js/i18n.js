// All interface text. Arabic uses neutral forms (no gendered "you" verbs), design D9.
// Functions take numbers already formatted as strings where they show money.

const ar = {
  appName: 'ذهب اليوم',
  otherLang: 'English',
  share: 'مشاركة',
  tabToday: 'اليوم',
  tabGold: 'ذهبي',
  tabFuture: 'المستقبل',
  tabBuySell: 'بيع وشراء',
  rial: 'ريال',
  rialPerGram: 'ريال للجرام',
  karat: 'العيار',
  karatN: (k) => `عيار ${k}`,
  note: 'دليل عام وليس نصيحة مالية',
  close: 'إغلاق',
  cancel: 'إلغاء',
  save: 'حفظ',
  remove: 'حذف',
  edit: 'تعديل',

  perGramNow: 'سعر جرام الذهب الآن',
  live: 'مباشر',
  delayed: 'الأسعار متأخرة',
  closed: 'السوق مغلق لعطلة نهاية الأسبوع، وهذا آخر سعر يوم الجمعة',
  none: 'السعر غير متاح بعد، نحاول مرة أخرى',
  less: (v) => `أقل من أمس بـ ${v} ريال`,
  more: (v) => `أعلى من أمس بـ ${v} ريال`,
  same: 'نفس سعر أمس',
  priceAria: (v, k) => `${v} ريال للجرام، عيار ${k}`,
  whyTitle: 'لماذا تحرّك الذهب اليوم',
  mood0: 'الذهب اليوم أرخص من كل أيام هذه السنة تقريباً',
  mood1: 'الذهب اليوم أرخص من معظم أيام هذه السنة',
  mood2: 'سعر الذهب اليوم قريب من متوسط هذه السنة',
  mood3: 'الذهب اليوم أغلى من معظم أيام هذه السنة',
  mood4: 'الذهب اليوم أغلى من كل أيام هذه السنة تقريباً',
  hint0: 'وقت مناسب للشراء، أما البيع فكان أفضل قبل أشهر.',
  hint1: 'وقت عادي للشراء والبيع.',
  hint2: 'وقت مناسب للبيع، أما الشراء فأغلى من المعتاد.',
  cheapest: 'الأرخص هذه السنة',
  dearest: 'الأغلى هذه السنة',
  vsYear: 'مقارنة بأسعار هذه السنة',
  boardTitle: 'لوحة الأسعار',
  col1g: 'جرام',
  col10g: '10 جرام',
  colTola: 'تولة',
  boardNote: 'المحلات تبيع المشغولات بسعر أعلى من هذا، لأن أجرة المصنعية وضريبة القيمة المضافة 5% تضافان إليه.',
  shareToday: 'مشاركة أسعار اليوم',
  world: (v) => `السعر العالمي ${v} دولار للأونصة`,

  myGold: 'ذهبي',
  ifSold: 'لو بيع اليوم، يساوي تقريباً',
  range: (a, b) => `بين ${a} و ${b} ريال حسب المحل`,
  piecesTitle: 'القطع',
  addPiece: 'إضافة قطعة',
  editPiece: 'تعديل القطعة',
  emptyTitle: 'لا توجد قطع بعد',
  emptyBody: 'بعد إضافة أول قطعة تظهر قيمتها هنا كل يوم. مثال: أساور 50 جرام عيار 21.',
  pieceName: 'الاسم (اختياري)',
  namePlaceholder: 'مثال: أساور العرس',
  unnamed: 'قطعة ذهب',
  weightG: 'الوزن بالجرام',
  grams: 'جرام',
  boughtPrice: 'سعر الشراء بالريال (اختياري)',
  boughtWhen: 'شهر وسنة الشراء (اختياري)',
  worthToday: (v) => `قيمتها اليوم ${v} ريال`,
  gainUp: (bp, when, amt, pct) => `سعر الشراء ${bp} ريال${when ? ` (${when})` : ''}، الربح حتى الآن ${amt} ريال (${pct}%)`,
  gainDown: (bp, when, amt, pct) => `سعر الشراء ${bp} ريال${when ? ` (${when})` : ''}، الخسارة حتى الآن ${amt} ريال (${pct}%)`,
  totalUp: (amt, pct) => `الربح منذ الشراء ${amt} ريال (${pct}%)`,
  totalDown: (amt, pct) => `الخسارة منذ الشراء ${amt} ريال (${pct}%)`,
  covers: (n, of) => `لـ ${n} من ${of} قطع لها سعر شراء`,
  payLessNote: 'المحلات تدفع عادة أقل قليلاً من قيمة الذهب، والسعر النهائي يحدده المحل. أجرة المصنعية والضريبة لا تُستردّان عادة عند البيع.',
  estimateTag: 'تقدير',
  badWeight: 'الوزن بين 0.1 و 5,000 جرام',

  outlook: 'ماذا يتوقع الخبراء',
  outlookSub: (k) => `السعر المتوقع لجرام عيار ${k}`,
  in1: 'بعد سنة',
  in5: 'بعد 5 سنوات',
  in10: 'بعد 10 سنوات',
  ago5: 'قبل 5 سنوات',
  today: 'اليوم',
  y1Note: (n) => `منتصف توقعات ${n} بنوك، كما نشرتها وسائل الإعلام`,
  bandNote: (lo, hi) => `بين ${lo} و ${hi} حسب تاريخ الذهب منذ 1971`,
  sources: 'المصادر',
  colInstitution: 'المؤسسة',
  colTarget: 'السعر المستهدف',
  colBy: 'الموعد',
  colPublished: 'تاريخ النشر',
  colReportedBy: 'نشره',
  asReported: 'كما نُشر',
  reportTitle: 'ما مدى دقة التوقعات؟',
  winnerLine: (year, name, org, f, a, miss) => `الأدق لعام ${year}: ${name} (${org}) توقّع ${f} دولار، وكان المتوسط الفعلي ${a} دولار (فرق ${miss}%).`,
  surveyLine: (year, avg, actual) => `توقّع المحللون لعام ${year} متوسط ${avg} دولار، والمتوسط الفعلي لعام ${year} حتى الآن ${actual} دولار.`,
  reportClose: 'حتى أفضل المتوقعين يخطئون غالباً بنسبة 10 إلى 15%، فالتوقعات دليل تقريبي فقط.',
  updatedOn: (d) => `تم تحديث التوقعات في ${d}`,
  dataSources: 'مصادر البيانات',
  photos: 'الصور',
  targetBy: (d) => `بحلول ${d}`,
  publishedVia: (d, who) => `نُشر في ${d} عبر ${who}`,

  buySellTitle: 'بيع وشراء',
  costTitle: 'كم يجب أن تكلّف هذه القطعة؟',
  making: 'أجرة المصنعية',
  perGramMode: 'ريال للجرام',
  percentMode: 'نسبة %',
  shopRate: 'سعر الجرام في المحل',
  shopRateHint: 'مكتوب بسعر اليوم، ويمكن تغييره حسب لوحة المحل',
  goldValue: 'قيمة الذهب',
  makingLine: 'المصنعية',
  vatLine: 'ضريبة القيمة المضافة 5%',
  totalLine: 'المجموع',
  costNote: 'أجرة المصنعية والضريبة لا تُستردّان عادة عند البيع.',
  offerTitle: 'هل عرض المحل عادل؟',
  offerAmount: 'المبلغ الذي عرضه المحل بالريال',
  offerValue: (v) => `قيمة الذهب اليوم ${v} ريال`,
  verdictAbove: 'العرض أعلى من قيمة الذهب اليوم.',
  verdictClose: 'العرض قريب من قيمة الذهب.',
  verdictLow: 'العرض أقل قليلاً، وقد يعرض محل آخر أكثر.',
  verdictVeryLow: 'العرض أقل بكثير من قيمة الذهب اليوم، والمقارنة مع محل آخر أفضل.',
  gapBelow: (p) => `أقل من قيمة الذهب بـ ${p}%`,
  gapAbove: (p) => `أعلى من قيمة الذهب بـ ${p}%`,
  enterPrompt: 'تظهر النتيجة بعد إدخال الوزن والمبلغ',
  placesTitle: 'أماكن البيع والشراء في مسقط',
  map: 'الخريطة',
  guideTitle: 'دليل العيارات والأختام',
  g24: 'ذهب خالص تقريباً، للسبائك والعملات',
  g22: '91.6% ذهب، الأكثر شيوعاً في المشغولات',
  g21: '87.5% ذهب، شائع في الخليج',
  g18: '75% ذهب، أقوى وأفتح لوناً',
  stampWhere: 'يوجد الختم عادة على المشبك أو داخل السوار أو الخاتم.',
  tipsTitle: 'نصائح',
  tip1: 'الفاتورة تساعد على سعر أفضل عند البيع.',
  tip2: 'ختم العيار يثبت نوع الذهب.',
  tip3: 'المقارنة بين محلين قبل البيع قد ترفع العرض.',
  tip4: 'طلب أي خصم مكتوباً يمنع المفاجآت.',

  installTitle: 'إضافة التطبيق إلى الشاشة الرئيسية',
  installIos: 'في سفاري: زر المشاركة، ثم «إضافة إلى الشاشة الرئيسية».',
  installAndroid: 'في كروم: القائمة ⋮، ثم «تثبيت التطبيق».',
  gotIt: 'حسناً',

  shareTitle: 'أسعار الذهب في مسقط',
  perGramShort: 'للجرام',
  shareFooter: 'من تطبيق ذهب اليوم',
};

const en = {
  appName: 'Gold Today',
  otherLang: 'العربية',
  share: 'Share',
  tabToday: 'Today',
  tabGold: 'My gold',
  tabFuture: 'Future',
  tabBuySell: 'Buy & sell',
  rial: 'rials',
  rialPerGram: 'rials per gram',
  karat: 'Karat',
  karatN: (k) => `${k} karat`,
  note: 'A general guide, not financial advice',
  close: 'Close',
  cancel: 'Cancel',
  save: 'Save',
  remove: 'Remove',
  edit: 'Edit',

  perGramNow: 'Gold price per gram, now',
  live: 'Live',
  delayed: 'Prices are delayed',
  closed: 'Market closed for the weekend, last price from Friday',
  none: 'Price not available yet, trying again',
  less: (v) => `${v} rials less than yesterday`,
  more: (v) => `${v} rials more than yesterday`,
  same: 'Same as yesterday',
  priceAria: (v, k) => `${v} rials per gram, ${k} karat`,
  whyTitle: 'Why gold moved today',
  mood0: 'Gold is cheaper today than on almost any day this year.',
  mood1: 'Gold is cheaper today than on most days this year.',
  mood2: 'Gold is close to its average price for this year.',
  mood3: 'Gold is more expensive today than on most days this year.',
  mood4: 'Gold is more expensive today than on almost any day this year.',
  hint0: 'A good moment to buy. Selling paid more a few months ago.',
  hint1: 'An ordinary moment to buy or sell.',
  hint2: 'A good moment to sell. Buying costs more than usual.',
  cheapest: 'Cheapest this year',
  dearest: 'Highest this year',
  vsYear: 'Compared with this year',
  boardTitle: 'Price board',
  col1g: '1 gram',
  col10g: '10 grams',
  colTola: '1 tola',
  boardNote: 'Shops sell jewellery for more than this: making charges and 5% VAT are added.',
  shareToday: "Share today's prices",
  world: (v) => `World price $${v} an ounce`,

  myGold: 'My gold',
  ifSold: 'If sold today, it is worth about',
  range: (a, b) => `Between ${a} and ${b} rials, depending on the shop`,
  piecesTitle: 'Pieces',
  addPiece: 'Add a piece',
  editPiece: 'Edit piece',
  emptyTitle: 'No pieces yet',
  emptyBody: 'Add your first piece and its value shows here every day. For example: bangles, 50 grams, 21 karat.',
  pieceName: 'Name (optional)',
  namePlaceholder: 'For example: wedding bangles',
  unnamed: 'Gold piece',
  weightG: 'Weight in grams',
  grams: 'grams',
  boughtPrice: 'Bought for, in rials (optional)',
  boughtWhen: 'Month and year bought (optional)',
  worthToday: (v) => `Worth ${v} rials today`,
  gainUp: (bp, when, amt, pct) => `Bought for ${bp} rials${when ? ` in ${when}` : ''}, now up ${amt} rials (${pct}%)`,
  gainDown: (bp, when, amt, pct) => `Bought for ${bp} rials${when ? ` in ${when}` : ''}, now down ${amt} rials (${pct}%)`,
  totalUp: (amt, pct) => `Up ${amt} rials (${pct}%) since bought`,
  totalDown: (amt, pct) => `Down ${amt} rials (${pct}%) since bought`,
  covers: (n, of) => `covers ${n} of ${of} pieces with a bought price`,
  payLessNote: 'Shops usually pay a little under the gold value, and each sets its final price. Making charges and VAT are normally not paid back.',
  estimateTag: 'estimate',
  badWeight: 'Weight between 0.1 and 5,000 grams',

  outlook: 'What experts expect',
  outlookSub: (k) => `Expected price per gram, ${k} karat`,
  in1: 'In 1 year',
  in5: 'In 5 years',
  in10: 'In 10 years',
  ago5: '5 years ago',
  today: 'Today',
  y1Note: (n) => `Middle of ${n} bank forecasts, as reported`,
  bandNote: (lo, hi) => `From ${lo} to ${hi}, based on gold's history since 1971`,
  sources: 'Sources',
  colInstitution: 'Institution',
  colTarget: 'Target',
  colBy: 'By',
  colPublished: 'Published',
  colReportedBy: 'Reported by',
  asReported: 'as reported',
  reportTitle: 'How good are forecasts?',
  winnerLine: (year, name, org, f, a, miss) => `Most accurate for ${year}: ${name} (${org}) forecast $${f}; the actual average was $${a} (${miss}% off).`,
  surveyLine: (year, avg, actual) => `For ${year} analysts expected an average of $${avg}; the actual ${year} average so far is $${actual}.`,
  reportClose: 'Even the best forecasters often miss by 10 to 15%, so treat forecasts as a rough guide.',
  updatedOn: (d) => `Forecasts updated on ${d}`,
  dataSources: 'Data sources',
  photos: 'Photos',
  targetBy: (d) => `by ${d}`,
  publishedVia: (d, who) => `Published ${d}, reported by ${who}`,

  buySellTitle: 'Buy and sell',
  costTitle: 'What should this piece cost?',
  making: 'Making charge',
  perGramMode: 'rials per gram',
  percentMode: 'percent',
  shopRate: "Shop's rate per gram",
  shopRateHint: "Filled with today's rate; change it to match the shop's board",
  goldValue: 'Gold value',
  makingLine: 'Making charge',
  vatLine: 'VAT 5%',
  totalLine: 'Total',
  costNote: 'Making charges and VAT are normally not paid back when you sell.',
  offerTitle: 'Is this offer fair?',
  offerAmount: "The shop's offer, in rials",
  offerValue: (v) => `Today's gold value: ${v} rials`,
  verdictAbove: "The offer is above today's gold value.",
  verdictClose: 'The offer is close to the gold value.',
  verdictLow: 'A little low; another shop may offer more.',
  verdictVeryLow: "Well below today's gold value; compare with another shop.",
  gapBelow: (p) => `${p}% below the gold value`,
  gapAbove: (p) => `${p}% above the gold value`,
  enterPrompt: 'Enter the weight and amount to see the result',
  placesTitle: 'Where to buy and sell in Muscat',
  map: 'Map',
  guideTitle: 'Karat and hallmark guide',
  g24: 'Almost pure gold, for bars and coins',
  g22: '91.6% gold, the most common for jewellery',
  g21: '87.5% gold, common in the Gulf',
  g18: '75% gold, stronger and paler',
  stampWhere: 'The stamp is usually on the clasp or inside a bangle or ring.',
  tipsTitle: 'Tips',
  tip1: 'Keeping the receipt helps you get a better price.',
  tip2: "The karat stamp proves the gold's purity.",
  tip3: 'Comparing two shops before selling can raise the offer.',
  tip4: 'Asking for any deduction in writing avoids surprises.',

  installTitle: 'Add it to your home screen',
  installIos: 'In Safari: tap Share, then "Add to Home Screen".',
  installAndroid: 'In Chrome: menu ⋮, then "Install app".',
  gotIt: 'Got it',

  shareTitle: 'Gold prices in Muscat',
  perGramShort: 'per gram',
  shareFooter: 'From the Gold Today app',
};

export const STRINGS = { ar, en };

/** Text for a key; template entries receive the extra arguments. Unknown keys return the key. */
export function t(lang, key, ...args) {
  const v = (STRINGS[lang] || en)[key] ?? en[key];
  if (v == null) return key;
  return typeof v === 'function' ? v(...args) : v;
}

/** "updated N seconds/minutes ago" with Arabic number forms; minutes from 60 seconds on (review M2). */
export function agoText(lang, s) {
  const m = Math.floor(s / 60);
  if (lang === 'ar') {
    if (s < 5) return 'تم التحديث الآن';
    if (m < 1) return `آخر تحديث قبل ${s} ${s <= 10 ? 'ثوانٍ' : 'ثانية'}`;
    if (m === 1) return 'آخر تحديث قبل دقيقة';
    if (m === 2) return 'آخر تحديث قبل دقيقتين';
    return `آخر تحديث قبل ${m} ${m <= 10 ? 'دقائق' : 'دقيقة'}`;
  }
  if (s < 5) return 'updated just now';
  if (m < 1) return `updated ${s} seconds ago`;
  return m === 1 ? 'updated 1 minute ago' : `updated ${m} minutes ago`;
}

/** When a delayed price is from, in Muscat time: "Last price: Tuesday 3:10 PM"; adds the date after 6 days (review I5). */
export function lastPriceText(lang, updatedAt, now = Date.now()) {
  if (!Number.isFinite(updatedAt)) return '';
  const old = now - updatedAt > 6 * 864e5;
  const f = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-OM-u-nu-latn' : 'en-US', {
    timeZone: 'Asia/Muscat', weekday: 'long', hour: 'numeric', minute: '2-digit', ...(old ? { day: 'numeric', month: 'long' } : {}),
  });
  return `${lang === 'ar' ? 'آخر سعر: ' : 'Last price: '}${f.format(updatedAt)}`;
}

const MONTHS = {
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

/** 'YYYY-MM' to "مارس 2019" / "March 2019"; '' when missing. */
export function monthYear(lang, ym) {
  if (!ym) return '';
  const [y, m] = ym.split('-').map(Number);
  return `${(MONTHS[lang] || MONTHS.en)[m - 1]} ${y}`;
}

/** 'YYYY-MM-DD' to "25 نوفمبر 2026" / "25 November 2026". */
export function dayMonthYear(lang, ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  return `${d} ${(MONTHS[lang] || MONTHS.en)[m - 1]} ${y}`;
}
