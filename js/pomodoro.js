const start = document.getElementById("start");
const stop = document.getElementById("stop");
const reset = document.getElementById("reset");
const timer = document.getElementById("timer");
const rest = document.getElementById("rest");

let isRestMode = false;
let interval;
let timeLeft = 1500; /* base on second, so if 25min = 1500s */

// Update the timer display
function updateTimer(){
    let minutes = Math.floor(timeLeft/60);
    let seconds = timeLeft % 60;
    let formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    timer.innerHTML = formattedTime;
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
        if (timeLeft === 0) {
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

let title = document.querySelector(".title");
let switchButtom = document.getElementById("rest");

// The Rest Mode On Function
function restMode() {
    isRestMode = true;
    correctTime();

    title.innerText = "Take a breath";
    switchButtom.innerText = "Work";

    switchButtom.removeEventListener("click", restMode);
    switchButtom.addEventListener("click", studyMode);
}

// The Study Mode On Function
function studyMode() {
    isRestMode = false;
    correctTime();

    title.innerText = "Working";
    switchButtom.innerText = "Rest";

    switchButtom.removeEventListener("click", studyMode);
    switchButtom.addEventListener("click", restMode);
}

// Will active when the button is clicked
start.addEventListener("click", startTimer);
stop.addEventListener("click", stopTimer);
reset.addEventListener("click", resetTimer);
rest.addEventListener("click", restMode);