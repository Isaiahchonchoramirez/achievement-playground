# Decisions

## Keep the application dependency-free

The site is intentionally plain HTML, CSS, and JavaScript. Tooling should avoid adding runtime dependencies unless a future change clearly earns the complexity.

## Use Git as the AI collaboration bus

ChatGPT and Claude do not need a direct private channel. They collaborate asynchronously through code, diffs, pull requests, context snapshots, and this wiki.

## Keep generated context local

`contextNNN.txt`, temporary context files, generated PR bodies, and local patch-transfer files are ignored. They are transport artifacts, not project history.

## Let the AIs maintain the wiki

The humans should not have to rewrite project context after every round. Builders update durable state, decisions, backlog, and the mailbox as part of normal engineering work.

## Prefer explicit mutations over hidden convenience

AI helper scripts may automate validation and transport, but they must not silently choose a pull request or stage arbitrary working-tree files. Operations that can commit, push, or switch review targets must be explicit and fail closed when repository state is ambiguous.

## Keep game rules in a pure reducer, separate from rendering

`game/mission.js` holds every Git Quest rule and touches no DOM, no clock and no
randomness. `game/game.js` renders state and dispatches actions but decides
nothing.

The reason is testability: because the reducer is pure, `scripts/test-mission.mjs`
can exercise every rule and an exhaustive walk of the reachable state space in CI
with no browser and no dependencies. A rule that migrates into `game.js` becomes
invisible to those tests. Keep the boundary.

## Teach by consequence, and always name the recovery

Wrong moves are playable rather than blocked. Committing straight to main,
opening an empty pull request and merging before validation each explain what
happened and what to do next, and two of them are recoverable in-game.

Feedback wording is part of the feature, not decoration around it. A message that
says only "not allowed" teaches nothing.

## Mission progress is local and disposable

Git Quest persists to `localStorage` only. No cookies, no accounts, no network.
Unrecognised or corrupt saved data falls back to a fresh mission instead of
throwing, because a stale save must never be able to break the page.
