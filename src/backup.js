import {
  loadPlayers, savePlayers,
  loadMatches, saveMatches,
  loadStints, saveStints,
  loadTeamName, saveTeamName,
  loadSchemaVersion, saveSchemaVersion,
} from './storage.js';

export const BACKUP_APP = 'matchday';

// --- Pure helpers (unit-testable, no storage / DOM) ---

export function buildBackup({ schemaVersion, teamName, players, matches, stints }) {
  return {
    app: BACKUP_APP,
    schemaVersion,
    exportedAt: new Date().toISOString(),
    data: { teamName, players, matches, stints },
  };
}

// Validates the file *before* any write happens, so a bad file can never
// corrupt the data already on the device. Throws with a user-facing message.
export function parseBackup(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    throw new Error('File is not valid JSON.');
  }
  if (!obj || typeof obj !== 'object' || obj.app !== BACKUP_APP) {
    throw new Error('This does not look like a Matchday backup file.');
  }
  const d = obj.data;
  if (!d || typeof d !== 'object') {
    throw new Error('Backup file is missing its data.');
  }
  if (!Array.isArray(d.players) || !Array.isArray(d.matches) || !Array.isArray(d.stints)) {
    throw new Error('Backup data is malformed (players, matches and stints must be lists).');
  }
  return {
    schemaVersion: obj.schemaVersion,
    teamName: typeof d.teamName === 'string' ? d.teamName : '',
    players: d.players,
    matches: d.matches,
    stints: d.stints,
  };
}

// --- Storage-integrated ---

export function collectBackup() {
  return buildBackup({
    schemaVersion: loadSchemaVersion(),
    teamName: loadTeamName(),
    players: loadPlayers(),
    matches: loadMatches(),
    stints: loadStints(),
  });
}

// Full replace of all stored data. Only call with a value from parseBackup().
export function applyBackup(parsed) {
  savePlayers(parsed.players);
  saveMatches(parsed.matches);
  saveStints(parsed.stints);
  saveTeamName(parsed.teamName);
  if (typeof parsed.schemaVersion === 'number') saveSchemaVersion(parsed.schemaVersion);
}

// --- DOM ---

export function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
