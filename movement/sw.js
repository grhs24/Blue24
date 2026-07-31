/* Offline shell for Movement. Network first for the page so updates land,
   cache first for the icons. Nothing here touches the logged data—that lives
   in localStorage and never leaves the device. */

/* Bump this whenever the shell changes: `activate` deletes every cache that
   is not the current one, which is what clears a stale copy off a phone. */
const CACHE = "movement-v2";
const SHELL = [
  "/movement/",
  "/movement/index.html",
  "/movement/manifest.webmanifest",
  "/movement/icon-192.png",
  "/movement/icon-512.png",
  "/movement/apple-touch-icon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put("/movement/", copy));
          return res;
        })
        .catch(() => caches.match("/movement/").then(hit => hit || caches.match("/movement/index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }))
  );
});
