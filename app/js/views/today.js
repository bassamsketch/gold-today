import { gramPrice } from '../price.js';
import { KARATS, TOLA_G } from '../config.js';
import { liveStatus } from '../time.js';
import { yearShareBelow, tierOf, hintOf, newsVisible, compareClose } from '../history.js';
import { startLive } from '../live.js';
import { agoText, dayMonth, lastPriceText, closeDay } from '../i18n.js';
import { odometer } from '../ui/odometer.js';
import { syncKarats, setKaratText } from '../ui/karats.js';

const $ = (id) => document.getElementById(id);
const secsSince = (t) => (Number.isFinite(t) ? Math.max(0, Math.round((Date.now() - t) / 1000)) : 0);

/** Today tab: live price, karat choice, live status, change, latest news, year comparison, price board. */
export function mount(app) {
  const el = {
    cap: $('price-cap'), price: $('price'), unit: $('price-unit'), skel: $('price-skel'), missing: $('price-missing'),
    karats: $('karats'), status: $('status'), statusText: $('status-text'), statusSep: $('status-sep'),
    statusGap: $('status-gap'), statusAgo: $('status-ago'), change: $('change'),
    why: $('why'), whyTitle: $('why-title'), whyText: $('why-text'), whySrc: $('why-src'), whySrcName: $('why-src-name'),
    year: $('year'), mood: $('mood'), dot: $('year-dot'), hint: $('hint'), rows: $('board-rows'), world: $('world'), hero: $('hero'),
    boardUnit: $('board-unit'),
  };
  const usd = () => app.price.usd;
  const has = () => Number.isFinite(app.price.usd);
  const status = () => liveStatus({
    price: usd(), updatedAt: app.price.updatedAt, fetchedAt: app.price.fetchedAt ?? null, now: Date.now(), startedAt: app.startedAt,
  });

  el.rows.innerHTML = KARATS.map((k) => `<tr data-row="${k}" tabindex="0"><td>${k}</td><td data-c="1"></td><td data-c="10"></td><td data-c="t"></td></tr>`).join('');

  // The caption names the karat (QA4) and stops saying "now" when the price is not live (QA3).
  function renderCaption(s) {
    const k = app.state.karat;
    setKaratText(el.cap, app.t(['live', 'recent', 'none'].includes(s) ? 'perGramNow' : 'lastGram', k), app.t('karatN', k));
    el.skel.hidden = has() || s !== 'loading';
    el.missing.hidden = has() || s === 'loading';
    if (!has()) el.missing.textContent = app.t('none');
  }

  function renderPrice(s) {
    el.price.hidden = !has();
    el.unit.hidden = !has();
    renderCaption(s);
    if (!has()) return;
    // the display currency (design 9); pounds in millions, and long prices shrink to fit
    const code = app.money.code;
    const text = app.money.fmt(app.money.gram(usd(), app.state.karat), 'gram');
    el.price.parentElement.classList.toggle('long', text.length > 7);
    odometer(el.price, text);
    el.unit.textContent = app.t('curUnit', code);
    el.price.setAttribute('aria-label', app.t('priceAria', text, app.state.karat, code));
  }

  function renderStatus(s) {
    const lang = app.state.lang;
    el.status.className = `status ${s}`;
    el.status.hidden = s === 'none'; // the price area already says the price is not available
    let text = '', ago = '';
    if (s === 'live') {
      text = app.t('live');
      ago = agoText(lang, secsSince(app.price.fetchedAt));
    } else if (s === 'recent') {
      ago = agoText(lang, secsSince(app.price.fetchedAt ?? app.price.updatedAt));
    } else if (s === 'delayed') {
      text = app.t('delayed');
      ago = lastPriceText(lang, app.price.updatedAt);
    } else if (s === 'closed' || s === 'loading') {
      text = app.t(s);
    }
    el.statusText.textContent = text;
    el.statusAgo.textContent = ago;
    el.statusSep.hidden = el.statusGap.hidden = !(text && ago);
  }

  function renderChange() {
    const daily = app.data.history?.daily;
    const ref = has() && daily ? compareClose(daily, app.price.updatedAt ?? Date.now(), Date.now()) : null;
    el.change.hidden = !ref;
    if (!ref) return;
    const k = app.state.karat;
    const diff = gramPrice(usd(), k) - gramPrice(ref.c, k);
    const a = Math.abs(diff);
    const day = closeDay(app.state.lang, ref.d, ref.yesterday);
    const shown = app.money.fmt(app.money.conv(a), 'gram'), code = app.money.code;
    el.change.textContent = a < 0.0005 ? app.t('same', day) : diff < 0 ? `↓ ${app.t('less', shown, day, code)}` : `↑ ${app.t('more', shown, day, code)}`;
  }

  function renderWhy() {
    const w = app.data.why;
    const show = Boolean(w) && newsVisible(w.date, new Date()); // one trading day, then it goes (QA22)
    el.why.hidden = !show;
    if (!show) return;
    const lang = app.state.lang;
    el.whyTitle.textContent = app.t('whyTitle', dayMonth(lang, w.date));
    el.whyText.textContent = lang === 'ar' ? w.ar : w.en;
    el.whySrcName.textContent = w.source;
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
    el.boardUnit.textContent = app.t('boardIn', app.money.code);
    el.rows.querySelectorAll('tr').forEach((tr) => {
      const k = Number(tr.dataset.row);
      const on = k === app.state.karat;
      tr.classList.toggle('on', on);
      if (on) tr.setAttribute('aria-current', 'true');
      else tr.removeAttribute('aria-current');
      const g = has() ? app.money.gram(usd(), k) : null;
      // three decimals for rials, as they have 1,000 baisa (QA44); each display currency its own (design 9)
      tr.querySelector('[data-c="1"]').textContent = g == null ? '–' : app.money.fmt(g, 'gram');
      tr.querySelector('[data-c="10"]').textContent = g == null ? '–' : app.money.fmt(g * 10, 'gram');
      tr.querySelector('[data-c="t"]').textContent = g == null ? '–' : app.money.fmt(g * TOLA_G, 'gram');
    });
  }

  function renderAll() {
    const s = status();
    renderPrice(s);
    renderStatus(s);
    renderChange();
    renderWhy();
    renderYear();
    renderBoard();
    el.world.textContent = has() ? app.t('world', usd()) : '';
    syncKarats(el.karats, app.state.karat, 'k');
  }

  // The status line updates every 10 s, not every second (QA45).
  const tick = () => {
    const s = status();
    renderCaption(s);
    renderStatus(s);
  };

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
  ['karat', 'lang', 'data', 'price', 'currency'].forEach((evt) => app.on(evt, renderAll));
  app.on('layout', () => syncKarats(el.karats, app.state.karat, 'k'));
  app.on('view', (v) => { if (v === 'today') requestAnimationFrame(() => syncKarats(el.karats, app.state.karat, 'k')); });

  // The hero's slow zoom and sheen pause while the photo is off screen (QA35).
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => el.hero.classList.toggle('off', !e.isIntersecting)).observe(el.hero);
  }

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
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return live?.stop();
    // back on screen: say we are fetching until the first answer, instead of flashing "delayed"
    app.price = { ...app.price, fetchedAt: null };
    app.startedAt = Date.now();
    tick();
    startPolling();
  });
  setInterval(tick, 10000);
  setTimeout(tick, 8200); // the first-visit placeholder gives way to the message at 8 s
  renderAll();
  startPolling();
}
