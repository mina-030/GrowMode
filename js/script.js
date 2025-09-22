// ======================================================================================================================
// Sidebar Functions
// ======================================================================================================================

const toggleButton = document.getElementById('toggle-btn');
const sidebar = document.getElementById('sidebar');

function toggleSidebar() {
    if (sidebar) sidebar.classList.toggle('close');
    if (toggleButton) toggleButton.classList.toggle('rotate');
}

if (toggleButton) {
    toggleButton.addEventListener("click", toggleSidebar)
}

// ======================================================================================================================
// Pomodoro Timer Functions
// ======================================================================================================================
const start = document.getElementById("start");
const stop = document.getElementById("stop");
const reset = document.getElementById("reset");
const timer = document.getElementById("timer");
const switchButton = document.getElementById("rest");
const title = document.querySelector(".title");
const alarmSound = new Audio('alarm.m4a');

// Durations (seconds)
const WORK_SECONDS = 1; // 25 mins
const REST_SECONDS = 1; // 5 mins

let isRestMode = false;
let interval;
let timeLeft = WORK_SECONDS; 

// Update the timer display
function updateTimer(){
    if (!timer) return;
    const minutes = Math.floor(timeLeft/60);
    const seconds = timeLeft % 60;
    timer.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

//Set time based on mode
function correctTime() {
    timeLeft = isRestMode? REST_SECONDS : WORK_SECONDS;
    updateTimer();
}

// The Start Timer Function
function startTimer(){
    if (interval) return; //prevent multiple intervals
    interval = setInterval(()=>{
        timeLeft--;
        updateTimer();
        if (timeLeft < 0) {
            clearInterval(interval);
            interval = null; //clear the interval reference
            ensureCurrentWeek(); // auto input minutes to the report
            if (isRestMode) incNum(REST_KEY, REST_MIN);
            else            incNum(TIME_KEY, WORK_MIN);
            alarmSound.play();
            alert("Time's up!");
            switchMode();
            return;
        }
    }, 1000);
}

// The Stop Timer Function
function stopTimer(){
    clearInterval(interval);
    interval = null;
}

// The Reset Timer Function
function resetTimer(){
    clearInterval(interval);
    interval = null;
    correctTime();
}

// The Rest Mode On Function
function restMode() {
    isRestMode = true;
    correctTime();

    if (title) title.innerText = "Take a breath";
    if (switchButton) switchButton.innerText = "Work";

    switchButton?.removeEventListener("click", restMode);
    switchButton?.addEventListener("click", studyMode);
}

// The Study Mode On Function
function studyMode() {
    isRestMode = false;
    correctTime();

    if (title) title.innerText = "Working";
    if (switchButton) switchButton.innerText = "Rest";

    switchButton?.removeEventListener("click", studyMode);
    switchButton?.addEventListener("click", restMode);
}

// Switch Mode Function
function switchMode() {
  return isRestMode? studyMode() : restMode();
}

// Will active when the button is clicked
if (start) start.addEventListener("click", startTimer);
if (stop) stop.addEventListener("click", stopTimer);
if (reset) reset.addEventListener("click", resetTimer);
if (switchButton) {
  isRestMode = false;
  correctTime();
  switchButton.addEventListener("click", restMode);
}

// ======================================================================================================================
// Task List Functinos
// ======================================================================================================================

const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
const dueInput = document.getElementById("due-date");
const PRIORITY_WEIGHT = { urgent: 4, high: 3, medium: 2, low: 1};

function priorityToStars(p) {
  switch (p) {
    case "urgent": return "⭐⭐⭐⭐";
    case "high": return "⭐⭐⭐";
    case "medium": return "⭐⭐";
    case "low": return "⭐";
    default: return "";
  }
}

function getSelectedPriority() {
  return document.querySelector('input[name="priority"]:checked')?.value || "";
}

function addTask() {
  if (!inputBox || !listContainer) return;

  const text = inputBox.value.trim();
  const due = dueInput?.value || ""; // YYYY-MM-DD
  const priority = getSelectedPriority();

  if (text === "") {
    alert("You must write something!");
    return;
  }

  // Prevent duplicates by (text + due)
  const isDuplicate = [...listContainer.querySelectorAll("li")].some(li => {
    const liText = li.firstChild?.nodeValue?.trim() || "";
    const liDue = li.getAttribute("data-due") || "";
    return liText === text && liDue === due;
  });
  if (isDuplicate) {
    alert("That task with the same due date already exists.");
    return;
  }

  const li = document.createElement("li");
  li.appendChild(document.createTextNode(text));

  // store due date
  if (due) {
    li.setAttribute("data-due", due);
    const dueTag = document.createElement("time");
    dueTag.className = "due";
    dueTag.dateTime = due; // semantic HTML
    const dueDate = new Date(due + "T00:00:00").toLocaleDateString();
    dueTag.textContent = ` (due ${dueDate})`;
    li.appendChild(dueTag);
  }

  // store priority 
  if (priority) {
    li.setAttribute("data-priority", priority);
    const stars = document.createElement("span");
    stars.className = "priority-stars";
    stars.textContent = priorityToStars(priority);
    li.appendChild(stars);
  }

  // delete button
  const del = document.createElement("span");
  del.className = "delete";
  del.textContent = "\u00d7";
  li.appendChild(del);

  listContainer.appendChild(li);

  // clear inputs
  inputBox.value = "";
  if (dueInput) dueInput.value = "";
  const checked = document.querySelector('input[name="priority"]:checked');
  if (checked) checked.checked = false;

  sortTasksByDueDate();
  sortTasksByPriority();
  refreshDueStyles();
  saveData();
}

// Enter key adds
inputBox?.addEventListener("keydown", e => {
  if (e.key === "Enter") addTask();
});

// Update the click handler so only the delete button removes the item
if (listContainer){
  listContainer.addEventListener("click", (e) => {
    if (e.target.tagName === "LI") {
      e.target.classList.toggle("checked");
      refreshDueStyles();
      saveData();
    } else if (e.target.classList.contains("delete")) {
      e.target.parentElement.remove();
      saveData();
    }
  }, false);
}

function sortTasksByDueDate() {
  if (!listContainer) return;

  // Convert NodeList to array for sorting 
  const tasks = Array.from(listContainer.querySelectorAll("li"));

  tasks.sort((a, b) => {
    const dueA = a.getAttribute("data-due") || "";
    const dueB = b.getAttribute("data-due") || "";

    // No due date goes on bottom
    if (!dueA && dueB) return 1;
    if (dueA && !dueB) return -1;

    // If both have no due date, keep original order
    if (!dueA && !dueB) return 0;

    // Compare by date (earliest first)
    return new Date(dueA) - new Date(dueB);
  });

  // Clear list and append sorted tasks
  listContainer.innerHTML = "";
  tasks.forEach(task => listContainer.appendChild(task));
}

function sortTasksByPriority() {
  if (!listContainer) return;

  // Convert NodeList to array for sorting
  const all = Array.from(listContainer.querySelectorAll("li"));

  // Group by date string
  const groups = new Map();
  for (const li of all) {
    const key = li.getAttribute("data-due") || "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(li);
  }

  const result = [];
  for (const [, arr] of groups) {
    arr.sort((a, b) => {
      const pa = (a.getAttribute("data-priority") || "").toLowerCase();
      const pb = (b.getAttribute("data-priority") || "").toLowerCase();
      const wa = PRIORITY_WEIGHT[pa] || 0;
      const wb = PRIORITY_WEIGHT[pb] || 0;
      return wb - wa;
    });

    result.push(...arr);
  }

  // Rebuild DOM in the new order
  listContainer.innerHTML = "";
  result.forEach(li => listContainer.appendChild(li));
}

function refreshDueStyles() {
  if (!listContainer) return;
  const today = new Date(); today.setHours(0,0,0,0);

  [...listContainer.querySelectorAll("li")].forEach(li => {
    const due = li.getAttribute("data-due");
    li.classList.remove("overdue");
    if (!due) return;
    const dueDate = new Date(due + "T00:00:00");
    if (dueDate < today && !li.classList.contains("checked")) {
      li.classList.add("overdue");
    }
  });
}

// Save Data Function
const USE_LOCAL_STORAGE = false;

function saveData() {
  if (!USE_LOCAL_STORAGE) return;
  localStorage.setItem("data", listContainer.innerHTML);
}

function showTask(){
  if (!USE_LOCAL_STORAGE) return;
  listContainer.innerHTML = localStorage.getItem("data") || "";
  sortTasksByDueDate();
  sortTasksByPriority();
  refreshDueStyles();
}
showTask();

// priorities options
const priorityToggle = document.getElementById("priority-toggle")
const priorityOptions = document.getElementById("priority-options")

priorityToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  priorityOptions.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (!priorityOptions) return;
  if (!priorityOptions.contains(e.target) && !priorityToggle.contains(e.target)) {
    priorityOptions.classList.add("hidden");
  }
});

