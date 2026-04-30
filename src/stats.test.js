import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keepersPerHalf, computePlayerStats } from './stats.js';

const HALF = 600; // 10 min half

test('keepersPerHalf — single goalie stint spanning both halves', () => {
  const stints = [{ id: 's1', matchId: 'm', playerId: 'p1', role: 'GOALIE', startSec: 0, endSec: 1200 }];
  const { half1, half2 } = keepersPerHalf(stints, HALF);
  assert.deepEqual(half1, ['p1']);
  assert.deepEqual(half2, ['p1']);
});

test('keepersPerHalf — goalie change at half time exactly', () => {
  const stints = [
    { id: 's1', matchId: 'm', playerId: 'p1', role: 'GOALIE', startSec: 0, endSec: 600 },
    { id: 's2', matchId: 'm', playerId: 'p2', role: 'GOALIE', startSec: 600, endSec: 1200 },
  ];
  const { half1, half2 } = keepersPerHalf(stints, HALF);
  assert.deepEqual(half1, ['p1']);
  assert.deepEqual(half2, ['p2']);
});

test('keepersPerHalf — goalie change mid-half-2 credits both keepers for half 2', () => {
  const stints = [
    { id: 's1', matchId: 'm', playerId: 'p1', role: 'GOALIE', startSec: 0, endSec: 900 },
    { id: 's2', matchId: 'm', playerId: 'p2', role: 'GOALIE', startSec: 900, endSec: 1200 },
  ];
  const { half1, half2 } = keepersPerHalf(stints, HALF);
  assert.deepEqual(half1, ['p1']);
  assert.deepEqual(half2.sort(), ['p1', 'p2']);
});

test('keepersPerHalf — non-goalie stints ignored', () => {
  const stints = [
    { id: 's1', matchId: 'm', playerId: 'p1', role: 'FIELD', startSec: 0, endSec: 1200 },
    { id: 's2', matchId: 'm', playerId: 'p2', role: 'BENCH', startSec: 0, endSec: 1200 },
  ];
  const { half1, half2 } = keepersPerHalf(stints, HALF);
  assert.deepEqual(half1, []);
  assert.deepEqual(half2, []);
});

test('computePlayerStats — POTD and keeper halves aggregated across finished matches only', () => {
  const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
  const matches = [
    { id: 'm1', status: 'FINISHED', halfLengthSec: HALF, potdPlayerId: 'p1' },
    { id: 'm2', status: 'FINISHED', halfLengthSec: HALF, potdPlayerId: 'p2' },
    { id: 'm3', status: 'LIVE',     halfLengthSec: HALF, potdPlayerId: 'p1' }, // ignored
  ];
  const stints = [
    // m1: Alice keeper both halves
    { id: 's1', matchId: 'm1', playerId: 'p1', role: 'GOALIE', startSec: 0, endSec: 1200 },
    // m2: Alice keeper H1, Bob keeper H2
    { id: 's2', matchId: 'm2', playerId: 'p1', role: 'GOALIE', startSec: 0, endSec: 600 },
    { id: 's3', matchId: 'm2', playerId: 'p2', role: 'GOALIE', startSec: 600, endSec: 1200 },
    // m3 (LIVE): should not contribute
    { id: 's4', matchId: 'm3', playerId: 'p2', role: 'GOALIE', startSec: 0, endSec: null },
  ];
  const stats = computePlayerStats(players, matches, stints);
  const alice = stats.find(s => s.id === 'p1');
  const bob = stats.find(s => s.id === 'p2');
  assert.equal(alice.potd, 1);
  assert.equal(alice.keeperHalves, 3); // m1: 2, m2: 1
  assert.equal(bob.potd, 1);
  assert.equal(bob.keeperHalves, 1);   // m2: 1
});
