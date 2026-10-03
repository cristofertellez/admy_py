// Service Worker for AdmiPy PWA
// Smart caching: one cache per resource type, each with a tailored strategy.
//
// Strategies:
// - Navigations (layout/pages):  Network First -> Pages cache -> Offline page
// - RSC payloads (visited):      Network First -> Pages cache (offline client navigation)
// - Build assets (_next/static): Cache First (content-hashed, immutable)
// - Fonts:                       Cache First in a dedicated long-lived cache
// - Images/icons:                Stale While Revalidate in a bounded cache
// - Manifest/config:             Stale While Revalidate

const VERSION = "v3";

const PRECACHE_CACHE = `admipy-precache-${VERSION}`;
const STATIC_CACHE = `admipy-static-${VERSION}`;
const FONT_CACHE = `admipy-fonts-${VERSION}`;
const RUNTIME_CACHE = `admipy-runtime-${VERSION}`;
const PAGES_CACHE = `admipy-pages-${VERSION}`;

const OWNED_CACHES = [
  PRECACHE_CACHE,
  STATIC_CACHE,
  FONT_CACHE,
  RUNTIME_CACHE,
  PAGES_CACHE,
];

// Core shell available on first load: offline fallback, config and icons.
const PRECACHE_URLS = [
  "/offline",
  "/manifest.json",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

const MAX_RUNTIME_ENTRIES = 60;
const MAX_PAGES_ENTRIES = 20;

const FONT_EXTENSIONS = /\.(woff2?|ttf|otf)$/i;
const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|avif|gif|svg|ico)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE_CACHE);
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            await cache.add(url);
          } catch {
            // A missing precache asset must never block installation.
          }
        })
      );
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !OWNED_CACHES.includes(key))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isCacheable(response) {
  return (
    Boolean(response) &&
    response.ok &&
    (response.type === "basic" || response.type === "cors")
  );
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  for (const key of keys.slice(0, keys.length - maxEntries)) {
    await cache.delete(key);
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheable(response)) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then(async (response) => {
      if (isCacheable(response)) {
        await cache.put(request, response.clone());
        if (maxEntries) {
          await trimCache(cacheName, maxEntries);
        }
      }
      return response;
    })
    .catch(() => undefined);

  return cached || (await network) || Response.error();
}

async function fetchAndCachePage(request) {
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      const cache = await caches.open(PAGES_CACHE);
      await cache.put(request, response.clone());
      await trimCache(PAGES_CACHE, MAX_PAGES_ENTRIES);
    }
    return response;
  } catch {
    return null;
  }
}

async function handleNavigation(request) {
  const response = await fetchAndCachePage(request);
  if (response) return response;

  const cached = await caches.match(request);
  if (cached) return cached;
  const offline = await caches.match("/offline");
  return offline || Response.error();
}

async function handleClientNavigation(request) {
  const response = await fetchAndCachePage(request);
  if (response) return response;

  // The router expects RSC flight data, so a cache miss must fail and let
  // Next.js recover with a full-page navigation instead of serving the
  // /offline HTML fallback.
  return (await caches.match(request)) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || !url.protocol.startsWith("http")) return;
  if (request.headers.has("range")) return;

  // Never intercept dynamic data or authentication endpoints.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.includes("/auth/") ||
    url.pathname.includes("/rest/")
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  const isSameOrigin = url.origin === self.location.origin;

  // Client-side navigation payloads of visited routes: Network First into the
  // pages cache so the router can keep soft-navigating while offline.
  // Prefetch payloads only contain loading states and must never be cached.
  if (isSameOrigin && (request.headers.has("RSC") || url.searchParams.has("_rsc"))) {
    if (!request.headers.has("Next-Router-Prefetch")) {
      event.respondWith(handleClientNavigation(request));
    }
    return;
  }

  // Content-hashed build output: JS chunks/components and CSS are immutable.
  if (isSameOrigin && url.pathname.startsWith("/_next/static/")) {
    if (FONT_EXTENSIONS.test(url.pathname)) {
      event.respondWith(cacheFirst(request, FONT_CACHE));
    } else {
      event.respondWith(cacheFirst(request, STATIC_CACHE));
    }
    return;
  }

  // Web fonts (self-hosted or Google Fonts): immutable once published.
  if (
    url.hostname.endsWith("fonts.gstatic.com") ||
    (isSameOrigin && FONT_EXTENSIONS.test(url.pathname))
  ) {
    event.respondWith(cacheFirst(request, FONT_CACHE));
    return;
  }

  // App configuration should refresh in the background but serve instantly.
  if (isSameOrigin && url.pathname === "/manifest.json") {
    event.respondWith(staleWhileRevalidate(request, PRECACHE_CACHE));
    return;
  }

  // Images and icons: serve from cache, revalidate on the background.
  const isImage =
    request.destination === "image" ||
    (isSameOrigin && IMAGE_EXTENSIONS.test(url.pathname));
  if (isImage && isSameOrigin) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE, MAX_RUNTIME_ENTRIES));
  }
});

// ============================================================
// Web Push support (Historias 13.4 / 14.12 — prepared)
// Delivery requires a push provider (VAPID keys + push service);
// these handlers make the Service Worker ready for when it lands.

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = null;
  try {
    payload = event.data.json();
  } catch (err) {
    payload = { title: "AdmiPy", body: event.data.text() };
  }
  const title = payload.title || "AdmiPy";
  const options = {
    body: payload.body || payload.message || "",
    tag: payload.tag || "admipy-notification",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: payload.url || "/dashboard/notifications" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/dashboard/notifications";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
