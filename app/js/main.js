import { load, save } from './store.js';
import { t } from './i18n.js';
import { syncKarats } from './ui/karats.js';
import { closeOpenSheet } from './ui/sheet.js';
import { effective, fromRials, fmt, decimalsOf } from './money.js';
import { gramPrice } from './price.js';

const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
})();

const state = load(storage);
const listeners = new Map();

/** Shared app object handed to every view's mount(app). Events: lang, karat, currency, price, data, view, pieces, layout. */
export const app = {
  state,
  data: { history: null, forecasts: null, why: null, places: null, rates: null },
  price: { usd: state.last?.usd ?? null, updatedAt: state.last?.updatedAt ?? null, fetchedAt: null },
  startedAt: Date.now(),
  view: 'today',
  on(evt, fn) {
    if (!listeners.has(evt)) listeners.set(evt, []);
    listeners.get(evt).push(fn);
  },
  emit(evt, payload) {
    (listeners.get(evt) || []).forEach((fn) => fn(payload));
  },
  t: (key, ...args) => t(state.lang, key, ...args),
  persist() {
    save(state, storage);
  },
  setLang(lang) {
    state.lang = lang;
    applyLang();
    app.persist();
    app.emit('lang');
  },
  setKarat(k) {
    state.karat = k;
    app.persist();
    app.emit('karat');
  },
  setCurrency(code) {
    state.currency = code;
    app.persist();
    app.emit('currency');
  },
  // the display currency (design 9): rial amounts converted at today's rate; typed amounts stay in rials
  money: {
    get code() { return effective(state.currency, app.data.rates); },
    conv(rials) { return fromRials(rials, app.money.code, app.data.rates); },
    gram(usd, karat) { return app.money.conv(gramPrice(usd, karat)); },
    fmt(value, kind) { return fmt(value, app.money.code, kind); },
    decimals(kind) { return decimalsOf(app.money.code, kind); },
  },
  setView,
};

function applyLang() {
  const root = document.documentElement;
  root.lang = state.lang;
  root.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  document.title = app.t('appName');
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = app.t(el.dataset.t); });
  document.querySelectorAll('[data-aria]').forEach((el) => el.setAttribute('aria-label', app.t(el.dataset.aria)));
  document.querySelectorAll('[data-ph]').forEach((el) => { el.placeholder = app.t(el.dataset.ph); });
  document.querySelectorAll('[data-k-label]').forEach((el) => { el.textContent = app.t('karatN', el.dataset.kLabel); });
  document.querySelector('[data-lang-toggle]')?.setAttribute('lang', state.lang === 'ar' ? 'en' : 'ar');
  requestAnimationFrame(() => syncKarats(document.getElementById('karats'), state.karat, 'k'));
}

function show(name) {
  app.view = name;
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('on', v.dataset.view === name));
  document.querySelectorAll('.tabbar [data-tab]').forEach((b) => {
    const on = b.dataset.tab === name;
    b.classList.toggle('on', on);
    if (on) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  window.scrollTo({ top: 0 });
  app.emit('view', name);
}

// Each tab away from Today adds one history entry, so Android's back button returns to Today
// before it leaves the app (QA31). Moving between the other tabs replaces that entry.
function setView(name) {
  if (name === app.view) return;
  if (name === 'today') {
    if (history.state?.view && history.state.view !== 'today') return history.back(); // popstate shows Today
    show('today');
    return;
  }
  if (app.view === 'today') history.pushState({ view: name }, '');
  else history.replaceState({ view: name }, '');
  show(name);
}

window.addEventListener('popstate', (e) => {
  if (closeOpenSheet()) return; // back closes an open sheet first
  const view = e.state?.view || 'today';
  if (view !== app.view) show(view);
});

document.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-tab]');
  if (tab) return setView(tab.dataset.tab);
  if (e.target.closest('[data-lang-toggle]')) app.setLang(state.lang === 'ar' ? 'en' : 'ar');
});

async function loadData() {
  const names = ['history', 'forecasts', 'why', 'places', 'rates'];
  const files = await Promise.all(
    names.map((n) => fetch(`data/${n}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null)),
  );
  names.forEach((n, i) => { app.data[n] = files[i]; });
}

const VIEWS = ['./views/today.js', './views/mygold.js', './views/future.js', './views/buysell.js', './ui/share.js', './ui/currency.js', './install.js'];

// The data and every module load at once (QA35); one broken tab must not stop the others.
async function start() {
  history.replaceState({ view: 'today' }, '');
  applyLang();
  const data = loadData();
  const mods = await Promise.all(VIEWS.map((path) => import(path).catch((err) => {
    console.error(path, err);
    return null;
  })));
  mods.forEach((mod, i) => {
    try {
      mod?.mount?.(app);
    } catch (err) {
      console.error(VIEWS[i], err);
    }
  });
  await data;
  app.emit('data');
  if (document.fonts) document.fonts.ready.then(() => app.emit('layout'));
}

start();
