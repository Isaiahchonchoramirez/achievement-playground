import { achievements } from './achievements.js';

export const OFFICIAL_PROFILE_DOC = 'https://docs.github.com/en/account-and-profile/reference/profile-reference#earning-achievements';

const sharedNotice = 'Do useful work first. GitHub controls achievement credit, timing, and eligibility, so finishing this path never guarantees a badge.';
const docs = (label, href) => ({ label, href });
const referenceMap = {
  'pull-shark': [docs('Official: creating a pull request', 'https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request')],
  quickdraw: [docs('Official: closing an issue', 'https://docs.github.com/en/issues/tracking-your-work-with-issues/administering-issues/closing-an-issue')],
  yolo: [docs('Official: pull request reviews', 'https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews')],
  'pair-extraordinaire': [docs('Official: commits with multiple authors', 'https://docs.github.com/en/pull-requests/committing-changes-to-your-project/creating-and-editing-commits/creating-a-commit-with-multiple-authors')],
  'galaxy-brain': [docs('Official: marking a Discussion answer', 'https://docs.github.com/en/discussions/managing-discussions-for-your-community/moderating-discussions#marking-a-comment-as-an-answer')],
  starstruck: [docs('Official: saving repositories with stars', 'https://docs.github.com/en/get-started/exploring-projects-on-github/saving-repositories-with-stars')],
  'public-sponsor': [docs('Official: sponsoring a contributor', 'https://docs.github.com/en/sponsors/sponsoring-open-source-contributors/sponsoring-an-open-source-contributor-through-github')],
  'heart-on-your-sleeve': [docs('Official profile reference does not publish this requirement', OFFICIAL_PROFILE_DOC)],
  'open-sourcerer': [docs('Official profile reference does not publish this requirement', OFFICIAL_PROFILE_DOC)],
  'arctic-code-vault': [docs('Official GitHub Archive Program snapshot', 'https://archiveprogram.github.com/arctic-vault/')],
  'mars-2020': [docs('Official: ended Mars 2020 achievement', 'https://docs.github.com/en/account-and-profile/reference/profile-reference#list-of-qualifying-repositories-for-mars-2020-helicopter-contributor-achievement')],
};