// ======================================================================================================================
// Update Input Box For Weekly Report
// ======================================================================================================================

const NAME_KEY = "profileName";
const TIME_KEY = "weekly_total_study_time";
const REST_KEY = "weekly_total_rest";
const TASK_KEY = "weekly_total_task";
const STAR_KEY = "weekly_total_star";
const WEEK_KEY = "weekly_week_id";

// study/ rest time lengths
const WORK_MIN = 25;
const REST_MIN = 5;

// Inputs (Weekly Report Section)
const nameInput = document.getElementById("r-name");
const timeInput = document.getElementById("r-time");
const restInput = document.getElementById("r-rest");
const taskInput = document.getElementById("r-task");
const starInput = document.getElementById("r-star");

// Report display + Button
const genBtn = document.getElementById("generate-report");
const summary = document.getElementById("report-summary");
const quote = document.getElementById("report-quote");
const BACKEND_URL = "http://127.0.0.1:8000/report";

// ------------------------------
// Week rollover

function getWeekId(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0 ,1));
  const weekNo = Math.ceil((((t - yearStart) / 86400000) + 1) / 7);
  return `${t.getUTCFullYear()}-${String(weekNo).padStart(2, "0")}`;
}

function ensureCurrentWeek() {
  const cur = getWeekId();
  const saved = localStorage.getItem(WEEK_KEY);
  if (cur !== saved) {
    localStorage.setItem(WEEK_KEY, cur);
    localStorage.setItem(TIME_KEY, "0");
    localStorage.setItem(REST_KEY, "0");
    localStorage.setItem(TASK_KEY, "0");
    localStorage.setItem(STAR_KEY, "0");
  }
}
ensureCurrentWeek();

