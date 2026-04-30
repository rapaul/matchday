import { getPlayers, getMatches } from '../repository.js';

export function potdHistoryView() {
  const el = document.createElement('div');

  const players = getPlayers();
  const matches = getMatches();

  const counts = new Map(players.map(p => [p.id, 0]));
  for (const m of matches) {
    if (m.status === 'FINISHED' && m.potdPlayerId && counts.has(m.potdPlayerId)) {
      counts.set(m.potdPlayerId, counts.get(m.potdPlayerId) + 1);
    }
  }

  const ranked = players
    .map(p => ({ ...p, count: counts.get(p.id) || 0 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const body = players.length === 0
    ? `<p class="empty-state">No players yet. Add some on the Squad screen.</p>`
    : `<ul class="item-list">${ranked.map(p => `
        <li class="item-row">
          <span class="item-row-label">${escHtml(p.name)}</span>
          <span class="btn-secondary btn-sm" style="pointer-events:none;">${p.count}</span>
        </li>`).join('')}</ul>`;

  el.innerHTML = `
    <div class="page-header">
      <a href="#/home" class="back-link">← Home</a>
      <h1>Player of the Day</h1>
    </div>
    <div class="page-body">
      ${body}
    </div>`;

  return el;
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
