/**
 * Given open stints and the current clock time, return the bench player
 * with the fewest total field/bench minutes across all closed stints in the match.
 * Goalie is excluded. Returns null on tie or no eligible bench player.
 *
 * @param {import('./types.js').Stint[]} stints - all stints for this match (open + closed)
 * @param {number} currentClockSec
 * @returns {string|null} playerId of suggested sub, or null
 */
export function subSuggester(stints, currentClockSec) {
  // who is currently on bench?
  const benchStints = stints.filter(s => s.role === 'BENCH' && s.endSec === null);
  if (benchStints.length === 0) return null;

  // tally minutes played (field + bench) per player, excluding goalie time
  const minutes = {};
  for (const s of stints) {
    if (s.role === 'GOALIE') continue;
    const end = s.endSec ?? currentClockSec;
    const dur = Math.max(0, end - s.startSec);
    minutes[s.playerId] = (minutes[s.playerId] ?? 0) + dur;
  }

  let minSec = Infinity;
  let candidate = null;
  let tie = false;

  for (const s of benchStints) {
    const t = minutes[s.playerId] ?? 0;
    if (t < minSec) {
      minSec = t;
      candidate = s.playerId;
      tie = false;
    } else if (t === minSec) {
      tie = true;
    }
  }

  return tie ? null : candidate;
}
