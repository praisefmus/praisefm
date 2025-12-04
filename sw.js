// sw.js
const CACHE_NAME = 'praisefm-us-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/image/logopraisefm.webp',
  '/image/praisefm-192.png',
  '/image/praisefm-512.png',
  '/image/favicon-32x32.png'
];

// Instalação: pré-carrega assets essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache).catch(err => {
          console.warn('Cache failed for some assets:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação: remove caches antigos
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: estrategicamente serve do cache ou rede
self.addEventListener('fetch', (event) => {
  // Não interferir em requisições de streaming de áudio ou EventSource (metadados)
  if (
    event.request.destination === 'audio' ||
    event.request.url.includes('/mounts/metadata/') ||
    event.request.url.includes('stream.zeno.fm')
  ) {
    return;
  }

  // Para outros recursos (HTML, CSS, imagens, manifest, etc.)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Fallback para index.html (útil em rotas que não existem, se usar SPA)
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      });
    })
  );
});
