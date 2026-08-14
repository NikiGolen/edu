// ---------------------------------------------------------------
// Software Map — renders data/taxonomy.json into clickable cards.
// To add/edit content: edit data/taxonomy.json (structure) and/or
// content/<id>.md (long-form writeup, optional, keyed by node id).
// No changes to this file are needed to expand the taxonomy.
// ---------------------------------------------------------------

const state = {
  tree: null,       // full taxonomy root
  path: [],         // array of node objects representing drill-down path
};

const els = {
  app: document.getElementById('app'),
  crumbs: document.getElementById('crumbs'),
  panel: document.getElementById('panel'),
  panelContent: document.getElementById('panel-content'),
  panelOverlay: document.getElementById('panel-overlay'),
  panelClose: document.getElementById('panel-close'),
};

init();

async function init() {
  const res = await fetch('data/taxonomy.json');
  state.tree = await res.json();
  render();
  els.panelClose.addEventListener('click', closePanel);
  els.panelOverlay.addEventListener('click', closePanel);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });
}

// current level = last node in path, or root
function currentLevel() {
  return state.path.length ? state.path[state.path.length - 1] : state.tree;
}

function render() {
  renderCrumbs();
  renderGrid();
}

function renderCrumbs() {
  els.crumbs.innerHTML = '';
  const rootBtn = document.createElement('button');
  rootBtn.textContent = state.tree.title.toUpperCase();
  rootBtn.addEventListener('click', () => {
    state.path = [];
    render();
  });
  els.crumbs.appendChild(rootBtn);

  state.path.forEach((node, i) => {
    const sep = document.createElement('span');
    sep.className = 'sep';
    sep.textContent = '/';
    els.crumbs.appendChild(sep);

    if (i === state.path.length - 1) {
      const span = document.createElement('span');
      span.className = 'current';
      span.textContent = `${node.id} ${node.title}`;
      els.crumbs.appendChild(span);
    } else {
      const btn = document.createElement('button');
      btn.textContent = `${node.id} ${node.title}`;
      btn.addEventListener('click', () => {
        state.path = state.path.slice(0, i + 1);
        render();
      });
      els.crumbs.appendChild(btn);
    }
  });
}

function renderGrid() {
  const level = currentLevel();
  els.app.innerHTML = '';

  const label = document.createElement('div');
  label.className = 'tier-label';
  label.textContent = state.path.length
    ? `Contents of ${level.id} — ${level.title}`
    : 'Top-level categories';
  els.app.appendChild(label);

  const grid = document.createElement('div');
  grid.className = 'grid';

  const children = level.children || [];
  if (!children.length) {
    const note = document.createElement('p');
    note.className = 'empty-note';
    note.textContent = 'No sub-items yet — add them under this node in data/taxonomy.json.';
    els.app.appendChild(note);
    return;
  }

  children.forEach((node) => {
    grid.appendChild(makeCard(node));
  });

  els.app.appendChild(grid);
}

function makeCard(node) {
  const btn = document.createElement('button');
  btn.className = 'node-card';

  const idEl = document.createElement('div');
  idEl.className = 'node-id';
  idEl.textContent = `§ ${node.id}`;
  btn.appendChild(idEl);

  const titleEl = document.createElement('div');
  titleEl.className = 'node-title';
  titleEl.textContent = node.title;
  btn.appendChild(titleEl);

  if (node.subtitle) {
    const subEl = document.createElement('div');
    subEl.className = 'node-subtitle';
    subEl.textContent = node.subtitle;
    btn.appendChild(subEl);
  }

  if (node.children && node.children.length) {
    const count = document.createElement('span');
    count.className = 'node-child-count';
    count.textContent = node.children.length;
    btn.appendChild(count);
  }

  btn.addEventListener('click', () => openNode(node));
  return btn;
}

// Clicking a card opens the detail panel (summary + optional long-form
// markdown + list of children, which are themselves clickable to drill in).
async function openNode(node) {
  openPanel();
  els.panelContent.innerHTML = renderPanelSkeleton(node);

  const prose = els.panelContent.querySelector('.prose');
  const md = await tryFetchContent(node.id);
  if (md) {
    prose.innerHTML = marked.parse(md);
  } else if (!node.summary) {
    prose.outerHTML = '<p class="empty-note">No write-up yet — add content/' + node.id + '.md to expand this entry.</p>';
  }
  // else: summary was already rendered by renderPanelSkeleton — leave it in place

  const childWrap = els.panelContent.querySelector('.panel-children');
  if (node.children && node.children.length) {
    node.children.forEach((child) => {
      const row = document.createElement('button');
      row.className = 'panel-child-row';
      row.innerHTML = `<span class="panel-child-id">§ ${child.id}</span><span class="panel-child-title">${child.title}</span>`;
      row.addEventListener('click', () => {
        drillTo(node);
        openNode(child);
      });
      childWrap.appendChild(row);
    });
  } else if (childWrap) {
    childWrap.remove();
  }
}

function renderPanelSkeleton(node) {
  return `
    <span class="node-id">§ ${node.id}</span>
    <h2>${node.title}</h2>
    ${node.subtitle ? `<div class="panel-subtitle">${node.subtitle}</div>` : ''}
    <div class="prose">${node.summary ? `<p>${node.summary}</p>` : ''}</div>
    <div class="panel-children">
      <div class="panel-children-label">Sub-items</div>
    </div>
  `;
}

// sets the breadcrumb path to include this node's ancestors so the
// board behind the panel matches where the user drilled to
function drillTo(node) {
  // find path from root to node by id prefix matching (e.g. "1.1" under "1")
  const path = [];
  function search(list, trail) {
    for (const n of list) {
      const newTrail = [...trail, n];
      if (n.id === node.id) {
        path.push(...newTrail);
        return true;
      }
      if (n.children && search(n.children, newTrail)) return true;
    }
    return false;
  }
  search(state.tree.children, []);
  state.path = path;
  render();
}

async function tryFetchContent(id) {
  try {
    const res = await fetch(`content/${id}.md`);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function openPanel() {
  els.panel.classList.add('open');
  els.panelOverlay.classList.add('open');
  els.panel.setAttribute('aria-hidden', 'false');
}

function closePanel() {
  els.panel.classList.remove('open');
  els.panelOverlay.classList.remove('open');
  els.panel.setAttribute('aria-hidden', 'true');
}