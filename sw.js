// Praise FM – Service Worker PWA (versão corrigida)

// Instala imediatamente
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Assume todas as abas
self.addEventListener("activate", (event) => {
  clients.claim();
});

// Rede primeiro, fallback no cache
self.addEventListener("fetch", (event) => {

  // Não interceptar stream Zeno
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
