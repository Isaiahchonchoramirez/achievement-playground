#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'HELP'
Usage:
  ./scripts/pr.sh

Generates ignored pr-body.md from ai-wiki/MAILBOX.md and Git history.
Does not stage, commit, push, or open GitHub.
HELP
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" || "${1:-}" == "help" ]]; then
  usage
  exit 0
fi

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$ROOT" ]; then
  echo "Not inside a Git repository." >&2
  exit 1
fi

cd "$ROOT"

MAILBOX="ai-wiki/MAILBOX.md"
BODY="pr-body.md"

if [ ! -f "$MAILBOX" ]; then
  echo "Required collaboration file is missing: $MAILBOX" >&2
  exit 1
fi

TITLE="$(sed -n 's/^PR_TITLE:[[:space:]]*//p' "$MAILBOX" | head -1)"
if [ -z "$TITLE" ] || [ "$TITLE" = "TBD" ]; then
  echo "MAILBOX.md must contain a concrete PR_TITLE before generating a PR body." >&2
  exit 1
fi

section() {
  local heading="$1"
  awk -v heading="$heading" '
    $0 == "## " heading {capture=1; next}
    /^## / && capture {exit}
    capture {print}
  ' "$MAILBOX" | sed '/./,$!d' | sed -e :a -e '/^\n*$/{$d;N;ba' -e '}'
}

SUMMARY="$(section "Summary")"
WHY="$(section "Why")"
NOTES="$(section "Implementation notes")"
VALIDATION="$(section "Validation")"
REVIEWER="$(section "Reviewer focus")"
NEXT="$(section "Next AI assignment")"

if [ -z "$SUMMARY" ] || [ -z "$WHY" ] || [ -z "$VALIDATION" ]; then
  echo "MAILBOX.md needs non-empty Summary, Why, and Validation sections." >&2
  exit 1
fi

{
  printf '# %s\n\n' "$TITLE"
  printf '## Summary\n\n%s\n' "$SUMMARY"
  printf '\n## Why\n\n%s\n' "$WHY"

  if [ -n "$NOTES" ]; then
    printf '\n## Implementation\n\n%s\n' "$NOTES"
  fi

  printf '\n## Changed surface\n\n```text\n'
  if git rev-parse --verify origin/main >/dev/null 2>&1; then
    git diff --stat origin/main...HEAD
  else
    git show --stat --oneline HEAD
  fi
  printf '```\n'

  printf '\n## Validation\n\n%s\n' "$VALIDATION"

  if [ -n "$REVIEWER" ]; then
    printf '\n## Reviewer focus\n\n%s\n' "$REVIEWER"
  fi

  printf '\n## Commits\n\n```text\n'
  if git rev-parse --verify origin/main >/dev/null 2>&1; then
    git log --oneline origin/main..HEAD
  else
    git log --oneline -5
  fi
  printf '```\n'

  if [ -n "$NEXT" ]; then
    printf '\n## Next AI handoff\n\n%s\n' "$NEXT"
  fi
} > "$BODY"

printf '%s\n%s/%s\n' "$TITLE" "$ROOT" "$BODY"