// -------------------------------
// Small Storage Helper
function getNum(key, def = 0) {
  const v = parseInt(localStorage.getItem(key) || `${def}`, 10);
  return Number.isFinite(v) ? v : def;
}

function setNum(key, val) {
  localStorage.setItem(key, String(Math.max(0, val | 0)));
  reflectInputsFromStorage();
}

function incNum(key, delta) {
  setNum(key, getNum(key) + (delta | 0));
}

// -------------------------------
// Reflect storage -> inputs
function reflectInputsFromStorage() {
  const defaultName = (document.getElementById("name")?.textContent || "Guest").trim();

  if (nameInput) nameInput.value = localStorage.getItem(NAME_KEY) || defaultName;
  if (timeInput) timeInput.value = getNum(TIME_KEY);
  if (restInput) restInput.value = getNum(REST_KEY);
  if (taskInput) taskInput.value = getNum(TASK_KEY);
  if (starInput) starInput.value = getNum(STAR_KEY);
}

nameInput?.addEventListener("input", () => localStorage.setItem(NAME_KEY, nameInput.value.trim()));
timeInput?.addEventListener("input", () => setNum(TIME_KEY, parseInt(timeInput.value || "0", 10) || 0));
restInput?.addEventListener("input", () => setNum(REST_KEY, parseInt(restInput.value || "0", 10) || 0));
taskInput?.addEventListener("input", () => setNum(TASK_KEY, parseInt(taskInput.value || "0", 10) || 0));
starInput?.addEventListener("input", () => setNum(STAR_KEY, parseInt(starInput.value || "0", 10) || 0));

