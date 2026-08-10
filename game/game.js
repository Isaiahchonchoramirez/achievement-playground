/* ==========================================================================
   Git Quest: Branchfall — browser wiring

   All the rules live in mission.js. This file only turns state into DOM and
   turns clicks into actions. Keeping the split strict is what lets the rules
   be tested in CI without a browser.

   Loaded as <script type="module">, so it is deferred automatically and does
   not block the contributor wall.
   ========================================================================== */

import {
  TASK,
  FEATURE_BRANCH,
  initialState,
  reduce,
  progress,
  availableActions,
  commitsOn,
  unmergedCommits,
} from './mission.js';

const STORAGE_KEY = 'git-quest-branchfall/v1';

/** Label, hint and keyboard shortcut for each workbench action. */
const BUTTONS = [
  { action: 'CREATE_BRANCH',  label: 'Create branch',  key: 'b', hint: 'Leave main' },
  { action: 'MAKE_CHANGE',    label: 'Make change',    key: 'c', hint: 'Write the code' },
  { action: 'COMMIT',         label: 'Commit',         key: 'm', hint: 'Record it' },
  { action: 'OPEN_PR',        label: 'Open pull request', key: 'p', hint: 'Propose it' },
  { action: 'RUN_VALIDATION', label: 'Run validation', key: 'v', hint: 'Automated checks' },
  { action: 'REQUEST_REVIEW', label: 'Request review', key: 'r', hint: 'Ask a human' },
  { action: 'MERGE',          label: 'Merge',          key: 'g', hint: 'Land on main' },
  { action: 'REVERT_MERGE',   label: 'Revert merge',   key: 'z', hint: 'Undo a bad merge', danger: true },
];

/** The action the player most likely wants next, for visual emphasis. */
const PRIORITY = [
  'REVERT_MERGE', 'MERGE', 'REQUEST_REVIEW', 'RUN_VALIDATION',
  'OPEN_PR', 'COMMIT', 'MAKE_CHANGE', 'CREATE_BRANCH',
];

const root = document.getElementById('quest');
if (root) start(root);

function start(mount) {
  let state = load() || initialState();
  let previousIds = new Set(state.commits.map((c) => c.id));

  mount.innerHTML = '';
  mount.append(buildLayout());

  const el = {
    actions:   mount.querySelector('#quest-actions'),
    graph:     mount.querySelector('#quest-graph'),
    graphDesc: mount.querySelector('#quest-graph-desc'),
    chips:     mount.querySelector('#quest-chips'),
    steps:     mount.querySelector('#quest-steps'),
    feedback:  mount.querySelector('#quest-feedback'),
    restart:   mount.querySelector('#quest-restart'),
  };

  el.actions.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (button && !button.disabled) dispatch(button.dataset.action);
  });

  el.restart.addEventListener('click', () => {
    dispatch('RESTART');
    el.actions.querySelector('button:not(:disabled)')?.focus();
  });

  // Keyboard shortcuts, ignored while the player is typing somewhere else.
  document.addEventListener('keydown', (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
    const match = BUTTONS.find((b) => b.key === event.key.toLowerCase());
    if (!match) return;
    if (!availableActions(state).includes(match.action)) return;
    event.preventDefault();
    dispatch(match.action);
  });

  function dispatch(action) {
    previousIds = new Set(state.commits.map((c) => c.id));
    state = reduce(state, action);
    save(state);
    render();
  }

  function render() {
    const allowed = new Set(availableActions(state));
    const primary = PRIORITY.find((a) => allowed.has(a));

    // --- workbench ---
    for (const spec of BUTTONS) {
      const button = el.actions.querySelector(`button[data-action="${spec.action}"]`);
      const enabled = allowed.has(spec.action);
      button.disabled = !enabled;
      button.dataset.primary = String(spec.action === primary);
      button.hidden = spec.action === 'REVERT_MERGE' && !state.mainBroken;
    }

    // --- status chips ---
    el.chips.replaceChildren(...statusChips(state).map(({ text, tone }) => {
      const li = document.createElement('li');
      li.className = 'quest-chip';
      if (tone) li.dataset.tone = tone;
      li.textContent = text;
      return li;
    }));

    // --- graph ---
    drawGraph(el.graph, state, previousIds);
    el.graphDesc.textContent = describeGraph(state);

    // --- checklist ---
    el.steps.replaceChildren(...progress(state).map(({ label, done }) => {
      const li = document.createElement('li');
      li.className = 'quest-step';
      li.dataset.done = String(done);
      const text = document.createElement('span');
      text.textContent = label;
      li.append(text);
      const sr = document.createElement('span');
      sr.className = 'visually-hidden';
      sr.textContent = done ? ' — done' : ' — not done';
      li.append(sr);
      return li;
    }));

    // --- feedback ---
    el.feedback.replaceChildren();
    const fb = state.feedback;
    if (fb) {
      el.feedback.dataset.tone = fb.tone;
      const h = document.createElement('h4');
      h.textContent = fb.title;
      const p = document.createElement('p');
      p.textContent = fb.body;
      el.feedback.append(h, p);
      if (fb.next) {
        const nextLine = document.createElement('p');
        nextLine.className = 'quest-next';
        nextLine.textContent = fb.next;
        el.feedback.append(nextLine);
      }
      if (state.outcome && state.incidents.length > 0) {
        const heading = document.createElement('p');
        heading.className = 'quest-next';
        heading.textContent = 'On the record for this run:';
        const list = document.createElement('ul');
        list.className = 'quest-incidents';
        for (const incident of state.incidents) {
          const li = document.createElement('li');
          li.textContent = incident;
          list.append(li);
        }
        el.feedback.append(heading, list);
      }
      el.feedback.hidden = false;
    } else {
      el.feedback.dataset.tone = '';
      el.feedback.hidden = true;
    }
  }

  render();
}

