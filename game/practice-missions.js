export const practiceMissions = Object.freeze([
  mission('branch', 'Create a feature branch', 'Protect main by giving focused work its own named branch.', ['Inspect the clean tree', 'Create feature/search', 'Confirm HEAD moved'], 'CREATE_BRANCH'),
  mission('commit', 'Make a focused commit', 'Stage one coherent change and describe what the commit will do.', ['Inspect the diff', 'Stage focused files', 'Write a specific commit'], 'COMMIT'),
  mission('open-pr', 'Open a pull request', 'Propose a reviewable change with context, evidence, and a linked issue.', ['Push the branch', 'Describe the outcome', 'Open the proposal'], 'OPEN_PR'),
  mission('review', 'Respond to review feedback', 'Treat review as collaboration: understand, revise, test, and explain.', ['Read the full comment', 'Revise the implementation', 'Re-run checks', 'Respond with evidence'], 'RESPOND'),
  mission('conflict', 'Resolve a merge conflict', 'Preserve both intended changes and remove Git’s conflict markers safely.', ['Inspect both sides', 'Choose the combined result', 'Validate the file', 'Record the resolution'], 'RESOLVE'),
  mission('merge-safely', 'Merge safely', 'Land a reviewed, current, green pull request without bypassing safeguards.', ['Confirm review', 'Confirm fresh checks', 'Merge the pull request'], 'MERGE'),
  mission('coauthor', 'Credit a genuine co-author', 'Use attribution only when another person truly contributed to this commit.', ['Confirm the shared work', 'Ask for their GitHub email', 'Add one truthful trailer', 'Verify attribution'], 'CREDIT'),
  mission('discussion', 'Answer a Discussion responsibly', 'Help solve a real question without farming acceptance or claiming certainty.', ['Check the question is current', 'Reproduce or verify', 'Write a useful answer', 'Leave acceptance to the author'], 'ANSWER'),
]);

function mission(id, title, objective, steps, action) {
  return Object.freeze({ id, title, objective, steps: Object.freeze(steps), action });
}

export function getMission(id) {
  return practiceMissions.find((item) => item.id === id) || practiceMissions[0];
}

export function initialPracticeState(id = practiceMissions[0].id) {
  const mission = getMission(id);
  return { missionId: mission.id, step: 0, complete: false, mistakes: 0, feedback: `Start by: ${mission.steps[0]}.` };
}

export function reducePractice(state, event) {
  if (event.type === 'SELECT' || event.type === 'RESET') return initialPracticeState(event.id || state.missionId);
  const mission = getMission(state.missionId);
  if (state.complete) return state;
  if (event.type === 'MISTAKE') {
    return { ...state, mistakes: state.mistakes + 1, feedback: mistakeFor(mission.id) };
  }
  if (event.type !== 'ADVANCE') return state;
  const nextStep = state.step + 1;
  if (nextStep >= mission.steps.length) {
    return { ...state, step: mission.steps.length, complete: true, feedback: 'Mission complete. Replay it, or choose another workflow.' };
  }
  return { ...state, step: nextStep, feedback: `Good. Next: ${mission.steps[nextStep]}.` };
}

function mistakeFor(id) {
  const messages = {
    branch: 'Committing on main exposes unfinished work. Branch first; the change can move with you.',
    commit: 'A commit should describe one coherent result. Split unrelated work before staging.',
    'open-pr': 'An empty or context-free pull request gives reviewers nothing useful to evaluate.',
    review: 'Do not dismiss feedback or reply before understanding it. Change, test, then explain.',
    conflict: 'Deleting one side blindly can erase valid work. Read both versions and construct the intended result.',
    'merge-safely': 'Green checks can become stale after another commit. Confirm the current head is reviewed and green.',
    coauthor: 'Never invent or guess attribution. The co-author must have contributed and approved the exact trailer.',
    discussion: 'Do not guess or ask for acceptance. Verify the answer and let the author decide whether it solved the problem.',
  };
  return messages[id];
}
