const SCHEMA_VERSION = 1;

function checkSchema() {
  const v = localStorage.getItem('schemaVersion');
  if (v === null) {
    localStorage.setItem('schemaVersion', String(SCHEMA_VERSION));
  } else if (Number(v) !== SCHEMA_VERSION) {
    console.warn(`Schema version mismatch: stored=${v}, expected=${SCHEMA_VERSION}`);
  }
}

function load(key) {
  checkSchema();
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(key, data) {
  checkSchema();
  localStorage.setItem(key, JSON.stringify(data));
}

export function loadPlayers() { return load('players'); }
export function savePlayers(players) { save('players', players); }

export function loadMatches() { return load('matches'); }
export function saveMatches(matches) { save('matches', matches); }

export function loadStints() { return load('stints'); }
export function saveStints(stints) { save('stints', stints); }

export function loadTeamName() {
  checkSchema();
  return localStorage.getItem('teamName') ?? '';
}
export function saveTeamName(name) {
  checkSchema();
  localStorage.setItem('teamName', name);
}
