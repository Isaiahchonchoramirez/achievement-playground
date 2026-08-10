#!/usr/bin/env bash
set -euo pipefail

EXPECTED_REPO="Isaiahchonchoramirez/achievement-playground"

usage() {
  cat <<'HELP'
Usage:
  ./scripts/review.sh <PR_NUMBER>

Fetches exactly the requested GitHub pull-request ref using normal Git
authentication, checks it out locally, fetches origin/main, and writes an AI
review handoff. GitHub CLI is not required.
HELP
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" || "${1:-}" == "help" ]]; then
  usage
  exit 0
fi

PR_NUMBER="${1:-}"
if [[ ! "$PR_NUMBER" =~ ^[0-9]+$ ]]; then
  usage >&2
  exit 1
fi

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "$ROOT" ]; then
  echo "Not inside a Git repository." >&2
  exit 1
fi

cd "$ROOT"

origin="$(git remote get-url origin 2>/dev/null || true)"
case "$origin" in
  "git@github.com:${EXPECTED_REPO}.git"|"https://github.com/${EXPECTED_REPO}"|"https://github.com/${EXPECTED_REPO}.git"|"ssh://git@github.com/${EXPECTED_REPO}.git")
    ;;
  *)
    echo "Refusing to review: origin is not the expected repository (${EXPECTED_REPO})." >&2
    exit 1
    ;;
esac

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is not clean. Commit, stash, move, or remove local changes before checking out a PR." >&2
  exit 1
fi

git fetch origin "pull/${PR_NUMBER}/head"
git switch -C "review/pr-${PR_NUMBER}" FETCH_HEAD
git fetch origin main

"$ROOT/scripts/handoff.sh" review
