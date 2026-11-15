// Service worker: aplikacja działa bez internetu (na siłowni często go nie ma).
// Strategia: najpierw sieć (żeby dostać aktualizacje), a gdy jej nie ma — kopia z pamięci.
const CACHE = 'pushband-v2';
const FILES = ['./', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/apple-touch-icon.png',
  './fonts.css', ...['barlow-500', 'barlow-600', 'barlow-condensed-500', 'barlow-condensed-700']
    .flatMap(f => [`./fonts/${f}-latin.woff2`, `./fonts/${f}-latin-ext.woff2`])];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        }
        // np. 404, gdy strona jest chwilowo wyłączona — kopia z pamięci, jeśli jest
        return caches.match(e.request, { ignoreSearch: true }).then(r => r || res);
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});
