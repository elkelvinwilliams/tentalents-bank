/* Ten Talents Academy — service worker. Offline shell + cached static assets.
   Never caches /api or authenticated pages; navigations are network-first with an
   offline fallback. Bump V to invalidate. */
const V = "tt-2026-09-25";
const OFFLINE = "/offline";
const PRECACHE = [OFFLINE, "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/logo-hand-gold.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin || u.pathname.startsWith("/api/")) return;
  if (r.mode === "navigate") {
    e.respondWith(fetch(r).catch(() => caches.match(OFFLINE)));
    return;
  }
  if (u.pathname.startsWith("/_next/static/") || u.pathname.startsWith("/icons/") || /\.(png|jpg|svg|woff2?|ico|webp)$/.test(u.pathname)) {
    e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => { if (res.ok) { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)); } return res; })));
  }
});
