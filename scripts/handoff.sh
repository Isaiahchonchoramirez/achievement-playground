#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'HELP'
Usage:
  ./scripts/handoff.sh overview
  ./scripts/handoff.sh changes
  ./scripts/handoff.sh review
  ./scripts/handoff.sh full
  ./scripts/handoff.sh git
  ./scripts/handoff.sh tree
  ./scripts/handoff.sh file <path>
HELP
}

MODE="${1:-overview}"
TARGET="${2:-}"

if [[ "$MODE" == "--help" || "$MODE" == "-h" || "$MODE" == "help" ]]; then
  usage
  exit 0
fi

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$ROOT" ]; then
  echo "Not inside a Git repository." >&2
  exit 1
fi

cd "$ROOT"

for required in AI_WORKFLOW.md ai-wiki/OPERATIONS.md ai-wiki/MAILBOX.md scripts/context.sh; do
  if [ ! -f "$required" ]; then
    echo "Required collaboration file is missing: $required" >&2
    exit 1
  fi
done

if [ "$MODE" = "file" ]; then
  CONTEXT="$("$ROOT/scripts/context.sh" file "$TARGET")"
else
  CONTEXT="$("$ROOT/scripts/context.sh" "$MODE")"
fi

{
  printf '\n=== AI COLLABORATION CONTRACT ===\n'
  cat AI_WORKFLOW.md

  printf '\n\n=== OPERATOR COMMANDS ===\n'
  cat ai-wiki/OPERATIONS.md

  printf '\n\n=== CURRENT AI MAILBOX ===\n'
  cat ai-wiki/MAILBOX.md

  printf '\n\n=== INSTRUCTIONS TO RECEIVING AI ===\n'
  cat <<'PROMPT'
You are now the active engineering partner for this repository.

Use the code, Git state, AI_WORKFLOW.md, and ai-wiki as your working context.
Do not ask the human to re-explain the repository or choose routine implementation details.

If this is a build handoff:
- choose the strongest coherent next action within the owner-approved product direction
- implement it
- test it
- update durable wiki knowledge
- replace MAILBOX.md with a descriptive baton pass
- return directly applicable files and an explicit staging/ship command

If this is a review handoff:
- inspect the actual diff
- test or reason through the changed behavior
- fix straightforward defects directly
- otherwise provide a concise approval or rejection
- leave the next meaningful build challenge in MAILBOX.md

Never ask the human to use `git add -A`. Name the exact files that belong to the task.
Keep the work real and useful. Prefer visible product progress over process-only work.
PROMPT
} >> "$CONTEXT"

printf '%s\n' "$CONTEXT"
