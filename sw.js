// Praise FM — Service Worker PWA (Versão Final e Otimizada)
const CACHE_NAME = "praisefm-us-v2";
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
  "/image/favicon-32x32.png",
  // 🔹 Ícones PWA exigidos pelo Chrome
  "/image/praisefm-192.png",
  "/image/praisefm-512.png"
];

// Instalação: pré-carrega assets essenciais
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn("Asset não encontrado durante o pré-cache:", err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação: remove caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Estratégia de rede com fallback para cache
self.addEventListener("fetch", (event) => {
  // Não interceptar streaming de áudio
  if (event.request.url.includes("zeno.fm")) return;

  // Não interceptar EventSource (SSE)
  if (event.request.headers.get("accept")?.includes("text/event-stream")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Salva resposta válida no cache
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Fallback: tenta recuperar do cache
        return caches.match(event.request).then((cached) => {
          return cached || caches.match("/index.html");
        });
      })
  );
});
