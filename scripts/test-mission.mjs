#!/usr/bin/env node
/**
 * test-mission.mjs
 *
 * Deterministic tests for the Git Quest: Branchfall state machine.
 *
 *   node scripts/test-mission.mjs
 *
 * No browser, no dependencies, no test framework. The mission reducer is pure,
 * so every rule can be checked by feeding it actions and reading the result.
 *
 * Exit 0 = all passed. Exit 1 = something regressed.
 */

import {
  ACTIONS,
  COMMIT_MESSAGES,
  FEATURE_BRANCH,
  initialState,
  reduce,
  progress,
  availableActions,
  commitsOn,
  unmergedCommits,
} from '../game/mission.js';

let passed = 0;
let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    passed += 1;
    console.log(`  pass  ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`);
  }
}

/** Run a list of actions from a fresh mission. */
function run(...actions) {
  return actions.reduce((state, action) => reduce(state, action), initialState());
}

const CLEAN_PATH = [
  'CREATE_BRANCH',
  'MAKE_CHANGE',
  'COMMIT',
  'OPEN_PR',
  'RUN_VALIDATION',
  'REQUEST_REVIEW',
  'MERGE',
];

console.log('Git Quest: Branchfall — mission state machine\n');

/* ------------------------------------------------------------------ setup -- */
console.log('initial state');
{
  const s = initialState();
  check('starts on main', s.currentBranch === 'main');
  check('starts with two commits', s.commits.length === 2);
  check('no branch, no PR, nothing dirty',
    s.featureBranch === null && s.pr === null && s.dirty === false);
  check('no outcome yet', s.outcome === null);
  check('every checklist item starts undone', progress(s).every((p) => !p.done));
}

/* ------------------------------------------------------------- clean path -- */
console.log('\nthe clean path');
{
  const s = run(...CLEAN_PATH);
  check('mission completes cleanly', s.outcome === 'clean', `outcome=${s.outcome}`);
  check('merged', s.merged === true);
  check('main is not broken', s.mainBroken === false);
  check('no incidents recorded', s.incidents.length === 0,
    `incidents=${JSON.stringify(s.incidents)}`);
  check('feedback tone is a win', s.feedback.tone === 'win');
  check('every checklist item is done', progress(s).every((p) => p.done));
  check('merge commit has two parents',
    s.commits[s.commits.length - 1].parents.length === 2);
  check('back on main after merge', s.currentBranch === 'main');
  check('only RESTART remains', JSON.stringify(availableActions(s)) === '["RESTART"]');
}

/* -------------------------------------------------------------- ordering -- */
console.log('\nwrong order: acting too early');
{
  const noChange = reduce(initialState(), 'COMMIT');
  check('commit with nothing changed is refused', noChange.feedback.tone === 'error');
  check('...and creates no commit', noChange.commits.length === 2);

  const noBranch = reduce(initialState(), 'OPEN_PR');
  check('PR with no branch is refused', noBranch.feedback.tone === 'error');
  check('...and opens no PR', noBranch.pr === null);

  const emptyPr = run('CREATE_BRANCH', 'OPEN_PR');
  check('PR with no commits is refused', emptyPr.feedback.tone === 'error');
  check('...and opens no PR', emptyPr.pr === null);
  check('...and is recorded as an incident',
    emptyPr.incidents.some((i) => i.includes('no commits')));

  const noPrChecks = run('CREATE_BRANCH', 'MAKE_CHANGE', 'COMMIT', 'RUN_VALIDATION');
  check('validation with no PR is refused', noPrChecks.feedback.tone === 'error');
  check('...and checks stay unrun', noPrChecks.checks === 'none');

  const noPrReview = run('CREATE_BRANCH', 'MAKE_CHANGE', 'COMMIT', 'REQUEST_REVIEW');
  check('review with no PR is refused', noPrReview.feedback.tone === 'error');

  const noPrMerge = reduce(initialState(), 'MERGE');
  check('merge with no PR is refused', noPrMerge.feedback.tone === 'error');
  check('...and merges nothing', noPrMerge.merged === false);
}

/* --------------------------------------------------- committing on main -- */
console.log('\nwrong order: committing straight to main');
{
  const s = run('MAKE_CHANGE', 'COMMIT');
  check('editing on main warns', reduce(initialState(), 'MAKE_CHANGE').feedback.tone === 'warn');
  check('the commit is allowed, not blocked', s.commits.length === 3);
  check('...but flagged as an error', s.feedback.tone === 'error');
  check('...and marked as a stray commit', s.strayOnMain === true);
  check('...and recorded as an incident',
    s.incidents.some((i) => i.includes('directly to main')));
  check('recovery guidance is offered', typeof s.feedback.next === 'string');

  const rescued = reduce(s, 'CREATE_BRANCH');
  check('branching rescues the stray commit', rescued.strayOnMain === false);
  check('...main goes back to where it was', rescued.branches.main === 'c2');
  check('...the commit is now on the feature branch',
    rescued.branches[FEATURE_BRANCH] === 'c3');
  check('...and nothing was lost', rescued.commits.length === 3);
  check('...player is on the feature branch', rescued.currentBranch === FEATURE_BRANCH);

  const finished = ['OPEN_PR', 'RUN_VALIDATION', 'REQUEST_REVIEW', 'MERGE']
    .reduce((st, a) => reduce(st, a), rescued);
  check('recovered run still completes', finished.outcome === 'clean');
  check('...but the incident is remembered', finished.incidents.length > 0);
}

