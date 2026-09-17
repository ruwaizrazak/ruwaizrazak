# CLAUDE.md — ruwaizrazak.com

All project rules — stack, conventions, styling, Astro/Svelte boundaries, SEO, key files, testing, and the contract Codex follows when executing a plan — live in `AGENTS.md`, imported below so Claude and Codex read the same text. **Edit shared rules in `AGENTS.md`, never here.** This file holds only what is Claude's job.

@AGENTS.md

## Orchestrating Codex (Claude only)

When the user asks for a plan to be executed by Codex, Claude plans and reviews; Codex implements. Full runbook: `docs/plans/codex-execution-workflow-2026-09-17-0655-plan.md` Phase B; contracts in its `-architecture.md`.

### Plans Codex can execute without drifting
- Start from `docs/plans/_TEMPLATE-plan.md`. Every step: `### S<n> — title`, a one-line `- files:` allowlist, `AC<n>.<m>` acceptance criteria verifiable from a diff or command, `depends-on`, `verify`, `out-of-scope`. Phases ≤ ~5 steps, build green at each boundary.
- Decide every choice with more than one reasonable answer in the plan and record why in `-decisions.md`. Undecided choices are where drift comes from.
- Keep `<base>-runlog.md` beside the trio: baseline, verdict tables, clarifications, checkpoint SHAs.

### Running it
- Always through `scripts/agents/run-codex.sh <read|implement|fix> <base> <phase> <filled-prompt>` — it pins `gpt-5.6-sol` at high effort, the sandbox, the report schema and stdin. Never call `codex exec` directly: with stdin left open it hangs forever. Launch it with `run_in_background` and wait for the notification.
- Fill a copy of `scripts/agents/prompts/<mode>.md` in the scratchpad; the wrapper refuses unfilled `{{PLACEHOLDERS}}`.
- Per phase: baseline → `read` (read-only) → gate its questions → `implement` → review → `fix` (≤ 2 rounds) → checkpoint commit.
- Branch `codex/<base>`, one Codex run at a time. Approving a Codex plan authorises checkpoint commits on that branch; never commit to `main`, push, or merge without asking.

### Gating questions
- Answerable from the repo or the plan's intent → answer it in the prompt's clarifications and in `-decisions.md` → Clarifications.
- Anything touching scope, a design value or hierarchy, published content, dependencies, or a shared export → ask the user; record the answer under the plan's Amendments, dated.

### Reviewing
- Trust nothing unverified. Run `scripts/agents/check-scope.sh <plan> <baseline-sha> <step-ids…>`, re-run build / unit / integrity yourself, and run the plan's E2E specs on chromium **and** webkit — Codex cannot, its sandbox cannot bind ports. For `must-fail-before` tests, run them against the baseline SHA too.
- Give every acceptance criterion a verdict in the runlog: MATCH / DEVIATION-REPORTED / DEVIATION-UNREPORTED / MISSING / EXTRA. An unreported deviation is a finding even when the code is right. Spot-check the `evidence` Codex cited.
- Send findings back as numbered items tied to AC IDs, each with the exact expected outcome. Do not edit implementation files yourself — it hides whether the plan was executable.

### Escalate to the user
Scope, design value, published content, dependency or shared-export changes; a step still blocked after clarification; two failed fix rounds; new failures the diff does not explain; forbidden files touched; `gpt-5.6-sol` unavailable (never fall back to another model).

### Close-out
Run `npm run test:all` once over the branch, report verdicts, deviations and escalations, and offer a PR or merge. Promote every finding with a general cause into `AGENTS.md` → "Plan Drift Lessons", and fix the template or scripts when the plan format was the gap.
