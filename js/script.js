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

// =====================
// Task List Functinos
// =====================
const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");


//Function to add a new task to the list
function addTask() {
    if(!inputBox || !listContainer) return;

    const value = inputBox.value.trim();
    if (value === '') {
        alert("You must write something!");
        return
    }

    //Prevent duplicate tasks
    const isDuplicate = [...listContainer.querySelectorAll("li")].some(li => li.firstChild?.nodeValue === value);
    if (isDuplicate) {
        alert("That task already exists.");
        return;
    }

    const li = document.createElement("li");
    li.textContent = value;

    const span = document.createElement("span");
    span.textContent = "\u00d7";
    li.appendChild(span);

    listContainer.appendChild(li);

    inputBox.value = "";
    saveData();
}

inputBox?.addEventListener("keydown", e => {
    if (e.key === "Enter") addTask();
});

//Event Listener to handle task completion toggle and deletion 
if (listContainer){
    listContainer.addEventListener("click", (e) => {
        if(e.target.tagName === "LI"){
            e.target.classList.toggle("checked");
            saveData();
        }
        else if(e.target.tagName === "SPAN"){
            e.target.parentElement.remove();
            saveData();
        }
    }, false);
}


function saveData(){
    if (!listContainer) return;
    localStorage.setItem("data", listContainer.innerHTML);
}

function showTask(){
    if (!listContainer) return;
    listContainer.innerHTML = localStorage.getItem("data")
}
showTask();