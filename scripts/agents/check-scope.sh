#!/usr/bin/env bash
# Mechanical half of Claude's review of a Codex phase: allowlist, protected paths, and a scan of ADDED lines for
# patterns this repo has already been burnt by. It is a net, not the review — the diff read still decides.
# Contract: docs/plans/codex-execution-workflow-2026-09-17-0655-architecture.md §8
set -euo pipefail

usage() {
  cat <<'EOF'
usage: scripts/agents/check-scope.sh <plan-file> <baseline-sha> <step-id>...

  Allowlist = union of `- files:` entries of the given steps (### S<n> blocks in the plan).
  Changed   = git diff --name-only <baseline-sha> + untracked files.
Exit: 0 clean (warnings may print), 1 any FAIL, 2 usage error.
EOF
}

[[ $# -ge 3 ]] || { usage; exit 2; }
PLAN=$1 SHA=$2; shift 2
REPO=$(git rev-parse --show-toplevel)
cd "$REPO"
[[ -f $PLAN ]] || { echo "no such plan: $PLAN" >&2; exit 2; }
git rev-parse --verify --quiet "$SHA^{commit}" >/dev/null || { echo "not a commit: $SHA" >&2; exit 2; }

# The plan's own trio + runlog are Claude's to edit during the loop, so they never count against Codex.
PLAN_BASE=$(basename "$PLAN" -plan.md)

FAILS=0
fail() { echo "FAIL: $*"; FAILS=$((FAILS + 1)); }

# --- 1. allowlist ---------------------------------------------------------------------------------------------
ALLOW=()
for ID in "$@"; do
  # Step block = from "### <ID> " (or "### <ID>" at end of line) to the next ## / ### heading.
  FILES_LINE=$(awk -v id="$ID" '
    $0 ~ "^### " id "([ —-]|$)" { inblock = 1; next }
    inblock && /^##/ { exit }
    inblock && /^- files:/ { sub(/^- files:[ \t]*/, ""); print; exit }
  ' "$PLAN")
  [[ -n $FILES_LINE ]] || { echo "step $ID not found in $PLAN, or it has no '- files:' line" >&2; exit 2; }
  IFS=',' read -r -a ENTRIES <<< "$FILES_LINE"
  for E in "${ENTRIES[@]}"; do
    # strip backticks, "(new)"/"(edit)" annotations and surrounding whitespace
    E=$(printf '%s' "$E" | sed -E 's/`//g; s/\((new|edit|delete)[^)]*\)//g; s/^[[:space:]]+//; s/[[:space:]]+$//')
    [[ -n $E ]] && ALLOW+=("$E")
  done
done

is_allowed() {    # glob match: a listed pattern may cover several new files
  local f=$1 p
  for p in "${ALLOW[@]}"; do
    # shellcheck disable=SC2053
    [[ $f == $p ]] && return 0
  done
  return 1
}
is_listed_literally() {    # protected paths need an exact, non-glob entry
  local f=$1 p
  for p in "${ALLOW[@]}"; do [[ $f == "$p" ]] && return 0; done
  return 1
}

CHANGED=$( { git diff --name-only "$SHA"; git ls-files --others --exclude-standard; } | sort -u | grep -v "^docs/plans/$PLAN_BASE-" || true)

if [[ -z $CHANGED ]]; then
  echo "no changes since $SHA"
  exit 0
fi

echo "allowlist (${#ALLOW[@]}): ${ALLOW[*]}"
echo "changed:"; printf '  %s\n' $CHANGED
echo

for F in $CHANGED; do
  if ! is_allowed "$F"; then
    fail "$F is outside the allowlist for steps $*"
    continue
  fi
  case $F in
    package.json|package-lock.json|CLAUDE.md|AGENTS.md|docs/plans/*|src/content/*)
      is_listed_literally "$F" || fail "$F is a protected path, matched only by a glob — list it literally in files:"
      ;;
  esac
done

# --- 2. added-line scan ---------------------------------------------------------------------------------------
added_lines() {    # prints the added lines of one file; untracked files count as wholly added
  local f=$1
  if git ls-files --error-unmatch "$f" >/dev/null 2>&1 || git cat-file -e "$SHA:$f" 2>/dev/null; then
    git diff -U0 "$SHA" -- "$f" | grep '^+' | grep -v '^+++' | cut -c2- || true
  elif [[ -f $f ]]; then
    grep -Iv '^$' "$f" 2>/dev/null || true    # -I skips binary files
  fi
}

# Tailwind-shaped `class:` names: a variant colon, an opacity slash, an arbitrary value, a decimal step, or a
# utility prefix. Plain hyphenated names (class:is-upcoming, class:card-shell-wide) are legitimate Svelte.
TW_CLASS='class:([a-z0-9-]*(:|/|\[|\.)|(bg|text|border|p[xytblrse]?|m[xytblrse]?|w|h|size|min-w|max-w|min-h|max-h|gap|space-[xy]|translate-[xy]|scale|rotate|opacity|z|top|left|right|bottom|inset|rounded|shadow|font|leading|tracking|items|justify|overflow|pointer-events|cursor|duration|delay|ease|animate|grid-cols|col-span|flex|order)-|(hidden|block|inline|flex|grid|contents|sr-only|invisible|visible|transition)[={ ])'

# Fail closed: a pattern the local grep cannot compile would otherwise make its check pass silently
# (BSD grep rejects some bracket expressions GNU grep accepts).
for RX in "$TW_CLASS" '\.(skip|only)\(' 'if \(await .*\.count\(\)\)' '#[0-9a-fA-F]{3,8}\b'; do
  set +e; grep -E "$RX" <<< "" >/dev/null 2>&1; RC=$?; set -e
  [[ $RC -le 1 ]] || { echo "internal error: grep cannot compile pattern: $RX" >&2; exit 2; }
done

LEARN=0
for F in $CHANGED; do
  [[ -f $F ]] || continue
  case $F in scripts/agents/*) continue ;; esac    # the tooling itself contains these patterns as data
  LINES=$(added_lines "$F")
  [[ -n $LINES ]] || continue

  case $F in
    tests/*|*.spec.ts|*.test.ts)
      grep -E '\.(skip|only)\(' <<< "$LINES" | sed "s|^|FAIL: $F (added) skip/only: |" && FAILS=$((FAILS + 1)) || true
      grep -E 'if \(await .*\.count\(\)\)' <<< "$LINES" | sed "s|^|FAIL: $F (added) conditional coverage guard: |" && FAILS=$((FAILS + 1)) || true
      ;;
  esac
  case $F in
    *.svelte)
      grep -oE "$TW_CLASS" <<< "$LINES" | sed "s|^|FAIL: $F (added) Tailwind utility in class: directive — use the object form: |" && FAILS=$((FAILS + 1)) || true
      ;;
  esac
  case $F in
    *.svelte|*.astro)
      grep -E '<style' <<< "$LINES" | sed "s|^|WARN: $F (added) <style> block — must qualify under the styling rule: |" || true
      grep -E 'client:visible' <<< "$LINES" | sed "s|^|WARN: $F (added) client:visible drops a first interaction: |" || true
      ;;
  esac
  case $F in
    *.svelte|*.astro|*.css)
      grep -E '#[0-9a-fA-F]{3,8}\b' <<< "$LINES" | sed "s|^|WARN: $F (added) raw hex — tokens, never hex: |" || true
      ;;
  esac
  grep -E '@ts-ignore|@ts-expect-error|eslint-disable' <<< "$LINES" | sed "s|^|WARN: $F (added) suppressed check: |" || true
  N=$(grep -c 'LEARN:' <<< "$LINES" || true)
  LEARN=$((LEARN + N))
done

echo
echo "INFO: $LEARN added // LEARN: comment(s)"
if [[ $FAILS -gt 0 ]]; then
  echo "RESULT: FAIL (see FAIL lines above)"
  exit 1
fi
echo "RESULT: clean"
