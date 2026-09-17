# Codex workflow, global — decisions

Companion to `codex-workflow-global-2026-09-17-0719-plan.md`. IDs are prefixed `G-` so they can't be confused with D1–D15 of `codex-execution-workflow-2026-09-17-0655-decisions.md`. Those still stand unless one here says it amends them.

---

## G-D1 — One toolkit repo at `~/.agents/codex-workflow/`, not a copy per project

**Decision.** Scripts, schema, prompts, templates, contracts and stack profiles live in one git repo in the user's home, and projects hold only `.agents/profile.sh` plus their own rules.

**Rejected: copy `scripts/agents/` into each repo.** Within a week the copies would differ, which is D9's failure spread across repos, with no merge path. It's already happening: QuoteIt's `AGENTS.md` is a find-and-replace copy of `CLAUDE.md` that corrupted names.

**Rejected: a git submodule per project.** Submodules add friction to every clone and commit, and QuoteIt's docs call branches "friction to undo". Nothing here needs per-project pinning of the toolkit version beyond what G-D3 already gives.

**Why `~/.agents/`.** It already exists (it holds the user's installed skills), so it's the established home for agent tooling. `~/.claude/` would tie a two-agent toolkit to one of the agents.

**Trade-off accepted.** A cloud Codex session or another machine won't have the toolkit. Every run today is local; if that changes, the toolkit repo can be pushed and cloned, which is why it's a git repo.

---

## G-D2 — The executor contract is physically in `~/.codex/AGENTS.md`; Claude imports it

**Verified:** Codex loads `~/.codex/AGENTS.md` even with `--ignore-user-config`. Codex has no import syntax, so the text has to be written into the file; `install-contracts` does it between markers, idempotently. Claude's global `CLAUDE.md` imports both contracts, so the reviewer and the executor read the same text (same reasoning as D9).

**Scope line is mandatory** (AC2.1.2). The global file applies to *every* Codex session on the machine. Without "applies only when your prompt names a plan and step IDs", an ad-hoc "fix this bug" session would start refusing files that aren't allowlisted.

---

## G-D3 — Profiles are copied into projects, never sourced from the toolkit

**Decision.** `onboard` copies `profiles/<stack>.sh` into `<repo>/.agents/profile.sh`, where it's edited and committed.

**Why.** Checks and protected paths are a project's contract with its reviewer. If a toolkit edit silently changed QuoteIt's checks, a phase could pass review under different rules than the plan was written against. Copying makes every change visible in the project's own history.

**Rejected: a profile that sources the stack default and overrides it.** It's less duplication, but the effective config is then spread across two repos, and nobody can see what's in force without running it.

---

## G-D4 — On Xcode projects, Codex compiles, Claude tests

**Verified:** in the sandbox, `build-for-testing` succeeds (with `-disable-sandbox`) and `test` can't reach the simulator.

**Decision.** `CODEX_CHECKS` is `build-for-testing`, which compiles the app, the extensions and every test target, so Codex still gets compiler feedback on the tests it writes. Claude runs unit tests every phase and UI tests per the plan.

**Rejected: `danger-full-access` for Xcode projects so Codex can run tests.** Same reasoning as D6, with more at stake: an unsandboxed Codex on an iOS project can touch signing, keychains, `~/Library` and the simulators the user is using.

**Rejected: a custom sandbox profile that allows CoreSimulator's XPC services.** Possible in principle, but it has to be reverse-engineered from denial logs and would break on any Xcode update. Unit tests take Claude 11s on QuoteIt.

**`-disable-sandbox` is a command-line flag, not a project setting.** It turns off only the Swift compiler's own nested sandbox around macro plugins; the outer Codex sandbox still applies. It never goes into `project.pbxproj`, so builds from the Xcode IDE are unchanged.

**Separate DerivedData.** Codex builds into `$TMPDIR/codex-dd-<project>`. The extra flag changes the build settings, so sharing Claude's DerivedData would invalidate its cache on every switch, and Claude's default DerivedData is outside the writable sandbox anyway.

**No concurrency.** QuoteIt measured that two `xcodebuild` processes fight over the simulator and produce failures that look like real regressions. The orchestrator contract forbids starting any check while a Codex run is in flight. The loop is already sequential (D13); this makes it explicit for Claude's own checks.

---

## G-D5 — Adopt QuoteIt's Phase 0; Claude does it during planning

QuoteIt's rule "prove the load-bearing assumptions first" caught a `#Predicate` that compiles but crashes at fetch time. Phase A has no equivalent, and that's a gap.

**Decision.** Every plan names its one or two load-bearing assumptions in a "Phase 0 — proofs" section, together with how each was proven. **Claude runs the proofs while planning**, before any Codex run.

**Why Claude, not the executor (as QuoteIt does today).** In QuoteIt the executor was Sonnet, with full machine access. Codex can't reach the simulator, and many Swift proofs need a running app (fetch-time crashes, extension activation). A proof is also evidence the plan depends on: if it fails, the plan changes, which is Claude's job.

**Also adopted from QuoteIt:** "the plan writes the test" (the test file is copied from the plan, so the executor can't write a weaker one); "untestable things get a manual checklist, never a test that pretends"; "quote counts, never characterise them".

---

## G-D6 — A stop halts the phase (amends D4); branch policy is per project

**QuoteIt's rule:** any contradiction ends the run. **Phase A's rule (D4):** block that step and continue with independent steps.

**Decision: adopt QuoteIt's rule globally.** A stop halts the phase, while mechanical drift (moved lines, renamed locals, import order) is still absorbed and reported.

**Why D4's "continue independent steps" goes.** Phases are capped at ~5 steps, so continuing saves little. And judging whether a step is really independent of a blocked one is itself an unasked decision, the exact thing the contract exists to prevent. QuoteIt's reason is the right one: adapting within the phase is how "a contract quietly becomes a suggestion".

**Branching is per project (`BRANCH_POLICY`).** ruwaizrazak keeps `codex/<base>` branches (D11). QuoteIt keeps committing directly to `main`, because its history is a deliberate linear series and its docs say so explicitly. The wrapper's main-branch refusal follows the profile.

**Commits in QuoteIt change hands.** Before, Opus wrote the message and Sonnet ran `git commit`. Now Claude does both. Codex has no git write access (D11), and splitting authorship from a mechanical `git commit -F` bought nothing once the executor can't run git.

---

## G-D7 — Delegation threshold, adopted from QuoteIt

Not everything should go through the loop. From QuoteIt: delegate when a change touches **more than two files, adds a type or target, changes a model or query, or has an approach worth reviewing first**. A typo, a one-line fix, a rename, or a change the user described precisely enough to leave nothing to decide: Claude just does it, and says so.

**Why global.** The loop costs at least three Codex runs plus a review. On a two-line fix, the plan is longer than the diff.

---

## G-D8 — `render-prompt` replaces hand-filling templates

Phase A had Claude fill `{{PLACEHOLDERS}}` by hand, with the wrapper refusing leftovers. With profiles, most values (checks, baseline failures, plan directory) are data, so a renderer fills them and Claude supplies only clarifications and findings. That's one less place for a copy-paste error to put the wrong checks into a prompt.

---

## G-D9 — `python3` replaces `node` in scripts

`node` is guaranteed in the web repo, not in Xcode projects. `/usr/bin/python3` ships with the Command Line Tools, which `git` and `xcodebuild` already require, so it's present wherever the workflow can run.

---

## G-D10 — LockIn and HabitApp are not onboarded now

Neither has test targets or agent instruction files, so a profile would be all build and no review signal. `onboard` makes them one command away. LockIn's FamilyControls entitlement is already covered by the `*.entitlements` protected path in the Xcode profile.

---

## G-D11 — Phase A branch is amended, not merged then reworked

`chore/codex-workflow` (`4b6bbc8`) hasn't merged. G3 turns it into "ruwaizrazak consumes the global toolkit" before merge, so `main` never contains the repo-local scripts it would delete a day later.

---

## Open questions for the user (block G2 / G4)

1. Approve changing `~/.claude/CLAUDE.md` and `~/.codex/AGENTS.md` (G2)?
2. Approve G-D6: a stop halts the whole phase everywhere, and QuoteIt keeps committing to `main`?
3. Approve G4.2: replace QuoteIt's untracked `AGENTS.md` (the corrupted copy) with the canonical content moved from `CLAUDE.md`?
