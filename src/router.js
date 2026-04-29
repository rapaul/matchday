const routes = {};

export function addRoute(path, viewFn) {
  routes[path] = viewFn;
}

function getPath() {
  const hash = location.hash.slice(1) || '/home';
  // strip trailing slash except root
  return hash.endsWith('/') && hash.length > 1 ? hash.slice(0, -1) : hash;
}

function matchRoute(path) {
  if (routes[path]) return { fn: routes[path], params: {} };
  // parameterised match e.g. /live-match/:id
  for (const pattern of Object.keys(routes)) {
    const parts = pattern.split('/');
    const incoming = path.split('/');
    if (parts.length !== incoming.length) continue;
    const params = {};
    const ok = parts.every((p, i) => {
      if (p.startsWith(':')) { params[p.slice(1)] = incoming[i]; return true; }
      return p === incoming[i];
    });
    if (ok) return { fn: routes[pattern], params };
  }
  return null;
}

export function navigate(path) {
  location.hash = path;
}

export function startRouter(appEl) {
  function render() {
    const path = getPath();
    const match = matchRoute(path);
    if (match) {
      appEl.innerHTML = '';
      appEl.appendChild(match.fn(match.params));
    } else {
      appEl.innerHTML = `<div class="page-body"><p class="empty-state">404 — not found</p></div>`;
    }
  }
  window.addEventListener('hashchange', render);
  render();
}
