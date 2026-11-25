import { buildForecast, surveyComparison } from '../forecast.js';
import { gramPrice, formatNum } from '../price.js';
import { dayMonthYear, monthYear } from '../i18n.js';
import { drawFuture } from '../ui/chart.js';
import { countUp } from '../ui/countup.js';
import { openSheet, closeOnBackdrop } from '../ui/sheet.js';

const $ = (id) => document.getElementById(id);
const CREDITS = '@shahmansi130, @sfhashemi, @sarimkx (Unsplash)';

/** Future tab: expected prices for 1, 5 and 10 years, sources, and how good forecasts have been. */
export function mount(app) {
  const el = {
    sub: $('outlook-sub'), svg: $('fchart'), f1: $('f1'), f5: $('f5'), f10: $('f10'),
    n1: $('f1-note'), n5: $('f5-note'), n10: $('f10-note'), win0: $('win0'), win1: $('win1'), survey: $('survey'),
    updated: $('f-updated'), sources: $('f-sources'), open: $('open-sources'), sheet: $('sources-sheet'),
    list: $('src-list'), close: $('sources-close'),
  };

  function compute() {
    const h = app.data.history, fc = app.data.forecasts;
    if (!h || !fc) return null;
    const usd = Number.isFinite(app.price.usd) ? app.price.usd : h.daily.at(-1)?.c;
    if (!Number.isFinite(usd)) return null;
    return { h, fc, usd, f: buildForecast(fc, h.monthly, usd) };
  }

  function render(animate) {
    const c = compute();
    if (!c) return;
    const k = app.state.karat, lang = app.state.lang;
    const g = (u) => gramPrice(u, k);
    const toGram = (b) => b && { lo: g(b.lo), mid: g(b.mid), hi: g(b.hi) };
    const y1 = toGram(c.f.y1), y5 = toGram(c.f.y5), y10 = toGram(c.f.y10);
    el.sub.textContent = app.t('outlookSub', k);

    if (y1) {
      countUp(el.f1, y1.mid, 2);
      el.n1.textContent = app.t('y1Note', c.f.y1.n);
    } else {
      el.f1.textContent = '–';
      el.n1.textContent = '';
    }
    el.open.hidden = !y1;
    countUp(el.f5, y5.mid, 2);
    el.n5.textContent = app.t('bandNote', formatNum(y5.lo, 2), formatNum(y5.hi, 2));
    countUp(el.f10, y10.mid, 2);
    el.n10.textContent = app.t('bandNote', formatNum(y10.lo, 2), formatNum(y10.hi, 2));

    const past = c.h.monthly.slice(-61, -1).map((m) => g(m.c)).concat(g(c.usd));
    drawFuture(el.svg, { past, today: g(c.usd), y1, y5, y10, labels: [app.t('ago5'), app.t('today'), app.t('in10')] }, animate);

    const lb = c.fc.lbma || {};
    [el.win0, el.win1].forEach((p, i) => {
      const w = lb.winners?.[i];
      p.hidden = !w;
      if (w) p.textContent = app.t('winnerLine', w.year, w.name, w.org, formatNum(w.forecast, 0), formatNum(w.actual, 0), formatNum((Math.abs(w.actual - w.forecast) / w.actual) * 100, 0));
    });
    const sv = surveyComparison(lb, c.h.daily); // bounded to the survey's own year
    el.survey.hidden = !sv;
    if (sv) el.survey.textContent = app.t('surveyLine', sv.year, formatNum(sv.avg, 0), formatNum(sv.actual, 0));

    el.updated.textContent = app.t('updatedOn', dayMonthYear(lang, c.fc.asOf));
    el.sources.textContent = `${app.t('dataSources')}: gold-api.com, OANDA (TradingView), World Bank (freegoldapi.com), LBMA. ${app.t('photos')}: ${CREDITS}.`;
    renderSources(c.fc);
  }

  function renderSources(fc) {
    const lang = app.state.lang;
    el.list.replaceChildren(...(fc.targets || []).map((x) => {
      const li = document.createElement('li');
      const name = document.createElement('b');
      name.textContent = lang === 'ar' ? x.institutionAr || x.institution : x.institution;
      const target = document.createElement('p');
      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = `$${formatNum(x.usd, 0)}`;
      target.append(num, ` ${app.t('targetBy', monthYear(lang, x.horizon))}`);
      const meta = document.createElement('p');
      meta.className = 'sub';
      meta.textContent = app.t('publishedVia', dayMonthYear(lang, x.published), x.reportedBy || x.institution);
      li.append(name, target, meta);
      if (typeof x.url === 'string' && x.url.startsWith('https://')) {
        const a = document.createElement('a');
        a.href = x.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = new URL(x.url).hostname.replace(/^www\./, '');
        li.append(a);
      }
      return li;
    }));
  }

  el.open.addEventListener('click', () => openSheet(el.sheet));
  el.close.addEventListener('click', () => el.sheet.close(''));
  closeOnBackdrop(el.sheet);
  app.on('view', (v) => { if (v === 'future') render(true); });
  ['price', 'karat', 'lang', 'data'].forEach((evt) => app.on(evt, () => { if (app.view === 'future') render(false); }));
}
