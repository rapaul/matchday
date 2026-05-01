import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMarkdown } from './export.js';

function stintsMap(stints) {
  const m = new Map();
  for (const s of stints) {
    if (!m.has(s.matchId)) m.set(s.matchId, []);
    m.get(s.matchId).push(s);
  }
  return m;
}

test('empty store renders placeholders', () => {
  const md = buildMarkdown({ teamName: '', players: [], matches: [], stintsByMatch: new Map() });
  assert.match(md, /^# Us\n/);
  assert.match(md, /## Squad\n_No players yet\._/);
  assert.match(md, /## Match history\n\n_No matches yet\._/);
});

test('single FINISHED match with POTD and both keepers', () => {
  const players = [{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }];
  const matches = [{
    id: 'm1', opponent: 'Tigers', goalsUs: 2, goalsThem: 1,
    status: 'FINISHED', archived: false,
    potdPlayerId: 'p1', secondHalfStartSec: 600, createdAt: 1700000000000,
  }];
  const stints = [
    { id: 's1', matchId: 'm1', playerId: 'p1', role: 'GOALIE', startSec: 0, endSec: 600 },
    { id: 's2', matchId: 'm1', playerId: 'p2', role: 'GOALIE', startSec: 600, endSec: 1200 },
  ];
  const md = buildMarkdown({
    teamName: 'Lions', players, matches, stintsByMatch: stintsMap(stints),
  });
  assert.match(md, /^# Lions\n/);
  assert.match(md, /- Alice\n- Bob/);
  assert.match(md, /### Active\n/);
  assert.match(md, /#### .* — Lions 2–1 Tigers\n- POTD: Alice\n- Keepers: Alice \/ Bob/);
  assert.ok(!md.includes('### Archived'), 'no archived section when none archived');
});

test('archived matches go in their own section', () => {
  const players = [{ id: 'p1', name: 'Alice' }];
  const matches = [
    { id: 'm1', opponent: 'A', goalsUs: 0, goalsThem: 0, status: 'FINISHED', archived: false, potdPlayerId: null, secondHalfStartSec: null, createdAt: 2 },
    { id: 'm2', opponent: 'B', goalsUs: 0, goalsThem: 0, status: 'FINISHED', archived: true,  potdPlayerId: null, secondHalfStartSec: null, createdAt: 1 },
  ];
  const md = buildMarkdown({ teamName: 'Lions', players, matches, stintsByMatch: new Map() });
  const activeIdx = md.indexOf('### Active');
  const archivedIdx = md.indexOf('### Archived');
  assert.ok(activeIdx > -1 && archivedIdx > activeIdx, 'archived after active');
  const activeBlock = md.slice(activeIdx, archivedIdx);
  const archivedBlock = md.slice(archivedIdx);
  assert.match(activeBlock, /Lions 0–0 A/);
  assert.ok(!activeBlock.includes('Lions 0–0 B'), 'archived match not in active');
  assert.match(archivedBlock, /Lions 0–0 B/);
});

test('active section sorted newest-first', () => {
  const matches = [
    { id: 'old', opponent: 'Old', goalsUs: 0, goalsThem: 0, status: 'FINISHED', archived: false, potdPlayerId: null, secondHalfStartSec: null, createdAt: 100 },
    { id: 'new', opponent: 'New', goalsUs: 0, goalsThem: 0, status: 'FINISHED', archived: false, potdPlayerId: null, secondHalfStartSec: null, createdAt: 200 },
  ];
  const md = buildMarkdown({ teamName: 'X', players: [], matches, stintsByMatch: new Map() });
  assert.ok(md.indexOf('X 0–0 New') < md.indexOf('X 0–0 Old'), 'newer match listed first');
});

test('PENDING matches are excluded', () => {
  const matches = [
    { id: 'p', opponent: 'Pending', goalsUs: 0, goalsThem: 0, status: 'PENDING', archived: false, potdPlayerId: null, secondHalfStartSec: null, createdAt: 1 },
  ];
  const md = buildMarkdown({ teamName: 'X', players: [], matches, stintsByMatch: new Map() });
  assert.ok(!md.includes('Pending'));
  assert.match(md, /_No matches yet\._/);
});

test('LIVE / HALF_TIME matches included with status tag', () => {
  const matches = [
    { id: 'l', opponent: 'L', goalsUs: 1, goalsThem: 0, status: 'LIVE',      archived: false, potdPlayerId: null, secondHalfStartSec: null, createdAt: 2 },
    { id: 'h', opponent: 'H', goalsUs: 0, goalsThem: 0, status: 'HALF_TIME', archived: false, potdPlayerId: null, secondHalfStartSec: 600,  createdAt: 1 },
  ];
  const md = buildMarkdown({ teamName: 'X', players: [], matches, stintsByMatch: new Map() });
  assert.match(md, /X 1–0 L · LIVE/);
  assert.match(md, /X 0–0 H · HT/);
});

test('markdown-significant characters in names are escaped', () => {
  const players = [{ id: 'p1', name: '*Alice*' }];
  const matches = [{
    id: 'm1', opponent: '_Tigers_', goalsUs: 0, goalsThem: 0,
    status: 'FINISHED', archived: false, potdPlayerId: 'p1', secondHalfStartSec: null, createdAt: 1,
  }];
  const md = buildMarkdown({ teamName: '[Lions]', players, matches, stintsByMatch: new Map() });
  assert.match(md, /^# \\\[Lions\\\]/);
  assert.match(md, /- \\\*Alice\\\*/);
  assert.match(md, /\\_Tigers\\_/);
  assert.match(md, /POTD: \\\*Alice\\\*/);
});

test('missing POTD and keepers render as em dash', () => {
  const matches = [{
    id: 'm1', opponent: 'T', goalsUs: 0, goalsThem: 0,
    status: 'FINISHED', archived: false, potdPlayerId: null, secondHalfStartSec: null, createdAt: 1,
  }];
  const md = buildMarkdown({ teamName: 'X', players: [], matches, stintsByMatch: new Map() });
  assert.match(md, /- POTD: —/);
  assert.match(md, /- Keepers: — \/ —/);
});