/* -------------------------------------------------------------------------- */
/* Rendering helpers                                                          */
/* -------------------------------------------------------------------------- */

function statusChips(state) {
  const chips = [{ text: `on ${state.currentBranch}` }];
  chips.push(state.dirty
    ? { text: 'uncommitted change', tone: 'warn' }
    : { text: 'working tree clean', tone: 'ok' });
  if (state.pr) chips.push({ text: 'pull request open', tone: 'ok' });
  if (state.checks === 'passed') chips.push({ text: 'checks passed', tone: 'ok' });
  if (state.checks === 'stale') chips.push({ text: 'checks stale', tone: 'warn' });
  if (state.review === 'approved') chips.push({ text: 'approved', tone: 'ok' });
  if (state.mainBroken) chips.push({ text: 'main is broken', tone: 'error' });
  return chips;
}

/** A plain-language description of the graph, for screen readers. */
function describeGraph(state) {
  const main = commitsOn(state, 'main');
  const parts = [`main has ${main.length} commit${main.length === 1 ? '' : 's'}.`];
  if (state.featureBranch) {
    const ahead = unmergedCommits(state).length;
    parts.push(ahead === 0
      ? `Branch ${FEATURE_BRANCH} exists with nothing new on it yet.`
      : `Branch ${FEATURE_BRANCH} is ${ahead} commit${ahead === 1 ? '' : 's'} ahead of main.`);
  }
  parts.push(`You are on ${state.currentBranch}.`);
  if (state.dirty) parts.push('There is an uncommitted change in the working tree.');
  return parts.join(' ');
}

/**
 * Draw the commit graph as SVG. Two lanes: main on the left, the feature
 * branch on the right. Deliberately simple — this is a teaching diagram, not
 * a general-purpose DAG renderer.
 */
