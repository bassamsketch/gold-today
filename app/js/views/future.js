import { buildForecast, surveyComparison } from '../forecast.js';
import { recordHigh, pastFalls, higherOdds, moveSince } from '../insights.js';
import { yearShareBelow, tierOf } from '../history.js';
import { gramPrice, formatNum } from '../price.js';
import { dayMonthYear, monthYear } from '../i18n.js';
import { drawHistory } from '../ui/chart.js';
import { openSheet, closeOnBackdrop } from '../ui/sheet.js';
import { syncKarats, setKaratText } from '../ui/karats.js';

const $ = (id) => document.getElementById(id);
const DATA = 'gold-api.com, OANDA (TradingView), World Bank (freegoldapi.com), LBMA';
const make = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

// Latin names inside Arabic text are isolated, so brackets and full stops stay in place (QA6).
function latin(text) {
  const b = make('bdi', null, text);
  b.lang = 'en';
  b.dir = 'ltr';
  return b;
}

// The horizon most targets share, e.g. '2027-12'.
function horizonOf(fc) {
  const count = {};
  for (const x of fc.targets || []) count[x.horizon] = (count[x.horizon] || 0) + 1;
  return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
}

const dots = (tens) => {
  const s = make('span', 'dots');
  for (let i = 0; i < 10; i++) s.append(make('i', i < tens ? 'on' : ''));
  return s;
};

