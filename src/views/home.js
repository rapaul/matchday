import { getMatches, getPlayers, getStints, getTeamName, updateMatch } from '../repository.js';
import { keepersPerHalf } from '../stats.js';
import { navigate } from '../router.js';

export function homeView() {
  const el = document.createElement('div');

  const players = getPlayers();
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));
  const allStints = getStints();
  const stintsByMatch = new Map();
  for (const s of allStints) {
    if (!stintsByMatch.has(s.matchId)) stintsByMatch.set(s.matchId, []);
    stintsByMatch.get(s.matchId).push(s);
  }
  const teamName = getTeamName() || 'Us';

  function render() {
    const allMatches = getMatches();
    const live = allMatches.filter(m => !m.archived && (m.status === 'LIVE' || m.status === 'HALF_TIME')).reverse();
    const finished = allMatches.filter(m => !m.archived && m.status === 'FINISHED').reverse();
    const archived = allMatches.filter(m => m.archived).reverse();

    el.innerHTML = `
      <div class="page-header">
        <h1>Match Tracker</h1>
        <a href="#/squad" class="btn-secondary btn-sm" style="text-decoration:none;padding:0.375rem 0.75rem;border-radius:0.5rem;font:inherit;">Squad</a>
        <a href="#/stats" class="btn-secondary btn-sm" style="text-decoration:none;padding:0.375rem 0.75rem;border-radius:0.5rem;font:inherit;">Stats</a>
      </div>
      <div class="page-body">
        ${renderLive(live)}
        ${renderFinished(finished)}
        <div class="mt-2">
          <button class="btn-primary btn-full" id="new-match-btn">New match</button>
        </div>
        ${renderArchived(archived)}
      </div>`;

    el.querySelector('#new-match-btn').addEventListener('click', () => navigate('/new-match'));

    el.querySelectorAll('[data-archive]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        updateMatch(btn.dataset.archive, { archived: true });
        render();
      });
    });
    el.querySelectorAll('[data-unarchive]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        updateMatch(btn.dataset.unarchive, { archived: false });
        render();
      });
    });
  }

  function renderLive(live) {
    if (live.length === 0) return '';
    return `
      <p style="font-weight:600;margin-bottom:0.5rem;">Live</p>
      <ul class="item-list" style="margin-bottom:1rem;">
        ${live.map(m => {
          const tag = m.status === 'LIVE' ? '· LIVE' : '· HT';
          return `<li class="item-row">
            <a href="#/live-match/${m.id}" class="item-row-label" style="text-decoration:none;color:inherit;display:block;min-height:40px;line-height:40px;">
              ${escHtml(teamName)} ${m.goalsUs}–${m.goalsThem} ${escHtml(m.opponent)} <small style="color:#777;">${tag}</small>
            </a>
            <button class="btn-secondary btn-sm" data-archive="${m.id}" title="Archive">Archive</button>
          </li>`;
        }).join('')}
      </ul>`;
  }

  function renderFinished(finished) {
    if (finished.length === 0) return `<p class="empty-state">No finished matches yet.</p>`;
    return `<ul class="item-list">${finished.map(m => `
      <li class="item-row">
        ${matchSummary(m)}
        <button class="btn-secondary btn-sm" data-archive="${m.id}" title="Archive">Archive</button>
      </li>`).join('')}</ul>`;
  }

  function renderArchived(archived) {
    if (archived.length === 0) return '';
    return `
      <details style="margin-top:1.5rem;">
        <summary style="cursor:pointer;color:#555;font-size:0.875rem;padding:0.5rem 0;">Show archived (${archived.length})</summary>
        <ul class="item-list" style="margin-top:0.5rem;">
          ${archived.map(m => `
            <li class="item-row">
              ${matchSummary(m)}
              <button class="btn-secondary btn-sm" data-unarchive="${m.id}" title="Unarchive">Unarchive</button>
            </li>`).join('')}
        </ul>
      </details>`;
  }

  function matchSummary(m) {
    const potd = m.potdPlayerId ? playerMap[m.potdPlayerId] : null;
    const date = m.createdAt ? fmtDate(m.createdAt) : '';
    const ms = stintsByMatch.get(m.id) ?? [];
    const { half1, half2 } = keepersPerHalf(ms, m.halfLengthSec);
    const keeperLine = formatKeepers(half1, half2, playerMap);
    const statusTag = m.status === 'LIVE' ? ' · LIVE' : m.status === 'HALF_TIME' ? ' · HT' : '';
    return `<div class="item-row-label">
      ${escHtml(teamName)} ${m.goalsUs}–${m.goalsThem} ${escHtml(m.opponent)}<small style="color:#777;">${statusTag}</small>
      ${date ? `<br><small style="color:#777;">${date}</small>` : ''}
      ${keeperLine ? `<br><small style="color:#777;">🧤 ${keeperLine}</small>` : ''}
      ${potd ? `<br><small>· POTD: ${escHtml(potd.name)}</small>` : ''}
    </div>`;
  }

  render();
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
