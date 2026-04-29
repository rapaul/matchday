import { getMatch, updateMatch, getStintsForMatch, openStint, closeStint, getPlayers } from '../repository.js';
import { createClock, fmtTime } from '../match-clock.js';
import { subSuggester } from '../sub-suggester.js';
import { navigate } from '../router.js';

export function liveMatchView({ id }) {
  const el = document.createElement('div');

  let match = getMatch(id);
  if (!match) {
    el.innerHTML = `<div class="page-body"><p class="empty-state">Match not found.</p></div>`;
    return el;
  }

  const players = getPlayers();
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));

  // Restore half from status
  let half = match.status === 'HALF_TIME' ? 1 : (match.status === 'LIVE' ? 1 : 1);
  // If we previously ended first half, track second half
  // We'll encode this by checking if the match was resumed
  let clockOffset = 0; // seconds to add to display (0 for first half, halfLengthSec for second)

  const clock = createClock(sec => {
    if (match.status === 'LIVE') render(sec);
  });

  if (match.status === 'LIVE') clock.start();

  function stints() { return getStintsForMatch(id); }

  function render(clockSec) {
    const s = stints();
    const onField = s.filter(st => (st.role === 'FIELD' || st.role === 'GOALIE') && st.endSec === null);
    const onBench = s.filter(st => st.role === 'BENCH' && st.endSec === null);

    const isLive = match.status === 'LIVE';
    const isHalfTime = match.status === 'HALF_TIME';

    el.innerHTML = `
      <div class="page-header">
        <a href="#/home" class="back-link" id="exit-link">← Home</a>
        <h1 style="font-size:1rem;">vs ${escHtml(match.opponent)}</h1>
      </div>
      <div class="page-body">
        <!-- Score row -->
        <div style="display:flex;align-items:center;justify-content:center;gap:1rem;padding:0.75rem;background:#f0ebfb;border-radius:0.5rem;margin-bottom:1rem;">
          <button class="btn-primary btn-sm" id="goal-us">+Us</button>
          <span style="font-size:1.5rem;font-weight:700;">${match.goalsUs} – ${match.goalsThem}</span>
          <button class="btn-secondary btn-sm" id="goal-them">+Them</button>
          <span style="font-size:0.875rem;color:#555;margin-left:0.5rem;" id="clock-display">${fmtTime(clockSec ?? clock.getSec())}</span>
        </div>

        <!-- On field -->
        <p style="font-weight:600;margin-bottom:0.5rem;">On field</p>
        <ul class="item-list" style="margin-bottom:1rem;">
          ${onField.map(st => {
            const name = playerMap[st.playerId]?.name ?? '?';
            const mins = playerMinutes(s, st.playerId, clockSec ?? clock.getSec());
            const tag = st.role === 'GOALIE' ? ' 🧤' : '';
            return `<li class="item-row">
              <span class="item-row-label">${escHtml(name)}${tag}</span>
              <span style="font-size:0.8rem;color:#777;">${Math.floor(mins / 60)}m</span>
              ${st.role !== 'GOALIE'
                ? `<button class="btn-secondary btn-sm" data-make-goalie="${st.playerId}">→ GK</button>`
                : ''}
            </li>`;
          }).join('') || '<li class="item-row"><span class="item-row-label">—</span></li>'}
        </ul>

        <!-- Bench -->
        <p style="font-weight:600;margin-bottom:0.5rem;">Bench</p>
        <ul class="item-list" style="margin-bottom:1rem;">
          ${onBench.map(st => {
            const name = playerMap[st.playerId]?.name ?? '?';
            const mins = playerMinutes(s, st.playerId, clockSec ?? clock.getSec());
            return `<li class="item-row">
              <span class="item-row-label">${escHtml(name)}</span>
              <span style="font-size:0.8rem;color:#777;">${Math.floor(mins / 60)}m</span>
              <button class="btn-secondary btn-sm" data-sub-in="${st.playerId}">Sub in</button>
            </li>`;
          }).join('') || '<li class="item-row"><span class="item-row-label">—</span></li>'}
        </ul>

        <!-- Actions -->
        <div style="display:flex;flex-direction:column;gap:0.5rem;">
          <button class="btn-secondary btn-full" id="suggest-sub-btn">Suggest sub</button>
          ${isLive && match.halfLengthSec > 0
            ? `<button class="btn-secondary btn-full" id="half-time-btn">Half time</button>`
            : ''}
          ${isHalfTime
            ? `<button class="btn-primary btn-full" id="second-half-btn">Start 2nd half</button>`
            : ''}
          <button class="btn-danger btn-full" id="end-match-btn">End match</button>
        </div>
      </div>`;

    // Bind events
    el.querySelector('#goal-us').addEventListener('click', () => {
      match = updateMatch(id, { goalsUs: match.goalsUs + 1 });
      render(clock.getSec());
    });

    el.querySelector('#goal-them').addEventListener('click', () => {
      match = updateMatch(id, { goalsThem: match.goalsThem + 1 });
      render(clock.getSec());
    });

    el.querySelectorAll('[data-sub-in]').forEach(btn => {
      btn.addEventListener('click', () => pickSubTarget(btn.dataset.subIn));
    });

    el.querySelectorAll('[data-make-goalie]').forEach(btn => {
      btn.addEventListener('click', () => changeGoalie(btn.dataset.makeGoalie));
    });

    el.querySelector('#suggest-sub-btn').addEventListener('click', () => {
      const s = stints();
      const suggestion = subSuggester(s, clock.getSec());
      if (!suggestion) {
        alert('No clear suggestion (tie or empty bench).');
        return;
      }
      const name = playerMap[suggestion]?.name ?? '?';
      if (confirm(`Suggest subbing in: ${name}. Apply?`)) {
        pickSubTarget(suggestion);
      }
    });

    el.querySelector('#half-time-btn')?.addEventListener('click', () => {
      clock.pause();
      match = updateMatch(id, { status: 'HALF_TIME' });
      render(clock.getSec());
    });

    el.querySelector('#second-half-btn')?.addEventListener('click', () => {
      match = updateMatch(id, { status: 'LIVE' });
      clock.start();
      render(clock.getSec());
    });

    el.querySelector('#end-match-btn').addEventListener('click', endMatch);

    el.querySelector('#exit-link').addEventListener('click', e => {
      if (!confirm('Leave this match? The clock will stop.')) e.preventDefault();
    });
  }

  function playerMinutes(stintsArr, playerId, nowSec) {
    return stintsArr
      .filter(s => s.playerId === playerId && s.role !== 'GOALIE')
      .reduce((acc, s) => acc + (s.endSec ?? nowSec) - s.startSec, 0);
  }

  function pickSubTarget(benchPlayerId) {
    const s = stints();
    const outfielders = s.filter(st => st.role === 'FIELD' && st.endSec === null);
    if (outfielders.length === 0) { alert('No outfielders to sub.'); return; }

    const opts = outfielders.map(st => playerMap[st.playerId]?.name ?? st.playerId).join('\n');
    const name = prompt(`Sub in ${playerMap[benchPlayerId]?.name}.\nReplace which outfielder?\n\n${opts}`);
    if (!name) return;
    const target = outfielders.find(st => playerMap[st.playerId]?.name === name.trim());
    if (!target) { alert('Player not found.'); return; }
    applySwap(benchPlayerId, target.playerId, 'FIELD');
  }

  function changeGoalie(newGoaliePlayerId) {
    const s = stints();
    const currentGoalie = s.find(st => st.role === 'GOALIE' && st.endSec === null);
    if (!currentGoalie) return;
    const sec = clock.getSec();
    closeStint(currentGoalie.id, sec);
    openStint({ matchId: id, playerId: currentGoalie.playerId, role: 'FIELD', startSec: sec });

    const outfielderStint = s.find(st => st.playerId === newGoaliePlayerId && st.endSec === null);
    if (outfielderStint) closeStint(outfielderStint.id, sec);
    openStint({ matchId: id, playerId: newGoaliePlayerId, role: 'GOALIE', startSec: sec });
    render(sec);
  }

  function applySwap(benchPlayerId, fieldPlayerId, newRole) {
    const s = stints();
    const sec = clock.getSec();
    const benchStint = s.find(st => st.playerId === benchPlayerId && st.role === 'BENCH' && st.endSec === null);
    const fieldStint = s.find(st => st.playerId === fieldPlayerId && st.endSec === null);
    if (benchStint) { closeStint(benchStint.id, sec); }
    if (fieldStint) { closeStint(fieldStint.id, sec); }
    openStint({ matchId: id, playerId: benchPlayerId, role: newRole, startSec: sec });
    openStint({ matchId: id, playerId: fieldPlayerId, role: 'BENCH', startSec: sec });
    render(sec);
  }

  function endMatch() {
    const s = stints();
    const onField = s.filter(st => (st.role === 'FIELD' || st.role === 'GOALIE') && st.endSec === null);
    const eligible = onField.map(st => playerMap[st.playerId]?.name ?? st.playerId);

    const potdName = prompt(
      `End match!\nPick Player of the Day:\n\n${eligible.join('\n')}\n\n(type the name exactly)`
    );

    const sec = clock.getSec();
    clock.pause();

    const openStints = s.filter(st => st.endSec === null);
    for (const st of openStints) closeStint(st.id, sec);

    let potdId = null;
    if (potdName) {
      const potdPlayer = players.find(p => p.name === potdName.trim());
      potdId = potdPlayer?.id ?? null;
    }

    updateMatch(id, { status: 'FINISHED', potdPlayerId: potdId });
    navigate('/home');
  }

  // Initial render
  render(clock.getSec());

  // Cleanup clock on navigation away
  const observer = new MutationObserver(() => {
    if (!document.body.contains(el)) {
      clock.destroy();
      observer.disconnect();
    }
  });
  observer.observe(document.getElementById('app'), { childList: true });

  return el;
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
