import { getPlayers, createMatch, updateMatch, openStint } from '../repository.js';
import { navigate } from '../router.js';

export function newMatchView() {
  const el = document.createElement('div');
  const players = getPlayers();

  if (players.length < 9) {
    el.innerHTML = `
      <div class="page-header">
        <a href="#/home" class="back-link">← Home</a>
        <h1>New match</h1>
      </div>
      <div class="page-body">
        <p class="empty-state">You need at least 9 players in your squad to start a match. <a href="#/squad">Add players →</a></p>
      </div>`;
    return el;
  }

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
        <input id="half-length" type="number" value="20" min="5" max="60" required
          style="width:100%;padding:0.625rem;border:1px solid #ccc;border-radius:0.5rem;font:inherit;margin-bottom:1rem;">

        <p style="font-weight:500;margin-bottom:0.5rem;">Lineup — pick 1 goalie, 6 outfielders, 2 bench</p>
        <div id="player-picker">
          ${players.map(p => `
            <label style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem;border:1px solid #e5e5e5;border-radius:0.5rem;margin-bottom:0.5rem;cursor:pointer;">
              <input type="checkbox" class="player-check" data-id="${p.id}" style="accent-color:#6c3fc5;">
              <span>${escHtml(p.name)}</span>
              <select class="role-select" data-id="${p.id}" disabled
                style="margin-left:auto;padding:0.25rem;border:1px solid #ccc;border-radius:0.25rem;font:inherit;font-size:0.875rem;background:#fff;">
                <option value="FIELD">Outfield</option>
                <option value="GOALIE">Goalie</option>
                <option value="BENCH">Bench</option>
              </select>
            </label>`).join('')}
        </div>
        <div id="lineup-summary" style="margin:0.75rem 0;font-size:0.875rem;color:#555;"></div>
        <button type="submit" class="btn-primary btn-full" id="kickoff-btn" disabled>Kick off</button>
      </form>
    </div>`;

  function updateSummary() {
    const checks = [...el.querySelectorAll('.player-check:checked')];
    const roles = checks.map(c => el.querySelector(`.role-select[data-id="${c.dataset.id}"]`).value);
    const goalies = roles.filter(r => r === 'GOALIE').length;
    const outfield = roles.filter(r => r === 'FIELD').length;
    const bench = roles.filter(r => r === 'BENCH').length;
    el.querySelector('#lineup-summary').textContent =
      `Selected: ${checks.length}/9 · Outfield: ${outfield}/6 · Goalie: ${goalies}/1 · Bench: ${bench}/2`;
    const ok = checks.length === 9 && goalies === 1 && outfield === 6 && bench === 2;
    el.querySelector('#kickoff-btn').disabled = !ok;
  }

  el.querySelectorAll('.player-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const sel = el.querySelector(`.role-select[data-id="${cb.dataset.id}"]`);
      sel.disabled = !cb.checked;
      updateSummary();
    });
  });

  el.querySelectorAll('.role-select').forEach(sel => {
    sel.addEventListener('change', updateSummary);
  });

  updateSummary();

  el.querySelector('#new-match-form').addEventListener('submit', e => {
    e.preventDefault();
    const opponent = el.querySelector('#opponent').value.trim();
    const halfLengthSec = Number(el.querySelector('#half-length').value) * 60;
    const match = createMatch({ opponent, halfLengthSec });

    el.querySelectorAll('.player-check:checked').forEach(cb => {
      const role = el.querySelector(`.role-select[data-id="${cb.dataset.id}"]`).value;
      openStint({ matchId: match.id, playerId: cb.dataset.id, role, startSec: 0 });
    });

    updateMatch(match.id, { status: 'LIVE' });
    navigate(`/live-match/${match.id}`);
  });

  return el;
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
