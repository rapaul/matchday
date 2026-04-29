import { test } from 'node:test';
import assert from 'node:assert/strict';
import { subSuggester } from './sub-suggester.js';

function stint(overrides) {
  return { id: 's0', matchId: 'm1', playerId: 'p1', role: 'FIELD', startSec: 0, endSec: null, ...overrides };
}

test('returns bench player with fewest minutes', () => {
  const stints = [
    // p1: 300s on field (closed)
    stint({ id: 's1', playerId: 'p1', role: 'FIELD', startSec: 0, endSec: 300 }),
    // p2: 0s (never played, now on bench)
    stint({ id: 's2', playerId: 'p2', role: 'BENCH', startSec: 300, endSec: null }),
    // p1 now on bench
    stint({ id: 's3', playerId: 'p1', role: 'BENCH', startSec: 300, endSec: null }),
  ];
  assert.equal(subSuggester(stints, 600), 'p2');
});

test('returns null when bench players are tied', () => {
  const stints = [
    stint({ id: 's1', playerId: 'p1', role: 'BENCH', startSec: 0, endSec: null }),
    stint({ id: 's2', playerId: 'p2', role: 'BENCH', startSec: 0, endSec: null }),
  ];
  // both have 0 prior field time → tie
  assert.equal(subSuggester(stints, 100), null);
});

test('excludes goalie from minute totals', () => {
  const stints = [
    // p1 was goalie for 600s then on bench
    stint({ id: 's1', playerId: 'p1', role: 'GOALIE', startSec: 0, endSec: 600 }),
    stint({ id: 's2', playerId: 'p1', role: 'BENCH', startSec: 600, endSec: null }),
    // p2 played field 200s then on bench
    stint({ id: 's3', playerId: 'p2', role: 'FIELD', startSec: 0, endSec: 200 }),
    stint({ id: 's4', playerId: 'p2', role: 'BENCH', startSec: 200, endSec: null }),
  ];
  // p1 goalie time excluded → p1 has 0 field mins, p2 has 200 → suggest p1
  assert.equal(subSuggester(stints, 700), 'p1');
});

test('returns null when no bench players', () => {
  const stints = [
    stint({ id: 's1', playerId: 'p1', role: 'FIELD', startSec: 0, endSec: null }),
  ];
  assert.equal(subSuggester(stints, 200), null);
});

test('uses currentClockSec for open stints', () => {
  const stints = [
    // p1 on bench since 0, now at 500 → 500s bench time counted
    stint({ id: 's1', playerId: 'p1', role: 'BENCH', startSec: 0, endSec: null }),
    // p2 played field 0-400 (closed), then on bench since 400
    stint({ id: 's2', playerId: 'p2', role: 'FIELD', startSec: 0, endSec: 400 }),
    stint({ id: 's3', playerId: 'p2', role: 'BENCH', startSec: 400, endSec: null }),
  ];
  // p1 bench counted as field? No — bench IS counted in non-goalie minutes.
  // p1: 500 bench sec; p2: 400 field + 100 bench = 500 → tie → null
  assert.equal(subSuggester(stints, 500), null);
});
