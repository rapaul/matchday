import { getMatches, getPlayers, getTeamName } from '../repository.js';
import { navigate } from '../router.js';

export function homeView() {
  const el = document.createElement('div');

  const allMatches = getMatches();
  const liveMatches = allMatches.filter(m => m.status === 'LIVE' || m.status === 'HALF_TIME').reverse();
  const matches = allMatches.filter(m => m.status === 'FINISHED').reverse();
  const players = getPlayers();
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
        const potd = m.potdPlayerId ? players.find(p => p.id === m.potdPlayerId) : null;
        const date = m.createdAt ? fmtDate(m.createdAt) : '';
        return `<li class="item-row">
          <div class="item-row-label">
            ${escHtml(teamName)} ${m.goalsUs}–${m.goalsThem} ${escHtml(m.opponent)}
            ${date ? `<br><small style="color:#777;">${date}</small>` : ''}
            ${potd ? `<br><small>· POTD: ${escHtml(potd.name)}</small>` : ''}
          </div>
        </li>`;
      }).join('')}</ul>`;

  el.innerHTML = `
    <div class="page-header">
      <h1>Match Tracker</h1>
      <a href="#/squad" class="btn-secondary btn-sm" style="text-decoration:none;padding:0.375rem 0.75rem;border-radius:0.5rem;font:inherit;">Squad</a>
      <a href="#/potd-history" class="btn-secondary btn-sm" style="text-decoration:none;padding:0.375rem 0.75rem;border-radius:0.5rem;font:inherit;">Awards</a>
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

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(epochMs) {
  return new Date(epochMs).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
