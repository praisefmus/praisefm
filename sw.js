// sw.js
const CACHE_NAME = 'praisefm-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/image/praisefm-192.png',
  '/image/praisefm-512.png',
  '/image/logopraisefm.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', (event) => {
  // Não interceptar streams de áudio ou EventSource
  if (
    event.request.destination === 'audio' ||
    event.request.url.includes('zeno.fm') ||
    event.request.url.includes('/mounts/metadata/')
  ) return;

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
