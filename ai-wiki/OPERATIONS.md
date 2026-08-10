# Operator Guide

This page is for Isaiah, Zach, Claude, and ChatGPT.

Generated handoff files appear at the repository root as `contextNNN.txt` and are ignored by Git.

## Give the repo to an AI

Normal build handoff:

```bash
./scripts/handoff.sh overview
```

Review current local changes:

```bash
./scripts/handoff.sh changes
```

Review the current branch as a PR-shaped diff:

```bash
./scripts/handoff.sh review
```

Inspect one file:

```bash
./scripts/handoff.sh file app.js
```

These commands only read repository state and write a local ignored `contextNNN.txt` file.

Upload that file to the receiving AI. Saying `Your turn.` is enough.

## Start the next AI round

For Claude:

```bash
./scripts/next.sh claude
```

For ChatGPT:

```bash
./scripts/next.sh chatgpt
```

`next.sh` refuses to run unless tracked and untracked working-tree state is clean. It verifies the expected repository, switches to `main`, pulls `origin/main` with `--ff-only`, creates a new local branch, updates the tracked mailbox, and writes a local context handoff.

## Review a pull request

Always name the PR:

```bash
./scripts/review.sh 4
```

`review.sh` uses GitHub's pull-request Git ref directly through normal Git authentication. It does not require GitHub CLI and never guesses a PR number.

## Ship the active branch

Stage exactly the files that belong in the PR:

```bash
git add path/to/file another/file
```

Then:

```bash
./scripts/ship.sh
```

`ship.sh` does not stage files and does not require GitHub CLI. It validates, commits only staged files, pushes through normal Git authentication, generates `pr-body.md`, and opens the repository's Pull Requests page when macOS `open` is available.

Existing PRs update automatically after the push. For a new branch, use the GitHub page to create the PR.

## Generate only the PR body

```bash
./scripts/pr.sh
```

This writes ignored `pr-body.md`. It does not commit or push.

## If anything fails

Copy the terminal error to the active AI.
