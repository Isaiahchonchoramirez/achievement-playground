import { practiceMissions, getMission, initialPracticeState, reducePractice } from './practice-missions.js';

const root = document.getElementById('practice-lab');
if (root) start(root);

function start(mount) {
  let state = initialPracticeState(readMission());
  mount.innerHTML = `
    <div class="practice-tabs" role="tablist" aria-label="Practice missions"></div>
    <div class="practice-workbench">
      <section class="practice-brief" aria-labelledby="practice-title">
        <p class="eyebrow">Learning objective</p><h3 id="practice-title"></h3><p id="practice-objective"></p>
        <div class="practice-controls">
          <button type="button" class="btn btn-primary" data-advance>Complete next step</button>
          <button type="button" class="btn btn-ghost" data-mistake>Try a common mistake</button>
          <button type="button" class="text-action" data-reset>Reset / replay</button>
        </div>
      </section>
      <section class="practice-state" aria-label="Simulated repository state">
        <div class="practice-graph" aria-hidden="true"></div>
        <p class="visually-hidden" data-graph-description></p>
        <ol class="practice-steps"></ol>
        <p class="practice-feedback" role="status" aria-live="polite"></p>
      </section>
    </div>`;
  const tabs = mount.querySelector('.practice-tabs');
  practiceMissions.forEach((mission) => {
    const button = document.createElement('button');
    button.type = 'button'; button.role = 'tab'; button.dataset.mission = mission.id;
    button.textContent = mission.title; tabs.append(button);
  });
  tabs.addEventListener('click', (event) => {
    const button = event.target.closest('[data-mission]');
    if (!button) return;
    state = reducePractice(state, { type: 'SELECT', id: button.dataset.mission });
    history.replaceState(null, '', `#practice?mission=${state.missionId}`);
    render();
  });
  tabs.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const activeIndex = practiceMissions.findIndex((mission) => mission.id === state.missionId);
    let nextIndex = activeIndex;
    if (event.key === 'ArrowLeft') nextIndex = (activeIndex - 1 + practiceMissions.length) % practiceMissions.length;
    if (event.key === 'ArrowRight') nextIndex = (activeIndex + 1) % practiceMissions.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = practiceMissions.length - 1;
    event.preventDefault();
    state = reducePractice(state, { type: 'SELECT', id: practiceMissions[nextIndex].id });
    history.replaceState(null, '', `#practice?mission=${state.missionId}`);
    render();
    tabs.querySelector('[aria-selected="true"]').focus();
  });
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-mission-link]');
    if (!link) return;
    state = reducePractice(state, { type: 'SELECT', id: link.dataset.missionLink });
    render();
  });
  mount.querySelector('[data-advance]').addEventListener('click', () => { state = reducePractice(state, { type: 'ADVANCE' }); render(); });
  mount.querySelector('[data-mistake]').addEventListener('click', () => { state = reducePractice(state, { type: 'MISTAKE' }); render(); });
  mount.querySelector('[data-reset]').addEventListener('click', () => { state = reducePractice(state, { type: 'RESET' }); render(); });
  function render() {
    const mission = getMission(state.missionId);
    mount.querySelector('#practice-title').textContent = mission.title;
    mount.querySelector('#practice-objective').textContent = mission.objective;
    mount.querySelectorAll('[role="tab"]').forEach((tab) => {
      const selected = tab.dataset.mission === mission.id;
      tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
    });
    const list = mount.querySelector('.practice-steps'); list.replaceChildren();
    mission.steps.forEach((text, index) => {
      const item = document.createElement('li'); item.dataset.done = String(index < state.step || state.complete);
      item.textContent = text; list.append(item);
    });
    const graph = mount.querySelector('.practice-graph'); graph.replaceChildren();
    mission.steps.forEach((_, index) => {
      const node = document.createElement('span'); node.dataset.state = index < state.step || state.complete ? 'done' : index === state.step ? 'head' : 'future';
      graph.append(node);
    });
    mount.querySelector('[data-graph-description]').textContent = `${state.step} of ${mission.steps.length} simulated steps complete.`;
    mount.querySelector('.practice-feedback').textContent = state.feedback;
    mount.querySelector('[data-advance]').disabled = state.complete;
  }
  render();
}

function readMission() {
  const match = location.hash.match(/mission=([a-z-]+)/);
  return match ? match[1] : 'branch';
}