const definitions = {
  'pull-shark': {
    difficulty: 'Beginner', effort: '1–3 hours plus review', prerequisites: ['Git installed', 'A repository you may contribute to', 'A meaningful feature or fix'], mission: 'open-pr', visual: ['pull-request', 'reviews', 'merge'],
    recognizes: 'Authored pull requests that are merged after useful work.', label: 'Community-reported achievement condition',
    workflow: ['Choose a real issue and confirm scope.', 'Clone the repository and create a focused branch.', 'Make one coherent change; inspect the diff and run the project tests.', 'Commit and push the branch.', 'Open a pull request with context, testing notes, and an issue link.', 'Respond to review feedback, rerun checks, and merge through the repository’s normal process.', 'Verify the PR author, merged state, and resulting commits.'],
    verify: ['PR is merged, not merely closed', 'Your account is the PR author', 'The change is meaningful and checks passed', 'The profile may take time to update'],
    troubleshoot: ['Wrong author? Confirm the GitHub account that opened the PR.', 'Checks failed? Fix the branch and push again; do not open a replacement PR.', 'No badge? Wait and remember the threshold is unofficial.'],
    commands: [
      step('Clone the project', 'Downloads the repository into a new local folder.', { shell: 'git clone <repository-url>', powershell: 'git clone <repository-url>', gh: 'gh repo clone <repository-url>' }, ['repository-url'], 'Cloning into…', 'Delete only the newly cloned folder if you chose the wrong repository.'),
      step('Create a feature branch', 'Moves new work off the protected main branch.', { shell: 'git switch -c <branch-name>', powershell: 'git switch -c <branch-name>', gh: 'git switch -c <branch-name>' }, ['branch-name'], 'Switched to a new branch…', 'Before committing, return with git switch main and delete the unused branch with git branch -d <branch-name>.'),
      step('Inspect the change', 'Shows the exact unstaged changes before you commit.', { shell: 'git diff --check && git diff', powershell: 'git diff --check; if ($LASTEXITCODE -eq 0) { git diff }', gh: 'git diff --check && git diff' }),
      step('Create the focused commit', 'Records only the files you intentionally staged.', { shell: 'git commit -m <commit-message>', powershell: 'git commit -m <commit-message>', gh: 'git commit -m <commit-message>' }, ['commit-message'], '1 file changed…', 'If it has not been pushed, use git reset --soft HEAD~1 to reopen the commit without losing the files.'),
      step('Push the branch', 'Publishes this branch; it does not merge it.', { shell: 'git push -u origin <branch-name>', powershell: 'git push -u origin <branch-name>', gh: 'git push -u origin <branch-name>' }, ['branch-name']),
      step('Open the pull request', 'Creates a reviewable proposal targeting main.', { gh: 'gh pr create --base main --head <branch-name> --title <commit-message>', website: 'Repository → Pull requests → New pull request → choose <branch-name> → Create pull request' }, ['branch-name', 'commit-message']),
    ],
  },
  quickdraw: {
    difficulty: 'Beginner', effort: 'A few minutes for a genuinely resolved issue', prerequisites: ['A confirmed, immediately resolvable problem', 'Permission to create or close the issue'], visual: 'issue',
    recognizes: 'A quickly resolved issue or pull request; the timing threshold is community-reported.', label: 'Community-reported and timing-sensitive',
    workflow: ['Confirm a real bug, documentation mismatch, or configuration problem.', 'Write a useful issue with reproduction and expected behavior.', 'Apply the already-understood fix through the normal project workflow.', 'Link the resolving commit or PR and close the issue correctly.', 'Compare the public creation and closure timestamps.'],
    verify: ['Issue describes a real problem', 'Closure is linked to the resolving work', 'Public timestamps are visible', 'GitHub alone decides eligibility'],
    troubleshoot: ['Do not create and close an empty test issue.', 'If the fix needs investigation, take the time it needs instead of racing a timer.'],
    commands: [step('Create a useful issue', 'Opens a real issue only after you have confirmed the problem.', { gh: 'gh issue create --title <issue-title> --body <issue-body>', website: 'Repository → Issues → New issue → describe the confirmed problem' }, ['issue-title', 'issue-body']), step('Reference the resolution', 'Closes the issue when a real resolving commit is merged.', { shell: 'git commit -m <commit-message>', powershell: 'git commit -m <commit-message>', website: 'In the pull request description, add: Closes #<issue-number>' }, ['commit-message', 'issue-number'])],
  },
  yolo: {
    difficulty: 'Intermediate', effort: 'Normal feature time plus verification wait', prerequisites: ['A meaningful PR', 'Passing automated checks', 'A repository whose normal rules do not require review'], mission: 'merge-safely', visual: 'reviews',
    recognizes: 'Reportedly, merging a pull request without a submitted review.', label: 'Community-reported; bot review behavior is uncertain',
    workflow: ['Build and test a meaningful change on a branch.', 'Review the diff locally and let automated checks finish.', 'Inspect submitted review states.', 'Only if the repository’s existing process permits it, merge normally without soliciting or removing a review.', 'Wait for GitHub to decide credit.'],
    verify: ['PR was meaningful', 'Checks passed', 'No safeguards or required reviews were bypassed', 'Submitted bot review effects remain uncertain'],
    troubleshoot: ['Never weaken branch protection, dismiss reviews, or remove reviewers for this.', 'A COMMENTED bot review may or may not matter; there is no definitive public rule.', 'Do not create another test PR merely because credit is delayed.'],
    commands: [step('Review locally', 'Shows the commits and diff you are considering merging.', { shell: 'git log --oneline main..<branch-name> && git diff main...<branch-name>', powershell: 'git log --oneline main..<branch-name>; git diff main...<branch-name>', gh: 'gh pr diff <pr-number>' }, ['branch-name', 'pr-number']), step('Inspect checks and reviews', 'Reads the pull request state; it does not change it.', { gh: 'gh pr view <pr-number> --json reviews,statusCheckRollup,mergeable', website: 'Pull request → Checks and review summary → inspect every result' }, ['pr-number'])],
  },
  'pair-extraordinaire': {
    difficulty: 'Intermediate', effort: 'One genuine pairing session', prerequisites: ['Two real contributors', 'A shared meaningful change', 'The collaborator’s confirmed GitHub-associated email'], mission: 'coauthor', visual: 'contributors', requiresContributorConfirmation: true,
    recognizes: 'Truthful joint authorship on work that lands through a pull request.', label: 'Community-reported; GitHub documents co-author trailers',
    workflow: ['Split or pair on real parts of the same change.', 'Combine and review both contributions together.', 'Ask the collaborator to confirm their GitHub-associated email.', 'Confirm genuine contribution in this guide.', 'Create one commit with exactly one truthful trailer for that collaborator.', 'Inspect the final commit, push through a normal PR, and verify both contributors.'],
    verify: ['Both people contributed to this exact commit', 'Email was confirmed by the collaborator', 'Trailer follows a blank line', 'Merged commit shows both contributors'],
    troubleshoot: ['A plain-text name without a linked avatar often means the email does not match.', 'Never guess an email or add a person who only reviewed after the commit.'],
    commands: [step('Create the joint commit', 'Records shared work and its truthful authorship trailer.', { shell: 'git commit -m <commit-message> -m <coauthor-trailer>', powershell: 'git commit -m <commit-message> -m <coauthor-trailer>' }, ['commit-message', 'collaborator-name', 'collaborator-email']), step('Inspect authorship', 'Shows the complete commit message before it is pushed.', { shell: 'git log -1 --format=full', powershell: 'git log -1 --format=full', gh: 'git log -1 --format=full' })],
  },
  'galaxy-brain': {
    difficulty: 'Intermediate', effort: '30–120 minutes per useful answer', prerequisites: ['Relevant subject expertise', 'A reproducible question', 'A Discussion category that accepts answers'], mission: 'discussion', visual: 'discussion',
    recognizes: 'Answers that are accepted in GitHub Discussions.', label: 'Community-reported; acceptance mechanics are official',
    workflow: ['Find a recent unanswered question within your expertise.', 'Reproduce or research the problem.', 'Write a safe answer with steps, reasoning, limitations, and sources.', 'Disclose uncertainty and follow up politely.', 'Let the question author or authorized repository participant decide whether to mark it answered.'],
    verify: ['Answer addresses the exact question', 'No unsafe commands or invented facts', 'The answer is visibly marked as accepted', 'Acceptance cannot be requested as a badge favor'],
    troubleshoot: ['Some Discussion categories do not accept answers.', 'A useful answer can remain unaccepted; that is still valuable work.'], commands: [],
  },
  starstruck: {
    difficulty: 'Advanced', effort: 'Days to months', prerequisites: ['A useful public project', 'A clear audience', 'Permission to share in chosen communities'], visual: 'profile',
    recognizes: 'Community-reported star milestones on a repository you created.', label: 'Community-reported; depends on genuine public interest',
    workflow: ['State the user problem and one-sentence value proposition.', 'Add installation, usage, screenshots, and a live demo.', 'Publish a tested release with clear notes.', 'Share where project promotion is permitted and ask for feedback, not stars.', 'Improve the project from real user responses.'],
    verify: ['Repository is public and useful', 'README and demo work for a new visitor', 'Interest is organic', 'No reciprocal, paid, automated, or alternate-account stars'],
    troubleshoot: ['Low interest is product feedback, not a reason to campaign for stars.', 'Make onboarding easier and speak to a narrower audience.'],
    commands: [step('Prepare a release tag', 'Creates a local annotated version marker after tests pass.', { shell: 'git tag -a <release-version> -m <release-notes>', powershell: 'git tag -a <release-version> -m <release-notes>', gh: 'gh release create <release-version> --draft --generate-notes' }, ['release-version', 'release-notes'])],
  },
  'public-sponsor': {
    difficulty: 'Optional', effort: '10–20 minutes plus a real payment', prerequisites: ['An independent desire to support the work', 'A maintainer or project you genuinely value'], visual: 'sponsor',
    recognizes: 'A public sponsorship through GitHub Sponsors.', label: 'Community-reported achievement condition; payment workflow is official',
    workflow: ['Identify a maintainer or project you genuinely use.', 'Read the current one-time and recurring tiers.', 'Review billing, benefits, cancellation terms, and your budget.', 'Choose independently whether to continue on GitHub. This guide never opens checkout or initiates payment.'],
    verify: ['Decision is voluntary', 'Current tier and frequency were reviewed on GitHub', 'No payment data was entered here'],
    troubleshoot: ['This achievement costs real money and is never required.', 'Tier availability and prices belong to each sponsor profile and can change.'], commands: [],
  },
  'heart-on-your-sleeve': museum('Heart On Your Sleeve', 'An unreleased or experimental achievement whose requirements are uncertain.', 'Experimental / unavailable; no official earning procedure'),
  'open-sourcerer': museum('Open Sourcerer', 'An unreleased or experimental achievement whose requirements are uncertain.', 'Experimental / unavailable; no official earning procedure'),
  'arctic-code-vault': museum('Arctic Code Vault Contributor', 'Contributions included in GitHub’s February 2, 2020 Arctic Code Vault snapshot.', 'Historical GitHub Archive Program event', 'https://archiveprogram.github.com/arctic-vault/'),
  'mars-2020': museum('Mars 2020 Contributor', 'Contributions to qualifying Mars 2020 Helicopter repositories during the ended event.', 'Officially historical and no longer available', 'https://docs.github.com/en/account-and-profile/reference/profile-reference#list-of-qualifying-repositories-for-mars-2020-helicopter-contributor-achievement'),
};

