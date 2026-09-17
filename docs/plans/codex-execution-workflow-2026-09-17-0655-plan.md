# Codex execution workflow — Claude plans, Codex builds, Claude reviews

Repo: `/Users/ruwaizrazak/Developer/ruwaizrazak` (Astro 5 + Svelte 5 + Tailwind 4)

Companions: `codex-execution-workflow-2026-09-17-0655-decisions.md` (why) and `codex-execution-workflow-2026-09-17-0655-architecture.md` (how the pieces fit, schemas, prompt contracts).

---

## Context

The goal is a repeatable loop:

1. **Claude (Opus)** writes a plan trio (`-plan.md`, `-decisions.md`, `-architecture.md`).
2. **Codex (`gpt-5.6-sol`, high reasoning effort)** implements it non-interactively from the terminal.
3. **Claude** reviews the diff against the plan, re-runs the checks, and either approves the phase or sends numbered findings back to the same Codex session.

The failure mode this plan exists to prevent is **drift**: Codex silently deciding something the plan did not decide, touching files the plan did not name, or reporting "done" on criteria it did not meet. `AGENTS.md` already records eight drift lessons from previous plans. Each one was an unasked decision.

The workflow has three layers of defence against it:

- **A plan format precise enough to check mechanically.** Every step has an ID, a file allowlist and numbered acceptance criteria.
- **A non-interactive executor contract.** Codex cannot ask questions mid-run, so "ask permission" becomes "stop that step and report it".
- **A reviewer that trusts nothing it did not verify.** Claude re-runs every check itself, and an unreported deviation counts as a finding even when the code is right.

---

## Verified environment facts (2026-09-17)

Each of these was tested, not assumed. The architecture doc explains what each one implies.

| Fact | Result |
|---|---|
| Codex CLI | `codex-cli 0.154.0` at `~/.local/bin/codex`, authenticated |
| Model | `gpt-5.6-sol` is listed and responds at `model_reasoning_effort="high"` |
| **stdin trap** | `codex exec "prompt"` **hangs forever** when stdin is left open ("Reading additional input from stdin…"). Always pass the prompt as `- < prompt.md`. |
| `--output-schema` + `-o` | Works; the final message is valid JSON matching the schema |
| `--json` | The first event is `{"type":"thread.started","thread_id":"<uuid>"}`, which is how the session ID is captured |
| `codex exec resume <id>` | Keeps context; accepts `--output-schema`, `-o`, `--json`. It has **no `-s` flag**, so the sandbox for resumed runs must be passed with `-c sandbox_mode=…` (to be confirmed in the pilot, step A9) |
| `--ignore-user-config` | Removes the MCP startup errors (design-connector auth, computer-use, browser) and keeps auth. Codex does not need those tools for this work. |
| `npm run build` in the Codex sandbox | ✅ passes (~11s, 47 pages) |
| `vitest run tests/unit` in the sandbox | ✅ 94/94 |
| `vitest run tests/integrity` in the sandbox | 88/89. The failure is **pre-existing** and reproduces outside the sandbox: `seo.test.ts › images › gives content images a descriptive, non-empty alt` |
| Playwright in the sandbox | ❌ `listen EPERM 127.0.0.1:4322`. The sandbox cannot bind a port, so **Codex cannot run E2E; Claude runs it** |
| `git` in Claude's shell | ~~broken by the unaccepted Xcode licence~~. **Resolved 2026-09-17** (P0 done by user). |

---

## Prerequisite (user action, needs sudo)

**P0. Accept the Xcode licence** so `/usr/bin/git` works again. Claude cannot do this because it needs your password.

```bash
sudo xcodebuild -license accept
```

Done when `git status` prints normally in Claude's shell.

---

## Phase A — build the workflow (one-time setup)

Claude does Phase A directly, not Codex. The protocol cannot be used to build itself (see decisions D1). Every step lists the files it may touch and what "done" means.

### A1 — Ignore raw run artifacts

- **files:** `.gitignore` (edit)
- **acceptance:**
  - AC1.1 `.agent-runs/` is ignored; `git check-ignore .agent-runs/x` succeeds.

### A2 — Report schema

- **files:** `scripts/agents/report.schema.json` (new)
- **acceptance:**
  - AC2.1 Matches the schema in the architecture doc §5: every property `required`, `additionalProperties: false` at every level (the structured-output rules demand it).
  - AC2.2 A trivial `codex exec --output-schema` run against it returns valid JSON.

