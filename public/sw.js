/* WebTrak service worker.
 *
 * Deliberately small and safe for an app full of private data:
 *  - API traffic (/api/*) is NEVER cached or intercepted — responses are per-user and must always be live.
 *  - Page HTML is never cached either; only when the network is unreachable do we show a friendly offline page.
 *  - Hashed build assets (/_next/static) are cached forever (their URL changes when their content does), and the
 *    app's icons/images are served instantly from cache while quietly refreshing in the background.
 * A new version waits until the person chooses "Refresh" (the page sends SKIP_WAITING), so we never swap code
 * underneath someone who is in the middle of filling in a form.
 */
const VERSION = "v2";
const STATIC_CACHE = `wt-static-${VERSION}`;
const ASSET_CACHE = `wt-assets-${VERSION}`;
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png", "/webtrak-logo.png"];
const ASSET_LIMIT = 80;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC_CACHE, ASSET_CACHE]);
      for (const name of await caches.keys()) {
        if (name.startsWith("wt-") && !keep.has(name)) await caches.delete(name);
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i += 1) await cache.delete(keys[i]);
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(cacheName)).put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
        trim(ASSET_CACHE, ASSET_LIMIT);
      }
      return response;
    })
    .catch(() => cached);
  return cached || refresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // live, per-user data: never touched

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match(OFFLINE_URL)) || Response.error())
    );
    return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  if (/\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});


/* ---- Web push (chat messages) ------------------------------------------------------------------------------
 * The server sends {title, body, url, tag}. If WebTrak is already open and in front the page shows the message
 * itself, so no notification is raised then. Otherwise one notification per conversation (the tag replaces the
 * previous one rather than stacking), and clicking it opens or focuses WebTrak on that conversation.
 */
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "WebTrak", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (windows.some((client) => client.visibilityState === "visible" && client.focused)) return;
      await self.registration.showNotification(data.title || "WebTrak", {
        body: data.body || "",
        tag: data.tag || "webtrak",
        renotify: true,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        data: { url: data.url || "/dashboard/chat" },
      });
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || "/dashboard/chat", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (open) {
        await open.focus();
        if ("navigate" in open) await open.navigate(target).catch(() => undefined);
        return;
      }
      await self.clients.openWindow(target);
    })()
  );
});
