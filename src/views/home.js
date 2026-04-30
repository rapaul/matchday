import { getMatches, getPlayers, getTeamName } from '../repository.js';
import { navigate } from '../router.js';

export function homeView() {
  const el = document.createElement('div');

  const matches = getMatches().filter(m => m.status === 'FINISHED').reverse();
  const players = getPlayers();
  const teamName = getTeamName() || 'Us';

  const matchRows = matches.length === 0
    ? `<p class="empty-state">No finished matches yet.</p>`
    : `<ul class="item-list">${matches.map(m => {
        const potd = m.potdPlayerId ? players.find(p => p.id === m.potdPlayerId) : null;
        return `<li class="item-row">
          <div class="item-row-label">
            ${escHtml(teamName)} ${m.goalsUs}–${m.goalsThem} ${m.opponent}
            ${potd ? `<br><small>· POTD: ${potd.name}</small>` : ''}
          </div>
        </li>`;
      }).join('')}</ul>`;

  el.innerHTML = `
    <div class="page-header">
      <h1>Match Tracker</h1>
      <a href="#/squad" class="btn-secondary btn-sm" style="text-decoration:none;padding:0.375rem 0.75rem;border-radius:0.5rem;font:inherit;">Squad</a>
    </div>
    <div class="page-body">
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
