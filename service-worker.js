const CACHE_NAME = "pallet-app-v1";

const FILES_TO_CACHE = [
  "index.html",
  "login.html",
  "dashboard.html",
  "report.html",
  "history.html",
  "manifest.json",
  "logo.jpg",
  "background.jpg",
  "apple-touch-icon.png"
];

// התקנה — שמירת קבצים בזיכרון
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      try {
        await cache.addAll(FILES_TO_CACHE);
      } catch (err) {
        console.warn("⚠ חלק מהקבצים לא נטענו לקאש:", err);
      }
    })
  );
});

// הפעלה — ניקוי גרסאות ישנות
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// שליפה — טעינה מהירה מה‑cache
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return (
        response ||
        fetch(event.request).catch(() => {
          // fallback לקבצים בסיסיים
          if (event.request.mode === "navigate") {
            return caches.match("index.html");
          }
        })
      );
    })
  );
});
