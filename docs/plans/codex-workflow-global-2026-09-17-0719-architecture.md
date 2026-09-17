# Codex workflow, global — architecture

Companion to `codex-workflow-global-2026-09-17-0719-plan.md`. This file covers the structure that changes when the workflow leaves `ruwaizrazak`. The per-phase mechanics (report schema, prompt contracts, the verdict vocabulary, failure modes) are unchanged and documented in `codex-execution-workflow-2026-09-17-0655-architecture.md` §4–§10.

---

## 1. Three layers

```
┌───────────────────────────────── machine-wide ─────────────────────────────────┐
│ ~/.agents/codex-workflow/   (git repo — the toolkit)                            │
│   contracts/executor.md ──install-contracts──▶ ~/.codex/AGENTS.md  (physical)   │
│   contracts/*.md ◀──────────────@import────── ~/.claude/CLAUDE.md               │
│   bin/ run-codex check-scope render-prompt onboard install-contracts            │
│   schema/ prompts/ templates/ profiles/{astro,xcode}.sh  tests/selftest.sh      │
│   docs/plans/  (design history of the toolkit itself)                           │
└────────────────────────────────────────────────────────────────────────────────┘
            │ onboard <repo> <stack>  (copies once; project owns the copy)
            ▼
┌──────────────────────────────── per project ───────────────────────────────────┐
│ .agents/profile.sh        checks, protected paths, scan rules, branch policy    │
│ AGENTS.md                 project rules + Plan Drift Lessons (canonical)        │
│ CLAUDE.md                 short header + @AGENTS.md                             │
│ <PLAN_DIR>/<base>-{plan,decisions,architecture,runlog}.md                       │
│ .agent-runs/<base>/       raw prompts, events, reports (gitignored)             │
└────────────────────────────────────────────────────────────────────────────────┘
```

**What each agent reads**

| File | Codex | Claude | Loaded how |
|---|---|---|---|
| `~/.codex/AGENTS.md` (Planning + executor contract) | ✅ | — | Codex auto-load, including under `--ignore-user-config` (verified) |
| `~/.claude/CLAUDE.md` → both contracts | — | ✅ | Claude `@~/…` imports |
| `<repo>/AGENTS.md` | ✅ | ✅ (via `@AGENTS.md`) | auto-load / import |
| `.agents/profile.sh` | ❌ never directly | ❌ never directly | sourced by the scripts; its checks reach Codex through the rendered prompt |
| plan trio | ✅ (told to read it in the prompt) | ✅ author | — |

Codex never reads the profile, so it can't reinterpret it. It sees only the checks the renderer wrote into its prompt.

---

## 2. The loop, profile-driven

It's the same loop as Phase B, with the stack-specific parts pulled from the profile:

```
B0 plan (Claude)            template has Phase 0 proofs + Manual checks; Claude runs the proofs now
B1 baseline (Claude)        git: branch if BRANCH_POLICY=branch · run CODEX_CHECKS + REVIEWER_CHECKS · record in runlog
B2 read (Codex)             codex-prompt read <base> <N> <S…>  →  codex-run read <base> <N> <rendered>
B3 gate (Claude/user)       clarifications file
B4 implement (Codex)        codex-prompt implement … --clarifications f  →  codex-run implement …
                            Codex runs CODEX_CHECKS (web: build/unit/integrity · xcode: build-for-testing)
B5 review (Claude)          codex-scope <plan> <sha> <S…>  ·  re-run CODEX_CHECKS  ·  run REVIEWER_CHECKS
                            (web: playwright chromium+webkit · xcode: unit tests, UI tests per plan, sim screenshots)
                            ·  Manual checks from the plan (Claude where it can, otherwise listed for the user)
B6 fix (Codex, resume)      codex-prompt fix … --findings f  →  codex-run fix …   (≤2 rounds)
B7 checkpoint (Claude)      commit (branch or main per BRANCH_POLICY); Claude writes the message
B8 close-out (Claude)       drift lessons → project AGENTS.md; template/script gaps → toolkit repo
```

**Invariant added for Xcode:** no `xcodebuild` (or any `REVIEWER_CHECKS`) starts while a `codex-run` is in flight. Claude waits for the background notification; it doesn't run checks in parallel "to save time".

---

## 3. Profile format

A bash file sourced by `lib/profile.sh`, which defines a small declarative API. Each value is a separate function argument, so there's no delimiter parsing, and regexes can contain `|`.