/* ----------------------------------------------- merging before checks -- */
console.log('\nwrong order: merging before validation');
{
  const s = run('CREATE_BRANCH', 'MAKE_CHANGE', 'COMMIT', 'OPEN_PR', 'REQUEST_REVIEW', 'MERGE');
  check('the merge is allowed', s.merged === true);
  check('...but main is broken', s.mainBroken === true);
  check('...outcome is messy, not clean', s.outcome === 'messy');
  check('...and it is an error, not a warning', s.feedback.tone === 'error');
  check('...recorded as an incident',
    s.incidents.some((i) => i.includes('before validation')));
  check('revert is offered as recovery', availableActions(s).includes('REVERT_MERGE'));

  const reverted = reduce(s, 'REVERT_MERGE');
  check('revert fixes main', reverted.mainBroken === false);
  check('...main returns to its last good commit', reverted.branches.main === 'c2');
  check('...the merge commit is gone', reverted.commits.length === 3);
  check('...the branch keeps its work',
    unmergedCommits(reverted).length === 1);
  check('...the PR is open again', reverted.pr !== null);
  check('...checks must be re-run', reverted.checks === 'none');

  const fixed = ['RUN_VALIDATION', 'MERGE'].reduce((st, a) => reduce(st, a), reverted);
  check('a proper merge then succeeds', fixed.outcome === 'clean');
  check('...and main is healthy', fixed.mainBroken === false);
}

/* ------------------------------------------------ merging without review -- */
console.log('\nwrong order: merging without review');
{
  const s = run('CREATE_BRANCH', 'MAKE_CHANGE', 'COMMIT', 'OPEN_PR', 'RUN_VALIDATION', 'MERGE');
  check('merge without review is allowed', s.merged === true);
  check('...main still works', s.mainBroken === false);
  check('...mission completes', s.outcome === 'clean');
  check('...but it is flagged as a warning', s.feedback.tone === 'warn');
  check('...and recorded as an incident',
    s.incidents.some((i) => i.includes('without a review')));
}

/* ------------------------------------------------------- stale validation -- */
console.log('\nstale validation');
{
  const s = run('CREATE_BRANCH', 'MAKE_CHANGE', 'COMMIT', 'OPEN_PR', 'RUN_VALIDATION',
    'MAKE_CHANGE', 'COMMIT');
  check('a new commit makes validation stale', s.checks === 'stale');
  check('...the PR points at the new commit', s.pr.head === s.branches[FEATURE_BRANCH]);

  const merged = reduce(reduce(s, 'REQUEST_REVIEW'), 'MERGE');
  check('merging on stale checks breaks main', merged.mainBroken === true);
  check('...and says the check was stale', merged.feedback.body.includes('stale'));

  const rerun = reduce(s, 'RUN_VALIDATION');
  check('re-running validation clears staleness', rerun.checks === 'passed');
}

/* ------------------------------------------------------------ duplicates -- */
console.log('\nrepeated actions');
{
  const twoBranches = run('CREATE_BRANCH', 'CREATE_BRANCH');
  check('a second branch is refused', twoBranches.feedback.tone === 'warn');

  const twoChanges = run('CREATE_BRANCH', 'MAKE_CHANGE', 'MAKE_CHANGE');
  check('a second uncommitted change is refused', twoChanges.feedback.tone === 'warn');

  const twoPrs = run('CREATE_BRANCH', 'MAKE_CHANGE', 'COMMIT', 'OPEN_PR', 'OPEN_PR');
  check('a second PR is refused', twoPrs.feedback.tone === 'warn');

  const noRevert = reduce(initialState(), 'REVERT_MERGE');
  check('revert with nothing to revert is refused', noRevert.feedback.tone === 'warn');

  const done = reduce(run(...CLEAN_PATH), 'MERGE');
  check('acting after completion is inert', done.outcome === 'clean');
}

/* -------------------------------------------------------- commit messages -- */
console.log('\ncommit messages');
{
  const s = run('CREATE_BRANCH', 'MAKE_CHANGE', 'COMMIT', 'MAKE_CHANGE', 'COMMIT',
    'MAKE_CHANGE', 'COMMIT');
  const messages = s.commits.slice(2).map((c) => c.message);
  check('three commits produce three distinct messages',
    new Set(messages).size === 3, messages.join(' | '));
  check('the first one names the task', messages[0] === COMMIT_MESSAGES[0]);

  // More commits than we have prepared messages must not produce undefined.
  let many = run('CREATE_BRANCH');
  for (let i = 0; i < COMMIT_MESSAGES.length + 3; i += 1) {
    many = reduce(reduce(many, 'MAKE_CHANGE'), 'COMMIT');
  }
  check('running past the message list still labels every commit',
    many.commits.every((c) => typeof c.message === 'string' && c.message.length > 0));
}

