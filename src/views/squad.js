import { getPlayers, addPlayer, updatePlayer, deletePlayer, getTeamName, setTeamName } from '../repository.js';

export function squadView() {
  const el = document.createElement('div');
  render();
  return el;

  function render() {
    const players = getPlayers();
    const teamName = getTeamName();
    el.innerHTML = `
      <div class="page-header">
        <a href="#/home" class="back-link">← Home</a>
        <h1>Squad</h1>
      </div>
      <div class="page-body">
        <label for="team-name" style="display:block;margin-bottom:0.5rem;">Team name</label>
        <input id="team-name" type="text" placeholder="Us" value="${escHtml(teamName)}"
          style="width:100%;padding:0.625rem;border:1px solid #ccc;border-radius:0.5rem;font:inherit;margin-bottom:1rem;"
          maxlength="40">
        ${players.length === 0
          ? `<p class="empty-state">No players yet. Add one below.</p>`
          : `<ul class="item-list" id="player-list">${players.map(p => playerRow(p)).join('')}</ul>`
        }
        <form id="add-form" class="mt-2" style="display:flex;gap:0.5rem;">
          <input id="player-name" type="text" placeholder="Player name"
            style="flex:1;padding:0.625rem;border:1px solid #ccc;border-radius:0.5rem;font:inherit;"
            required maxlength="40">
          <button type="submit" class="btn-primary">Add</button>
        </form>
      </div>`;

    el.querySelector('#team-name').addEventListener('blur', e => {
      setTeamName(e.target.value.trim());
    });

    el.querySelector('#add-form').addEventListener('submit', e => {
      e.preventDefault();
      const name = el.querySelector('#player-name').value.trim();
      if (!name) return;
      addPlayer(name);
      render();
    });

    el.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => startEdit(btn.dataset.edit));
    });

    el.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Delete this player?')) {
          deletePlayer(btn.dataset.delete);
          render();
        }
      });
    });
  }

  function playerRow(p) {
    return `<li class="item-row" data-player-id="${p.id}">
      <span class="item-row-label">${escHtml(p.name)}</span>
      <button class="btn-secondary btn-sm" data-edit="${p.id}">Rename</button>
      <button class="btn-danger btn-sm" data-delete="${p.id}">Delete</button>
    </li>`;
  }

  function startEdit(id) {
    const players = getPlayers();
    const p = players.find(pl => pl.id === id);
    if (!p) return;
    const li = el.querySelector(`[data-player-id="${id}"]`);
    li.innerHTML = `
      <input type="text" value="${escHtml(p.name)}" maxlength="40"
        style="flex:1;padding:0.375rem;border:1px solid #ccc;border-radius:0.5rem;font:inherit;">
      <button class="btn-primary btn-sm" data-save="${id}">Save</button>
      <button class="btn-secondary btn-sm" data-cancel>Cancel</button>`;
    li.querySelector('[data-save]').addEventListener('click', () => {
      const newName = li.querySelector('input').value.trim();
      if (newName) { updatePlayer(id, newName); }
      render();
    });
    li.querySelector('[data-cancel]').addEventListener('click', () => render());
    li.querySelector('input').select();
  }
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
