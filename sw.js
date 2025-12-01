// Praise FM – Service Worker PWA (versão corrigida)

// Ativa imediatamente após instalar
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Assume o controle das abas imediatamente
self.addEventListener("activate", (event) => {
  clients.claim();
});

// Fetch simples: rede > cache
self.addEventListener("fetch", (event) => {

  // Nunca interceptar stream de rádio ou EventSource
  if (
    event.request.url.includes("zeno.fm") ||
    event.request.headers.get("accept") === "text/event-stream"
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
