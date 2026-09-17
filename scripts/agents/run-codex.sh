#!/usr/bin/env bash
# The ONLY supported way to invoke Codex on a Claude plan. It pins model, effort, sandbox, report schema and
# stdin so no run can drift on flags. Full contract: docs/plans/codex-execution-workflow-2026-09-17-0655-architecture.md §7
#
# LEARN: `codex exec` blocks forever reading stdin when stdin is left open, even if the prompt is an argument.
# Feeding the prompt file as stdin (`- < file`) is what makes it safe to launch from another agent's shell.
set -euo pipefail

usage() {
  cat <<'EOF'
usage: scripts/agents/run-codex.sh <read|implement|fix> <plan-base> <phase> <filled-prompt-file>

  read       read-only sandbox, new session: ownership map, mismatches, questions
  implement  workspace-write sandbox, new session: implement the phase (tree must be clean)
  fix        resumes the phase's implement session with review findings

Artifacts: .agent-runs/<plan-base>/phase-<N>.<mode>[.<round>].{prompt.md,events.jsonl,report.json,stderr.log}
Exit: Codex's exit code; 2 = refused to start; 3 = report missing or not valid JSON.
EOF
}

[[ $# -eq 4 ]] || { usage; exit 2; }
MODE=$1 BASE=$2 PHASE=$3 PROMPT=$4

MODEL=gpt-5.6-sol   # D12: pinned, no fallback. Changing it is the user's call.
EFFORT=high

REPO=$(git rev-parse --show-toplevel)
RUN="$REPO/.agent-runs/$BASE"
SCHEMA="$REPO/scripts/agents/report.schema.json"

[[ -f $PROMPT ]] || { echo "refusing: prompt file not found: $PROMPT" >&2; exit 2; }
[[ $PHASE =~ ^[0-9]+$ ]] || { echo "refusing: phase must be an integer" >&2; exit 2; }
# An unfilled template would send Codex literal {{PLACEHOLDERS}} as instructions.
if grep -q '{{[A-Z_]*}}' "$PROMPT"; then
  echo "refusing: unfilled placeholders in $PROMPT:" >&2
  grep -o '{{[A-Z_]*}}' "$PROMPT" | sort -u >&2
  exit 2
fi
[[ $(git -C "$REPO" branch --show-current) != main ]] || { echo "refusing: on main — use codex/<plan-base>" >&2; exit 2; }
if [[ $MODE == implement ]]; then
  # The plan's own runlog/decisions are edited by Claude at B1–B3, so they are exempt from the clean-tree check.
  DIRTY=$(git -C "$REPO" status --porcelain -- . ":!docs/plans/$BASE-*")
  [[ -z $DIRTY ]] || { echo "refusing: dirty tree — checkpoint the previous phase first:" >&2; echo "$DIRTY" >&2; exit 2; }
fi

mkdir -p "$RUN"
COMMON=(-m "$MODEL" -c "model_reasoning_effort=\"$EFFORT\"" --ignore-user-config --output-schema "$SCHEMA" --json)

case $MODE in
  read)
    TAG="phase-$PHASE.read"
    CMD=(codex exec -C "$REPO" -s read-only "${COMMON[@]}")
    ;;
  implement)
    TAG="phase-$PHASE.implement"
    CMD=(codex exec -C "$REPO" -s workspace-write "${COMMON[@]}")
    ;;
  fix)
    THREAD_FILE="$RUN/phase-$PHASE.thread_id"
    [[ -s $THREAD_FILE ]] || { echo "refusing: no implement session recorded at $THREAD_FILE" >&2; exit 2; }
    ROUND=$(( $(find "$RUN" -maxdepth 1 -name "phase-$PHASE.fix.*.report.json" | wc -l) + 1 ))
    TAG="phase-$PHASE.fix.$ROUND"
    # `resume` has no -s flag, so the sandbox is passed as config. It also has no -C, hence the cd below.
    CMD=(codex exec resume "$(cat "$THREAD_FILE")" -c 'sandbox_mode="workspace-write"' "${COMMON[@]}")
    ;;
  *)
    usage; exit 2
    ;;
esac

cd "$REPO"
cp "$PROMPT" "$RUN/$TAG.prompt.md"
echo "codex $MODE → $RUN/$TAG.*  (model $MODEL, effort $EFFORT)" >&2

set +e
"${CMD[@]}" -o "$RUN/$TAG.report.json" - < "$PROMPT" > "$RUN/$TAG.events.jsonl" 2> "$RUN/$TAG.stderr.log"
CODE=$?
set -e

if [[ $MODE == implement ]]; then
  # Fix rounds must resume the session that wrote the code, so capture its id from the thread.started event.
  node -e '
    const lines = require("fs").readFileSync(process.argv[1], "utf8").split("\n");
    for (const l of lines) { try { const e = JSON.parse(l); if (e.type === "thread.started") { console.log(e.thread_id); process.exit(0); } } catch {} }
    process.exit(1);
  ' "$RUN/$TAG.events.jsonl" > "$RUN/phase-$PHASE.thread_id" || echo "warning: no thread.started event; fix rounds will refuse" >&2
fi

if ! node -e 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))' "$RUN/$TAG.report.json" 2>/dev/null; then
  echo "error: report missing or invalid JSON — see $RUN/$TAG.stderr.log" >&2
  exit 3
fi

echo "$RUN/$TAG.report.json"
exit $CODE
