// טוען את menu.html לתוך כל דף
fetch("menu.html")
  .then(res => res.text())
  .then(html => {
    document.getElementById("menuContainer").innerHTML = html;

    const menuBtn = document.getElementById("menuBtn");
    const sideMenu = document.getElementById("sideMenu");

    // פתיחה/סגירה של התפריט
    menuBtn.addEventListener("click", () => {
      menuBtn.classList.toggle("active");  // ← משנה צבע קווים
      sideMenu.classList.toggle("open");
      navigator.vibrate?.(20);
    });

    loadVersion();
  });

// מביא את מספר הגרסה מ-GitHub
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

// מודאל
function openModal(title, body) {
  document.getElementById("modalTitle").innerText = title;
  document.getElementById("modalBody").innerText = body;
  document.getElementById("infoModal").style.display = "block";
}

function closeModal() {
  document.getElementById("infoModal").style.display = "none";
}

function openAbout() {
  openModal(
    "אודות המערכת",
    "מערכת Nis רפורטר פותחה לתת מענה לסריקת תוויות ומדבקות במחסנים.\n" +
    "© כל הזכויות שמורות — Nis רפורטר"
  );
}

function openSteps() {
  openModal(
    "שלבי העבודה",
    "1. הזן מספר טלפון במסך הכניסה.\n" +
    "2. בחר מחסן.\n" +
    "3. לחץ על אייקון המצלמה לצילום.\n" +
    "4. לחץ 'פענח הכל'.\n" +
    "5. לחץ 'שמור דיווח'."
  );
}

function openGithub() {
  window.open("https://github.com/albilia/Forklift-Reports/issues", "_blank");
}
