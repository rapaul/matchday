/**
 * Returns the player IDs who were goalie at each half's kickoff: the keeper
 * is whoever's GOALIE stint is open at clock=0 (half 1) and at
 * clock=secondHalfStartSec (half 2).
 *
 * @param {import('./types.js').Stint[]} stints  - stints for a single match
 * @param {number|null|undefined} secondHalfStartSec  - clock seconds at which the second half kicked off; null/undefined if half-time hasn't happened yet
 * @returns {{ half1: string|null, half2: string|null }}
 */
export function keepersPerHalf(stints, secondHalfStartSec) {
  const goalieAt = sec => {
    for (const s of stints) {
      if (s.role !== 'GOALIE') continue;
      const end = s.endSec ?? Infinity;
      if (s.startSec <= sec && sec < end) return s.playerId;
    }
    return null;
  };
  return {
    half1: goalieAt(0),
    half2: secondHalfStartSec == null ? null : goalieAt(secondHalfStartSec),
  };
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
  const finished = matches.filter(m => m.status === 'FINISHED' && !m.archived);

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
    const { half1, half2 } = keepersPerHalf(ms, m.secondHalfStartSec);
    if (half1 && out.has(half1)) out.get(half1).keeperHalves += 1;
    if (half2 && out.has(half2)) out.get(half2).keeperHalves += 1;
  }

  return [...out.values()];
}
