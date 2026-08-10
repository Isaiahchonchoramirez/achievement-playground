#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-overview}"
TARGET="${2:-}"

usage() {
  cat <<'HELP'
Usage:
  ./scripts/context.sh overview
  ./scripts/context.sh changes
  ./scripts/context.sh review
  ./scripts/context.sh full
  ./scripts/context.sh tree
  ./scripts/context.sh file <path>
HELP
}

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

next_context_number() {
  local highest=0
  local file base number

  shopt -s nullglob
  for file in context[0-9][0-9][0-9].txt; do
    base="${file#context}"
    number="${base%.txt}"
    if [[ "$number" =~ ^[0-9]{3}$ ]] && (( 10#$number > highest )); then
      highest=$((10#$number))
    fi
  done
  shopt -u nullglob

  printf '%03d' "$((highest + 1))"
}

NUMBER="$(next_context_number)"
OUTPUT="context${NUMBER}.txt"
TMP_OUTPUT=".context.tmp.$$"

cleanup() {
  rm -f "$TMP_OUTPUT"
}
trap cleanup EXIT INT TERM

metadata_section() {
  printf 'AI PROJECT CONTEXT\n'
  printf 'Generated: %s\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')"
  printf 'Mode: %s\n\n' "$MODE"

  printf '=== REPOSITORY ===\n'
  basename "$ROOT"
  printf '\n'
}

redact_remote_url() {
  printf '%s' "$1" | sed -E 's#(https?://)[^/@]+@#\1[REDACTED]@#'
}

git_section() {
  local remote url

  printf '=== BRANCH ===\n'
  git branch --show-current

  printf '\n=== STATUS ===\n'
  git status --short --branch

  printf '\n=== REMOTES ===\n'
  while IFS= read -r remote; do
    [ -n "$remote" ] || continue
    url="$(git remote get-url "$remote" 2>/dev/null || true)"
    printf '%s\t%s\n' "$remote" "$(redact_remote_url "$url")"
  done < <(git remote)

  printf '\n=== RECENT COMMITS ===\n'
  git log --oneline --decorate --graph -15
  printf '\n'
}

tree_section() {
  printf '=== TRACKED PROJECT TREE ===\n'
  git ls-files | sort
  printf '\n'
}

emit_file() {
  local file="$1"
  local size

  if [ -L "$file" ]; then
    printf '=== FILE: %s ===\n' "$file"
    printf '[Skipped: symlinks are never followed into AI context]\n\n'
    return
  fi

  if [ ! -f "$file" ]; then
    return
  fi

  size="$(wc -c < "$file" | tr -d ' ')"

  printf '=== FILE: %s ===\n' "$file"

  if (( size > 200000 )); then
    printf '[Skipped: %s bytes exceeds 200000-byte context limit]\n\n' "$size"
    return
  fi

  cat "$file"
  printf '\n\n'
}

overview_section() {
  tree_section

  local file
  for file in \
    README.md \
    CONTRIBUTING.md \
    AI_WORKFLOW.md \
    ai-wiki/INDEX.md \
    ai-wiki/VISION.md \
    ai-wiki/STATE.md \
    ai-wiki/DECISIONS.md \
    ai-wiki/BACKLOG.md \
    ai-wiki/MAILBOX.md \
    ai-wiki/OPERATIONS.md \
    app.js \
    data/contributors.json
  do
    emit_file "$file"
  done
}

changes_section() {
  printf '=== DIFF AGAINST ORIGIN/MAIN ===\n'
  if git rev-parse --verify origin/main >/dev/null 2>&1; then
    git diff --stat origin/main
    printf '\n'
    git diff origin/main
  else
    printf 'origin/main is unavailable.\n'
  fi

  printf '\n=== STAGED DIFF ===\n'
  git diff --cached

  printf '\n=== UNTRACKED FILES ===\n'
  git ls-files --others --exclude-standard
  printf '\n'
}

review_section() {
  printf '=== PR-SHAPED DIFF AGAINST ORIGIN/MAIN ===\n'
  if git rev-parse --verify origin/main >/dev/null 2>&1; then
    git diff --stat origin/main...HEAD
    printf '\n'
    git diff origin/main...HEAD
  else
    printf 'origin/main is unavailable.\n'
  fi

  printf '\n=== AI WIKI ===\n'
  local file
  shopt -s nullglob
  for file in ai-wiki/*.md; do
    emit_file "$file"
  done
  shopt -u nullglob
}

full_section() {
  tree_section

  local file
  while IFS= read -r file; do
    case "$file" in
      *.png|*.jpg|*.jpeg|*.gif|*.ico|*.pdf|*.zip|*.gz|*.woff|*.woff2|*.ttf|*.otf)
        continue
        ;;
    esac
    emit_file "$file"
  done < <(git ls-files | sort)
}

single_file_section() {
  local file="$TARGET"

  if [ -z "$file" ]; then
    echo "Usage: ./scripts/context.sh file <repo-relative-path>" >&2
    exit 1
  fi

  case "$file" in
    /*|../*|*/../*|*/..|.git|.git/*)
      echo "Path must stay inside the repository and outside .git." >&2
      exit 1
      ;;
  esac

  if [ -L "$file" ]; then
    echo "Refusing to read symlink into AI context: $file" >&2
    exit 1
  fi

  if [ ! -f "$file" ]; then
    echo "File not found: $file" >&2
    exit 1
  fi

  emit_file "$file"
}

{
  metadata_section
  git_section

  case "$MODE" in
    overview)
      overview_section
      ;;
    changes)
      changes_section
      ;;
    review)
      review_section
      ;;
    full)
      full_section
      ;;
    tree)
      tree_section
      ;;
    file)
      single_file_section
      ;;
    *)
      echo "Unknown mode: $MODE" >&2
      usage >&2
      exit 1
      ;;
  esac
} > "$TMP_OUTPUT"

mv "$TMP_OUTPUT" "$OUTPUT"
trap - EXIT INT TERM

printf '%s/%s\n' "$ROOT" "$OUTPUT"
