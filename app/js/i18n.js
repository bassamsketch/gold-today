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
const MARRA = ['مرة واحدة', 'مرتان', 'مرتين', 'مرات', 'مرة', 'مرة'];
const CASE = ['حالة واحدة', 'حالتان', 'حالتين', 'حالات', 'حالة', 'حالة'];
const up = (p) => Math.abs(Math.round(p));
const listEn = (items) => (items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items.at(-1)}` : items[0] || '');

/** "6 أشهر" / "4 years": months under two years, whole years from there (design 7.3). */
export function durationText(lang, months) {
  if (months < 24) {
    if (lang !== 'ar') return `${months} ${months === 1 ? 'month' : 'months'}`;
    return months === 1 ? 'شهر' : months === 2 ? 'شهرين' : `${months} ${nounAr(months, 'أشهر', 'شهراً', 'شهر')}`;
  }
  const y = Math.round(months / 12);
  if (lang !== 'ar') return `${y} ${y === 1 ? 'year' : 'years'}`;
  return y === 2 ? 'سنتين' : `${y} ${nounAr(y, 'سنوات', 'سنة', 'سنة')}`;
}
const sortedDurations = (lang, months) => [...months].sort((a, b) => a - b).map((m) => durationText(lang, m));
// the horizon of bank targets: "بنهاية 2027" / "by the end of 2027"
const byAr = (ym) => (ym.endsWith('-12') ? `بنهاية ${ym.slice(0, 4)}` : `بحلول ${monthYear('ar', ym)}`);
const byEn = (ym) => (ym.endsWith('-12') ? `by the end of ${ym.slice(0, 4)}` : `by ${monthYear('en', ym)}`);

const ar = {
  appName: 'ذهب اليوم',
  otherLang: 'English',
  share: 'مشاركة',
  tabsLabel: 'الأقسام',
  tabToday: 'اليوم',
  tabGold: 'ذهبي',
  tabFuture: 'التوقعات',
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
  todayRow: 'اليوم',
  ago5: 'قبل 5 سنوات',
  today: 'اليوم',
  sources: 'المصادر',
  updatedOn: (d) => `تم تحديث التوقعات في ${d}`,
  dataSources: 'مصادر البيانات',
  targetBy: (ym) => (ym.endsWith('-12') ? `نهاية ${ym.slice(0, 4)}` : `بحلول ${monthYear('ar', ym)}`),
  srcGram: (k) => `ريال لجرام عيار ${k}`,
  srcOz: (v) => `${dollarsAr(v)} للأونصة`,
  publishedVia: (d) => `نُشر في ${d} عبر`,

  // Outlook (design 7)
  pricesPerGram: (k) => `الأسعار لجرام عيار ${k}`,
  q1: 'هل السعر اليوم مرتفع أم منخفض؟',
  belowRecord: (p) => `أقل بـ ${up(p)}% من أعلى سعر وصل إليه`,
  atRecord: 'عند أعلى سعر وصل إليه',
  pastWeek: (p) => `آخر أسبوع: ${Math.round(p) === 0 ? 'دون تغيير' : `${p < 0 ? 'أقل' : 'أعلى'} بـ ${up(p)}%`}`,
  pastMonth: (p) => `آخر شهر: ${Math.round(p) === 0 ? 'دون تغيير' : `${p < 0 ? 'أقل' : 'أعلى'} بـ ${up(p)}%`}`,
  chartRecord: 'أعلى سعر',
  recordRow: 'أعلى سعر',
  fallsLine: (months, current, longestYear) => `${current ? 'قبل الهبوط الحالي، ' : ''}هبط الذهب منذ 1971 بـ 20% أو أكثر ${countAr(months.length, MARRA)}، وعاد إلى أعلى سعره بعد ${sortedDurations('ar', months).join(' و')}.${longestYear ? ` أطول انتظار جاء بعد أعمق هبوط، في ${longestYear}.` : ''}`,
  fallsCap: 'كل هبوط بـ 20% أو أكثر منذ 1971:',
  fallDepth: (p) => `هبط ${up(p)}%`,
  fallBack: (months) => `عاد بعد ${durationText('ar', months)}`,
  showDetails: 'عرض التفاصيل',
  q2: 'هل سيرتفع السعر؟',
  noOneKnows: 'لا أحد يعرف.',
  q2Sub: 'هذا ما حدث من قبل، وما تتوقعه البنوك:',
  afterYears: (n) => (n === 1 ? 'بعد سنة' : `بعد ${n} ${nounAr(n, 'سنوات', 'سنة', 'سنة')}`),
  higherCases: (k) => `ارتفع في ${countAr(k, CASE)} من كل 10`,
  oddsSince: 'منذ 1971، بدءاً من كل شهر، بأسعار الدولار دون احتساب التضخم. هذا ليس توقعاً.',
  worstLead: 'أسوأ 10 سنوات منذ 1971:',
  worstText: (when, p) => `من اشترى في ${when} وجد السعر أقل بـ ${up(p)}% بعد 10 سنوات.`,
  banksShort: (n, lo, hi, ym, today) => `${n === 1 ? 'يتوقع بنك واحد' : n === 2 ? 'يتوقع بنكان' : `تتوقع ${countAr(n, BANK, true)}`} أن يبلغ الجرام ${lo === hi ? `نحو ${lo}` : `بين ${lo} و${hi}`} ريال ${byAr(ym)} (اليوم ${today}). التوقعات ليست وعداً، وتخطئ في الاتجاهين.`,
  winnerMiss: (year, p, low) => `أفضل توقع لعام ${year} كان ${low ? 'أقل' : 'أعلى'} من الواقع بـ ${up(p)}%.`,
  surveyMiss: (year, p, high) => `وتوقعات ${year} ${high ? 'أعلى' : 'أقل'} مما حدث حتى الآن بـ ${up(p)}%.`,
  periodsCap: 'كل المدد منذ 1971:',
  periodLabel: (n) => (n === 1 ? 'سنة' : `${n} ${nounAr(n, 'سنوات', 'سنة', 'سنة')}`),
  outOf10: (k) => `${k} من 10`,
  periodRow: (typical, worst) => `في العادة ${typical >= 0 ? 'أعلى' : 'أقل'} بـ ${up(typical)}%، وفي أسوأ حالة ${worst < 0 ? 'أقل' : 'أعلى'} بـ ${up(worst)}%`,
  overlapNote: 'الفترات متداخلة، وتبدأ البيانات في 1971 حين صار سعر الذهب حراً بعد أن كان ثابتاً.',
  banksCap: 'البنوك، كما نقلتها وسائل الإعلام:',

  // My gold before (design 8)
  beforeTitle: 'قيمة ذهبي من قبل',
  yearHigh: 'الأعلى في آخر 12 شهراً',
  yearLow: 'الأدنى في آخر 12 شهراً',
  yearsAgo: (n) => `قبل ${n} ${nounAr(n, 'سنوات', 'سنة', 'سنة')}`,
  beforeNote: 'القطع نفسها بأسعار تلك الأيام.',
  rialWord: (v) => nounAr(v, 'ريالات', 'ريالاً', 'ريال'),

  // Buy & sell (design 6)
  pcWhen: 'عند المحل، قبل الدفع',
  pcTitle: 'هل هذا السعر معتاد؟',
  pcIntro: 'يبيّن كم من السعر ثمن الذهب نفسه، وكم يدفع المحل لو بيعت القطعة اليوم.',
  showExample: 'عرض مثال',
  pieceType: 'نوع القطعة',
  pieceOpt: 'مشغولات',
  barOpt: 'سبيكة أو عملة',
  pcPrice: 'السعر الكامل الذي يطلبه المحل، مع الضريبة، بالريال',
  pcAlt: 'أعطى المحل سعر الجرام والمصنعية بدلاً من ذلك؟',
  pcAltNote: 'يُحسب السعر من سعر الجرام والمصنعية وضريبة 5%.',
  badShopPrice: 'يُرجى كتابة السعر بالأرقام، حتى 1,000,000 ريال.',
  pcGold: 'ثمن الذهب في القطعة اليوم',
  pcExtra: 'يطلب المحل فوق ثمن الذهب',
  pcWhy: (p) => `أي ${up(p)}% فوق ثمن الذهب، مقابل المصنعية والضريبة وربح المحل.`,
  pcWhyBar: (p) => `أي ${up(p)}% فوق ثمن الذهب.`,
  noExtra: 'بلا زيادة',
  pcWithin: 'ضمن المعتاد للقطع البسيطة في مسقط.',
  pcBelow: 'أقل من المعتاد للقطع البسيطة.',
  pcAbove: 'أكثر من المعتاد للقطع البسيطة. التصاميم الدقيقة والماركات تكلّف أكثر عادةً.',
  pcRange: (lo, hi) => `المعتاد: من ${up(lo)}% إلى ${up(hi)}% فوق ثمن الذهب.`,
  pcBasis: 'تقدير من أجرة مصنعية 3 إلى 6 ريالات للجرام، وضريبة 5% على السعر كله كما ينص القانون. الأسعار تختلف من محل إلى آخر.',
  pcBarWithin: 'ضمن المعتاد للسبائك والعملات الصغيرة.',
  pcBarBelow: 'أقل من المعتاد للسبائك الصغيرة.',
  pcBarAbove: 'أكثر من المعتاد للسبائك الصغيرة.',
  pcBarBasis: 'علاوة السبائك الصغيرة عادةً من 2% إلى 9%، وتضاف ضريبة 5% إن احتسبها المحل.',
  pcUnder: 'السعر أقل من ثمن الذهب اليوم. يُستحسن التأكد من الوزن والعيار.',
  pcBack: 'لو بيعت اليوم، يدفع المحل نحو',
  pcPer100: (n) => `أي نحو ${n} من كل 100 ريال دُفعت.`,
  pcTarget: (price, target, k, today) => `ليعود مبلغ ${rialsAr(price)} كاملاً عند البيع، يلزم أن يصل سعر جرام عيار ${k} إلى نحو ${target} ريال (اليوم ${today}).`,
  ocWhen: 'عند بيع الذهب لمحل',
  ocIntro: 'يقارن المبلغ الذي يعرضه المحل بثمن الذهب اليوم.',
  jbWhen: 'عند التفكير في الادخار',
  jbTitle: 'مشغولات أم سبيكة؟',
  jbIntro: 'لكل 100 ريال تُدفع، يعيد المحل في اليوم نفسه نحو:',
  jbBar: 'سبيكة صغيرة عيار 24:',
  jbPiece: (mk, plain) => `قطعة ${plain ? 'بسيطة' : 'مشغولة'}، مصنعية ${mk} ${nounAr(mk, 'ريالات', 'ريالاً', 'ريال')} للجرام:`,
  jbTo: 'إلى',
  jbDiff: 'الفرق هو المصنعية والضريبة، ولا يعيدهما المحل عند البيع. لذلك تحتاج المشغولات ارتفاعاً أكبر في سعر الذهب قبل أن تعيد ما دُفع.',
  jbOnlyMoney: 'هذا يحسب المال الذي يعود فقط، ولا يحسب لبس القطعة أو إهداءها.',
  jbFine: 'تقديرات للمشغولات عيار 22: ضريبة 5% على السعر كله كما ينص القانون، ويدفع المحل عند بيعها أقل من ثمن ذهبها بنحو 4%. السبيكة الصغيرة أغلى من ثمن ذهبها بنحو 5%، ويدفع المحل أقل بنحو 1%. يفرض القانون ضريبة بنسبة صفر على الذهب الاستثماري (نقاوة 99% فأكثر)، لكن لائحته تقصرها على أول بيع بعد الاستخراج، لذلك تظهر السبيكة بالضريبة وبدونها. نسب السبائك من أسعار تجار خارج عُمان.',

  buySellTitle: 'بيع وشراء',
  making: 'أجرة المصنعية',
  perGramMode: 'ريال للجرام',
  percentMode: 'نسبة %',
  shopRate: 'سعر الجرام في المحل',
  shopRateHint: 'هذا سعر السوق اليوم، ويمكن تغييره ليطابق لوحة المحل',
  badMaking: 'يُرجى كتابة الأجرة بالأرقام، صفر أو أكثر.',
  badRate: 'يُرجى كتابة سعر الجرام بالأرقام.',
  offerTitle: 'هل هذا العرض معتاد؟',
  vat24: 'السبائك والعملات الخالصة معفاة عادة من الضريبة.',
  pcPrompt: 'تظهر النتيجة بعد كتابة الوزن والسعر',
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
  tabFuture: 'Outlook',
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
  todayRow: 'Today',
  ago5: '5 years ago',
  today: 'Today',
  sources: 'Sources',
  updatedOn: (d) => `Forecasts updated on ${d}`,
  dataSources: 'Data sources',
  targetBy: (ym) => (ym.endsWith('-12') ? `end of ${ym.slice(0, 4)}` : `by ${monthYear('en', ym)}`),
  srcGram: (k) => `rials per gram of ${k} karat`,
  srcOz: (v) => `$${formatNum(v, 0)} an ounce`,
  publishedVia: (d) => `Published ${d}, reported by`,

  // Outlook (design 7)
  pricesPerGram: (k) => `Prices per gram of ${k} karat`,
  q1: 'Is the price high or low today?',
  belowRecord: (p) => `${up(p)}% below its highest ever`,
  atRecord: 'At its highest ever',
  pastWeek: (p) => `Past week: ${Math.round(p) === 0 ? 'no change' : `${p < 0 ? 'down' : 'up'} ${up(p)}%`}`,
  pastMonth: (p) => `Past month: ${Math.round(p) === 0 ? 'no change' : `${p < 0 ? 'down' : 'up'} ${up(p)}%`}`,
  chartRecord: 'Highest',
  recordRow: 'Highest ever',
  fallsLine: (months, current, longestYear) => `${current ? 'Before this fall, gold' : 'Gold'} fell 20% or more ${months.length === 1 ? 'once' : `${months.length} times`} since 1971. It got back to its highest after ${listEn(sortedDurations('en', months))}.${longestYear ? ` The longest wait followed the deepest fall, in ${longestYear}.` : ''}`,
  fallsCap: 'Every fall of 20% or more since 1971:',
  fallDepth: (p) => `down ${up(p)}%`,
  fallBack: (months) => `back after ${durationText('en', months)}`,
  showDetails: 'Show details',
  q2: 'Will it go up?',
  noOneKnows: 'No one knows.',
  q2Sub: 'Here is what happened before, and what banks expect:',
  afterYears: (n) => `After ${n} ${n === 1 ? 'year' : 'years'}`,
  higherCases: (k) => `higher in ${k} ${k === 1 ? 'case' : 'cases'} out of 10`,
  oddsSince: 'Since 1971, starting from every month, in dollar prices before inflation. Not a forecast.',
  worstLead: 'The worst 10 years since 1971:',
  worstText: (when, p) => `buying in ${when} meant a price ${up(p)}% lower 10 years later.`,
  banksShort: (n, lo, hi, ym, today) => `${n === 1 ? '1 bank expects' : `${n} banks expect`} ${lo === hi ? `about ${lo}` : `${lo} to ${hi}`} rials a gram ${byEn(ym)} (today ${today}). Forecasts are not a promise, and they miss both ways.`,
  winnerMiss: (year, p, low) => `The best forecast for ${year} was ${up(p)}% too ${low ? 'low' : 'high'}.`,
  surveyMiss: (year, p, high) => `The forecast for ${year} is ${up(p)}% ${high ? 'above' : 'below'} the year so far.`,
  periodsCap: 'Every period since 1971:',
  periodLabel: (n) => `${n} ${n === 1 ? 'year' : 'years'}`,
  outOf10: (k) => `${k} in 10`,
  periodRow: (typical, worst) => `Usually ${up(typical)}% ${typical >= 0 ? 'higher' : 'lower'}. At worst ${up(worst)}% ${worst < 0 ? 'lower' : 'higher'}.`,
  overlapNote: "The periods overlap, and the data starts in 1971, when gold's price stopped being fixed.",
  banksCap: 'The banks, as reported in the media:',

  // My gold before (design 8)
  beforeTitle: 'What my gold was worth before',
  yearHigh: 'Highest in the last 12 months',
  yearLow: 'Lowest in the last 12 months',
  yearsAgo: (n) => `${n} years ago`,
  beforeNote: "The same pieces at those days' prices.",
  rialWord: (v) => (Math.round(v) === 1 ? 'rial' : 'rials'),

  // Buy & sell (design 6)
  pcWhen: 'At the shop, before paying',
  pcTitle: 'Is this a normal price?',
  pcIntro: 'Shows how much of the price is the gold itself, and what a shop would pay if the piece were sold today.',
  showExample: 'Show an example',
  pieceType: 'Type',
  pieceOpt: 'Jewellery',
  barOpt: 'Bar or coin',
  pcPrice: 'The full price the shop asks, with VAT, in rials',
  pcAlt: 'The shop gave a rate per gram and a making charge instead?',
  pcAltNote: 'The price is worked out from the rate, the making charge and 5% VAT.',
  badShopPrice: 'Please enter the price in numbers, up to 1,000,000 rials.',
  pcGold: 'The gold in this piece today',
  pcExtra: 'The shop asks on top',
  pcWhy: (p) => `That is ${up(p)}% on top of the gold, for the making, the VAT and the shop's profit.`,
  pcWhyBar: (p) => `That is ${up(p)}% on top of the gold.`,
  noExtra: 'No extra',
  pcWithin: 'Within the usual range for plain pieces in Muscat.',
  pcBelow: 'Less than usual for plain pieces.',
  pcAbove: 'More than usual for plain pieces. Detailed designs and brands usually cost more.',
  pcRange: (lo, hi) => `Usual: ${up(lo)}% to ${up(hi)}% on top of the gold.`,
  pcBasis: 'An estimate from making charges of 3 to 6 rials a gram, plus 5% VAT on the whole price as the law sets. Shops differ.',
  pcBarWithin: 'Within the usual range for small bars and coins.',
  pcBarBelow: 'Less than usual for small bars.',
  pcBarAbove: 'More than usual for small bars.',
  pcBarBasis: 'Small-bar premiums are usually 2% to 9%, plus 5% VAT if the shop charges it.',
  pcUnder: "The price is below today's gold value. The weight and karat are worth checking.",
  pcBack: 'If sold back today, a shop would pay about',
  pcPer100: (n) => `That is about ${n} of every 100 rials paid.`,
  pcTarget: (price, target, k, today) => `To get the ${rialsEn(price)} back when selling, gold would have to reach about ${target} rials a gram for ${k} karat (today ${today}).`,
  ocWhen: 'When selling to a shop',
  ocIntro: "Compares the shop's offer with today's gold value.",
  jbWhen: 'When thinking of saving',
  jbTitle: 'Jewellery or a bar?',
  jbIntro: 'For every 100 rials paid, a shop would pay back about this much the same day:',
  jbBar: 'A small 24 karat bar:',
  jbPiece: (mk, plain) => `A ${plain ? 'plain' : 'detailed'} piece, making ${mk} rials a gram:`,
  jbTo: 'to',
  jbDiff: 'The difference is the making charge and VAT, which shops do not pay back. So jewellery needs a bigger rise in the gold price before it returns what was paid.',
  jbOnlyMoney: 'This counts only the money that comes back, not wearing or giving the piece.',
  jbFine: 'Estimates for 22 karat jewellery: 5% VAT on the whole price, as the law sets, and shops pay about 4% under its gold value. A small bar costs about 5% over its gold value, and shops pay about 1% under. The law sets a zero VAT rate for investment gold (99% pure or more), but its regulations limit that to the first sale after extraction, so the bar is shown with and without VAT. The bar figures come from dealer prices outside Oman.',

  buySellTitle: 'Buy & sell',
  making: 'Making charge',
  perGramMode: 'rials per gram',
  percentMode: 'percent',
  shopRate: "Shop's rate per gram",
  shopRateHint: "This is today's market rate. Change it to match the shop's board.",
  badMaking: 'Please enter the making charge in numbers, zero or more.',
  badRate: 'Please enter the rate per gram in numbers.',
  offerTitle: 'Is this a normal offer?',
  vat24: 'Pure gold bars and coins are usually VAT-free.',
  pcPrompt: 'Enter the weight and the price to see the result',
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
