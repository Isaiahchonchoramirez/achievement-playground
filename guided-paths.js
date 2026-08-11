import { guidedPaths, getGuidedPath, validateGuidedPaths } from './data/guided-paths.js';

export const MODES = Object.freeze([
  { id: 'shell', label: 'macOS / Linux' }, { id: 'powershell', label: 'PowerShell' },
  { id: 'gh', label: 'GitHub CLI' }, { id: 'website', label: 'GitHub website' },
]);
export const PROGRESS_STATES = Object.freeze(['guide read', 'practice completed', 'real workflow completed', 'awaiting verification', 'verified']);
const STORAGE_KEY = 'achievement-playground:guided-progress:v1';
const MODE_KEY = 'achievement-playground:guide-mode:v1';
const state = { path: null, mode: safeRead(MODE_KEY) || 'shell', commandIndex: 0, values: {}, evidence: [], visualIndex: 0 };

function route() {
  const id = new URLSearchParams(location.search).get('achievement');
  state.path = getGuidedPath(id);
  state.commandIndex = 0; state.values = {}; state.evidence = []; state.visualIndex = 0;
  render();
}

function buildNavigation() {
  const nav = document.getElementById('path-nav');
  nav.replaceChildren(...guidedPaths.map((path) => {
    const link = document.createElement('a');
    link.href = `paths.html?achievement=${encodeURIComponent(path.id)}`;
    link.dataset.pathId = path.id;
    link.innerHTML = `<span aria-hidden="true"></span><b></b><small></small>`;
    link.querySelector('span').textContent = path.name.split(' ').map((word) => word[0]).join('').slice(0, 3);
    link.querySelector('b').textContent = path.name;
    link.querySelector('small').textContent = path.statusLabel;
    link.addEventListener('click', (event) => { event.preventDefault(); history.pushState({}, '', link.href); route(); window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }); });
    return link;
  }));
}

function render() {
  const path = state.path;
  document.title = `${path.name} guided path · Achievement Playground`;
  document.querySelectorAll('[data-path-id]').forEach((link) => link.toggleAttribute('aria-current', link.dataset.pathId === path.id));
  setText('[data-path-source]', path.label); setText('[data-path-title]', path.name); setText('[data-path-summary]', path.recognizes);
  setText('[data-path-status]', path.statusLabel); setText('[data-path-difficulty]', path.difficulty); setText('[data-path-effort]', path.effort);
  setText('[data-path-dependency]', path.dependency); setText('[data-path-notice]', path.ethicalNotice);
  const references = document.querySelector('[data-path-references]'); references.replaceChildren(...path.references.map((reference) => { const li = document.createElement('li'); const anchor = document.createElement('a'); anchor.href = reference.href; anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; anchor.textContent = reference.label; li.append(anchor); return li; }));
  renderList('[data-path-prerequisites]', path.prerequisites); renderList('[data-path-workflow]', path.workflow);
  renderList('[data-path-verify]', path.verify); renderList('[data-path-troubleshoot]', path.troubleshoot);
  const practice = document.querySelector('[data-practice-link]');
  practice.href = path.mission ? `index.html#practice?mission=${encodeURIComponent(path.mission)}` : 'index.html#practice';
  practice.textContent = path.mission ? 'Practice this path in Branchfall' : 'Explore Branchfall practice';
  renderVisual(); renderModeTabs(); renderWorkbench(); renderProgress(); renderEvidence();
}

function renderModeTabs() {
  const tabs = document.querySelector('[data-mode-tabs]');
  tabs.replaceChildren(...MODES.map((mode) => {
    const button = document.createElement('button'); button.type = 'button'; button.role = 'tab';
    button.textContent = mode.label; button.dataset.mode = mode.id; button.setAttribute('aria-selected', String(mode.id === state.mode));
    button.addEventListener('click', () => { state.mode = mode.id; safeWrite(MODE_KEY, mode.id); state.commandIndex = 0; renderModeTabs(); renderWorkbench(); });
    button.addEventListener('keydown', tabKeys); return button;
  }));
}

