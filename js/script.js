// ===================
// Sidebar Functions
// ===================

const toggleButton = document.getElementById('toggle-btn');
const sidebar = document.getElementById('sidebar');

function toggleSidebar() {
    if (sidebar) sidebar.classList.toggle('close');
    if (toggleButton) toggleButton.classList.toggle('rotate');
}

if (toggleButton) {
    toggleButton.addEventListener("click", toggleSidebar)
}

// ===========================
// Pomodoro Timer Functions
// ===========================
const start = document.getElementById("start");
const stop = document.getElementById("stop");
const reset = document.getElementById("reset");
const timer = document.getElementById("timer");
const rest = document.getElementById("rest");

let isRestMode = false;
let interval;
let timeLeft = 1500; /* base on second, so 25min = 1500s */

// Update the timer display
function updateTimer(){
    if (!timer) return;
    const minutes = Math.floor(timeLeft/60);
    const seconds = timeLeft % 60;
    timer.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

//Set time based on mode
function correctTime() {
    timeLeft = isRestMode? 300 : 1500;
    updateTimer();
}

// The Start Timer Function
function startTimer(){
    if (interval) return; //prevent multiple intervals
    interval = setInterval(()=>{
        timeLeft--;
        updateTimer();
        if (timeLeft <= 0) {
            clearInterval(interval);
            interval = null; //clear the interval reference
            alert("Time's up!");
            correctTime();
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

const title = document.querySelector(".title");
const switchButton = document.getElementById("rest");

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

// Will active when the button is clicked
if (start) start.addEventListener("click", startTimer);
if (stop) stop.addEventListener("click", stopTimer);
if (reset) reset.addEventListener("click", resetTimer);
if (rest) rest.addEventListener("click", restMode);

// =======================================================================
// Task List Functinos
// =======================================================================

const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
const dueInput = document.getElementById("due-date");
const priorityToggle = document.getElementById("priority-toggle")
const priorityOptions = document.getElementById("priority-options")

function getSelectedPriority(){
  const checked = document.querySelector('input[name="priority"]:checked');
  return checked ? checked.value : "";
}

function createPriorityBadge(priority){
  if (!priority) return null;
  const span = document.createElement("span");
  span.className = `badge badge-${priority}`;
  span.textContent = priority;
  return span;
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

  // priority badge
  if (priority) {
    li.setAttribute("data-priority", priority);
    const badge = createPriorityBadge(priority);
    if (badge) li.appendChild(badge);
  }

  // due label as <time>
  if (due) {
    li.setAttribute("data-due", due);
    const dueTag = document.createElement("time");
    dueTag.className = "due";
    dueTag.dateTime = due;
    const dueDate = new Date(due + "T00:00:00").toLocaleDateString();
    dueTag.textContent = ` (due ${dueDate})`;
    li.appendChild(dueTag);
  }

  // delete button
  const del = document.createElement("span");
  del.className = "delete";
  del.textContent = "\u00d7";
  li.appendChild(del);

  listContainer.appendChild(li);

  inputBox.value = "";
  if (dueInput) dueInput.value = "";
  // clear selected priority
  const checked = document.querySelector('input[name="priority"]:checked');
  if (checked) checked.checked = false;
  if (priorityOptions) priorityOptions.classList.add("hidden");

  sortTasksByDueDate();
  refreshDueStyles();
  saveData();
}

// Enter key adds
inputBox?.addEventListener("keydown", e => {
  if (e.key === "Enter") addTask();
});

// Update list click handler
if (listContainer){
  listContainer.addEventListener("click", (e) => {
    const target = e.target;
    if (target.tagName === "LI") {
      target.classList.toggle("checked");
      refreshDueStyles();
      saveData();
    } else if (target.classList.contains("delete")) {
      target.parentElement.remove();
      saveData();
    }
  }, false);
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

function sortTasksByDueDate() {
  if (!listContainer) return;
  const tasks = Array.from(listContainer.querySelectorAll("li"));

  tasks.sort((a, b) => {
    const dueA = a.getAttribute("data-due") || "";
    const dueB = b.getAttribute("data-due") || "";

    if (!dueA && dueB) return -1;
    if (dueA && !dueB) return 1;
    if (!dueA && !dueB) return 0;

    return new Date(dueA) - new Date(dueB);
  });

  listContainer.innerHTML = "";
  tasks.forEach(task => listContainer.appendChild(task));
}

function showTask(){
  if (!listContainer) return;
  listContainer.innerHTML = localStorage.getItem("data") || "";

  // rehydrate: add missing badges based on data-priority
  [...listContainer.querySelectorAll("li")].forEach(li => {
    const priority = li.getAttribute("data-priority");
    if (priority && !li.querySelector(".badge")) {
      const badge = createPriorityBadge(priority);
      if (badge) li.insertBefore(badge, li.querySelector(".due") || li.querySelector(".delete"));
    }
  });

  sortTasksByDueDate();
  refreshDueStyles();
}

function saveData(){
  if (!listContainer) return;
  localStorage.setItem("data", listContainer.innerHTML);
}

showTask();

// priorities UI
if (priorityToggle && priorityOptions) {
  priorityToggle.addEventListener("click", () => {
    priorityOptions.classList.toggle("hidden");
  });

  priorityOptions.addEventListener("change", () => {
    // close when selecting a priority
    priorityOptions.classList.add("hidden");
  });
}

document.addEventListener("click", (e) => {
  if (!priorityOptions || !priorityToggle) return;
  if (!priorityOptions.contains(e.target) && !priorityToggle.contains(e.target)) {
    priorityOptions.classList.add("hidden");
  }
});

// ===========================
// Theme toggle + persistence
// ===========================
(function initThemeToggle(){
  const htmlRoot = document.documentElement; // <html>
  const stored = localStorage.getItem("theme") || "blue";
  htmlRoot.classList.remove("blue-theme", "pink-theme");
  htmlRoot.classList.add(`${stored}-theme`);

  // Any button with first sidebar "Mode"
  const modeButtons = Array.from(document.querySelectorAll("#sidebar .menu-btn"));
  const modeButton = modeButtons.find(btn => btn.querySelector("ion-icon[name='contrast-outline']"));
  if (!modeButton) return;

  modeButton.addEventListener("click", () => {
    const isBlue = htmlRoot.classList.contains("blue-theme");
    const next = isBlue ? "pink" : "blue";
    htmlRoot.classList.toggle("blue-theme", next === "blue");
    htmlRoot.classList.toggle("pink-theme", next === "pink");
    localStorage.setItem("theme", next);
  });
})();