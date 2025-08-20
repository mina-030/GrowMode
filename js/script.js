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
const PRIORITY_WEIGHT = { urgent: 4, high: 3, medium: 2, low: 1}

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