// All interface text. Arabic uses neutral forms (no gendered "you" verbs), design D9.
// Money arguments are numbers; the strings format them so Arabic nouns can agree with them (QA36).
import { formatNum } from './price.js';

// Arabic counted nouns: 1 and 2 have their own words, 3-10 take the plural, 11-99 the singular
// accusative, and round hundreds the plain singular. The dual has a nominative and a genitive form.
function countAr(n, [one, twoNom, twoGen, few, many, plain], nominative = false) {
  if (n === 1) return one;
  if (n === 2) return nominative ? twoNom : twoGen;
  const r = n % 100;
  return `${formatNum(n, 0)} ${r >= 3 && r <= 10 ? few : r >= 11 ? many : plain}`;
}
const PIECE = ['قطعة واحدة', 'قطعتان', 'قطعتين', 'قطع', 'قطعة', 'قطعة'];
const BANK = ['بنك واحد', 'بنكان', 'بنكين', 'بنوك', 'بنكاً', 'بنك'];
const nounAr = (n, few, many, plain) => {
  const r = Math.round(Math.abs(n)) % 100;
  return r >= 3 && r <= 10 ? few : r >= 11 ? many : plain;
};
const rialsAr = (n) => `${formatNum(n, 0)} ${nounAr(n, 'ريالات', 'ريالاً', 'ريال')}`;
const dollarsAr = (n) => `${formatNum(n, 0)} ${nounAr(n, 'دولارات', 'دولاراً', 'دولار')}`;
const rialsEn = (n) => `${formatNum(n, 0)} ${Math.round(n) === 1 ? 'rial' : 'rials'}`;

