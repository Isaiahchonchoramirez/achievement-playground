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
