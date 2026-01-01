const CACHE_NAME = "forklift-cache-v1";

const ASSETS = [
  "/", 
  "/index.html",
  "/dashboard.html",
  "/report.html",
  "/menu.html",
  "/menu.css",
  "/menu.js",
  "/manifest.json",
  "/gilro-logo-v2.png",
  "/logo.jpg"
];

// התקנה — שמירת קבצים בקאש
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// הפעלה — ניקוי קאש ישן
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// יירוט בקשות — טעינה מהקאש קודם
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return (
        cached ||
        fetch(event.request).catch(() =>
          caches.match("/index.html")
        )
      );
    })
  );
});