```bash
# .agents/profile.sh — owned by this project; edit freely, commit changes.
PROFILE_STACK=xcode
PROJECT_NAME=QuoteIt
BRANCH_POLICY=main              # main | branch
DEFAULT_BRANCH=main
PLAN_DIR=docs/plans

# Checks Codex runs inside its sandbox. Rendered verbatim into the implement/fix prompt.
codex_check  "<label>" "<command>"
# Checks only the reviewer can run (simulator, browser, ports). Rendered into the runlog template and the
# reviewer section of the prompt so Codex knows they exist and can list relevant tests.
reviewer_check "<label>" "<command>" "<when: always | plan-names-ui | plan-names-e2e>"

# Paths Codex may change only when a step lists them literally (glob-listing is not enough).
protect "<glob>" ...

# Added-line scan. LEVEL = FAIL | WARN. path-globs: space-separated. regex: grep -E.
scan FAIL "<path-globs>" "<regex>" "<message>"

# Failures present before any change; passed to Codex so it does not chase them.
known_baseline_failure "<test id or description>"
```

`lib/profile.sh` checks the profile when loading it: required variables set, `BRANCH_POLICY` valid, every `scan` regex compiles under the local `grep -E` (fail-closed, carried over from Phase A), and at least one `codex_check`.

---

## 4. `profiles/xcode.sh`

`onboard` fills the `@…@` values from `xcodebuild -list` and `xcrun simctl list`.

```bash
PROFILE_STACK=xcode
PROJECT_NAME=@PROJECT@
BRANCH_POLICY=branch            # QuoteIt overrides to main
DEFAULT_BRANCH=main
PLAN_DIR=docs/plans
SCHEME=@SCHEME@
DESTINATION='platform=iOS Simulator,name=@DEVICE@'
XCB=(xcodebuild -project "$PROJECT_NAME.xcodeproj" -scheme "$SCHEME")

# LEARN: Codex's sandbox breaks Swift macro expansion (swift-plugin-server cannot start its own nested
# sandbox → "malformed response"). -disable-sandbox turns off only that inner sandbox; the Codex sandbox
# still applies. The simulator is unreachable in the sandbox, so Codex compiles tests but cannot run them.
codex_check "compile app + tests" \
  "${XCB[*]} -destination 'generic/platform=iOS Simulator' -derivedDataPath \"\$TMPDIR/codex-dd-$PROJECT_NAME\" OTHER_SWIFT_FLAGS='\$(inherited) -disable-sandbox' build-for-testing"

reviewer_check "unit tests" \
  "${XCB[*]} -destination '$DESTINATION' test -only-testing:${PROJECT_NAME}Tests" always
reviewer_check "full suite incl. UI" \
  "${XCB[*]} -destination '$DESTINATION' -parallel-testing-enabled NO test" plan-names-ui
reviewer_check "screens" "iOS Simulator tool: launch, screenshot changed screens" plan-names-ui

protect "*.xcodeproj/project.pbxproj" "*.xcscheme" "*.entitlements" "*Info.plist" "*.xcprivacy" \
        "Package.swift" "Package.resolved" "*.xcconfig"

scan FAIL "*Tests/*.swift *UITests/*.swift" 'XCTSkip'                    "skipped test"
scan FAIL "*Tests/*.swift *UITests/*.swift" '\.disabled\('               "disabled Swift Testing trait"
scan WARN "*Tests/*.swift *UITests/*.swift" 'withKnownIssue|XCTExpectFailure' "expected-failure wrapper — must be justified"
scan WARN "*.swift" 'try!'                                               "force try"
scan WARN "*.swift" 'fatalError\('                                       "fatalError in shipped code"
scan WARN "*.swift" 'nonisolated\(unsafe\)|@preconcurrency'              "concurrency checking suppressed"
scan WARN "*.swift" 'swiftlint:disable'                                  "lint suppressed"
```

**Why `project.pbxproj` is protected, not forbidden.** With synchronized folder groups (all three current projects, `objectVersion = 77`), new files need no pbxproj edit, so a pbxproj change means a target, a build setting, or a membership exception. Each of those is a design decision the plan must make and list literally.

**`*.xcscheme` is protected** because QuoteIt lost its test action twice when schemes were regenerated. A diff to a scheme is never incidental.

**`Localizable.xcstrings` is not protected, but watch it.** Xcode can rewrite string catalogs during a build. If it shows up in `codex-scope` as out-of-allowlist without Codex having listed it, first check whether the build did it before calling it drift. This is a failure-mode row in §8.

---

## 5. `profiles/astro.sh`

It encodes Phase A's hard-coded behaviour exactly (G3 verifies parity).

