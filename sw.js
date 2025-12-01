// Praise FM – Service Worker Fix (2025)

// Instalação
self.addEventListener("install", (event) => {
    self.skipWaiting();
});

// Ativação
self.addEventListener("activate", (event) => {
    clients.claim();
});

// Fetch básico para habilitar PWA
self.addEventListener("fetch", (event) => {
    // Não cache streams nem event-source
    if (
        event.request.url.includes("zeno.fm") ||
        event.request.url.includes("metadata") ||
        event.request.headers.get("accept") === "text/event-stream"
    ) {
        return;
    }

    // Resposta padrão: rede primeiro
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
