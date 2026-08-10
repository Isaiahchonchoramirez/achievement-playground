#!/usr/bin/env bash
set -euo pipefail

EXPECTED_REPO="Isaiahchonchoramirez/achievement-playground"

usage() {
  cat <<'HELP'
Usage:
  git add <exact files for this task>
  ./scripts/ship.sh

Validates, commits only already-staged files, and pushes the current branch
using normal Git authentication (SSH or HTTPS).

It does not require GitHub CLI and never stages files itself.
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

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command is not installed: $command_name" >&2
    exit 1
  fi
}

verify_repository() {
  local origin
  origin="$(git remote get-url origin 2>/dev/null || true)"

  case "$origin" in
    "git@github.com:${EXPECTED_REPO}.git"|"https://github.com/${EXPECTED_REPO}"|"https://github.com/${EXPECTED_REPO}.git"|"ssh://git@github.com/${EXPECTED_REPO}.git")
      ;;
    *)
      echo "Refusing to ship: origin is not the expected repository (${EXPECTED_REPO})." >&2
      exit 1
      ;;
  esac
}

for required in ai-wiki/MAILBOX.md scripts/pr.sh scripts/validate-contributors.mjs; do
  if [ ! -f "$required" ]; then
    echo "Required project file is missing: $required" >&2
    exit 1
  fi
done

require_command node
verify_repository

BRANCH="$(git branch --show-current)"
if [ -z "$BRANCH" ] || [ "$BRANCH" = "main" ]; then
  echo "Refusing to ship from main. Create or switch to a feature branch first." >&2
  exit 1
fi

if git diff --cached --quiet; then
  echo "Nothing staged. Stage the exact files for this task with 'git add <path> ...' first." >&2
  exit 1
fi

if ! git diff --quiet; then
  echo "Unstaged tracked changes remain. Stage or stash them before shipping." >&2
  exit 1
fi

UNTRACKED="$(git ls-files --others --exclude-standard)"
if [ -n "$UNTRACKED" ]; then
  echo "Untracked files remain. Add, ignore, move, or remove them before shipping:" >&2
  printf '%s\n' "$UNTRACKED" >&2
  exit 1
fi

TITLE="$(sed -n 's/^PR_TITLE:[[:space:]]*//p' ai-wiki/MAILBOX.md | head -1)"
if [ -z "$TITLE" ] || [ "$TITLE" = "TBD" ]; then
  echo "ai-wiki/MAILBOX.md needs a concrete PR_TITLE before shipping." >&2
  exit 1
fi

node scripts/validate-contributors.mjs
node scripts/validate-contributors.mjs --self-test
node --check app.js
node --check scripts/validate-contributors.mjs

for script in scripts/*.sh; do
  bash -n "$script"
done

git diff --cached --check

git commit -m "$TITLE"
git push -u origin "$BRANCH"

"$ROOT/scripts/pr.sh" >/dev/null

printf '\nPushed successfully.\n'
printf 'Existing PRs update automatically.\n'
printf 'PR body generated at: %s/pr-body.md\n' "$ROOT"
printf 'GitHub: https://github.com/%s/pulls\n' "$EXPECTED_REPO"

if command -v open >/dev/null 2>&1; then
  open "https://github.com/${EXPECTED_REPO}/pulls" >/dev/null 2>&1 || true
fi
