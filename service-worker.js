// ⭐ שם קאש — שינוי שלו מנקה אוטומטית את כל הגרסאות הישנות
const CACHE_NAME = "forklift-cache-v2";

// ⭐ רשימת קבצים לשמירה בקאש (אפשר להוסיף/להוריד)
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

// ⭐ התקנה — מוחק קאש ישן ומטמיע קבצים חדשים
self.addEventListener("install", event => {
  event.waitUntil(
    caches.delete(CACHE_NAME).then(() =>
      caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    )
  );
  self.skipWaiting();
});

// ⭐ הפעלה — מוחק כל קאש ישן שלא תואם לגרסה הנוכחית
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

// ⭐ טעינה — קודם מהשרת, ואם אין אינטרנט → מהקאש
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // שומר גרסה חדשה בקאש
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