### A3 — Prompt templates

- **files:** `scripts/agents/prompts/read.md`, `scripts/agents/prompts/implement.md`, `scripts/agents/prompts/fix.md` (new)
- **acceptance:**
  - AC3.1 Text as in architecture §6, with `{{PLAN_BASE}}`, `{{PHASE}}`, `{{STEP_IDS}}`, `{{CLARIFICATIONS}}`, `{{FINDINGS}}` placeholders.
  - AC3.2 Each template restates the stop rule and the forbidden-action list. They are not left to `AGENTS.md` alone, because repeating them in the prompt is what keeps them in the model's recent context.

### A4 — `run-codex.sh` wrapper

- **files:** `scripts/agents/run-codex.sh` (new, executable)
- **acceptance:**
  - AC4.1 Interface: `run-codex.sh <read|implement|fix> <plan-base> <phase> <prompt-file>`.
  - AC4.2 Hard-codes `-m gpt-5.6-sol -c model_reasoning_effort="high" --ignore-user-config -C <repo> --output-schema scripts/agents/report.schema.json --json`, with stdin redirected from the prompt file. **No model fallback:** if the model errors, the script exits non-zero.
  - AC4.3 Sandbox: `read` → `-s read-only`; `implement` → `-s workspace-write`; `fix` → `codex exec resume <thread_id>` with `-c sandbox_mode="workspace-write"`.
  - AC4.4 Refuses to run when the current branch is `main`, or when `implement` is started with a dirty tree (the previous phase must be checkpointed first). The plan's own `docs/plans/<base>-*` files are exempt, since Claude updates the runlog and clarifications at B1–B3.
  - AC4.5 Writes `.agent-runs/<plan-base>/phase-<N>.<mode>[.<round>].{prompt.md,events.jsonl,report.json,stderr.log}` and `phase-<N>.thread_id` (taken from the `thread.started` event).
  - AC4.6 Exit code: Codex's own exit code, or 3 if `report.json` is missing or not valid JSON.

### A5 — `check-scope.sh` mechanical review

- **files:** `scripts/agents/check-scope.sh` (new, executable)
- **acceptance:**
  - AC5.1 `check-scope.sh <plan-file> <baseline-sha> <step-ids…>` collects the union of `- files:` entries for those steps and compares it against `git diff --name-only <baseline-sha>` plus untracked files.
  - AC5.2 **FAIL** if any file is outside that allowlist. **FAIL** on a change to `package.json`, `package-lock.json`, `docs/plans/**`, `CLAUDE.md`, `AGENTS.md` or `src/content/**/*.mdx` unless the file is explicitly listed.
  - AC5.3 Scans **added lines only** and fails on: `\.(skip|only)\(`, `if \(await .*\.count\(\)\)` guards, and a Svelte `class:` directive that is shaped like a Tailwind utility: a variant colon, an opacity slash, an arbitrary value, a decimal step, or a known utility prefix.
    - *Amended during A5:* the original rule ("the name contains `-`") would have failed on legitimate existing names (`class:is-upcoming`, `class:card-shell-wide`). A pattern the local `grep` can't compile must also abort the script (exit 2), not pass. BSD grep rejected the first version of the pattern, and the check passed silently.
  - AC5.4 Scans added lines and **warns** on: new `<style` blocks, raw hex colours in `.svelte`/`.astro`/`.css`, `@ts-ignore` / `@ts-expect-error` / `eslint-disable`, new `client:visible` directives, and `// LEARN:` count (informational).
  - AC5.5 Exits 0 when clean, 1 on a FAIL, and prints warnings either way.

### A6 — Plan template

- **files:** `docs/plans/_TEMPLATE-plan.md` (new)
- **acceptance:**
  - AC6.1 Encodes the step grammar in architecture §4: `### S<n> — title`, `- files:`, `- depends-on:`, `- acceptance:` with `AC<n>.<m>` IDs, `- verify:`, `- out-of-scope:`, plus a `## Phases` table that groups steps.
  - AC6.2 `check-scope.sh` parses the template's example steps correctly.

### A7 — Restructure `AGENTS.md` (Codex's instructions)