function renderWorkbench() {
  const host = document.querySelector('[data-command-workbench]');
  const commands = state.path.commands.filter((step) => step.variants[state.mode]);
  if (!commands.length) { host.innerHTML = `<div class="no-command"><strong>No terminal procedure belongs here.</strong><p>${state.path.status === 'historical' || state.path.status === 'unavailable' ? 'This is a museum exhibit, not an earning recipe.' : 'Use the GitHub interface and the judgment steps above.'}</p></div>`; return; }
  state.commandIndex = Math.min(state.commandIndex, commands.length - 1);
  const step = commands[state.commandIndex];
  host.replaceChildren();
  const head = el('div', 'command-head'); head.innerHTML = `<div><span></span><h4></h4><p></p></div><div class="step-nav"><button type="button" data-prev aria-label="Previous command">←</button><button type="button" data-next aria-label="Next command">→</button></div>`;
  head.querySelector('span').textContent = `Step ${state.commandIndex + 1} of ${commands.length}`; head.querySelector('h4').textContent = step.title; head.querySelector('p').textContent = step.changes;
  head.querySelector('[data-prev]').disabled = state.commandIndex === 0; head.querySelector('[data-next]').disabled = state.commandIndex === commands.length - 1;
  head.querySelector('[data-prev]').onclick = () => { state.commandIndex -= 1; renderWorkbench(); };
  head.querySelector('[data-next]').onclick = () => { state.commandIndex += 1; renderWorkbench(); };
  host.append(head);
  if (step.placeholders.length) host.append(buildPlaceholders(step));
  if (state.path.requiresContributorConfirmation && state.path.id === 'pair-extraordinaire') host.append(buildContributorConfirmation());
  const codeBox = el('div', 'command-box'); const pre = document.createElement('pre'); const code = document.createElement('code');
  code.textContent = buildCommand(step); pre.append(code); const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'copy-button'; copy.textContent = 'Copy'; copy.setAttribute('aria-label', `Copy ${step.title} command`);
  copy.disabled = !canCopy(step); copy.onclick = async () => { await navigator.clipboard.writeText(buildCommand(step)); copy.textContent = 'Copied'; setTimeout(() => { copy.textContent = 'Copy'; }, 1600); };
  codeBox.append(pre, copy); host.append(codeBox);
  if (step.expected) host.append(note('Expected', step.expected)); if (step.recovery) host.append(note('Safe recovery', step.recovery));
  const warning = el('p', 'paste-warning'); warning.textContent = 'Pause before pasting: confirm the repository, branch, and effect match your intent.'; host.append(warning);
}

function buildPlaceholders(step) {
  const box = el('fieldset', 'placeholder-fields'); const legend = document.createElement('legend'); legend.textContent = 'Complete the placeholders'; box.append(legend);
  step.placeholders.forEach((name) => { const label = document.createElement('label'); const span = document.createElement('span'); span.textContent = placeholderHelp(name); const input = document.createElement('input'); input.type = 'text'; input.autocomplete = 'off'; input.placeholder = `<${name}>`; input.value = state.values[name] || ''; input.dataset.placeholder = name; input.setAttribute('aria-label', placeholderHelp(name)); input.addEventListener('input', () => { state.values[name] = input.value.slice(0, 300); refreshCommandPreview(box.closest('[data-command-workbench]'), step); }); label.append(span, input); box.append(label); }); return box;
}

function buildContributorConfirmation() {
  const label = el('label', 'contributor-confirm'); const input = document.createElement('input'); input.type = 'checkbox'; input.checked = state.values.contributorConfirmed === true;
  input.addEventListener('change', () => { state.values.contributorConfirmed = input.checked; refreshCommandPreview(label.closest('[data-command-workbench]'), currentStep()); }); label.append(input, document.createTextNode('I confirm this person genuinely contributed to this commit.')); return label;
}

function currentStep() { return state.path.commands.filter((step) => step.variants[state.mode])[state.commandIndex]; }
function refreshCommandPreview(host, step) { if (!host || !step) return; host.querySelector('.command-box code').textContent = buildCommand(step); host.querySelector('.copy-button').disabled = !canCopy(step); }

export function quoteForMode(value, mode) {
  const clean = String(value).replace(/[\r\n\0]/g, ' ').trim();
  if (mode === 'website') return clean;
  if (mode === 'powershell') return `'${clean.replaceAll("'", "''")}'`;
  return `'${clean.replaceAll("'", `'"'"'`)}'`;
}

