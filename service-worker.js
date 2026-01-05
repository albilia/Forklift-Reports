const CACHE_VERSION = "v5";   // ← עדכון גרסה חובה
const CACHE_NAME = `forklift-cache-${CACHE_VERSION}`;

const CORE_ASSETS = [
  "./",
  "index.html",
  "dashboard.html",
  "report.html",
  "menu.js",
  "menu.css",
  "manifest.json",
  "gilro-logo-v2.png",
  "logo.jpg",
  "camera-icon.png",
  "offline.html"
];

// התקנה – קאש ראשוני
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting(); // ← מכריח התקנה מיידית
});

// הפעלה – ניקוי קאש ישן
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith("forklift-cache-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim(); // ← מכריח שימוש ב־SW החדש
});

// אסטרטגיית fetch חכמה
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = request.url;

  // ❗❗❗ תיקון קריטי:
  // לא נוגעים בבקשות POST — נותנים להן לעבור לרשת
  if (request.method !== "GET") {
    return;
  }

  // קבצי ליבה – Network falling back to Cache
  if (isCoreAsset(request)) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (!response || response.status === 206) {
            return caches.match(request);
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then(res => res || caches.match("offline.html")))
    );
    return;
  }

  // שאר הבקשות – Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      const fetchPromise = fetch(request)
        .then(response => {
          if (!response || response.status === 206) {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => null);

      if (cachedResponse) {
        return cachedResponse;
      }

      return fetchPromise.then(res => res || caches.match("offline.html"));
    })
  );
});

// זיהוי אם הבקשה היא לקובץ ליבה
function isCoreAsset(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\//, "");
  return CORE_ASSETS.includes(path) || CORE_ASSETS.includes("./" + path) || CORE_ASSETS.includes(url.pathname);
}
