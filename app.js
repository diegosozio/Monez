const monthNames = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

let currentDate = new Date();

function getOccurrenceInMonth(date) {
  const targetDay = date.getDay();

  let count = 0;

  for (let d = 1; d <= date.getDate(); d++) {
    const current = new Date(date.getFullYear(), date.getMonth(), d);

    if (current.getDay() === targetDay) {
      count++;
    }
  }

  return count;
}

function getWaste(date) {
  const occurrence = getOccurrenceInMonth(date);
  const day = date.getDay();

  if (day === 2) {
    return ["indifferenziata"];
  }

  // LUNEDÌ
  if (day === 1) {
    const waste = ["umido"];

    // 2° e 4° lunedì
    if (occurrence === 2 || occurrence === 4) {
      waste.push("carta");
    }

    return waste;
  }

  // GIOVEDÌ
  if (day === 4) {
    // 2° e 4° giovedì
    if (occurrence === 2 || occurrence === 4) {
      return ["plastica"];
    }

    return [];
  }

  // VENERDÌ
  if (day === 5) {
    const waste = ["umido"];

    // 2° e 4° venerdì
    if (occurrence === 2 || occurrence === 4) {
      waste.push("vetro");
    }

    return waste;
  }

  return [];
}

/* =========================
   CALENDARIO
========================= */
function generateCalendar() {
  const container = document.getElementById("calendar");
  const title = document.getElementById("monthTitle");

  if (!container || !title) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  title.innerText = `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1);
  const startDay = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = "";

  for (let i = 0; i < startDay; i++) {
    html += `<div class="empty"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const waste = getWaste(date);

    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    html += `
      <div class="day ${isToday ? "today" : ""}">
        <div class="date">${d}</div>
        <div class="waste">${waste.length ? waste.join(" + ") : "-"}</div>
      </div>
    `;
  }

  container.innerHTML = html;
}

/* =========================
   PROSSIMO CONFERIMENTO
========================= */
function findNextWaste() {
  const today = new Date();

  for (let i = 1; i <= 31; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const waste = getWaste(d);

    if (waste.length > 0) {
      return { date: d, waste };
    }
  }

  return null;
}

function renderNext() {
  const container = document.getElementById("next");
  if (!container) return;

  const next = findNextWaste();

  if (!next) {
    container.innerHTML = "Nessun conferimento";
    return;
  }

  container.innerHTML = `
    ${next.date.toLocaleDateString("it-IT")}
    <br/>
    ♻️ ${next.waste.join(" + ")}
  `;
}

/* =========================
   NAVIGAZIONE MESI
========================= */
function bindNavigation() {
  const prev = document.getElementById("prev");
  const next = document.getElementById("nextMonth");
  const notifBtn = document.getElementById("enableNotifications");

  if (prev) {
    prev.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      generateCalendar();
    });
  }

  if (next) {
    next.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      generateCalendar();
    });
  }

  if (notifBtn) {
    notifBtn.addEventListener("click", enableNotifications);
  }
}

async function registerSW() {
  if (!("serviceWorker" in navigator)) return;

  const reg = await navigator.serviceWorker.register("/sw.js");

  console.log("SW registrato");

  // 🔥 FORZA CONTROLLO IMMEDIATO
  if (reg.waiting) {
    reg.waiting.postMessage({ type: "SKIP_WAITING" });
  }

  await navigator.serviceWorker.ready;

  console.log("SW ora controlla la pagina");
}

/* =========================
   NOTIFICHE
========================= */
async function enableNotifications() {
  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    alert("Notifiche attivate!");
  }
}

function sendNotification(title, body) {
  if (Notification.permission !== "granted") return;

  navigator.serviceWorker.ready.then((reg) => {
    reg.showNotification(title, {
      body,
      icon: "https://cdn-icons-png.flaticon.com/512/565/565492.png",
    });
  });
}

/* =========================
   DOMANI
========================= */
function getTomorrowWaste() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return { date: d, waste: getWaste(d) };
}

/* =========================
   NOTIFICA GIORNALIERA
========================= */
function scheduleDailyCheck() {
  const now = new Date();

  const target = new Date();
  target.setHours(20, 0, 0, 0);

  let diff = target - now;
  if (diff < 0) diff += 86400000;

  setTimeout(() => {
    triggerDaily();
    setInterval(triggerDaily, 86400000);
  }, diff);
}

function triggerDaily() {
  const t = getTomorrowWaste();

  if (t.waste.length > 0) {
    sendNotification("♻️ Rifiuti domani", t.waste.join(" + "));
  }
}

/* =========================
   INIT
========================= */

window.addEventListener("DOMContentLoaded", () => {
  generateCalendar();
  renderNext();
  bindNavigation();
  registerSW();
  scheduleDailyCheck();

  setTimeout(() => {
    const splash = document.getElementById("splash");

    if (splash) {
      splash.style.opacity = "0";
      splash.style.transition = "0.4s ease";

      setTimeout(() => splash.remove(), 400);
    }
  }, 2000);
});
