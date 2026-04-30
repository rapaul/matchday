/**
 * Returns the set of player IDs who were goalie during half 1 and half 2,
 * given the stints for a single match and that match's halfLengthSec.
 *
 * Half 1 is clock seconds [0, halfLengthSec); half 2 is [halfLengthSec, ∞).
 * A goalie stint counts towards a half if it overlaps that half's range at all.
 *
 * @param {import('./types.js').Stint[]} stints  - stints for a single match
 * @param {number} halfLengthSec
 * @returns {{ half1: string[], half2: string[] }}
 */
export function keepersPerHalf(stints, halfLengthSec) {
  const half1 = new Set();
  const half2 = new Set();
  for (const s of stints) {
    if (s.role !== 'GOALIE') continue;
    const start = s.startSec;
    const end = s.endSec ?? Infinity;
    if (start < halfLengthSec) half1.add(s.playerId);
    if (end > halfLengthSec) half2.add(s.playerId);
  }
  return { half1: [...half1], half2: [...half2] };
}

/**
 * Aggregate per-player stats across finished matches.
 *
 * @param {import('./types.js').Player[]} players
 * @param {import('./types.js').Match[]} matches
 * @param {import('./types.js').Stint[]} stints
 * @returns {{id: string, name: string, potd: number, keeperHalves: number}[]}
 */
export function computePlayerStats(players, matches, stints) {
  const out = new Map(players.map(p => [p.id, { id: p.id, name: p.name, potd: 0, keeperHalves: 0 }]));
  const finished = matches.filter(m => m.status === 'FINISHED');

  const stintsByMatch = new Map();
  for (const s of stints) {
    if (!stintsByMatch.has(s.matchId)) stintsByMatch.set(s.matchId, []);
    stintsByMatch.get(s.matchId).push(s);
  }

  for (const m of finished) {
    if (m.potdPlayerId && out.has(m.potdPlayerId)) {
      out.get(m.potdPlayerId).potd += 1;
    }
    const ms = stintsByMatch.get(m.id) ?? [];
    const { half1, half2 } = keepersPerHalf(ms, m.halfLengthSec);
    for (const pid of half1) if (out.has(pid)) out.get(pid).keeperHalves += 1;
    for (const pid of half2) if (out.has(pid)) out.get(pid).keeperHalves += 1;
  }

  return [...out.values()];
}
