import { buildForecast, surveyComparison } from '../forecast.js';
import { gramPrice, formatNum } from '../price.js';
import { dayMonthYear } from '../i18n.js';
import { drawFuture } from '../ui/chart.js';
import { countUp } from '../ui/countup.js';
import { openSheet, closeOnBackdrop } from '../ui/sheet.js';
import { syncKarats } from '../ui/karats.js';

const $ = (id) => document.getElementById(id);
const DATA = 'gold-api.com, OANDA (TradingView), World Bank (freegoldapi.com), LBMA';
const PHOTOS = '@sfhashemi, @jesus_eca, @sarimkx (Unsplash)';

// Latin names inside Arabic text are isolated, so brackets and full stops stay in place (QA6).
function latin(text) {
  const b = document.createElement('bdi');
  b.lang = 'en';
  b.dir = 'ltr';
  b.textContent = text;
  return b;
}

// The horizon most targets share, e.g. '2027-12'.
function horizonOf(fc) {
  const count = {};
  for (const x of fc.targets || []) count[x.horizon] = (count[x.horizon] || 0) + 1;
  return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}

/** Future tab: today, the banks' forecast, gold's own history as a range, sources, and how good forecasts have been. */
export function mount(app) {
  const el = {
    sub: $('outlook-sub'), svg: $('fchart'), today: $('f-today'), f1: $('f1'), f1for: $('f1-for'), n1: $('f1-note'),
    hist: $('hist'), f5: $('f5'), f10: $('f10'), win0: $('win0'), win1: $('win1'), survey: $('survey'),
    updated: $('f-updated'), data: $('f-data'), photos: $('f-photos'), open: $('open-sources'),
    sheet: $('sources-sheet'), list: $('src-list'), close: $('sources-close'), karats: $('future-karats'),
  };

  function compute() {
    const h = app.data.history, fc = app.data.forecasts;
    if (!h || !fc) return null;
    // the history ranges start from the last daily close, so they change once a day, not every 10 s (QA1)
    const close = h.daily.at(-1)?.c;
    if (!Number.isFinite(close)) return null;
    const live = Number.isFinite(app.price.usd) ? app.price.usd : close;
    return { h, fc, live, f: buildForecast(fc, h.monthly, close) };
  }

  function render(animate) {
    const c = compute();
    if (!c) return;
    const k = app.state.karat, lang = app.state.lang;
    const g = (u) => gramPrice(u, k);
    const y1 = c.f.y1 && { lo: g(c.f.y1.lo), mid: g(c.f.y1.mid), hi: g(c.f.y1.hi) };
    const band = (b) => b && { lo: g(b.lo), hi: g(b.hi) };
    const y5 = band(c.f.y5), y10 = band(c.f.y10);
    const today = g(c.live);
    el.sub.textContent = app.t('outlookSub', k);
    el.today.textContent = formatNum(today, 1);

    if (y1) {
      countUp(el.f1, y1.mid, 1);
      el.f1for.textContent = app.t('bankFor', horizonOf(c.fc));
      el.n1.textContent = app.t('y1Note', c.f.y1.n);
    } else {
      el.f1.textContent = '–';
      el.f1for.textContent = '';
      el.n1.textContent = '';
    }
    el.open.hidden = !y1;
    el.hist.hidden = !y5 && !y10;
    el.f5.textContent = y5 ? app.t('histRange', y5.lo, y5.hi) : '–';
    el.f10.textContent = y10 ? app.t('histRange', y10.lo, y10.hi) : '–';

    const past = c.h.monthly.slice(-61, -1).map((m) => g(m.c)).concat(today);
    drawFuture(el.svg, {
      past, today, y1, y5, y10,
      words: { today: app.t('today'), bank: app.t('banksLabel'), start: app.t('ago5'), end: app.t('in10') },
      values: { today: formatNum(today, 1), bank: y1 ? formatNum(y1.mid, 1) : '' },
    }, animate);
    syncKarats(el.karats, k, 'fk');

    const lb = c.fc.lbma || {};
    [el.win0, el.win1].forEach((p, i) => {
      const w = lb.winners?.[i];
      p.hidden = !w;
      if (w) p.textContent = app.t('winnerLine', w.year, w.forecast, w.actual, formatNum((Math.abs(w.actual - w.forecast) / w.actual) * 100, 0));
    });
    const sv = surveyComparison(lb, c.h.daily); // bounded to the survey's own year
    el.survey.hidden = !sv;
    if (sv) el.survey.textContent = app.t('surveyLine', sv.year, sv.avg, sv.actual);

    el.updated.textContent = app.t('updatedOn', dayMonthYear(lang, c.fc.asOf));
    el.data.replaceChildren(`${app.t('dataSources')}: `, latin(DATA));
    el.photos.replaceChildren(`${app.t('photos')}: `, latin(PHOTOS));
    renderSources(c.fc);
  }

  function renderSources(fc) {
    const lang = app.state.lang, k = app.state.karat;
    el.list.replaceChildren(...(fc.targets || []).map((x) => {
      const li = document.createElement('li');
      const name = document.createElement('b');
      name.textContent = lang === 'ar' ? x.institutionAr || x.institution : x.institution;
      // the target for the chosen karat in rials per gram, then the dollar figure it comes from (QA25)
      const main = document.createElement('p');
      main.className = 'src-main';
      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = formatNum(gramPrice(x.usd, k), 1);
      main.append(num, ` ${app.t('srcGram', k)} · ${app.t('targetBy', x.horizon)}`);
      const oz = document.createElement('p');
      oz.className = 'sub';
      oz.textContent = app.t('srcOz', x.usd);
      const meta = document.createElement('p');
      meta.className = 'sub';
      meta.append(`${app.t('publishedVia', dayMonthYear(lang, x.published))} `, latin(x.reportedBy || x.institution));
      li.append(name, main, oz, meta);
      if (typeof x.url === 'string' && x.url.startsWith('https://')) {
        const a = document.createElement('a');
        a.href = x.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.lang = 'en';
        a.textContent = new URL(x.url).hostname.replace(/^www\./, '');
        li.append(a);
      }
      return li;
    }));
  }

  el.karats.addEventListener('click', (e) => {
    const b = e.target.closest('[data-fk]');
    if (b) app.setKarat(Number(b.dataset.fk)); // shared with Today; the 'karat' event re-renders this tab
  });
  el.open.addEventListener('click', () => openSheet(el.sheet));
  el.close.addEventListener('click', () => el.sheet.close(''));
  closeOnBackdrop(el.sheet);
  app.on('view', (v) => { if (v === 'future') render(true); });
  ['price', 'karat', 'lang', 'data'].forEach((evt) => app.on(evt, () => { if (app.view === 'future') render(false); }));
}
