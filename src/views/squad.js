export function squadView() {
  const el = document.createElement('div');
  el.innerHTML = `
    <div class="page-header">
      <a href="#/home" class="back-link">← Home</a>
      <h1>Squad</h1>
    </div>
    <div class="page-body">
      <p class="empty-state">Squad view — coming in M3.</p>
    </div>`;
  return el;
}
