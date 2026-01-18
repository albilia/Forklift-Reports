// גרסת קאש — מתעדכן רק כשאתה משנה מספר
const CACHE_VERSION = "nis-v1";
const STATIC_CACHE = CACHE_VERSION + "-static";

// קבצים סטטיים שלא משתנים הרבה
const STATIC_ASSETS = [
  "/buttons.css",
  "/background.jpg",
  "/logo.png",
  "/manifest.json",
  "/qr.json",
  "/offline.html",
  "/icons/apple-touch-icon.png"
];

// התקנה — שמירת קבצים סטטיים
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
          .filter(key => key !== STATIC_CACHE)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// יירוט בקשות
self.addEventListener("fetch", event => {
  const url = event.request.url;

  // לא לגעת ב‑API של Apps Script
  if (url.includes("script.google.com/macros")) {
    return;
  }

  // HTML תמיד מהשרת — כדי לקבל עדכונים מיידיים
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match("/offline.html"))
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
            // שמירה בקאש רק לקבצים סטטיים
            if (res.status === 200 && res.type === "basic") {
              caches.open(STATIC_CACHE).then(cache =>
                cache.put(event.request, res.clone())
              );
            }
            return res;
          })
          .catch(() => caches.match("/offline.html"))
      );
    })
  );
});

// Background Sync — שליחת דיווחים כשאינטרנט חוזר
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
      console.log("אין אינטרנט — מנסה שוב מאוחר יותר");
      return;
    }
  }
  clearPendingReports();
}

// IndexedDB — שמירת דיווחים אופליין
function readPendingReports() {
  return new Promise(resolve => {
    const req = indexedDB.open("pallet-db", 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore("pending", { autoIncrement: true });
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