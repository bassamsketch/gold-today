import { gramPrice, formatNum } from '../price.js';
import { KARATS } from '../config.js';
import { t } from '../i18n.js';

const W = 1080, H = 1350;
const C = { bg: '#ffffff', ink: '#2b1d1a', muted: '#6b5c58', car: '#9e2e21', hair: '#ece2df', gold1: '#fade8c', gold2: '#b07c26' };
const fontsReady = () => Promise.all([
  "700 72px 'Noto Naskh Arabic'", "600 72px 'Source Serif 4'", "400 30px 'Almarai'", "700 44px 'Almarai'",
].map((f) => document.fonts?.load(f).catch(() => null)));

function when(lang, date) {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-OM-u-nu-latn' : 'en-GB', {
    timeZone: 'Asia/Muscat', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(date);
}

function ring(ctx, cx, cy, r) {
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, C.gold1);
  g.addColorStop(1, C.gold2);
  ctx.strokeStyle = g;
  ctx.lineWidth = r * 0.26;
  ctx.beginPath();
  ctx.arc(cx, cy, r - ctx.lineWidth / 2, 0, Math.PI * 2);
  ctx.stroke();
  const s = r * 0.42, top = cy - r - s * 0.55;
  ctx.fillStyle = C.gold1;
  ctx.beginPath();
  ctx.moveTo(cx, top - s);
  ctx.lineTo(cx + s * 0.8, top);
  ctx.lineTo(cx, top + s * 0.75);
  ctx.lineTo(cx - s * 0.8, top);
  ctx.closePath();
  ctx.fill();
}

/** Draw today's prices as a 1080 x 1350 image in the Maison style. */
export function drawShareCard(canvas, { lang, usd, date, url }) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const ar = lang === 'ar';
  const start = ar ? W - 96 : 96, end = ar ? 96 : W - 96;
  const align = (side) => (side === 'start' ? (ar ? 'right' : 'left') : (ar ? 'left' : 'right'));
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = C.car;
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.direction = ar ? 'rtl' : 'ltr';
  ctx.textBaseline = 'alphabetic';

  ring(ctx, W / 2, 190, 52);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.ink;
  ctx.font = ar ? "700 80px 'Noto Naskh Arabic', serif" : "600 76px 'Source Serif 4', serif";
  ctx.fillText(t(lang, 'appName'), W / 2, 360);
  ctx.fillStyle = C.muted;
  ctx.font = "400 38px 'Almarai', sans-serif";
  ctx.fillText(t(lang, 'shareTitle'), W / 2, 430);
  ctx.font = "400 32px 'Almarai', sans-serif";
  ctx.fillText(when(lang, date), W / 2, 482);

  let y = 600;
  for (const k of KARATS) {
    ctx.strokeStyle = C.hair;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(96, y - 78);
    ctx.lineTo(W - 96, y - 78);
    ctx.stroke();
    ctx.textAlign = align('start');
    ctx.fillStyle = C.ink;
    ctx.font = "700 44px 'Almarai', sans-serif";
    ctx.fillText(t(lang, 'karatN', k), start, y);
    ctx.textAlign = align('end');
    ctx.font = "600 70px 'Source Serif 4', serif";
    ctx.direction = 'ltr';
    const num = formatNum(gramPrice(usd, k), 3);
    ctx.fillText(num, end, y + 6);
    ctx.direction = ar ? 'rtl' : 'ltr';
    ctx.fillStyle = C.muted;
    ctx.font = "400 28px 'Almarai', sans-serif";
    ctx.fillText(t(lang, 'rialPerGram'), end, y + 46);
    y += 150;
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = C.muted;
  ctx.font = "400 30px 'Almarai', sans-serif";
  ctx.fillText(t(lang, 'world', formatNum(usd, 0)), W / 2, 1180);
  ctx.fillStyle = C.car;
  ctx.font = "700 30px 'Almarai', sans-serif";
  ctx.fillText(t(lang, 'shareFooter'), W / 2, 1240);
  ctx.direction = 'ltr';
  ctx.font = "400 26px 'Almarai', sans-serif";
  ctx.fillText(url.replace(/^https?:\/\//, ''), W / 2, 1280);
}

/** Plain-text version of the card, used with the image or on its own. */
export function shareText(lang, usd, date, url) {
  const lines = KARATS.map((k) => `${t(lang, 'karatN', k)}: ${formatNum(gramPrice(usd, k), 3)} ${t(lang, 'rialPerGram')}`);
  return [`${t(lang, 'shareTitle')} (${when(lang, date)})`, ...lines, url].join('\n');
}

/** Share today's prices: image + text where supported, else text, else WhatsApp. */
export async function shareToday(app) {
  const usd = app.price.usd;
  if (!Number.isFinite(usd)) return 'cancelled';
  const lang = app.state.lang, date = new Date(), url = location.origin + location.pathname;
  const text = shareText(lang, usd, date, url);
  try {
    await fontsReady();
    const canvas = document.createElement('canvas');
    drawShareCard(canvas, { lang, usd, date, url });
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
    const file = blob && new File([blob], 'gold-today.png', { type: 'image/png' });
    if (file && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text, title: t(lang, 'appName') });
      return 'shared';
    }
    if (navigator.share) {
      await navigator.share({ text, title: t(lang, 'appName') });
      return 'text';
    }
  } catch (err) {
    if (err?.name === 'AbortError') return 'cancelled';
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  return 'text';
}

export function mount(app) {
  ['share', 'share-today'].forEach((id) => document.getElementById(id)?.addEventListener('click', () => shareToday(app)));
}
