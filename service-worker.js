const CACHE_NAME = "forklift-cache-v3";

const ASSETS = [
  "./",
  "index.html",
  "dashboard.html",
  "report.html",
  "menu.js",
  "menu.css",
  "manifest.json",
  "gilro-logo-v2.png",
  "logo.jpg",
  "camera-icon.png"
];

// התקנה
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// הפעלה
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// טעינה בטוחה
self.addEventListener("fetch", event => {
  const url = event.request.url;

  // דלג על בקשות שאסור לקאש
  if (
    url.startsWith("chrome-extension://") ||
    url.startsWith("moz-extension://") ||
    url.startsWith("safari-extension://") ||
    event.request.method !== "GET"
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return (
        cached ||
        fetch(event.request)
          .then(response => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            return response;
          })
          .catch(() => cached)
      );
    })
  );
});