- **files:** `AGENTS.md` (edit)
- **acceptance:**
  - AC7.1 `AGENTS.md` becomes the **single canonical home** for project rules shared by both agents. The sections duplicated in `CLAUDE.md` (Code Style, Optimization, Modularization, Commenting, SEO, Key Files, Testing) are merged as a **superset**. The two copies have already drifted apart: `CLAUDE.md` has a "Styling: translate to utilities" subsection and the "parent's scoped styles cannot reach in" corollary where `AGENTS.md` does not. Nothing is lost in the merge.
  - AC7.2 "Plan Execution Workflow" is **replaced** by the "Executing a Claude plan" section drafted in **Appendix 1** below.
  - AC7.3 The line "Execute approved plans using GPT-5.6 Sol at high reasoning effort" is removed from `AGENTS.md`. Codex cannot choose its own model, so it moves to the wrapper script and `CLAUDE.md`.
  - AC7.4 "Plan Drift Lessons" is kept and marked append-only.

### A8 — Restructure `CLAUDE.md` (Claude's instructions)

- **files:** `CLAUDE.md` (edit)
- **acceptance:**
  - AC8.1 The first content line is `@AGENTS.md` (a Claude Code import), and the duplicated sections are deleted from `CLAUDE.md`.
  - AC8.2 Adds the "Orchestrating Codex" section drafted in **Appendix 2** below.
  - AC8.3 **(open: the headless `claude -p` check failed with an expired OAuth session, so verify by hand.)** Check that the import resolves: in a fresh Claude session, `/memory` (or asking "what does AGENTS.md say about X") shows that the `AGENTS.md` content is loaded.

### A9 — Pilot run on a small real task

- **files:** a new plan trio for the pilot, plus whatever that plan allows
- **acceptance:**
  - AC9.1 Run the full Phase B loop once, end to end, on a small task. The candidate is the pre-existing `seo.test.ts` alt-text failure: it is small, a test already proves it, and it touches content, so it also exercises the loud content-edit flagging. **Ask the user to pick or approve the task first.**
  - AC9.2 Confirm the two assumptions still unverified: `-c sandbox_mode="workspace-write"` really lets a *resumed* session write files; and `.git` is not writable from `workspace-write` (so a stray `git commit` from Codex fails instead of succeeding).
  - AC9.3 Record what went wrong in the pilot's runlog and fix the templates or scripts before any real plan uses them.

---

## Phase B — the per-plan loop (runbook)

This is what happens for every future delegated plan. A condensed version goes into `CLAUDE.md` (Appendix 2).

### B0 — Author the plan (Claude)

- Write the trio with the template (A6). Group steps into **phases of at most ~5 steps / ~8 files**, where each phase leaves the build green.
- Every step has a file allowlist and numbered acceptance criteria that can be verified from the diff or a command. "Looks good" is not a criterion.
- Anything with more than one reasonable answer (a design value, which component owns a style, which route a test uses) is **decided in the plan**, and the reasoning goes in `-decisions.md`. Undecided choices are where drift comes from.
- Create the runlog: `docs/plans/<base>-runlog.md`.

### B1 — Baseline (Claude)

- `git switch -c codex/<base>` from a clean `main`.
- Record in the runlog: the baseline SHA; build, unit and integrity results (including known failures such as the `seo.test.ts` alt test, so they are not blamed on Codex later); and the E2E specs the plan names, run on chromium and webkit.

### B2 — Implementation read (Codex, read-only)

- `scripts/agents/run-codex.sh read <base> <N> <prompt>`: Codex reads the plan trio and the code, and returns an **ownership map** (who imports each file the plan names), **plan-vs-repo mismatches** and **questions**, all in the report. It changes nothing.
- It runs once per phase. For small plans, a single read covering all phases is fine.

### B3 — Gate (Claude, sometimes the user)

Sort every question and mismatch:

- **Answerable from the repo or the plan's intent** (a line moved, a helper was renamed): Claude answers it, and the answer goes into the implement prompt's `{{CLARIFICATIONS}}` block and a "Clarifications" section in `-decisions.md`.
- **Changes scope, a design value, published content, dependencies or a shared export**: **ask the user.** If the answer changes the plan, amend it under an "Amendments" heading, dated, in the plan file. Never rewrite silently.

### B4 — Implement (Codex, workspace-write)