```bash
PROFILE_STACK=astro
PROJECT_NAME=@PROJECT@
BRANCH_POLICY=branch
DEFAULT_BRANCH=main
PLAN_DIR=docs/plans

codex_check "build"     "npm run build"
codex_check "unit"      "npx vitest run tests/unit"
codex_check "integrity" "npx vitest run tests/integrity"
reviewer_check "e2e (plan's specs)" "npx playwright test <specs> --project=chromium --project=webkit" plan-names-e2e
reviewer_check "visual" "browser pane: desktop + 375px, light + dark" plan-names-ui

protect "package.json" "package-lock.json" "src/content/*"

scan FAIL "tests/* *.spec.ts *.test.ts" '\.(skip|only)\('                "skipped / focused test"
scan FAIL "tests/* *.spec.ts *.test.ts" 'if \(await .*\.count\(\)\)'     "conditional coverage guard"
scan FAIL "*.svelte" 'class:([a-z0-9-]*(:|/|\[|\.)|(bg|text|border|p[xytblrse]?|m[xytblrse]?|w|h|size|min-w|max-w|min-h|max-h|gap|space-[xy]|translate-[xy]|scale|rotate|opacity|z|top|left|right|bottom|inset|rounded|shadow|font|leading|tracking|items|justify|overflow|pointer-events|cursor|duration|delay|ease|animate|grid-cols|col-span|flex|order)-|(hidden|block|inline|flex|grid|contents|sr-only|invisible|visible|transition)[={ ])' \
                                                                         "Tailwind utility in class: directive — use the object form"
scan WARN "*.svelte *.astro" '<style'                                    "<style> block — must qualify under the styling rule"
scan WARN "*.svelte *.astro" 'client:visible'                            "client:visible drops a first interaction"
scan WARN "*.svelte *.astro *.css" '#[0-9a-fA-F]{3,8}\b'                 "raw hex — tokens, never hex"
scan WARN "*" '@ts-ignore|@ts-expect-error|eslint-disable'               "suppressed check"

known_baseline_failure "tests/integrity/seo.test.ts › images › gives content images a descriptive, non-empty alt"
```

Universal protected paths (`AGENTS.md`, `CLAUDE.md`, `$PLAN_DIR/**` except the current plan's own files) are enforced by `check-scope` itself, not by profiles, so no profile can drop them.

---

## 6. Toolkit layout

```
~/.agents/codex-workflow/
  README.md                      runbook (loop §2), stack notes, how to onboard
  contracts/executor.md          → ~/.codex/AGENTS.md between markers
  contracts/orchestrator.md      ← @import from ~/.claude/CLAUDE.md
  bin/run-codex                  → ~/.local/bin/codex-run
  bin/check-scope                → ~/.local/bin/codex-scope
  bin/render-prompt              → ~/.local/bin/codex-prompt
  bin/onboard                    → ~/.local/bin/codex-onboard
  bin/install-contracts          writes the Codex marker block + the ~/.local/bin symlinks; idempotent
  lib/profile.sh                 profile API + validation
  schema/report.schema.json
  prompts/{read,implement,fix}.md
  templates/{plan,runlog}.md
  profiles/{astro,xcode}.sh, profiles/README.md
  tests/selftest.sh              scratch web + Xcode repos; run after any toolkit change
  docs/plans/                    both design trios (canonical copies)
```

Changes to the toolkit go through its own plan/commit history. `selftest.sh` is its gate.

---

## 7. `~/.codex/AGENTS.md` after G2

```markdown
# Global instructions

## Planning
…existing text, unchanged…

<!-- codex-workflow:begin — generated from ~/.agents/codex-workflow/contracts/executor.md; edit there, then run install-contracts -->
## Executing a Claude plan

**Applies only when your prompt names a plan file and step IDs. Otherwise ignore this section.**
…contract…
<!-- codex-workflow:end -->
```

`~/.claude/CLAUDE.md` after G2 keeps its Planning section, followed by:

```markdown
## Codex workflow
@~/.agents/codex-workflow/contracts/orchestrator.md
@~/.agents/codex-workflow/contracts/executor.md
```

---

## 8. New failure modes

| Symptom | Cause | Response |
|---|---|---|
| Codex build fails with `swift-plugin-server produced malformed response` | the profile's `codex_check` lost `-disable-sandbox` | fix the profile; it's a profile bug, not a code finding |
| `Unable to find a device matching the provided destination` inside a Codex report | Codex tried to run tests despite the contract | finding against the contract; results for tests Codex "ran" are void |
| UI tests fail with "Restarting after unexpected exit" | two `xcodebuild` at once (Claude ran a check during a Codex run) | re-run alone before treating it as a regression |
| `Localizable.xcstrings` out-of-allowlist | Xcode's build rewrote the catalog | confirm by rebuilding at the baseline; if the build did it, drop the finding and consider listing the catalog in future plans |
| Scheme missing / "not configured for the test action" | scheme regenerated while Xcode was open during a CLI build | QuoteIt's documented fix; protected-path check catches a committed scheme change |
| `codex-run` refuses on `main` in QuoteIt | profile says `branch` | profile should say `main` (G4.1) |
| Global contract applied to an unrelated Codex session | scope line missing from the marker block | re-run `install-contracts`; AC2.1.2 |
| A toolkit change breaks a project's checks | a profile sourced from the toolkit instead of copied | not possible by construction (G-D3); if it happens, the project is sourcing the wrong file |
