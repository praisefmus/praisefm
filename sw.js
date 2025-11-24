// sw.js
const CACHE_NAME = 'praisefm-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/image/logopraisefm.webp',
  '/image/favicon-32x32.png',
  '/image/favicon-192x192.png',
  '/image/favicon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  // Não interfere no stream de áudio
  if (event.request.url.includes('stream.zeno.fm') || event.request.url.includes('/api/')) {
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
