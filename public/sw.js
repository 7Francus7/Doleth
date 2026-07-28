const SHELL_CACHE = "doleth-shell-v1";
const OFFLINE_URL = "/offline.html";
const SHELL_ASSETS = [
  OFFLINE_URL,
  "/brand/doleth-mark.svg",
  "/brand/doleth-app-icon-192.png",
  "/brand/doleth-app-icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("doleth-shell-") && key !== SHELL_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    // Nunca se cachea una página: la red es la única fuente. Si no hay red se
    // sirve la pantalla offline, y si el install falló y ni siquiera esa está
    // cacheada hay que devolver una Response igual — respondWith(undefined)
    // rompe con TypeError y el usuario ve un error del navegador sin explicación.
    event.respondWith(
      fetch(request).catch(async () => {
        const offline = await caches.match(OFFLINE_URL);
        if (offline) return offline;
        return new Response(
          "<!doctype html><meta charset=\"utf-8\"><title>Sin conexión</title>" +
            "<p>Estás sin conexión. Doleth no guarda páginas financieras, así que " +
            "necesita red para mostrarte tus números.</p>",
          {
            status: 503,
            headers: {
              "Cache-Control": "no-store",
              "Content-Type": "text/html; charset=utf-8",
            },
          },
        );
      }),
    );
    return;
  }

  const cacheableAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/brand/");
  if (!cacheableAsset) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
