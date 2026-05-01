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

  let pendingSubId = null;
  let pickingPotd = false;

  const initialElapsed = match.clockElapsedSec ?? 0;
  const initialStartWall = match.clockStartWall ?? null;

  const clock = createClock(sec => {
    if (match.status === 'LIVE') {
      persistClockState();
      // Don't blow away focus while the user is editing the opponent name —
      // just patch the clock display text in place.
      if (document.activeElement?.id === 'opponent-input') {
        const display = el.querySelector('#clock-display');
        if (display) display.textContent = fmtTime(sec);
      } else {
        render(sec);
      }
    }
  }, { elapsed: initialElapsed, startWall: initialStartWall });

  // Fresh LIVE entry (e.g. just kicked off from new-match) — startWall not yet
  // set, so begin the clock. If startWall was already non-null, the clock
  // self-resumed inside createClock.
  if (match.status === 'LIVE' && initialStartWall === null) {
    clock.start();
    persistClockState();
  }

  function persistClockState() {
    match = updateMatch(id, {
      clockElapsedSec: clock.getElapsed(),
      clockStartWall: clock.getStartWall(),
    });
  }

  function stints() { return getStintsForMatch(id); }

  function render(clockSec) {
    const s = stints();
    const onField = s.filter(st => (st.role === 'FIELD' || st.role === 'GOALIE') && st.endSec === null);
    const onBench = s.filter(st => st.role === 'BENCH' && st.endSec === null);
    const outfielders = onField.filter(st => st.role === 'FIELD');

    const isLive = match.status === 'LIVE';
    const isHalfTime = match.status === 'HALF_TIME';
    const isPicking = pendingSubId !== null;

    const incomingName = isPicking ? (playerMap[pendingSubId]?.name ?? '?') : '';
    const potdName = match.potdPlayerId ? (playerMap[match.potdPlayerId]?.name ?? '?') : null;

    el.innerHTML = `
      <div class="page-header">
        <a href="#/home" class="back-link" id="exit-link">← Home</a>
        <label style="font-size:1rem;font-weight:600;">vs
          <input id="opponent-input" type="text" maxlength="40" value="${escHtml(match.opponent)}"
            style="font:inherit;padding:0.25rem 0.5rem;border:1px solid #ccc;border-radius:0.375rem;width:10rem;">
        </label>
      </div>
      <div class="page-body">
        ${pickingPotd ? `
          <p style="font-weight:600;margin-bottom:0.5rem;">Pick Player of the Day:</p>
          <ul class="item-list" style="margin-bottom:1rem;">
            ${players.map(p => `
              <li class="item-row">
                <button class="btn-secondary btn-full" data-pick-potd="${p.id}">${escHtml(p.name)}</button>
              </li>
            `).join('') || '<li class="item-row"><span class="item-row-label">—</span></li>'}
          </ul>
          <div style="display:flex;flex-direction:column;gap:0.5rem;">
            <button class="btn-secondary btn-full" id="cancel-potd-btn">Cancel</button>
          </div>
        ` : `
        <!-- Score row -->
        <div style="display:flex;align-items:center;justify-content:center;gap:1rem;padding:0.75rem;background:#f0ebfb;border-radius:0.5rem;margin-bottom:0.5rem;">
          <button class="btn-primary btn-sm" id="goal-us">+Us</button>
          <span style="font-size:1.5rem;font-weight:700;">${match.goalsUs} – ${match.goalsThem}</span>
          <button class="btn-secondary btn-sm" id="goal-them">+Them</button>
          <span style="font-size:0.875rem;color:#555;margin-left:0.5rem;" id="clock-display">${fmtTime(clockSec ?? clock.getSec())}</span>
        </div>
        ${potdName ? `<p style="font-size:0.875rem;color:#555;text-align:center;margin-bottom:1rem;">POTD: ${escHtml(potdName)}</p>` : '<div style="margin-bottom:1rem;"></div>'}

        <!-- On field -->
        <p style="font-weight:600;margin-bottom:0.5rem;">
          ${isPicking ? `Sub in ${escHtml(incomingName)} — select player to come off:` : 'On field'}
        </p>
        <ul class="item-list" style="margin-bottom:1rem;">
          ${onField.map(st => {
            const name = playerMap[st.playerId]?.name ?? '?';
            const mins = playerMinutes(s, st.playerId, clockSec ?? clock.getSec());
            const tag = st.role === 'GOALIE' ? ' 🧤' : '';
            if (isPicking && st.role === 'FIELD') {
              return `<li class="item-row">
                <button class="btn-secondary btn-full" data-pick-off="${st.playerId}">${escHtml(name)}</button>
              </li>`;
            }
            return `<li class="item-row">
              <span class="item-row-label">${escHtml(name)}${tag}</span>
              <span style="font-size:0.8rem;color:#777;">${Math.floor(mins / 60)}m</span>
              ${!isPicking && st.role !== 'GOALIE'
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
              ${!isPicking
                ? `<button class="btn-secondary btn-sm" data-sub-in="${st.playerId}">Sub in</button>`
                : ''}
            </li>`;
          }).join('') || '<li class="item-row"><span class="item-row-label">—</span></li>'}
        </ul>

        <!-- Actions -->
        <div style="display:flex;flex-direction:column;gap:0.5rem;">
          ${isPicking
            ? `<button class="btn-secondary btn-full" id="cancel-sub-btn">Cancel sub</button>`
            : `<button class="btn-secondary btn-full" id="suggest-sub-btn">Suggest sub</button>`}
          ${(isLive || isHalfTime) && !isPicking
            ? `<button class="btn-secondary btn-full" id="potd-btn">${potdName ? 'Change Player of the Day' : 'Player of the Day'}</button>`
            : ''}
          ${isLive && match.halfLengthSec > 0 && !isPicking
            ? `<button class="btn-secondary btn-full" id="half-time-btn">Half time</button>`
            : ''}
          ${isHalfTime
            ? `<button class="btn-primary btn-full" id="second-half-btn">Start 2nd half</button>`
            : ''}
          ${!isPicking
            ? `<button class="btn-danger btn-full" id="end-match-btn">End match</button>`
            : ''}
        </div>
        `}
      </div>`;

    // Bind events

    el.querySelector('#opponent-input')?.addEventListener('input', e => {
      match = updateMatch(id, { opponent: e.target.value });
    });

    if (pickingPotd) {
      el.querySelectorAll('[data-pick-potd]').forEach(btn => {
        btn.addEventListener('click', () => {
          match = updateMatch(id, { potdPlayerId: btn.dataset.pickPotd });
          pickingPotd = false;
          render(clock.getSec());
        });
      });
      el.querySelector('#cancel-potd-btn')?.addEventListener('click', () => {
        pickingPotd = false;
        render(clock.getSec());
      });
      return;
    }

    el.querySelector('#goal-us').addEventListener('click', () => {
      match = updateMatch(id, { goalsUs: match.goalsUs + 1 });
      render(clock.getSec());
    });

    el.querySelector('#goal-them').addEventListener('click', () => {
      match = updateMatch(id, { goalsThem: match.goalsThem + 1 });
      render(clock.getSec());
    });

    el.querySelectorAll('[data-sub-in]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (outfielders.length === 0) { alert('No outfielders to sub.'); return; }
        pendingSubId = btn.dataset.subIn;
        render(clock.getSec());
      });
    });

    el.querySelectorAll('[data-pick-off]').forEach(btn => {
      btn.addEventListener('click', () => {
        applySwap(pendingSubId, btn.dataset.pickOff, 'FIELD');
        pendingSubId = null;
      });
    });

    el.querySelectorAll('[data-make-goalie]').forEach(btn => {
      btn.addEventListener('click', () => changeGoalie(btn.dataset.makeGoalie));
    });

    el.querySelector('#cancel-sub-btn')?.addEventListener('click', () => {
      pendingSubId = null;
      render(clock.getSec());
    });

    el.querySelector('#suggest-sub-btn')?.addEventListener('click', () => {
      const s = stints();
      const suggestion = subSuggester(s, clock.getSec());
      if (!suggestion) {
        alert('No clear suggestion (tie or empty bench).');
        return;
      }
      const name = playerMap[suggestion]?.name ?? '?';
      if (confirm(`Suggest subbing in: ${name}. Apply?`)) {
        if (outfielders.length === 0) { alert('No outfielders to sub.'); return; }
        pendingSubId = suggestion;
        render(clock.getSec());
      }
    });

    el.querySelector('#half-time-btn')?.addEventListener('click', () => {
      clock.pause();
      match = updateMatch(id, {
        status: 'HALF_TIME',
        clockElapsedSec: clock.getElapsed(),
        clockStartWall: null,
        secondHalfStartSec: clock.getSec(),
      });
      render(clock.getSec());
    });

    el.querySelector('#second-half-btn')?.addEventListener('click', () => {
      match = updateMatch(id, { status: 'LIVE' });
      clock.start();
      persistClockState();
      render(clock.getSec());
    });

    el.querySelector('#end-match-btn')?.addEventListener('click', endMatch);

    el.querySelector('#potd-btn')?.addEventListener('click', () => {
      pickingPotd = true;
      render(clock.getSec());
    });
  }

  function playerMinutes(stintsArr, playerId, nowSec) {
    return stintsArr
      .filter(s => s.playerId === playerId && s.role !== 'GOALIE')
      .reduce((acc, s) => acc + (s.endSec ?? nowSec) - s.startSec, 0);
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
    const sec = clock.getSec();

    if (match.potdPlayerId) {
      clock.pause();
      const openStints = s.filter(st => st.endSec === null);
      for (const st of openStints) closeStint(st.id, sec);
      updateMatch(id, {
        status: 'FINISHED',
        clockElapsedSec: clock.getElapsed(),
        clockStartWall: null,
      });
      navigate('/home');
      return;
    }

    const onField = s.filter(st => (st.role === 'FIELD' || st.role === 'GOALIE') && st.endSec === null);
    const eligible = onField.map(st => playerMap[st.playerId]?.name ?? st.playerId);

    const potdName = prompt(
      `End match!\nPick Player of the Day:\n\n${eligible.join('\n')}\n\n(type the name exactly)`
    );

    clock.pause();

    const openStints = s.filter(st => st.endSec === null);
    for (const st of openStints) closeStint(st.id, sec);

    let potdId = null;
    if (potdName) {
      const potdPlayer = players.find(p => p.name === potdName.trim());
      potdId = potdPlayer?.id ?? null;
    }

    updateMatch(id, {
      status: 'FINISHED',
      potdPlayerId: potdId,
      clockElapsedSec: clock.getElapsed(),
      clockStartWall: null,
    });
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
