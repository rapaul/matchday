import {
  loadPlayers, savePlayers,
  loadMatches, saveMatches,
  loadStints, saveStints,
  loadTeamName, saveTeamName,
} from './storage.js';

function uuid() {
  return crypto.randomUUID();
}

// --- Players ---
export function getPlayers() { return loadPlayers(); }

export function addPlayer(name) {
  const players = loadPlayers();
  const player = { id: uuid(), name };
  players.push(player);
  savePlayers(players);
  return player;
}

export function updatePlayer(id, name) {
  const players = loadPlayers().map(p => p.id === id ? { ...p, name } : p);
  savePlayers(players);
}

export function deletePlayer(id) {
  savePlayers(loadPlayers().filter(p => p.id !== id));
}

// --- Matches ---
export function getMatches() { return loadMatches(); }

export function getMatch(id) { return loadMatches().find(m => m.id === id) ?? null; }

export function createMatch({ opponent, halfLengthSec }) {
  const matches = loadMatches();
  const match = {
    id: uuid(),
    opponent,
    halfLengthSec,
    status: 'PENDING',
    goalsUs: 0,
    goalsThem: 0,
    potdPlayerId: null,
    createdAt: Date.now(),
    clockElapsedSec: 0,
    clockStartWall: null,
  };
  matches.push(match);
  saveMatches(matches);
  return match;
}

export function updateMatch(id, patch) {
  const matches = loadMatches().map(m => m.id === id ? { ...m, ...patch } : m);
  saveMatches(matches);
  return matches.find(m => m.id === id);
}

// --- Stints ---
export function getStints() { return loadStints(); }

export function getStintsForMatch(matchId) {
  return loadStints().filter(s => s.matchId === matchId);
}

export function openStint({ matchId, playerId, role, startSec }) {
  const stints = loadStints();
  const stint = { id: uuid(), matchId, playerId, role, startSec, endSec: null };
  stints.push(stint);
  saveStints(stints);
  return stint;
}

export function closeStint(id, endSec) {
  const stints = loadStints().map(s => s.id === id ? { ...s, endSec } : s);
  saveStints(stints);
}

export function updateStint(id, patch) {
  const stints = loadStints().map(s => s.id === id ? { ...s, ...patch } : s);
  saveStints(stints);
}

// --- Team name ---
export function getTeamName() { return loadTeamName(); }
export function setTeamName(name) { saveTeamName(name); }
