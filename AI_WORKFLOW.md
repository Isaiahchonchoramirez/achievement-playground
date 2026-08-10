# AI Collaboration Workflow

This repository is developed by two human/AI pairs:

- Isaiah + Claude
- Zach + ChatGPT

The humans operate GitHub and make final merge decisions. The active AI owns routine engineering judgment, implementation, testing, documentation, and the baton pass.

## Read this first

Before building or reviewing, read:

1. `ai-wiki/VISION.md`
2. `ai-wiki/STATE.md`
3. `ai-wiki/DECISIONS.md`
4. `ai-wiki/BACKLOG.md`
5. `ai-wiki/MAILBOX.md`
6. `ai-wiki/OPERATIONS.md`
7. the actual code and current Git diff

Authority order:

1. Code and tests
2. Git / PR state
3. `ai-wiki/`
4. generated `contextNNN.txt`

If the wiki disagrees with the code, update the wiki.

## Build behavior

Do not ask the human to choose routine implementation details.

Choose a coherent improvement, implement it, validate it, and make it pleasant to review.

Prefer visible product progress, small dependency surfaces, understandable architecture, accessibility, deterministic behavior, reversible decisions, and useful tests.

Do not manufacture filler work merely to create GitHub activity.

## Safety boundaries

The helper scripts are convenience tools, not permission to mutate arbitrary work.

- `ship.sh` commits only files the human or active AI explicitly staged first.
- `ship.sh` refuses to run with unrelated unstaged or untracked files.
- `review.sh` requires an explicit PR number and never guesses.
- `next.sh` refuses to switch branches unless the working tree is clean, including untracked files.
- Network-writing helpers verify the expected repository and prerequisites before acting.
- Context snapshots redact credentials from remote URLs and never read symlink targets.

Read `ai-wiki/OPERATIONS.md` before using a helper for the first time.

## Review behavior

Review the actual diff.

If a problem is straightforward, fix it instead of asking the human to relay review comments between AIs.

A review should answer:

- Does it work?
- Is the design understandable?
- Is anything unsafe or fragile?
- Is accessibility preserved?
- What should the other AI build next?

## Handoff behavior

Before handing the repo to the other AI:

1. Leave the code in a coherent state.
2. Update durable wiki knowledge.
3. Replace `ai-wiki/MAILBOX.md`.
4. Write a concrete `PR_TITLE`.
5. Fill every narrative mailbox section.
6. Leave the other AI a meaningful next challenge.

The mailbox is also the source for the generated PR description.

## Context commands

The exact human-facing commands and their side effects are documented in `ai-wiki/OPERATIONS.md`.

When a `contextNNN.txt` file is uploaded to you, treat it as a generated handoff package. Do not ask the human to explain the repo again.
