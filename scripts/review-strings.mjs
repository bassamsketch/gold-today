// Write docs/arabic-review.md from what actually ships: every string in app/js/i18n.js (templates filled
// with sample numbers) and the text in app/data. Run after changing any wording (QA33).
import { readFileSync, writeFileSync } from 'node:fs';
import { STRINGS } from '../app/js/i18n.js';

const SAMPLES = {
  karatN: [22], editNamed: ['أساور'], perGramNow: [22], lastGram: [22], onDay: ['الجمعة'],
  less: ['0.903', 'أمس'], more: ['0.903', 'أمس'], same: ['أمس'], priceAria: ['39.144', 22], whyTitle: ['25 نوفمبر'],
  world: [3454], range: [2183, 2276], worthToday: [449], gainUp: [300, 'مارس 2019', 41, '14'], gainDown: [300, 'مارس 2019', 41, '14'],
  totalUp: [41, '14'], totalDown: [41, '14'], covers: [1, 2], listPaid: [300, 'مارس 2019'], outlookSub: [22], bankFor: ['2027-12'],
  histRange: [32, 115], y1Note: [4], winnerLine: [2025, 2925, 3431.54, '15'], surveyLine: [2026, 4741.97, 4453], updatedOn: ['25 نوفمبر 2026'],
  targetBy: ['2027-12'], srcGram: [22], srcOz: [4650], publishedVia: ['14 نوفمبر 2026'], offerValue: ['393.213'],
  gapBelow: ['4.1'], gapAbove: ['1.2'], mapOf: ['ملابار للذهب والألماس', 'روي'],
};
const EN_SAMPLES = { ...SAMPLES, editNamed: ['Bangles'], onDay: ['Friday'], less: ['0.903', 'yesterday'], more: ['0.903', 'yesterday'], same: ['yesterday'], whyTitle: ['25 November'], gainUp: [300, 'March 2019', 41, '14'], gainDown: [300, 'March 2019', 41, '14'], listPaid: [300, 'March 2019'], updatedOn: ['25 November 2026'], publishedVia: ['14 November 2026'], mapOf: ['Malabar Gold & Diamonds', 'Ruwi'] };

const cell = (v, args, comma) => {
  const s = typeof v === 'function' ? v(...(args || [])) : Array.isArray(v) ? v.join(comma) : String(v);
  return s.replace(/\n/g, ' / ').replace(/\|/g, '\\|');
};

let md = '# Arabic wording for review\n\nEvery text the app shows, generated from the code by `node scripts/review-strings.mjs`. Templates are filled with sample numbers. Mark anything that reads oddly.\n\n';
md += '| Key | العربية | English |\n|---|---|---|\n';
for (const key of Object.keys(STRINGS.ar)) md += `| ${key} | ${cell(STRINGS.ar[key], SAMPLES[key], '، ')} | ${cell(STRINGS.en[key], EN_SAMPLES[key], ', ')} |\n`;

const data = (f) => JSON.parse(readFileSync(new URL(`../app/data/${f}`, import.meta.url), 'utf8'));
md += '\n## Places (app/data/places.json)\n\n| Place | العربية | English |\n|---|---|---|\n';
for (const p of data('places.json')) {
  md += `| ${p.id} | ${p.ar}: ${p.lineAr} (${p.links.map((l) => l.ar).join('، ')}) | ${p.en}: ${p.lineEn} (${p.links.map((l) => l.en).join(', ')}) |\n`;
}
const why = data('why.json');
md += `\n## Latest gold news (app/data/why.json, ${why.date})\n\n| | العربية | English |\n|---|---|---|\n| text | ${why.ar} | ${why.en} |\n`;
const fc = data('forecasts.json');
md += '\n## Bank names (app/data/forecasts.json)\n\n| العربية | English |\n|---|---|\n';
for (const x of fc.targets) md += `| ${x.institutionAr} | ${x.institution} |\n`;

writeFileSync(new URL('../docs/arabic-review.md', import.meta.url), md);
console.log(`docs/arabic-review.md: ${Object.keys(STRINGS.ar).length} strings`);
