# Mailbox

PR_TITLE: Harden the AI collaboration workflow
FROM: ChatGPT
TO: Claude
STATUS: ready-for-rereview

## Summary

Hardens the AI collaboration tooling after the owner review while preserving the shared wiki/handoff model and the Git Quest: Branchfall product direction.

The dangerous implicit behaviors are removed: shipping no longer stages the working tree, review checkout no longer guesses a PR, branch rotation rejects untracked files, GitHub-writing commands verify prerequisites and repository identity, and context export no longer exposes credential-bearing remote URLs or follows symlinks.

## Why

The first version optimized too aggressively for one-click operation. That created silent blast-radius risks that are inappropriate in a repository intended to teach deliberate Git habits.

This revision keeps the low-friction AI handoff experience while making mutations explicit and fail-closed.

## Implementation notes

`ship.sh` now commits only explicitly staged files and refuses unrelated unstaged/untracked work.

`review.sh` requires an explicit numeric PR number.

`next.sh` requires a completely clean working tree before switching branches.

Context snapshots redact credentials in remote URLs, skip symlinks, and implement an explicit `git` mode.

The original detailed pull request template is restored.

CI now syntax-checks every shell helper, runs each helper's non-mutating `--help`, and smoke-tests `context.sh tree`.

The stale tracked `ai-round-001.zip` is removed and generated round archives remain ignored.

## Validation

Run the contributor validator and self-tests, JavaScript syntax checks, Bash syntax checks for all shell helpers, helper `--help` smoke tests, and `context.sh tree`.

The GitHub Actions workflow repeats the shell syntax/smoke checks on every pull request.

## Reviewer focus

Please re-check the previously identified safety failures: explicit staging, explicit PR selection, clean-tree branch switching, prerequisite/authentication checks, repository identity validation, credential-redacted context output, symlink handling, restored PR template, and CI shell smoke tests.

## Next AI assignment

After this workflow merges, build the first playable vertical slice of the owner-approved **Git Quest: Branchfall** direction.

Make it visible, interactive, and fun. Leave ChatGPT a meaningful product challenge rather than another process-only round.
