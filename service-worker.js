const CACHE_VERSION = "v4";
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
  self.skipWaiting();
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
  self.clients.claim();
});

// אסטרטגיית fetch חכמה
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = request.url;

  // דילוג על בקשות שלא אמורות להיכנס לקאש
  if (
    url.startsWith("chrome-extension://") ||
    url.startsWith("moz-extension://") ||
    url.startsWith("safari-extension://") ||
    request.method !== "GET"
  ) {
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

      // אם יש קאש – מחזירים מיד, ומעדכנים ברקע
      if (cachedResponse) {
        return cachedResponse;
      }

      // אין קאש – מחכים לרשת, ואם אין – offline
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
