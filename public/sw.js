// Hand-written service worker — deliberately minimal (app-shell + offline
// fallback only, not full asset precaching). Registered from
// ServiceWorkerRegistration.tsx, scoped separately per portal (Market
// Associate, Partner, and Admin each register their own scope so this SW
// never controls a route outside the portal that asked for it).
//
// Bump CACHE_VERSION on any change here so the old cache is dropped on
// activate instead of serving stale assets forever.
const CACHE_VERSION = "hook-shell-v6";
const OFFLINE_URL = "/offline";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never intercept Next runtime or build chunks. Development reuses some
  // chunk URLs while replacing their module factories, and production build
  // assets are already content-hashed and browser-cacheable. Serving either
  // from a service-worker cache can mix two builds and crash React hydration.
  if (url.pathname.startsWith("/_next/")) {
    return;
  }

  // Only navigations get the offline fallback — everything else (API calls)
  // just goes to the network as normal. A failed API call should surface as
  // a real error the app can show, not a silent swap for cached HTML.
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL)),
  );
});

// Real closed-app push for Market Associates and Partners — see
// lib/push-subscribe.ts for how a browser subscribes, and
// src/services/push.service.ts (sendWebPushToUser) for what sends this.
self.addEventListener("push", (event) => {
  let payload = { title: "Hook", body: "" };
  try {
    payload = event.data ? event.data.json() : payload;
  } catch {
    // Non-JSON payload: fall back to the default title/body above.
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || "Hook", {
      body: payload.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: payload.data || {},
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data && event.notification.data.href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const target = href ? new URL(href, self.location.origin).href : self.location.origin;
      const existing = clients.find((client) => client.url === target);
      if (existing) return existing.focus();
      const focusable = clients[0];
      if (focusable && "navigate" in focusable) return focusable.focus().then(() => focusable.navigate(target));
      return self.clients.openWindow(target);
    }),
  );
});
