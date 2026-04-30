import { getMatches, getPlayers, getStints, getTeamName } from '../repository.js';
import { keepersPerHalf } from '../stats.js';
import { navigate } from '../router.js';

export function homeView() {
  const el = document.createElement('div');

  const allMatches = getMatches();
  const liveMatches = allMatches.filter(m => m.status === 'LIVE' || m.status === 'HALF_TIME').reverse();
  const matches = allMatches.filter(m => m.status === 'FINISHED').reverse();
  const players = getPlayers();
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));
  const allStints = getStints();
  const stintsByMatch = new Map();
  for (const s of allStints) {
    if (!stintsByMatch.has(s.matchId)) stintsByMatch.set(s.matchId, []);
    stintsByMatch.get(s.matchId).push(s);
  }
  const teamName = getTeamName() || 'Us';

  const liveSection = liveMatches.length === 0 ? '' : `
    <p style="font-weight:600;margin-bottom:0.5rem;">Live</p>
    <ul class="item-list" style="margin-bottom:1rem;">
      ${liveMatches.map(m => {
        const tag = m.status === 'LIVE' ? '· LIVE' : '· HT';
        return `<li class="item-row">
          <a href="#/live-match/${m.id}" class="item-row-label" style="text-decoration:none;color:inherit;display:block;min-height:40px;line-height:40px;">
            ${escHtml(teamName)} ${m.goalsUs}–${m.goalsThem} ${escHtml(m.opponent)} <small style="color:#777;">${tag}</small>
          </a>
        </li>`;
      }).join('')}
    </ul>`;

  const matchRows = matches.length === 0
    ? `<p class="empty-state">No finished matches yet.</p>`
    : `<ul class="item-list">${matches.map(m => {
        const potd = m.potdPlayerId ? playerMap[m.potdPlayerId] : null;
        const date = m.createdAt ? fmtDate(m.createdAt) : '';
        const ms = stintsByMatch.get(m.id) ?? [];
        const { half1, half2 } = keepersPerHalf(ms, m.halfLengthSec);
        const keeperLine = formatKeepers(half1, half2, playerMap);
        return `<li class="item-row">
          <div class="item-row-label">
            ${escHtml(teamName)} ${m.goalsUs}–${m.goalsThem} ${escHtml(m.opponent)}
            ${date ? `<br><small style="color:#777;">${date}</small>` : ''}
            ${keeperLine ? `<br><small style="color:#777;">🧤 ${keeperLine}</small>` : ''}
            ${potd ? `<br><small>· POTD: ${escHtml(potd.name)}</small>` : ''}
          </div>
        </li>`;
      }).join('')}</ul>`;

  el.innerHTML = `
    <div class="page-header">
      <h1>Match Tracker</h1>
      <a href="#/squad" class="btn-secondary btn-sm" style="text-decoration:none;padding:0.375rem 0.75rem;border-radius:0.5rem;font:inherit;">Squad</a>
      <a href="#/stats" class="btn-secondary btn-sm" style="text-decoration:none;padding:0.375rem 0.75rem;border-radius:0.5rem;font:inherit;">Stats</a>
    </div>
    <div class="page-body">
      ${liveSection}
      ${matchRows}
      <div class="mt-2">
        <button class="btn-primary btn-full" id="new-match-btn">New match</button>
      </div>
    </div>`;

  el.querySelector('#new-match-btn').addEventListener('click', () => navigate('/new-match'));
  return el;
}

function formatKeepers(half1Ids, half2Ids, playerMap) {
  const namesFor = ids => ids.map(id => playerMap[id]?.name).filter(Boolean).join('/');
  const h1 = namesFor(half1Ids);
  const h2 = namesFor(half2Ids);
  if (!h1 && !h2) return '';
  return `${escHtml(h1 || '—')} / ${escHtml(h2 || '—')}`;
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(epochMs) {
  return new Date(epochMs).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