const ar = {
  appName: 'ذهب اليوم',
  otherLang: 'English',
  share: 'مشاركة',
  tabsLabel: 'الأقسام',
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
  editNamed: (name) => `تعديل ${name}`,

  todayTitle: 'سعر الذهب اليوم في عُمان',
  perGramNow: (k) => `سعر جرام الذهب عيار ${k} الآن`,
  lastGram: (k) => `آخر سعر لجرام الذهب عيار ${k}`,
  loading: 'جارٍ جلب السعر',
  live: 'مباشر',
  delayed: 'الأسعار متأخرة',
  closed: 'تداول الذهب العالمي متوقف حتى فجر الاثنين.\nهذا آخر سعر من مساء الجمعة.',
  none: 'السعر غير متاح الآن، نحاول مرة أخرى',
  yesterday: 'أمس',
  onDay: (day) => `يوم ${day}`,
  less: (v, day) => `أقل من سعر ${day} بـ ${v} ريال`,
  more: (v, day) => `أعلى من سعر ${day} بـ ${v} ريال`,
  same: (day) => `نفس سعر ${day}`,
  priceAria: (v, k) => `${v} ريال للجرام، عيار ${k}`,
  whyTitle: (d) => `آخر أخبار الذهب (${d})`,
  whySource: 'المصدر',
  mood0: 'الذهب اليوم أرخص من كل أيام آخر 12 شهراً تقريباً',
  mood1: 'الذهب اليوم أرخص من معظم أيام آخر 12 شهراً',
  mood2: 'سعر الذهب اليوم قريب من متوسط آخر 12 شهراً',
  mood3: 'الذهب اليوم أغلى من معظم أيام آخر 12 شهراً',
  mood4: 'الذهب اليوم أغلى من كل أيام آخر 12 شهراً تقريباً',
  hint0: 'الشراء أرخص من المعتاد، والبيع يعطي مبلغاً أقل.',
  hint1: 'الشراء والبيع قريبان من المعتاد.',
  hint2: 'البيع يعطي مبلغاً أكبر من المعتاد، والشراء أغلى.',
  cheapest: 'الأرخص في 12 شهراً',
  dearest: 'الأغلى في 12 شهراً',
  boardTitle: 'لوحة الأسعار',
  boardUnit: 'بالريال العماني',
  col1g: '1 جرام',
  col10g: '10 جرام',
  colTola: '1 تولة',
  boardNote: 'المحلات تبيع المشغولات بسعر أعلى من هذا، لأن أجرة المصنعية وضريبة القيمة المضافة 5% تضافان إليه.',
  shareToday: 'مشاركة أسعار اليوم',
  world: (v) => `السعر العالمي ${dollarsAr(v)} للأونصة`,

  myGold: 'ذهبي',
  ifSold: 'قيمة ذهبي لو بيع اليوم: نحو',
  range: (a, b) => `بين ${formatNum(a, 0)} و${rialsAr(b)} حسب المحل`,
  noPrice: 'السعر غير متاح الآن، تظهر القيمة عند عودة الاتصال.',
  addPiece: 'إضافة قطعة',
  editPiece: 'تعديل القطعة',
  maxPieces: 'الحد الأقصى 20 قطعة',
  emptyTitle: 'لا توجد قطع بعد',
  emptyBody: 'بعد إضافة أول قطعة تظهر قيمتها هنا كل يوم. مثال: أساور 50 جرام عيار 21.',
  moreDetails: 'تفاصيل إضافية (اختياري)',
  pieceName: 'الاسم',
  namePlaceholder: 'مثال: أساور العرس',
  nameChips: ['أساور', 'عقد', 'خاتم', 'طقم'],
  unnamed: 'قطعة ذهب',
  weightG: 'الوزن بالجرام',
  grams: 'جرام',
  boughtPrice: 'سعر الشراء بالريال',
  boughtWhen: 'شهر وسنة الشراء',
  monthLabel: 'الشهر',
  yearLabel: 'السنة',
  worthToday: (v) => `تُباع اليوم بنحو ${rialsAr(v)}`,
  gainUp: (bp, when, amt, pct) => `سعر الشراء ${rialsAr(bp)}${when ? ` (${when})` : ''}، الربح حتى الآن ${rialsAr(amt)} (${pct}%)`,
  gainDown: (bp, when, amt, pct) => `سعر الشراء ${rialsAr(bp)}${when ? ` (${when})` : ''}، الخسارة حتى الآن ${rialsAr(amt)} (${pct}%)`,
  totalUp: (amt, pct) => `الربح منذ الشراء ${rialsAr(amt)} (${pct}%)`,
  totalDown: (amt, pct) => `الخسارة منذ الشراء ${rialsAr(amt)} (${pct}%)`,
  covers: (n, of) => `(محسوبة للقطع التي لها سعر شراء فقط: ${countAr(n, PIECE, true)} من ${countAr(of, PIECE)})`,
  payLessNote: 'المحلات تدفع عادة أقل قليلاً من قيمة الذهب، والسعر النهائي يحدده المحل. أجرة المصنعية والضريبة لا تُستردّان عادة عند البيع.',
  estimateTag: 'تقدير',
  badWeight: 'يُرجى كتابة وزن بين 0.1 و5,000 جرام.',
  badPrice: 'تعذّرت قراءة السعر. يُكتب بالأرقام فقط، مثل 350.',
  removeAsk: 'حذف هذه القطعة؟ لا يمكن التراجع.',
  removeYes: 'نعم، احذف',
  removeNo: 'لا',
  storageNote: 'القطع محفوظة على هذا الهاتف فقط. إضافة التطبيق إلى الشاشة الرئيسية تحميها من الحذف.',
  storageHow: 'كيف؟',
  shareList: 'مشاركة قائمتي',
  listTitle: 'قائمة ذهبي',
  listPaid: (v, when) => `سعر الشراء ${rialsAr(v)}${when ? ` (${when})` : ''}`,

  outlook: 'توقعات سعر الذهب',
  outlookSub: (k) => `لجرام عيار ${k}، من توقعات البنوك وتاريخ الذهب`,
  banksLabel: 'البنوك',
  bankRow: 'توقع البنوك',
  bankFor: (ym) => (ym.endsWith('-12') ? `لنهاية ${ym.slice(0, 4)}` : `ل${monthYear('ar', ym)}`),
  todayRow: 'اليوم',
  histTitle: 'لو تكرّر ما حدث منذ 1971',
  in5: 'بعد 5 سنوات',
  in10: 'بعد 10 سنوات',
  histRange: (lo, hi) => `بين ${formatNum(lo, 0)} و${rialsAr(hi)}`,
  histNote: 'هذا ليس توقعاً، بل ما فعله سعر الذهب في الماضي مطبّقاً على سعر اليوم.',
  ago5: 'قبل 5 سنوات',
  today: 'اليوم',
  y1Note: (n) => (n === 1 ? 'توقع بنك واحد، كما نقلته وسائل الإعلام' : `الرقم الأوسط بين توقعات ${countAr(n, BANK)}، كما نقلتها وسائل الإعلام`),
  sources: 'المصادر',
  reportTitle: 'ما مدى دقة التوقعات؟',
  winnerLine: (year, f, a, miss) => `أدق المتوقعين لعام ${year} توقّع ${dollarsAr(f)} للأونصة، وجاء المتوسط الفعلي ${dollarsAr(a)}، بفارق ${miss}%.`,
  surveyLine: (year, avg, actual) => `توقّع المحللون أن يبلغ متوسط ${year} نحو ${dollarsAr(avg)} للأونصة، والمتوسط الفعلي حتى الآن ${dollarsAr(actual)}.`,
  reportClose: 'حتى أفضل المتوقعين يخطئون غالباً بنسبة 10 إلى 15%، فالتوقعات دليل تقريبي فقط.',
  updatedOn: (d) => `تم تحديث التوقعات في ${d}`,
  dataSources: 'مصادر البيانات',
  targetBy: (ym) => (ym.endsWith('-12') ? `نهاية ${ym.slice(0, 4)}` : `بحلول ${monthYear('ar', ym)}`),
  srcGram: (k) => `ريال لجرام عيار ${k}`,
  srcOz: (v) => `${dollarsAr(v)} للأونصة`,
  publishedVia: (d) => `نُشر في ${d} عبر`,

  buySellTitle: 'بيع وشراء',
  whenBuying: 'عند الشراء',
  whenSelling: 'عند البيع',
  costTitle: 'كم يجب أن تكلّف هذه القطعة؟',
  making: 'أجرة المصنعية',
  perGramMode: 'ريال للجرام',
  percentMode: 'نسبة %',
  shopRate: 'سعر الجرام في المحل',
  shopRateHint: 'هذا سعر السوق اليوم، ويمكن تغييره ليطابق لوحة المحل',
  goldValue: 'قيمة الذهب',
  makingLine: 'المصنعية',
  vatLine: 'ضريبة القيمة المضافة 5%',
  totalLine: 'المجموع',
  costNote: 'أجرة المصنعية والضريبة لا تُستردّان عادة عند البيع.',
  vat24: 'السبائك والعملات الخالصة معفاة عادة من الضريبة.',
  costPrompt: 'تظهر التكلفة بعد كتابة الوزن',
  badMaking: 'يُرجى كتابة الأجرة بالأرقام، صفر أو أكثر.',
  badRate: 'يُرجى كتابة سعر الجرام بالأرقام.',
  offerTitle: 'هل عرض المحل عادل؟',
  offerAmount: 'المبلغ الذي عرضه المحل بالريال',
  offerValue: (v) => `قيمة الذهب اليوم ${v} ريال`,
  offerPrompt: 'يظهر التقييم بعد كتابة الوزن والمبلغ',
  badOffer: 'يُرجى كتابة المبلغ بالأرقام.',
  verdictAbove: 'العرض أعلى من قيمة الذهب اليوم.',
  verdictClose: 'العرض قريب جداً من قيمة الذهب.',
  verdictUsual: 'عرض معتاد: المحلات تدفع عادة أقل من قيمة الذهب بـ 2 إلى 6%.',
  verdictLow: 'العرض أقل من المعتاد. يُستحسن سؤال محل آخر قبل البيع.',
  gapBelow: (p) => `أقل من قيمة الذهب بـ ${p}%`,
  gapAbove: (p) => `أعلى من قيمة الذهب بـ ${p}%`,
  placesTitle: 'أماكن البيع والشراء في مسقط',
  mapOf: (place, branch) => (branch ? `خريطة ${place}، ${branch}` : `خريطة ${place}`),
  guideTitle: 'دليل العيارات والأختام',
  g24: 'ذهب خالص تقريباً، للسبائك والعملات',
  g22: '91.6% ذهب، الأكثر شيوعاً في المشغولات',
  g21: '87.5% ذهب، شائع في الخليج',
  g18: '75% ذهب، أقوى وأفتح لوناً',
  stampWhere: 'يوجد الختم عادة على المشبك أو داخل السوار أو الخاتم.',
  tipsTitle: 'نصائح',
  tip1: 'الاحتفاظ بالفاتورة يساعد على سعر أفضل عند البيع.',
  tip2: 'ختم العيار يُثبت عيار الذهب.',
  tip3: 'المقارنة بين محلين قبل البيع قد ترفع العرض.',
  tip4: 'كتابة أي مبلغ يخصمه المحل على الفاتورة تمنع المفاجآت.',

  installTitle: 'إضافة التطبيق إلى الشاشة الرئيسية',
  installIos: 'في سفاري: زر المشاركة، ثم «إضافة إلى الشاشة الرئيسية».',
  installAndroid: 'في كروم: زر القائمة (النقاط الثلاث أعلى الشاشة)، ثم «تثبيت التطبيق».',
  gotIt: 'حسناً',

  shareTitle: 'أسعار الذهب في مسقط',
  shareNote: 'هذا سعر الذهب الخام. المشغولات أغلى بسبب المصنعية وضريبة 5%.',
  shareFooter: 'من تطبيق ذهب اليوم',
};