- `run-codex.sh implement <base> <N> <prompt>`, launched with `run_in_background` so Claude is notified when it finishes and nothing polls.
- Codex implements only this phase's steps, runs build, unit and integrity, lists the E2E specs it could not run, and returns the JSON report.
- Only one Codex run at a time per checkout.

### B5 — Review (Claude)

In order. Stop at the first hard failure and go to B6.

1. **Report triage.** Handle any `blocked` step, any `question`, and any non-empty `deviations` first.
2. **`check-scope.sh`.** Any FAIL is a finding. Read every warning.
3. **Step-by-step diff read against the acceptance criteria.** Give each AC a verdict: `MATCH`, `DEVIATION-REPORTED` (acceptable only if mechanical), `DEVIATION-UNREPORTED`, `MISSING` or `EXTRA`. Check the `evidence` Codex cited. It must point at a real `file:line` or command output.
4. **Re-run the checks independently**; Codex's `checks_run` claims don't count. That means `npm run build` (read it for `css_unused_selector` warnings), unit tests, integrity tests compared against the baseline, and the plan's E2E specs on **chromium and webkit**. For a test the plan marks `must-fail-before`, also run it against the baseline SHA in a temporary worktree with `node_modules` symlinked.
5. **Repo-rule sweep** over changed files with `CLAUDE.md`/`AGENTS.md` in mind: `class:` directives, hydration directive choice, scoped styles crossing a component boundary, tokens instead of hex, `LEARN:` comments, motion gated on reduced motion.
6. **Visual check** (only when the plan changes rendering): preview in the browser pane at desktop and 375px, light and dark, and attach screenshots to the runlog.
7. Write the verdict table into the runlog.

### B6 — Fix loop (Codex, resumed session)

- Findings go back as a **numbered list**, each tied to a step or AC ID with the exact expected outcome, via `run-codex.sh fix`. The resumed session keeps Codex's context from the implementation.
- **Claude does not edit implementation files itself.** If it did, you could no longer tell whether the plan was clear enough, and the runlog would stop being an accurate record.
- At most **2 fix rounds per phase**. After a third failure, stop and escalate to the user with the runlog.

### B7 — Checkpoint (Claude)

- When the review is clean: a checkpoint commit on `codex/<base>` (`phase N: <summary>`, Claude co-author trailer), with the SHA recorded in the runlog. Never commit on `main`, never push, never merge without the user.
- Continue with B2 or B4 for the next phase.

### B8 — Close-out (Claude)

- Run `npm run test:all` once over the whole branch.
- Summary to the user: the verdict table per phase, deviations (reported and unreported), clarifications made, anything escalated, and the branch name. Offer a PR or a merge; don't do either unprompted.
- **Promote lessons.** Every unreported deviation or finding that has a *general* cause becomes one bullet in `AGENTS.md` → "Plan Drift Lessons", and a plan-format gap becomes a template fix. This is the step that makes the next run better.

### Escalation triggers (always stop and ask the user)

- A change of scope, design value, hierarchy or published content, or a dependency change.
- A shared export or a component with more than one consumer needs a change the plan didn't foresee.
- A step is still blocked after clarification.
- Two fix rounds failed.
- Checks that passed at baseline now fail and the cause isn't in the diff.
- `check-scope.sh` finds forbidden files touched (reported to you even if Codex fixes it).
- `gpt-5.6-sol` is unavailable. No silent switch to another model.

---

## Verification of this plan

Phase A is done when:

- `bash -n` passes on both scripts, and each script prints usage when run without arguments.
- `check-scope.sh` against a hand-made scratch diff produces one FAIL for an out-of-allowlist file and one FAIL for an added `test.skip(`.
- The A9 pilot has completed B0–B8 with a runlog and every open question in its AC9.2 answered.

---

## Appendix 1 — draft `AGENTS.md` section (replaces "Plan Execution Workflow")

