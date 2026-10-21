const CACHE_VERSION = "kastriva-v6-sw-response-fix";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;
const OFFLINE_URL = "/offline";
const PRECACHE = [
  OFFLINE_URL,
  "/brand/kastriva-logo-on-dark.png",
  "/brand/kastriva-logo-on-light.png",
  "/brand/kastriva-mark.png",
  "/android-chrome-192x192.png",
  "/android-chrome-512x512.png",
  "/maskable-icon-512x512.png",
  "/apple-touch-icon.png",
  "/favicon.ico"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("kastriva-") && ![STATIC_CACHE, PAGE_CACHE].includes(key)).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

function isPrivatePath(pathname) {
  return pathname.startsWith("/api/") || pathname.startsWith("/admin") || pathname.startsWith("/customer") || pathname.startsWith("/login");
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isPrivatePath(url.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && !url.pathname.startsWith("/order/success")) {
            const copy = response.clone();
            const cacheWrite = caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy)).catch((error) => {
              console.warn("[Kastriva SW] Page cache write failed:", error);
            });
            event.waitUntil(cacheWrite);
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match(OFFLINE_URL)))
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || /\.(?:png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            const cacheWrite = caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy)).catch((error) => {
              console.warn("[Kastriva SW] Static cache write failed:", error);
            });
            event.waitUntil(cacheWrite);
          }
          return response;
        }).catch(() => cached);
        return cached || network;
      })
    );
  }
});
