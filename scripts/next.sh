#!/usr/bin/env bash
set -euo pipefail

EXPECTED_REPO="Isaiahchonchoramirez/achievement-playground"

usage() {
  cat <<'HELP'
Usage:
  ./scripts/next.sh claude
  ./scripts/next.sh chatgpt

Requires a completely clean working tree, updates main with --ff-only,
creates a new AI branch, resets the mailbox, and writes a handoff context.
HELP
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" || "${1:-}" == "help" ]]; then
  usage
  exit 0
fi

AI="${1:-}"
case "$AI" in
  claude|chatgpt)
    ;;
  *)
    usage >&2
    exit 1
    ;;
esac

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$ROOT" ]; then
  echo "Not inside a Git repository." >&2
  exit 1
fi

cd "$ROOT"

for required in ai-wiki/MAILBOX.md ai-wiki/VISION.md scripts/handoff.sh; do
  if [ ! -f "$required" ]; then
    echo "Required collaboration file is missing: $required" >&2
    exit 1
  fi
done

origin="$(git remote get-url origin 2>/dev/null || true)"
case "$origin" in
  "git@github.com:${EXPECTED_REPO}.git"|"https://github.com/${EXPECTED_REPO}"|"https://github.com/${EXPECTED_REPO}.git"|"ssh://git@github.com/${EXPECTED_REPO}.git")
    ;;
  *)
    echo "Refusing to rotate branches: origin is not the expected repository (${EXPECTED_REPO})." >&2
    exit 1
    ;;
esac

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is not clean. Commit, stash, move, or remove tracked and untracked changes before starting the next round." >&2
  exit 1
fi

git switch main
git pull --ff-only origin main

STAMP="$(date '+%Y%m%d-%H%M')"
BRANCH="ai/${AI}-${STAMP}"
git switch -c "$BRANCH"

NAME="Claude"
if [ "$AI" = "chatgpt" ]; then
  NAME="ChatGPT"
fi

cat > ai-wiki/MAILBOX.md <<EOF2
# Mailbox

PR_TITLE: TBD
FROM: previous round
TO: ${NAME}
STATUS: ready-for-build

## Summary

The previous round has merged. Start from current main and inspect the repository and wiki.

## Why

Continue the owner-approved Git Quest: Branchfall direction with a coherent real product improvement.

## Implementation notes

Own routine implementation decisions. Keep the change reviewable and leave the repository in a coherent state.

## Validation

Run the relevant project validation for whatever you change.

## Reviewer focus

Leave concrete review guidance for the other AI when the build is finished.

## Next AI assignment

Before handing back, replace this mailbox with a useful baton pass and set a concrete PR_TITLE.
EOF2

"$ROOT/scripts/handoff.sh" overview
