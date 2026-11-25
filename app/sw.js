// Offline support (design section 9). Bump VERSION when the precache list changes.
const VERSION = 'gold-today-v1';
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
  'data/why.json',
  'fonts/Almarai-normal-400-arabic.woff2',
  'fonts/Almarai-normal-400-latin.woff2',
  'fonts/Almarai-normal-700-arabic.woff2',
  'fonts/Almarai-normal-700-latin.woff2',
  'fonts/Amiri-normal-700-arabic.woff2',
  'fonts/Amiri-normal-700-latin.woff2',
  'fonts/SourceSerif4-normal-500-latin.woff2',
  'fonts/SourceSerif4-normal-600-latin.woff2',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'img/gold-1200.webp',
  'img/gold-600.webp',
  'img/hero-1200.webp',
  'img/hero-600.webp',
  'img/shop-1200.webp',
  'img/shop-600.webp',
  'js/calc.js',
  'js/config.js',
  'js/forecast.js',
  'js/gold.js',
  'js/history.js',
  'js/i18n.js',
  'js/install.js',
  'js/live.js',
  'js/main.js',
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

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // Only same-origin GETs; the live price feed is never cached here (the app keeps the last price itself).
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (req.mode === 'navigate' || url.pathname.includes('/data/')) {
    // Network first so prices, forecasts and pages stay fresh; fall back to the cached copy offline.
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(VERSION).then((c) => c.put(req.mode === 'navigate' ? './' : req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req.mode === 'navigate' ? './' : req)),
    );
    return;
  }
  // Code, fonts and images: serve from cache at once, refresh the cache in the background.
  e.respondWith(
    caches.open(VERSION).then(async (c) => {
      const hit = await c.match(req, { ignoreSearch: true });
      const net = fetch(req).then((res) => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }),
  );
});