export function interpolateCommand(template, values, mode) {
  return template.replace(/<([a-z-]+)>/g, (_, name) => {
    let value = values[name] || `<${name}>`;
    if (name === 'coauthor-trailer') value = `Co-authored-by: ${values['collaborator-name'] || '<collaborator-name>'} <${values['collaborator-email'] || '<collaborator-email>'}>`;
    return value.startsWith('<') && value.endsWith('>') ? value : quoteForMode(value, mode);
  });
}

function buildCommand(step) { return interpolateCommand(step.variants[state.mode], state.values, state.mode); }
function canCopy(step) { return step.placeholders.every((name) => validPlaceholder(name, state.values[name])) && (!state.path.requiresContributorConfirmation || state.values.contributorConfirmed === true); }
export function validPlaceholder(name, value) {
  if (!value || value.length > 300 || /[\r\n\0]/.test(value)) return false;
  if (name === 'repository-url') return /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/.test(value);
  if (name === 'branch-name') return /^(?![./-])(?!.*\.\.)(?!.*\/$)[A-Za-z0-9._/-]+$/.test(value);
  if (name.includes('number')) return /^\d+$/.test(value);
  if (name === 'collaborator-email') return /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value);
  if (name === 'release-version') return /^v?\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/.test(value);
  return value.trim().length >= 2;
}

export function isValidGitHubEvidence(value) {
  try { const url = new URL(value); if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.username || url.password) return false;
    return /^\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+\/(?:pull|issues|commit|discussions)\/[^/?#]+)?\/?$/.test(url.pathname) && (url.pathname.split('/').length > 4 || url.searchParams.get('tab') === 'achievements');
  } catch { return false; }
}

function renderEvidence() { const input = document.getElementById('evidence-url'); input.value = ''; input.removeAttribute('aria-invalid'); const help = document.getElementById('evidence-help'); help.textContent = 'Accepted: public GitHub pull request, issue, commit, Discussion, or profile achievement URLs. The URL stays in this tab and is never fetched or saved.'; const list = document.querySelector('[data-evidence-list]'); list.replaceChildren(...state.evidence.map((href) => { const li = document.createElement('li'); const a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = href; li.append(a); return li; })); const add = document.querySelector('[data-add-evidence]'); add.onclick = () => { const value = input.value.trim(); input.setAttribute('aria-invalid', String(!isValidGitHubEvidence(value))); if (!isValidGitHubEvidence(value)) { help.textContent = 'Use a public HTTPS github.com PR, issue, commit, Discussion, or profile achievements URL.'; return; } state.evidence.push(value); renderEvidence(); }; }

const VISUALS = {
  'pull-request': ['Open a pull request', 'Compare the correct base and feature branch', 'Read the changed-files summary', 'Create the proposal only when it is review-ready'],
  reviews: ['Check reviews and checks', 'Read every submitted review state', 'Confirm required checks are green', 'Resolve actionable threads before merging'],
  merge: ['Merge through the normal process', 'Confirm the merge method', 'Do not use admin bypass', 'Record the resulting merge commit'],
  issue: ['Create and close a useful issue', 'Describe a reproducible problem', 'Link the resolving work', 'Compare public timestamps after closure'],
  contributors: ['Inspect commit contributors', 'Open the finished commit', 'Confirm both linked identities appear', 'Correct the email before relying on credit'],
  discussion: ['Answer a Discussion', 'Address the exact question', 'Explain steps and uncertainty', 'Let an authorized person choose the accepted answer'],
  profile: ['Check visible profile achievements', 'Open the public profile', 'Inspect the Achievements section', 'Treat absence as pending, not proof of failure'],
  sponsor: ['Review sponsorship information', 'Compare one-time and monthly tiers', 'Read billing and cancellation terms', 'Leave without paying unless you independently choose to continue'],
  museum: ['Read the exhibit', 'Check the event date and primary source', 'Separate historical recognition from active achievements', 'Do not follow invented earning procedures'],
};