function drawGraph(svg, state, previousIds) {
  const NS = 'http://www.w3.org/2000/svg';
  const LANE_X = { main: 46, feature: 150 };
  const ROW = 58;
  const TOP = 30;

  const ordered = state.commits.slice();
  const rowOf = new Map(ordered.map((c, i) => [c.id, i]));
  const height = TOP + ordered.length * ROW;

  // Size the canvas to its longest label so nothing is clipped. Monospace at
  // 11px is close enough to 6.7px per character for a layout estimate.
  const tips = Object.entries(state.branches);
  const widest = Math.max(
    ...ordered.map((c) => c.message.length * 6.7),
    ...tips.map(([branch]) => branch.length * 6.2),
    ...['uncommitted change'.length * 6.2],
  );
  const width = Math.ceil(Math.max(300, LANE_X.feature + 18 + widest + 16));

  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.replaceChildren();

  const make = (name, attrs) => {
    const node = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    return node;
  };

  const xy = (commit) => ({
    x: LANE_X[commit.lane] ?? LANE_X.main,
    y: TOP + rowOf.get(commit.id) * ROW,
  });

  // Edges first, so nodes sit on top of them.
  for (const commit of ordered) {
    const to = xy(commit);
    for (const parentId of commit.parents) {
      const parent = ordered.find((c) => c.id === parentId);
      if (!parent) continue;
      const from = xy(parent);
      const path = from.x === to.x
        ? `M ${from.x} ${from.y} L ${to.x} ${to.y}`
        : `M ${from.x} ${from.y} C ${from.x} ${(from.y + to.y) / 2}, ` +
          `${to.x} ${(from.y + to.y) / 2}, ${to.x} ${to.y}`;
      svg.append(make('path', { class: 'quest-edge', d: path }));
    }
  }

  const tipOf = {};
  for (const [branch, id] of Object.entries(state.branches)) {
    (tipOf[id] = tipOf[id] || []).push(branch);
  }

  for (const commit of ordered) {
    const { x, y } = xy(commit);
    const isMerge = commit.parents.length > 1;

    if (state.branches[state.currentBranch] === commit.id) {
      svg.append(make('circle', { class: 'quest-head-ring', cx: x, cy: y, r: 15 }));
    }

    const node = make('circle', {
      class: 'quest-node', cx: x, cy: y, r: 9,
      'data-lane': commit.lane, 'data-merge': String(isMerge),
    });
    if (!previousIds.has(commit.id)) node.setAttribute('data-new', 'true');
    svg.append(node);

    const label = make('text', { class: 'quest-node-label', x: x + 18, y: y - 1 });
    label.textContent = commit.message;
    svg.append(label);

    const branches = tipOf[commit.id];
    if (branches) {
      const tag = make('text', { class: 'quest-branch-tag', x: x + 18, y: y + 12 });
      tag.textContent = branches.join(', ');
      svg.append(tag);
    }
  }

  if (state.dirty) {
    const tip = ordered.find((c) => c.id === state.branches[state.currentBranch]);
    if (tip) {
      const { x, y } = xy(tip);
      svg.append(make('circle', {
        class: 'quest-node', cx: x, cy: y - ROW / 2, r: 5,
        'data-lane': tip.lane, 'stroke-dasharray': '2 2',
      }));
      const t = make('text', { class: 'quest-node-sub', x: x + 14, y: y - ROW / 2 + 4 });
      t.textContent = 'uncommitted change';
      svg.append(t);
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Markup                                                                     */
/* -------------------------------------------------------------------------- */

function buildLayout() {
  const frag = document.createDocumentFragment();
  const layout = document.createElement('div');
  layout.className = 'quest-layout';

  // ---- left column: task + workbench ----
  const left = document.createElement('div');
  left.style.display = 'grid';
  left.style.gap = 'var(--space-4)';

  const task = document.createElement('section');
  task.className = 'quest-panel quest-task';
  task.setAttribute('aria-labelledby', 'quest-task-h');
  task.innerHTML = `<h3 id="quest-task-h">Your task</h3><h4></h4><p></p>`;
  task.querySelector('h4').textContent = TASK.title;
  task.querySelector('p').textContent = TASK.body;
  const accept = document.createElement('ul');
  accept.className = 'quest-accept';
  for (const item of TASK.acceptance) {
    const li = document.createElement('li');
    li.append(document.createTextNode(item));
    accept.append(li);
  }
  task.append(accept);

  const bench = document.createElement('section');
  bench.className = 'quest-panel';
  bench.setAttribute('aria-labelledby', 'quest-bench-h');
  const benchTitle = document.createElement('h3');
  benchTitle.id = 'quest-bench-h';
  benchTitle.textContent = 'Workbench';
  const actions = document.createElement('div');
  actions.className = 'quest-actions';
  actions.id = 'quest-actions';
  for (const spec of BUTTONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quest-action';
    button.dataset.action = spec.action;
    if (spec.danger) button.dataset.danger = 'true';
    const label = document.createElement('span');
    label.textContent = spec.label;
    const key = document.createElement('span');
    key.className = 'quest-key';
    key.textContent = `${spec.hint} · ${spec.key.toUpperCase()}`;
    button.append(label, key);
    actions.append(button);
  }
  bench.append(benchTitle, actions);

  left.append(task, bench);

  // ---- right column: graph, state, checklist, feedback ----
  const right = document.createElement('section');
  right.className = 'quest-panel';
  right.setAttribute('aria-labelledby', 'quest-repo-h');

  const repoTitle = document.createElement('h3');
  repoTitle.id = 'quest-repo-h';
  repoTitle.textContent = 'Simulated repository';

  const chips = document.createElement('ul');
  chips.className = 'quest-chips';
  chips.id = 'quest-chips';

  const graphWrap = document.createElement('div');
  graphWrap.className = 'quest-graph-wrap';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'quest-graph');
  svg.setAttribute('id', 'quest-graph');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-describedby', 'quest-graph-desc');
  graphWrap.append(svg);

  const desc = document.createElement('p');
  desc.className = 'visually-hidden';
  desc.id = 'quest-graph-desc';

  const stepsTitle = document.createElement('h3');
  stepsTitle.textContent = 'Mission progress';
  stepsTitle.style.marginTop = 'var(--space-6)';
  const steps = document.createElement('ol');
  steps.className = 'quest-steps';
  steps.id = 'quest-steps';

  const feedback = document.createElement('div');
  feedback.className = 'quest-feedback';
  feedback.id = 'quest-feedback';
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  feedback.hidden = true;

  const footer = document.createElement('div');
  footer.className = 'quest-footer';
  const note = document.createElement('p');
  note.className = 'quest-note';
  note.textContent = 'Simulated only — this never runs a real Git command.';
  const restart = document.createElement('button');
  restart.type = 'button';
  restart.className = 'quest-restart';
  restart.id = 'quest-restart';
  restart.textContent = 'Restart mission';
  footer.append(note, restart);

  right.append(repoTitle, chips, graphWrap, desc, stepsTitle, steps, feedback, footer);

  layout.append(left, right);
  frag.append(layout);
  return frag;
}

/* -------------------------------------------------------------------------- */
/* Local persistence — localStorage only, never a cookie or a network call    */
/* -------------------------------------------------------------------------- */

function save(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing or a full quota. Progress just will not persist.
  }
}

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Only trust a shape we recognise; anything else starts fresh.
    if (!parsed || !Array.isArray(parsed.commits) || !parsed.branches?.main) return null;
    return parsed;
  } catch {
    return null;
  }
}
