import { keepersPerHalf } from './stats.js';

const DATE_OPTS = { day: 'numeric', month: 'short', year: 'numeric' };

export function buildMarkdown({ teamName, players, matches, stintsByMatch }) {
  const team = teamName || 'Us';
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));

  const lines = [`# ${esc(team)}`, '', '## Squad'];
  if (players.length === 0) {
    lines.push('_No players yet._');
  } else {
    for (const p of players) lines.push(`- ${esc(p.name)}`);
  }
  lines.push('', '## Match history');

  const exportable = matches.filter(m => m.status !== 'PENDING');
  if (exportable.length === 0) {
    lines.push('', '_No matches yet._');
    return lines.join('\n') + '\n';
  }

  const byCreatedDesc = (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0);
  const active = exportable.filter(m => !m.archived).sort(byCreatedDesc);
  const archived = exportable.filter(m => m.archived).sort(byCreatedDesc);

  lines.push('', '### Active');
  if (active.length === 0) {
    lines.push('_No active matches._');
  } else {
    for (const m of active) lines.push(...renderMatch(m, team, playerMap, stintsByMatch));
  }

  if (archived.length > 0) {
    lines.push('', '### Archived');
    for (const m of archived) lines.push(...renderMatch(m, team, playerMap, stintsByMatch));
  }

  return lines.join('\n') + '\n';
}

function renderMatch(m, team, playerMap, stintsByMatch) {
  const date = m.createdAt ? new Date(m.createdAt).toLocaleDateString(undefined, DATE_OPTS) : '';
  const tag = m.status === 'LIVE' ? ' · LIVE' : m.status === 'HALF_TIME' ? ' · HT' : '';
  const heading = `#### ${date ? `${date} — ` : ''}${esc(team)} ${m.goalsUs}–${m.goalsThem} ${esc(m.opponent ?? '')}${tag}`;

  const potdName = m.potdPlayerId ? playerMap[m.potdPlayerId]?.name : null;
  const ms = stintsByMatch.get(m.id) ?? [];
  const { half1, half2 } = keepersPerHalf(ms, m.secondHalfStartSec);
  const h1 = half1 ? playerMap[half1]?.name : null;
  const h2 = half2 ? playerMap[half2]?.name : null;

  return [
    '',
    heading,
    `- POTD: ${potdName ? esc(potdName) : '—'}`,
    `- Keepers: ${h1 ? esc(h1) : '—'} / ${h2 ? esc(h2) : '—'}`,
  ];
}

function esc(s) {
  return String(s).replace(/[\\*_`\[\]]/g, '\\$&');
}

export function downloadMarkdown(markdown, filename) {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
