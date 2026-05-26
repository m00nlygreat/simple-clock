const STORAGE_KEY = "simple-clock-stopwatch-state";

const elapsedTime = document.querySelector("#elapsed-time");
const elapsedHours = document.querySelector("#elapsed-hours");
const toggleButton = document.querySelector("#toggle-button");
const resetButton = document.querySelector("#reset-button");
const lapButton = document.querySelector("#lap-button");
const clearLapsButton = document.querySelector("#clear-laps-button");
const lapList = document.querySelector("#lap-list");
const installStatus = document.querySelector("#install-status");

let elapsedBeforeStart = 0;
let startedAt = 0;
let isRunning = false;
let laps = [];
let frameId = 0;

function now() {
  return performance.now();
}

function totalElapsed() {
  return isRunning ? elapsedBeforeStart + now() - startedAt : elapsedBeforeStart;
}

function formatDuration(milliseconds, includeHours = false) {
  const totalCentiseconds = Math.floor(milliseconds / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  if (includeHours || hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function saveState() {
  const state = {
    elapsedBeforeStart: totalElapsed(),
    isRunning,
    savedAt: Date.now(),
    laps,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    const rawState = localStorage.getItem(STORAGE_KEY);
    if (!rawState) return;

    const state = JSON.parse(rawState);
    elapsedBeforeStart = Number(state.elapsedBeforeStart) || 0;
    laps = Array.isArray(state.laps) ? state.laps : [];

    if (state.isRunning) {
      elapsedBeforeStart += Math.max(0, Date.now() - Number(state.savedAt || Date.now()));
      startTimer(false);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function renderTime() {
  const elapsed = totalElapsed();
  elapsedTime.textContent = formatDuration(elapsed);
  elapsedHours.textContent = `${Math.floor(elapsed / 3600000)}시간 경과`;
}

function renderControls() {
  toggleButton.textContent = isRunning ? "정지" : "시작";
  toggleButton.classList.toggle("is-running", isRunning);
  lapButton.disabled = !isRunning;
  clearLapsButton.disabled = laps.length === 0;
}

function renderLaps() {
  lapList.textContent = "";

  if (laps.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "아직 기록된 랩이 없습니다.";
    lapList.append(empty);
    return;
  }

  laps.forEach((lap, index) => {
    const previousLap = laps[index + 1]?.elapsed ?? 0;
    const item = document.createElement("li");
    item.className = "lap-item";

    const number = document.createElement("span");
    number.className = "lap-index";
    number.textContent = `#${laps.length - index}`;

    const split = document.createElement("span");
    split.className = "lap-split";
    split.textContent = `+${formatDuration(lap.elapsed - previousLap, true)}`;

    const time = document.createElement("span");
    time.className = "lap-time";
    time.textContent = formatDuration(lap.elapsed, true);

    item.append(number, split, time);
    lapList.append(item);
  });
}

function render() {
  renderTime();
  renderControls();
  renderLaps();
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
  laps = [];
  cancelAnimationFrame(frameId);
  render();
  saveState();
}

function recordLap() {
  if (!isRunning) return;
  laps = [{ elapsed: totalElapsed(), recordedAt: Date.now() }, ...laps];
  renderLaps();
  renderControls();
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
lapButton.addEventListener("click", recordLap);
clearLapsButton.addEventListener("click", () => {
  laps = [];
  renderLaps();
  renderControls();
  saveState();
});

document.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLButtonElement) return;
  if (event.code === "Space") {
    event.preventDefault();
    toggleButton.click();
  }
  if (event.key.toLowerCase() === "l") recordLap();
  if (event.key.toLowerCase() === "r") resetTimer();
});

window.addEventListener("beforeunload", saveState);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveState();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("./sw.js");
      installStatus.textContent = "오프라인 가능";
    } catch {
      installStatus.textContent = "온라인 전용";
    }
  });
}

loadState();
render();
