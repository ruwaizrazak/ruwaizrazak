# Codex workflow, global — one toolkit for the website and the Xcode projects

> **Snapshot.** The canonical, maintained copy of this trio — and its runlog — is `~/.agents/codex-workflow/docs/plans/`. Kept here as the record of why this repo's tooling moved out.

Supersedes the *location* of `codex-execution-workflow-2026-09-17-0655` (committed as `4b6bbc8` on `chore/codex-workflow`), not its design. Companions: `codex-workflow-global-2026-09-17-0719-decisions.md` · `codex-workflow-global-2026-09-17-0719-architecture.md`.

---

## Context

The workflow built in Phase A lives inside `ruwaizrazak`: scripts in `scripts/agents/`, the executor contract in its `AGENTS.md`, the orchestrator runbook in its `CLAUDE.md`. The user wants the same loop in their Xcode projects (`~/Developer/IOS/{QuoteIt,LockIn,HabitApp}`).

Three facts make a straight copy wrong:

1. **About 80% of it is project-agnostic**: the plan grammar, stop protocol, report schema, prompts, wrapper, allowlist check and review verdicts. Copying it into each repo recreates the drift problem D9 just fixed, only across repos this time.
2. **The other 20% differs completely per stack**: which checks Codex can run, which paths are protected, which added-line patterns are known footguns, and whether to branch.
3. **QuoteIt already has its own plan/execute workflow** (Opus plans, Sonnet executes). It conflicts with Phase A in three places and is better than Phase A in four (decisions G-D5 to G-D7).

## Verified facts (2026-09-17), in addition to the Phase A facts

| Fact | Result |
|---|---|
| `~/.codex/AGENTS.md` loaded under `--ignore-user-config` | ✅ Yes (asked Codex to quote it from an empty directory, with and without the flag). **A global executor contract reaches every run.** |
| `xcodebuild build` (QuoteIt) in Codex's sandbox | ❌ 100+ errors: `swift-plugin-server produced malformed response`. Macros (`@Model`, `@State`, `#Preview`) can't expand. The same command outside the sandbox: ✅ `BUILD SUCCEEDED`, 17s. |
| Same, with `OTHER_SWIFT_FLAGS='$(inherited) -disable-sandbox'` | ✅ `BUILD SUCCEEDED`, 14s. The plugin server's own sandbox can't nest inside Codex's; the flag turns off only the inner one. |
| `xcodebuild build-for-testing` in the sandbox (with the flag) | ✅ `TEST BUILD SUCCEEDED`, so Codex gets compile feedback on app **and test** targets |
| `xcodebuild test` in the sandbox | ❌ `Unable to find a device matching the provided destination`. CoreSimulator is unreachable (`SimError 409`). **Codex can't run any simulator test; Claude runs unit and UI tests.** |
| DerivedData | Sandboxed builds used `-derivedDataPath "$TMPDIR/codex-dd-<project>"`; `$TMPDIR` is writable in the sandbox |
| Xcode projects | All three use synchronized folder groups (`objectVersion = 77`), so **adding a Swift file needs no `project.pbxproj` edit**. None has SwiftPM dependencies. Only QuoteIt has test targets. |
| QuoteIt timing (from its `CLAUDE.md`) | 128 unit tests in 10.9s; 26 UI tests in 399s; never run two `xcodebuild` at once |
| QuoteIt `AGENTS.md` | Untracked, and a copy of `CLAUDE.md` with "Claude" swapped for "Codex", which corrupted "Claude Design file" → "Codex Design file" and "claude.ai/code" → "Codex.ai/code". The same duplication failure D9 fixed here. |
| `python3` | `/usr/bin/python3` ships with the Command Line Tools, which git and xcodebuild already need. `node` isn't guaranteed outside the web repo. |

---

## Phases

