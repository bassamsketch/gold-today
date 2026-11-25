import { gramPrice, formatNum } from '../price.js';
import { KARATS, TOLA_G } from '../config.js';
import { liveStatus } from '../time.js';
import { lastClose, yearShareBelow, tierOf, hintOf } from '../history.js';
import { startLive } from '../live.js';
import { agoText, dayMonthYear, lastPriceText } from '../i18n.js';
import { odometer } from '../ui/odometer.js';
import { syncKarats } from '../ui/karats.js';

const $ = (id) => document.getElementById(id);

/** Today tab: live price, karat choice, live status, change, why gold moved, year comparison, price board. */
export function mount(app) {
  const el = {
    price: $('price'), unit: $('price-unit'), missing: $('price-missing'), karats: $('karats'),
    status: $('status'), statusText: $('status-text'), statusAgo: $('status-ago'), change: $('change'),
    why: $('why'), whyText: $('why-text'), whySrc: $('why-src'),
    year: $('year'), mood: $('mood'), dot: $('year-dot'), hint: $('hint'),
    rows: $('board-rows'), world: $('world'),
  };
  const usd = () => app.price.usd;
  const has = () => Number.isFinite(app.price.usd);

  el.rows.innerHTML = KARATS.map((k) => `<tr data-row="${k}" tabindex="0"><td data-board-k></td><td data-c="1"></td><td data-c="10"></td><td data-c="t"></td></tr>`).join('');

  function renderPrice() {
    el.price.hidden = !has();
    el.unit.hidden = !has();
    el.missing.hidden = has();
    if (!has()) {
      el.missing.textContent = app.t('none');
      return;
    }
    const text = formatNum(gramPrice(usd(), app.state.karat), 3);
    odometer(el.price, text);
    el.price.setAttribute('aria-label', app.t('priceAria', text, app.state.karat));
  }

  function renderStatus() {
    const s = liveStatus({ price: usd(), updatedAt: app.price.updatedAt, now: Date.now() });
    el.status.className = `status ${s}`;
    el.status.hidden = s === 'none'; // the price area already says the price is not available
    el.statusText.textContent = s === 'live' ? app.t('live') : app.t(s);
    const since = app.price.fetchedAt ?? app.price.updatedAt;
    if (s === 'live' && since) el.statusAgo.textContent = agoText(app.state.lang, Math.max(0, Math.round((Date.now() - since) / 1000)));
    else if (s === 'delayed') el.statusAgo.textContent = lastPriceText(app.state.lang, app.price.updatedAt); // say how old the price is
    else el.statusAgo.textContent = '';
  }

  function renderChange() {
    const lc = has() && app.data.history ? lastClose(app.data.history.daily, new Date()) : null;
    el.change.hidden = !lc;
    if (!lc) return;
    const k = app.state.karat;
    const diff = gramPrice(usd(), k) - gramPrice(lc.c, k);
    const a = Math.abs(diff);
    el.change.textContent = a < 0.0005 ? app.t('same') : diff < 0 ? `↓ ${app.t('less', formatNum(a, 3))}` : `↑ ${app.t('more', formatNum(a, 3))}`;
  }

  function renderWhy() {
    const w = app.data.why;
    const ageDays = w ? (Date.now() - Date.parse(`${w.date}T00:00:00Z`)) / 864e5 : Infinity;
    el.why.hidden = !(ageDays <= 3);
    if (el.why.hidden) return;
    const lang = app.state.lang;
    el.whyText.textContent = lang === 'ar' ? w.ar : w.en;
    const src = document.createElement('bdi'); // isolate the Latin source name inside Arabic text
    src.textContent = w.source;
    el.whySrc.replaceChildren(src, `${lang === 'ar' ? '، ' : ', '}${dayMonthYear(lang, w.date)}`);
    if (typeof w.url === 'string' && w.url.startsWith('https://')) el.whySrc.href = w.url;
    else el.whySrc.removeAttribute('href');
  }

  function renderYear() {
    const share = has() && app.data.history ? yearShareBelow(app.data.history.daily, usd(), new Date()) : null;
    el.year.hidden = share == null;
    if (share == null) return;
    const tier = tierOf(share);
    el.mood.textContent = app.t(`mood${tier}`);
    el.hint.textContent = app.t(`hint${hintOf(tier)}`);
    requestAnimationFrame(() => el.dot.style.setProperty('--pos', `${3 + share * 94}%`));
  }

  function renderBoard() {
    el.rows.querySelectorAll('tr').forEach((tr) => {
      const k = Number(tr.dataset.row);
      tr.classList.toggle('on', k === app.state.karat);
      tr.setAttribute('aria-selected', String(k === app.state.karat));
      tr.querySelector('[data-board-k]').textContent = app.t('karatN', k);
      const g = has() ? gramPrice(usd(), k) : null;
      tr.querySelector('[data-c="1"]').textContent = g == null ? '–' : formatNum(g, 3);
      tr.querySelector('[data-c="10"]').textContent = g == null ? '–' : formatNum(g * 10, 2);
      tr.querySelector('[data-c="t"]').textContent = g == null ? '–' : formatNum(g * TOLA_G, 2);
    });
  }

  function renderAll() {
    renderPrice();
    renderStatus();
    renderChange();
    renderWhy();
    renderYear();
    renderBoard();
    el.world.textContent = has() ? app.t('world', formatNum(usd(), 0)) : '';
    syncKarats(el.karats, app.state.karat, 'k');
  }

  el.karats.addEventListener('click', (e) => {
    const b = e.target.closest('[data-k]');
    if (b) app.setKarat(Number(b.dataset.k));
  });
  el.rows.addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-row]');
    if (tr) app.setKarat(Number(tr.dataset.row));
  });
  el.rows.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('tr[data-row]')) {
      e.preventDefault();
      app.setKarat(Number(e.target.dataset.row));
    }
  });
  ['karat', 'lang', 'data', 'price'].forEach((evt) => app.on(evt, renderAll));
  app.on('layout', () => syncKarats(el.karats, app.state.karat, 'k'));
  app.on('view', (v) => { if (v === 'today') requestAnimationFrame(() => syncKarats(el.karats, app.state.karat, 'k')); });

  let live = null;
  const onPrice = (p) => {
    app.price = { ...p, fetchedAt: Date.now() };
    app.state.last = { usd: p.usd, updatedAt: p.updatedAt };
    app.persist();
    app.emit('price');
  };
  const startPolling = () => {
    live?.stop();
    live = startLive({ onPrice });
  };
  document.addEventListener('visibilitychange', () => (document.hidden ? live?.stop() : startPolling()));
  setInterval(renderStatus, 1000);
  renderAll();
  startPolling();
}
