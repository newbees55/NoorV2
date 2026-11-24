// Service worker NOOR — shell dicache untuk luar talian; teks Quran & fon dicache semasa dibaca.
// __BUILD__ digantikan dengan SHA commit oleh workflow deploy (supaya cache baharu setiap deploy).
const BUILD = '__BUILD__';
const SHELL = 'noor-shell-' + BUILD;
const KEEP = [SHELL, 'noor-quran', 'noor-fonts'];
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/app.js', 'js/store.js', 'js/util.js', 'js/prayer.js', 'js/qibla.js', 'js/duas.js', 'js/quran.js', 'js/tasbih.js', 'js/habits.js',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => !KEEP.includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const okToStore = r => r && (r.ok || r.type === 'opaque');

async function staleWhileRevalidate(e, cacheName) {
  const c = await caches.open(cacheName);
  const hit = await c.match(e.request, { ignoreSearch: true });
  const net = fetch(e.request).then(r => { if (okToStore(r)) c.put(e.request, r.clone()); return r; }).catch(() => null);
  if (hit) { e.waitUntil(net); return hit; }
  return (await net) || (e.request.mode === 'navigate' ? c.match('index.html') : Response.error());
}
async function cacheFirst(e, cacheName) {
  const c = await caches.open(cacheName);
  const hit = await c.match(e.request);
  if (hit) return hit;
  try { const r = await fetch(e.request); if (okToStore(r)) c.put(e.request, r.clone()); return r; }
  catch { return Response.error(); }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === location.origin) e.respondWith(staleWhileRevalidate(e, SHELL));
  else if (u.hostname === 'api.alquran.cloud') e.respondWith(cacheFirst(e, 'noor-quran'));      // teks Quran tidak berubah
  else if (u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') e.respondWith(cacheFirst(e, 'noor-fonts'));
  // api.aladhan.com: terus ke rangkaian (app cache sendiri dalam localStorage)
});
