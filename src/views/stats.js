import { getPlayers, getMatches, getStints } from '../repository.js';
import { computePlayerStats } from '../stats.js';

export function statsView() {
  const el = document.createElement('div');

  const players = getPlayers();
  const matches = getMatches();
  const stints = getStints();

  const ranked = computePlayerStats(players, matches, stints)
    .sort((a, b) =>
      b.potd - a.potd ||
      b.keeperHalves - a.keeperHalves ||
      a.name.localeCompare(b.name));

  const body = players.length === 0
    ? `<p class="empty-state">No players yet. Add some on the Squad screen.</p>`
    : `<ul class="item-list">${ranked.map(p => `
        <li class="item-row">
          <span class="item-row-label">${escHtml(p.name)}</span>
          <span class="btn-secondary btn-sm" style="pointer-events:none;" title="Player of the Day awards">⭐ ${p.potd}</span>
          <span class="btn-secondary btn-sm" style="pointer-events:none;" title="Halves played in goal">🧤 ${p.keeperHalves}</span>
        </li>`).join('')}</ul>`;

  el.innerHTML = `
    <div class="page-header">
      <a href="#/home" class="back-link">← Home</a>
      <h1>Stats</h1>
    </div>
    <div class="page-body">
      ${body}
    </div>`;

  return el;
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
