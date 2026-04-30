export function createClock(onTick, { elapsed = 0, startWall = null } = {}) {
  let _elapsed = elapsed;       // seconds accumulated before current run
  let _startWall = startWall;   // wall-clock ms when last resumed
  let timerId = null;

  function currentSec() {
    if (_startWall === null) return _elapsed;
    return _elapsed + Math.floor((Date.now() - _startWall) / 1000);
  }

  function tick() {
    onTick(currentSec());
  }

  function start() {
    if (timerId !== null) return;
    _startWall = Date.now();
    timerId = setInterval(tick, 1000);
    tick();
  }

  function pause() {
    if (timerId === null) return;
    _elapsed = currentSec();
    clearInterval(timerId);
    timerId = null;
    _startWall = null;
  }

  function isRunning() { return timerId !== null; }

  function getSec() { return currentSec(); }

  function getElapsed() { return _elapsed; }

  function getStartWall() { return _startWall; }

  function destroy() { clearInterval(timerId); timerId = null; }

  // If we were constructed mid-run, set up the interval immediately so the
  // clock ticks just like after a start() call — without resetting startWall.
  if (_startWall !== null) {
    timerId = setInterval(tick, 1000);
  }

  return { start, pause, isRunning, getSec, getElapsed, getStartWall, destroy };
}

export function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
