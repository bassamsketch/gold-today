// Offline support (design section 9). Bump VERSION when the precache list changes.
const VERSION = 'gold-today-v6';
const PRECACHE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'css/fonts.css',
  'css/tokens.css',
  'data/forecasts.json',
  'data/history.json',
  'data/places.json',
  'data/rates.json',
  'data/why.json',
  'fonts/Almarai-normal-400-arabic.woff2',
  'fonts/Almarai-normal-400-latin.woff2',
  'fonts/Almarai-normal-700-arabic.woff2',
  'fonts/Almarai-normal-700-latin.woff2',
  'fonts/NotoNaskhArabic-normal-600_700-arabic.woff2',
  'fonts/SourceSerif4-normal-500_600-latin.woff2',
  'icons/gold-180.png',
  'icons/gold-192.png',
  'icons/gold-512.png',
  'icons/gold-maskable-512.png',
  'img/gold-1200.webp',
  'img/hero-1200.webp',
  'img/shop-1200.webp',
  'js/calc.js',
  'js/config.js',
  'js/forecast.js',
  'js/gold.js',
  'js/history.js',
  'js/i18n.js',
  'js/insights.js',
  'js/install.js',
  'js/live.js',
  'js/main.js',
  'js/money.js',
  'js/price.js',
  'js/store.js',
  'js/time.js',
  'js/ui/chart.js',
  'js/ui/countup.js',
  'js/ui/karats.js',
  'js/ui/odometer.js',
  'js/ui/share.js',
  'js/ui/sheet.js',
  'js/views/buysell.js',
  'js/views/future.js',
  'js/views/mygold.js',
  'js/views/today.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u)))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const NET_TIMEOUT = 4000;

// The page, its code and its data come from the network first, so one release never mixes with
// another (QA34). The cached copy answers offline, or when the network takes longer than 4 s.
function networkFirst(e, req, key) {
  const net = fetch(req).then((res) => {
    if (res.ok) {
      const copy = res.clone(); // copy now: once the page reads res, it can no longer be cloned
      const put = caches.open(VERSION).then((c) => c.put(key, copy));
      try {
        e.waitUntil(put);
      } catch {
        /* the page was already answered from the cache; the copy is still stored */
      }
    }
    return res;
  });
  const slow = new Promise((_, reject) => setTimeout(() => reject(new Error('slow network')), NET_TIMEOUT));
  return Promise.race([net, slow]).catch(async () => (await caches.match(key, { ignoreSearch: true })) || net);
}

// Fonts, photos and icons never change under the same name: the cache answers first.
function cacheFirst(e, req) {
  return caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) {
      const copy = res.clone();
      e.waitUntil(caches.open(VERSION).then((c) => c.put(req, copy)));
    }
    return res;
  }));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Only same-origin GETs; the live price feed is never cached here (the app keeps the last price itself).
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (/\/(fonts|img|icons)\//.test(url.pathname)) return e.respondWith(cacheFirst(e, req));
  const isPage = req.mode === 'navigate' && /\/(index\.html)?$/.test(url.pathname);
  e.respondWith(networkFirst(e, req, isPage ? './' : req));
});
