# Codex execution workflow — decisions

Companion to `codex-execution-workflow-2026-09-17-0655-plan.md`. It is written so that an agent picking this up cold knows what was already decided, what was rejected, and why, and doesn't reopen those questions.

---

## D1 — Claude builds the workflow itself; Codex's first job is the pilot

**Decision.** Claude implements Phase A (scripts, schema, templates, `AGENTS.md`/`CLAUDE.md` restructure) directly. Codex's first run is the A9 pilot.

**Rejected: have Codex build Phase A.** The scope checker, report schema and executor contract are what keep Codex on-plan. Having Codex write them means the first run happens with no guardrails, and the reviewer would be checking Codex's work with tools Codex wrote.

---

## D2 — Phased runs, not one run for the whole plan

**Decision.** One `codex exec` per phase (at most ~5 steps / ~8 files, build green at each boundary), with a Claude review and checkpoint between phases.

**Rejected: a single run for the whole plan.** Drift compounds: a wrong assumption in step 2 gets built on by steps 3–9, and the review then faces one large diff with no way to isolate where it went wrong.

**Rejected: one run per step.** Each run pays the cost of reading the plan trio and the code again, and closely related steps (a component plus its test) lose shared context. Phases are the middle ground.

---

## D3 — A read-only implementation read before every implement run

**Decision.** Each phase starts with a `-s read-only` Codex run that returns an ownership map, plan-vs-repo mismatches and questions. Claude answers or escalates them before any file changes.

**Why.** `AGENTS.md` already requires an "implementation read", but in a non-interactive run Codex has nobody to report it to before editing. It would read, find a question, then have to either guess or stop. Splitting reading from writing turns the question into a gate. Enforcing read-only in the sandbox also makes "don't edit yet" a guarantee instead of a request. Most of the recorded drift lessons ("audit shared exports", "a second consumer") are exactly what an ownership map catches.

**Rejected: skip it for small plans.** Allowed only by merging all phases into one read, never by skipping the read entirely. The read costs seconds; one review cycle costs much more.

---

## D4 — "Ask permission" becomes "stop and report"

**Decision.** The existing `AGENTS.md` rule "explicitly ask the user's permission before deviating" is replaced by a stop protocol: revert that step's partial edits, mark it `blocked` with a question that offers options, and continue only with independent steps.

**Why.** `codex exec` has no user. The current rule can't be followed as written, so in practice Codex either ignores it or ends the whole run. The stop protocol keeps the intent ("don't decide what the plan didn't") while letting independent work continue.

**Mechanical drift is the one exception**: moved line numbers, a renamed local, import order. Codex may absorb it and must report it. A strict "block on anything different" rule would stop every run on stale line numbers. A loose "adapt if the intent is clear" rule is how drift gets in, because every silent decision looked clear to whoever made it. The list is deliberately short and concrete.

---

## D5 — Structured JSON report enforced by `--output-schema`

**Decision.** Codex's final message must match `scripts/agents/report.schema.json`. Every acceptance criterion is reported with `met` and `evidence`.

**Rejected: a free-text summary**, which the current `AGENTS.md` asks for ("summarize changed files, assumptions and checks"). A free-text summary can skip a criterion without anyone noticing. A schema with one entry per AC can't skip one, and Claude can parse it. Verified working in `codex-cli 0.154.0`.

**Evidence must be a `file:line` or a command result.** Requiring a citation forces Codex to check its own claim, and gives Claude something concrete to spot-check.

---

## D6 — Claude re-runs every check; Codex's `checks_run` is advisory

**Decision.** The reviewer runs build, unit and integrity tests itself, plus E2E on chromium and webkit.

**Why.** A report that says a check passed is not proof that it did. More concretely, **Codex cannot run E2E at all**: Playwright's web server fails in the sandbox with `listen EPERM 127.0.0.1:4322` (verified). The E2E suite is this repo's behaviour spec (`CLAUDE.md` → Testing), so Claude has to own it.

**Rejected: give Codex `danger-full-access` so it can run Playwright.** That also removes the write sandbox and network isolation, which are the guarantees that make "Codex didn't `npm install` or push anything" true by construction. E2E costs Claude a few minutes per phase, a better trade.

---

## D7 — Claude never edits implementation files; findings go back to Codex

**Decision.** Fixes go through `codex exec resume` with numbered findings, at most 2 rounds per phase, then escalation.

**Rejected: Claude patches small issues itself.** It's faster once, but (a) the runlog no longer shows whether the plan was executable as written, which is the thing this workflow exists to measure, and (b) Claude's edits skip the scope check and the report. If the user wants a one-off exception, they can grant it explicitly.

**Why resume rather than a fresh run.** The resumed session keeps what Codex learned during implementation, so a fix doesn't start with a cold re-read. Verified: resume keeps context and still honours `--output-schema`.

**Why a cap of 2.** Two failed rounds on the same phase almost always means the plan is ambiguous, not that Codex is careless. Another round won't help; a user decision will.

---

## D8 — Unreported deviations are findings even when the code is right

**Decision.** `DEVIATION-UNREPORTED` gets its own verdict and is logged, even when the result is correct.

**Why.** The whole loop depends on the report being honest. If silent-but-correct deviations are forgiven, the reviewer has to re-derive every decision from the diff, and the report stops being worth reading. It is also the main input to "Plan Drift Lessons".

---

