import { load, save } from './store.js';
import { t } from './i18n.js';
import { syncKarats } from './ui/karats.js';

const storage = (() => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
})();

const state = load(storage);
const listeners = new Map();

/** Shared app object handed to every view's mount(app). Events: lang, karat, price, data, view, pieces. */
export const app = {
  state,
  data: { history: null, forecasts: null, why: null, places: null },
  price: { usd: state.last?.usd ?? null, updatedAt: state.last?.updatedAt ?? null },
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
  setView,
};

function applyLang() {
  const root = document.documentElement;
  root.lang = state.lang;
  root.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  document.title = app.t('appName');
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = app.t(el.dataset.t); });
  document.querySelectorAll('[data-alt]').forEach((el) => { el.alt = app.t(el.dataset.alt); });
  document.querySelectorAll('[data-aria]').forEach((el) => el.setAttribute('aria-label', app.t(el.dataset.aria)));
  document.querySelectorAll('[data-ph]').forEach((el) => { el.placeholder = app.t(el.dataset.ph); });
  document.querySelectorAll('[data-k-label]').forEach((el) => { el.textContent = app.t('karatN', el.dataset.kLabel); });
  requestAnimationFrame(() => syncKarats(document.getElementById('karats'), state.karat, 'k'));
}

function setView(name) {
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

document.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-tab]');
  if (tab) return setView(tab.dataset.tab);
  if (e.target.closest('[data-lang-toggle]')) app.setLang(state.lang === 'ar' ? 'en' : 'ar');
});

async function loadData() {
  const names = ['history', 'forecasts', 'why', 'places'];
  const files = await Promise.all(
    names.map((n) => fetch(`data/${n}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null)),
  );
  names.forEach((n, i) => { app.data[n] = files[i]; });
  app.emit('data');
}

const VIEWS = ['./views/today.js', './views/mygold.js', './views/future.js', './views/buysell.js', './ui/share.js', './install.js'];

async function start() {
  applyLang();
  for (const path of VIEWS) {
    try {
      const mod = await import(path);
      mod.mount?.(app);
    } catch (err) {
      console.error(path, err); // one broken tab must not stop the others
    }
  }
  await loadData();
  if (document.fonts) document.fonts.ready.then(() => app.emit('layout'));
}

start();
