/* ------------------------------------------------------------
   Menashe Calendar — Service Worker v5
   Two caches:
     menashe-shell-v3  → app shell (HTML, icons, manifest)
     menashe-assets-v3 → JS/CSS/font/image bundles (runtime cached)
   Git-safe: no build manifest, no hashed filenames hardcoded.
   ------------------------------------------------------------ */

const SHELL_CACHE  = "menashe-shell-v5";
const ASSET_CACHE  = "menashe-assets-v5";
const KNOWN_CACHES = [SHELL_CACHE, ASSET_CACHE];
const APP_SHELL_URL = "/";

const SHELL_URLS = [
  APP_SHELL_URL,
  "/manifest.json",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/logo.svg",
];

/* ── Install: pre-cache stable app shell ── */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      cache.addAll(SHELL_URLS).catch(() => {})
    )
  );
  self.skipWaiting();
});

/* ── Activate: delete every cache not in KNOWN_CACHES ── */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !KNOWN_CACHES.includes(k)).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

/* ── Fetch ── */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  /* Pass-through: API calls, Clerk auth, Vite dev internals */
  if (url.pathname.startsWith("/api/")) return;
  if (url.hostname.includes("clerk") || url.hostname.includes("accounts.dev")) return;
  if (url.pathname.startsWith("/@") || url.pathname.startsWith("/node_modules/")) return;
  if (url.pathname.includes("/__") || url.pathname.includes("/repl")) return;

  /* Cross-origin (CDN fonts, etc): network-only */
  if (url.origin !== self.location.origin) return;

  const isNavigation = event.request.mode === "navigate";

  /* Static assets: JS bundles, CSS, fonts, images
     Strategy: stale-while-revalidate
     → Serve from cache immediately if available; always fetch in background and update cache */
  const isAsset = /\.(js|mjs|css|woff2?|ttf|otf|png|jpe?g|svg|webp|ico|json)(\?.*)?$/.test(
    url.pathname
  );

  if (isNavigation) {
    /* Navigation: network-first, fall back to cached shell */
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(event.request).then(
            (cached) => cached || caches.match(APP_SHELL_URL)
          )
        )
    );
    return;
  }

  if (isAsset) {
    /* Assets: stale-while-revalidate */
    event.respondWith(
      caches.open(ASSET_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          const networkFetch = fetch(event.request)
            .then((res) => {
              if (res.ok) cache.put(event.request, res.clone());
              return res;
            })
            .catch(() => cached || Response.error());
          /* Serve stale immediately; update happens in background */
          return cached || networkFetch;
        })
      )
    );
    return;
  }

  /* Everything else: network with cache fallback */
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || Response.error()))
  );
});

/* ── Push notifications (unchanged from v2) ── */
self.addEventListener("push", (event) => {
  let data = {
    title: "Menashe Calendar",
    body: "You have a new notification.",
    tag: "menashe-default",
    icon: "/icon-192.png",
    url: "/",
  };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      icon: data.icon || "/icon-192.png",
      badge: "/icon-192.png",
      vibrate: [100, 50, 100],
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const requestedUrl =
    (event.notification.data && event.notification.data.url) || "/";
  let targetUrl = new URL("/", self.location.origin).href;
  try {
    const parsed = new URL(requestedUrl, self.location.origin);
    const safeProtocol = parsed.protocol === "https:" ||
      (parsed.protocol === "http:" && self.location.protocol === "http:");
    const safePath = parsed.pathname.startsWith("/") &&
      !parsed.pathname.startsWith("/api/") &&
      !parsed.pathname.startsWith("//");
    if (parsed.origin === self.location.origin && safeProtocol && safePath) {
      targetUrl = parsed.href;
    }
  } catch {}
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (new URL(client.url).origin === self.location.origin && "focus" in client) {
            if (client.navigate && client.url !== targetUrl) {
              return client.navigate(targetUrl).then(() => client.focus());
            }
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(targetUrl);
      })
  );
});