function renderVisual() { const keys = Array.isArray(state.path.visual) ? state.path.visual : [state.path.visual || 'museum']; const tabs = document.querySelector('[data-visual-tabs]'); state.visualIndex = Math.min(state.visualIndex, keys.length - 1); tabs.replaceChildren(...keys.map((key, index) => { const button = document.createElement('button'); button.type = 'button'; button.role = 'tab'; button.textContent = VISUALS[key][0]; button.setAttribute('aria-selected', String(index === state.visualIndex)); button.onclick = () => { state.visualIndex = index; renderVisual(); }; button.addEventListener('keydown', tabKeys); return button; })); const [title, ...calls] = VISUALS[keys[state.visualIndex]]; const host = document.querySelector('[data-path-visual]'); host.innerHTML = `<figure class="interface-visual"><div class="interface-chrome"><div class="chrome-bar" aria-hidden="true"><i></i><i></i><i></i><span>github.com / illustrated walkthrough</span></div><div class="interface-content"><div class="fake-sidebar" aria-hidden="true"><b>Repository</b><span>Code</span><span>Issues</span><span>Pull requests</span><span>Discussions</span></div><div class="fake-panel"><span class="illustration-label">Original illustration · not a live interface</span><h4></h4><ol></ol></div></div></div><figcaption></figcaption></figure>`; host.querySelector('h4').textContent = title; const list = host.querySelector('ol'); calls.forEach((text, index) => { const li = document.createElement('li'); li.innerHTML = `<b>${index + 1}</b><span></span>`; li.querySelector('span').textContent = text; list.append(li); }); host.querySelector('figcaption').textContent = `${title}: ${calls.join('. ')}.`; host.querySelector('figure').setAttribute('aria-label', `${title} annotated interface illustration`); }

function renderProgress() { const saved = loadProgress(); const current = saved[state.path.id] || ''; const host = document.querySelector('[data-progress-options]'); host.replaceChildren(...PROGRESS_STATES.map((label) => { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.dataset.active = String(label === current); button.setAttribute('aria-pressed', String(label === current)); button.onclick = () => { const next = loadProgress(); next[state.path.id] = label; localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); document.querySelector('[data-progress-message]').textContent = `${state.path.name}: ${label}. Saved only in this browser.`; renderProgress(); }; return button; })); }
function loadProgress() { try { const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}; } catch { return {}; } }
function safeRead(key) { try { return localStorage.getItem(key); } catch { return null; } } function safeWrite(key, value) { try { localStorage.setItem(key, value); } catch { /* preference remains in memory */ } }
function reducedMotion() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
function setText(selector, text) { document.querySelector(selector).textContent = text; }
function renderList(selector, items) { const host = document.querySelector(selector); host.replaceChildren(...items.map((text) => { const li = document.createElement('li'); li.textContent = text; return li; })); }
function el(tag, className) { const node = document.createElement(tag); node.className = className; return node; }
function note(label, text) { const box = el('div', 'command-note'); const strong = document.createElement('strong'); strong.textContent = label; const p = document.createElement('p'); p.textContent = text; box.append(strong, p); return box; }
function placeholderHelp(name) { return ({ 'repository-url': 'HTTPS GitHub repository URL', 'branch-name': 'Short descriptive branch name', 'issue-number': 'Issue number without #', 'pr-number': 'Pull request number without #', 'commit-message': 'Focused commit message', 'issue-title': 'Specific issue title', 'issue-body': 'Reproduction and expected behavior', 'collaborator-name': 'Name confirmed by the collaborator', 'collaborator-email': 'GitHub-associated email confirmed by the collaborator', 'release-version': 'Semantic version, for example v1.2.0', 'release-notes': 'Short release summary' })[name] || name; }
function tabKeys(event) { const parent = event.currentTarget.parentElement; const tabs = [...parent.querySelectorAll('[role=tab]')]; const index = tabs.indexOf(event.currentTarget); if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; tabs[next].click(); parent.querySelectorAll('[role=tab]')[next]?.focus(); }

const root = typeof document === 'undefined' ? null : document.getElementById('path-manual');
if (root) {
  const errors = validateGuidedPaths();
  if (errors.length) throw new Error(`Guided path data is invalid: ${errors.join('; ')}`);
  buildNavigation();
  window.addEventListener('popstate', route);
  route();
}
