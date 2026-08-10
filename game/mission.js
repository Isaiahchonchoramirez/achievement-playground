/* ==========================================================================
   Git Quest: Branchfall — mission state machine

   This file is deliberately pure. It knows nothing about the DOM, the
   network, or Git itself. Give it a state and an action, it hands back the
   next state. That is the whole contract.

   Why it matters: because this is pure, every rule below is tested headlessly
   in CI by scripts/test-mission.mjs — no browser required. If you change a
   rule here, add a test there.

   NOTHING IN THIS FILE RUNS A REAL GIT COMMAND. It is a simulation.
   ========================================================================== */

/** Every action the workbench can dispatch. */
export const ACTIONS = Object.freeze([
  'CREATE_BRANCH',
  'MAKE_CHANGE',
  'COMMIT',
  'OPEN_PR',
  'RUN_VALIDATION',
  'REQUEST_REVIEW',
  'MERGE',
  'REVERT_MERGE',
  'RESTART',
]);

export const FEATURE_BRANCH = 'feature/contributor-search';

/**
 * Commit messages, in the order the player produces them. Real work is rarely
 * one commit, and identical labels make the graph unreadable.
 */
export const COMMIT_MESSAGES = Object.freeze([
  'Add contributor search',
  'Handle no-results state',
  'Label the search input',
  'Tidy up search styles',
  'More search work',
]);

/** The task the player is asked to ship. */
export const TASK = Object.freeze({
  title: 'Add search to the contributor wall',
  body:
    'People cannot find themselves once the wall gets long. Add a search box ' +
    'that filters contributor cards as you type.',
  acceptance: [
    'Filters cards as the player types',
    'Says so clearly when nothing matches',
    'Reachable by keyboard',
  ],
});

/**
 * The starting position: two commits on main, nothing else.
 * Deterministic — no clocks, no randomness, so tests and localStorage
 * round-trips behave identically.
 */