function step(title, changes, variants, placeholders = [], expected = '', recovery = '') { return { title, changes, variants, placeholders, expected, recovery }; }
function museum(name, recognizes, label, source = OFFICIAL_PROFILE_DOC) { return { difficulty: 'Museum exhibit', effort: 'Read only', prerequisites: ['None'], recognizes, label, visual: 'museum', workflow: ['Read the historical context.', 'Do not follow unofficial terminal recipes or manufacture activity.'], verify: ['No current earning route is presented', 'Source and uncertainty are clearly labelled'], troubleshoot: ['If GitHub announces a supported change, verify it in primary documentation before acting.'], commands: [], source }; }

export const guidedPaths = Object.freeze(achievements.map((achievement) => Object.freeze({
  ...definitions[achievement.id], id: achievement.id, name: achievement.name, status: achievement.status,
  statusLabel: achievement.statusLabel, sourceLabel: achievement.source, dependency: achievement.dependency,
  ethicalNotice: sharedNotice, references: referenceMap[achievement.id], guaranteed: false,
})));

export function getGuidedPath(id) { return guidedPaths.find((path) => path.id === id) || guidedPaths[0]; }

export function validateGuidedPaths(paths = guidedPaths) {
  const errors = [];
  const ids = new Set();
  paths.forEach((path, index) => {
    ['id', 'name', 'status', 'statusLabel', 'sourceLabel', 'dependency', 'difficulty', 'effort', 'recognizes', 'label', 'ethicalNotice'].forEach((key) => {
      if (typeof path[key] !== 'string' || !path[key].trim()) errors.push(`path ${index + 1} needs ${key}`);
    });
    ['prerequisites', 'workflow', 'verify', 'troubleshoot', 'commands', 'references'].forEach((key) => { if (!Array.isArray(path[key])) errors.push(`${path.id} needs ${key}`); });
    if (ids.has(path.id)) errors.push(`duplicate path ${path.id}`); ids.add(path.id);
    if (path.guaranteed !== false) errors.push(`${path.id} must not guarantee completion`);
  });
  return errors;
}
