import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBackup, parseBackup, BACKUP_APP } from './backup.js';

const sample = {
  schemaVersion: 1,
  teamName: 'Lions',
  players: [{ id: 'p1', name: 'Alice' }],
  matches: [{ id: 'm1', opponent: 'Tigers', status: 'FINISHED' }],
  stints: [{ id: 's1', matchId: 'm1', playerId: 'p1', role: 'GOALIE', startSec: 0, endSec: 600 }],
};

test('buildBackup wraps all data with app tag and timestamp', () => {
  const b = buildBackup(sample);
  assert.equal(b.app, BACKUP_APP);
  assert.equal(b.schemaVersion, 1);
  assert.match(b.exportedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(b.data, {
    teamName: 'Lions',
    players: sample.players,
    matches: sample.matches,
    stints: sample.stints,
  });
});

test('build then parse round-trips every field', () => {
  const parsed = parseBackup(JSON.stringify(buildBackup(sample)));
  assert.deepEqual(parsed, {
    schemaVersion: 1,
    teamName: 'Lions',
    players: sample.players,
    matches: sample.matches,
    stints: sample.stints,
  });
});

test('invalid JSON is rejected', () => {
  assert.throws(() => parseBackup('{not json'), /not valid JSON/);
});

test('non-Matchday file is rejected', () => {
  assert.throws(() => parseBackup(JSON.stringify({ app: 'something-else', data: {} })), /Matchday backup/);
});

test('missing data object is rejected', () => {
  assert.throws(() => parseBackup(JSON.stringify({ app: BACKUP_APP })), /missing its data/);
});

test('malformed collections are rejected', () => {
  const bad = { app: BACKUP_APP, data: { players: {}, matches: [], stints: [] } };
  assert.throws(() => parseBackup(JSON.stringify(bad)), /malformed/);
});

test('missing teamName defaults to empty string', () => {
  const b = { app: BACKUP_APP, data: { players: [], matches: [], stints: [] } };
  assert.equal(parseBackup(JSON.stringify(b)).teamName, '');
});
