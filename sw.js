// Praise FM — Service Worker PWA (Atualizado em 06/12/2025)
// Este SW prioriza atualizações do index.html e evita layout antigo

const CACHE_NAME = 'praisefm-cache-v20251206';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/image/logopraisefm.webp',
  '/image/praisefmnonstop.png',
  '/image/praisefmcarpoollogo.webp',
  '/image/praisefmworship.png',
  '/image/morningshowlogo.webp',
  '/image/midnightgracelogo.webp',
  '/image/middaygracelogo.webp',
  '/image/sundaywithchrist.png',
  '/image/praisefmpoplogo.webp',
  '/image/praisefmmagazine.png',
  '/image/praisefmclassicslogo.webp',
  '/image/praisefmfutureartistlogo.webp',
  '/image/livingthemessage.webp',
  '/image/favicon-32x32.png'
];

// Instalação: pré-carrega assets essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Ativação: remove caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Estratégia de rede e cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ❌ Ignora streaming da Zeno (nunca cacheie)
  if (url.hostname.includes('zeno.fm')) {
    return;
  }

  // ❌ Ignora EventSource (SSE de metadados)
  if (event.request.headers.get('accept') === 'text/event-stream') {
    return;
  }

  // ✅ index.html: sempre tenta rede primeiro (atualiza layout imediatamente)
  if (event.request.url.endsWith('/index.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200) {
            return caches.match('/index.html');
          }
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // ✅ Outros assets: cache-first (imagens, ícones, etc.)
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            return response;
          })
          .catch(() => caches.match(event.request));
      })
  );
});