/** Outlook tab (design 7): is the price high or low today, and will it go up. History first, the banks last. */
export function mount(app) {
  const el = {
    sub: $('outlook-sub'), karats: $('future-karats'), answer: $('q1-answer'), week: $('move-week'), month: $('move-month'),
    mood: $('q1-mood'), svg: $('fchart'), today: $('f-today'), recRow: $('rec-row'), recDate: $('rec-date'), record: $('f-record'),
    fallsLine: $('falls-line'), fallsRows: $('falls-rows'), odds2: $('odds2'), worstLine: $('worst-line'), worstText: $('worst-text'),
    banksLine: $('banks-line'), oddsAll: $('odds-all'), missLine: $('miss-line'), bankList: $('bank-list'),
    updated: $('f-updated'), data: $('f-data'), open: $('open-sources'), sheet: $('sources-sheet'), list: $('src-list'), close: $('sources-close'),
  };

  function renderHighLow(h, live, g, animate) {
    const lang = app.state.lang, now = new Date();
    const rec = recordHigh(h, live);
    const atTop = rec.live || live >= rec.usd * 0.99;
    el.answer.textContent = atTop ? app.t('atRecord') : app.t('belowRecord', (1 - live / rec.usd) * 100);
    const wk = moveSince(h.daily, live, now, 7), mo = moveSince(h.daily, live, now, 30);
    el.week.hidden = wk == null;
    el.month.hidden = mo == null;
    if (wk != null) el.week.textContent = app.t('pastWeek', wk * 100);
    if (mo != null) el.month.textContent = app.t('pastMonth', mo * 100);
    const share = yearShareBelow(h.daily, live, now);
    el.mood.hidden = share == null;
    if (share != null) el.mood.textContent = app.t(`mood${tierOf(share)}`);
    el.today.textContent = formatNum(g(live), 1);
    el.recRow.hidden = rec.live;
    if (!rec.live) {
      el.record.textContent = formatNum(g(rec.usd), 1);
      el.recDate.textContent = rec.day ? dayMonthYear(lang, rec.d) : monthYear(lang, rec.d);
    }

    // the last 60 monthly closes before this month, then today; the record at its own date when it falls inside
    const past = h.monthly.slice(-61, -1);
    let record = null;
    if (!rec.live && past.length) {
      const [y0, m0] = past[0].d.split('-').map(Number);
      const [y, m] = rec.d.slice(0, 7).split('-').map(Number);
      const x = (y - y0) * 12 + (m - m0) + ((rec.day ? Number(rec.d.slice(8, 10)) : 15) - 1) / 31;
      if (x >= 0) record = { x: Math.min(x, past.length), value: g(rec.usd) };
    }
    drawHistory(el.svg, {
      past: past.map((p) => g(p.c)), today: g(live), record,
      words: { record: app.t('chartRecord'), today: app.t('today'), start: app.t('ago5') },
      values: { record: record ? formatNum(record.value, 1) : '', today: formatNum(g(live), 1) },
    }, animate);

    // every completed fall, and whether one is under way now (the same record as the answer, design 7.1)
    const falls = pastFalls(h.monthly);
    const depthNow = rec.live ? 0 : 1 - live / rec.usd;
    const current = depthNow >= 0.2;
    const longest = falls.reduce((a, b) => (!a || b.months > a.months ? b : a), null);
    const deepest = falls.reduce((a, b) => (!a || b.depth > a.depth ? b : a), null);
    el.fallsLine.hidden = !falls.length;
    if (falls.length) el.fallsLine.textContent = app.t('fallsLine', falls.map((f) => f.months), current, longest === deepest ? longest.year : null);
    el.fallsRows.replaceChildren(...falls.map((f) => {
      const tr = make('tr', current && f.depth >= depthNow ? 'deep' : '');
      tr.append(make('td', null, f.year), make('td', null, app.t('fallDepth', f.depth * 100)), make('td', null, app.t('fallBack', f.months)));
      return tr;
    }));
  }

  function renderWillItRise(h, fc, live, g) {
    const o1 = higherOdds(h.monthly, 1), o10 = higherOdds(h.monthly, 10);
    el.odds2.replaceChildren(...[[1, o1], [10, o10]].filter(([, o]) => o).map(([n, o]) => {
      const row = make('div', 'o2');
      row.append(make('span', null, app.t('afterYears', n)), make('b', null, app.t('higherCases', o.tens)), dots(o.tens));
      return row;
    }));
    el.worstLine.hidden = !o10;
    if (o10) el.worstText.textContent = app.t('worstText', o10.worstFrom, o10.worst * 100);

    const y1 = fc ? buildForecast(fc).y1 : null;
    el.banksLine.hidden = !y1;
    if (y1) el.banksLine.textContent = app.t('banksShort', y1.n, formatNum(g(y1.lo), 1), formatNum(g(y1.hi), 1), horizonOf(fc), formatNum(g(live), 1));

    el.oddsAll.replaceChildren(...[1, 5, 10, 20].map((n) => [n, higherOdds(h.monthly, n)]).filter(([, o]) => o).map(([n, o]) => {
      const row = make('div', 'orow');
      row.append(make('span', null, app.t('periodLabel', n)), dots(o.tens), make('b', null, app.t('outOf10', o.tens)), make('small', null, app.t('periodRow', o.typical * 100, o.worst * 100)));
      return row;
    }));

    const lb = fc?.lbma || {};
    const misses = (lb.winners || []).map((w) => app.t('winnerMiss', w.year, (Math.abs(w.actual - w.forecast) / w.actual) * 100, w.forecast < w.actual));
    const sv = surveyComparison(lb, h.daily);
    if (sv) misses.push(app.t('surveyMiss', sv.year, (Math.abs(sv.avg - sv.actual) / sv.actual) * 100, sv.avg > sv.actual));
    el.missLine.hidden = !misses.length;
    el.missLine.textContent = misses.join(' ');

    const lang = app.state.lang;
    el.bankList.replaceChildren(...[...(fc?.targets || [])].sort((a, b) => a.usd - b.usd).map((x) => {
      const li = make('li');
      const p = Math.round((x.usd / live - 1) * 100);
      const pct = make('span', 'bp', `${p >= 0 ? '+' : '−'}${Math.abs(p)}%`);
      li.append(make('span', null, lang === 'ar' ? x.institutionAr || x.institution : x.institution), make('span', 'num bv', formatNum(g(x.usd), 1)), pct);
      return li;
    }));
    el.open.hidden = !fc?.targets?.length;
  }

  function render(animate) {
    const h = app.data.history, fc = app.data.forecasts;
    const close = h?.daily?.at(-1)?.c;
    const live = Number.isFinite(app.price.usd) ? app.price.usd : close;
    if (!h || !Number.isFinite(live)) return;
    const k = app.state.karat, lang = app.state.lang;
    const g = (usd) => gramPrice(usd, k);
    setKaratText(el.sub, app.t('pricesPerGram', k), app.t('karatN', k));
    syncKarats(el.karats, k, 'fk');
    renderHighLow(h, live, g, animate);
    renderWillItRise(h, fc, live, g);
    el.updated.textContent = fc ? app.t('updatedOn', dayMonthYear(lang, fc.asOf)) : '';
    el.data.replaceChildren(`${app.t('dataSources')}: `, latin(DATA));
    if (fc) renderSources(fc);
  }

  function renderSources(fc) {
    const lang = app.state.lang, k = app.state.karat;
    el.list.replaceChildren(...(fc.targets || []).map((x) => {
      const li = make('li');
      const name = make('b', null, lang === 'ar' ? x.institutionAr || x.institution : x.institution);
      // the target for the chosen karat in rials per gram, then the dollar figure it comes from (QA25)
      const main = make('p', 'src-main');
      const unit = make('span');
      setKaratText(unit, app.t('srcGram', k), app.t('karatN', k));
      main.append(make('span', 'num', formatNum(gramPrice(x.usd, k), 1)), ' ', unit, ` · ${app.t('targetBy', x.horizon)}`);
      const meta = make('p', 'sub');
      meta.append(`${app.t('publishedVia', dayMonthYear(lang, x.published))} `, latin(x.reportedBy || x.institution));
      li.append(name, main, make('p', 'sub', app.t('srcOz', x.usd)), meta);
      if (typeof x.url === 'string' && x.url.startsWith('https://')) {
        const a = make('a', null, new URL(x.url).hostname.replace(/^www\./, ''));
        a.href = x.url;
        a.target = '_blank';
        a.rel = 'noopener';
        a.lang = 'en';
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