export function initialState() {
  return {
    commits: [
      { id: 'c1', message: 'Initial commit', parents: [], lane: 'main' },
      { id: 'c2', message: 'Add contributor wall', parents: ['c1'], lane: 'main' },
    ],
    branches: { main: 'c2' },
    currentBranch: 'main',
    featureBranch: null,
    dirty: false,          // uncommitted change in the working tree
    pr: null,              // { branch, head } once opened
    checks: 'none',        // none | passed | stale
    review: 'none',        // none | approved
    merged: false,
    mainBroken: false,     // merged before validation passed
    strayOnMain: false,    // committed straight to main
    incidents: [],         // durable record of what went wrong
    outcome: null,         // null | 'clean' | 'messy'
    seq: 2,                // commit id counter
    feedback: null,        // { tone, title, body, next }
  };
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const clone = (state) => JSON.parse(JSON.stringify(state));

function say(state, tone, title, body, next) {
  state.feedback = { tone, title, body, next: next || null };
  return state;
}

function note(state, text) {
  if (!state.incidents.includes(text)) state.incidents.push(text);
}

/** Commits reachable from a branch tip, oldest first. */
export function commitsOn(state, branch) {
  const tip = state.branches[branch];
  if (!tip) return [];
  const byId = new Map(state.commits.map((c) => [c.id, c]));
  const out = [];
  let cursor = tip;
  while (cursor) {
    const commit = byId.get(cursor);
    if (!commit) break;
    out.unshift(commit);
    cursor = commit.parents[0];
  }
  return out;
}

/** Commits on the feature branch that main does not have yet. */
export function unmergedCommits(state) {
  if (!state.featureBranch) return [];
  const mainIds = new Set(commitsOn(state, 'main').map((c) => c.id));
  return commitsOn(state, state.featureBranch).filter((c) => !mainIds.has(c.id));
}

/**
 * Which actions make sense right now.
 * The UI disables the rest — but every rule is still enforced in reduce(),
 * so a disabled button is a convenience, never the safety mechanism.
 */
export function availableActions(state) {
  if (state.outcome === 'clean') return ['RESTART'];
  const list = [];
  if (!state.merged) {
    if (state.currentBranch === 'main' && !state.featureBranch) list.push('CREATE_BRANCH');
    if (!state.dirty) list.push('MAKE_CHANGE');
    if (state.dirty) list.push('COMMIT');
    if (state.featureBranch && !state.pr) list.push('OPEN_PR');
    if (state.pr) list.push('RUN_VALIDATION', 'REQUEST_REVIEW', 'MERGE');
  }
  if (state.mainBroken) list.push('REVERT_MERGE');
  list.push('RESTART');
  return list;
}

/* -------------------------------------------------------------------------- */
/* The reducer                                                                */
/* -------------------------------------------------------------------------- */

/**
 * @param {object} state  current mission state
 * @param {string} action one of ACTIONS
 * @returns {object} the next state — the input is never mutated
 */
export function reduce(state, action) {
  if (action === 'RESTART') return initialState();
  if (!ACTIONS.includes(action)) {
    return say(clone(state), 'error', 'Unknown action',
      `"${action}" is not something the workbench can do.`);
  }

  const next = clone(state);
  next.feedback = null;

  if (next.outcome === 'clean' && action !== 'RESTART') {
    return say(next, 'ok', 'Mission already complete',
      'This mission is finished. Restart to run it again.');
  }

  switch (action) {
    /* ---------------------------------------------------------------- */
    case 'CREATE_BRANCH': {
      if (next.featureBranch) {
        return say(next, 'warn', 'You already have a branch',
          `You are working on ${next.featureBranch}. One branch, one idea — ` +
          'a second branch for the same task would only split your work in half.');
      }

      next.featureBranch = FEATURE_BRANCH;

      // Recovery path: a commit made straight on main gets moved onto the new
      // branch, and main goes back where it was. This is exactly the recipe in
      // CONTRIBUTING.md under "I committed to main by accident".
      if (next.strayOnMain) {
        const mainCommits = commitsOn(next, 'main');
        const stray = mainCommits[mainCommits.length - 1];
        next.branches[next.featureBranch] = stray.id;
        next.branches.main = stray.parents[0];
        stray.lane = 'feature';
        next.strayOnMain = false;
        next.currentBranch = next.featureBranch;
        return say(next, 'ok', 'Rescued — your commit moved to the branch',
          `"${stray.message}" now sits on ${FEATURE_BRANCH}, and main is back ` +
          'where it started. Nothing was lost. That is the real fix for an ' +
          'accidental commit on main: branch it, then reset main.',
          'Open a pull request when you are ready.');
      }

      next.branches[next.featureBranch] = next.branches.main;
      next.currentBranch = next.featureBranch;
      return say(next, 'ok', `Branched to ${FEATURE_BRANCH}`,
        'A branch is just a movable label pointing at a commit. Nothing was ' +
        'copied, and main is untouched while you work.',
        next.dirty
          ? 'Your uncommitted change came with you — commit it here.'
          : 'Make the change next.');
    }

    /* ---------------------------------------------------------------- */
    case 'MAKE_CHANGE': {
      if (next.dirty) {
        return say(next, 'warn', 'You already have uncommitted work',
          'There is an unsaved change in the working tree. Commit it before ' +
          'starting another.');
      }

      next.dirty = true;

      if (next.currentBranch === 'main') {
        note(next, 'Edited files while still on main');
        return say(next, 'warn', 'You are editing on main',
          'This is allowed and nothing is broken yet — the change is only in ' +
          'your working tree, not in any commit.',
          'Create a branch now. Uncommitted work follows you across branches, ' +
          'so the change is not lost.');
      }

      return say(next, 'ok', 'Search box written',
        'The change exists in your working tree. Git has not recorded it yet — ' +
        'nothing is safe until it is committed.',
        'Commit it.');
    }

    /* ---------------------------------------------------------------- */
    case 'COMMIT': {
      if (!next.dirty) {
        return say(next, 'error', 'Nothing to commit',
          'There is no change in the working tree. A commit records a ' +
          'difference, and right now there is not one.',
          'Make the change first.');
      }

      next.seq += 1;
      const id = `c${next.seq}`;
      const onMain = next.currentBranch === 'main';
      // Distinct messages so a second or third commit is tellable apart in
      // the graph, rather than three identical dots.
      const written = next.commits.filter((c) => c.lane === 'feature' || c.id > 'c2').length;
      const commit = {
        id,
        message: COMMIT_MESSAGES[Math.min(written, COMMIT_MESSAGES.length - 1)],
        parents: [next.branches[next.currentBranch]],
        lane: onMain ? 'main' : 'feature',
      };
      next.commits.push(commit);
      next.branches[next.currentBranch] = id;
      next.dirty = false;

      // A commit after validation invalidates that validation.
      if (next.checks === 'passed') next.checks = 'stale';
      if (next.pr) next.pr.head = id;

      if (onMain) {
        next.strayOnMain = true;
        note(next, 'Committed directly to main');
        return say(next, 'error', 'That commit landed on main',
          'Your work is safe, but it went straight onto the shared branch with ' +
          'no branch, no pull request and no review. On a protected repository ' +
          'the push would simply have been rejected.',
          'Create a branch — the commit moves across and main is restored.');
      }

      return say(next, 'ok', 'Committed to the branch',
        'The change is recorded now. The graph shows a new commit and the ' +
        'branch label moved forward to point at it.',
        next.pr
          ? 'The pull request picked it up. Validation needs re-running.'
          : 'Open a pull request.');
    }

    /* ---------------------------------------------------------------- */
    case 'OPEN_PR': {
      if (!next.featureBranch) {
        return say(next, 'error', 'There is no branch to propose',
          'A pull request asks to merge one branch into another. You are on ' +
          'main, so there is nothing to compare.',
          'Create a branch first.');
      }
      if (next.pr) {
        return say(next, 'warn', 'That pull request is already open',
          'Pushing more commits updates the existing one. You do not open a ' +
          'second pull request for the same branch.');
      }
      if (unmergedCommits(next).length === 0) {
        note(next, 'Tried to open a pull request with no commits');
        return say(next, 'error', 'Nothing to review',
          'The branch has no commits main does not already have, so the pull ' +
          'request would show an empty diff. A reviewer would have literally ' +
          'nothing to look at.',
          next.dirty
            ? 'Commit your change — uncommitted work is never part of a pull request.'
            : 'Make the change, then commit it.');
      }

      next.pr = { branch: next.featureBranch, head: next.branches[next.featureBranch] };
      const warnDirty = next.dirty;
      return say(
        next,
        warnDirty ? 'warn' : 'ok',
        warnDirty ? 'Opened — but you left work behind' : 'Pull request opened',
        warnDirty
          ? 'The pull request contains your committed work only. The change ' +
            'still sitting uncommitted in your working tree is not in it — ' +
            'reviewers cannot see it and merging will not include it.'
          : 'The branch is now proposed for merging into main. This is where ' +
            'review and automated checks happen.',
        warnDirty ? 'Commit the rest, then run validation.' : 'Run validation.'
      );
    }

    /* ---------------------------------------------------------------- */
    case 'RUN_VALIDATION': {
      if (!next.pr) {
        return say(next, 'error', 'No pull request to check',
          'Validation runs against a proposed change. Without a pull request ' +
          'there is nothing for it to run on.',
          'Open a pull request first.');
      }
      next.checks = 'passed';
      return say(next, 'ok', 'Validation passed',
        'The automated check read the change and found no problems. This is ' +
        'the same idea as the Validate workflow on this repository.',
        next.review === 'approved' ? 'Merge it.' : 'Request a review.');
    }

    /* ---------------------------------------------------------------- */
    case 'REQUEST_REVIEW': {
      if (!next.pr) {
        return say(next, 'error', 'Nothing to review yet',
          'A review is a person reading a proposed change. There is no pull ' +
          'request open.',
          'Open a pull request first.');
      }
      next.review = 'approved';
      return say(next, 'ok', 'Reviewed and approved',
        'A teammate read the diff and approved it. A review is a second pair ' +
        'of eyes, not a formality — the automated check cannot tell you whether ' +
        'the idea was any good.',
        next.checks === 'passed' ? 'Merge it.' : 'Run validation before merging.');
    }

    /* ---------------------------------------------------------------- */
    case 'MERGE': {
      if (!next.pr) {
        return say(next, 'error', 'Nothing to merge',
          'Merging lands a proposed change on main. No pull request is open.',
          'Open a pull request first.');
      }

      const skippedChecks = next.checks !== 'passed';
      const skippedReview = next.review !== 'approved';

      next.seq += 1;
      const id = `c${next.seq}`;
      next.commits.push({
        id,
        message: `Merge ${next.featureBranch}`,
        parents: [next.branches.main, next.branches[next.featureBranch]],
        lane: 'main',
      });
      next.branches.main = id;
      next.currentBranch = 'main';
      next.merged = true;
      next.pr = null;

      if (skippedChecks) {
        next.mainBroken = true;
        next.outcome = 'messy';
        note(next, 'Merged before validation passed');
        return say(next, 'error', 'Merged early — main is broken',
          next.checks === 'stale'
            ? 'Validation had passed, but you committed again afterwards and ' +
              'never re-ran it. The check was stale, and the code that landed ' +
              'was never actually verified.'
            : 'The change went to main without ever being checked. Everyone ' +
              'who pulls main now gets the broken version. This is precisely ' +
              'what required status checks exist to prevent.',
          'Revert the merge to get main working again, then do it properly.');
      }

      if (skippedReview) {
        next.outcome = 'clean';
        note(next, 'Merged without a review');
        return say(next, 'warn', 'Merged — but nobody looked at it',
          'The check passed, so main still works. But no human read the ' +
          'change. That is survivable once for something trivial and a bad ' +
          'habit everywhere else.',
          'Mission complete, with one shortcut on the record.');
      }

      next.outcome = 'clean';
      return say(next, 'win', 'Shipped',
        'Branch, change, commit, pull request, validation, review, merge — the ' +
        'whole loop, in the right order. Contributor search is on main and main ' +
        'still works.',
        'That is the same sequence CONTRIBUTING.md asks for on this repository.');
    }

    /* ---------------------------------------------------------------- */
    case 'REVERT_MERGE': {
      if (!next.mainBroken) {
        return say(next, 'warn', 'Nothing to revert',
          'Main is fine. A revert undoes a merge that should not have landed.');
      }

      // Undo the merge commit: main goes back to its first parent, and the
      // feature branch keeps its work so it can be fixed and re-merged.
      const merge = next.commits[next.commits.length - 1];
      next.commits.pop();
      next.branches.main = merge.parents[0];
      next.mainBroken = false;
      next.merged = false;
      next.outcome = null;
      next.checks = 'none';
      next.currentBranch = next.featureBranch;
      next.pr = { branch: next.featureBranch, head: next.branches[next.featureBranch] };

      return say(next, 'ok', 'Reverted — main works again',
        'Main is back to its last good state and your branch still has every ' +
        'commit. Nothing was thrown away. Reverting is the calm response to a ' +
        'bad merge; deleting things is not.',
        'Run validation this time, then merge.');
    }

    /* ---------------------------------------------------------------- */
    default:
      return next;
  }
}

/** Ordered checklist shown beside the graph. */
export function progress(state) {
  const committed = unmergedCommits(state).length > 0 || state.merged;
  return [
    { label: 'Create a branch', done: Boolean(state.featureBranch) },
    { label: 'Make the change', done: state.dirty || committed },
    { label: 'Commit it', done: committed },
    { label: 'Open a pull request', done: Boolean(state.pr) || state.merged },
    { label: 'Run validation', done: state.checks === 'passed' },
    { label: 'Get a review', done: state.review === 'approved' },
    { label: 'Merge', done: state.merged && !state.mainBroken },
  ];
}
