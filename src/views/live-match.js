export function liveMatchView({ id }) {
  const el = document.createElement('div');
  el.innerHTML = `
    <div class="page-header">
      <a href="#/home" class="back-link">← Home</a>
      <h1>Live match</h1>
    </div>
    <div class="page-body">
      <p class="empty-state">Live match (id: ${id}) — coming in M4.</p>
    </div>`;
  return el;
}
