const STORAGE_KEY = "simple-clock-stopwatch-state";

const elapsedTime = document.querySelector("#elapsed-time");
const toggleButton = document.querySelector("#toggle-button");
const resetButton = document.querySelector("#reset-button");

let elapsedBeforeStart = 0;
let startedAt = 0;
let isRunning = false;
let frameId = 0;

function now() {
  return performance.now();
}

function totalElapsed() {
  return isRunning ? elapsedBeforeStart + now() - startedAt : elapsedBeforeStart;
}

function formatDuration(milliseconds) {
  const totalCentiseconds = Math.floor(milliseconds / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function saveState() {
  const state = {
    elapsedBeforeStart: totalElapsed(),
    isRunning,
    savedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const rawState = localStorage.getItem(STORAGE_KEY);
    if (!rawState) return;

    const state = JSON.parse(rawState);
    elapsedBeforeStart = Number(state.elapsedBeforeStart) || 0;

    if (state.isRunning) {
      elapsedBeforeStart += Math.max(0, Date.now() - Number(state.savedAt || Date.now()));
      startTimer(false);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function renderTime() {
  elapsedTime.textContent = formatDuration(totalElapsed());
}

function renderControls() {
  toggleButton.textContent = isRunning ? "정지" : "시작";
  toggleButton.classList.toggle("is-running", isRunning);
}

function render() {
  renderTime();
  renderControls();
}

function tick() {
  renderTime();
  frameId = requestAnimationFrame(tick);
}

function startTimer(shouldSave = true) {
  if (isRunning) return;
  isRunning = true;
  startedAt = now();
  cancelAnimationFrame(frameId);
  frameId = requestAnimationFrame(tick);
  renderControls();
  if (shouldSave) saveState();
}

function stopTimer() {
  if (!isRunning) return;
  elapsedBeforeStart = totalElapsed();
  isRunning = false;
  cancelAnimationFrame(frameId);
  render();
  saveState();
}

function resetTimer() {
  elapsedBeforeStart = 0;
  startedAt = now();
  isRunning = false;
  cancelAnimationFrame(frameId);
  render();
  saveState();
}

toggleButton.addEventListener("click", () => {
  if (isRunning) {
    stopTimer();
  } else {
    startTimer();
  }
});

resetButton.addEventListener("click", resetTimer);

document.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLButtonElement) return;
  if (event.code === "Space") {
    event.preventDefault();
    toggleButton.click();
  }
  if (event.key.toLowerCase() === "r") resetTimer();
});

window.addEventListener("beforeunload", saveState);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveState();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

loadState();
render();
