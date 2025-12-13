
const CACHE_NAME = "compras-o-cr-v1"; // <- incrementá esta versión cuando publiques cambios
const FILES_TO_CACHE = [
  "/",               // si usás rutas diferentes, ajustá
  "/index.html",
  "/lista.html",
  "/style.css",
  "/lista.css",
  "/app.js",
  "/lista.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// Instalación: cache inicial
self.addEventListener("install", (event) => {
  console.log("[SW] install");
  self.skipWaiting(); // Pide activación inmediata
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] caching app shell");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// Activación: eliminar cachés viejas
self.addEventListener("activate", (event) => {
  console.log("[SW] activate");
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] deleting old cache:", key);
            return caches.delete(key);
          }
        })
      );

      // Informar a todas las pestañas que hay una nueva versión disponible
      const clientsList = await self.clients.matchAll({ type: "window" });
      for (const client of clientsList) {
        client.postMessage({ type: "SW_UPDATED", message: "Nueva versión disponible" });
      }

      await self.clients.claim(); // tomar control inmediatamente
    })()
  );
});

// Fetch: estrategia híbrida
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Bypass requests to browser extensions or non-HTTP(s)
  if (!req.url.startsWith("http")) return;

  // Para navegación (HTML) intentamos la red primero, fallback a caché
  if (req.mode === "navigate" || (req.method === "GET" && req.headers.get("accept")?.includes("text/html"))) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Actualiza caché con la respuesta fresca
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match("/index.html")))
    );
    return;
  }

  // Para otros assets: cache-first con actualización en background
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          // Actualiza caché con la respuesta más reciente
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => null);

      // Si existe en caché, devolverlo rápido y actualizar en background
      return cached || networkFetch;
    })
  );
});

// Permite a la página forzar la activación del SW
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (data.type === "CLEAR_OLD_CACHES") {
    // borrar cachés viejos excepto el actual
    caches.keys().then((keys) => {
      keys.forEach((k) => {
        if (k !== CACHE_NAME) caches.delete(k);
      });
    });
  }
});
