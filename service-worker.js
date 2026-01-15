// גרסה של הקאש — אם תיתקע גרסה ישנה, פשוט תעלה מספר
const CACHE_NAME = "pallet-app-v3";

// קבצים לשמירה בקאש
const ASSETS = [
  "/",
  "/index.html",
  "/login.html",
  "/dashboard.html",
  "/report.html",
  "/history.html",
  "/admin.html",
  "/buttons.css",
  "/background.jpg",
  "/logo.png",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/qr.json"
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

// יירוט בקשות
self.addEventListener("fetch", event => {
  const url = event.request.url;

  // ❗ חשוב: לא לגעת בבקשות ל־Apps Script
  // אחרת זה יגרום ל־CORS / שגיאות API
  if (url.includes("script.google.com/macros")) {
    return; // נותן לדפדפן לבצע את הבקשה ישירות
  }

  // Cache-first עבור קבצי האתר
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
