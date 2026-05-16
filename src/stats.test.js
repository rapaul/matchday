import { test } from 'node:test';
import assert from 'node:assert/strict';
import { keepersPerHalf, effectiveKeepersPerHalf, computePlayerStats } from './stats.js';

const HALF_START = 600; // second half started at clock=600

test('keepersPerHalf — single goalie stint spanning both halves', () => {
  const stints = [{ id: 's1', matchId: 'm', playerId: 'p1', role: 'GOALIE', startSec: 0, endSec: 1200 }];
  const { half1, half2 } = keepersPerHalf(stints, HALF_START);
  assert.equal(half1, 'p1');
  assert.equal(half2, 'p1');
});

test('keepersPerHalf — goalie change at second-half kickoff', () => {
  const stints = [
    { id: 's1', matchId: 'm', playerId: 'p1', role: 'GOALIE', startSec: 0, endSec: 600 },
    { id: 's2', matchId: 'm', playerId: 'p2', role: 'GOALIE', startSec: 600, endSec: 1200 },
  ];
  const { half1, half2 } = keepersPerHalf(stints, HALF_START);
  assert.equal(half1, 'p1');
  assert.equal(half2, 'p2');
});

test('keepersPerHalf — mid-half-2 swap does not change the half-2 keeper', () => {
  const stints = [
    { id: 's1', matchId: 'm', playerId: 'p1', role: 'GOALIE', startSec: 0, endSec: 900 },
    { id: 's2', matchId: 'm', playerId: 'p2', role: 'GOALIE', startSec: 900, endSec: 1200 },
  ];
  const { half1, half2 } = keepersPerHalf(stints, HALF_START);
  assert.equal(half1, 'p1');
  assert.equal(half2, 'p1');
});

test('keepersPerHalf — non-goalie stints ignored', () => {
  const stints = [
    { id: 's1', matchId: 'm', playerId: 'p1', role: 'FIELD', startSec: 0, endSec: 1200 },
    { id: 's2', matchId: 'm', playerId: 'p2', role: 'BENCH', startSec: 0, endSec: 1200 },
  ];
  const { half1, half2 } = keepersPerHalf(stints, HALF_START);
  assert.equal(half1, null);
  assert.equal(half2, null);
});

test('keepersPerHalf — no second half yet returns null half2', () => {
  const stints = [{ id: 's1', matchId: 'm', playerId: 'p1', role: 'GOALIE', startSec: 0, endSec: null }];
  const { half1, half2 } = keepersPerHalf(stints, null);
  assert.equal(half1, 'p1');
  assert.equal(half2, null);
});

test('effectiveKeepersPerHalf — falls back to stint-derived when no override', () => {
  const stints = [{ id: 's1', matchId: 'm', playerId: 'p1', role: 'GOALIE', startSec: 0, endSec: 1200 }];
  const match = { secondHalfStartSec: HALF_START };
  const { half1, half2 } = effectiveKeepersPerHalf(stints, match);
  assert.equal(half1, 'p1');
  assert.equal(half2, 'p1');
});

test('effectiveKeepersPerHalf — override wins over stint-derived', () => {
  const stints = [{ id: 's1', matchId: 'm', playerId: 'p1', role: 'GOALIE', startSec: 0, endSec: 1200 }];
  const match = { secondHalfStartSec: HALF_START, keeperHalf1Id: 'p9', keeperHalf2Id: 'p8' };
  const { half1, half2 } = effectiveKeepersPerHalf(stints, match);
  assert.equal(half1, 'p9');
  assert.equal(half2, 'p8');
});

test('effectiveKeepersPerHalf — per-half override independent', () => {
  const stints = [{ id: 's1', matchId: 'm', playerId: 'p1', role: 'GOALIE', startSec: 0, endSec: 1200 }];
  const match = { secondHalfStartSec: HALF_START, keeperHalf2Id: 'p8' };
  const { half1, half2 } = effectiveKeepersPerHalf(stints, match);
  assert.equal(half1, 'p1');
  assert.equal(half2, 'p8');
});

test('computePlayerStats — keeper override is credited over stint goalie', () => {
  const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
  const matches = [
    { id: 'm1', status: 'FINISHED', secondHalfStartSec: 600, potdPlayerId: null, keeperHalf1Id: 'p2' },
  ];
  const stints = [
    { id: 's1', matchId: 'm1', playerId: 'p1', role: 'GOALIE', startSec: 0, endSec: 1200 },
  ];
  const stats = computePlayerStats(players, matches, stints);
  const alice = stats.find(s => s.id === 'p1');
  const bob = stats.find(s => s.id === 'p2');
  assert.equal(alice.keeperHalves, 1); // H2 still derived (Alice was in goal at clock=600)
  assert.equal(bob.keeperHalves, 1);   // H1 override → Bob
});

test('computePlayerStats — archived matches excluded', () => {
  const players = [{ id: 'p1', name: 'Alice' }];
  const matches = [
    { id: 'm1', status: 'FINISHED', secondHalfStartSec: 600, potdPlayerId: 'p1', archived: false },
    { id: 'm2', status: 'FINISHED', secondHalfStartSec: 600, potdPlayerId: 'p1', archived: true },
  ];
  const stints = [
    { id: 's1', matchId: 'm1', playerId: 'p1', role: 'GOALIE', startSec: 0, endSec: 1200 },
    { id: 's2', matchId: 'm2', playerId: 'p1', role: 'GOALIE', startSec: 0, endSec: 1200 },
  ];
  const [alice] = computePlayerStats(players, matches, stints);
  assert.equal(alice.potd, 1);
  assert.equal(alice.keeperHalves, 2);
});

test('computePlayerStats — POTD and keeper halves aggregated across finished matches only', () => {
  const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
  const matches = [
    { id: 'm1', status: 'FINISHED', secondHalfStartSec: 600, potdPlayerId: 'p1' },
    { id: 'm2', status: 'FINISHED', secondHalfStartSec: 600, potdPlayerId: 'p2' },
    { id: 'm3', status: 'LIVE',     secondHalfStartSec: null, potdPlayerId: 'p1' }, // ignored
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
