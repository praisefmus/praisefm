// sw.js – Service Worker mínimo para ativar PWA
const CACHE_NAME = 'praisefm-us-v1';
const urlsToCache = [
  '/',
  '/image/logopraisefm.webp',
  '/image/praisefm-192.png',
  '/image/praisefm-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  // Opcional: serve do cache se offline
  // Para streaming de rádio, não cacheamos a stream
  if (event.request.destination === 'audio') {
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