## D9 — `AGENTS.md` is the canonical rulebook; `CLAUDE.md` imports it

**Decision.** Shared project rules live only in `AGENTS.md`. `CLAUDE.md` starts with `@AGENTS.md` and adds only Claude-specific orchestration and review rules.

**Evidence the current setup is already failing:** ~100 lines of rules exist in both files and have drifted. `CLAUDE.md` has a "Styling: translate to utilities" subsection and the "parent's scoped styles cannot reach into child components" corollary in Modularization; `AGENTS.md` has neither in that section. Codex, which reads `AGENTS.md`, is working from a different rulebook than the reviewer judging it.

**Why this direction.** Codex reads `AGENTS.md` and can't import other files. Claude Code supports `@path` imports in `CLAUDE.md`. So the physical text has to live in `AGENTS.md`.

**Rejected: a third shared file (`docs/RULES.md`) that both point to.** Codex would need to be told to read it and might not, while `AGENTS.md` is loaded automatically.

**Side effect, intended:** Claude also loads the executor contract through the import, so the reviewer and the executor are held to the same written rules.

---

## D10 — The executor contract is repeated in every prompt, not only in `AGENTS.md`

**Decision.** The prompt templates restate the scope rule, the stop protocol and the forbidden actions.

**Why.** `AGENTS.md` is long (228 lines, most of it Tailwind translation detail) and loads at the start of context. Over a long high-effort run, the instructions closest to the task have the strongest pull. Repeating a dozen lines costs almost nothing.

---

## D11 — Branch `codex/<base>`, checkpoint commit per approved phase; approving the plan authorises these commits

**Decision.** Claude creates the branch and commits after each clean review. Codex never touches git.

**Why checkpoints.** Each phase's review is then a diff against the last checkpoint, `check-scope.sh` gets a clean baseline, and the wrapper can require a clean tree before `implement`.

**Commit authority.** Claude's default is not to commit unless asked. Adopting this workflow (writing Appendix 2 into `CLAUDE.md`) is the standing permission, limited to `codex/*` branches: no `main`, no push, no merge. **The user can reject this.** In that case Claude stops after each clean review and asks the user to commit, and the wrapper's clean-tree check still makes sure that has happened before the next `implement`.

**Rejected: Codex's `--worktree` flag.** A fresh worktree has no `node_modules`, and the sandbox blocks the network, so `npm install` can't run there, and neither can the build. Symlinking `node_modules` is possible, but then Claude's E2E and browser preview also have to target the worktree. The main checkout on a branch is simpler and fine, given only one run at a time (D13).

---

## D12 — No silent model fallback

**Decision.** The wrapper pins `gpt-5.6-sol` at high effort and fails if it's unavailable.

**Why.** The user chose the model specifically. A fallback would quietly change the conditions every runlog observation depends on. Available models on 2026-09-17: `gpt-5.6-sol`, `gpt-5.6-luna`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-5.5`. Switching is the user's call.

---

## D13 — One Codex run at a time per checkout

No parallel runs. Two writers in one working tree make the scope check meaningless and the diff impossible to attribute. If parallelism is ever wanted, it needs worktrees plus a `node_modules` strategy, which would be its own plan.

---

## D14 — `--ignore-user-config` on every run

**Decision.** Pass it every time.

**Why.** The user config loads MCP servers (computer-use, browser, a design connector whose auth fails on every start) and sets `model = "gpt-5.2-codex"`, `effort = "medium"`. That means noise in stderr, tools Codex shouldn't use on this job, and defaults that would win if a flag were ever dropped. Verified: auth still works with the flag, and the errors go away.

**Open:** check in the pilot whether Codex still loads its skills folder under this flag. If those skills include generic "just do it" workflows that conflict with the stop protocol, that matters.

---

## D15 — Runlog is tracked; raw events are not

**Decision.** `docs/plans/<base>-runlog.md` is committed with the plan trio. `.agent-runs/` (prompts, JSONL events, reports, stderr) is gitignored.

**Why a fourth file.** The global instructions ask for three files so another agent can pick the work up cold. For a delegated plan, "where are we" (phase status, clarifications, verdicts, checkpoint SHAs) is part of that picture and isn't derivable from git. Raw JSONL is large, noisy and only useful for debugging a run, so it stays local.

---

## Rules to KEEP from the current `AGENTS.md`

- "Treat the plan as the source of truth." Kept, and extended to the decisions and architecture files.
- "Implementation read before editing." Kept, and made structural (D3).
- **Plan Drift Lessons**: all eight bullets kept, plus a new append-only convention fed by B8.
- **Design Implementation Guidelines**: kept unchanged. These are exactly the domain rules a reviewer checks against.

## Rules to CHANGE in the current `AGENTS.md`

| Current | Problem | Becomes |
|---|---|---|
| "Ask the user's permission before deviating" | No user in `codex exec` | Stop protocol (D4) |
| "Execute approved plans using GPT-5.6 Sol at high reasoning effort" | Codex can't choose its own model | Pinned in the wrapper and `CLAUDE.md` (D12) |
| "Keep verification light by default" | Checks cost ~12s in the sandbox; "light" invites skipping them | Build, unit and integrity on every run; E2E handed to the reviewer (D6) |
| "Summarize changed files, assumptions and checks" | Free text can skip criteria | JSON report per AC with evidence (D5) |

---

## Clarifications

*(Empty. The pilot and later runs record B3 answers here.)*
