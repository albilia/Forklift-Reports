// טוען את menu.html לתוך כל דף
fetch("menu.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("menuContainer").innerHTML = html;

    const menuBtn = document.getElementById("menuBtn");
    const sideMenu = document.getElementById("sideMenu");

    // פתיחה/סגירה רק בלחיצה על ההמבורגר
    menuBtn.addEventListener("click", () => {
      menuBtn.classList.toggle("active");
      sideMenu.classList.toggle("open");
      navigator.vibrate?.(20);
    });

    // ⭐ טוען את מספר הגרסה אחרי שהתפריט נטען
    loadVersion();
  });

// ⭐ פונקציה שמביאה את מספר הגרסה מ-GitHub
async function loadVersion() {
  try {
    const res = await fetch(
      "https://raw.githubusercontent.com/albilia/Forklift-Reports/main/version.json?t=" + Date.now()
    );
    const data = await res.json();

    const versionLine = document.getElementById("versionLine");
    if (versionLine) {
      versionLine.textContent = "מס' גרסה: " + data.version;
    }
  } catch (e) {
    console.log("Version fetch failed");
  }
}

// פונקציות תפריט
function openAbout() {
  alert("אודות המערכת:\nפותח על ידי ניסים אלביליה.");
}

function openSteps() {
  alert("שלבים:\n1. הזן מספר טלפון\n2. היכנס למערכת\n3. דווח בקלות");
}

function openGithub() {
  window.open("https://github.com/albilia/Forklift-Reports/issues", "_blank");
}
