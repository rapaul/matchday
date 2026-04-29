export function homeView() {
  const el = document.createElement('div');
  el.innerHTML = `
    <div class="page-header"><h1>Match Tracker</h1></div>
    <div class="page-body">
      <p class="empty-state">No matches yet.</p>
      <div class="mt-2">
        <a href="#/squad" class="btn-secondary btn-sm" style="text-decoration:none;padding:0.375rem 0.75rem;border-radius:0.5rem;font:inherit;display:inline-block;">Squad</a>
        <a href="#/new-match" class="btn-primary btn-sm mt-1" style="text-decoration:none;padding:0.375rem 0.75rem;border-radius:0.5rem;font:inherit;color:#fff;background:#6c3fc5;display:inline-block;margin-left:0.5rem;">New match</a>
      </div>
    </div>`;
  return el;
}