| Phase | Steps | Done when |
|---|---|---|
| G1 — toolkit | G1.1–G1.6 | Toolkit repo exists; self-tests pass against a scratch Astro-shaped repo and a scratch Xcode-shaped repo |
| G2 — global instructions | G2.1–G2.3 | A fresh Codex session quotes the global contract; the Claude import is verified by hand (the headless CLI's auth is expired) |
| G3 — migrate ruwaizrazak | G3.1–G3.3 | The repo holds only its profile and project rules; the Phase A branch is amended, and `check-scope` still catches the planted violations |
| G4 — onboard QuoteIt | G4.1–G4.4 | Profile in place; the doc duplication fixed; its existing workflow section rewritten for Codex. **Needs user approval of G-D5–G-D7 first.** |
| G5 — pilot | G5.1 | One real plan through the full loop in each of ruwaizrazak and QuoteIt |

LockIn and HabitApp are **not** onboarded now. Neither has test targets or agent docs, and `onboard` makes them one command away when they're needed.

---

## G1 — the toolkit at `~/.agents/codex-workflow/` (git repo)

### G1.1 Create the repo and move the design docs
- files: `~/.agents/codex-workflow/{README.md,docs/plans/*}`
- acceptance:
  - AC1.1.1 `git init`. Both plan trios (`codex-execution-workflow-2026-09-17-0655-*`, `codex-workflow-global-2026-09-17-0719-*`) are copied into `docs/plans/`, and the toolkit copies are canonical from then on. `ruwaizrazak` keeps only a one-line pointer (G3).
  - AC1.1.2 `README.md` is the runbook: Phase B from the first plan, rewritten with profile-driven checks (architecture §2), and a "Stack notes" section covering web and Xcode.

### G1.2 Contracts as files
- files: `contracts/executor.md`, `contracts/orchestrator.md`
- acceptance:
  - AC1.2.1 `executor.md` is Appendix 1 of the first plan, generalised: "run the checks listed in your prompt" replaces the hard-coded npm commands, and the stop protocol halts the phase (G-D6). Adds QuoteIt's reporting rule: quote counts, never characterise them.
  - AC1.2.2 `orchestrator.md` is Appendix 2, generalised, plus QuoteIt's "when this applies" threshold (G-D7), Phase 0 proofs (G-D5), and the rule never to run a check while a Codex run is in flight.

### G1.3 Profile-driven scripts
- files: `bin/run-codex`, `bin/check-scope`, `bin/render-prompt`, `lib/profile.sh`
- acceptance:
  - AC1.3.1 Both scripts load `<repo>/.agents/profile.sh` via `lib/profile.sh` and refuse to run without one.
  - AC1.3.2 `run-codex`: the wrapper from Phase A, plus: the main-branch refusal follows `BRANCH_POLICY` (`branch` refuses on the default branch; `main` allows it); JSON is handled with `python3`, not `node`; everything else is unchanged (model pin, stdin, schema, artifacts, exit codes).
  - AC1.3.3 `check-scope`: the Phase A checker, with protected paths and FAIL/WARN patterns read from the profile (`PROTECTED_PATHS`, `SCAN_RULES`). Universal protected paths (`AGENTS.md`, `CLAUDE.md`, `$PLAN_DIR/**` except the current plan's own files) are always on. Fail-closed on patterns that don't compile is kept.
  - AC1.3.4 `render-prompt <mode> <plan-base> <phase> <step-ids> [--clarifications f] [--findings f]` fills a template from the profile (`CODEX_CHECKS`, `KNOWN_BASELINE_FAILURES`, `PLAN_DIR`) into `.agent-runs/<base>/`, and fails on any unfilled placeholder. It replaces the hand-fill step, which was the last manual part of the loop.
  - AC1.3.5 Scripts are symlinked into `~/.local/bin` (already on PATH, where `codex` lives) as `codex-run`, `codex-scope` and `codex-prompt`.

### G1.4 Schema, prompts, templates
- files: `schema/report.schema.json`, `prompts/{read,implement,fix}.md`, `templates/{plan,runlog}.md`
- acceptance:
  - AC1.4.1 Schema unchanged from Phase A, plus `checks_run[].output_excerpt` (QuoteIt reporting: the verbatim counts line).
  - AC1.4.2 Prompts gain `{{CHECKS}}` and `{{REVIEWER_CHECKS}}`; no stack-specific command remains in any prompt or contract (`grep -rE 'npm|vitest|xcodebuild' prompts contracts` finds nothing).
  - AC1.4.3 Plan template gains **Phase 0 — proofs** (the load-bearing assumptions, and how Claude proved each during planning) and **Manual checks** (what no test can see: camera, widgets, share sheet, visual design).

### G1.5 Stack profiles
- files: `profiles/astro.sh`, `profiles/xcode.sh`, `profiles/README.md`
- acceptance:
  - AC1.5.1 `astro.sh`: `BRANCH_POLICY=branch`, `PLAN_DIR=docs/plans`; `CODEX_CHECKS` = build / unit / integrity; `REVIEWER_CHECKS` = the Playwright specs named in the plan on chromium and webkit; protected paths and scan rules are exactly Phase A's.
  - AC1.5.2 `xcode.sh` (architecture §4): `CODEX_CHECKS` = `xcodebuild … build-for-testing` with `-disable-sandbox` and a `$TMPDIR` DerivedData path; `REVIEWER_CHECKS` = unit tests, UI tests when the plan names them (or `-parallel-testing-enabled NO`), simulator screenshots for visual changes; protected paths include `*.xcodeproj/project.pbxproj`, `*.xcscheme`, `*.entitlements`, `Info.plist`, `*.xcprivacy`, `Package.resolved`; scan rules include FAIL on `XCTSkip` and the `.disabled(` test trait, and WARN on `withKnownIssue`, `XCTExpectFailure`, `try!`, `fatalError(`, `nonisolated(unsafe)`, `@preconcurrency`, `swiftlint:disable`.
  - AC1.5.3 Profiles are templates: `onboard` **copies** one into a project, where it is edited and committed. A project never sources the toolkit's copy, so a toolkit edit can't silently change a project's checks.

### G1.6 Onboarding and self-test
- files: `bin/onboard`, `tests/selftest.sh`
- acceptance:
  - AC1.6.1 `onboard <repo> <astro|xcode>` copies the profile to `<repo>/.agents/profile.sh`, fills `PROJECT_NAME` / `SCHEME` / `DESTINATION` (Xcode: from `xcodebuild -list`), appends `.agent-runs/` to `.gitignore`, and prints the three lines to add to the project's `AGENTS.md`. **It never edits `AGENTS.md` or `CLAUDE.md` itself.**
  - AC1.6.2 `selftest.sh` builds two scratch repos (web-shaped and Xcode-shaped) and asserts: allowlist FAIL, protected-path FAIL, each stack's FAIL patterns, legitimate code staying clean, unfilled-placeholder refusal, main-branch refusal under `branch` policy only, and fail-closed on a bad pattern. It exits non-zero on any mismatch.

---

## G2 — global instructions

Changing `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md` affects every project on this machine. The user approves this plan before G2 starts.

### G2.1 Codex global
- files: `~/.codex/AGENTS.md`
- acceptance:
  - AC2.1.1 The existing "Planning" section is kept verbatim. `contracts/executor.md` is inserted between `<!-- codex-workflow:begin -->` / `<!-- codex-workflow:end -->` markers by `bin/install-contracts`, which is idempotent (running it twice gives a byte-identical file). Codex can't import files, so the text has to be physically present.
  - AC2.1.2 The contract opens with its own scope line: *"Applies only when your prompt names a plan and step IDs. Otherwise ignore this section."* Without it, every ad-hoc Codex session on this machine would inherit the stop protocol.

### G2.2 Claude global
- files: `~/.claude/CLAUDE.md`
- acceptance:
  - AC2.2.1 The existing "Planning" section is kept. Two import lines are added, `@~/.agents/codex-workflow/contracts/orchestrator.md` and `@~/.agents/codex-workflow/contracts/executor.md`, the latter so the reviewer holds the same text Codex does.
  - AC2.2.2 Manual check (the headless `claude -p` auth is expired): in a fresh session in any repo, ask it to quote "Stop protocol". Record the result in the toolkit runlog.

### G2.3 Verify Codex
- acceptance:
  - AC2.3.1 From an empty directory, `codex exec … --ignore-user-config` quotes the contract's scope line.

---

## G3 — migrate ruwaizrazak (on `chore/codex-workflow`, amending Phase A before it merges)

### G3.1 Replace repo tooling with a profile
- files: `scripts/agents/**` (delete), `.agents/profile.sh` (new), `docs/plans/_TEMPLATE-plan.md` (delete)
- acceptance:
  - AC3.1.1 `onboard . astro` generates the profile; it's diffed against Phase A behaviour: same checks, same protected paths, same scan rules.
  - AC3.1.2 The Phase A scratch-repo test cases, re-run through `codex-scope`, give identical FAIL/clean results.

### G3.2 Slim the instruction files
- files: `AGENTS.md`, `CLAUDE.md`
- acceptance:
  - AC3.2.1 `AGENTS.md`: the "Executing a Claude plan" section is replaced by a three-line pointer (the global contract applies; checks come from `.agents/profile.sh`; stack notes live in the toolkit README). "Plan Drift Lessons" **stays here**, because those lessons are specific to this repo.
  - AC3.2.2 `CLAUDE.md`: the "Orchestrating Codex" section is removed (now global); the `@AGENTS.md` import stays.

### G3.3 Point the old plan trio at its new home
- files: `docs/plans/codex-execution-workflow-2026-09-17-0655-plan.md`, `docs/plans/codex-workflow-global-2026-09-17-0719-*.md`
- acceptance:
  - AC3.3.1 Both trios stay in this repo as history. The first plan's heading gains *"Superseded in location by the global toolkit; canonical copy at `~/.agents/codex-workflow/docs/plans/`."*

---

## G4 — onboard QuoteIt (after the user approves G-D5–G-D7)

QuoteIt's working tree has user work in progress (untracked `AGENTS.md`, `plan-ipad-split.md`). Nothing in G4 touches `plan-ipad-split.md`.

### G4.1 Profile
- files: `.agents/profile.sh` (new), `.gitignore`
- acceptance:
  - AC4.1.1 `onboard ~/Developer/IOS/QuoteIt xcode` → `BRANCH_POLICY=main` (G-D6), `SCHEME=QuoteIt`, `DESTINATION='platform=iOS Simulator,name=iPhone 17 Pro'`. `REVIEWER_CHECKS`: unit tests on every phase; the full suite with `-parallel-testing-enabled NO` before the commit when the plan touches anything a UI test drives. Both are taken from QuoteIt's own "Build, run, and test" section.
  - AC4.1.2 A sandboxed `codex-run read` on a trivial prompt succeeds, and `CODEX_CHECKS` passes when run through `codex sandbox`.

### G4.2 Fix the doc duplication
- files: `CLAUDE.md`, `AGENTS.md`
- acceptance:
  - AC4.2.1 The content of `CLAUDE.md` moves to `AGENTS.md` (so the untracked, corrupted copy is replaced), with "Claude Design file" and every other Claude-specific name restored. `CLAUDE.md` becomes a short header plus `@AGENTS.md`. The same pattern as ruwaizrazak (D9).
  - AC4.2.2 `diff <(git show HEAD:CLAUDE.md | tail -n +4) <(tail -n +N AGENTS.md)` is empty apart from the intended header and the G4.3 section.

### G4.3 Rewrite "Planning and executing in phases" for Codex
- files: `AGENTS.md` (that section only)
- acceptance:
  - AC4.3.1 Keeps what is QuoteIt-specific or stronger than the global contract: Phase 0 examples (the `#Predicate` crash), "exact edits", "the plan writes the test", untestable-things-get-a-manual-checklist, and "commit to `main`".
  - AC4.3.2 Changes: the executor is Codex, not Sonnet. **Claude runs the commit**, since Codex has no git write access; Claude still writes the message, so the history still records why. Running the suite moves to Claude, since Codex can't reach the simulator. Codex's gate is `build-for-testing`.
  - AC4.3.3 Anything now duplicated by the global contract is deleted and replaced with a pointer.

### G4.4 Commit
- acceptance:
  - AC4.4.1 One commit on QuoteIt `main` (its policy): `.agents/profile.sh`, `.gitignore`, `AGENTS.md`, `CLAUDE.md`. `plan-ipad-split.md` stays untracked and untouched.

---

## G5 — pilots

- AC5.1 **ruwaizrazak:** the alt-text integrity failure, as proposed before (the user still has to approve the content edit), or any small task the user names.
- AC5.2 **QuoteIt:** a small item from `PLAN.md`'s outstanding list, chosen with the user. It has to exercise `build-for-testing` in the sandbox and Claude-run unit tests.
- AC5.3 Both close out with the Phase A pilot's open questions answered (a resumed session can write; `.git` isn't writable from the sandbox), and any template or script gap fixed in the toolkit, not in a project.

---

## Escalation points in this plan

- Before G2: approval to change the global instruction files.
- Before G4: approval of G-D5 (Phase 0 is Claude's), G-D6 (stop halts the phase; QuoteIt commits to main) and G-D7 (delegation threshold), and of replacing QuoteIt's untracked `AGENTS.md`.
- G5: pilot task choice in each repo.