```markdown
## Executing a Claude plan

You are the executor. Claude wrote the plan and will review your diff line by line against it. You run
non-interactively: nobody can answer a question mid-run, so every rule below that would normally be
"ask" is "stop and report".

### Source of truth
- The plan trio in `docs/plans/<base>-{plan,decisions,architecture}.md` plus the clarifications in your
  prompt. Clarifications override plan text where they conflict. Read all three files before editing.
- Implement **only the step IDs named in your prompt**. Other steps are context, not work.

### Scope
- Touch only files listed in that step's `files:`. Needing any other file is a stop condition.
- Deliver exactly the acceptance criteria. No refactors, renames, reformatting, dependency changes,
  comment rewrites or "while I'm here" fixes outside them — mention those in `notes` instead.
- **Mechanical drift you may absorb and must report** under `deviations`: moved line numbers, a renamed
  local variable, import order. **Everything else is a stop:** a missing file or export, an API that
  differs from the plan, a second consumer of a file you must change, a design or content value that
  conflicts with a repo rule, a test fixture that does not exist.

### Stop protocol
When a step hits a stop condition: revert your partial edits for that step, mark it `blocked` with a
question that offers concrete options, and continue only with steps whose `depends-on` does not include
it. Never guess to stay unblocked — a blocked step costs one round-trip; a guessed one costs a review
cycle and trust.

### Never
- Run git commands that write (`commit`, `checkout`, `switch`, `stash`, `reset`, `restore`, `branch`, `merge`).
- `npm install` / edit `package.json` or the lockfile unless the step lists them.
- Edit `docs/plans/**`, `CLAUDE.md`, `AGENTS.md`, or published content (`src/content/**`) unless listed.
  If a listed step edits published content, say so in `notes` in capitals.
- Skip, `.only`, weaken, delete or conditionally guard a test. A test that cannot fail is not coverage.

### Checks
- Run `npm run build`, `npx vitest run tests/unit`, `npx vitest run tests/integrity` and report each exit
  code. Read the build output for `css_unused_selector` warnings.
- Do not run Playwright — the sandbox cannot bind a port. List the specs that exercise your change under
  `e2e_specs_to_run`; the reviewer runs them on chromium and webkit.
- Known baseline failures are listed in your prompt; do not try to fix them unless a step says so.

### Report
Your final message is JSON matching the schema you were given. Every acceptance criterion gets `met` and
`evidence` — a `file:line` or a command result. "Implemented as planned" is not evidence.
```

## Appendix 2 — draft `CLAUDE.md` section

```markdown
@AGENTS.md

## Orchestrating Codex (Claude only)

When the user asks for a plan to be executed by Codex, Claude plans and reviews; Codex implements.
Full runbook: `docs/plans/codex-execution-workflow-2026-09-17-0655-plan.md` Phase B.

### Plans Codex can execute without drifting
- Use `docs/plans/_TEMPLATE-plan.md`. Every step: ID, `files:` allowlist, `AC<n>.<m>` acceptance criteria
  verifiable from a diff or command, `depends-on`, `verify`, `out-of-scope`. Phases ≤ ~5 steps, build green
  at each boundary.
- Decide every choice with more than one reasonable answer in the plan; record why in `-decisions.md`.
- Keep a `<base>-runlog.md` beside the trio: baseline, verdict tables, clarifications, commits.

### Running it
- Always through `scripts/agents/run-codex.sh` (pins `gpt-5.6-sol`, high effort, sandbox, schema, stdin).
  Never call `codex exec` directly — without stdin redirected it hangs. Launch with `run_in_background`.
- Order per phase: baseline → `read` (read-only) → gate questions → `implement` → review → `fix` (≤2 rounds) → checkpoint commit.
- Only on branch `codex/<base>`. Approving a Codex plan authorises checkpoint commits on that branch; never
  commit to `main`, push, or merge without asking.

### Reviewing
- Trust nothing unverified: run `check-scope.sh`, re-run build/unit/integrity yourself, run the plan's E2E
  specs on chromium **and** webkit (Codex cannot — its sandbox cannot bind ports).
- Verdict per acceptance criterion: MATCH / DEVIATION-REPORTED / DEVIATION-UNREPORTED / MISSING / EXTRA.
  An unreported deviation is a finding even when the code is right.
- Send findings back as numbered items tied to AC IDs. Do not edit implementation files yourself.

### Escalate to the user
Scope, design value, published content, dependency or shared-export changes; a step still blocked after
clarification; two failed fix rounds; new failures not explained by the diff; `gpt-5.6-sol` unavailable.

### Close-out
Run `npm run test:all`, report verdicts and deviations, and promote every generalisable finding into
`AGENTS.md` → "Plan Drift Lessons".
```