const en = {
  appName: 'Gold Today',
  otherLang: 'العربية',
  share: 'Share',
  tabsLabel: 'Sections',
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
  editNamed: (name) => `Edit ${name}`,

  todayTitle: 'Gold price today in Oman',
  perGramNow: (k) => `Price per gram of ${k} karat gold, now`,
  lastGram: (k) => `Last price per gram of ${k} karat gold`,
  loading: 'Getting the price',
  live: 'Live',
  delayed: 'Prices are delayed',
  closed: "World gold trading is closed until early Monday (Muscat time).\nThis is Friday's last price.",
  none: 'Price not available right now, trying again',
  yesterday: 'yesterday',
  onDay: (day) => `on ${day}`,
  less: (v, day) => `${v} rials less than ${day}`,
  more: (v, day) => `${v} rials more than ${day}`,
  same: (day) => `Same as ${day}`,
  priceAria: (v, k) => `${v} rials per gram, ${k} karat`,
  whyTitle: (d) => `Latest gold news (${d})`,
  whySource: 'Source',
  mood0: 'Gold is cheaper today than on almost every day in the past 12 months.',
  mood1: 'Gold is cheaper today than on most days in the past 12 months.',
  mood2: 'Gold is close to its average for the past 12 months.',
  mood3: 'Gold costs more today than on most days in the past 12 months.',
  mood4: 'Gold costs more today than on almost every day in the past 12 months.',
  hint0: 'Buying costs less than usual, and selling brings less.',
  hint1: 'Buying and selling are both close to usual.',
  hint2: 'Selling brings more than usual, and buying costs more.',
  cheapest: 'Lowest in 12 months',
  dearest: 'Highest in 12 months',
  boardTitle: 'Price board',
  boardUnit: 'In Omani rials',
  col1g: '1 gram',
  col10g: '10 grams',
  colTola: '1 tola',
  boardNote: 'Shops sell jewellery for more than this, because the making charge and 5% VAT are added.',
  shareToday: "Share today's prices",
  world: (v) => `World price $${formatNum(v, 0)} an ounce`,

  myGold: 'My gold',
  ifSold: 'If sold today, it would fetch about',
  range: (a, b) => `Between ${formatNum(a, 0)} and ${rialsEn(b)}, depending on the shop`,
  noPrice: 'Price not available right now. Values show again when the connection is back.',
  addPiece: 'Add a piece',
  editPiece: 'Edit piece',
  maxPieces: 'Up to 20 pieces',
  emptyTitle: 'No pieces yet',
  emptyBody: 'Add your first piece and its value shows here every day. For example: bangles, 50 grams, 21 karat.',
  moreDetails: 'More details (optional)',
  pieceName: 'Name',
  namePlaceholder: 'For example: wedding bangles',
  nameChips: ['Bangles', 'Necklace', 'Ring', 'Set'],
  unnamed: 'Gold piece',
  weightG: 'Weight in grams',
  grams: 'grams',
  boughtPrice: 'Price paid, in rials',
  boughtWhen: 'Month and year bought',
  monthLabel: 'Month',
  yearLabel: 'Year',
  worthToday: (v) => `Would sell for about ${rialsEn(v)} today`,
  gainUp: (bp, when, amt, pct) => `Paid ${rialsEn(bp)}${when ? ` in ${when}` : ''}, now up ${rialsEn(amt)} (${pct}%)`,
  gainDown: (bp, when, amt, pct) => `Paid ${rialsEn(bp)}${when ? ` in ${when}` : ''}, now down ${rialsEn(amt)} (${pct}%)`,
  totalUp: (amt, pct) => `Up ${rialsEn(amt)} (${pct}%) since bought`,
  totalDown: (amt, pct) => `Down ${rialsEn(amt)} (${pct}%) since bought`,
  covers: (n, of) => `(counts only the ${n} of ${of} pieces with a price paid)`,
  payLessNote: 'Shops usually pay a little under the gold value, and each sets its final price. Making charges and VAT are normally not paid back.',
  estimateTag: 'estimate',
  badWeight: 'Please enter a weight between 0.1 and 5,000 grams.',
  badPrice: "Couldn't read the price. Use numbers only, for example 350.",
  removeAsk: "Remove this piece? This can't be undone.",
  removeYes: 'Yes, remove',
  removeNo: 'No',
  storageNote: 'Pieces are saved on this phone only. Adding the app to the home screen keeps them safe.',
  storageHow: 'How?',
  shareList: 'Share my list',
  listTitle: 'My gold list',
  listPaid: (v, when) => `paid ${rialsEn(v)}${when ? ` in ${when}` : ''}`,

  outlook: 'Gold price outlook',
  outlookSub: (k) => `Per gram of ${k} karat, from bank forecasts and gold's history`,
  banksLabel: 'Banks',
  bankRow: "Banks' forecast",
  bankFor: (ym) => (ym.endsWith('-12') ? `for end of ${ym.slice(0, 4)}` : `for ${monthYear('en', ym)}`),
  todayRow: 'Today',
  histTitle: 'If gold moves as it has since 1971',
  in5: 'In 5 years',
  in10: 'In 10 years',
  histRange: (lo, hi) => `${formatNum(lo, 0)} to ${rialsEn(hi)}`,
  histNote: "Not a forecast: gold's past moves applied to today's price.",
  ago5: '5 years ago',
  today: 'Today',
  y1Note: (n) => (n === 1 ? "One bank's forecast, as reported in the media" : `The middle of ${n} bank forecasts, as reported in the media`),
  sources: 'Sources',
  reportTitle: 'How good are forecasts?',
  winnerLine: (year, f, a, miss) => `The most accurate forecaster for ${year} expected $${formatNum(f, 0)} an ounce. The actual average was $${formatNum(a, 0)}, ${miss}% off.`,
  surveyLine: (year, avg, actual) => `Analysts expected ${year} to average about $${formatNum(avg, 0)} an ounce. The actual average so far is $${formatNum(actual, 0)}.`,
  reportClose: 'Even the best forecasters often miss by 10 to 15%, so treat forecasts as a rough guide.',
  updatedOn: (d) => `Forecasts updated on ${d}`,
  dataSources: 'Data sources',
  targetBy: (ym) => (ym.endsWith('-12') ? `end of ${ym.slice(0, 4)}` : `by ${monthYear('en', ym)}`),
  srcGram: (k) => `rials per gram of ${k} karat`,
  srcOz: (v) => `$${formatNum(v, 0)} an ounce`,
  publishedVia: (d) => `Published ${d}, reported by`,

  buySellTitle: 'Buy & sell',
  whenBuying: 'When buying',
  whenSelling: 'When selling',
  costTitle: 'What should this piece cost?',
  making: 'Making charge',
  perGramMode: 'rials per gram',
  percentMode: 'percent',
  shopRate: "Shop's rate per gram",
  shopRateHint: "This is today's market rate. Change it to match the shop's board.",
  goldValue: 'Gold value',
  makingLine: 'Making charge',
  vatLine: 'VAT 5%',
  totalLine: 'Total',
  costNote: 'Making charges and VAT are normally not paid back when you sell.',
  vat24: 'Pure gold bars and coins are usually VAT-free.',
  costPrompt: 'Enter the weight to see the cost',
  badMaking: 'Please enter the making charge in numbers, zero or more.',
  badRate: 'Please enter the rate per gram in numbers.',
  offerTitle: 'Is this offer fair?',
  offerAmount: "The shop's offer, in rials",
  offerValue: (v) => `Today's gold value: ${v} rials`,
  offerPrompt: 'Enter the weight and the offer to see how it compares',
  badOffer: 'Please enter the offer in numbers.',
  verdictAbove: "The offer is above today's gold value.",
  verdictClose: 'The offer is very close to the gold value.',
  verdictUsual: 'A usual offer: shops normally pay 2 to 6% under the gold value.',
  verdictLow: 'Lower than usual. Worth asking another shop before selling.',
  gapBelow: (p) => `${p}% below the gold value`,
  gapAbove: (p) => `${p}% above the gold value`,
  placesTitle: 'Where to buy and sell in Muscat',
  mapOf: (place, branch) => (branch ? `Map of ${place}, ${branch}` : `Map of ${place}`),
  guideTitle: 'Karat and hallmark guide',
  g24: 'Almost pure gold, for bars and coins',
  g22: '91.6% gold, the most common for jewellery',
  g21: '87.5% gold, common in the Gulf',
  g18: '75% gold, stronger and paler',
  stampWhere: 'The stamp is usually on the clasp or inside a bangle or ring.',
  tipsTitle: 'Tips',
  tip1: 'Keeping the receipt helps you get a better price when selling.',
  tip2: "The karat stamp proves the gold's karat.",
  tip3: 'Comparing two shops before selling can raise the offer.',
  tip4: 'Having any deduction written on the receipt avoids surprises.',

  installTitle: 'Add it to your home screen',
  installIos: 'In Safari: tap Share, then "Add to Home Screen".',
  installAndroid: 'In Chrome: the menu button (three dots at the top), then "Install app".',
  gotIt: 'Got it',

  shareTitle: 'Gold prices in Muscat',
  shareNote: 'Raw gold price. Jewellery costs more (making charge and 5% VAT).',
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

const locale = (lang) => (lang === 'ar' ? 'ar-OM-u-nu-latn' : 'en-GB');

/** When a delayed price is from, in Muscat time: "Last price: Tuesday 3:10 pm"; adds the date after 6 days (review I5). */
export function lastPriceText(lang, updatedAt, now = Date.now()) {
  if (!Number.isFinite(updatedAt)) return '';
  const old = now - updatedAt > 6 * 864e5;
  const f = new Intl.DateTimeFormat(locale(lang), {
    timeZone: 'Asia/Muscat', weekday: 'long', hour: 'numeric', minute: '2-digit', hour12: true, ...(old ? { day: 'numeric', month: 'long' } : {}),
  });
  return `${lang === 'ar' ? 'آخر سعر: ' : 'Last price: '}${f.format(updatedAt)}`;
}

/** Day, month, year and time of a price in Muscat, one format for the app and the share card (QA38). */
export function priceTime(lang, at) {
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone: 'Asia/Muscat', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(at);
}

const MONTHS = {
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};
const WEEKDAYS = {
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

/** The twelve month names in a language, for the month picker. */
export const monthNames = (lang) => MONTHS[lang] || MONTHS.en;

/** 'YYYY-MM' to "مارس 2019" / "March 2019", and 'YYYY' to "2019"; '' when missing. */
export function monthYear(lang, ym) {
  if (!ym) return '';
  if (!ym.includes('-')) return ym;
  const [y, m] = ym.split('-').map(Number);
  return `${monthNames(lang)[m - 1]} ${y}`;
}

/** 'YYYY-MM-DD' to "25 نوفمبر 2026" / "25 November 2026". */
export function dayMonthYear(lang, ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  return `${d} ${monthNames(lang)[m - 1]} ${y}`;
}

/** 'YYYY-MM-DD' to "25 نوفمبر" / "25 November". */
export function dayMonth(lang, ymd) {
  if (!ymd) return '';
  const [, m, d] = ymd.split('-').map(Number);
  return `${d} ${monthNames(lang)[m - 1]}`;
}

/** "أمس" / "yesterday", or the weekday of a close: "يوم الجمعة" / "on Friday". */
export function closeDay(lang, ymd, yesterday) {
  if (yesterday) return t(lang, 'yesterday');
  return t(lang, 'onDay', (WEEKDAYS[lang] || WEEKDAYS.en)[new Date(`${ymd}T12:00:00Z`).getUTCDay()]);
}
