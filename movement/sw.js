/* Offline shell for Movement Now. The page comes from the network whenever
   there is one; the icons come from the cache. Nothing here touches the
   logged data—that lives in localStorage and never leaves the device.

   BUILD must match `BUILT` in index.html and must change on **every** deploy
   of this directory, not only when this file changes. A browser re-installs a
   service worker only when the worker's own bytes differ, so leaving this
   alone leaves the offline copy frozen at whatever the page was the last time
   it did change—which is how a phone ends up showing an old version. */

const BUILD = "2026-08-05";
const CACHE = "movement-" + BUILD;

const PAGE = "/movement/";
const PAGE_FILE = "/movement/index.html";
const SHELL = [
  PAGE,
  PAGE_FILE,
  "/movement/manifest.webmanifest",
  "/movement/icon-192.png",
  "/movement/icon-512.png",
  "/movement/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      // `reload` so installing cannot pick the page up out of the HTTP cache.
      .then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: "reload" })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isPage(req, url) {
  return req.mode === "navigate" || url.pathname === PAGE || url.pathname === PAGE_FILE;
}

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // The page: network first, and every copy that arrives refreshes **both**
  // keys, so the one kept for offline is never older than the last visit.
  if (isPage(req, url)) {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => {
              c.put(PAGE, copy.clone());
              c.put(PAGE_FILE, copy);
            });
          }
          return res;
        })
        .catch(() => caches.match(PAGE).then(hit => hit || caches.match(PAGE_FILE)))
    );
    return;
  }

  // Icons and the manifest only. Anything else is left to the browser rather
  // than cached forever under a URL nobody will think to clear.
  if (!/\.(png|webmanifest)$/.test(url.pathname)) return;
  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }))
  );
});
