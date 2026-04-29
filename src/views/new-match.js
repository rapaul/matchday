export function newMatchView() {
  const el = document.createElement('div');
  el.innerHTML = `
    <div class="page-header">
      <a href="#/home" class="back-link">← Home</a>
      <h1>New match</h1>
    </div>
    <div class="page-body">
      <p class="empty-state">New match — coming in M4.</p>
    </div>`;
  return el;
}