/* --------------------------------------------------- uncommitted carry-over */
console.log('\nuncommitted work follows you');
{
  const s = run('MAKE_CHANGE', 'CREATE_BRANCH');
  check('dirty work survives the branch switch', s.dirty === true);
  check('...and the player is warned about it', s.feedback.next.includes('came with you'));

  const pr = run('CREATE_BRANCH', 'MAKE_CHANGE', 'COMMIT', 'MAKE_CHANGE', 'OPEN_PR');
  check('a PR opened with dirty work warns', pr.feedback.tone === 'warn');
  check('...but still opens', pr.pr !== null);
}

/* --------------------------------------------------------------- restart -- */
console.log('\nrestart');
{
  const messy = run('MAKE_CHANGE', 'COMMIT', 'CREATE_BRANCH', 'OPEN_PR', 'MERGE');
  const reset = reduce(messy, 'RESTART');
  check('restart returns to the initial state',
    JSON.stringify(reset) === JSON.stringify(initialState()));
  check('...clearing incidents', reset.incidents.length === 0);
  check('...and commits', reset.commits.length === 2);

  const afterWin = reduce(run(...CLEAN_PATH), 'RESTART');
  check('restart works after a win', afterWin.outcome === null);
}

/* ------------------------------------------------------------- integrity -- */
console.log('\nstate integrity');
{
  const before = initialState();
  const snapshot = JSON.stringify(before);
  reduce(before, 'CREATE_BRANCH');
  check('reduce never mutates its input', JSON.stringify(before) === snapshot);

  const s = run(...CLEAN_PATH);
  check('state survives a JSON round-trip',
    JSON.stringify(JSON.parse(JSON.stringify(s))) === JSON.stringify(s));

  const unknown = reduce(initialState(), 'NOT_A_REAL_ACTION');
  check('unknown actions are rejected safely', unknown.feedback.tone === 'error');
  check('...without changing anything', unknown.commits.length === 2);

  const sampleStates = [
    initialState(),                                            // fresh
    run('CREATE_BRANCH', 'MAKE_CHANGE'),                       // dirty tree
    run('CREATE_BRANCH', 'MAKE_CHANGE', 'COMMIT', 'OPEN_PR'),  // PR open
    run('CREATE_BRANCH', 'MAKE_CHANGE', 'COMMIT', 'OPEN_PR',
        'REQUEST_REVIEW', 'MERGE'),                            // main broken
  ];
  const unreachable = ACTIONS.filter(
    (a) => !sampleStates.some((st) => availableActions(st).includes(a))
  );
  check('every action is offered by some reachable state',
    unreachable.length === 0, `never offered: ${unreachable.join(', ')}`);

  const chain = commitsOn(run(...CLEAN_PATH), 'main');
  check('main history is a connected chain',
    chain.every((c, i) => i === 0 || c.parents.includes(chain[i - 1].id)));

  // Exhaustive walk: from every reachable state, every action must return a
  // structurally valid state. This is the safety net that catches a rule
  // change producing an impossible position five moves in.
  const fingerprint = (s) => JSON.stringify([
    s.currentBranch, s.featureBranch, s.dirty, s.checks, s.review,
    s.merged, s.mainBroken, s.strayOnMain, s.outcome,
    s.pr ? s.pr.head : null, s.branches, s.commits.length,
  ]);

  const seen = new Map([[fingerprint(initialState()), initialState()]]);
  const queue = [initialState()];
  let broken = null;

  while (queue.length > 0 && seen.size < 500) {
    const st = queue.shift();
    for (const a of ACTIONS) {
      const r = reduce(st, a);
      const valid = r && typeof r === 'object'
        && Array.isArray(r.commits) && r.commits.length >= 2
        && typeof r.branches.main === 'string'
        && r.commits.some((c) => c.id === r.branches.main)
        && (r.featureBranch === null
            || r.commits.some((c) => c.id === r.branches[r.featureBranch]));
      if (!valid) { broken = `${a} from ${fingerprint(st)}`; break; }
      const key = fingerprint(r);
      if (!seen.has(key)) { seen.set(key, r); queue.push(r); }
    }
    if (broken) break;
  }

  check(`exhaustive walk of ${seen.size} reachable states, all valid`,
    broken === null, broken ? `first invalid: ${broken}` : '');
  check('the walk explored a real state space', seen.size > 20,
    `only reached ${seen.size} states`);
}

/* ----------------------------------------------------------------- done -- */
console.log(`\n${passed}/${passed + failed} mission tests passed.`);
if (failed > 0) {
  console.error(`${failed} failed.`);
  process.exit(1);
}