// -------------------------------------
// Auto-track: task and star
// For Star:
function readSelectedProiority() {
  const chosen = priorityOptions?.querySelector('input[name="priority"]:checked');
  return chosen?.value || null;
}

const _addTask = typeof addTask === "function" ? addTask : null;
if (_addTask) {
  addTask = function() {
    const before = document.querySelectorAll("#list-container li").length;
    _addTask();

    const list = document.getElementById("list-container");
    const li = list?.lastElementChild;
    if (li && li.tagName === "LI") {
      const level = readSelectedProiority();
      if (level) {
        li.dataset.priority = level;

        // badge rendering
        const badge = document.createElement("span");
        badge.className = `badge stars-${level}`;
        badge.textContent = level.toUpperCase();
        li.appendChild(badge);
      }
    }

    priorityOptions?.querySelectorAll('input[name="priority"]').forEach(inp => (inp.checked = false));

    setTimeout(recomputeTaskAndStars, 0);
  }
}

// When toggling or deleting tasks, recompute totals
function recomputeTaskAndStars() {
  const list = document.getElementById("list-container");
  if (!list) return;

  const checked = Array.from(list.querySelectorAll("li.checked"));
  const completedCount = checked.length;

  const totalStars = checked.reduce((sum, li) => {
    const level = li.dataset.priority || "";
    const w = PRIORITY_WEIGHT[level] || 0;
    return sum + w;
  }, 0);

  setNum(TASK_KEY, completedCount);
  setNum(STAR_KEY, totalStars);
}

// Hook the existing click handler area to update after toggles/deletes
const listContainerEl = document.getElementById("list-container");
if (listContainerEl) {
  listContainerEl.addEventListener("click", () => {
    setTimeout(recomputeTaskAndStars, 0);
  });
}
// Also on load (for restored tasks)
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(recomputeTaskAndStars, 0);
});

// ==============================================================================================================================
// Generate & show the report
// ==============================================================================================================================
async function generateWeeklyReport() {
  ensureCurrentWeek();

  const payload = {
    name: (nameInput?.value || "Guest").trim(),
    total_time: parseInt(timeInput?.value || "0", 10) || 0,
    total_rest: parseInt(restInput?.value || "0", 10) || 0,
    total_task: parseInt(taskInput?.value || "0", 10) || 0,
    total_star: parseInt(starInput?.value || "0", 10) || 0,
  };

  const prev = genBtn.textContent;
  genBtn.disabled = true;
  genBtn.textContent = "Generating...";
  if (summary) summary.textContent = "";
  if (quote) quote.textContent = "";

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify(payload),
    });
    if(!res.ok) {
      const t = await res.text();
      throw new Error(`HTTP ${res.status}: ${t}`);
    }

    const data = await res.json();
    if (summary) summary.textContent = data.summary || "No summary returned"
    if (quote)   quote.textContent   = data.quote ? `“${data.quote}”` : "";
  } catch (err) {
    if (summary) summary.textContent = "Could not generate the report.";
    if (quote)   quote.textContent   = String(err);
  } finally {
    genBtn.disabled = false;
    genBtn.textContent = prev;
  }
}

genBtn?.addEventListener("click", generateWeeklyReport);