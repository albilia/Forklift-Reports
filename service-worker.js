// גרסה דינמית — מתעדכן אוטומטית
const CACHE_VERSION = "pallet-app-" + self.registration.scope + Date.now();
const STATIC_CACHE = CACHE_VERSION + "-static";
const DYNAMIC_CACHE = CACHE_VERSION + "-dynamic";

// קבצים קבועים לשמירה
const STATIC_ASSETS = [
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
  "/qr.json",
  "/offline.html"
];

// התקנה — שמירת קבצים קבועים
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// הפעלה — ניקוי קאש ישן
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// יירוט בקשות
self.addEventListener("fetch", event => {
  const url = event.request.url;

  // ❗ לא לגעת בבקשות ל־Apps Script (API)
  if (url.includes("script.google.com/macros")) {
    return;
  }

  // דפי HTML — Network First
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          cacheDynamic(event.request, res.clone());
          return res;
        })
        .catch(() => caches.match(event.request).then(c => c || caches.match("/offline.html")))
    );
    return;
  }

  // קבצים סטטיים — Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      return (
        cached ||
        fetch(event.request)
          .then(res => {
            cacheDynamic(event.request, res.clone());
            return res;
          })
          .catch(() => caches.match("/offline.html"))
      );
    })
  );
});

// שמירה בקאש דינמי
function cacheDynamic(request, response) {
  if (!response || response.status !== 200 || response.type !== "basic") return;
  caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, response));
}

// ⭐ Background Sync — שליחת דיווחים כשאינטרנט חוזר
self.addEventListener("sync", event => {
  if (event.tag === "send-pending-reports") {
    event.waitUntil(sendPendingReports());
  }
});

// שליחת דיווחים שנשמרו אופליין
async function sendPendingReports() {
  const stored = await readPendingReports();
  for (const report of stored) {
    try {
      await fetch(report.url, {
        method: "POST",
        body: JSON.stringify(report.body)
      });
    } catch (e) {
      console.log("עדיין אין אינטרנט, מנסה שוב מאוחר יותר");
      return;
    }
  }
  clearPendingReports();
}

// שמירת דיווחים אופליין
function readPendingReports() {
  return new Promise(resolve => {
    const req = indexedDB.open("pallet-db", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("pending", { autoIncrement: true });
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("pending", "readonly");
      const store = tx.objectStore("pending");
      const getAll = store.getAll();
      getAll.onsuccess = () => resolve(getAll.result || []);
    };
  });
}

function clearPendingReports() {
  const req = indexedDB.open("pallet-db", 1);
  req.onsuccess = () => {
    const db = req.result;
    const tx = db.transaction("pending", "readwrite");
    tx.objectStore("pending").clear();
  };
}
