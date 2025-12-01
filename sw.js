// Praise FM — Service Worker PWA (Versão Final e Segura)

// Nome do cache
const CACHE_NAME = "praisefm-v1";

// Arquivos que entram no cache offline
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/image/logopraisefm.webp",
  "/image/praisefmnonstop.png",
  "/image/praisefmcarpoollogo.webp",
  "/image/praisefmworship.png",
  "/image/morningshowlogo.webp",
  "/image/midnightgracelogo.webp",
  "/image/middaygracelogo.webp",
  "/image/sundaywithchrist.png",
  "/image/praisefmpoplogo.webp",
  "/image/praisefmmagazine.png",
  "/image/favicon-32x32.png"
];

// Instalação (pré-cache)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Ativação (limpa caches antigos)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estratégia: Network-first com fallback para cache
self.addEventListener("fetch", (event) => {

  // Não interceptar streaming da Zeno
  if (event.request.url.includes("zeno.fm")) return;

  // Não interceptar SSE
  if (event.request.headers.get("accept") === "text/event-stream") return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clona resposta e coloca no cache
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
