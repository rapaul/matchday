import { getPlayers, createMatch, updateMatch, openStint } from '../repository.js';
import { navigate } from '../router.js';

export function newMatchView() {
  const el = document.createElement('div');
  const players = getPlayers();

  if (players.length < 2) {
    el.innerHTML = `
      <div class="page-header">
        <a href="#/home" class="back-link">← Home</a>
        <h1>New match</h1>
      </div>
      <div class="page-body">
        <p class="empty-state">You need at least 2 players in your squad to start a match. <a href="#/squad">Add players →</a></p>
      </div>`;
    return el;
  }

  const roles = Object.fromEntries(players.map(p => [p.id, 'FIELD']));

  el.innerHTML = `
    <div class="page-header">
      <a href="#/home" class="back-link">← Home</a>
      <h1>New match</h1>
    </div>
    <div class="page-body">
      <form id="new-match-form">
        <label style="display:block;margin-bottom:0.25rem;font-weight:500;">Opponent</label>
        <input id="opponent" type="text" placeholder="e.g. Red FC" required maxlength="40"
          style="width:100%;padding:0.625rem;border:1px solid #ccc;border-radius:0.5rem;font:inherit;margin-bottom:1rem;">

        <label style="display:block;margin-bottom:0.25rem;font-weight:500;">Half length (minutes)</label>
        <input id="half-length" type="number" value="25" min="5" max="60" required
          style="width:100%;padding:0.625rem;border:1px solid #ccc;border-radius:0.5rem;font:inherit;margin-bottom:1rem;">

        <label style="display:block;margin-bottom:0.25rem;font-weight:500;">Players on field (inc. goalie)</label>
        <input id="field-size" type="number" value="7" min="2" max="20" required
          style="width:100%;padding:0.625rem;border:1px solid #ccc;border-radius:0.5rem;font:inherit;margin-bottom:1rem;">

        <p style="font-weight:500;margin-bottom:0.5rem;">Lineup</p>
        <ul class="item-list" id="player-picker" style="margin-bottom:0.75rem;"></ul>
        <div id="lineup-summary" style="margin:0.75rem 0;font-size:0.875rem;color:#555;"></div>
        <button type="submit" class="btn-primary btn-full" id="kickoff-btn" disabled>Kick off</button>
      </form>
    </div>`;

  function getFieldSize() {
    return Math.max(2, Math.min(20, Number(el.querySelector('#field-size').value) || 7));
  }

  function renderLineup() {
    el.querySelector('#player-picker').innerHTML = players.map(p => {
      const role = roles[p.id];
      return `<li class="item-row">
        <span class="item-row-label">${escHtml(p.name)}</span>
        <button type="button" class="btn-sm ${role === 'FIELD' ? 'btn-primary' : 'btn-secondary'}" data-role-field="${p.id}">Field</button>
        <button type="button" class="btn-sm ${role === 'GOALIE' ? 'btn-primary' : 'btn-secondary'}" data-role-gk="${p.id}">GK</button>
        <button type="button" class="btn-sm ${role === 'BENCH' ? 'btn-primary' : 'btn-secondary'}" data-role-bench="${p.id}">Bench</button>
      </li>`;
    }).join('');

    el.querySelectorAll('[data-role-field]').forEach(btn => {
      btn.addEventListener('click', () => { roles[btn.dataset.roleField] = 'FIELD'; renderLineup(); });
    });
    el.querySelectorAll('[data-role-gk]').forEach(btn => {
      btn.addEventListener('click', () => {
        for (const id of Object.keys(roles)) { if (roles[id] === 'GOALIE') roles[id] = 'FIELD'; }
        roles[btn.dataset.roleGk] = 'GOALIE';
        renderLineup();
      });
    });
    el.querySelectorAll('[data-role-bench]').forEach(btn => {
      btn.addEventListener('click', () => { roles[btn.dataset.roleBench] = 'BENCH'; renderLineup(); });
    });

    updateSummary();
  }

  function updateSummary() {
    const fieldSize = getFieldSize();
    const goalies = Object.values(roles).filter(r => r === 'GOALIE').length;
    const outfield = Object.values(roles).filter(r => r === 'FIELD').length;
    const bench = Object.values(roles).filter(r => r === 'BENCH').length;

    if (players.length < fieldSize) {
      el.querySelector('#lineup-summary').textContent =
        `Need at least ${fieldSize} players for this field size (have ${players.length})`;
      el.querySelector('#kickoff-btn').disabled = true;
      return;
    }

    el.querySelector('#lineup-summary').textContent =
      `On field: ${goalies + outfield}/${fieldSize} · Goalie: ${goalies}/1 · Bench: ${bench}`;
    el.querySelector('#kickoff-btn').disabled = !(goalies === 1 && outfield === fieldSize - 1);
  }

  el.querySelector('#field-size').addEventListener('change', () => { renderLineup(); });

  renderLineup();

  el.querySelector('#new-match-form').addEventListener('submit', e => {
    e.preventDefault();
    const opponent = el.querySelector('#opponent').value.trim();
    const halfLengthSec = Number(el.querySelector('#half-length').value) * 60;
    const match = createMatch({ opponent, halfLengthSec });

    for (const [playerId, role] of Object.entries(roles)) {
      openStint({ matchId: match.id, playerId, role, startSec: 0 });
    }

    updateMatch(match.id, { status: 'LIVE' });
    navigate(`/live-match/${match.id}`);
  });

  return el;
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
