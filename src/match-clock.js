export function createClock(onTick) {
  let elapsed = 0;    // seconds accumulated before current run
  let startWall = null; // wall-clock ms when last resumed
  let timerId = null;

  function currentSec() {
    if (startWall === null) return elapsed;
    return elapsed + Math.floor((Date.now() - startWall) / 1000);
  }

  function tick() {
    onTick(currentSec());
  }

  function start() {
    if (timerId !== null) return;
    startWall = Date.now();
    timerId = setInterval(tick, 1000);
    tick();
  }

  function pause() {
    if (timerId === null) return;
    elapsed = currentSec();
    clearInterval(timerId);
    timerId = null;
    startWall = null;
  }

  function isRunning() { return timerId !== null; }

  function getSec() { return currentSec(); }

  function destroy() { clearInterval(timerId); timerId = null; }

  return { start, pause, isRunning, getSec, destroy };
}

export function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
